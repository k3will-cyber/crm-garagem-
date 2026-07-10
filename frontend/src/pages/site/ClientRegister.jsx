import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, Eye, EyeOff, ChevronRight, User } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function ClientRegister() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', phone: '', email: '', password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.name || !form.email || !form.password) {
      setError('Preencha todos os campos obrigatórios.');
      return;
    }

    if (form.password.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres.');
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError('As senhas não conferem.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/public/client/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          phone: form.phone,
          email: form.email,
          password: form.password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.msg || 'Erro ao cadastrar');
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
            <Link to="/site/entrar">Portal do Cliente</Link>
            <ChevronRight size={14} />
            <span>Cadastro</span>
          </div>
          <h1>Criar Conta</h1>
          <p>Cadastre-se para acompanhar suas ordens de serviço</p>
        </div>
      </section>

      <section className="site-section">
        <div className="site-container">
          <div className="site-auth-card">
            <div className="site-auth-icon">
              <User size={32} />
            </div>
            <h2>Cadastro</h2>

            {error && <div className="site-alert site-alert-error">{error}</div>}

            <form onSubmit={handleSubmit} className="site-form">
              <div className="site-form-group">
                <label>Nome <span className="required">*</span></label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Seu nome completo"
                  required
                />
              </div>
              <div className="site-form-row">
                <div className="site-form-group">
                  <label>Telefone</label>
                  <input
                    type="tel"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="(11) 99999-9999"
                  />
                </div>
                <div className="site-form-group">
                  <label>Email <span className="required">*</span></label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="seu@email.com"
                    required
                  />
                </div>
              </div>
              <div className="site-form-row">
                <div className="site-form-group">
                  <label>Senha <span className="required">*</span></label>
                  <div className="site-password-input">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={form.password}
                      onChange={handleChange}
                      placeholder="Mínimo 6 caracteres"
                      required
                      minLength={6}
                    />
                  </div>
                </div>
                <div className="site-form-group">
                  <label>Confirmar Senha <span className="required">*</span></label>
                  <div className="site-password-input">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      value={form.confirmPassword}
                      onChange={handleChange}
                      placeholder="Repita a senha"
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
              </div>
              <button
                type="submit"
                className="site-btn site-btn-primary site-btn-block"
                disabled={loading}
              >
                {loading ? 'Cadastrando...' : <><UserPlus size={18} /> Criar Conta</>}
              </button>
            </form>

            <div className="site-auth-footer">
              <p>Já tem conta? <Link to="/site/entrar">Faça login</Link></p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
