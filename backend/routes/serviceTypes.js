const express = require('express');
const router = express.Router();
const { authenticateToken: authMiddleware } = require('../middleware/auth');
const db = require('../models');

// Get all service types
router.get('/', authMiddleware, async (req, res) => {
  try {
    const serviceTypes = await db.ServiceType.findAll();
    res.json(serviceTypes);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Get service type by ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const serviceType = await db.ServiceType.findByPk(req.params.id);
    if (!serviceType) {
      return res.status(404).json({ msg: 'Service type not found' });
    }
    res.json(serviceType);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Create service type
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, description, basePrice, estimatedTime } = req.body;
    const serviceType = await db.ServiceType.create({
      name,
      description,
      basePrice,
      estimatedTime
    });
    res.status(201).json(serviceType);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Update service type
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { name, description, basePrice, estimatedTime } = req.body;
    let serviceType = await db.ServiceType.findByPk(req.params.id);
    if (!serviceType) {
      return res.status(404).json({ msg: 'Service type not found' });
    }
    serviceType = await serviceType.update({
      name,
      description,
      basePrice,
      estimatedTime
    });
    res.json(serviceType);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Delete service type
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const serviceType = await db.ServiceType.findByPk(req.params.id);
    if (!serviceType) {
      return res.status(404).json({ msg: 'Service type not found' });
    }
    await serviceType.destroy();
    res.json({ msg: 'Service type removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;