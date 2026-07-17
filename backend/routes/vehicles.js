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

/**
 * Helper: resolve client from ownerName (case-insensitive findOrCreate)
 * Returns { id: number, created: boolean }
 */
async function resolveClient(ownerName) {
  const Client = db.Client;
  // Case-insensitive lookup
  let client = await Client.findOne({
    where: db.sequelize.where(
      db.sequelize.fn('LOWER', db.sequelize.col('name')),
      ownerName.trim().toLowerCase()
    )
  });

  if (client) {
    return { id: client.id, created: false };
  }

  // Create new client
  client = await Client.create({
    name: ownerName.trim(),
    notes: 'Cliente criado automaticamente durante cadastro de veículo'
  });
  console.log(`[Vehicles] Novo cliente criado via veículo: ${ownerName} (ID: ${client.id})`);
  return { id: client.id, created: true };
}

// Create vehicle
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { clientId, ownerName, plate, chassis, brand, model, year, color, fuel, currentKm, notes } = req.body;
    if (!brand || !model) return res.status(400).json({ msg: 'Marca e modelo são obrigatórios' });

    // Resolve client: either provided clientId or find/create by ownerName
    let finalClientId;
    if (clientId) {
      finalClientId = clientId;
    } else if (ownerName && ownerName.trim()) {
      const resolved = await resolveClient(ownerName);
      finalClientId = resolved.id;
    } else {
      return res.status(400).json({ msg: 'Selecione um cliente ou digite o nome do proprietário' });
    }

    const vehicle = await db.Vehicle.create({
      clientId: finalClientId, plate, chassis, brand, model, year, color, fuel, currentKm, notes
    });

    // Fetch with client info to return
    const result = await db.Vehicle.findByPk(vehicle.id, {
      include: [{ model: db.Client, as: 'client', attributes: ['id', 'name', 'phone'] }]
    });

    console.log(`[Vehicles] Veículo criado: ${brand} ${model} (cliente #${finalClientId})`);
    res.status(201).json(result);
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

    const { clientId, ownerName, plate, chassis, brand, model, year, color, fuel, currentKm, notes } = req.body;
    const updates = {};

    // Resolve client if ownerName is provided (for updates)
    if (ownerName && ownerName.trim()) {
      const resolved = await resolveClient(ownerName);
      updates.clientId = resolved.id;
    } else if (clientId !== undefined) {
      updates.clientId = clientId;
    }

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

    // Fetch with client info
    const result = await db.Vehicle.findByPk(req.params.id, {
      include: [{ model: db.Client, as: 'client', attributes: ['id', 'name', 'phone'] }]
    });

    res.json(result);
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
