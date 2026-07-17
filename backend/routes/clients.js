const express = require('express');
const router = express.Router();
const { authenticateToken: authMiddleware, authorize } = require('../middleware/auth');
const db = require('../models');

// Get all clients/leads
router.get('/', authMiddleware, async (req, res) => {
  try {
    const clients = await db.Client.findAll();
    res.json(clients);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Get client by ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const client = await db.Client.findByPk(req.params.id);
    if (!client) {
      return res.status(404).json({ msg: 'Client not found' });
    }
    res.json(client);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Create client
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, phone, email, address, status, source, notes, cpfCnpj, whatsapp, birthDate } = req.body;
    const client = await db.Client.create({
      name,
      phone,
      email,
      address,
      status,
      source,
      notes,
      cpfCnpj,
      whatsapp,
      birthDate
    });
    res.status(201).json(client);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Update client
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { name, phone, email, address, status, source, notes, cpfCnpj, whatsapp, birthDate } = req.body;
    let client = await db.Client.findByPk(req.params.id);
    if (!client) {
      return res.status(404).json({ msg: 'Client not found' });
    }
    client = await client.update({
      name,
      phone,
      email,
      address,
      status,
      source,
      notes,
      cpfCnpj,
      whatsapp,
      birthDate
    });
    res.json(client);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Delete client
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const client = await db.Client.findByPk(req.params.id);
    if (!client) {
      return res.status(404).json({ msg: 'Client not found' });
    }
    await client.destroy();
    res.json({ msg: 'Client removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Get leads (clients with status lead or prospect)
router.get('/status/lead', authMiddleware, async (req, res) => {
  try {
    const leads = await db.Client.findAll({
      where: {
        status: ['lead', 'prospect']
      }
    });
    res.json(leads);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Merge clients: receives array of IDs, merges into the first one
router.post('/merge', authMiddleware, authorize('admin'), async (req, res) => {
  try {
    const { ids, mergedBy } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length < 2) {
      return res.status(400).json({ msg: 'É necessário informar pelo menos 2 IDs' });
    }

    const primaryId = ids[0];
    const mergeIds = ids.slice(1);

    const primary = await db.Client.findByPk(primaryId);
    if (!primary) return res.status(404).json({ msg: 'Cliente principal não encontrado' });

    const toMerge = await db.Client.findAll({ where: { id: mergeIds } });
    if (toMerge.length === 0) return res.status(404).json({ msg: 'Nenhum cliente para merge encontrado' });

    // Update all ServiceOrders from merged clients to point to primary
    await db.ServiceOrder.update(
      { clientId: primaryId },
      { where: { clientId: mergeIds } }
    );

    // Delete merged clients
    await db.Client.destroy({ where: { id: mergeIds } });

    // Create merge log
    if (db.MergeLog) {
      await db.MergeLog.create({
        primaryId,
        mergedIds: mergeIds,
        source: 'manual',
        mergedBy: mergedBy || null
      });
    }

    console.log(`[Clients] Merged IDs ${mergeIds.join(',')} into #${primaryId}`);
    res.json({
      msg: `${toMerge.length} cliente(s) mergeado(s) com sucesso`,
      primary: primary,
      mergedCount: toMerge.length
    });
  } catch (err) {
    console.error('[Clients] Merge error:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;