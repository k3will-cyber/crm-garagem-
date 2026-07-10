const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../models');
require('dotenv').config();

const statusLabels = {
  'draft': 'Em análise',
  'scheduled': 'Agendado',
  'in-progress': 'Em andamento',
  'completed': 'Concluído',
  'delivered': 'Entregue',
  'cancelled': 'Cancelado'
};

// Middleware for client JWT auth
const authenticateClient = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ msg: 'Token não fornecido' });

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ msg: 'Token inválido ou expirado' });
    if (!decoded.client) return res.status(401).json({ msg: 'Token inválido' });
    req.client = decoded.client;
    next();
  });
};

// ============================================
// Public OS Tracking
// ============================================

// Get service order by share token (no auth required)
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

// ============================================
// Public Services Listing
// ============================================

// Get all service types (public)
router.get('/services', async (req, res) => {
  try {
    const services = await db.ServiceType.findAll();
    res.json(services);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// ============================================
// Public Lead Form
// ============================================

// Create a lead from the public site (no auth required)
router.post('/leads', async (req, res) => {
  try {
    const { name, phone, email, message, serviceType } = req.body;

    if (!name) {
      return res.status(400).json({ msg: 'Nome é obrigatório' });
    }

    const notes = [
      message && `Mensagem: ${message}`,
      serviceType && `Interesse: ${serviceType}`,
      'Fonte: Site Público'
    ].filter(Boolean).join('\n');

    const lead = await db.Lead.create({
      name,
      phone,
      email,
      source: 'website',
      status: 'new',
      notes
    });

    res.status(201).json({
      success: true,
      msg: 'Solicitação recebida com sucesso! Entraremos em contato em breve.',
      leadId: lead.id
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// ============================================
// Client Portal - Auth & Orders
// ============================================

// Client registration
router.post('/client/register', async (req, res) => {
  try {
    const { name, phone, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ msg: 'Nome, email e senha são obrigatórios' });
    }

    if (password.length < 6) {
      return res.status(400).json({ msg: 'Senha deve ter no mínimo 6 caracteres' });
    }

    // Check if email already exists
    const existing = await db.Client.findOne({ where: { email } });
    if (existing) {
      if (existing.password) {
        return res.status(400).json({ msg: 'Este email já possui cadastro. Faça login.' });
      }
      // Existing client without password - just set the password
      const salt = await bcrypt.genSalt(10);
      const hashed = await bcrypt.hash(password, salt);
      await existing.update({ password: hashed });

      const payload = { client: { id: existing.id, name: existing.name, email: existing.email } };
      const token = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '30d' });
      return res.json({ token, client: payload.client });
    }

    // Create new client with password
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);

    const client = await db.Client.create({
      name,
      phone,
      email,
      password: hashed
    });

    const payload = { client: { id: client.id, name: client.name, email: client.email } };
    const token = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '30d' });

    res.status(201).json({ token, client: payload.client });
  } catch (err) {
    console.error(err.message);
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ msg: 'Este email já está cadastrado' });
    }
    res.status(500).send('Server error');
  }
});

// Client login
router.post('/client/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ msg: 'Email e senha são obrigatórios' });
    }

    const client = await db.Client.findOne({ where: { email } });
    if (!client || !client.password) {
      return res.status(400).json({ msg: 'Email ou senha inválidos' });
    }

    const isMatch = await bcrypt.compare(password, client.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Email ou senha inválidos' });
    }

    const payload = { client: { id: client.id, name: client.name, email: client.email } };
    const token = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '30d' });

    res.json({ token, client: payload.client });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Get client profile and orders
router.get('/client/me', authenticateClient, async (req, res) => {
  try {
    const client = await db.Client.findByPk(req.client.id, {
      attributes: ['id', 'name', 'phone', 'email', 'createdAt']
    });
    if (!client) {
      return res.status(404).json({ msg: 'Cliente não encontrado' });
    }

    const orders = await db.ServiceOrder.findAll({
      where: { clientId: client.id },
      include: [
        { model: db.ServiceType, as: 'serviceType' },
        { model: db.ServiceOrderItem, as: 'items', include: [{ model: db.Part, as: 'part' }] }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      client,
      orders: orders.map(o => ({
        id: o.id,
        orderNumber: o.orderNumber,
        status: o.status,
        statusLabel: statusLabels[o.status] || o.status,
        priority: o.priority,
        description: o.description,
        scheduledDate: o.scheduledDate,
        completionDate: o.completionDate,
        totalAmount: o.totalAmount,
        createdAt: o.createdAt,
        updatedAt: o.updatedAt,
        shareToken: o.shareToken,
        serviceType: o.serviceType ? { name: o.serviceType.name } : null,
        items: o.items ? o.items.map(i => ({
          part: i.part ? { name: i.part.name } : null,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          totalPrice: i.totalPrice
        })) : []
      }))
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Get a specific order for the authenticated client
router.get('/client/orders/:id', authenticateClient, async (req, res) => {
  try {
    const order = await db.ServiceOrder.findOne({
      where: { id: req.params.id, clientId: req.client.id },
      include: [
        { model: db.Client, as: 'client' },
        { model: db.ServiceType, as: 'serviceType' },
        { model: db.ServiceOrderItem, as: 'items', include: [{ model: db.Part, as: 'part' }] },
        { model: db.StatusHistory, as: 'statusHistory', order: [['createdAt', 'DESC']] }
      ]
    });

    if (!order) {
      return res.status(404).json({ msg: 'Ordem não encontrada' });
    }

    res.json({
      ...order.toJSON(),
      statusLabel: statusLabels[order.status] || order.status,
      statusHistory: order.statusHistory ? order.statusHistory.map(h => ({
        ...h.toJSON(),
        fromLabel: statusLabels[h.fromStatus] || h.fromStatus,
        toLabel: statusLabels[h.toStatus] || h.toStatus
      })) : []
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// ============================================
// Public MEEC Store - Products Listing
// ============================================

// Get all active MEEC store products (public, no auth)
router.get('/meec-stock', async (req, res) => {
  try {
    const { MeecProduct } = require('../models');
    const products = await MeecProduct.findAll({
      where: { ativo: 1 },
      attributes: ['id', 'nome', 'descricao', 'preco', 'categoria', 'quantidade'],
      order: [
        ['categoria', 'ASC'],
        ['nome', 'ASC']
      ]
    });
    res.json(products);
  } catch (err) {
    console.error('[Public MEEC] Error:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Get MEEC categories (public)
router.get('/meec-stock/meta/categorias', async (req, res) => {
  try {
    const { MeecProduct } = require('../models');
    const categories = await MeecProduct.findAll({
      where: { ativo: 1 },
      attributes: ['categoria'],
      group: ['categoria'],
      order: [['categoria', 'ASC']],
      raw: true
    });
    res.json(categories.map(c => c.categoria));
  } catch (err) {
    console.error('[Public MEEC] Error:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Get MEEC summary (public)
router.get('/meec-stock/meta/summary', async (req, res) => {
  try {
    const { MeecProduct } = require('../models');
    const total = await MeecProduct.count({ where: { ativo: 1 } });

    const valorResult = await MeecProduct.findAll({
      where: { ativo: 1 },
      attributes: [
        [MeecProduct.sequelize.fn('SUM', MeecProduct.sequelize.literal('preco * quantidade')), 'valor']
      ],
      raw: true
    });
    const valorEstoque = parseFloat(valorResult[0]?.valor) || 0;

    const categorias = await MeecProduct.findAll({
      where: { ativo: 1 },
      attributes: [
        'categoria',
        [MeecProduct.sequelize.fn('COUNT', MeecProduct.sequelize.col('id')), 'count'],
        [MeecProduct.sequelize.fn('SUM', MeecProduct.sequelize.col('quantidade')), 'totalQty']
      ],
      group: ['categoria'],
      order: [[MeecProduct.sequelize.literal('count'), 'DESC']],
      raw: true
    });

    res.json({
      total,
      valorEstoque,
      categorias: categorias.map(c => ({
        categoria: c.categoria,
        count: parseInt(c.count),
        totalQty: parseInt(c.totalQty) || 0
      }))
    });
  } catch (err) {
    console.error('[Public MEEC] Error:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
