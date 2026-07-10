const express = require('express');
const router = express.Router();
const { authenticateToken: authMiddleware, authorize } = require('../middleware/auth');
const { MeecProduct } = require('../models');

const CATEGORIES = [
  'oleo', 'filtro', 'freio', 'ignicao', 'iluminacao',
  'correia', 'bateria', 'suspensao', 'arrefecimento',
  'diversos', 'kit', 'motor', 'cambio', 'direcao', 'geral', 'servico'
];

// Get all products
router.get('/', authMiddleware, async (req, res) => {
  try {
    const products = await MeecProduct.findAll({
      order: [
        ['categoria', 'ASC'],
        ['nome', 'ASC']
      ]
    });
    res.json(products);
  } catch (err) {
    console.error('[MEEC Stock] Error fetching products:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Get product by ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const product = await MeecProduct.findByPk(req.params.id);
    if (!product) return res.status(404).json({ msg: 'Produto não encontrado' });
    res.json(product);
  } catch (err) {
    console.error('[MEEC Stock] Error fetching product:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Create product
router.post('/', authMiddleware, authorize('admin', 'manager'), async (req, res) => {
  try {
    const { nome, descricao, preco, categoria, quantidade, ativo } = req.body;
    if (!nome || nome.trim() === '') {
      return res.status(400).json({ msg: 'Nome é obrigatório' });
    }

    const newProduct = await MeecProduct.create({
      nome: nome.trim(),
      descricao: descricao || '',
      preco: preco || 0,
      categoria: categoria || 'geral',
      quantidade: quantidade != null ? quantidade : 0,
      ativo: ativo != null ? ativo : 1
    });

    console.log(`[MEEC Stock] Produto "${nome}" criado no estoque`);
    res.status(201).json(newProduct);
  } catch (err) {
    console.error('[MEEC Stock] Error creating product:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Update product
router.put('/:id', authMiddleware, authorize('admin', 'manager'), async (req, res) => {
  try {
    const product = await MeecProduct.findByPk(req.params.id);
    if (!product) return res.status(404).json({ msg: 'Produto não encontrado' });

    const { nome, descricao, preco, categoria, quantidade, ativo } = req.body;
    const updates = {};
    if (nome !== undefined) updates.nome = nome.trim();
    if (descricao !== undefined) updates.descricao = descricao;
    if (preco !== undefined) updates.preco = preco;
    if (categoria !== undefined) updates.categoria = categoria;
    if (quantidade !== undefined) updates.quantidade = quantidade;
    if (ativo !== undefined) updates.ativo = ativo;

    await product.update(updates);
    console.log(`[MEEC Stock] Produto #${req.params.id} atualizado`);
    res.json(product);
  } catch (err) {
    console.error('[MEEC Stock] Error updating product:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Delete product
router.delete('/:id', authMiddleware, authorize('admin'), async (req, res) => {
  try {
    const product = await MeecProduct.findByPk(req.params.id);
    if (!product) return res.status(404).json({ msg: 'Produto não encontrado' });

    await product.destroy();
    console.log(`[MEEC Stock] Produto #${req.params.id} removido`);
    res.json({ msg: 'Produto removido do estoque' });
  } catch (err) {
    console.error('[MEEC Stock] Error deleting product:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Get categories
router.get('/meta/categorias', authMiddleware, async (req, res) => {
  try {
    const categories = await MeecProduct.findAll({
      attributes: ['categoria'],
      group: ['categoria'],
      order: [['categoria', 'ASC']],
      raw: true
    });
    res.json(categories.map(c => c.categoria));
  } catch (err) {
    console.error('[MEEC Stock] Error fetching categories:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Get summary/stats
router.get('/meta/summary', authMiddleware, async (req, res) => {
  try {
    const total = await MeecProduct.count();
    const ativos = await MeecProduct.count({ where: { ativo: 1 } });

    const valorResult = await MeecProduct.findAll({
      attributes: [
        [MeecProduct.sequelize.fn('SUM', MeecProduct.sequelize.literal('preco * quantidade')), 'valor']
      ],
      raw: true
    });
    const valorEstoque = parseFloat(valorResult[0]?.valor) || 0;

    const categorias = await MeecProduct.findAll({
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
      ativos,
      valorEstoque,
      categorias: categorias.map(c => ({
        categoria: c.categoria,
        count: parseInt(c.count),
        totalQty: parseInt(c.totalQty) || 0
      }))
    });
  } catch (err) {
    console.error('[MEEC Stock] Error fetching summary:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
