import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getServiceOrders, deleteServiceOrder } from '../api/serviceOrders';
import { FileText, Plus, Search, Edit2, Trash2, AlertCircle, Eye, Calendar, User, DollarSign } from 'lucide-react';

const statusColors = {
  draft: 'badge-gray',
  scheduled: 'badge-blue',
  'in-progress': 'badge-yellow',
  completed: 'badge-green',
  delivered: 'badge-green',
  cancelled: 'badge-red',
};

const statusLabels = {
  draft: 'Rascunho',
  scheduled: 'Agendado',
  'in-progress': 'Em Andamento',
  completed: 'Concluído',
  delivered: 'Entregue',
  cancelled: 'Cancelado',
};

const priorityLabels = {
  low: 'Baixa',
  medium: 'Média',
  high: 'Alta',
};

export default function ServiceOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deleteId, setDeleteId] = useState(null);
  const navigate = useNavigate();

  const fetchOrders = async () => {
    try {
      const res = await getServiceOrders();
      setOrders(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleDelete = async (id) => {
    try {
      await deleteServiceOrder(id);
      setOrders(orders.filter((o) => o.id !== id));
      setDeleteId(null);
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = orders.filter((o) => {
    const matchSearch =
      o.orderNumber?.toLowerCase().includes(search.toLowerCase()) ||
      o.client?.name?.toLowerCase().includes(search.toLowerCase()) ||
      o.serviceType?.name?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

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
          <h2>Ordens de Serviço</h2>
          <p>{orders.length} ordem(ns) registrada(s)</p>
        </div>
        <Link to="/service-orders/new" className="btn btn-primary">
          <Plus size={18} />
          Nova OS
        </Link>
      </div>

      <div className="search-bar">
        <Search size={18} />
        <input
          type="text"
          placeholder="Buscar por número, cliente ou serviço..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Status Filter Tabs */}
      <div className="tabs" style={{ marginBottom: 16 }}>
        <button className={`tab ${statusFilter === 'all' ? 'active' : ''}`} onClick={() => setStatusFilter('all')}>
          Todas <span className="badge badge-gray" style={{ marginLeft: 4, fontSize: 11 }}>{orders.length}</span>
        </button>
        <button className={`tab ${statusFilter === 'draft' ? 'active' : ''}`} onClick={() => setStatusFilter('draft')}>
          Rascunho
        </button>
        <button className={`tab ${statusFilter === 'scheduled' ? 'active' : ''}`} onClick={() => setStatusFilter('scheduled')}>
          Agendado
        </button>
        <button className={`tab ${statusFilter === 'in-progress' ? 'active' : ''}`} onClick={() => setStatusFilter('in-progress')}>
          Em Andamento
        </button>
        <button className={`tab ${statusFilter === 'completed' ? 'active' : ''}`} onClick={() => setStatusFilter('completed')}>
          Concluído
        </button>
        <button className={`tab ${statusFilter === 'delivered' ? 'active' : ''}`} onClick={() => setStatusFilter('delivered')}>
          Entregue
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <FileText size={48} />
          <h3>{search || statusFilter !== 'all' ? 'Nenhuma OS encontrada' : 'Nenhuma ordem de serviço registrada'}</h3>
          <p>{search || statusFilter !== 'all' ? 'Tente limpar os filtros' : 'Clique em "Nova OS" para criar a primeira'}</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Nº OS</th>
                <th>Cliente</th>
                <th>Serviço</th>
                <th>Status</th>
                <th>Prioridade</th>
                <th>Valor</th>
                <th>Data</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((order) => (
                <tr key={order.id}>
                  <td>
                    <span className="table-link" onClick={() => navigate(`/service-orders/${order.id}`)}>
                      {order.orderNumber}
                    </span>
                  </td>
                  <td>
                    <div className="contact-info">
                      <User size={14} />
                      {order.client?.name || '—'}
                    </div>
                  </td>
                  <td>{order.serviceType?.name || '—'}</td>
                  <td>
                    <span className={`badge ${statusColors[order.status] || 'badge-gray'}`}>
                      {statusLabels[order.status] || order.status}
                    </span>
                  </td>
                  <td>
                    <span className={`priority-badge priority-${order.priority}`}>
                      {priorityLabels[order.priority] || order.priority}
                    </span>
                  </td>
                  <td>
                    {Number(order.totalAmount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </td>
                  <td className="text-muted" style={{ whiteSpace: 'nowrap', fontSize: 13 }}>
                    {new Date(order.createdAt).toLocaleDateString('pt-BR')}
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn-icon" title="Visualizar" onClick={() => navigate(`/service-orders/${order.id}`)}>
                        <Eye size={16} />
                      </button>
                      <button className="btn-icon" title="Editar" onClick={() => navigate(`/service-orders/${order.id}/edit`)}>
                        <Edit2 size={16} />
                      </button>
                      <button className="btn-icon btn-icon-danger" title="Excluir" onClick={() => setDeleteId(order.id)}>
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
            <p>Tem certeza que deseja excluir esta ordem de serviço?</p>
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
