import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getLead, createLead, updateLead } from '../api/leads';
import { ArrowLeft, Save } from 'lucide-react';

export default function LeadForm() {
  const { id } = useParams();
  const isEditing = !!id;
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    source: '',
    status: 'new',
    estimatedValue: '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEditing);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isEditing) {
      const fetchLead = async () => {
        try {
          const res = await getLead(id);
          const l = res.data;
          setForm({
            name: l.name || '',
            phone: l.phone || '',
            email: l.email || '',
            source: l.source || '',
            status: l.status || 'new',
            estimatedValue: l.estimatedValue || '',
            notes: l.notes || '',
          });
        } catch (err) {
          setError('Erro ao carregar lead');
        } finally {
          setFetching(false);
        }
      };
      fetchLead();
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
        estimatedValue: form.estimatedValue ? parseFloat(form.estimatedValue) : null,
      };
      if (isEditing) {
        await updateLead(id, data);
      } else {
        await createLead(data);
      }
      navigate('/leads');
    } catch (err) {
      setError(err.response?.data?.msg || 'Erro ao salvar lead');
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
        <button className="btn btn-secondary" onClick={() => navigate('/leads')}>
          <ArrowLeft size={18} />
          Voltar
        </button>
        <h2>{isEditing ? 'Editar Lead' : 'Novo Lead'}</h2>
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
                placeholder="Nome do lead"
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
                placeholder="lead@email.com"
              />
            </div>

            <div className="form-group">
              <label htmlFor="source">Origem</label>
              <select id="source" name="source" value={form.source} onChange={handleChange}>
                <option value="">Selecione...</option>
                <option value="facebook">Facebook</option>
                <option value="google">Google</option>
                <option value="indicacao">Indicação</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="instagram">Instagram</option>
                <option value="walk-in">Presencial</option>
                <option value="outro">Outro</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="status">Status</label>
              <select id="status" name="status" value={form.status} onChange={handleChange}>
                <option value="new">Novo</option>
                <option value="contacted">Contatado</option>
                <option value="quoted">Orçado</option>
                <option value="won">Ganho</option>
                <option value="lost">Perdido</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="estimatedValue">Valor Estimado (R$)</label>
              <input
                id="estimatedValue"
                name="estimatedValue"
                type="number"
                step="0.01"
                min="0"
                value={form.estimatedValue}
                onChange={handleChange}
                placeholder="0,00"
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
              placeholder="Observações sobre o lead..."
            />
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/leads')}>
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
