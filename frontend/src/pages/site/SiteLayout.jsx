import React from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { Wrench, Menu, X, Phone, Mail, MapPin } from 'lucide-react';

const navLinks = [
  { path: '/site', label: 'Início' },
  { path: '/site/servicos', label: 'Serviços' },
  { path: '/site/solicitar-orcamento', label: 'Solicitar Orçamento' },
  { path: '/site/parceiros', label: 'Programa de Parceiros' },
];

export default function SiteLayout({ children }) {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = React.useState(false);

  const isActive = (path) => {
    if (path === '/site') return location.pathname === '/site';
    return location.pathname.startsWith(path);
  };

  return (
    <div className="site-wrapper">
      {/* Topbar with contact info */}
      <div className="site-topbar">
        <div className="site-topbar-content">
          <span className="site-topbar-item">
            <Phone size={14} />
            (11) 99999-9999
          </span>
          <span className="site-topbar-item">
            <Mail size={14} />
            contato@crmgaragem.com.br
          </span>
          <span className="site-topbar-item">
            <MapPin size={14} />
            Seg-Sex: 8h-18h | Sáb: 8h-12h
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="site-nav">
        <div className="site-nav-content">
          <Link to="/site" className="site-logo">
            <Wrench size={28} />
            <span>CRM Garagem</span>
          </Link>

          <button className="site-menu-btn" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          <div className={`site-nav-links ${menuOpen ? 'open' : ''}`}>
            {navLinks.map(link => (
              <Link
                key={link.path}
                to={link.path}
                className={`site-nav-link ${isActive(link.path) ? 'active' : ''}`}
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <Link to="/site/entrar" className="site-nav-cta">
              Portal do Cliente
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="site-main">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="site-footer">
        <div className="site-footer-content">
          <div className="site-footer-grid">
            <div className="site-footer-col">
              <div className="site-logo" style={{ marginBottom: 12 }}>
                <Wrench size={24} />
                <span>CRM Garagem</span>
              </div>
              <p className="site-footer-desc">
                Sua oficina de confiança. Trabalhamos com excelência para manter seu veículo em perfeito estado.
              </p>
            </div>
            <div className="site-footer-col">
              <h4>Horários</h4>
              <ul className="site-footer-list">
                <li>Seg - Sex: 8h às 18h</li>
                <li>Sábado: 8h às 12h</li>
                <li>Domingo: Fechado</li>
              </ul>
            </div>
            <div className="site-footer-col">
              <h4>Serviços</h4>
              <ul className="site-footer-list">
                <li>Troca de Óleo</li>
                <li>Revisão Completa</li>
                <li>Freios e Suspensão</li>
                <li>Injeção Eletrônica</li>
                <li>Ar Condicionado</li>
              </ul>
            </div>
            <div className="site-footer-col">
              <h4>Contato</h4>
              <ul className="site-footer-list">
                <li><Phone size={14} /> (11) 99999-9999</li>
                <li><Mail size={14} /> contato@crmgaragem.com.br</li>
                <li><MapPin size={14} /> São Paulo, SP</li>
              </ul>
            </div>
          </div>
          <div className="site-footer-bottom">
            <p>© {new Date().getFullYear()} CRM Garagem. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
