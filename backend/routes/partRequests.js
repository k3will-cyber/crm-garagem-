const express = require('express');
const router = express.Router();
const { authenticateToken: authMiddleware, authorize } = require('../middleware/auth');
const db = require('../models');
const { Op } = require('sequelize');
const { emitToManagers, emitToUser } = require('../socket');

// Get all part requests (manager sees all, technician sees own)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const whereClause = {};
    // Technicians can only see their own requests
    if (req.user.user.role === 'technician') {
      whereClause.requestedBy = req.user.user.id;
    }

    const requests = await db.PartRequest.findAll({
      where: whereClause,
      include: [
        { model: db.Part, as: 'part', attributes: ['id', 'name', 'sku', 'price', 'stockQuantity'] },
        { model: db.User, as: 'requester', attributes: ['id', 'name'] },
        { model: db.User, as: 'approver', attributes: ['id', 'name'] },
        { model: db.ServiceOrder, as: 'serviceOrder', attributes: ['id', 'orderNumber'] }
      ],
      order: [['createdAt', 'DESC']]
    });
    res.json(requests);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Get part request by ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const request = await db.PartRequest.findByPk(req.params.id, {
      include: [
        { model: db.Part, as: 'part' },
        { model: db.User, as: 'requester', attributes: ['id', 'name'] },
        { model: db.User, as: 'approver', attributes: ['id', 'name'] },
        { model: db.ServiceOrder, as: 'serviceOrder' }
      ]
    });
    if (!request) return res.status(404).json({ msg: 'Request not found' });

    // Technicians can only see their own requests
    if (req.user.user.role === 'technician' && request.requestedBy !== req.user.user.id) {
      return res.status(403).json({ msg: 'Forbidden' });
    }

    res.json(request);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Create part request (any authenticated user, but mainly technicians)
router.post('/', authMiddleware, async (req, res) => {
  const transaction = await db.sequelize.transaction();
  try {
    const { partId, quantity, serviceOrderId, notes } = req.body;

    const part = await db.Part.findByPk(partId, { transaction });
    if (!part) {
      await transaction.rollback();
      return res.status(404).json({ msg: 'Part not found' });
    }

    if (!quantity || quantity <= 0) {
      await transaction.rollback();
      return res.status(400).json({ msg: 'Invalid quantity' });
    }

    const request = await db.PartRequest.create({
      partId,
      requestedBy: req.user.user.id,
      serviceOrderId: serviceOrderId || null,
      quantity,
      status: 'pending',
      notes
    }, { transaction });

    await transaction.commit();

    const createdRequest = await db.PartRequest.findByPk(request.id, {
      include: [
        { model: db.Part, as: 'part' },
        { model: db.User, as: 'requester', attributes: ['id', 'name', 'role'] },
        { model: db.ServiceOrder, as: 'serviceOrder', attributes: ['id', 'orderNumber'] }
      ]
    });

    // Emit real-time event to managers/admins
    emitToManagers('new-part-request', {
      type: 'new_part_request',
      request: createdRequest,
      message: `${createdRequest.requester?.name || 'Um mecânico'} solicitou ${createdRequest.quantity}x ${createdRequest.part?.name}`,
      timestamp: new Date().toISOString()
    });

    res.status(201).json(createdRequest);
  } catch (err) {
    await transaction.rollback();
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Approve or reject a part request (manager/admin only)
router.patch('/:id/decide', authMiddleware, authorize('admin', 'manager'), async (req, res) => {
  const transaction = await db.sequelize.transaction();
  try {
    const { decision, rejectionReason } = req.body; // decision: 'approved' or 'rejected'

    const request = await db.PartRequest.findByPk(req.params.id, {
      include: [{ model: db.Part, as: 'part' }],
      transaction
    });

    if (!request) {
      await transaction.rollback();
      return res.status(404).json({ msg: 'Request not found' });
    }

    if (request.status !== 'pending') {
      await transaction.rollback();
      return res.status(400).json({ msg: `Request already ${request.status}` });
    }

    if (decision === 'approved') {
      // Check if we have enough stock
      if (request.part.stockQuantity < request.quantity) {
        await transaction.rollback();
        return res.status(400).json({ msg: `Insufficient stock. Available: ${request.part.stockQuantity}, Requested: ${request.quantity}` });
      }

      // Deduct stock
      await request.part.increment('stockQuantity', { by: -request.quantity, transaction });

      // Record stock movement
      await db.StockMovement.create({
        partId: request.partId,
        type: 'out',
        quantity: request.quantity,
        reason: 'part_request',
        referenceType: 'part_request',
        referenceId: request.id,
        notes: `Approved part request by ${req.user.user.name}`,
        createdBy: req.user.user.id
      }, { transaction });

      await request.update({ status: 'fulfilled', approvedBy: req.user.user.id }, { transaction });
    } else if (decision === 'rejected') {
      await request.update({ status: 'rejected', approvedBy: req.user.user.id, rejectionReason }, { transaction });
    } else {
      await transaction.rollback();
      return res.status(400).json({ msg: 'Invalid decision. Use "approved" or "rejected"' });
    }

    await transaction.commit();

    const updatedRequest = await db.PartRequest.findByPk(req.params.id, {
      include: [
        { model: db.Part, as: 'part' },
        { model: db.User, as: 'requester', attributes: ['id', 'name'] },
        { model: db.User, as: 'approver', attributes: ['id', 'name'] }
      ]
    });

    // Emit real-time event to the requester (technician)
    const statusLabel = decision === 'approved' ? 'aprovada' : 'rejeitada';
    emitToUser(request.requestedBy, 'part-request-updated', {
      type: 'part_request_updated',
      request: updatedRequest,
      message: `Sua solicitação de ${updatedRequest.quantity}x ${updatedRequest.part?.name} foi ${statusLabel}${decision === 'rejected' && rejectionReason ? `: ${rejectionReason}` : ''}`,
      timestamp: new Date().toISOString()
    });

    // Also notify managers about the decision
    emitToManagers('part-request-decided', {
      type: 'part_request_decided',
      request: updatedRequest,
      message: `Solicitação de ${updatedRequest.quantity}x ${updatedRequest.part?.name} foi ${statusLabel} por ${req.user.user.name}`,
      timestamp: new Date().toISOString()
    });

    res.json(updatedRequest);
  } catch (err) {
    await transaction.rollback();
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Get pending requests count (for badge)
router.get('/count/pending', authMiddleware, authorize('admin', 'manager'), async (req, res) => {
  try {
    const count = await db.PartRequest.count({ where: { status: 'pending' } });
    res.json({ count });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
