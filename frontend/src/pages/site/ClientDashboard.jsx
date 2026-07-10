import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, LogOut, ChevronRight, Wrench, Clock, CheckCircle, AlertCircle, Calendar, Package, FileText } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const statusConfig = {
  draft: { label: 'Em análise', color: '#6b7280', bg: '#f3f4f6', icon: Clock },
  scheduled: { label: 'Agendado', color: '#2563eb', bg: '#eff6ff', icon: Calendar },
  'in-progress': { label: 'Em andamento', color: '#f59e0b', bg: '#fffbeb', icon: Clock },
  completed: { label: 'Concluído', color: '#10b981', bg: '#ecfdf5', icon: CheckCircle },
  delivered: { label: 'Entregue', color: '#059669', bg: '#ecfdf5', icon: CheckCircle },
  cancelled: { label: 'Cancelado', color: '#ef4444', bg: '#fef2f2', icon: AlertCircle },
};

export default function ClientDashboard() {
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const token = localStorage.getItem('client_token');
  const clientData = localStorage.getItem('client_data');

  useEffect(() => {
    if (!token) {
      navigate('/site/entrar');
      return;
    }

    const fetchData = async () => {
      try {
        if (clientData) {
          try {
            setClient(JSON.parse(clientData));
          } catch (e) {
            localStorage.removeItem('client_data');
          }
        }

        const res = await fetch(`${API_URL}/public/client/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.status === 401) {
          localStorage.removeItem('client_token');
          localStorage.removeItem('client_data');
          navigate('/site/entrar');
          return;
        }

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.msg || 'Erro ao carregar dados');
        }

        setClient(data.client);
        setOrders(data.orders);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token, navigate, clientData]);

  const handleLogout = () => {
    localStorage.removeItem('client_token');
    localStorage.removeItem('client_data');
    navigate('/site');
  };

  const activeOrders = orders.filter(o => ['draft', 'scheduled', 'in-progress'].includes(o.status));
  const completedOrders = orders.filter(o => ['completed', 'delivered'].includes(o.status));

  if (loading) {
    return (
      <section className="site-section">
        <div className="site-container">
          <div className="site-loading">
            <div className="loading-spinner" />
            <p>Carregando...</p>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="site-section">
        <div className="site-container">
          <div className="site-auth-card">
            <div className="site-alert site-alert-error">{error}</div>
            <Link to="/site/entrar" className="site-btn site-btn-primary site-btn-block">
              Voltar ao Login
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <>
      {/* Dashboard Header */}
      <section className="site-page-header site-page-header-sm">
        <div className="site-container">
          <div className="site-dash-header">
            <div className="site-dash-user">
              <div className="site-dash-avatar">
                {client?.name?.charAt(0) || 'U'}
              </div>
              <div>
                <h1>Olá, {client?.name?.split(' ')[0]}!</h1>
                <p>{client?.email}</p>
              </div>
            </div>
            <button onClick={handleLogout} className="site-btn site-btn-outline site-btn-sm">
              <LogOut size={16} /> Sair
            </button>
          </div>
        </div>
      </section>

      <section className="site-section">
        <div className="site-container">
          {/* Stats */}
          <div className="site-dash-stats">
            <div className="site-dash-stat">
              <strong>{orders.length}</strong>
              <span>Total de OS</span>
            </div>
            <div className="site-dash-stat site-dash-stat-active">
              <strong>{activeOrders.length}</strong>
              <span>Em andamento</span>
            </div>
            <div className="site-dash-stat site-dash-stat-done">
              <strong>{completedOrders.length}</strong>
              <span>Concluídas</span>
            </div>
          </div>

          {/* Active Orders */}
          {activeOrders.length > 0 && (
            <div className="site-dash-section">
              <h2>Ordens em Andamento</h2>
              <div className="site-dash-orders">
                {activeOrders.map(order => {
                  const cfg = statusConfig[order.status] || statusConfig.draft;
                  const StatusIcon = cfg.icon;
                  return (
                    <Link
                      key={order.id}
                      to={`/public/os/${order.shareToken}`}
                      className="site-dash-order-card"
                    >
                      <div className="site-dash-order-header">
                        <strong>{order.orderNumber}</strong>
                        <span className="site-dash-status" style={{ background: cfg.bg, color: cfg.color }}>
                          <StatusIcon size={14} />
                          {cfg.label}
                        </span>
                      </div>
                      {order.serviceType && (
                        <p className="site-dash-order-service">{order.serviceType.name}</p>
                      )}
                      <div className="site-dash-order-meta">
                        <span><Calendar size={14} /> {new Date(order.createdAt).toLocaleDateString('pt-BR')}</span>
                        {order.totalAmount > 0 && (
                          <span className="site-dash-order-value">
                            {Number(order.totalAmount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </span>
                        )}
                      </div>
                      <div className="site-dash-order-arrow">
                        <ChevronRight size={18} />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* Completed Orders */}
          {completedOrders.length > 0 && (
            <div className="site-dash-section">
              <h2>Ordens Concluídas</h2>
              <div className="site-dash-orders">
                {completedOrders.slice(0, 5).map(order => {
                  const cfg = statusConfig[order.status] || statusConfig.draft;
                  const StatusIcon = cfg.icon;
                  return (
                    <Link
                      key={order.id}
                      to={`/public/os/${order.shareToken}`}
                      className="site-dash-order-card"
                    >
                      <div className="site-dash-order-header">
                        <strong>{order.orderNumber}</strong>
                        <span className="site-dash-status" style={{ background: cfg.bg, color: cfg.color }}>
                          <StatusIcon size={14} />
                          {cfg.label}
                        </span>
                      </div>
                      {order.serviceType && (
                        <p className="site-dash-order-service">{order.serviceType.name}</p>
                      )}
                      <div className="site-dash-order-meta">
                        <span><Calendar size={14} /> {new Date(order.createdAt).toLocaleDateString('pt-BR')}</span>
                        {order.totalAmount > 0 && (
                          <span className="site-dash-order-value">
                            {Number(order.totalAmount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </span>
                        )}
                      </div>
                      <div className="site-dash-order-arrow">
                        <ChevronRight size={18} />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* Empty State */}
          {orders.length === 0 && (
            <div className="site-empty">
              <Wrench size={48} />
              <h3>Nenhuma ordem de serviço</h3>
              <p>Você ainda não possui ordens de serviço registradas.</p>
              <Link to="/site/solicitar-orcamento" className="site-btn site-btn-primary">
                Solicitar Orçamento
              </Link>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
