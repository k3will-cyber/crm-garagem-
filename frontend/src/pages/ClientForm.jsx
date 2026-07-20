import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { getClient, createClient, updateClient } from '../api/clients';
import { ArrowLeft, Save, Car, Plus, ChevronRight } from 'lucide-react';
import { DRIVER_TYPES, DRIVER_TYPE_OPTIONS } from '../constants/driverTypes';

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
    cpfCnpj: '',
    whatsapp: '',
    birthDate: '',
    driverType: 'convencional',
  });

  // CPF/CNPJ mask
  const formatCpfCnpj = (value) => {
    const digits = value.replace(/\D/g, '').slice(0, 14);
    if (digits.length <= 11) {
      return digits.replace(/^(\d{3})(\d{3})(\d{3})(\d{2}).*$/, '$1.$2.$3-$4');
    }
    return digits.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2}).*$/, '$1.$2.$3/$4-$5');
  };

  // Phone mask
  const formatPhone = (value) => {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 10) {
      return digits.replace(/^(\d{2})(\d{4})(\d{4}).*$/, '($1) $2-$3');
    }
    return digits.replace(/^(\d{2})(\d{5})(\d{4}).*$/, '($1) $2-$3');
  };
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEditing);
  const [error, setError] = useState('');
  const [vehicles, setVehicles] = useState([]);

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
            cpfCnpj: c.cpfCnpj || '',
            whatsapp: c.whatsapp || '',
            birthDate: c.birthDate || '',
            driverType: c.driverType || 'convencional',
          });
          setVehicles(c.vehicles || []);
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
    const { name, value } = e.target;
    let masked = value;
    if (name === 'cpfCnpj') masked = formatCpfCnpj(value);
    if (name === 'phone' || name === 'whatsapp') masked = formatPhone(value);
    setForm({ ...form, [name]: masked });
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
              <label htmlFor="cpfCnpj">CPF/CNPJ</label>
              <input
                id="cpfCnpj"
                name="cpfCnpj"
                value={form.cpfCnpj}
                onChange={handleChange}
                placeholder="000.000.000-00"
                maxLength={18}
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
              <label htmlFor="whatsapp">WhatsApp</label>
              <input
                id="whatsapp"
                name="whatsapp"
                value={form.whatsapp}
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
              <label htmlFor="birthDate">Data de Nascimento</label>
              <input
                id="birthDate"
                name="birthDate"
                type="date"
                value={form.birthDate}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="driverType">Tipo de Motorista</label>
              <select
                id="driverType"
                name="driverType"
                value={form.driverType}
                onChange={handleChange}
              >
                {DRIVER_TYPE_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {DRIVER_TYPES[opt.value]?.icon} {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
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

      {/* Vehicles Section - only when editing */}
      {isEditing && (
        <div className="form-card" style={{ marginTop: 20 }}>
          <div className="form-section-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Car size={20} style={{ color: 'var(--primary)' }} />
              <h3>Veículos do Cliente</h3>
              <span className="badge badge-blue" style={{ fontSize: '0.72rem' }}>
                {vehicles.length} veículo(s)
              </span>
            </div>
            <Link
              to="/vehicles"
              className="btn btn-sm btn-secondary"
              style={{ textDecoration: 'none' }}
            >
              <Plus size={14} />
              Gerenciar Veículos
            </Link>
          </div>

          {vehicles.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: '32px 16px',
              color: 'var(--gray-400)', fontSize: '0.875rem'
            }}>
              <Car size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
              <p>Este cliente não possui veículos cadastrados.</p>
              <Link
                to="/vehicles"
                className="btn btn-sm btn-primary"
                style={{ marginTop: 12, display: 'inline-flex', textDecoration: 'none' }}
              >
                <Plus size={14} /> Cadastrar Veículo
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {vehicles.map(v => (
                <div
                  key={v.id}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '12px 16px', gap: 12,
                    background: 'var(--gray-50)', borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--gray-200)',
                    flexWrap: 'wrap'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                    <div style={{
                      width: 36, height: 36,
                      background: 'var(--primary-light)',
                      borderRadius: 'var(--radius-sm)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <Car size={18} style={{ color: 'var(--primary)' }} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--gray-800)' }}>
                        {v.brand} {v.model}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--gray-500)', display: 'flex', gap: 8, marginTop: 1 }}>
                        {v.plate && <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{v.plate}</span>}
                        {v.year && <span>{v.year}</span>}
                        {v.color && <span>{v.color}</span>}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    {v.currentKm > 0 && (
                      <span style={{ fontSize: '0.82rem', color: 'var(--gray-500)', whiteSpace: 'nowrap' }}>
                        {v.currentKm.toLocaleString()} km
                      </span>
                    )}
                    <Link
                      to="/vehicles"
                      className="btn-icon"
                      title="Ver veículos"
                      style={{ flexShrink: 0 }}
                    >
                      <ChevronRight size={16} style={{ color: 'var(--gray-400)' }} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
