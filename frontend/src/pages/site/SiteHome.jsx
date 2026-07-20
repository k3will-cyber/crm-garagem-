import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Wrench, Shield, Clock, Award, ChevronRight, Star, Users, CheckCircle, ArrowRight, Play, Camera, ExternalLink } from 'lucide-react';

const galleryImages = [
  { title: 'Diagnóstico Computadorizado', desc: 'Utilizamos scanner profissional para diagnóstico preciso do seu veículo.', color: '#3b82f6', icon: '🔧' },
  { title: 'Troca de Óleo', desc: 'Óleos sintéticos e filtros de alta qualidade para maior vida do motor.', color: '#10b981', icon: '🛢️' },
  { title: 'Alinhamento e Balanceamento', desc: 'Equipamento de última geração para garantir a estabilidade do veículo.', color: '#8b5cf6', icon: '⚙️' },
  { title: 'Freios e Suspensão', desc: 'Diagnóstico completo com substituição de componentes originais.', color: '#f59e0b', icon: '🛞' },
  { title: 'Ar Condicionado', desc: 'Recarga de gás e manutenção do sistema de climatização.', color: '#ef4444', icon: '❄️' },
  { title: 'Revisão Programada', desc: 'Check-up completo seguindo rigorosamente o plano do fabricante.', color: '#06b6d4', icon: '📋' },
];

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

      {/* Garagem em Ação Section */}
      <section className="site-section site-garage-section">
        <div className="site-container">
          <div className="site-section-header">
            <h2>🔧 A Garagem em Ação</h2>
            <p>Veja como cuidamos do seu veículo com excelência e dedicação</p>
          </div>
          <div className="site-garage-grid">
            {galleryImages.map((item, i) => (
              <div key={i} className="site-garage-card" style={{ '--card-color': item.color }}>
                <div className="site-garage-card-image" style={{ background: `linear-gradient(135deg, ${item.color}15, ${item.color}08)` }}>
                  <span className="site-garage-card-icon">{item.icon}</span>
                </div>
                <div className="site-garage-card-content">
                  <h3>{item.title}</h3>
                  <p>{item.desc}</p>
                </div>
                <div className="site-garage-card-hover">
                  <Camera size={20} />
                  <span>Ver Fotos</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Programa de Parceiros CTA */}
      <section className="site-section site-partners-cta-section">
        <div className="site-container">
          <div className="site-partners-cta-card">
            <div className="site-partners-cta-content">
              <h2>🎯 Programa de Parceiros MEEC</h2>
              <p>Seja um parceiro oficial da Garagem do MEEC e transforme sua paixão por carros em negócio!</p>
              <div className="site-partners-cta-features">
                <span><CheckCircle size={16} /> Comissão exclusiva por indicação</span>
                <span><CheckCircle size={16} /> Descontos especiais para parceiros</span>
                <span><CheckCircle size={16} /> Acesso antecipado a promoções</span>
                <span><CheckCircle size={16} /> Suporte dedicado</span>
              </div>
              <Link to="/site/parceiros" className="site-btn site-btn-primary site-btn-lg">
                <ExternalLink size={20} /> Quero Ser Parceiro
              </Link>
            </div>
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
