import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getClient, createClient, updateClient } from '../api/clients';
import { ArrowLeft, Save } from 'lucide-react';

export default function ClientForm() {
  const { id } = useParams();
  const isEditing = !!id;
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEditing);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isEditing) {
      const fetchClient = async () => {
        try {
          const res = await getClient(id);
          const c = res.data;
          setForm({
            name: c.name || '',
            phone: c.phone || '',
            email: c.email || '',
            address: c.address || '',
            notes: c.notes || '',
          });
        } catch (err) {
          setError('Erro ao carregar cliente');
        } finally {
          setFetching(false);
        }
      };
      fetchClient();
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
      if (isEditing) {
        await updateClient(id, form);
      } else {
        await createClient(form);
      }
      navigate('/clients');
    } catch (err) {
      setError(err.response?.data?.msg || 'Erro ao salvar cliente');
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
        <button className="btn btn-secondary" onClick={() => navigate('/clients')}>
          <ArrowLeft size={18} />
          Voltar
        </button>
        <h2>{isEditing ? 'Editar Cliente' : 'Novo Cliente'}</h2>
      </div>

      {error && (
        <div className="alert alert-error">
          <span>{error}</span>
        </div>
      )}

      <div className="form-card">
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="name">Nome *</label>
              <input
                id="name"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                placeholder="Nome do cliente"
              />
            </div>

            <div className="form-group">
              <label htmlFor="phone">Telefone</label>
              <input
                id="phone"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="(11) 99999-9999"
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="cliente@email.com"
              />
            </div>

            <div className="form-group">
              <label htmlFor="address">Endereço</label>
              <input
                id="address"
                name="address"
                value={form.address}
                onChange={handleChange}
                placeholder="Endereço completo"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="notes">Observações</label>
            <textarea
              id="notes"
              name="notes"
              value={form.notes}
              onChange={handleChange}
              rows={3}
              placeholder="Observações sobre o cliente..."
            />
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/clients')}>
              Cancelar
            </button>
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
