const express = require('express');
const router = express.Router();
const { authenticateToken: authMiddleware } = require('../middleware/auth');
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
    const { name, phone, email, address, status, source, notes } = req.body;
    const client = await db.Client.create({
      name,
      phone,
      email,
      address,
      status,
      source,
      notes
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
    const { name, phone, email, address, status, source, notes } = req.body;
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
      notes
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

module.exports = router;