import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getClients, deleteClient } from '../api/clients';
import { Users, Plus, Search, Edit2, Trash2, Phone, Mail, AlertCircle, Car } from 'lucide-react';
import { DRIVER_TYPES } from '../constants/driverTypes';

export default function Clients() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState(null);
  const navigate = useNavigate();

  const fetchClients = async () => {
    try {
      const res = await getClients();
      setClients(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleDelete = async (id) => {
    try {
      await deleteClient(id);
      setClients(clients.filter((c) => c.id !== id));
      setDeleteId(null);
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = clients.filter(
    (c) =>
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase()) ||
      c.phone?.includes(search)
  );

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
          <h2>Clientes</h2>
          <p>{clients.length} cliente(s) cadastrado(s)</p>
        </div>
        <Link to="/clients/new" className="btn btn-primary">
          <Plus size={18} />
          Novo Cliente
        </Link>
      </div>

      <div className="search-bar">
        <Search size={18} />
        <input
          type="text"
          placeholder="Buscar por nome, email ou telefone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <Users size={48} />
          <h3>{search ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}</h3>
          <p>{search ? 'Tente buscar por outro termo' : 'Clique em "Novo Cliente" para cadastrar o primeiro'}</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Tipo</th>
                <th>CPF/CNPJ</th>
                <th>Telefone</th>
                <th>Email</th>
                <th>WhatsApp</th>
                <th>Veículos</th>
                <th>Data</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((client) => (
                <tr key={client.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="table-link" onClick={() => navigate(`/clients/${client.id}/edit`)}>
                        {client.name}
                      </span>
                    </div>
                  </td>
                  <td>
                    {client.driverType && DRIVER_TYPES[client.driverType]?.showTag ? (
                      <span className={`badge ${DRIVER_TYPES[client.driverType]?.badgeClass || 'badge-gray'}`}>
                        {DRIVER_TYPES[client.driverType]?.icon} {DRIVER_TYPES[client.driverType]?.tagLabel}
                      </span>
                    ) : (
                      <span className="text-muted" style={{ fontSize: 13 }}>—</span>
                    )}
                  </td>
                  <td style={{ fontSize: 13 }}>
                    {client.cpfCnpj ? (
                      <span>{client.cpfCnpj}</span>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                  <td>
                    {client.phone ? (
                      <span className="contact-info">
                        <Phone size={14} />
                        {client.phone}
                      </span>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                  <td>
                    {client.email ? (
                      <span className="contact-info">
                        <Mail size={14} />
                        {client.email}
                      </span>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                  <td style={{ fontSize: 13 }}>
                    {client.whatsapp ? (
                      <span>{client.whatsapp}</span>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                  <td>
                    {client.vehicles && client.vehicles.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--primary)' }}>
                          <Car size={12} style={{ marginRight: 3 }} />
                          {client.vehicles.length} veículo(s)
                        </span>
                        <span style={{ fontSize: 11, color: 'var(--gray-400)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {client.vehicles.map(v => v.plate || `${v.brand} ${v.model}`).join(', ')}
                        </span>
                      </div>
                    ) : (
                      <span className="text-muted" style={{ fontSize: 13 }}>—</span>
                    )}
                  </td>
                  <td className="text-muted" style={{ whiteSpace: 'nowrap', fontSize: 13 }}>
                    {new Date(client.createdAt).toLocaleDateString('pt-BR')}
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn-icon"
                        title="Editar"
                        onClick={() => navigate(`/clients/${client.id}/edit`)}
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        className="btn-icon btn-icon-danger"
                        title="Excluir"
                        onClick={() => setDeleteId(client.id)}
                      >
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

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="modal-overlay" onClick={() => setDeleteId(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <AlertCircle size={24} className="text-danger" />
              <h3>Confirmar exclusão</h3>
            </div>
            <p>Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita.</p>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setDeleteId(null)}>
                Cancelar
              </button>
              <button className="btn btn-danger" onClick={() => handleDelete(deleteId)}>
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
