import React, { useState, useEffect } from 'react';
import { getDailyDeals, createDailyDeal, updateDailyDeal, deleteDailyDeal } from '../api/dailyDeals';
import {
  Tag, Plus, Search, Edit2, Trash2, AlertCircle, Save, X, Eye, EyeOff,
  Calendar, Percent, DollarSign
} from 'lucide-react';

const DEFAULT_FORM = {
  title: '',
  description: '',
  discountPercentage: '',
  serviceTypeId: '',
  partId: '',
  originalPrice: '',
  discountedPrice: '',
  startDate: '',
  endDate: '',
  isActive: true,
  badgeText: 'Oferta do Dia',
  highlightColor: '#ef4444'
};

export default function DailyDeals() {
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ ...DEFAULT_FORM });

  const fetchDeals = async () => {
    try {
      const res = await getDailyDeals();
      setDeals(res.data);
    } catch (err) {
      console.error('Erro ao carregar ofertas:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDeals(); }, []);

  const today = new Date().toISOString().split('T')[0];

  const isExpired = (deal) => deal.endDate && deal.endDate < today;
  const isUpcoming = (deal) => deal.startDate && deal.startDate > today;
  const isCurrent = (deal) => {
    const s = deal.startDate;
    const e = deal.endDate;
    return (!s || s <= today) && (!e || e >= today);
  };

  const filtered = deals.filter(d =>
    !search || d.title?.toLowerCase().includes(search.toLowerCase()) ||
    d.badgeText?.toLowerCase().includes(search.toLowerCase())
  );

  const handleNew = () => {
    setForm({ ...DEFAULT_FORM });
    setEditing(null);
    setShowForm(true);
  };

  const handleEdit = (deal) => {
    setForm({
      title: deal.title || '',
      description: deal.description || '',
      discountPercentage: deal.discountPercentage || '',
      serviceTypeId: deal.serviceTypeId || '',
      partId: deal.partId || '',
      originalPrice: deal.originalPrice || '',
      discountedPrice: deal.discountedPrice || '',
      startDate: deal.startDate || '',
      endDate: deal.endDate || '',
      isActive: deal.isActive !== false,
      badgeText: deal.badgeText || 'Oferta do Dia',
      highlightColor: deal.highlightColor || '#ef4444'
    });
    setEditing(deal.id);
    setShowForm(true);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
  };

  const handleSave = async () => {
    if (!form.title) return alert('Título é obrigatório');
    setSaving(true);
    try {
      const payload = {
        ...form,
        discountPercentage: form.discountPercentage ? parseFloat(form.discountPercentage) : null,
        originalPrice: form.originalPrice ? parseFloat(form.originalPrice) : null,
        discountedPrice: form.discountedPrice ? parseFloat(form.discountedPrice) : null,
        serviceTypeId: form.serviceTypeId ? parseInt(form.serviceTypeId) : null,
        partId: form.partId ? parseInt(form.partId) : null,
      };

      if (editing) {
        await updateDailyDeal(editing, payload);
      } else {
        await createDailyDeal(payload);
      }
      setShowForm(false);
      setEditing(null);
      await fetchDeals();
    } catch (err) {
      alert(err.response?.data?.msg || 'Erro ao salvar oferta');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteDailyDeal(deleteId);
      setDeleteId(null);
      await fetchDeals();
    } catch (err) {
      alert('Erro ao excluir oferta');
    }
  };

  const handleToggleActive = async (deal) => {
    try {
      await updateDailyDeal(deal.id, { isActive: !deal.isActive });
      await fetchDeals();
    } catch (err) {
      alert('Erro ao alterar status');
    }
  };

  const formatCurrency = (val) =>
    parseFloat(val).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

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
          <h2>Descontos do Dia</h2>
          <p>{deals.length} oferta(s) cadastrada(s)</p>
        </div>
        <button className="btn btn-primary" onClick={handleNew}>
          <Plus size={18} /> Nova Oferta
        </button>
      </div>

      <div className="search-bar">
        <Search size={18} />
        <input
          type="text"
          placeholder="Buscar ofertas..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <Tag size={48} />
          <h3>{search ? 'Nenhuma oferta encontrada' : 'Nenhuma oferta cadastrada'}</h3>
          <p>{search ? 'Tente buscar por outro termo' : 'Clique em "Nova Oferta" para criar descontos do dia'}</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map(deal => {
            const expired = isExpired(deal);
            const upcoming = isUpcoming(deal);
            const active = isCurrent(deal) && deal.isActive;

            return (
              <div
                key={deal.id}
                className="deal-card"
                style={{
                  borderLeft: `4px solid ${active ? deal.highlightColor : 'var(--gray-300)'}`,
                  opacity: expired ? 0.6 : 1
                }}
              >
                <div className="deal-card-header">
                  <div className="deal-card-title-row">
                    {deal.badgeText && (
                      <span className="deal-badge" style={{
                        background: `${deal.highlightColor}20`,
                        color: deal.highlightColor,
                        border: `1px solid ${deal.highlightColor}40`
                      }}>
                        {deal.badgeText}
                      </span>
                    )}
                    <h3>{deal.title}</h3>
                  </div>
                  <div className="deal-card-status">
                    {!deal.isActive && <span className="badge badge-gray">Inativo</span>}
                    {upcoming && <span className="badge badge-blue">Agendado</span>}
                    {expired && <span className="badge badge-red">Expirado</span>}
                    {active && <span className="badge badge-green">Ativo</span>}
                  </div>
                </div>

                {deal.description && (
                  <p className="deal-card-desc">{deal.description}</p>
                )}

                <div className="deal-card-details">
                  {deal.discountPercentage > 0 && (
                    <span className="deal-card-detail">
                      <Percent size={14} /> {deal.discountPercentage}% OFF
                    </span>
                  )}
                  {deal.originalPrice > 0 && (
                    <span className="deal-card-detail">
                      <DollarSign size={14} /> De: {formatCurrency(deal.originalPrice)}
                    </span>
                  )}
                  {deal.discountedPrice > 0 && (
                    <span className="deal-card-detail" style={{ color: 'var(--success)', fontWeight: 600 }}>
                      Por: {formatCurrency(deal.discountedPrice)}
                    </span>
                  )}
                  {deal.startDate && (
                    <span className="deal-card-detail">
                      <Calendar size={14} /> {new Date(deal.startDate).toLocaleDateString('pt-BR')}
                      {deal.endDate && ` → ${new Date(deal.endDate).toLocaleDateString('pt-BR')}`}
                    </span>
                  )}
                </div>

                <div className="deal-card-actions">
                  <button
                    className="btn-icon"
                    title={deal.isActive ? 'Desativar' : 'Ativar'}
                    onClick={() => handleToggleActive(deal)}
                  >
                    {deal.isActive ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                  <button className="btn-icon" title="Editar" onClick={() => handleEdit(deal)}>
                    <Edit2 size={16} />
                  </button>
                  <button
                    className="btn-icon btn-icon-danger"
                    title="Excluir"
                    onClick={() => setDeleteId(deal.id)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => { if (!saving) setShowForm(false); }}>
          <div className="modal modal-lg" style={{ maxWidth: 600 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <Tag size={24} style={{ color: 'var(--primary)' }} />
              <h3>{editing ? 'Editar Oferta' : 'Nova Oferta'}</h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="form-group">
                <label>Título *</label>
                <input name="title" value={form.title} onChange={handleChange} placeholder="Ex: Troca de Óleo com 20% OFF" />
              </div>

              <div className="form-group">
                <label>Descrição</label>
                <textarea name="description" value={form.description} onChange={handleChange} rows={2} placeholder="Descreva a oferta..." />
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label>Desconto (%)</label>
                  <input name="discountPercentage" type="number" step="0.01" min="0" max="100"
                    value={form.discountPercentage} onChange={handleChange} placeholder="20" />
                </div>
                <div className="form-group">
                  <label>Texto do Badge</label>
                  <input name="badgeText" value={form.badgeText} onChange={handleChange} placeholder="Oferta do Dia" />
                </div>
                <div className="form-group">
                  <label>Cor do Destaque</label>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input type="color" name="highlightColor" value={form.highlightColor} onChange={handleChange}
                      style={{ width: 48, height: 40, padding: 2, cursor: 'pointer' }} />
                    <span style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>{form.highlightColor}</span>
                  </div>
                </div>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label>Preço Original (R$)</label>
                  <input name="originalPrice" type="number" step="0.01" min="0"
                    value={form.originalPrice} onChange={handleChange} placeholder="100.00" />
                </div>
                <div className="form-group">
                  <label>Preço com Desconto (R$)</label>
                  <input name="discountedPrice" type="number" step="0.01" min="0"
                    value={form.discountedPrice} onChange={handleChange} placeholder="79.90" />
                </div>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label>Data Início</label>
                  <input name="startDate" type="date" value={form.startDate} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>Data Fim</label>
                  <input name="endDate" type="date" value={form.endDate} onChange={handleChange} />
                </div>
              </div>

              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input type="checkbox" name="isActive" checked={form.isActive} onChange={handleChange}
                  style={{ width: 18, height: 18 }} />
                <label style={{ margin: 0 }}>Oferta ativa</label>
              </div>
            </div>

            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowForm(false)}>
                Cancelar
              </button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                <Save size={18} /> {saving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteId && (
        <div className="modal-overlay" onClick={() => setDeleteId(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <AlertCircle size={24} className="text-danger" />
              <h3>Confirmar exclusão</h3>
            </div>
            <p>Tem certeza que deseja excluir esta oferta?</p>
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
