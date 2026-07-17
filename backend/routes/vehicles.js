const express = require('express');
const router = express.Router();
const { authenticateToken: authMiddleware, authorize } = require('../middleware/auth');
const db = require('../models');

// Get all vehicles (with optional clientId filter)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const where = {};
    if (req.query.clientId) where.clientId = req.query.clientId;
    const vehicles = await db.Vehicle.findAll({
      where,
      include: [{ model: db.Client, as: 'client', attributes: ['id', 'name', 'phone'] }],
      order: [['createdAt', 'DESC']]
    });
    res.json(vehicles);
  } catch (err) {
    console.error('[Vehicles] Error fetching:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Get vehicle by ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const vehicle = await db.Vehicle.findByPk(req.params.id, {
      include: [{ model: db.Client, as: 'client', attributes: ['id', 'name', 'phone'] }]
    });
    if (!vehicle) return res.status(404).json({ msg: 'Veículo não encontrado' });
    res.json(vehicle);
  } catch (err) {
    console.error('[Vehicles] Error fetching:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Create vehicle
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { clientId, plate, chassis, brand, model, year, color, fuel, currentKm, notes } = req.body;
    if (!clientId) return res.status(400).json({ msg: 'Cliente é obrigatório' });
    if (!brand || !model) return res.status(400).json({ msg: 'Marca e modelo são obrigatórios' });

    const vehicle = await db.Vehicle.create({
      clientId, plate, chassis, brand, model, year, color, fuel, currentKm, notes
    });
    console.log(`[Vehicles] Veículo criado: ${brand} ${model} para cliente #${clientId}`);
    res.status(201).json(vehicle);
  } catch (err) {
    console.error('[Vehicles] Error creating:', err.message);
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ msg: 'Placa já cadastrada' });
    }
    res.status(500).json({ msg: 'Server error' });
  }
});

// Update vehicle
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const vehicle = await db.Vehicle.findByPk(req.params.id);
    if (!vehicle) return res.status(404).json({ msg: 'Veículo não encontrado' });

    const { clientId, plate, chassis, brand, model, year, color, fuel, currentKm, notes } = req.body;
    const updates = {};
    if (clientId !== undefined) updates.clientId = clientId;
    if (plate !== undefined) updates.plate = plate;
    if (chassis !== undefined) updates.chassis = chassis;
    if (brand !== undefined) updates.brand = brand;
    if (model !== undefined) updates.model = model;
    if (year !== undefined) updates.year = year;
    if (color !== undefined) updates.color = color;
    if (fuel !== undefined) updates.fuel = fuel;
    if (currentKm !== undefined) updates.currentKm = currentKm;
    if (notes !== undefined) updates.notes = notes;

    await vehicle.update(updates);
    res.json(vehicle);
  } catch (err) {
    console.error('[Vehicles] Error updating:', err.message);
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ msg: 'Placa já cadastrada' });
    }
    res.status(500).json({ msg: 'Server error' });
  }
});

// Delete vehicle
router.delete('/:id', authMiddleware, authorize('admin', 'manager'), async (req, res) => {
  try {
    const vehicle = await db.Vehicle.findByPk(req.params.id);
    if (!vehicle) return res.status(404).json({ msg: 'Veículo não encontrado' });
    await vehicle.destroy();
    res.json({ msg: 'Veículo removido' });
  } catch (err) {
    console.error('[Vehicles] Error deleting:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
