import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Target,
  FileText,
  TrendingUp,
  AlertTriangle,
  DollarSign,
  Percent,
  ArrowRight,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import { getDashboardStats, getDashboardRevenue } from '../api/serviceOrders';
import { getLowStockParts } from '../api/parts';

const COLORS = {
  primary: '#3b82f6',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  purple: '#8b5cf6',
  pink: '#ec4899',
  cyan: '#06b6d4',
};

const PIE_COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#8b5cf6', '#6b7280', '#ef4444'];
const REVENUE_GRADIENT = ['#3b82f6', '#60a5fa'];

const statusLabels = {
  draft: 'Rascunho',
  scheduled: 'Agendado',
  'in-progress': 'Em Andamento',
  completed: 'Concluído',
  delivered: 'Entregue',
  cancelled: 'Cancelado',
};

const statusBadgeColors = {
  draft: 'badge-gray',
  scheduled: 'badge-blue',
  'in-progress': 'badge-yellow',
  completed: 'badge-green',
  delivered: 'badge-green',
  cancelled: 'badge-red',
};

function StatCard({ title, value, subtitle, icon: Icon, color, bg, trend, trendLabel }) {
  return (
    <div className="stat-card">
      <div className="stat-icon" style={{ backgroundColor: bg, color: color }}>
        <Icon size={24} />
      </div>
      <div className="stat-info">
        <span className="stat-value">{value}</span>
        <span className="stat-title">{title}</span>
        {subtitle && <span className="stat-subtitle">{subtitle}</span>}
        {trend !== undefined && (
          <span className={`stat-trend ${trend >= 0 ? 'trend-up' : 'trend-down'}`}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend).toFixed(1)}% {trendLabel || ''}
          </span>
        )}
      </div>
    </div>
  );
}

function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div className="chart-tooltip">
        <p className="chart-tooltip-label">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} style={{ color: entry.color }} className="chart-tooltip-value">
            {entry.name}: {entry.name === 'Receita'
              ? Number(entry.value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
              : entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
}

function formatCurrency(value) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [revenueData, setRevenueData] = useState(null);
  const [lowStock, setLowStock] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, revenueRes, lowStockRes] = await Promise.all([
          getDashboardStats(),
          getDashboardRevenue(),
          getLowStockParts(),
        ]);
        setStats(statsRes.data);
        setRevenueData(revenueRes.data);
        setLowStock(lowStockRes.data);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="page-loading">
        <div className="loading-spinner" />
      </div>
    );
  }

  const totalLeads = stats?.totalLeads ?? 0;
  const newLeads = stats?.newLeads ?? 0;
  const wonLeads = stats?.wonLeads ?? 0;
  const totalClients = stats?.totalClients ?? 0;
  const activeOrders = stats?.activeServiceOrders ?? 0;
  const completedOrders = stats?.completedServiceOrders ?? 0;
  const deliveredOrders = stats?.deliveredOrders ?? 0;
  const totalOrders = stats?.totalOrders ?? 0;
  const totalRevenue = stats?.totalRevenue ?? 0;
  const conversionRate = totalLeads > 0 ? (wonLeads / totalLeads) * 100 : 0;

  const monthlyRevenue = revenueData?.monthlyRevenue || [];
  const statusDistribution = revenueData?.statusDistribution || [];
  const recentOrders = revenueData?.recentServiceOrders || [];
  const recentLeads = revenueData?.recentLeads || [];

  // Combine recent activities
  const recentActivities = [
    ...recentOrders.map(o => ({
      id: `order-${o.id}`,
      type: 'order',
      title: o.orderNumber,
      subtitle: o.client?.name || 'Cliente',
      date: o.createdAt,
      status: o.status,
      statusLabel: statusLabels[o.status] || o.status,
    })),
    ...recentLeads.map(l => ({
      id: `lead-${l.id}`,
      type: 'lead',
      title: l.name,
      subtitle: l.source || 'Direto',
      date: l.createdAt,
      status: l.status,
      statusLabel: l.status,
    })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 8);

  return (
    <div className="dashboard">
      <div className="page-header">
        <div>
          <h2>Dashboard</h2>
          <p>Visão geral do sistema</p>
        </div>
      </div>

      {/* Low Stock Alert */}
      {lowStock.length > 0 && (
        <div className="alert alert-warning">
          <AlertTriangle size={20} />
          <div>
            <strong>{lowStock.length} peça(s) com estoque baixo</strong>
            <p>Verifique a página de Peças para reabastecer.</p>
          </div>
          <button className="btn btn-sm" onClick={() => navigate('/parts')}>
            Ver Peças <ArrowRight size={14} />
          </button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="stats-grid">
        <StatCard
          title="Receita Total"
          value={formatCurrency(totalRevenue)}
          subtitle="OS concluídas e entregues"
          icon={DollarSign}
          color={COLORS.success}
          bg="#ecfdf5"
        />
        <StatCard
          title="Leads"
          value={totalLeads}
          subtitle={`${newLeads} novos · ${wonLeads} convertidos`}
          icon={Target}
          color={COLORS.primary}
          bg="#eff6ff"
        />
        <StatCard
          title="Clientes"
          value={totalClients}
          subtitle="Cadastrados"
          icon={Users}
          color={COLORS.purple}
          bg="#f5f3ff"
        />
        <StatCard
          title="OS Ativas"
          value={activeOrders}
          subtitle="Em andamento"
          icon={FileText}
          color={COLORS.warning}
          bg="#fffbeb"
        />
        <StatCard
          title="OS Concluídas"
          value={completedOrders + deliveredOrders}
          subtitle={`${deliveredOrders} entregues`}
          icon={TrendingUp}
          color={COLORS.cyan}
          bg="#ecfeff"
        />
        <StatCard
          title="Taxa de Conversão"
          value={`${conversionRate.toFixed(1)}%`}
          subtitle={`${wonLeads} de ${totalLeads} leads convertidos`}
          icon={Percent}
          color={COLORS.pink}
          bg="#fdf2f8"
        />
      </div>

      {/* Charts Row */}
      <div className="dashboard-grid">
        {/* Revenue Chart */}
        <div className="dashboard-card dashboard-card-full">
          <div className="dashboard-card-header">
            <h3>Receita Mensal</h3>
            {monthlyRevenue.length > 0 && (
              <span className="badge badge-green">
                {formatCurrency(monthlyRevenue.reduce((acc, m) => acc + m.revenue, 0))}
              </span>
            )}
          </div>
          <div className="dashboard-card-body chart-body">
            {monthlyRevenue.length === 0 ? (
              <p className="empty-text">Nenhum dado de receita disponível</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={monthlyRevenue} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="revenue" name="Receita" radius={[6, 6, 0, 0]} fill={COLORS.primary} maxBarSize={48}>
                    {monthlyRevenue.map((_, index) => (
                      <Cell key={index} fill={REVENUE_GRADIENT[index % 2]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Status Distribution */}
        <div className="dashboard-card">
          <div className="dashboard-card-header">
            <h3>Distribuição de OS</h3>
            <span className="badge badge-blue">{totalOrders} total</span>
          </div>
          <div className="dashboard-card-body chart-body">
            {statusDistribution.length === 0 ? (
              <p className="empty-text">Nenhuma OS registrada</p>
            ) : (
              <div className="pie-chart-container">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={statusDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="count"
                      nameKey="label"
                    >
                      {statusDistribution.map((_, index) => (
                        <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pie-legend">
                  {statusDistribution.map((item, index) => (
                    <div key={item.status} className="pie-legend-item">
                      <span className="pie-legend-dot" style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }} />
                      <span className="pie-legend-label">{item.label}</span>
                      <span className="pie-legend-count">{item.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activities */}
        <div className="dashboard-card">
          <div className="dashboard-card-header">
            <h3>Atividades Recentes</h3>
          </div>
          <div className="dashboard-card-body">
            {recentActivities.length === 0 ? (
              <p className="empty-text">Nenhuma atividade recente</p>
            ) : (
              <div className="activity-feed">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="activity-item">
                    <div className={`activity-dot ${activity.type === 'order' ? 'dot-blue' : 'dot-purple'}`} />
                    <div className="activity-content">
                      <div className="activity-header">
                        <span className="activity-title">{activity.title}</span>
                        <span className="activity-time">
                          {new Date(activity.date).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                      <div className="activity-meta">
                        <span className="activity-subtitle">{activity.subtitle}</span>
                        <span className={`badge ${activity.type === 'order' ? (statusBadgeColors[activity.status] || 'badge-gray') : 'badge-purple'}`}>
                          {activity.statusLabel}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h3>Ações Rápidas</h3>
        <div className="quick-actions-grid">
          <button className="quick-action-card" onClick={() => navigate('/service-orders/new')}>
            <FileText size={20} color={COLORS.primary} />
            <span>Nova OS</span>
          </button>
          <button className="quick-action-card" onClick={() => navigate('/leads/new')}>
            <Target size={20} color={COLORS.warning} />
            <span>Novo Lead</span>
          </button>
          <button className="quick-action-card" onClick={() => navigate('/clients/new')}>
            <Users size={20} color={COLORS.success} />
            <span>Novo Cliente</span>
          </button>
          <button className="quick-action-card" onClick={() => navigate('/service-orders')}>
            <FileText size={20} color={COLORS.purple} />
            <span>Ver OS</span>
          </button>
        </div>
      </div>
    </div>
  );
}
