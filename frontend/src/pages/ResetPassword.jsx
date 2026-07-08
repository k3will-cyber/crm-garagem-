import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { resetPassword } from '../api/auth';
import {
  Wrench, Key, CheckCircle, AlertCircle, ArrowLeft,
  Eye, EyeOff, Lock
} from 'lucide-react';

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('As senhas não conferem');
      return;
    }
    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    setLoading(true);
    try {
      await resetPassword(token, password);
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      const msg = err.response?.data?.msg;
      if (msg?.includes('expired')) {
        setError('Este link de recuperação expirou. Solicite um novo.');
      } else if (msg?.includes('Invalid')) {
        setError('Link de recuperação inválido ou já utilizado.');
      } else {
        setError(msg || 'Erro ao redefinir senha');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="login-page">
        <div className="login-card">
          <div className="login-header">
            <div className="login-icon" style={{ background: 'var(--danger-light)', color: 'var(--danger)' }}>
              <AlertCircle size={32} />
            </div>
            <h1>Link Inválido</h1>
            <p>O link de recuperação não foi encontrado.</p>
          </div>
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <Link to="/forgot-password" className="btn btn-primary">
              Solicitar Novo Link
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <div className="login-icon" style={{ background: success ? 'var(--success-light)' : 'var(--primary-light)', color: success ? 'var(--success)' : 'var(--primary)' }}>
            {success ? <CheckCircle size={32} /> : <Lock size={32} />}
          </div>
          <h1>CRM Garagem</h1>
          <p>{success ? 'Senha redefinida!' : 'Redefinir senha'}</p>
        </div>

        {success ? (
          <>
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <h2 style={{ fontSize: '1.2rem', color: 'var(--gray-900)', marginBottom: 8 }}>
                ✅ Senha alterada com sucesso!
              </h2>
              <p style={{ color: 'var(--gray-500)', fontSize: '0.875rem', lineHeight: 1.6 }}>
                Sua senha foi redefinida. Você será redirecionado para o login em instantes.
              </p>
            </div>
            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <Link to="/login" className="btn btn-primary">
                Ir para o Login
              </Link>
            </div>
          </>
        ) : (
          <>
            {error && (
              <div className="alert alert-error">
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}

            <p style={{ color: 'var(--gray-500)', fontSize: '0.875rem', marginBottom: 20, lineHeight: 1.6 }}>
              Escolha uma nova senha para sua conta.
            </p>

            <form onSubmit={handleSubmit} className="login-form">
              <div className="form-group">
                <label htmlFor="password">Nova Senha</label>
                <div className="password-input">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    required
                    minLength={6}
                    autoFocus
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirmar Nova Senha</label>
                <div className="password-input">
                  <input
                    id="confirmPassword"
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repita a nova senha"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowConfirm(!showConfirm)}
                  >
                    {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button type="submit" className="btn btn-success btn-block" disabled={loading}>
                {loading ? 'Redefinindo...' : (
                  <>
                    <Key size={18} /> Redefinir Senha
                  </>
                )}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: 24 }}>
              <Link
                to="/login"
                style={{
                  color: 'var(--primary)', fontSize: '0.875rem',
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  fontWeight: 500
                }}
              >
                <ArrowLeft size={16} />
                Voltar para o login
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
