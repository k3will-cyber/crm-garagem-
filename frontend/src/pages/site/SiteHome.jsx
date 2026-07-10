import React from 'react';
import { Link } from 'react-router-dom';
import { Wrench, Shield, Clock, Award, ChevronRight, Star, Users, CheckCircle, ArrowRight } from 'lucide-react';

const services = [
  { icon: Wrench, title: 'Troca de Óleo', desc: 'Óleo sintético e filtros de alta qualidade para maior durabilidade do motor.' },
  { icon: Shield, title: 'Revisão Completa', desc: 'Check-up completo de 50 itens para garantir a segurança do seu veículo.' },
  { icon: Clock, title: 'Freios & Suspensão', desc: 'Diagnóstico preciso e substituição de pastilhas, discos e amortecedores.' },
  { icon: Award, title: 'Injeção Eletrônica', desc: 'Scanner profissional para diagnóstico e reparo do sistema de injeção.' },
];

const testimonials = [
  { name: 'Carlos Silva', text: 'Excelente atendimento! Meu carro ficou como novo depois da revisão completa. Super recomendo!', rating: 5 },
  { name: 'Ana Oliveira', text: 'Sempre levo meu carro aqui. Preço justo e serviço de qualidade. O acompanhamento pelo site é um diferencial!', rating: 5 },
  { name: 'Roberto Santos', text: 'Troca de óleo rápida e eficiente. A equipe é muito profissional e atenciosa.', rating: 5 },
];

const stats = [
  { icon: Wrench, value: '500+', label: 'Serviços Realizados' },
  { icon: Users, value: '200+', label: 'Clientes Atendidos' },
  { icon: Star, value: '4.9', label: 'Avaliação Média' },
  { icon: Clock, value: '8+', label: 'Anos de Experiência' },
];

export default function SiteHome() {
  return (
    <>
      {/* Hero Section */}
      <section className="site-hero">
        <div className="site-hero-bg" />
        <div className="site-hero-content">
          <div className="site-hero-text">
            <h1>
              Sua Oficina Mecânica
              <span className="site-hero-highlight"> de Confiança</span>
            </h1>
            <p>
              Cuidamos do seu veículo com profissionalismo e transparência.
              Acompanhe cada etapa do serviço em tempo real pelo nosso portal.
            </p>
            <div className="site-hero-actions">
              <Link to="/site/solicitar-orcamento" className="site-btn site-btn-primary">
                Solicitar Orçamento
                <ArrowRight size={20} />
              </Link>
              <Link to="/site/servicos" className="site-btn site-btn-outline">
                Nossos Serviços
              </Link>
            </div>
          </div>
          <div className="site-hero-image">
            <div className="site-hero-card">
              <Wrench size={32} />
              <h3>Acompanhamento Online</h3>
              <p>Receba atualizações em tempo real sobre o serviço do seu veículo</p>
              <div className="site-hero-card-features">
                <span><CheckCircle size={14} /> Notificações por email</span>
                <span><CheckCircle size={14} /> Status em tempo real</span>
                <span><CheckCircle size={14} /> Histórico completo</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="site-section site-stats">
        <div className="site-container">
          <div className="site-stats-grid">
            {stats.map((stat, i) => (
              <div key={i} className="site-stat-card">
                <stat.icon size={32} />
                <strong>{stat.value}</strong>
                <span>{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="site-section site-services-section">
        <div className="site-container">
          <div className="site-section-header">
            <h2>Nossos Serviços</h2>
            <p>Soluções completas para manutenção do seu veículo</p>
          </div>
          <div className="site-services-grid">
            {services.map((svc, i) => (
              <div key={i} className="site-service-card">
                <div className="site-service-icon">
                  <svc.icon size={28} />
                </div>
                <h3>{svc.title}</h3>
                <p>{svc.desc}</p>
              </div>
            ))}
          </div>
          <div className="site-section-cta">
            <Link to="/site/servicos" className="site-btn site-btn-outline">
              Ver Todos os Serviços <ChevronRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="site-section site-testimonials">
        <div className="site-container">
          <div className="site-section-header">
            <h2>O Que Nossos Clientes Dizem</h2>
            <p>A satisfação dos nossos clientes é a nossa maior recompensa</p>
          </div>
          <div className="site-testimonials-grid">
            {testimonials.map((t, i) => (
              <div key={i} className="site-testimonial-card">
                <div className="site-testimonial-stars">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} size={16} fill="#f59e0b" color="#f59e0b" />
                  ))}
                </div>
                <p>"{t.text}"</p>
                <div className="site-testimonial-author">
                  <div className="site-testimonial-avatar">
                    {t.name.charAt(0)}
                  </div>
                  <strong>{t.name}</strong>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="site-section site-cta-section">
        <div className="site-container">
          <div className="site-cta-card">
            <h2>Solicite seu Orçamento Agora</h2>
            <p>Preencha o formulário online e receba um orçamento personalizado em até 24 horas.</p>
            <Link to="/site/solicitar-orcamento" className="site-btn site-btn-primary site-btn-lg">
              Solicitar Orçamento <ArrowRight size={22} />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
