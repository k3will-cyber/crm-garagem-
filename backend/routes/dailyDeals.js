const express = require('express');
const router = express.Router();
const { authenticateToken: authMiddleware, authorize } = require('../middleware/auth');
const db = require('../models');

// Get all daily deals (protected)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const deals = await db.DailyDeal.findAll({
      include: [
        { model: db.ServiceType, as: 'serviceType', attributes: ['id', 'name', 'basePrice'] },
        { model: db.Part, as: 'part', attributes: ['id', 'name', 'price', 'stockQuantity'] }
      ],
      order: [['createdAt', 'DESC']]
    });
    res.json(deals);
  } catch (err) {
    console.error('[DailyDeal] Error fetching:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Get single deal
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const deal = await db.DailyDeal.findByPk(req.params.id, {
      include: [
        { model: db.ServiceType, as: 'serviceType', attributes: ['id', 'name', 'basePrice'] },
        { model: db.Part, as: 'part', attributes: ['id', 'name', 'price', 'stockQuantity'] }
      ]
    });
    if (!deal) return res.status(404).json({ msg: 'Oferta não encontrada' });
    res.json(deal);
  } catch (err) {
    console.error('[DailyDeal] Error fetching:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Create deal
router.post('/', authMiddleware, authorize('admin', 'manager'), async (req, res) => {
  try {
    const {
      title, description, discountPercentage, serviceTypeId, partId,
      originalPrice, discountedPrice, startDate, endDate,
      isActive, badgeText, highlightColor
    } = req.body;

    if (!title) return res.status(400).json({ msg: 'Título é obrigatório' });

    const deal = await db.DailyDeal.create({
      title, description, discountPercentage, serviceTypeId, partId,
      originalPrice, discountedPrice, startDate, endDate,
      isActive: isActive !== undefined ? isActive : true,
      badgeText: badgeText || 'Oferta do Dia',
      highlightColor: highlightColor || '#ef4444'
    });

    const result = await db.DailyDeal.findByPk(deal.id, {
      include: [
        { model: db.ServiceType, as: 'serviceType', attributes: ['id', 'name', 'basePrice'] },
        { model: db.Part, as: 'part', attributes: ['id', 'name', 'price', 'stockQuantity'] }
      ]
    });

    res.status(201).json(result);
  } catch (err) {
    console.error('[DailyDeal] Error creating:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Update deal
router.put('/:id', authMiddleware, authorize('admin', 'manager'), async (req, res) => {
  try {
    const deal = await db.DailyDeal.findByPk(req.params.id);
    if (!deal) return res.status(404).json({ msg: 'Oferta não encontrada' });

    const {
      title, description, discountPercentage, serviceTypeId, partId,
      originalPrice, discountedPrice, startDate, endDate,
      isActive, badgeText, highlightColor
    } = req.body;

    const updates = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (discountPercentage !== undefined) updates.discountPercentage = discountPercentage;
    if (serviceTypeId !== undefined) updates.serviceTypeId = serviceTypeId;
    if (partId !== undefined) updates.partId = partId;
    if (originalPrice !== undefined) updates.originalPrice = originalPrice;
    if (discountedPrice !== undefined) updates.discountedPrice = discountedPrice;
    if (startDate !== undefined) updates.startDate = startDate;
    if (endDate !== undefined) updates.endDate = endDate;
    if (isActive !== undefined) updates.isActive = isActive;
    if (badgeText !== undefined) updates.badgeText = badgeText;
    if (highlightColor !== undefined) updates.highlightColor = highlightColor;

    await deal.update(updates);

    const result = await db.DailyDeal.findByPk(req.params.id, {
      include: [
        { model: db.ServiceType, as: 'serviceType', attributes: ['id', 'name', 'basePrice'] },
        { model: db.Part, as: 'part', attributes: ['id', 'name', 'price', 'stockQuantity'] }
      ]
    });

    res.json(result);
  } catch (err) {
    console.error('[DailyDeal] Error updating:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Delete deal
router.delete('/:id', authMiddleware, authorize('admin', 'manager'), async (req, res) => {
  try {
    const deal = await db.DailyDeal.findByPk(req.params.id);
    if (!deal) return res.status(404).json({ msg: 'Oferta não encontrada' });
    await deal.destroy();
    res.json({ msg: 'Oferta removida' });
  } catch (err) {
    console.error('[DailyDeal] Error deleting:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Public: Get active deals (no auth)
router.get('/public/active', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const deals = await db.DailyDeal.findAll({
      where: {
        isActive: true,
        startDate: { [db.Sequelize.Op.lte]: today },
        endDate: { [db.Sequelize.Op.gte]: today }
      },
      include: [
        { model: db.ServiceType, as: 'serviceType', attributes: ['id', 'name', 'basePrice'] },
        { model: db.Part, as: 'part', attributes: ['id', 'name', 'price', 'stockQuantity'] }
      ],
      order: [['createdAt', 'DESC']]
    });
    res.json(deals);
  } catch (err) {
    console.error('[DailyDeal] Public active error:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
