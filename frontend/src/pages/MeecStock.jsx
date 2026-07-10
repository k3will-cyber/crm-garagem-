import React, { useState, useEffect, useCallback } from 'react';
import {
  Package, Plus, Search, Edit2, Trash2, AlertCircle,
  DollarSign, Hash, Save, X, Eye, EyeOff, BarChart3
} from 'lucide-react';
import axios from '../api/axios';

const CATEGORY_LABELS = {
  oleo: '🛢️ Óleo', filtro: '🔧 Filtro', freio: '🛞 Freio',
  ignicao: '⚡ Ignição', iluminacao: '💡 Iluminação', correia: '⛓️ Correia',
  bateria: '🔋 Bateria', suspensao: '🏎️ Suspensão', arrefecimento: '🌡️ Arrefecimento',
  diversos: '🧰 Diversos', kit: '📦 Kit', motor: '🔩 Motor',
  cambio: '⚙️ Câmbio', direcao: '🛞 Direção', geral: '📦 Geral', servico: '🔧 Serviço'
};

const CATEGORY_COLORS = {
  oleo: '#FF9F0A', filtro: '#0A84FF', freio: '#30D158', ignicao: '#BF5AF2',
  iluminacao: '#F5C800', correia: '#5AC8FA', bateria: '#30D158',
  suspensao: '#FF9F0A', arrefecimento: '#0A84FF',
  diversos: '#8E8E93', kit: '#FF9F0A', motor: '#FF453A',
  cambio: '#BF5AF2', direcao: '#5AC8FA', geral: '#636366', servico: '#0A84FF'
};

function formatPrice(value) {
  return Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function MeecStock() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [editing, setEditing] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    nome: '', descricao: '', preco: '', categoria: 'geral', quantidade: '', ativo: 1
  });
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [prodRes, catRes, sumRes] = await Promise.all([
        axios.get('/meec-stock'),
        axios.get('/meec-stock/meta/categorias'),
        axios.get('/meec-stock/meta/summary'),
      ]);
      setProducts(prodRes.data);
      setCategories(catRes.data);
      setSummary(sumRes.data);
    } catch (err) {
      console.error('Erro ao carregar estoque:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = products.filter(p => {
    const matchSearch = !search ||
      p.nome?.toLowerCase().includes(search.toLowerCase()) ||
      p.descricao?.toLowerCase().includes(search.toLowerCase()) ||
      p.categoria?.toLowerCase().includes(search.toLowerCase());
    const matchCat = !categoryFilter || p.categoria === categoryFilter;
    return matchSearch && matchCat;
  });

  const handleEdit = (product) => {
    setFormData({
      nome: product.nome || '',
      descricao: product.descricao || '',
      preco: product.preco != null ? String(product.preco) : '',
      categoria: product.categoria || 'geral',
      quantidade: product.quantidade != null ? String(product.quantidade) : '0',
      ativo: product.ativo != null ? product.ativo : 1
    });
    setEditing(product.id);
    setShowForm(true);
  };

  const handleNew = () => {
    setFormData({ nome: '', descricao: '', preco: '', categoria: 'geral', quantidade: '0', ativo: 1 });
    setEditing(null);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!formData.nome.trim()) return alert('Nome é obrigatório');
    setSaving(true);
    try {
      const payload = {
        nome: formData.nome.trim(),
        descricao: formData.descricao,
        preco: parseFloat(formData.preco) || 0,
        categoria: formData.categoria,
        quantidade: parseInt(formData.quantidade) || 0,
        ativo: formData.ativo
      };

      if (editing) {
        await axios.put(`/meec-stock/${editing}`, payload);
      } else {
        await axios.post('/meec-stock', payload);
      }

      setShowForm(false);
      setEditing(null);
      await fetchData();
    } catch (err) {
      console.error('Erro ao salvar:', err);
      alert('Erro ao salvar produto');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`/meec-stock/${deleteId}`);
      setDeleteId(null);
      await fetchData();
    } catch (err) {
      console.error('Erro ao excluir:', err);
      alert('Erro ao excluir produto');
    }
  };

  const toggleActive = async (product) => {
    try {
      await axios.put(`/meec-stock/${product.id}`, { ativo: product.ativo ? 0 : 1 });
      await fetchData();
    } catch (err) {
      console.error('Erro ao alterar status:', err);
    }
  };

  if (loading) {
    return (
      <div className="page-loading">
        <div className="loading-spinner" />
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2>📦 Estoque MEEC</h2>
          <p>
            {summary?.total || 0} produtos · {summary?.ativos || 0} ativos ·
            {summary?.valorEstoque ? ` ${formatPrice(summary.valorEstoque)} em estoque` : ''}
          </p>
        </div>
        <button className="btn btn-primary" onClick={handleNew}>
          <Plus size={18} /> Novo Produto
        </button>
      </div>

      {/* Summary Cards */}
      {summary?.categorias?.length > 0 && (
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
          gap: 8, marginBottom: 20
        }}>
          {summary.categorias.slice(0, 12).map(cat => (
            <div key={cat.categoria} style={{
              padding: '10px 12px', background: 'var(--gray-50)',
              borderRadius: 'var(--radius-md)', fontSize: '0.82rem',
              borderLeft: `3px solid ${CATEGORY_COLORS[cat.categoria] || '#636366'}`
            }}>
              <div style={{ fontWeight: 600, color: 'var(--gray-800)' }}>
                {CATEGORY_LABELS[cat.categoria] || cat.categoria}
              </div>
              <div style={{ color: 'var(--gray-500)', fontSize: '0.75rem' }}>
                {cat.count} itens · {cat.totalQty} unid.
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="search-bar" style={{ flex: 1, minWidth: 200, marginBottom: 0 }}>
          <Search size={18} />
          <input
            type="text" placeholder="Buscar por nome, descrição ou categoria..."
            value={search} onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gray-400)' }}
              onClick={() => setSearch('')}>
              <X size={16} />
            </button>
          )}
        </div>
        <div className="filter-group">
          <Package size={16} />
          <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
            <option value="">Todas categorias</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{CATEGORY_LABELS[cat] || cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Product List */}
      {filtered.length === 0 ? (
        <div className="empty-state">
          <Package size={48} />
          <h3>{search || categoryFilter ? 'Nenhum produto encontrado' : 'Nenhum produto no estoque'}</h3>
          <p>{search || categoryFilter ? 'Tente ajustar os filtros' : 'Clique em "Novo Produto" para adicionar'}</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Produto</th>
                <th>Categoria</th>
                <th>Preço</th>
                <th>Qtd</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(product => {
                const color = CATEGORY_COLORS[product.categoria] || '#636366';
                return (
                  <tr key={product.id} className={!product.ativo ? 'row-warning' : ''}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--gray-800)' }}>
                        {product.nome}
                      </div>
                      {product.descricao && (
                        <div style={{ fontSize: '0.78rem', color: 'var(--gray-500)', marginTop: 2 }}>
                          {product.descricao}
                        </div>
                      )}
                    </td>
                    <td>
                      <span className="badge" style={{
                        background: `${color}20`, color,
                        border: `1px solid ${color}40`
                      }}>
                        {CATEGORY_LABELS[product.categoria] || product.categoria}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600 }}>{formatPrice(product.preco)}</td>
                    <td>
                      <div className="stock-info">
                        <span className={product.quantidade <= 0 ? 'text-danger' : ''}>
                          {product.quantidade}
                        </span>
                        {product.quantidade <= 0 && <AlertCircle size={14} className="text-danger" />}
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${product.ativo ? 'badge-green' : 'badge-gray'}`}>
                        {product.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button className="btn-icon" title="Editar" onClick={() => handleEdit(product)}>
                          <Edit2 size={16} />
                        </button>
                        <button className="btn-icon" title={product.ativo ? 'Desativar' : 'Ativar'}
                          onClick={() => toggleActive(product)}>
                          {product.ativo ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                        <button className="btn-icon btn-icon-danger" title="Excluir"
                          onClick={() => setDeleteId(product.id)}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => { if (!saving) setShowForm(false); }}>
          <div className="modal" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <Package size={24} style={{ color: 'var(--primary)' }} />
              <h3>{editing ? 'Editar Produto' : 'Novo Produto'}</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group">
                <label>Nome *</label>
                <input type="text" value={formData.nome}
                  onChange={e => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Ex: Óleo Motor 5W30 1L" />
              </div>
              <div className="form-group">
                <label>Descrição</label>
                <textarea rows="2" value={formData.descricao}
                  onChange={e => setFormData({ ...formData, descricao: e.target.value })}
                  placeholder="Descrição opcional do produto" />
              </div>
              <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <div className="form-group">
                  <label>Preço (R$)</label>
                  <input type="number" step="0.01" min="0" value={formData.preco}
                    onChange={e => setFormData({ ...formData, preco: e.target.value })}
                    placeholder="0.00" />
                </div>
                <div className="form-group">
                  <label>Quantidade</label>
                  <input type="number" min="0" value={formData.quantidade}
                    onChange={e => setFormData({ ...formData, quantidade: e.target.value })}
                    placeholder="0" />
                </div>
              </div>
              <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <div className="form-group">
                  <label>Categoria</label>
                  <select value={formData.categoria}
                    onChange={e => setFormData({ ...formData, categoria: e.target.value })}>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{CATEGORY_LABELS[cat] || cat}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select value={formData.ativo}
                    onChange={e => setFormData({ ...formData, ativo: parseInt(e.target.value) })}>
                    <option value={1}>Ativo (visível no site)</option>
                    <option value={0}>Inativo (oculto)</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowForm(false)} disabled={saving}>
                Cancelar
              </button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Salvando...' : <><Save size={16} /> {editing ? 'Atualizar' : 'Criar'}</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteId && (
        <div className="modal-overlay" onClick={() => setDeleteId(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <AlertCircle size={24} className="text-danger" />
              <h3>Confirmar exclusão</h3>
            </div>
            <p>Tem certeza que deseja excluir este produto do estoque?</p>
            <p style={{ fontSize: '0.85rem', color: 'var(--gray-500)', marginTop: 8 }}>
              Esta ação não pode ser desfeita.
            </p>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setDeleteId(null)}>Cancelar</button>
              <button className="btn btn-danger" onClick={handleDelete}>Excluir</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
