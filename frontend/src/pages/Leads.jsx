import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getLeads, deleteLead, convertLead } from '../api/leads';
import { Target, Plus, Search, Edit2, Trash2, UserCheck, AlertCircle, Phone, Mail, DollarSign } from 'lucide-react';

const statusColors = {
  new: 'badge-blue',
  contacted: 'badge-yellow',
  quoted: 'badge-purple',
  won: 'badge-green',
  lost: 'badge-red',
};

const statusLabels = {
  new: 'Novo',
  contacted: 'Contatado',
  quoted: 'Orçado',
  won: 'Ganho',
  lost: 'Perdido',
};

export default function Leads() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState(null);
  const [convertingId, setConvertingId] = useState(null);
  const navigate = useNavigate();

  const fetchLeads = async () => {
    try {
      const res = await getLeads();
      setLeads(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const handleDelete = async (id) => {
    try {
      await deleteLead(id);
      setLeads(leads.filter((l) => l.id !== id));
      setDeleteId(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleConvert = async (id) => {
    setConvertingId(id);
    try {
      await convertLead(id);
      fetchLeads();
    } catch (err) {
      console.error(err);
    } finally {
      setConvertingId(null);
    }
  };

  const filtered = leads.filter(
    (l) =>
      l.name?.toLowerCase().includes(search.toLowerCase()) ||
      l.email?.toLowerCase().includes(search.toLowerCase()) ||
      l.phone?.includes(search)
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
          <h2>Leads</h2>
          <p>{leads.length} lead(s) registrado(s)</p>
        </div>
        <Link to="/leads/new" className="btn btn-primary">
          <Plus size={18} />
          Novo Lead
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
          <Target size={48} />
          <h3>{search ? 'Nenhum lead encontrado' : 'Nenhum lead registrado'}</h3>
          <p>{search ? 'Tente buscar por outro termo' : 'Clique em "Novo Lead" para capturar o primeiro'}</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Contato</th>
                <th>Origem</th>
                <th>Status</th>
                <th>Valor Est.</th>
                <th>Data</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((lead) => (
                <tr key={lead.id}>
                  <td>
                    <span className="table-link" onClick={() => navigate(`/leads/${lead.id}/edit`)}>
                      {lead.name}
                    </span>
                  </td>
                  <td>
                    <div className="contact-cell">
                      {lead.phone && (
                        <span className="contact-info">
                          <Phone size={14} />
                          {lead.phone}
                        </span>
                      )}
                      {lead.email && (
                        <span className="contact-info">
                          <Mail size={14} />
                          {lead.email}
                        </span>
                      )}
                    </div>
                  </td>
                  <td>{lead.source || '—'}</td>
                  <td>
                    <span className={`badge ${statusColors[lead.status] || 'badge-gray'}`}>
                      {statusLabels[lead.status] || lead.status}
                    </span>
                  </td>
                  <td>
                    {lead.estimatedValue ? (
                      <span className="contact-info">
                        <DollarSign size={14} />
                        {Number(lead.estimatedValue).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </span>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                  <td className="text-muted" style={{ whiteSpace: 'nowrap', fontSize: 13 }}>
                    {new Date(lead.createdAt).toLocaleDateString('pt-BR')}
                  </td>
                  <td>
                    <div className="action-buttons">
                      {lead.status !== 'won' && lead.status !== 'lost' && (
                        <button
                          className="btn-icon btn-icon-success"
                          title="Converter em Cliente"
                          onClick={() => handleConvert(lead.id)}
                          disabled={convertingId === lead.id}
                        >
                          <UserCheck size={16} />
                        </button>
                      )}
                      <button
                        className="btn-icon"
                        title="Editar"
                        onClick={() => navigate(`/leads/${lead.id}/edit`)}
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        className="btn-icon btn-icon-danger"
                        title="Excluir"
                        onClick={() => setDeleteId(lead.id)}
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

      {deleteId && (
        <div className="modal-overlay" onClick={() => setDeleteId(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <AlertCircle size={24} className="text-danger" />
              <h3>Confirmar exclusão</h3>
            </div>
            <p>Tem certeza que deseja excluir este lead?</p>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setDeleteId(null)}>Cancelar</button>
              <button className="btn btn-danger" onClick={() => handleDelete(deleteId)}>Excluir</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
