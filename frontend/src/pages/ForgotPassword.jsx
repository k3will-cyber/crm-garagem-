import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { forgotPassword } from '../api/auth';
import { Wrench, Mail, ArrowLeft, CheckCircle, AlertCircle, Send } from 'lucide-react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [token, setToken] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await forgotPassword(email);
      setSent(true);
      // Show token in dev (returned by backend for convenience)
      if (res.data?.token) {
        setToken(res.data.token);
      }
    } catch (err) {
      setError(err.response?.data?.msg || 'Erro ao processar solicitação');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <div className="login-icon">
            <Wrench size={32} />
          </div>
          <h1>CRM Garagem</h1>
          <p>Recuperação de senha</p>
        </div>

        {!sent ? (
          <>
            {error && (
              <div className="alert alert-error">
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}

            <p style={{ color: 'var(--gray-500)', fontSize: '0.875rem', marginBottom: 20, lineHeight: 1.6 }}>
              Digite seu email cadastrado e enviaremos um link para redefinir sua senha.
            </p>

            <form onSubmit={handleSubmit} className="login-form">
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                  autoFocus
                />
              </div>

              <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                {loading ? (
                  'Enviando...'
                ) : (
                  <>
                    <Send size={18} /> Enviar Link de Recuperação
                  </>
                )}
              </button>
            </form>
          </>
        ) : (
          <>
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{
                width: 64, height: 64, borderRadius: 16,
                background: 'var(--success-light)', color: 'var(--success)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 16px'
              }}>
                <CheckCircle size={32} />
              </div>
              <h2 style={{ fontSize: '1.2rem', color: 'var(--gray-900)', marginBottom: 8 }}>
                Email Enviado!
              </h2>
              <p style={{ color: 'var(--gray-500)', fontSize: '0.875rem', lineHeight: 1.6 }}>
                Se o email <strong>{email}</strong> estiver cadastrado em nosso sistema,
                você receberá um link para redefinir sua senha em breve.
              </p>
              <p style={{ color: 'var(--gray-400)', fontSize: '0.8rem', marginTop: 12, lineHeight: 1.5 }}>
                Não esqueça de verificar sua caixa de spam. O link expira em <strong>1 hora</strong>.
              </p>
            </div>

            {token && (
              <div style={{
                marginTop: 16, padding: 16,
                background: 'var(--gray-50)', borderRadius: 'var(--radius-md)',
                border: '1px solid var(--gray-200)'
              }}>
                <p style={{ fontSize: '0.8rem', color: 'var(--gray-500)', marginBottom: 8, fontWeight: 600 }}>
                  🔧 Modo Desenvolvimento
                </p>
                <p style={{ fontSize: '0.82rem', color: 'var(--gray-600)', marginBottom: 8 }}>
                  Token de reset (copie para testar):
                </p>
                <code style={{
                  display: 'block', padding: 10, fontSize: '0.78rem',
                  background: 'var(--gray-100)', borderRadius: 'var(--radius-sm)',
                  color: 'var(--gray-700)', wordBreak: 'break-all',
                  fontFamily: 'monospace'
                }}>
                  {token}
                </code>
                <div style={{ marginTop: 12 }}>
                  <Link
                    to={`/reset-password/${token}`}
                    className="btn btn-success btn-block"
                    style={{ textAlign: 'center', justifyContent: 'center' }}
                  >
                    Redefinir Senha Agora
                  </Link>
                </div>
              </div>
            )}
          </>
        )}

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
      </div>
    </div>
  );
}
