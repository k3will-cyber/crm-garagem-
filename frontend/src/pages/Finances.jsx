import React, { useState, useEffect, useCallback } from 'react';
import {
  DollarSign, TrendingUp, TrendingDown, Package,
  Plus, Search, Edit2, Trash2, AlertCircle, Save,
  Filter, Clock,
  BarChart3, Receipt,
  Users, Wrench
} from 'lucide-react';
import {
  getFinancialDashboard, getTransactions, createTransaction,
  updateTransaction, deleteTransaction, getFinancialCategories
} from '../api/finances';

const formatCurrency = (value) => {
  const num = parseFloat(value || 0);
  return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const formatDate = (date) => {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('pt-BR');
};

const STATUS_LABELS = {
  pending: 'Pendente',
  paid: 'Pago',
  received: 'Recebido',
  cancelled: 'Cancelado'
};

const STATUS_COLORS = {
  pending: 'badge-yellow',
  paid: 'badge-green',
  received: 'badge-green',
  cancelled: 'badge-red'
};

const TYPE_LABELS = {
  income: 'Receita',
  expense: 'Despesa'
};

const PAYMENT_METHODS = [
  'Dinheiro', 'Pix', 'Cartão de Crédito', 'Cartão de Débito',
  'Boleto', 'Transferência', 'Cheque', 'Outro'
];

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

function StatCard({ title, value, icon: Icon, color, bg, subtitle, trend }) {
  return (
    <div className="stat-card">
      <div className="stat-icon" style={{ backgroundColor: bg, color }}>
        <Icon size={24} />
      </div>
      <div className="stat-info">
        <span className="stat-value" style={{ color: value.startsWith('-') ? 'var(--danger)' : undefined }}>
          {value}
        </span>
        <span className="stat-title">{title}</span>
        {subtitle && <span className="stat-subtitle">{subtitle}</span>}
        {trend !== undefined && (
          <span className={`stat-trend ${trend >= 0 ? 'trend-up' : 'trend-down'}`}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend).toFixed(1)}%
          </span>
        )}
      </div>
    </div>
  );
}

function FinanceBarChart({ data, dataKey, nameKey, color, height = 200 }) {
  if (!data || data.length === 0) {
    return <div className="empty-text" style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Nenhum dado disponível</div>;
  }

  const maxVal = Math.max(...data.map(d => parseFloat(d[dataKey] || 0)), 1);

  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height, padding: '16px 4px 0' }}>
      {data.map((item, i) => {
        const val = parseFloat(item[dataKey] || 0);
        const h = (val / maxVal) * (height - 40);
        return (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: '0.65rem', color: 'var(--gray-500)', fontWeight: 600 }}>
              {formatCurrency(val)}
            </span>
            <div
              title={`${item[nameKey]}: ${formatCurrency(val)}`}
              style={{
                width: '100%',
                maxWidth: 48,
                height: Math.max(h, 4),
                background: color,
                borderRadius: '4px 4px 0 0',
                transition: 'height 0.3s ease',
                opacity: val === 0 ? 0.3 : 0.85,
                cursor: 'pointer'
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = '1'}
              onMouseLeave={e => e.currentTarget.style.opacity = '0.85'}
            />
            <span style={{ fontSize: '0.65rem', color: 'var(--gray-400)', whiteSpace: 'nowrap' }}>
              {item[nameKey]}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function CategoryPieChart({ data, colorMap, total, height = 220 }) {
  if (!data || data.length === 0) {
    return <div className="empty-text" style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Nenhum dado disponível</div>;
  }

  const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316', '#6366f1', '#14b8a6'];
  const totalVal = data.reduce((s, d) => s + parseFloat(d.total || 0), 0);

  // Sort by value descending
  const sorted = [...data].sort((a, b) => parseFloat(b.total || 0) - parseFloat(a.total || 0));

  return (
    <div style={{ display: 'flex', gap: 16, alignItems: 'center', height }}>
      <div style={{ position: 'relative', width: 120, height: 120, flexShrink: 0 }}>
        <svg width="120" height="120" viewBox="0 0 120 120">
          {sorted.map((item, i) => {
            const pct = parseFloat(item.total || 0) / totalVal;
            const dashOffset = 283 - (283 * pct);
            return (
              <circle
                key={i}
                cx="60" cy="60" r="45"
                fill="none"
                stroke={colors[i % colors.length]}
                strokeWidth="12"
                strokeDasharray={`${pct * 283} 283`}
                transform={`rotate(-90, 60, 60)`}
                style={{ opacity: 0.85 }}
              />
            );
          })}
        </svg>
        <div style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--gray-800)' }}>
            {formatCurrency(totalVal)}
          </div>
          <div style={{ fontSize: '0.65rem', color: 'var(--gray-400)' }}>Total</div>
        </div>
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
        {sorted.slice(0, 5).map((item, i) => {
          const pct = totalVal > 0 ? ((parseFloat(item.total || 0) / totalVal) * 100).toFixed(1) : 0;
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: colors[i % colors.length], flexShrink: 0 }} />
              <span style={{ flex: 1, color: 'var(--gray-600)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {item.category}
              </span>
              <span style={{ color: 'var(--gray-500)', fontWeight: 500 }}>{pct}%</span>
              <span style={{ color: 'var(--gray-800)', fontWeight: 600 }}>{formatCurrency(item.total)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const DEFAULT_FORM = {
  type: 'expense',
  category: '',
  description: '',
  amount: '',
  transactionDate: new Date().toISOString().split('T')[0],
  paymentMethod: '',
  status: 'pending',
  notes: ''
};

export default function Finances() {
  const [dashboard, setDashboard] = useState(null);
  const [categories, setCategories] = useState({ income: [], expense: [] });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');

  // Transaction list
  const [transactions, setTransactions] = useState([]);
  const [txLoading, setTxLoading] = useState(false);
  const [txFilter, setTxFilter] = useState({ type: '', category: '', status: '' });

  // Form
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ ...DEFAULT_FORM });
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  // Search
  const [search, setSearch] = useState('');

  const fetchDashboard = useCallback(async () => {
    try {
      const [dashRes, catRes] = await Promise.all([
        getFinancialDashboard(),
        getFinancialCategories()
      ]);
      setDashboard(dashRes.data);
      setCategories(catRes.data);
    } catch (err) {
      console.error('Erro ao carregar financeiro:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTransactions = useCallback(async () => {
    setTxLoading(true);
    try {
      const params = {};
      if (txFilter.type) params.type = txFilter.type;
      if (txFilter.status) params.status = txFilter.status;
      if (txFilter.category) params.category = txFilter.category;
      const res = await getTransactions(params);
      setTransactions(res.data.transactions || []);
    } catch (err) {
      console.error('Erro ao carregar transações:', err);
    } finally {
      setTxLoading(false);
    }
  }, [txFilter]);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);
  useEffect(() => { if (activeTab === 'transactions') fetchTransactions(); }, [activeTab, fetchTransactions]);

  const filteredTransactions = transactions.filter(t =>
    !search ||
    t.description?.toLowerCase().includes(search.toLowerCase()) ||
    t.category?.toLowerCase().includes(search.toLowerCase())
  );

  const handleNew = () => {
    setForm({ ...DEFAULT_FORM, transactionDate: new Date().toISOString().split('T')[0] });
    setEditing(null);
    setShowForm(true);
  };

  const handleEdit = (t) => {
    setForm({
      type: t.type,
      category: t.category || '',
      description: t.description || '',
      amount: t.amount || '',
      transactionDate: t.transactionDate || new Date().toISOString().split('T')[0],
      paymentMethod: t.paymentMethod || '',
      status: t.status || 'pending',
      notes: t.notes || ''
    });
    setEditing(t.id);
    setShowForm(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSave = async () => {
    if (!form.description || !form.amount || !form.category) {
      return alert('Descrição, valor e categoria são obrigatórios');
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        amount: parseFloat(form.amount.replace(',', '.'))
      };
      if (editing) {
        await updateTransaction(editing, payload);
      } else {
        await createTransaction(payload);
      }
      setShowForm(false);
      setEditing(null);
      await fetchDashboard();
      if (activeTab === 'transactions') await fetchTransactions();
    } catch (err) {
      alert(err.response?.data?.msg || 'Erro ao salvar transação');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteTransaction(deleteId);
      setDeleteId(null);
      await fetchDashboard();
      if (activeTab === 'transactions') await fetchTransactions();
    } catch (err) {
      alert('Erro ao excluir transação');
    }
  };

  if (loading) {
    return (
      <div className="page-loading">
        <div className="loading-spinner" />
      </div>
    );
  }

  const summary = dashboard?.summary || {};
  const profit = summary.profit || 0;
  const profitColor = profit >= 0 ? 'var(--success)' : 'var(--danger)';

  // Merge monthly revenue and expenses for chart
  const monthlyData = [];
  const revenueMap = {};
  const expenseMap = {};

  (dashboard?.monthlyRevenue || []).forEach(r => {
    revenueMap[r.month] = parseFloat(r.total || 0);
  });
  (dashboard?.monthlyExpenses || []).forEach(e => {
    expenseMap[e.month] = parseFloat(e.total || 0);
  });

  const allMonths = [...new Set([...Object.keys(revenueMap), ...Object.keys(expenseMap)])].sort();
  allMonths.forEach(m => {
    const [y, mo] = m.split('-');
    monthlyData.push({
      month: `${MONTHS[parseInt(mo) - 1]}/${y.slice(2)}`,
      revenue: revenueMap[m] || 0,
      expense: expenseMap[m] || 0,
      profit: (revenueMap[m] || 0) - (expenseMap[m] || 0)
    });
  });

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h2>💰 Financeiro</h2>
          <p>
            {activeTab === 'dashboard' ? 'Painel financeiro completo da operação' : 'Gerenciar receitas e despesas'}
          </p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-primary" onClick={handleNew}>
            <Plus size={18} /> Nova Transação
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button
          className={`tab ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          <BarChart3 size={16} /> Dashboard
        </button>
        <button
          className={`tab ${activeTab === 'transactions' ? 'active' : ''}`}
          onClick={() => setActiveTab('transactions')}
        >
          <Receipt size={16} /> Transações
          {summary.pendingCount > 0 && (
            <span className="tab-badge">{summary.pendingCount}</span>
          )}
        </button>
      </div>

      {/* ── DASHBOARD TAB ────────────────────────────────────── */}
      {activeTab === 'dashboard' && (
        <>
          {/* Stats Grid */}
          <div className="stats-grid">
            <StatCard
              title="Receita Total"
              value={formatCurrency(summary.totalRevenue + summary.totalManualIncome)}
              subtitle="OS concluídas + receitas manuais"
              icon={TrendingUp}
              color="#10b981"
              bg="#ecfdf5"
            />
            <StatCard
              title="Despesas Totais"
              value={formatCurrency(summary.totalExpenses)}
              subtitle="Despesas manuais registradas"
              icon={TrendingDown}
              color="#ef4444"
              bg="#fef2f2"
            />
            <StatCard
              title="Lucro Líquido"
              value={formatCurrency(profit)}
              subtitle={`${profit >= 0 ? 'Positivo' : 'Negativo'}`}
              icon={DollarSign}
              color={profitColor}
              bg={profit >= 0 ? '#ecfdf5' : '#fef2f2'}
            />
            <StatCard
              title="Valor em Estoque"
              value={formatCurrency(summary.inventoryValue)}
              subtitle={`${summary.totalParts} peças`}
              icon={Package}
              color="#8b5cf6"
              bg="#f5f3ff"
            />
            <StatCard
              title="Total em OS"
              value={formatCurrency(summary.totalOSValue)}
              subtitle={`${summary.totalOS} ordens de serviço`}
              icon={Wrench}
              color="#3b82f6"
              bg="#eff6ff"
            />
            <StatCard
              title="OS Ativas"
              value={summary.activeOS}
              subtitle="Em andamento ou agendadas"
              icon={Users}
              color="#f59e0b"
              bg="#fffbeb"
            />
            <StatCard
              title="Transações Pendentes"
              value={summary.pendingCount}
              subtitle="Aguardando confirmação"
              icon={Clock}
              color="#f59e0b"
              bg="#fffbeb"
            />
            <StatCard
              title="Receita de Serviços"
              value={formatCurrency(summary.totalRevenue)}
              subtitle="Apenas OS concluídas/entregues"
              icon={Building2}
              color="#06b6d4"
              bg="#ecfeff"
            />
          </div>

          {/* Charts Grid */}
          <div className="dashboard-grid">
            {/* Monthly Revenue vs Expenses */}
            {monthlyData.length > 0 && (
              <div className="dashboard-card dashboard-card-full">
                <div className="dashboard-card-header">
                  <h3>📊 Receita vs Despesas Mensais</h3>
                  <div style={{ display: 'flex', gap: 16, fontSize: '0.78rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ width: 10, height: 10, borderRadius: 2, background: '#10b981' }} />
                      Receita
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ width: 10, height: 10, borderRadius: 2, background: '#ef4444' }} />
                      Despesa
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ width: 10, height: 10, borderRadius: 2, background: '#3b82f6' }} />
                      Lucro
                    </span>
                  </div>
                </div>
                <div className="dashboard-card-body" style={{ padding: '8px 16px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, minHeight: 220, paddingTop: 16 }}>
                    {monthlyData.map((m, i) => {
                      const maxVal = Math.max(...monthlyData.map(x => Math.max(x.revenue, x.expense, Math.abs(x.profit))), 1);
                      const maxH = 180;
                      return (
                        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                          {/* Revenue bar */}
                          <div style={{ height: Math.max((m.revenue / maxVal) * maxH, 2), width: '100%', maxWidth: 24, background: '#10b981', borderRadius: '3px 3px 0 0', opacity: 0.85 }} title={`Receita: ${formatCurrency(m.revenue)}`} />
                          {/* Expense bar (negative, shown downward) */}
                          <div style={{ height: Math.max((m.expense / maxVal) * maxH, 2), width: '100%', maxWidth: 24, background: '#ef4444', borderRadius: '0 0 3px 3px', opacity: 0.85 }} title={`Despesa: ${formatCurrency(m.expense)}`} />
                          {/* Profit indicator */}
                          <div style={{
                            height: 3, width: '100%', maxWidth: 32,
                            background: m.profit >= 0 ? '#10b981' : '#ef4444',
                            borderRadius: 2, marginTop: 2
                          }} />
                          <span style={{ fontSize: '0.62rem', color: 'var(--gray-400)', marginTop: 4 }}>{m.month}</span>
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginTop: 12, fontSize: '0.72rem', color: 'var(--gray-500)' }}>
                    <span>📈 Receita total: {formatCurrency(monthlyData.reduce((s, m) => s + m.revenue, 0))}</span>
                    <span>📉 Despesa total: {formatCurrency(monthlyData.reduce((s, m) => s + m.expense, 0))}</span>
                    <span>💵 Lucro total: {formatCurrency(monthlyData.reduce((s, m) => s + m.profit, 0))}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Expenses by Category */}
            {dashboard?.expensesByCategory?.length > 0 && (
              <div className="dashboard-card">
                <div className="dashboard-card-header">
                  <h3>📉 Despesas por Categoria</h3>
                  <span className="badge badge-red">{formatCurrency(summary.totalExpenses)}</span>
                </div>
                <div className="dashboard-card-body">
                  <CategoryPieChart data={dashboard.expensesByCategory} total={summary.totalExpenses} />
                </div>
              </div>
            )}

            {/* Revenue by Service Type */}
            {dashboard?.revenueByService?.length > 0 && (
              <div className="dashboard-card">
                <div className="dashboard-card-header">
                  <h3>📊 Receita por Tipo de Serviço</h3>
                  <span className="badge badge-green">{formatCurrency(summary.totalRevenue)}</span>
                </div>
                <div className="dashboard-card-body">
                  <FinanceBarChart
                    data={dashboard.revenueByService}
                    dataKey="total"
                    nameKey="serviceName"
                    color="#10b981"
                  />
                </div>
              </div>
            )}

            {/* Recent Transactions */}
            <div className="dashboard-card">
              <div className="dashboard-card-header">
                <h3>🔄 Transações Recentes</h3>
                <button className="btn btn-sm btn-secondary" onClick={() => setActiveTab('transactions')}>
                  Ver Todas
                </button>
              </div>
              <div className="dashboard-card-body" style={{ padding: 0 }}>
                {dashboard?.recentTransactions?.length === 0 ? (
                  <p className="empty-text">Nenhuma transação registrada</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {(dashboard?.recentTransactions || []).slice(0, 8).map(t => (
                      <div key={t.id} style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '10px 16px', borderBottom: '1px solid var(--gray-100)',
                        fontSize: '0.82rem'
                      }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: '50%',
                          background: t.type === 'income' ? '#ecfdf5' : '#fef2f2',
                          color: t.type === 'income' ? '#10b981' : '#ef4444',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                        }}>
                          {t.type === 'income' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 500, color: 'var(--gray-800)' }}>{t.description}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--gray-400)', marginTop: 1 }}>
                            {t.category} · {formatDate(t.transactionDate)}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{
                            fontWeight: 700,
                            color: t.type === 'income' ? 'var(--success)' : 'var(--danger)'
                          }}>
                            {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                          </div>
                          <span className={`badge ${STATUS_COLORS[t.status] || 'badge-gray'}`} style={{ fontSize: '0.68rem' }}>
                            {STATUS_LABELS[t.status]}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── TRANSACTIONS TAB ─────────────────────────────────── */}
      {activeTab === 'transactions' && (
        <>
          {/* Filters */}
          <div className="filter-bar">
            <div className="filter-group">
              <Filter size={14} />
              <select value={txFilter.type} onChange={e => setTxFilter({ ...txFilter, type: e.target.value })}>
                <option value="">Todos os tipos</option>
                <option value="income">Receitas</option>
                <option value="expense">Despesas</option>
              </select>
            </div>
            <div className="filter-group">
              <Filter size={14} />
              <select value={txFilter.status} onChange={e => setTxFilter({ ...txFilter, status: e.target.value })}>
                <option value="">Todos os status</option>
                <option value="pending">Pendente</option>
                <option value="paid">Pago</option>
                <option value="received">Recebido</option>
                <option value="cancelled">Cancelado</option>
              </select>
            </div>
            <div className="search-bar" style={{ flex: 1, margin: 0 }}>
              <Search size={16} />
              <input
                type="text"
                placeholder="Buscar transações..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Summary bar */}
          <div style={{
            display: 'flex', gap: 20, marginBottom: 16,
            padding: '12px 16px', background: 'white',
            borderRadius: 'var(--radius-md)', border: '1px solid var(--gray-200)',
            fontSize: '0.85rem', flexWrap: 'wrap'
          }}>
            <span>📋 <strong>{transactions.length}</strong> transações</span>
            <span style={{ color: 'var(--success)' }}>
              📈 Receitas: <strong>{formatCurrency(transactions.filter(t => t.type === 'income').reduce((s, t) => s + parseFloat(t.amount || 0), 0))}</strong>
            </span>
            <span style={{ color: 'var(--danger)' }}>
              📉 Despesas: <strong>{formatCurrency(transactions.filter(t => t.type === 'expense').reduce((s, t) => s + parseFloat(t.amount || 0), 0))}</strong>
            </span>
          </div>

          {/* Transactions List */}
          {txLoading ? (
            <div className="page-loading"><div className="loading-spinner" /></div>
          ) : filteredTransactions.length === 0 ? (
            <div className="empty-state">
              <Receipt size={48} />
              <h3>{search ? 'Nenhuma transação encontrada' : 'Nenhuma transação registrada'}</h3>
              <p>Clique em "Nova Transação" para adicionar a primeira</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Tipo</th>
                    <th>Categoria</th>
                    <th>Descrição</th>
                    <th>Valor</th>
                    <th>Pagamento</th>
                    <th>Status</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map(t => (
                    <tr key={t.id}>
                      <td style={{ whiteSpace: 'nowrap', fontSize: 13 }}>{formatDate(t.transactionDate)}</td>
                      <td>
                        <span className={`movement-type ${t.type === 'income' ? 'movement-in' : 'movement-out'}`}>
                          {t.type === 'income' ? '📈 Receita' : '📉 Despesa'}
                        </span>
                      </td>
                      <td style={{ fontSize: 13 }}>{t.category}</td>
                      <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {t.description}
                      </td>
                      <td style={{
                        fontWeight: 700,
                        color: t.type === 'income' ? 'var(--success)' : 'var(--danger)'
                      }}>
                        {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                      </td>
                      <td style={{ fontSize: 13 }}>{t.paymentMethod || '—'}</td>
                      <td>
                        <span className={`badge ${STATUS_COLORS[t.status] || 'badge-gray'}`}>
                          {STATUS_LABELS[t.status]}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button className="btn-icon" title="Editar" onClick={() => handleEdit(t)}>
                            <Edit2 size={16} />
                          </button>
                          <button className="btn-icon btn-icon-danger" title="Excluir"
                            onClick={() => setDeleteId(t.id)}>
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
        </>
      )}

      {/* ── FORM MODAL ───────────────────────────────────────── */}
      {showForm && (
        <div className="modal-overlay" onClick={() => { if (!saving) setShowForm(false); }}>
          <div className="modal modal-lg" style={{ maxWidth: 580 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              {form.type === 'income' ? <TrendingUp size={24} style={{ color: 'var(--success)' }} /> : <TrendingDown size={24} style={{ color: 'var(--danger)' }} />}
              <h3>{editing ? 'Editar Transação' : 'Nova Transação'}</h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Type selector */}
              <div style={{ display: 'flex', gap: 8, padding: 4, background: 'var(--gray-100)', borderRadius: 'var(--radius-md)' }}>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, type: 'income', status: 'received' })}
                  style={{
                    flex: 1, padding: '8px 16px', border: 'none', borderRadius: 'var(--radius-sm)',
                    fontFamily: 'inherit', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer',
                    background: form.type === 'income' ? 'white' : 'transparent',
                    color: form.type === 'income' ? 'var(--success)' : 'var(--gray-600)',
                    boxShadow: form.type === 'income' ? 'var(--shadow-sm)' : 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
                  }}
                >
                  <TrendingUp size={16} /> Receita
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, type: 'expense', status: 'paid' })}
                  style={{
                    flex: 1, padding: '8px 16px', border: 'none', borderRadius: 'var(--radius-sm)',
                    fontFamily: 'inherit', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer',
                    background: form.type === 'expense' ? 'white' : 'transparent',
                    color: form.type === 'expense' ? 'var(--danger)' : 'var(--gray-600)',
                    boxShadow: form.type === 'expense' ? 'var(--shadow-sm)' : 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
                  }}
                >
                  <TrendingDown size={16} /> Despesa
                </button>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label>Categoria *</label>
                  <select name="category" value={form.category} onChange={handleChange}>
                    <option value="">Selecione...</option>
                    {(categories[form.type] || []).map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Data *</label>
                  <input type="date" name="transactionDate" value={form.transactionDate} onChange={handleChange} />
                </div>
              </div>

              <div className="form-group">
                <label>Descrição *</label>
                <input name="description" value={form.description} onChange={handleChange}
                  placeholder="Ex: Compra de peças para estoque" />
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label>Valor (R$) *</label>
                  <input type="number" step="0.01" min="0" name="amount" value={form.amount}
                    onChange={handleChange} placeholder="0,00" />
                </div>
                <div className="form-group">
                  <label>Forma de Pagamento</label>
                  <select name="paymentMethod" value={form.paymentMethod} onChange={handleChange}>
                    <option value="">Selecione...</option>
                    {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label>Status</label>
                  <select name="status" value={form.status} onChange={handleChange}>
                    <option value="pending">Pendente</option>
                    <option value={form.type === 'income' ? 'received' : 'paid'}>
                      {form.type === 'income' ? 'Recebido' : 'Pago'}
                    </option>
                    <option value="cancelled">Cancelado</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Observações</label>
                <textarea name="notes" value={form.notes} onChange={handleChange} rows={2}
                  placeholder="Informações adicionais..." />
              </div>
            </div>

            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                <Save size={18} /> {saving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── DELETE MODAL ─────────────────────────────────────── */}
      {deleteId && (
        <div className="modal-overlay" onClick={() => setDeleteId(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <AlertCircle size={24} className="text-danger" />
              <h3>Confirmar exclusão</h3>
            </div>
            <p>Tem certeza que deseja excluir esta transação?</p>
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
