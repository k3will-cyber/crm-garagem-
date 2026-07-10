const express = require('express');
const router = express.Router();
const { authenticateToken: authMiddleware } = require('../middleware/auth');
const db = require('../models');

// Get all leads
router.get('/', authMiddleware, async (req, res) => {
  try {
    const leads = await db.Lead.findAll({
      order: [['createdAt', 'DESC']]
    });
    res.json(leads);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Get lead by ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const lead = await db.Lead.findByPk(req.params.id);
    if (!lead) {
      return res.status(404).json({ msg: 'Lead not found' });
    }
    res.json(lead);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Create lead
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, phone, email, source, status, estimatedValue, notes } = req.body;
    const lead = await db.Lead.create({
      name,
      phone,
      email,
      source,
      status,
      estimatedValue,
      notes
    });

    // Sync to MEEC leads table (same database, raw SQL)
    try {
      // Check for duplicates before inserting
      const existing = await db.sequelize.query(`
        SELECT id FROM leads WHERE (whatsapp = ? AND whatsapp != '' AND whatsapp IS NOT NULL) OR (email = ? AND email != '' AND email IS NOT NULL) LIMIT 1
      `, {
        replacements: [phone || '', email || ''],
        type: db.sequelize.QueryTypes.SELECT
      });

      if (existing.length === 0) {
        const meecStatusMap = {
          'new': 'lead_qualificado',
          'contacted': 'lead_prospectado',
          'quoted': 'orcamento_ativo',
          'won': 'orcamento_fechado',
          'lost': 'lost'
        };
        const meecStatus = meecStatusMap[status] || 'lead_qualificado';

        await db.sequelize.query(`
          INSERT INTO leads (name, whatsapp, email, message, origem, status, valor, created_at, updated_at, tenant_id)
          VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'), 1)
        `, {
          replacements: [
            name || '',
            phone || '',
            email || '',
            notes || '',
            source || 'crm',
            meecStatus,
            estimatedValue || 0
          ],
          type: db.sequelize.QueryTypes.INSERT
        });

        console.log('[Sync] Lead "' + name + '" synced to MEEC leads');
      }
    } catch (syncError) {
      console.error('[Sync] Failed to sync lead to MEEC:', syncError.message);
    }

    res.status(201).json(lead);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Update lead
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { name, phone, email, source, status, estimatedValue, notes } = req.body;
    let lead = await db.Lead.findByPk(req.params.id);
    if (!lead) {
      return res.status(404).json({ msg: 'Lead not found' });
    }
    lead = await lead.update({
      name,
      phone,
      email,
      source,
      status,
      estimatedValue,
      notes
    });
    res.json(lead);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Delete lead
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const lead = await db.Lead.findByPk(req.params.id);
    if (!lead) {
      return res.status(404).json({ msg: 'Lead not found' });
    }
    await lead.destroy();
    res.json({ msg: 'Lead deleted' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Convert lead to client
router.post('/:id/convert', authMiddleware, async (req, res) => {
  const transaction = await db.sequelize.transaction();
  try {
    const lead = await db.Lead.findByPk(req.params.id, { transaction });
    if (!lead) {
      await transaction.rollback();
      return res.status(404).json({ msg: 'Lead not found' });
    }

    // Check if client already exists with same email/phone
    let client = await db.Client.findOne({
      where: {
        [db.Sequelize.Op.or]: [
          { email: lead.email },
          { phone: lead.phone }
        ]
      },
      transaction
    });

    if (!client) {
      // Create new client from lead
      client = await db.Client.create(
        {
          name: lead.name,
          phone: lead.phone,
          email: lead.email,
          address: '', // Address not in lead, leave empty
          notes: `Converted from lead on ${new Date().toISOString()}. ${lead.notes || ''}`
        },
        { transaction }
      );
    }

    // Update lead status to 'won' (or maybe have a separate conversion status)
    await lead.update({ status: 'won' }, { transaction });

    await transaction.commit();
    res.json({ client, lead });
  } catch (err) {
    await transaction.rollback();
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Get leads by status
router.get('/status/:status', authMiddleware, async (req, res) => {
  try {
    const leads = await db.Lead.findAll({
      where: { status: req.params.status },
      order: [['createdAt', 'DESC']]
    });
    res.json(leads);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;