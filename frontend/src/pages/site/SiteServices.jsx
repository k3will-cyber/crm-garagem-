import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Wrench, ChevronRight, Clock, DollarSign, Shield, CheckCircle, ArrowRight } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const serviceIcons = {
  'Troca de Óleo': '🛢️',
  'Revisão': '🔧',
  'Freios': '🛞',
  'Suspensão': '🏎️',
  'Ar Condicionado': '❄️',
  'Elétrica': '⚡',
  'Motor': '🔩',
  'Injeção Eletrônica': '💻',
  'Alinhamento': '📐',
  'Balanceamento': '⚖️',
  'Embreagem': '🔄',
  'Cambio': '⚙️',
  '': '🔧',
};

export default function SiteServices() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await fetch(`${API_URL}/public/services`);
        const data = await res.json();
        setServices(data);
      } catch (err) {
        console.error('Erro ao carregar serviços:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchServices();
  }, []);

  return (
    <>
      {/* Page Header */}
      <section className="site-page-header">
        <div className="site-container">
          <div className="site-breadcrumb">
            <Link to="/site">Início</Link>
            <ChevronRight size={14} />
            <span>Serviços</span>
          </div>
          <h1>Nossos Serviços</h1>
          <p>Conheça todos os serviços que oferecemos para cuidar do seu veículo</p>
        </div>
      </section>

      {/* Services Grid */}
      <section className="site-section">
        <div className="site-container">
          {loading ? (
            <div className="site-loading">
              <div className="loading-spinner" />
              <p>Carregando serviços...</p>
            </div>
          ) : services.length === 0 ? (
            <div className="site-empty">
              <Wrench size={48} />
              <h3>Serviços em breve</h3>
              <p>Nossos serviços estão sendo cadastrados. Volte em breve!</p>
            </div>
          ) : (
            <div className="site-services-full-grid">
              {services.map(svc => (
                <div key={svc.id} className="site-service-full-card">
                  <div className="site-service-full-icon">
                    <span style={{ fontSize: 36 }}>{serviceIcons[svc.name] || serviceIcons['']}</span>
                  </div>
                  <div className="site-service-full-info">
                    <h3>{svc.name}</h3>
                    {svc.description && <p>{svc.description}</p>}
                    <div className="site-service-full-meta">
                      <span className="site-service-full-price">
                        a partir de {Number(svc.basePrice).toLocaleString('pt-BR', {
                          style: 'currency',
                          currency: 'BRL'
                        })}
                      </span>
                    </div>
                    <Link
                      to={`/site/solicitar-orcamento?servico=${encodeURIComponent(svc.name)}`}
                      className="site-btn site-btn-sm site-btn-primary"
                    >
                      Solicitar <ArrowRight size={16} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="site-section site-why-section">
        <div className="site-container">
          <div className="site-section-header">
            <h2>Por que escolher a CRM Garagem?</h2>
          </div>
          <div className="site-why-grid">
            <div className="site-why-card">
              <Shield size={28} />
              <h3>Garantia nos Serviços</h3>
              <p>Todos os serviços realizados têm garantia de 3 meses ou 5.000 km.</p>
            </div>
            <div className="site-why-card">
              <Clock size={28} />
              <h3>Pontualidade</h3>
              <p>Respeitamos o prazo combinado. Seu tempo é valioso para nós.</p>
            </div>
            <div className="site-why-card">
              <CheckCircle size={28} />
              <h3>Transparência Total</h3>
              <p>Acompanhe o status do serviço em tempo real pelo nosso portal.</p>
            </div>
            <div className="site-why-card">
              <DollarSign size={28} />
              <h3>Preço Justo</h3>
              <p>Orçamento detalhado sem surpresas. Você só paga pelo que foi aprovado.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="site-section site-cta-section">
        <div className="site-container">
          <div className="site-cta-card">
            <h2>Precisa de um serviço específico?</h2>
            <p>Solicite um orçamento personalizado para o seu veículo.</p>
            <Link to="/site/solicitar-orcamento" className="site-btn site-btn-primary site-btn-lg">
              Solicitar Orçamento <ArrowRight size={22} />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
