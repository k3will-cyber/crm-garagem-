const express = require('express');
const router = express.Router();
const { authenticateToken: authMiddleware, authorize } = require('../middleware/auth');
const { Op, fn, col, literal, Sequelize } = require('sequelize');
const db = require('../models');

/**
 * Helper: database-agnostic month extraction
 * SQLite uses strftime, PostgreSQL uses to_char
 */
function monthCol(dateCol) {
  const dialect = db.sequelize.getDialect();
  if (dialect === 'postgres' || dialect === 'postgresql') {
    return fn('to_char', col(dateCol), 'YYYY-MM');
  }
  return fn('strftime', '%Y-%m', col(dateCol));
}

// ─── Dashboard ─────────────────────────────────────────────────
router.get('/dashboard', authMiddleware, authorize('admin', 'manager'), async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    // ── Run all queries in parallel ──
    const [
      revenueOrders, monthlyRevenue, revenueByService,
      expensesResult, monthlyExpenses, incomeResult,
      pendingCount, overdueCount, totalOS, activeOS,
      parts, totalOSValueResult, recentTransactions, recentOrders,
      expensesByCategory, incomeByCategory
    ] = await Promise.all([
      // Revenue from completed/delivered OS
      db.ServiceOrder.findAll({
        where: { status: { [Op.in]: ['completed', 'delivered'] } },
        attributes: [[fn('COALESCE', fn('SUM', col('totalAmount')), 0), 'total']],
        raw: true
      }),
      // Monthly revenue
      db.ServiceOrder.findAll({
        where: { status: { [Op.in]: ['completed', 'delivered'] } },
        attributes: [
          [monthCol('completionDate'), 'month'],
          [fn('COALESCE', fn('SUM', col('totalAmount')), 0), 'total']
        ],
        group: [monthCol('completionDate')],
        order: [[monthCol('completionDate'), 'ASC']],
        raw: true
      }),
      // Revenue by service type
      db.ServiceOrder.findAll({
        where: { status: { [Op.in]: ['completed', 'delivered'] } },
        include: [{ model: db.ServiceType, as: 'serviceType', attributes: ['name'] }],
        attributes: [
          'serviceTypeId',
          [fn('COALESCE', fn('SUM', col('totalAmount')), 0), 'total'],
          [fn('COUNT', col('id')), 'count']
        ],
        group: ['serviceTypeId', 'serviceType.id', 'serviceType.name'],
        raw: true
      }),
      // Total expenses
      db.FinancialTransaction.findAll({
        where: { type: 'expense', status: { [Op.ne]: 'cancelled' } },
        attributes: [[fn('COALESCE', fn('SUM', col('amount')), 0), 'total']],
        raw: true
      }),
      // Monthly expenses
      db.FinancialTransaction.findAll({
        where: { type: 'expense', status: { [Op.ne]: 'cancelled' } },
        attributes: [
          [monthCol('transactionDate'), 'month'],
          [fn('COALESCE', fn('SUM', col('amount')), 0), 'total']
        ],
        group: [monthCol('transactionDate')],
        order: [[monthCol('transactionDate'), 'ASC']],
        raw: true
      }),
      // Manual income
      db.FinancialTransaction.findAll({
        where: { type: 'income', status: { [Op.ne]: 'cancelled' } },
        attributes: [[fn('COALESCE', fn('SUM', col('amount')), 0), 'total']],
        raw: true
      }),
      // Pending count
      db.FinancialTransaction.count({ where: { status: 'pending' } }),
      // Overdue count
      db.FinancialTransaction.count({
        where: {
          status: { [Op.in]: ['pending', 'paid'] },
          transactionDate: { [Op.lt]: today }
        }
      }),
      // Total OS
      db.ServiceOrder.count(),
      // Active OS
      db.ServiceOrder.count({ where: { status: { [Op.in]: ['in-progress', 'scheduled'] } } }),
      // Parts inventory
      db.Part.findAll({ raw: true }),
      // Total OS value
      db.ServiceOrder.findAll({
        attributes: [[fn('COALESCE', fn('SUM', col('totalAmount')), 0), 'total']],
        raw: true
      }),
      // Recent transactions
      db.FinancialTransaction.findAll({ order: [['createdAt', 'DESC']], limit: 10 }),
      // Recent OS
      db.ServiceOrder.findAll({
        include: [{ model: db.Client, as: 'client', attributes: ['name'] }],
        order: [['createdAt', 'DESC']],
        limit: 5
      }),
      // Expenses by category
      db.FinancialTransaction.findAll({
        where: { type: 'expense', status: { [Op.ne]: 'cancelled' } },
        attributes: [
          'category',
          [fn('COALESCE', fn('SUM', col('amount')), 0), 'total'],
          [fn('COUNT', col('id')), 'count']
        ],
        group: ['category'],
        order: [[literal('total'), 'DESC']],
        raw: true
      }),
      // Income by category
      db.FinancialTransaction.findAll({
        where: { type: 'income', status: { [Op.ne]: 'cancelled' } },
        attributes: [
          'category',
          [fn('COALESCE', fn('SUM', col('amount')), 0), 'total'],
          [fn('COUNT', col('id')), 'count']
        ],
        group: ['category'],
        order: [[literal('total'), 'DESC']],
        raw: true
      })
    ]);

    const totalRevenue = parseFloat(revenueOrders[0]?.total || 0);
    const totalExpenses = parseFloat(expensesResult[0]?.total || 0);
    const totalManualIncome = parseFloat(incomeResult[0]?.total || 0);
    const totalParts = parts.length;
    const inventoryValue = parts.reduce((sum, p) => sum + parseFloat(p.price || 0) * (p.stockQuantity || 0), 0);
    const totalOSValue = parseFloat(totalOSValueResult[0]?.total || 0);

    res.json({
      summary: {
        totalRevenue,
        totalExpenses,
        totalManualIncome,
        profit: totalRevenue + totalManualIncome - totalExpenses,
        inventoryValue,
        totalParts,
        totalOSValue,
        totalOS,
        activeOS,
        pendingCount,
        overdueCount
      },
      monthlyRevenue,
      monthlyExpenses,
      revenueByService: revenueByService.map(r => ({
        serviceTypeId: r.serviceTypeId,
        serviceName: r['serviceType.name'] || `Tipo #${r.serviceTypeId}`,
        total: parseFloat(r.total || 0),
        count: parseInt(r.count || 0)
      })),
      expensesByCategory: expensesByCategory.map(e => ({
        category: e.category,
        total: parseFloat(e.total || 0),
        count: parseInt(e.count || 0)
      })),
      incomeByCategory: incomeByCategory.map(e => ({
        category: e.category,
        total: parseFloat(e.total || 0),
        count: parseInt(e.count || 0)
      })),
      recentTransactions,
      recentOrders: recentOrders.map(o => ({
        id: o.id,
        orderNumber: o.orderNumber,
        client: o.client?.name || '—',
        status: o.status,
        totalAmount: o.totalAmount,
        createdAt: o.createdAt
      }))
    });
  } catch (err) {
    console.error('[Finances] Dashboard error:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// ─── List Transactions with filters ────────────────────────────
router.get('/transactions', authMiddleware, authorize('admin', 'manager'), async (req, res) => {
  try {
    const { type, category, status, startDate, endDate, page = 1, limit = 50 } = req.query;
    const where = {};

    if (type) where.type = type;
    if (category) where.category = category;
    if (status) where.status = status;
    if (startDate || endDate) {
      where.transactionDate = {};
      if (startDate) where.transactionDate[Op.gte] = startDate;
      if (endDate) where.transactionDate[Op.lte] = endDate;
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const { rows, count } = await db.FinancialTransaction.findAndCountAll({
      where,
      order: [['transactionDate', 'DESC'], ['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset
    });

    res.json({ transactions: rows, total: count, page: parseInt(page), totalPages: Math.ceil(count / parseInt(limit)) });
  } catch (err) {
    console.error('[Finances] List error:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// ─── Get Transaction by ID ─────────────────────────────────────
router.get('/transactions/:id', authMiddleware, authorize('admin', 'manager'), async (req, res) => {
  try {
    const t = await db.FinancialTransaction.findByPk(req.params.id);
    if (!t) return res.status(404).json({ msg: 'Transação não encontrada' });
    res.json(t);
  } catch (err) {
    console.error('[Finances] Get error:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// ─── Create Transaction ────────────────────────────────────────
router.post('/transactions', authMiddleware, authorize('admin', 'manager'), async (req, res) => {
  try {
    const { type, category, description, amount, transactionDate, paymentMethod, status, notes } = req.body;

    if (!type || !category || !description || !amount || !transactionDate) {
      return res.status(400).json({ msg: 'Tipo, categoria, descrição, valor e data são obrigatórios' });
    }

    const transaction = await db.FinancialTransaction.create({
      type,
      category,
      description,
      amount: parseFloat(amount),
      transactionDate,
      paymentMethod: paymentMethod || null,
      status: status || (type === 'income' ? 'received' : 'paid'),
      notes: notes || null,
      createdBy: req.user.id
    });

    res.status(201).json(transaction);
  } catch (err) {
    console.error('[Finances] Create error:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// ─── Update Transaction ────────────────────────────────────────
router.put('/transactions/:id', authMiddleware, authorize('admin', 'manager'), async (req, res) => {
  try {
    const t = await db.FinancialTransaction.findByPk(req.params.id);
    if (!t) return res.status(404).json({ msg: 'Transação não encontrada' });

    const { type, category, description, amount, transactionDate, paymentMethod, status, notes } = req.body;
    const updates = {};
    if (type !== undefined) updates.type = type;
    if (category !== undefined) updates.category = category;
    if (description !== undefined) updates.description = description;
    if (amount !== undefined) updates.amount = parseFloat(amount);
    if (transactionDate !== undefined) updates.transactionDate = transactionDate;
    if (paymentMethod !== undefined) updates.paymentMethod = paymentMethod;
    if (status !== undefined) updates.status = status;
    if (notes !== undefined) updates.notes = notes;

    await t.update(updates);
    res.json(t);
  } catch (err) {
    console.error('[Finances] Update error:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// ─── Delete Transaction ────────────────────────────────────────
router.delete('/transactions/:id', authMiddleware, authorize('admin', 'manager'), async (req, res) => {
  try {
    const t = await db.FinancialTransaction.findByPk(req.params.id);
    if (!t) return res.status(404).json({ msg: 'Transação não encontrada' });
    await t.destroy();
    res.json({ msg: 'Transação removida' });
  } catch (err) {
    console.error('[Finances] Delete error:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// ─── Categories ────────────────────────────────────────────────
router.get('/categories', authMiddleware, authorize('admin', 'manager'), async (req, res) => {
  res.json({
    income: ['Serviços', 'Venda de Peças', 'Consultoria', 'Outros'],
    expense: [
      'Aluguel', 'Salários', 'Energia', 'Água', 'Internet', 'Telefone',
      'Material de Escritório', 'Ferramentas', 'Peças para Revenda',
      'Manutenção', 'Marketing', 'Impostos', 'Pró-Labore', 'Combustível',
      'Alimentação', 'Seguros', 'Outros'
    ]
  });
});

module.exports = router;
