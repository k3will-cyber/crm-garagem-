const express = require('express');
const router = express.Router();
const { authenticateToken: authMiddleware, authorize } = require('../middleware/auth');
const db = require('../models');
const { Op } = require('sequelize');

// ----- Stock-specific routes (must be BEFORE /:id) -----

// Get low stock parts
router.get('/stock/low-stock', authMiddleware, async (req, res) => {
  try {
    const parts = await db.Part.findAll({
      where: {
        stockQuantity: {
          [Op.lt]: db.Sequelize.col('minStockLevel')
        }
      }
    });
    res.json(parts);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Get all stock movements (for admin/manager)
router.get('/stock/movements/all', authMiddleware, authorize('admin', 'manager'), async (req, res) => {
  try {
    const movements = await db.StockMovement.findAll({
      include: [
        { model: db.Part, as: 'part', attributes: ['id', 'name', 'sku'] },
        { model: db.User, as: 'createdByUser', attributes: ['id', 'name'] }
      ],
      order: [['createdAt', 'DESC']],
      limit: 200
    });
    res.json(movements);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// ----- CRUD routes -----

// Get all parts
router.get('/', authMiddleware, async (req, res) => {
  try {
    const parts = await db.Part.findAll();
    res.json(parts);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Get part by ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const part = await db.Part.findByPk(req.params.id);
    if (!part) {
      return res.status(404).json({ msg: 'Part not found' });
    }
    res.json(part);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Create part
router.post('/', authMiddleware, authorize('admin', 'manager'), async (req, res) => {
  const transaction = await db.sequelize.transaction();
  try {
    const { name, sku, description, price, stockQuantity, minStockLevel, supplier } = req.body;
    
    const part = await db.Part.create({
      name,
      sku,
      description,
      price,
      stockQuantity: stockQuantity || 0,
      minStockLevel: minStockLevel || 0,
      supplier
    }, { transaction });

    // Record initial stock movement if quantity > 0
    if (stockQuantity && stockQuantity > 0) {
      await db.StockMovement.create({
        partId: part.id,
        type: 'in',
        quantity: stockQuantity,
        reason: 'purchase',
        notes: 'Initial stock entry',
        createdBy: req.user.user.id
      }, { transaction });
    }

    await transaction.commit();
    res.status(201).json(part);
  } catch (err) {
    await transaction.rollback();
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Update part
router.put('/:id', authMiddleware, authorize('admin', 'manager'), async (req, res) => {
  const transaction = await db.sequelize.transaction();
  try {
    const { name, sku, description, price, stockQuantity, minStockLevel, supplier } = req.body;
    let part = await db.Part.findByPk(req.params.id, { transaction });
    if (!part) {
      await transaction.rollback();
      return res.status(404).json({ msg: 'Part not found' });
    }

    const oldStock = part.stockQuantity;
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (sku !== undefined) updateData.sku = sku;
    if (description !== undefined) updateData.description = description;
    if (price !== undefined) updateData.price = price;
    if (stockQuantity !== undefined) updateData.stockQuantity = stockQuantity;
    if (minStockLevel !== undefined) updateData.minStockLevel = minStockLevel;
    if (supplier !== undefined) updateData.supplier = supplier;

    part = await part.update(updateData, { transaction });

    // Record stock adjustment if quantity changed
    if (stockQuantity !== undefined && stockQuantity !== oldStock) {
      const diff = stockQuantity - oldStock;
      await db.StockMovement.create({
        partId: part.id,
        type: diff > 0 ? 'in' : 'out',
        quantity: Math.abs(diff),
        reason: 'adjustment',
        notes: `Stock adjustment from ${oldStock} to ${stockQuantity}`,
        createdBy: req.user.user.id
      }, { transaction });
    }

    await transaction.commit();
    res.json(part);
  } catch (err) {
    await transaction.rollback();
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Delete part
router.delete('/:id', authMiddleware, authorize('admin'), async (req, res) => {
  try {
    const part = await db.Part.findByPk(req.params.id);
    if (!part) {
      return res.status(404).json({ msg: 'Part not found' });
    }
    await part.destroy();
    res.json({ msg: 'Part removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// ----- Stock operations (per part, after /:id routes) -----

// Get stock movements for a part
router.get('/:id/movements', authMiddleware, async (req, res) => {
  try {
    const part = await db.Part.findByPk(req.params.id);
    if (!part) {
      return res.status(404).json({ msg: 'Part not found' });
    }

    const movements = await db.StockMovement.findAll({
      where: { partId: req.params.id },
      include: [
        { model: db.User, as: 'createdByUser', attributes: ['id', 'name'] }
      ],
      order: [['createdAt', 'DESC']],
      limit: 100
    });

    res.json(movements);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Add stock to a part (purchase/inbound)
router.post('/:id/stock-in', authMiddleware, authorize('admin', 'manager'), async (req, res) => {
  const transaction = await db.sequelize.transaction();
  try {
    const { quantity, notes } = req.body;
    const part = await db.Part.findByPk(req.params.id, { transaction });
    if (!part) {
      await transaction.rollback();
      return res.status(404).json({ msg: 'Part not found' });
    }

    if (!quantity || quantity <= 0) {
      await transaction.rollback();
      return res.status(400).json({ msg: 'Invalid quantity' });
    }

    await part.increment('stockQuantity', { by: quantity, transaction });

    await db.StockMovement.create({
      partId: part.id,
      type: 'in',
      quantity,
      reason: 'purchase',
      notes: notes || 'Stock entry',
      createdBy: req.user.user.id
    }, { transaction });

    await transaction.commit();

    const updatedPart = await db.Part.findByPk(req.params.id);
    res.json(updatedPart);
  } catch (err) {
    await transaction.rollback();
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
