import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Send, CheckCircle, Phone, Mail, User, MessageSquare, Wrench } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function SiteLeadForm() {
  const [services, setServices] = useState([]);
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    serviceType: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Get service type from URL param
    const params = new URLSearchParams(window.location.search);
    const servico = params.get('servico');
    if (servico) {
      setForm(prev => ({ ...prev, serviceType: servico }));
    }

    // Fetch services for dropdown
    const fetchServices = async () => {
      try {
        const res = await fetch(`${API_URL}/public/services`);
        const data = await res.json();
        setServices(data);
      } catch (err) {
        console.error('Erro ao carregar serviços:', err);
      }
    };
    fetchServices();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.name.trim()) {
      setError('Por favor, informe seu nome.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/public/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.msg || 'Erro ao enviar solicitação');
      }

      setSubmitted(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <>
        <section className="site-page-header">
          <div className="site-container">
            <div className="site-breadcrumb">
              <Link to="/site">Início</Link>
              <ChevronRight size={14} />
              <span>Solicitar Orçamento</span>
            </div>
          </div>
        </section>
        <section className="site-section">
          <div className="site-container">
            <div className="site-success-card">
              <div className="site-success-icon">
                <CheckCircle size={48} />
              </div>
              <h2>Solicitação Recebida!</h2>
              <p>
                Obrigado, <strong>{form.name}</strong>! Recebemos sua solicitação de orçamento.
                Entraremos em contato em até <strong>24 horas</strong> pelo telefone ou email informado.
              </p>
              <div className="site-success-details">
                <p><strong>Serviço de interesse:</strong> {form.serviceType || 'Não especificado'}</p>
                <p><strong>Mensagem:</strong> {form.message || 'Nenhuma mensagem adicional'}</p>
              </div>
              <div className="site-success-actions">
                <Link to="/site" className="site-btn site-btn-outline">Voltar ao Início</Link>
                <Link to="/site/entrar" className="site-btn site-btn-primary">
                  Acompanhe sua OS <ChevronRight size={18} />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      {/* Page Header */}
      <section className="site-page-header site-page-header-sm">
        <div className="site-container">
          <div className="site-breadcrumb">
            <Link to="/site">Início</Link>
            <ChevronRight size={14} />
            <span>Solicitar Orçamento</span>
          </div>
          <h1>Solicitar Orçamento</h1>
          <p>Preencha o formulário abaixo e receba um orçamento personalizado</p>
        </div>
      </section>

      <section className="site-section">
        <div className="site-container">
          <div className="site-form-card">
            {error && <div className="site-alert site-alert-error">{error}</div>}

            <form onSubmit={handleSubmit} className="site-form">
              <div className="site-form-row">
                <div className="site-form-group">
                  <label>
                    <User size={16} />
                    Nome <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Seu nome completo"
                    required
                  />
                </div>
                <div className="site-form-group">
                  <label>
                    <Phone size={16} />
                    Telefone
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="(11) 99999-9999"
                  />
                </div>
              </div>

              <div className="site-form-row">
                <div className="site-form-group">
                  <label>
                    <Mail size={16} />
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="seu@email.com"
                  />
                </div>
                <div className="site-form-group">
                  <label>
                    <Wrench size={16} />
                    Tipo de Serviço
                  </label>
                  <select
                    name="serviceType"
                    value={form.serviceType}
                    onChange={handleChange}
                  >
                    <option value="">Selecione um serviço...</option>
                    {services.map(s => (
                      <option key={s.id} value={s.name}>{s.name}</option>
                    ))}
                    <option value="Outro">Outro</option>
                  </select>
                </div>
              </div>

              <div className="site-form-group">
                <label>
                  <MessageSquare size={16} />
                  Descreva o que precisa
                </label>
                <textarea
                  name="message"
                  value={form.message}
                  onChange={handleChange}
                  placeholder="Descreva o serviço que seu veículo precisa, modelo do carro, ano, etc."
                  rows={4}
                />
              </div>

              <button
                type="submit"
                className="site-btn site-btn-primary site-btn-lg site-btn-block"
                disabled={loading}
              >
                {loading ? (
                  <>Enviando...</>
                ) : (
                  <>
                    <Send size={20} />
                    Solicitar Orçamento
                  </>
                )}
              </button>
            </form>

            <div className="site-form-footer">
              <p>
                Ao enviar, você concorda com nossa política de privacidade.
                Seus dados estão seguros conosco.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
