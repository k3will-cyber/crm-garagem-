const express = require('express');
const router = express.Router();
const db = require('../models');

const statusLabels = {
  'draft': 'Em análise',
  'scheduled': 'Agendado',
  'in-progress': 'Em andamento',
  'completed': 'Concluído',
  'delivered': 'Entregue',
  'cancelled': 'Cancelado'
};

// Public route - Get service order by share token (no auth required)
router.get('/os/:shareToken', async (req, res) => {
  try {
    const serviceOrder = await db.ServiceOrder.findOne({
      where: { shareToken: req.params.shareToken },
      include: [
        { model: db.Client, as: 'client' },
        { model: db.ServiceType, as: 'serviceType' },
        { model: db.ServiceOrderItem, as: 'items', include: [{ model: db.Part, as: 'part' }] },
        { model: db.StatusHistory, as: 'statusHistory', order: [['createdAt', 'DESC']], limit: 50 }
      ]
    });

    if (!serviceOrder) {
      return res.status(404).json({ msg: 'Ordem de serviço não encontrada' });
    }

    // Return only non-sensitive data for the client
    res.json({
      orderNumber: serviceOrder.orderNumber,
      status: serviceOrder.status,
      priority: serviceOrder.priority,
      description: serviceOrder.description,
      scheduledDate: serviceOrder.scheduledDate,
      completionDate: serviceOrder.completionDate,
      totalAmount: serviceOrder.totalAmount,
      notes: serviceOrder.notes,
      createdAt: serviceOrder.createdAt,
      updatedAt: serviceOrder.updatedAt,
      client: serviceOrder.client ? {
        name: serviceOrder.client.name,
        phone: serviceOrder.client.phone,
        email: serviceOrder.client.email
      } : null,
      serviceType: serviceOrder.serviceType ? {
        name: serviceOrder.serviceType.name
      } : null,
      items: serviceOrder.items ? serviceOrder.items.map(item => ({
        part: item.part ? { name: item.part.name } : null,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice
      })) : [],
      statusHistory: serviceOrder.statusHistory ? serviceOrder.statusHistory.map(h => ({
        fromStatus: h.fromStatus,
        toStatus: h.toStatus,
        fromLabel: statusLabels[h.fromStatus] || h.fromStatus,
        toLabel: statusLabels[h.toStatus] || h.toStatus,
        timestamp: h.createdAt,
        notifySent: h.notifySent
      })) : []
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
