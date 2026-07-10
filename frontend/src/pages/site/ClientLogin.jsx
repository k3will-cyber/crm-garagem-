import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogIn, Eye, EyeOff, ChevronRight, User } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function ClientLogin() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.email || !form.password) {
      setError('Preencha todos os campos.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/public/client/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.msg || 'Erro ao fazer login');
      }

      localStorage.setItem('client_token', data.token);
      localStorage.setItem('client_data', JSON.stringify(data.client));
      navigate('/site/minha-conta');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <section className="site-page-header site-page-header-sm">
        <div className="site-container">
          <div className="site-breadcrumb">
            <Link to="/site">Início</Link>
            <ChevronRight size={14} />
            <span>Portal do Cliente</span>
          </div>
          <h1>Portal do Cliente</h1>
          <p>Faça login para acompanhar suas ordens de serviço</p>
        </div>
      </section>

      <section className="site-section">
        <div className="site-container">
          <div className="site-auth-card">
            <div className="site-auth-icon">
              <User size={32} />
            </div>
            <h2>Entrar</h2>

            {error && <div className="site-alert site-alert-error">{error}</div>}

            <form onSubmit={handleSubmit} className="site-form">
              <div className="site-form-group">
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="seu@email.com"
                  required
                />
              </div>
              <div className="site-form-group">
                <label>Senha</label>
                <div className="site-password-input">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Sua senha"
                    required
                  />
                  <button
                    type="button"
                    className="site-password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <button
                type="submit"
                className="site-btn site-btn-primary site-btn-block"
                disabled={loading}
              >
                {loading ? 'Entrando...' : <><LogIn size={18} /> Entrar</>}
              </button>
            </form>

            <div className="site-auth-footer">
              <p>Ainda não tem conta? <Link to="/site/cadastrar">Cadastre-se</Link></p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
