const express = require('express');
const router = express.Router();
const { authenticateToken: authMiddleware, authorize } = require('../middleware/auth');
const db = require('../models');

// Get all estoque products
router.get('/', authMiddleware, async (req, res) => {
  try {
    const products = await db.sequelize.query(
      'SELECT * FROM estoque ORDER BY categoria, nome',
      { type: db.sequelize.QueryTypes.SELECT }
    );
    res.json(products);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Get product by ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const [product] = await db.sequelize.query(
      'SELECT * FROM estoque WHERE id = ?',
      { replacements: [req.params.id], type: db.sequelize.QueryTypes.SELECT }
    );
    if (!product) return res.status(404).json({ msg: 'Produto não encontrado' });
    res.json(product);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Create product
router.post('/', authMiddleware, authorize('admin', 'manager'), async (req, res) => {
  try {
    const { nome, descricao, preco, categoria, quantidade, ativo } = req.body;
    if (!nome || nome.trim() === '') return res.status(400).json({ msg: 'Nome é obrigatório' });

    const result = await db.sequelize.query(
      `INSERT INTO estoque (nome, descricao, preco, categoria, quantidade, ativo, tenant_id, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 1, datetime('now'))`,
      {
        replacements: [
          nome.trim(),
          descricao || '',
          preco || 0,
          categoria || 'geral',
          quantidade != null ? quantidade : 0,
          ativo != null ? ativo : 1
        ],
        type: db.sequelize.QueryTypes.INSERT
      }
    );

    const [newProduct] = await db.sequelize.query(
      'SELECT * FROM estoque WHERE id = ?',
      { replacements: [result[0]], type: db.sequelize.QueryTypes.SELECT }
    );

    console.log(`[MEEC Stock] Produto "${nome}" criado no estoque`);
    res.status(201).json(newProduct);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Update product
router.put('/:id', authMiddleware, authorize('admin', 'manager'), async (req, res) => {
  try {
    const { nome, descricao, preco, categoria, quantidade, ativo } = req.body;

    const [existing] = await db.sequelize.query(
      'SELECT id FROM estoque WHERE id = ?',
      { replacements: [req.params.id], type: db.sequelize.QueryTypes.SELECT }
    );
    if (!existing) return res.status(404).json({ msg: 'Produto não encontrado' });

    const updates = [];
    const params = [];

    if (nome !== undefined) { updates.push('nome = ?'); params.push(nome.trim()); }
    if (descricao !== undefined) { updates.push('descricao = ?'); params.push(descricao); }
    if (preco !== undefined) { updates.push('preco = ?'); params.push(preco); }
    if (categoria !== undefined) { updates.push('categoria = ?'); params.push(categoria); }
    if (quantidade !== undefined) { updates.push('quantidade = ?'); params.push(quantidade); }
    if (ativo !== undefined) { updates.push('ativo = ?'); params.push(ativo); }

    if (updates.length === 0) return res.status(400).json({ msg: 'Nenhum campo para atualizar' });

    params.push(req.params.id);
    await db.sequelize.query(
      `UPDATE estoque SET ${updates.join(', ')} WHERE id = ?`,
      { replacements: params, type: db.sequelize.QueryTypes.UPDATE }
    );

    const [updated] = await db.sequelize.query(
      'SELECT * FROM estoque WHERE id = ?',
      { replacements: [req.params.id], type: db.sequelize.QueryTypes.SELECT }
    );

    console.log(`[MEEC Stock] Produto #${req.params.id} atualizado`);
    res.json(updated);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Delete product
router.delete('/:id', authMiddleware, authorize('admin'), async (req, res) => {
  try {
    const result = await db.sequelize.query(
      'DELETE FROM estoque WHERE id = ?',
      { replacements: [req.params.id], type: db.sequelize.QueryTypes.DELETE }
    );
    if (result[1] === 0) return res.status(404).json({ msg: 'Produto não encontrado' });
    console.log(`[MEEC Stock] Produto #${req.params.id} removido`);
    res.json({ msg: 'Produto removido do estoque' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Get categories
router.get('/meta/categorias', authMiddleware, async (req, res) => {
  try {
    const categories = await db.sequelize.query(
      "SELECT DISTINCT categoria FROM estoque WHERE categoria IS NOT NULL AND categoria != '' ORDER BY categoria",
      { type: db.sequelize.QueryTypes.SELECT }
    );
    res.json(categories.map(c => c.categoria));
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Get summary/stats
router.get('/meta/summary', authMiddleware, async (req, res) => {
  try {
    const total = await db.sequelize.query(
      'SELECT COUNT(*) as total FROM estoque',
      { type: db.sequelize.QueryTypes.SELECT }
    );
    const active = await db.sequelize.query(
      'SELECT COUNT(*) as total FROM estoque WHERE ativo = 1',
      { type: db.sequelize.QueryTypes.SELECT }
    );
    const valorTotal = await db.sequelize.query(
      'SELECT SUM(preco * quantidade) as valor FROM estoque',
      { type: db.sequelize.QueryTypes.SELECT }
    );
    const categorias = await db.sequelize.query(
      'SELECT categoria, COUNT(*) as count, SUM(quantidade) as totalQty FROM estoque GROUP BY categoria ORDER BY count DESC',
      { type: db.sequelize.QueryTypes.SELECT }
    );

    res.json({
      total: total[0].total,
      ativos: active[0].total,
      valorEstoque: valorTotal[0].valor || 0,
      categorias
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
