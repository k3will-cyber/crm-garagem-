import React, { useState, useEffect } from 'react';
import { getUsers, createUser, updateUser, deleteUser, resetUserPassword } from '../api/users';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import {
  Users as UsersIcon, Plus, Search, Edit2, UserX,
  Shield, User, Wrench, AlertCircle, X, Save, Key
} from 'lucide-react';

const roleConfig = {
  admin: { label: 'Admin', icon: Shield, color: '#ef4444', bg: '#fef2f2' },
  manager: { label: 'Gerente', icon: User, color: '#f59e0b', bg: '#fffbeb' },
  technician: { label: 'Mecânico', icon: Wrench, color: '#3b82f6', bg: '#eff6ff' },
};

export default function Users() {
  const { user: currentUser } = useAuth();
  const { addToast } = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resettingUser, setResettingUser] = useState(null);
  const [resetForm, setResetForm] = useState({ password: '', confirmPassword: '' });
  const [resetting, setResetting] = useState(false);
  const [form, setForm] = useState({
    name: '', email: '', password: '', role: 'technician', phone: '', specialty: ''
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchUsers = async () => {
    try {
      const res = await getUsers();
      setUsers(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleEdit = (u) => {
    setEditingUser(u.id);
    setForm({
      name: u.name, email: u.email, password: '',
      role: u.role, phone: u.phone || '', specialty: u.specialty || ''
    });
    setShowForm(true);
    setError('');
  };

  const handleNew = () => {
    setEditingUser(null);
    setForm({ name: '', email: '', password: '', role: 'technician', phone: '', specialty: '' });
    setShowForm(true);
    setError('');
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (editingUser) {
        const updateData = { ...form };
        if (!updateData.password) delete updateData.password;
        await updateUser(editingUser, updateData);
      } else {
        await createUser(form);
      }
      setShowForm(false);
      setEditingUser(null);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.msg || 'Erro ao salvar usuário');
    } finally {
      setSaving(false);
    }
  };

  const handleResetPassword = (u) => {
    setResettingUser(u);
    setResetForm({ password: '', confirmPassword: '' });
    setError('');
    setShowResetModal(true);
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    if (resetForm.password !== resetForm.confirmPassword) {
      setError('As senhas não conferem');
      return;
    }
    if (resetForm.password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      return;
    }
    setResetting(true);
    setError('');
    try {
      await resetUserPassword(resettingUser.id, { password: resetForm.password });
      addToast(`Senha de ${resettingUser.name} foi resetada com sucesso!`, 'success');
      setShowResetModal(false);
      setResettingUser(null);
    } catch (err) {
      setError(err.response?.data?.msg || 'Erro ao resetar senha');
    } finally {
      setResetting(false);
    }
  };

  const handleDeactivate = async (id, name) => {
    if (!window.confirm(`Desativar usuário "${name}"?`)) return;
    try {
      await deleteUser(id);
      fetchUsers();
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = users.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return <div className="page-loading"><div className="loading-spinner" /></div>;
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2>Usuários</h2>
          <p>{users.length} usuário(s) cadastrado(s)</p>
        </div>
        <button className="btn btn-primary" onClick={handleNew}>
          <Plus size={18} /> Novo Usuário
        </button>
      </div>

      <div className="search-bar">
        <Search size={18} />
        <input type="text" placeholder="Buscar por nome ou email..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {/* User Form Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingUser ? 'Editar Usuário' : 'Novo Usuário'}</h3>
              <button className="btn-icon" onClick={() => setShowForm(false)}>
                <X size={20} />
              </button>
            </div>

            {error && <div className="alert alert-error"><span>{error}</span></div>}

            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Nome *</label>
                  <input name="name" value={form.name} onChange={handleChange} required placeholder="Nome completo" />
                </div>
                <div className="form-group">
                  <label>Email *</label>
                  <input name="email" type="email" value={form.email} onChange={handleChange} required placeholder="email@exemplo.com" />
                </div>
                <div className="form-group">
                  <label>Senha {editingUser && '(deixe em branco para manter)'}</label>
                  <input name="password" type="password" value={form.password} onChange={handleChange} placeholder={editingUser ? 'Nova senha...' : 'Senha'} required={!editingUser} />
                </div>
                <div className="form-group">
                  <label>Função</label>
                  <select name="role" value={form.role} onChange={handleChange} disabled={currentUser?.id === editingUser}>
                    <option value="technician">Mecânico</option>
                    <option value="manager">Gerente</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Telefone</label>
                  <input name="phone" value={form.phone} onChange={handleChange} placeholder="(11) 99999-9999" />
                </div>
                <div className="form-group">
                  <label>Especialidade</label>
                  <input name="specialty" value={form.specialty} onChange={handleChange} placeholder="Ex: Motor, Suspensão, Elétrica" />
                </div>
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  <Save size={18} /> {saving ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {showResetModal && resettingUser && (
        <div className="modal-overlay" onClick={() => { setShowResetModal(false); setError(''); }}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <Key size={20} style={{ color: 'var(--success)' }} />
              <h3>Resetar Senha</h3>
              <button className="btn-icon" style={{ marginLeft: 'auto' }} onClick={() => { setShowResetModal(false); setError(''); }}>
                <X size={20} />
              </button>
            </div>

            <p style={{ marginBottom: 20 }}>
              Resetando senha para <strong>{resettingUser.name}</strong> ({resettingUser.email})
            </p>

            {error && <div className="alert alert-error"><AlertCircle size={16} /><span>{error}</span></div>}

            {!resetting && (
              <form onSubmit={handleResetSubmit}>
                <div className="form-group">
                  <label>Nova Senha</label>
                  <input
                    type="password"
                    value={resetForm.password}
                    onChange={(e) => setResetForm({ ...resetForm, password: e.target.value })}
                    placeholder="Mínimo 6 caracteres"
                    required
                    autoFocus
                  />
                </div>
                <div className="form-group">
                  <label>Confirmar Nova Senha</label>
                  <input
                    type="password"
                    value={resetForm.confirmPassword}
                    onChange={(e) => setResetForm({ ...resetForm, confirmPassword: e.target.value })}
                    placeholder="Repita a nova senha"
                    required
                  />
                </div>
                <div className="form-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => { setShowResetModal(false); setError(''); }}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-success">
                    <Key size={16} /> Resetar Senha
                  </button>
                </div>
              </form>
            )}

            {resetting && (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <div className="loading-spinner" style={{ margin: '0 auto 12px' }} />
                <p className="text-muted">Resetando senha...</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Users List */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Email</th>
              <th>Função</th>
              <th>Telefone</th>
              <th>Especialidade</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(u => {
              const RoleIcon = roleConfig[u.role]?.icon || User;
              const roleColor = roleConfig[u.role]?.color;
              const roleBg = roleConfig[u.role]?.bg;
              return (
                <tr key={u.id}>
                  <td>
                    <div className="user-name-cell">
                      <div className="user-avatar-sm" style={{ backgroundColor: roleBg, color: roleColor }}>
                        <RoleIcon size={14} />
                      </div>
                      <span>{u.name}</span>
                    </div>
                  </td>
                  <td className="text-muted">{u.email}</td>
                  <td>
                    <span className="role-badge" style={{ backgroundColor: roleBg, color: roleColor }}>
                      {roleConfig[u.role]?.label || u.role}
                    </span>
                  </td>
                  <td>{u.phone || '—'}</td>
                  <td>{u.specialty || '—'}</td>
                  <td>
                    <span className={`badge ${u.isActive ? 'badge-green' : 'badge-gray'}`}>
                      {u.isActive ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn-icon" title="Editar" onClick={() => handleEdit(u)}>
                        <Edit2 size={16} />
                      </button>
                      {currentUser?.role === 'admin' && (
                        <button className="btn-icon btn-icon-success" title="Resetar Senha" onClick={() => handleResetPassword(u)}>
                          <Key size={16} />
                        </button>
                      )}
                      {u.id !== currentUser?.id && u.isActive && (
                        <button className="btn-icon btn-icon-danger" title="Desativar" onClick={() => handleDeactivate(u.id, u.name)}>
                          <UserX size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
