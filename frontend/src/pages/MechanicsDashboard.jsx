import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getServiceOrders } from '../api/serviceOrders';
import { getPartRequests } from '../api/partRequests';
import { getParts } from '../api/parts';
import {
  FileText, Wrench, Package, Clock, AlertTriangle,
  ShoppingCart
} from 'lucide-react';

const statusLabels = {
  draft: 'Rascunho',
  scheduled: 'Agendado',
  'in-progress': 'Em Andamento',
  completed: 'Concluído',
  delivered: 'Entregue',
  cancelled: 'Cancelado',
};

const statusColors = {
  draft: 'badge-gray',
  scheduled: 'badge-blue',
  'in-progress': { class: 'badge-yellow', color: '#f59e0b' },
  completed: 'badge-green',
  delivered: 'badge-green',
  cancelled: 'badge-red',
};

export default function MechanicsDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ordersRes, partsRes, requestsRes] = await Promise.all([
          getServiceOrders(),
          getParts(),
          getPartRequests(),
        ]);

        const allOrders = ordersRes.data;
        const allParts = partsRes.data;
        const allRequests = requestsRes.data;

        setOrders(allOrders);
        setMyRequests(allRequests.filter(r => r.requestedBy === user?.id));
        setLowStock(allParts.filter(p => p.stockQuantity <= p.minStockLevel));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const activeOrders = orders.filter(o => o.status === 'in-progress');
  const scheduledOrders = orders.filter(o => o.status === 'scheduled');
  const todayOrders = orders.filter(o => {
    if (!o.scheduledDate) return false;
    const today = new Date();
    const orderDate = new Date(o.scheduledDate);
    return orderDate.toDateString() === today.toDateString();
  });

  if (loading) {
    return <div className="page-loading"><div className="loading-spinner" /></div>;
  }

  return (
    <div className="dashboard">
      <div className="page-header">
        <div>
          <h2>Painel do Mecânico</h2>
          <p>Bem-vindo, {user?.name}</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#eff6ff', color: '#3b82f6' }}>
            <FileText size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{activeOrders.length}</span>
            <span className="stat-title">OS em Andamento</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#fffbeb', color: '#f59e0b' }}>
            <Clock size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{scheduledOrders.length}</span>
            <span className="stat-title">OS Agendadas</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#fdf2f8', color: '#ec4899' }}>
            <ShoppingCart size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{myRequests.length}</span>
            <span className="stat-title">Minhas Solicitações</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#fef2f2', color: '#ef4444' }}>
            <AlertTriangle size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{lowStock.length}</span>
            <span className="stat-title">Peças em Alerta</span>
          </div>
        </div>
      </div>

      {/* Today's Schedule */}
      {todayOrders.length > 0 && (
        <div className="dashboard-card" style={{ marginBottom: 16 }}>
          <div className="dashboard-card-header">
            <h3>📅 Ordens de Hoje</h3>
            <span className="badge badge-blue">{todayOrders.length}</span>
          </div>
          <div className="dashboard-card-body">
            <div className="activity-feed">
              {todayOrders.map(order => (
                <div key={order.id} className="activity-item" onClick={() => navigate(`/service-orders/${order.id}`)} style={{ cursor: 'pointer' }}>
                  <div className={`activity-dot ${order.status === 'in-progress' ? 'dot-blue' : 'dot-purple'}`} />
                  <div className="activity-content">
                    <div className="activity-header">
                      <span className="activity-title">{order.orderNumber}</span>
                      <span className={`badge ${statusColors[order.status]?.class || 'badge-gray'}`}>
                        {statusLabels[order.status]}
                      </span>
                    </div>
                    <div className="activity-meta">
                      <span>{order.client?.name}</span>
                      <span>{order.serviceType?.name}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="quick-actions">
        <h3>Ações Rápidas</h3>
        <div className="quick-actions-grid">
          <button className="quick-action-card" onClick={() => navigate('/service-orders')}>
            <FileText size={20} color="#3b82f6" />
            <span>Ver OS</span>
          </button>
          <button className="quick-action-card" onClick={() => navigate('/parts-store')}>
            <Package size={20} color="#10b981" />
            <span>Loja de Peças</span>
          </button>
          <button className="quick-action-card" onClick={() => navigate('/service-orders?status=in-progress')}>
            <Wrench size={20} color="#f59e0b" />
            <span>Em Andamento</span>
          </button>
          <button className="quick-action-card" onClick={() => navigate('/parts-store')} style={{ borderColor: '#f59e0b' }}>
            <ShoppingCart size={20} color="#f59e0b" />
            <span>Solicitar Peça</span>
          </button>
        </div>
      </div>
    </div>
  );
}
