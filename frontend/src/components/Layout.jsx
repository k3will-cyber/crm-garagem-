import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { useToast } from '../contexts/ToastContext';
import { useTheme } from '../contexts/ThemeContext';
import { getPendingPartRequestsCount } from '../api/partRequests';
import {
  LayoutDashboard,
  Users,
  Target,
  FileText,
  Wrench,
  Package,
  LogOut,
  Menu,
  X,
  User,
  ShoppingCart,
  Activity,
  UserCog,
  Moon,
  Sun,
  Store,
} from 'lucide-react';

const ExternalLinkIcon = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" y1="14" x2="21" y2="3" />
  </svg>
);

export default function Layout() {
  const { user, logout, hasRole, roleLabel } = useAuth();
  const { subscribe } = useSocket();
  const { addToast } = useToast();
  const { theme, toggleTheme, isDark } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [hasNewRequest, setHasNewRequest] = useState(false);

  // Fetch pending count
  const fetchPending = useCallback(async () => {
    try {
      const res = await getPendingPartRequestsCount();
      setPendingRequestsCount(res.data.count);
    } catch {}
  }, []);

  useEffect(() => {
    if (hasRole('manager')) {
      fetchPending();
      // Still poll as fallback
      const interval = setInterval(fetchPending, 30000);
      return () => clearInterval(interval);
    }
  }, [hasRole, fetchPending]);

  // Listen for real-time socket events
  useEffect(() => {
    if (!hasRole('manager') || !subscribe) return;

    // New part request notification
    const unsubNew = subscribe('new-part-request', (data) => {
      setPendingRequestsCount((prev) => prev + 1);
      setHasNewRequest(true);
      addToast(data.message, 'new_part_request', {
        title: '🛒 Nova Solicitação de Peça',
        duration: 6000
      });
    });

    // Part request decided (notify managers)
    const unsubDecided = subscribe('part-request-decided', (data) => {
      setPendingRequestsCount((prev) => Math.max(0, prev - 1));
      addToast(data.message, 'part_request_decided', {
        title: '📋 Solicitação Processada',
        duration: 5000
      });
    });

    return () => {
      unsubNew?.();
      unsubDecided?.();
    };
  }, [hasRole, subscribe, addToast, fetchPending]);

  // Clear new request indicator when visiting parts-store
  useEffect(() => {
    if (location.pathname === '/parts-store') {
      setHasNewRequest(false);
    }
  }, [location.pathname]);

  // Listen for technician's own request updates
  useEffect(() => {
    if (!subscribe) return;

    const unsubUpdated = subscribe('part-request-updated', (data) => {
      addToast(data.message, 'part_request_updated', {
        title: '📢 Solicitação Atualizada',
        duration: 6000
      });
    });

    return () => unsubUpdated?.();
  }, [subscribe, addToast]);

  const isManager = hasRole('manager');
  const isTechnician = user?.role === 'technician';

  const mainNavItems = isTechnician
    ? [
        { to: '/mechanics', label: 'Painel', icon: LayoutDashboard },
        { to: '/service-orders', label: 'Ordens de Serviço', icon: FileText },
        { to: '/parts-store', label: 'Loja de Peças', icon: ShoppingCart },
        { to: '/service-types', label: 'Tipos de Serviço', icon: Wrench },
      ]
    : [
        { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { to: '/clients', label: 'Clientes', icon: Users },
        { to: '/leads', label: 'Leads', icon: Target },
        { to: '/service-orders', label: 'Ordens de Serviço', icon: FileText },
        { to: '/service-types', label: 'Tipos de Serviço', icon: Wrench },
        { to: '/parts', label: 'Peças', icon: Package },
        { to: '/parts-store', label: 'Loja de Peças', icon: ShoppingCart, badge: pendingRequestsCount },
        { to: '/meec-stock', label: 'Estoque MEEC', icon: Store },
        { to: '/stock-movements', label: 'Histórico Estoque', icon: Activity },
        { to: '/users', label: 'Usuários', icon: UserCog },
      ];

  const externalLinks = [
    { href: '/meec-store', label: '🛒 Loja Pública MEEC', external: true },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="layout">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <Wrench size={24} />
            <span>CRM Garagem</span>
          </div>
          <button className="sidebar-close" onClick={() => setSidebarOpen(false)}>
            <X size={20} />
          </button>
        </div>

        <nav className="sidebar-nav">
          {mainNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/dashboard' || item.to === '/mechanics'}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
              {item.badge > 0 && (
                <span className="nav-badge">{item.badge}</span>
              )}
            </NavLink>
          ))}
          {isManager && externalLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="nav-item"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setSidebarOpen(false)}
            >
              <ExternalLinkIcon size={20} />
              <span>{link.label}</span>
            </a>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-user-avatar">
              <User size={16} />
            </div>
            <div className="sidebar-user-info">
              <span className="sidebar-user-name">{user?.name}</span>
              <span className="sidebar-user-role">{roleLabel?.[user?.role] || user?.role}</span>
            </div>
          </div>
          <div className="sidebar-theme-row">
            <button className="theme-toggle" onClick={toggleTheme} title={isDark ? 'Modo claro' : 'Modo escuro'}>
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
              <span>{isDark ? 'Modo Claro' : 'Modo Escuro'}</span>
            </button>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            <LogOut size={18} />
            <span>Sair</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="main-content">
        <header className="topbar">
          <button className="menu-toggle" onClick={() => setSidebarOpen(true)}>
            <Menu size={24} />
            {hasNewRequest && <span className="topbar-alert-dot" />}
          </button>
          <div className="topbar-title">
            <h1>CRM Garagem</h1>
          </div>
          <div className="topbar-user">
            <button className="theme-toggle topbar-theme-btn" onClick={toggleTheme} title={isDark ? 'Modo claro' : 'Modo escuro'}>
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <div className="topbar-user-avatar">
              <User size={16} />
            </div>
            <span>{user?.name}</span>
            <span className={`role-badge role-badge-sm role-${user?.role}`}>
              {roleLabel?.[user?.role] || user?.role}
            </span>
          </div>
        </header>

        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
