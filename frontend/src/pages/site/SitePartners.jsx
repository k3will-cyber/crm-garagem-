import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Wrench, Users, CheckCircle, ExternalLink,
  Gift, Star, Phone, Copy, Sparkles, Award,
  Smartphone
} from 'lucide-react';

const PARTNER_LINK = 'https://ai.studio/apps/99da1bef-f021-4cca-9047-ab1d1810104e';
const QR_API = 'https://api.qrserver.com/v1/create-qr-code';

const benefits = [
  { icon: Gift, title: 'Comissão Exclusiva', desc: 'Ganhe comissão por cada cliente indicado que realizar serviços conosco.' },
  { icon: Star, title: 'Descontos Especiais', desc: 'Acesso a preços especiais em peças e serviços para parceiros cadastrados.' },
  { icon: Sparkles, title: 'Acesso Antecipado', desc: 'Seja o primeiro a saber de promoções e lançamentos exclusivos.' },
  { icon: Users, title: 'Suporte Dedicado', desc: 'Canal direto com nossa equipe para garantir o melhor atendimento.' },
  { icon: Award, title: 'Reconhecimento', desc: 'Destaque em nosso site e redes sociais como parceiro oficial MEEC.' },
  { icon: Smartphone, title: 'App Exclusivo', desc: 'Acompanhe suas indicações e comissões em tempo real pelo app.' },
];

const steps = [
  { num: '1', title: 'Cadastre-se', desc: 'Preencha seus dados no formulário oficial do Programa de Parceiros.' },
  { num: '2', title: 'Compartilhe', desc: 'Divulgue seu link exclusivo de parceiro para amigos e familiares.' },
  { num: '3', title: 'Ganhe', desc: 'Receba comissões por cada cliente que chegar até nós através de você!' },
];

export default function SitePartners() {
  const [copied, setCopied] = useState(false);
  const [qrSize, setQrSize] = useState(300);

  useEffect(() => {
    // Adjust QR size for mobile
    const updateSize = () => {
      setQrSize(window.innerWidth < 480 ? 220 : 300);
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(PARTNER_LINK);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const textarea = document.createElement('textarea');
      textarea.value = PARTNER_LINK;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleWhatsAppShare = () => {
    const msg = encodeURIComponent(
      `🚀 Faça parte do Programa de Parceiros Oficial da Garagem do MEEC!\n\n` +
      `Ganhe comissões indicando amigos e familiares para nossa oficina.\n\n` +
      `📲 Cadastre-se agora: ${PARTNER_LINK}\n\n` +
      `#ParceiroMEEC #GaragemDoMEEC`
    );
    window.open(`https://wa.me/?text=${msg}`, '_blank');
  };

  const qrUrl = `${QR_API}?size=${qrSize}x${qrSize}&data=${encodeURIComponent(PARTNER_LINK)}&bgcolor=ffffff&margin=10`;

  return (
    <div className="partners-page">
      {/* Hero */}
      <section className="partners-hero">
        <div className="partners-hero-bg" />
        <div className="site-container">
          <div className="partners-hero-content">
            <div className="partners-hero-badge">
              <Award size={18} /> Programa Oficial
            </div>
            <h1>
              Seja um Parceiro <span className="partners-hero-highlight">MEEC</span>
            </h1>
            <p>
              Transforme sua indicação em benefícios! Junte-se ao Programa de Parceiros
              Oficial da Garagem do MEEC e ganhe comissões exclusivas.
            </p>
            <div className="partners-hero-stats">
              <div className="partners-hero-stat">
                <strong>10%</strong>
                <span>Comissão por indicação</span>
              </div>
              <div className="partners-hero-stat">
                <strong>24h</strong>
                <span>Aprovação rápida</span>
              </div>
              <div className="partners-hero-stat">
                <strong>✓</strong>
                <span>Sem fidelidade</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="site-section">
        <div className="site-container">
          <div className="site-section-header">
            <h2>🎯 Benefícios Exclusivos</h2>
            <p>Tudo que você ganha sendo um parceiro oficial MEEC</p>
          </div>
          <div className="partners-benefits-grid">
            {benefits.map((ben, i) => (
              <div key={i} className="partners-benefit-card">
                <div className="partners-benefit-icon">
                  <ben.icon size={24} />
                </div>
                <h3>{ben.title}</h3>
                <p>{ben.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="site-section partners-how-section">
        <div className="site-container">
          <div className="site-section-header">
            <h2>📋 Como Funciona</h2>
            <p>Em apenas 3 passos você começa a ganhar</p>
          </div>
          <div className="partners-steps">
            {steps.map((step, i) => (
              <div key={i} className="partners-step">
                <div className="partners-step-number">{step.num}</div>
                <div className="partners-step-content">
                  <h3>{step.title}</h3>
                  <p>{step.desc}</p>
                </div>
                {i < steps.length - 1 && <div className="partners-step-arrow" />}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* QR Code Section */}
      <section className="site-section partners-qr-section">
        <div className="site-container">
          <div className="partners-qr-grid">
            <div className="partners-qr-content">
              <h2>📲 Acesse o Programa de Parceiros</h2>
              <p>
                Escaneie o QR Code ou clique no link abaixo para se cadastrar
                no Programa de Parceiros Oficial da Garagem do MEEC.
              </p>

              <div className="partners-actions">
                <a
                  href={PARTNER_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="site-btn site-btn-primary site-btn-lg"
                >
                  <ExternalLink size={20} /> Acessar Plataforma
                </a>

                <button className="site-btn site-btn-secondary site-btn-lg" onClick={handleCopy}>
                  {copied ? <CheckCircle size={20} /> : <Copy size={20} />}
                  {copied ? 'Link Copiado!' : 'Copiar Link'}
                </button>
              </div>

              <button className="partners-whatsapp-btn" onClick={handleWhatsAppShare}>
                <Phone size={20} /> Compartilhar no WhatsApp
              </button>

              <div className="partners-link-display">
                <span>Link do Programa:</span>
                <code>{PARTNER_LINK}</code>
              </div>
            </div>

            <div className="partners-qr-code">
              <div className="partners-qr-card">
                <img
                  src={qrUrl}
                  alt="QR Code Programa de Parceiros MEEC"
                  width={qrSize}
                  height={qrSize}
                  style={{ borderRadius: 12 }}
                />
                <div className="partners-qr-label">
                  <Wrench size={16} />
                  <span>Garagem do MEEC</span>
                </div>
                <p className="partners-qr-sub">Escaneie para se cadastrar</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="site-section">
        <div className="site-container">
          <div className="partners-final-cta">
            <h2>💪 Não perca essa oportunidade!</h2>
            <p>
              Junte-se aos melhores parceiros da região e faça parte do sucesso
              da Garagem do MEEC.
            </p>
            <a
              href={PARTNER_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="site-btn site-btn-primary site-btn-lg"
            >
              <ExternalLink size={20} /> Quero Ser Parceiro Agora
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
