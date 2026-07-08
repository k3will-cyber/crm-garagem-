import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getServiceType, createServiceType, updateServiceType } from '../api/serviceTypes';
import { ArrowLeft, Save } from 'lucide-react';

export default function ServiceTypeForm() {
  const { id } = useParams();
  const isEditing = !!id;
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    description: '',
    basePrice: '',
  });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEditing);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isEditing) {
      const fetch = async () => {
        try {
          const res = await getServiceType(id);
          const t = res.data;
          setForm({
            name: t.name || '',
            description: t.description || '',
            basePrice: t.basePrice || '',
          });
        } catch (err) {
          setError('Erro ao carregar tipo de serviço');
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
        basePrice: form.basePrice ? parseFloat(form.basePrice) : 0,
      };
      if (isEditing) {
        await updateServiceType(id, data);
      } else {
        await createServiceType(data);
      }
      navigate('/service-types');
    } catch (err) {
      setError(err.response?.data?.msg || 'Erro ao salvar tipo de serviço');
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
        <button className="btn btn-secondary" onClick={() => navigate('/service-types')}>
          <ArrowLeft size={18} />
          Voltar
        </button>
        <h2>{isEditing ? 'Editar Tipo de Serviço' : 'Novo Tipo de Serviço'}</h2>
      </div>

      {error && <div className="alert alert-error"><span>{error}</span></div>}

      <div className="form-card">
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="name">Nome *</label>
              <input id="name" name="name" value={form.name} onChange={handleChange} required placeholder="Ex: Troca de óleo" />
            </div>

            <div className="form-group">
              <label htmlFor="basePrice">Preço Base (R$) *</label>
              <input id="basePrice" name="basePrice" type="number" step="0.01" min="0" value={form.basePrice} onChange={handleChange} required placeholder="0,00" />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="description">Descrição</label>
            <textarea id="description" name="description" value={form.description} onChange={handleChange} rows={3} placeholder="Descrição do serviço..." />
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/service-types')}>Cancelar</button>
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
