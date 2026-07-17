import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { login } from '../api/auth';
import { Wrench, Eye, EyeOff, AlertCircle, Car, ChevronRight } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { loginUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await login(email, password);
      const { token } = res.data;
      const payload = JSON.parse(atob(token.split('.')[1]));
      loginUser(token, payload.user);
      const defaultRoute = payload.user?.role === 'technician' ? '/mechanics' : '/dashboard';
      navigate(defaultRoute);
    } catch (err) {
      setError(err.response?.data?.msg || 'Erro ao fazer login. Verifique suas credenciais.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* Background decoration */}
      <div className="login-bg-decor">
        <div className="login-bg-circle login-bg-circle-1" />
        <div className="login-bg-circle login-bg-circle-2" />
        <div className="login-bg-circle login-bg-circle-3" />
      </div>

      <div className="login-container">
        {/* Brand header - visible on mobile above card */}
        <div className="login-brand-mobile">
          <div className="login-brand-icon">
            <Wrench size={20} />
          </div>
          <span>CRM Garagem</span>
        </div>

        <div className="login-card">
          <div className="login-header">
            <div className="login-icon">
              <Car size={28} />
            </div>
            <h1>Bem-vindo</h1>
            <p>Faça login para acessar o sistema</p>
          </div>

          {error && (
            <div className="login-alert">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="login-form" noValidate>
            <div className="login-field">
              <label htmlFor="email">Email</label>
              <div className="login-input-wrapper">
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                  autoFocus
                  autoComplete="email"
                  inputMode="email"
                />
              </div>
            </div>

            <div className="login-field">
              <label htmlFor="password">Senha</label>
              <div className="login-input-wrapper">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Sua senha"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="login-password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  aria-label={showPassword ? 'Esconder senha' : 'Mostrar senha'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="login-submit"
              disabled={loading}
            >
              {loading ? (
                <span className="login-submit-loading">
                  <span className="login-spinner" />
                  Entrando...
                </span>
              ) : (
                <span className="login-submit-text">
                  Entrar
                  <ChevronRight size={18} />
                </span>
              )}
            </button>

            <div className="login-footer-links">
              <Link to="/forgot-password" className="login-link">
                Esqueci minha senha
              </Link>
            </div>
          </form>
        </div>

        <div className="login-footer-text">
          <span>Garagem do MEEC © {new Date().getFullYear()}</span>
        </div>
      </div>
    </div>
  );
}
