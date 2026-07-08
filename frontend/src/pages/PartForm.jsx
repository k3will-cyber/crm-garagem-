import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getPart, createPart, updatePart } from '../api/parts';
import { ArrowLeft, Save } from 'lucide-react';

export default function PartForm() {
  const { id } = useParams();
  const isEditing = !!id;
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    sku: '',
    description: '',
    price: '',
    stockQuantity: '0',
    minStockLevel: '0',
    supplier: '',
  });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEditing);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isEditing) {
      const fetch = async () => {
        try {
          const res = await getPart(id);
          const p = res.data;
          setForm({
            name: p.name || '',
            sku: p.sku || '',
            description: p.description || '',
            price: p.price || '',
            stockQuantity: p.stockQuantity ?? '0',
            minStockLevel: p.minStockLevel ?? '0',
            supplier: p.supplier || '',
          });
        } catch (err) {
          setError('Erro ao carregar peça');
        } finally {
          setFetching(false);
        }
      };
      fetch();
    }
  }, [id, isEditing]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = {
        ...form,
        price: form.price ? parseFloat(form.price) : 0,
        stockQuantity: parseInt(form.stockQuantity) || 0,
        minStockLevel: parseInt(form.minStockLevel) || 0,
      };
      if (isEditing) {
        await updatePart(id, data);
      } else {
        await createPart(data);
      }
      navigate('/parts');
    } catch (err) {
      setError(err.response?.data?.msg || 'Erro ao salvar peça');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="page-loading">
        <div className="loading-spinner" />
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <button className="btn btn-secondary" onClick={() => navigate('/parts')}>
          <ArrowLeft size={18} />
          Voltar
        </button>
        <h2>{isEditing ? 'Editar Peça' : 'Nova Peça'}</h2>
      </div>

      {error && <div className="alert alert-error"><span>{error}</span></div>}

      <div className="form-card">
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="name">Nome *</label>
              <input id="name" name="name" value={form.name} onChange={handleChange} required placeholder="Nome da peça" />
            </div>

            <div className="form-group">
              <label htmlFor="sku">SKU</label>
              <input id="sku" name="sku" value={form.sku} onChange={handleChange} placeholder="Código SKU" />
            </div>

            <div className="form-group">
              <label htmlFor="price">Preço (R$) *</label>
              <input id="price" name="price" type="number" step="0.01" min="0" value={form.price} onChange={handleChange} required placeholder="0,00" />
            </div>

            <div className="form-group">
              <label htmlFor="supplier">Fornecedor</label>
              <input id="supplier" name="supplier" value={form.supplier} onChange={handleChange} placeholder="Nome do fornecedor" />
            </div>

            <div className="form-group">
              <label htmlFor="stockQuantity">Quantidade em Estoque</label>
              <input id="stockQuantity" name="stockQuantity" type="number" min="0" value={form.stockQuantity} onChange={handleChange} />
            </div>

            <div className="form-group">
              <label htmlFor="minStockLevel">Estoque Mínimo</label>
              <input id="minStockLevel" name="minStockLevel" type="number" min="0" value={form.minStockLevel} onChange={handleChange} />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="description">Descrição</label>
            <textarea id="description" name="description" value={form.description} onChange={handleChange} rows={3} placeholder="Descrição da peça..." />
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/parts')}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              <Save size={18} />
              {loading ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
