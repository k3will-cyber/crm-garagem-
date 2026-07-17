import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getVehicles, createVehicle, updateVehicle, deleteVehicle } from '../api/vehicles';
import { getClients } from '../api/clients';
import {
  Car, Plus, Search, Edit2, Trash2, AlertCircle, Save, X
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
  const [form, setForm] = useState({
    clientId: '', plate: '', brand: '', model: '', year: '',
    color: '', fuel: 'flex', currentKm: '', chassis: '', notes: ''
  });
  const [saving, setSaving] = useState(false);

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
    setEditing(vehicle.id);
    setShowForm(true);
  };

  const handleNew = () => {
    setForm({ clientId: '', plate: '', brand: '', model: '', year: '', color: '', fuel: 'flex', currentKm: '', chassis: '', notes: '' });
    setEditing(null);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.clientId) return alert('Selecione um cliente');
    if (!form.brand || !form.model) return alert('Marca e modelo são obrigatórios');
    setSaving(true);
    try {
      const payload = {
        ...form,
        year: form.year ? parseInt(form.year) : null,
        currentKm: form.currentKm ? parseInt(form.currentKm) : null
      };
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
              <div className="form-group">
                <label>Cliente *</label>
                <select value={form.clientId} onChange={e => setForm({ ...form, clientId: e.target.value })}>
                  <option value="">Selecione um cliente</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.name} {c.phone ? `- ${c.phone}` : ''}</option>
                  ))}
                </select>
              </div>
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
