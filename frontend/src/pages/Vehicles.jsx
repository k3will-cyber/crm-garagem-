import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getVehicles, createVehicle, updateVehicle, deleteVehicle } from '../api/vehicles';
import { getClients } from '../api/clients';
import {
  Car, Plus, Search, Edit2, Trash2, AlertCircle, Save, X, UserPlus, Users
} from 'lucide-react';

const FUEL_LABELS = {
  gasoline: 'Gasolina', ethanol: 'Etanol', diesel: 'Diesel',
  flex: 'Flex', hybrid: 'Híbrido', electric: 'Elétrico', other: 'Outro'
};

export default function Vehicles() {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [clientMode, setClientMode] = useState('select'); // 'select' | 'new'
  const [form, setForm] = useState({
    clientId: '', ownerName: '', plate: '', brand: '', model: '', year: '',
    color: '', fuel: 'flex', currentKm: '', chassis: '', notes: ''
  });
  const [saving, setSaving] = useState(false);
  const ownerInputRef = useRef(null);

  const fetchData = useCallback(async () => {
    try {
      const [vehRes, cliRes] = await Promise.all([
        getVehicles(),
        getClients()
      ]);
      setVehicles(vehRes.data);
      setClients(cliRes.data);
    } catch (err) {
      console.error('Erro ao carregar:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = vehicles.filter(v => {
    const s = search.toLowerCase();
    return !search ||
      v.plate?.toLowerCase().includes(s) ||
      v.brand?.toLowerCase().includes(s) ||
      v.model?.toLowerCase().includes(s) ||
      v.client?.name?.toLowerCase().includes(s);
  });

  const handleEdit = (vehicle) => {
    setForm({
      clientId: vehicle.clientId || '',
      ownerName: vehicle.client?.name || '',
      plate: vehicle.plate || '',
      brand: vehicle.brand || '',
      model: vehicle.model || '',
      year: vehicle.year || '',
      color: vehicle.color || '',
      fuel: vehicle.fuel || 'flex',
      currentKm: vehicle.currentKm || '',
      chassis: vehicle.chassis || '',
      notes: vehicle.notes || ''
    });
    setClientMode('select');
    setEditing(vehicle.id);
    setShowForm(true);
  };

  const handleNew = () => {
    setForm({ clientId: '', ownerName: '', plate: '', brand: '', model: '', year: '', color: '', fuel: 'flex', currentKm: '', chassis: '', notes: '' });
    setEditing(null);
    setClientMode('select');
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.brand || !form.model) return alert('Marca e modelo são obrigatórios');

    // Validate client
    if (clientMode === 'select' && !form.clientId) {
      return alert('Selecione um cliente');
    }
    if (clientMode === 'new' && !form.ownerName?.trim()) {
      return alert('Digite o nome do proprietário');
    }

    setSaving(true);
    try {
      const payload = {
        plate: form.plate,
        brand: form.brand,
        model: form.model,
        year: form.year ? parseInt(form.year) : null,
        color: form.color,
        fuel: form.fuel,
        currentKm: form.currentKm ? parseInt(form.currentKm) : null,
        chassis: form.chassis,
        notes: form.notes
      };

      if (clientMode === 'select') {
        payload.clientId = form.clientId;
      } else {
        payload.ownerName = form.ownerName.trim();
      }

      if (editing) {
        await updateVehicle(editing, payload);
      } else {
        await createVehicle(payload);
      }
      setShowForm(false);
      setEditing(null);
      await fetchData();
    } catch (err) {
      alert(err.response?.data?.msg || 'Erro ao salvar veículo');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteVehicle(deleteId);
      setDeleteId(null);
      await fetchData();
    } catch (err) {
      alert('Erro ao excluir veículo');
    }
  };

/* ─── Searchable Client Select ──────── */
function ClientSearchSelect({ clients, value, onChange }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);

  const selected = clients.find(c => c.id === Number(value));

  const filtered = query
    ? clients.filter(c => {
        const q = query.toLowerCase();
        return c.name?.toLowerCase().includes(q)
          || c.phone?.toLowerCase().includes(q)
          || c.cpfCnpj?.toLowerCase().includes(q);
      })
    : clients;

  // Close on click outside
  useEffect(() => {
    function handleClick(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Close on Escape
  useEffect(() => {
    function handleKey(e) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, []);

  const handleSelect = (clientId) => {
    onChange(clientId);
    setQuery('');
    setOpen(false);
  };

  const handleClear = () => {
    onChange('');
    setQuery('');
  };

  const displayText = selected
    ? `${selected.name}${selected.phone ? ` — ${selected.phone}` : ''}${selected.cpfCnpj ? ` • ${selected.cpfCnpj}` : ''}`
    : 'Buscar cliente...';

  return (
    <div className="form-group" ref={wrapperRef} style={{ position: 'relative' }}>
      <label>Cliente *</label>

      {/* Input trigger */}
      <div
        onClick={() => { setOpen(true); setQuery(''); }}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '10px 14px',
          border: `1.5px solid ${open ? 'var(--primary)' : 'var(--gray-300)'}`,
          borderRadius: 'var(--radius-md)',
          cursor: 'pointer',
          background: 'white',
          transition: 'border-color 150ms ease',
          boxShadow: open ? '0 0 0 3px rgba(37,99,235,0.1)' : 'none'
        }}
      >
        <Users size={16} style={{ color: 'var(--gray-400)', flexShrink: 0 }} />
        <span style={{
          flex: 1, fontSize: '0.9rem',
          color: selected ? 'var(--gray-800)' : 'var(--gray-400)',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
        }}>
          {selected ? displayText : 'Buscar cliente...'}
        </span>
        {selected && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); handleClear(); }}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--gray-400)', padding: 2, display: 'flex',
              borderRadius: 4
            }}
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 300,
          marginTop: 4,
          background: 'white',
          border: '1px solid var(--gray-200)',
          borderRadius: 'var(--radius-md)',
          boxShadow: '0 10px 25px rgba(0,0,0,0.12), 0 4px 10px rgba(0,0,0,0.05)',
          maxHeight: 280, overflow: 'hidden',
          display: 'flex', flexDirection: 'column'
        }}>
          {/* Search input inside dropdown */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 12px',
            borderBottom: '1px solid var(--gray-100)'
          }}>
            <Search size={16} style={{ color: 'var(--gray-400)', flexShrink: 0 }} />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Filtrar por nome, telefone ou CPF..."
              autoFocus
              style={{
                flex: 1, border: 'none', outline: 'none',
                fontSize: '0.85rem', color: 'var(--gray-800)',
                background: 'transparent', fontFamily: 'inherit'
              }}
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--gray-400)', padding: 2, display: 'flex'
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Results list */}
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {filtered.length === 0 ? (
              <div style={{
                padding: '20px 16px', textAlign: 'center',
                color: 'var(--gray-400)', fontSize: '0.85rem'
              }}>
                Nenhum cliente encontrado
              </div>
            ) : (
              filtered.map(c => {
                const isSelected = c.id === Number(value);
                return (
                  <div
                    key={c.id}
                    onClick={() => handleSelect(c.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '10px 14px', cursor: 'pointer',
                      background: isSelected ? 'var(--primary-light)' : 'transparent',
                      borderBottom: '1px solid var(--gray-50)',
                      transition: 'background 100ms ease'
                    }}
                    onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'var(--gray-50)'; }}
                    onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
                  >
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%',
                      background: isSelected ? 'var(--primary)' : 'var(--gray-100)',
                      color: isSelected ? 'white' : 'var(--gray-500)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.78rem', fontWeight: 700, flexShrink: 0
                    }}>
                      {c.name?.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{
                        fontSize: '0.9rem', fontWeight: 500,
                        color: 'var(--gray-800)',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                      }}>
                        {c.name}
                      </div>
                      <div style={{
                        fontSize: '0.75rem', color: 'var(--gray-400)',
                        display: 'flex', gap: 8
                      }}>
                        {c.phone && <span>{c.phone}</span>}
                        {c.cpfCnpj && <span>{c.cpfCnpj}</span>}
                      </div>
                    </div>
                    {isSelected && (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer with count */}
          <div style={{
            padding: '8px 14px',
            borderTop: '1px solid var(--gray-100)',
            fontSize: '0.72rem', color: 'var(--gray-400)',
            display: 'flex', justifyContent: 'space-between'
          }}>
            <span>{filtered.length} cliente(s)</span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--primary)', fontSize: '0.72rem',
                fontFamily: 'inherit', fontWeight: 600
              }}
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

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
          <h2>Veículos</h2>
          <p>{vehicles.length} veículo(s) cadastrado(s)</p>
        </div>
        <button className="btn btn-primary" onClick={handleNew}>
          <Plus size={18} /> Novo Veículo
        </button>
      </div>

      <div className="search-bar">
        <Search size={18} />
        <input
          type="text" placeholder="Buscar por placa, marca, modelo ou cliente..."
          value={search} onChange={e => setSearch(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <Car size={48} />
          <h3>{search ? 'Nenhum veículo encontrado' : 'Nenhum veículo cadastrado'}</h3>
          <p>{search ? 'Tente buscar por outro termo' : 'Clique em "Novo Veículo" para cadastrar'}</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Veículo</th>
                <th>Placa</th>
                <th>Cliente</th>
                <th>Ano</th>
                <th>Combustível</th>
                <th>Km</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(v => (
                <tr key={v.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>
                      <Car size={14} style={{ marginRight: 4 }} />
                      {v.brand} {v.model}
                    </div>
                    {v.color && <div style={{ fontSize: '0.78rem', color: 'var(--gray-500)' }}>{v.color}</div>}
                  </td>
                  <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{v.plate || '—'}</td>
                  <td>{v.client?.name || '—'}</td>
                  <td>{v.year || '—'}</td>
                  <td>{FUEL_LABELS[v.fuel] || v.fuel || '—'}</td>
                  <td>{v.currentKm ? `${v.currentKm.toLocaleString()} km` : '—'}</td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn-icon" title="Editar" onClick={() => handleEdit(v)}>
                        <Edit2 size={16} />
                      </button>
                      <button className="btn-icon btn-icon-danger" title="Excluir"
                        onClick={() => setDeleteId(v.id)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => { if (!saving) setShowForm(false); }}>
          <div className="modal" style={{ maxWidth: 560 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <Car size={24} style={{ color: 'var(--primary)' }} />
              <h3>{editing ? 'Editar Veículo' : 'Novo Veículo'}</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Client mode toggle */}
              {!editing && (
                <div style={{
                  display: 'flex', gap: 8, padding: 4,
                  background: 'var(--gray-100)', borderRadius: 'var(--radius-md)'
                }}>
                  <button
                    type="button"
                    onClick={() => setClientMode('select')}
                    style={{
                      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      padding: '8px 12px', border: 'none', borderRadius: 'var(--radius-sm)',
                      background: clientMode === 'select' ? 'white' : 'transparent',
                      color: clientMode === 'select' ? 'var(--primary)' : 'var(--gray-600)',
                      fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer',
                      boxShadow: clientMode === 'select' ? 'var(--shadow-sm)' : 'none',
                      transition: 'all 150ms ease', fontFamily: 'inherit'
                    }}
                  >
                    <Users size={16} /> Cliente Existente
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setClientMode('new');
                      setTimeout(() => ownerInputRef.current?.focus(), 100);
                    }}
                    style={{
                      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      padding: '8px 12px', border: 'none', borderRadius: 'var(--radius-sm)',
                      background: clientMode === 'new' ? 'white' : 'transparent',
                      color: clientMode === 'new' ? 'var(--primary)' : 'var(--gray-600)',
                      fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer',
                      boxShadow: clientMode === 'new' ? 'var(--shadow-sm)' : 'none',
                      transition: 'all 150ms ease', fontFamily: 'inherit'
                    }}
                  >
                    <UserPlus size={16} /> Novo Cliente
                  </button>
                </div>
              )}

              {/* Client selector with search */}
              {clientMode === 'select' ? (
                <ClientSearchSelect
                  clients={clients}
                  value={form.clientId}
                  onChange={(clientId) => setForm({ ...form, clientId })}
                />
              ) : (
                <div className="form-group">
                  <label>Nome do Proprietário *</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      ref={ownerInputRef}
                      type="text"
                      value={form.ownerName}
                      onChange={e => setForm({ ...form, ownerName: e.target.value })}
                      placeholder="Ex: João Silva"
                      style={{ paddingLeft: 36 }}
                    />
                    <UserPlus size={16} style={{
                      position: 'absolute', left: 12, top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--gray-400)', pointerEvents: 'none'
                    }} />
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--gray-400)', marginTop: 4 }}>
                    Se o cliente não existir, será criado automaticamente.
                  </p>
                </div>
              )}
              <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <div className="form-group">
                  <label>Marca *</label>
                  <input type="text" value={form.brand}
                    onChange={e => setForm({ ...form, brand: e.target.value })}
                    placeholder="Ex: VW, Fiat, Chevrolet" />
                </div>
                <div className="form-group">
                  <label>Modelo *</label>
                  <input type="text" value={form.model}
                    onChange={e => setForm({ ...form, model: e.target.value })}
                    placeholder="Ex: Gol, Onix, Corolla" />
                </div>
              </div>
              <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
                <div className="form-group">
                  <label>Placa</label>
                  <input type="text" value={form.plate}
                    onChange={e => setForm({ ...form, plate: e.target.value.toUpperCase() })}
                    placeholder="ABC1D23" maxLength={7} style={{ fontFamily: 'monospace' }} />
                </div>
                <div className="form-group">
                  <label>Ano</label>
                  <input type="number" min="1960" max="2030" value={form.year}
                    onChange={e => setForm({ ...form, year: e.target.value })}
                    placeholder="2024" />
                </div>
                <div className="form-group">
                  <label>Combustível</label>
                  <select value={form.fuel} onChange={e => setForm({ ...form, fuel: e.target.value })}>
                    {Object.entries(FUEL_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <div className="form-group">
                  <label>Cor</label>
                  <input type="text" value={form.color}
                    onChange={e => setForm({ ...form, color: e.target.value })}
                    placeholder="Ex: Prata, Preto, Vermelho" />
                </div>
                <div className="form-group">
                  <label>Km Atual</label>
                  <input type="number" min="0" value={form.currentKm}
                    onChange={e => setForm({ ...form, currentKm: e.target.value })}
                    placeholder="50000" />
                </div>
              </div>
              <div className="form-group">
                <label>Chassis</label>
                <input type="text" value={form.chassis}
                  onChange={e => setForm({ ...form, chassis: e.target.value })}
                  placeholder="Número do chassis (opcional)" />
              </div>
              <div className="form-group">
                <label>Observações</label>
                <textarea rows="2" value={form.notes}
                  onChange={e => setForm({ ...form, notes: e.target.value })}
                  placeholder="Observações sobre o veículo..." />
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
            <p>Tem certeza que deseja excluir este veículo?</p>
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
