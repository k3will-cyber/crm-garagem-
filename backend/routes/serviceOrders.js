const express = require('express');
const router = express.Router();
const { authenticateToken: authMiddleware, authorize } = require('../middleware/auth');
const db = require('../models');
const { Op, col } = require('sequelize');
const { sendStatusEmail } = require('../services/notificationService');

// Helper function to generate order number
const generateOrderNumber = () => {
  const date = new Date();
  const year = date.getFullYear().toString().substr(2, 2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 9000 + 1000).toString();
  return `OS-${year}${month}${day}-${random}`;
};

// Get all service orders
router.get('/', authMiddleware, async (req, res) => {
  try {
    const serviceOrders = await db.ServiceOrder.findAll({
      include: [
        { model: db.Client, as: 'client' },
        { model: db.ServiceType, as: 'serviceType' },
        { model: db.ServiceOrderItem, as: 'items', include: [{ model: db.Part, as: 'part' }] },
        { model: db.User, as: 'mechanic', attributes: ['id', 'name'] }
      ],
      order: [['createdAt', 'DESC']]
    });
    res.json(serviceOrders);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Get service order by ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const serviceOrder = await db.ServiceOrder.findByPk(req.params.id, {
      include: [
        { model: db.Client, as: 'client' },
        { model: db.ServiceType, as: 'serviceType' },
        { model: db.ServiceOrderItem, as: 'items', include: [{ model: db.Part, as: 'part' }] },
        { model: db.User, as: 'mechanic', attributes: ['id', 'name'] }
      ]
    });
    if (!serviceOrder) {
      return res.status(404).json({ msg: 'Service order not found' });
    }
    res.json(serviceOrder);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Create service order
router.post('/', authMiddleware, async (req, res) => {
  const transaction = await db.sequelize.transaction();
  try {
    const { clientId, serviceTypeId, description, scheduledDate, priority, notes, items } = req.body;

    // Validate client and service type exist
    const client = await db.Client.findByPk(clientId);
    if (!client) {
      await transaction.rollback();
      return res.status(400).json({ msg: 'Client not found' });
    }

    const serviceType = await db.ServiceType.findByPk(serviceTypeId);
    if (!serviceType) {
      await transaction.rollback();
      return res.status(400).json({ msg: 'Service type not found' });
    }

    // Generate order number
    let orderNumber;
    let isUnique = false;
    while (!isUnique) {
      orderNumber = generateOrderNumber();
      const existing = await db.ServiceOrder.findOne({ where: { orderNumber } }, { transaction });
      isUnique = !existing;
    }

    // Determine mechanic (current user if technician, or assigned)
    const mechanicId = req.user.user.role === 'technician' ? req.user.user.id : (req.body.mechanicId || null);

    // Create service order
    const serviceOrder = await db.ServiceOrder.create(
      {
        orderNumber,
        clientId,
        serviceTypeId,
        description,
        scheduledDate,
        priority,
        notes,
        status: 'draft',
        mechanicId
      },
      { transaction }
    );

    // Create service order items and calculate totals
    let totalAmount = 0;
    if (items && items.length > 0) {
      for (const item of items) {
        const part = await db.Part.findByPk(item.partId, { transaction });
        if (!part) {
          await transaction.rollback();
          return res.status(400).json({ msg: `Part with ID ${item.partId} not found` });
        }

        // Validate stock
        if (part.stockQuantity < item.quantity) {
          await transaction.rollback();
          return res.status(400).json({ msg: `Insufficient stock for part ${part.name}` });
        }

        const unitPrice = item.unitPrice || part.price;
        const totalPrice = unitPrice * item.quantity;
        totalAmount += totalPrice;

        // Create service order item
        await db.ServiceOrderItem.create(
          {
            serviceOrderId: serviceOrder.id,
            partId: item.partId,
            quantity: item.quantity,
            unitPrice,
            totalPrice
          },
          { transaction }
        );

        // Update part stock (optional: do this on completion instead)
        // await part.update({ stockQuantity: part.stockQuantity - item.quantity }, { transaction });
      }
    }

    // Add base service price
    totalAmount += parseFloat(serviceType.basePrice) || 0;

    // Calculate 30% commission for the mechanic
    const commission = totalAmount * 0.30;

    // Update service order with total amount and commission
    await serviceOrder.update({ totalAmount, commission }, { transaction });

    await transaction.commit();

    // Fetch the created service order with relations
    const createdServiceOrder = await db.ServiceOrder.findByPk(serviceOrder.id, {
      include: [
        { model: db.Client, as: 'client' },
        { model: db.ServiceType, as: 'serviceType' },
        { model: db.ServiceOrderItem, as: 'items', include: [{ model: db.Part, as: 'part' }] },
        { model: db.User, as: 'mechanic', attributes: ['id', 'name'] }
      ]
    });

    res.status(201).json(createdServiceOrder);
  } catch (err) {
    await transaction.rollback();
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Update service order
router.put('/:id', authMiddleware, async (req, res) => {
  const transaction = await db.sequelize.transaction();
  try {
    const serviceOrder = await db.ServiceOrder.findByPk(req.params.id, { transaction });
    if (!serviceOrder) {
      await transaction.rollback();
      return res.status(404).json({ msg: 'Service order not found' });
    }

    const { clientId, serviceTypeId, description, scheduledDate, priority, notes, status, items } = req.body;

    // Validate client and service type if provided
    if (clientId) {
      const client = await db.Client.findByPk(clientId, { transaction });
      if (!client) {
        await transaction.rollback();
        return res.status(400).json({ msg: 'Client not found' });
      }
    }

    if (serviceTypeId) {
      const serviceType = await db.ServiceType.findByPk(serviceTypeId, { transaction });
      if (!serviceType) {
        await transaction.rollback();
        return res.status(400).json({ msg: 'Service type not found' });
      }
    }

    // Update service order fields
    const updateData = {};
    if (clientId) updateData.clientId = clientId;
    if (serviceTypeId) updateData.serviceTypeId = serviceTypeId;
    if (description !== undefined) updateData.description = description;
    if (scheduledDate !== undefined) updateData.scheduledDate = scheduledDate;
    if (priority) updateData.priority = priority;
    if (notes !== undefined) updateData.notes = notes;
    if (status) updateData.status = status;

    // Assign mechanic if not already set
    if (!serviceOrder.mechanicId && req.user.user.role === 'technician') {
      updateData.mechanicId = req.user.user.id;
    }

    await serviceOrder.update(updateData, { transaction });

    // Handle items if provided
    if (items !== undefined) {
      // Delete existing items
      await db.ServiceOrderItem.destroy({
        where: { serviceOrderId: serviceOrder.id },
        transaction
      });

      // Create new items and calculate total
      let totalAmount = 0;
      for (const item of items) {
        const part = await db.Part.findByPk(item.partId, { transaction });
        if (!part) {
          await transaction.rollback();
          return res.status(400).json({ msg: `Part with ID ${item.partId} not found` });
        }

        const unitPrice = item.unitPrice || part.price;
        const totalPrice = unitPrice * item.quantity;
        totalAmount += totalPrice;

        await db.ServiceOrderItem.create(
          {
            serviceOrderId: serviceOrder.id,
            partId: item.partId,
            quantity: item.quantity,
            unitPrice,
            totalPrice
          },
          { transaction }
        );
      }

      // Add base service price
      const serviceType = await db.ServiceType.findByPk(
        serviceTypeId || serviceOrder.serviceTypeId,
        { transaction }
      );
      totalAmount += parseFloat(serviceType.basePrice) || 0;

      // Calculate 30% commission for the mechanic
      const commission = totalAmount * 0.30;

      // Update total amount and commission
      await serviceOrder.update({ totalAmount, commission }, { transaction });
    }

    await transaction.commit();

    // Fetch updated service order with relations
    const updatedServiceOrder = await db.ServiceOrder.findByPk(req.params.id, {
      include: [
        { model: db.Client, as: 'client' },
        { model: db.ServiceType, as: 'serviceType' },
        { model: db.ServiceOrderItem, as: 'items', include: [{ model: db.Part, as: 'part' }] },
        { model: db.User, as: 'mechanic', attributes: ['id', 'name'] }
      ]
    });

    res.json(updatedServiceOrder);
  } catch (err) {
    await transaction.rollback();
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Delete service order
router.delete('/:id', authMiddleware, async (req, res) => {
  const transaction = await db.sequelize.transaction();
  try {
    const serviceOrder = await db.ServiceOrder.findByPk(req.params.id, { transaction });
    if (!serviceOrder) {
      await transaction.rollback();
      return res.status(404).json({ msg: 'Service order not found' });
    }

    // Delete service order items first (due to foreign key)
    await db.ServiceOrderItem.destroy({
      where: { serviceOrderId: serviceOrder.id },
      transaction
    });

    // Delete service order
    await serviceOrder.destroy({ transaction });

    await transaction.commit();
    res.json({ msg: 'Service order deleted' });
  } catch (err) {
    await transaction.rollback();
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Update service order status
router.patch('/:id/status', authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    const serviceOrder = await db.ServiceOrder.findByPk(req.params.id, {
      include: [{ model: db.Client, as: 'client' }]
    });
    if (!serviceOrder) {
      return res.status(404).json({ msg: 'Service order not found' });
    }

    // Validate status transition
    const validStatus = ['draft', 'scheduled', 'in-progress', 'completed', 'delivered', 'cancelled'];
    if (!validStatus.includes(status)) {
      return res.status(400).json({ msg: 'Invalid status' });
    }

    const oldStatus = serviceOrder.status;

    await serviceOrder.update({ status });

    // If completed, set completion date and deduct stock
    if (status === 'completed') {
      await serviceOrder.update({ completionDate: new Date() });
      // Deduct stock for parts used
      const items = await db.ServiceOrderItem.findAll({
        where: { serviceOrderId: serviceOrder.id },
        include: [{ model: db.Part, as: 'part' }]
      });
      for (const item of items) {
        await item.part.increment('stockQuantity', { by: -item.quantity });
        // Record stock movement
        await db.StockMovement.create({
          partId: item.partId,
          type: 'out',
          quantity: item.quantity,
          reason: 'service_order',
          referenceType: 'service_order',
          referenceId: serviceOrder.id,
          notes: `OS ${serviceOrder.orderNumber}`,
          createdBy: req.user.user.id
        });
      }
    }

    // Record status history
    const statusHistory = await db.StatusHistory.create({
      serviceOrderId: serviceOrder.id,
      fromStatus: oldStatus,
      toStatus: status,
      changedBy: req.user.user.id,
      notes: `Status alterado de '${oldStatus}' para '${status}' por ${req.user.user.name}`
    });

    // Send email notification to client if enabled
    const shouldNotify = serviceOrder.notifyClient !== false;
    if (shouldNotify && oldStatus !== status) {
      const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      // Fire and forget - don't block the response
      sendStatusEmail(serviceOrder, serviceOrder.client, status, baseUrl).then(sent => {
        if (sent) {
          db.StatusHistory.update(
            { notifySent: true },
            { where: { id: statusHistory.id } }
          ).catch(err => console.error('Failed to update notifySent:', err.message));
        }
      });
    }

    // Return updated order with history
    const updatedOrder = await db.ServiceOrder.findByPk(req.params.id, {
      include: [
        { model: db.Client, as: 'client' },
        { model: db.ServiceType, as: 'serviceType' },
        { model: db.ServiceOrderItem, as: 'items', include: [{ model: db.Part, as: 'part' }] },
        { model: db.StatusHistory, as: 'statusHistory', order: [['createdAt', 'DESC']] }
      ]
    });

    res.json(updatedOrder);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Toggle client notifications
router.patch('/:id/toggle-notifications', authMiddleware, async (req, res) => {
  try {
    const serviceOrder = await db.ServiceOrder.findByPk(req.params.id);
    if (!serviceOrder) {
      return res.status(404).json({ msg: 'Service order not found' });
    }
    await serviceOrder.update({ notifyClient: !serviceOrder.notifyClient });
    res.json({ notifyClient: !serviceOrder.notifyClient });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Get service orders by status
router.get('/status/:status', authMiddleware, async (req, res) => {
  try {
    const serviceOrders = await db.ServiceOrder.findAll({
      where: { status: req.params.status },
      include: [
        { model: db.Client, as: 'client' },
        { model: db.ServiceType, as: 'serviceType' }
      ],
      order: [['createdAt', 'DESC']]
    });
    res.json(serviceOrders);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Regenerate share token
router.patch('/:id/share-token', authMiddleware, async (req, res) => {
  try {
    const crypto = require('crypto');
    const serviceOrder = await db.ServiceOrder.findByPk(req.params.id);
    if (!serviceOrder) {
      return res.status(404).json({ msg: 'Service order not found' });
    }
    const newToken = crypto.randomUUID();
    await serviceOrder.update({ shareToken: newToken });
    res.json({ shareToken: newToken });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Get share link info (requires auth)
router.get('/:id/share-info', authMiddleware, async (req, res) => {
  try {
    const serviceOrder = await db.ServiceOrder.findByPk(req.params.id, {
      attributes: ['id', 'orderNumber', 'shareToken']
    });
    if (!serviceOrder) {
      return res.status(404).json({ msg: 'Service order not found' });
    }
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.json({
      shareToken: serviceOrder.shareToken,
      shareUrl: `${baseUrl}/public/os/${serviceOrder.shareToken}`,
      whatsappUrl: `https://wa.me/?text=${encodeURIComponent(
        `🛠️ *${serviceOrder.orderNumber}*\n\nAcompanhe o status do seu serviço pelo link:\n${baseUrl}/public/os/${serviceOrder.shareToken}`
      )}`
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Get dashboard stats
router.get('/dashboard/stats', authMiddleware, async (req, res) => {
  try {
    const [
      totalLeads,
      newLeads,
      totalClients,
      activeServiceOrders,
      completedServiceOrders,
      lowStockParts,
      totalRevenue,
      wonLeads,
      totalOrders,
      deliveredOrders,
      totalParts,
      totalInventoryValue,
      partsByCategory
    ] = await Promise.all([
      db.Lead.count(),
      db.Lead.count({ where: { status: 'new' } }),
      db.Client.count(),
      db.ServiceOrder.count({ where: { status: { [Op.not]: ['cancelled', 'delivered'] } } }),
      db.ServiceOrder.count({ where: { status: 'completed' } }),
      db.Part.count({ where: { stockQuantity: { [Op.lt]: col('minStockLevel') } } }),
      db.ServiceOrder.sum('totalAmount', { where: { status: { [Op.in]: ['completed', 'delivered'] } } }),
      db.Lead.count({ where: { status: 'won' } }),
      db.ServiceOrder.count(),
      db.ServiceOrder.count({ where: { status: 'delivered' } }),
      db.Part.count(),
      db.Part.findAll().then(parts => 
        parts.reduce((sum, p) => sum + (parseFloat(p.price) * p.stockQuantity), 0)
      ),
      db.Part.findAll({ attributes: ['sku'] }).then(parts => {
        const catMap = {};
        const catLabels = {
          OLE: { label: 'Óleos', icon: '🛢️' },
          FIL: { label: 'Filtros', icon: '🔧' },
          FRE: { label: 'Freios', icon: '🛞' },
          IGN: { label: 'Ignição', icon: '⚡' },
          ILU: { label: 'Iluminação', icon: '💡' },
          COR: { label: 'Correias', icon: '⛓️' },
          BAT: { label: 'Baterias', icon: '🔋' },
          SUS: { label: 'Suspensão', icon: '🏎️' },
          REF: { label: 'Arrefecimento', icon: '🌡️' },
          DIV: { label: 'Diversos', icon: '🧰' }
        };
        parts.forEach(p => {
          const cat = p.sku ? p.sku.split('-')[0] : 'OUTROS';
          catMap[cat] = (catMap[cat] || 0) + 1;
        });
        return Object.entries(catMap).map(([code, count]) => ({
          code,
          label: catLabels[code]?.label || code,
          icon: catLabels[code]?.icon || '📦',
          count
        })).sort((a, b) => b.count - a.count);
      })
    ]);

    res.json({
      totalLeads,
      newLeads,
      wonLeads,
      totalClients,
      activeServiceOrders,
      completedServiceOrders,
      deliveredOrders,
      totalOrders,
      totalRevenue: totalRevenue || 0,
      lowStockParts,
      totalParts,
      totalInventoryValue: totalInventoryValue || 0,
      partsByCategory
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Get monthly revenue for dashboard charts
router.get('/dashboard/revenue', authMiddleware, async (req, res) => {
  try {
    const orders = await db.ServiceOrder.findAll({
      where: {
        status: { [Op.in]: ['completed', 'delivered'] },
        completionDate: { [Op.ne]: null }
      },
      attributes: ['totalAmount', 'completionDate'],
      order: [['completionDate', 'ASC']]
    });

    // Aggregate by month
    const monthlyData = {};
    const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

    orders.forEach(order => {
      if (!order.completionDate) return;
      const date = new Date(order.completionDate);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!monthlyData[key]) {
        monthlyData[key] = { month: key, label: monthNames[date.getMonth()], year: date.getFullYear(), revenue: 0, count: 0 };
      }
      monthlyData[key].revenue += parseFloat(order.totalAmount) || 0;
      monthlyData[key].count += 1;
    });

    // Convert to array and get last 12 months
    const result = Object.values(monthlyData).slice(-12);

    // Get status distribution
    const statusCounts = await db.ServiceOrder.findAll({
      attributes: ['status', [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'count']],
      group: ['status']
    });

    const statusLabels = {
      'draft': 'Rascunho',
      'scheduled': 'Agendado',
      'in-progress': 'Em Andamento',
      'completed': 'Concluído',
      'delivered': 'Entregue',
      'cancelled': 'Cancelado'
    };

    const statusDistribution = statusCounts.map(s => ({
      status: s.status,
      label: statusLabels[s.status] || s.status,
      count: parseInt(s.getDataValue('count'))
    }));

    // Get recent activities (last 10)
    const recentServiceOrders = await db.ServiceOrder.findAll({
      include: [{ model: db.Client, as: 'client' }],
      order: [['createdAt', 'DESC']],
      limit: 5
    });

    const recentLeads = await db.Lead.findAll({
      order: [['createdAt', 'DESC']],
      limit: 5
    });

    res.json({
      monthlyRevenue: result,
      statusDistribution,
      recentServiceOrders,
      recentLeads
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;