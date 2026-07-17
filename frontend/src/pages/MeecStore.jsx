import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import {
  Wrench, Search, Package, ShoppingCart, Phone, MapPin,
  Clock, ChevronRight, Star, X, Filter, ChevronDown,
  Truck, Shield, CreditCard, CheckCircle, AlertCircle
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const CATEGORY_LABELS = {
  oleo: '🛢️ Óleo', filtro: '🔧 Filtro', freio: '🛞 Freio',
  ignicao: '⚡ Ignição', iluminacao: '💡 Iluminação', correia: '⛓️ Correia',
  bateria: '🔋 Bateria', suspensao: '🏎️ Suspensão', arrefecimento: '🌡️ Arrefecimento',
  diversos: '🧰 Diversos', kit: '📦 Kit', motor: '🔩 Motor',
  cambio: '⚙️ Câmbio', direcao: '🛞 Direção', geral: '📦 Geral', servico: '🔧 Serviço'
};

const CATEGORY_COLORS = {
  oleo: '#FF9F0A', filtro: '#0A84FF', freio: '#30D158', ignicao: '#BF5AF2',
  iluminacao: '#F5C800', correia: '#5AC8FA', bateria: '#34C759',
  suspensao: '#FF9F0A', arrefecimento: '#0A84FF',
  diversos: '#8E8E93', kit: '#FF9F0A', motor: '#FF453A',
  cambio: '#BF5AF2', direcao: '#5AC8FA', geral: '#636366', servico: '#0A84FF'
};

const CATEGORY_ICONS = {
  oleo: '🛢️', filtro: '🔧', freio: '🛞', ignicao: '⚡',
  iluminacao: '💡', correia: '⛓️', bateria: '🔋',
  suspensao: '🏎️', arrefecimento: '🌡️', diversos: '🧰',
  kit: '📦', motor: '🔩', cambio: '⚙️', direcao: '🛞',
  geral: '📦', servico: '🔧'
};

function formatPrice(value) {
  return Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function MeecStore() {
  const [products, setProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showMobileFilter, setShowMobileFilter] = useState(false);
  const [sortBy, setSortBy] = useState('name');
  const [selectedProduct, setSelectedProduct] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const [prodRes, catRes, sumRes] = await Promise.all([
        axios.get(`${API_URL}/public/meec-stock`),
        axios.get(`${API_URL}/public/meec-stock/meta/categorias`),
        axios.get(`${API_URL}/public/meec-stock/meta/summary`),
      ]);
      setProducts(prodRes.data);
      setAllProducts(prodRes.data);
      setCategories(catRes.data);
      setSummary(sumRes.data);
    } catch (err) {
      console.error('Erro ao carregar loja:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = useMemo(() => {
    let result = [...allProducts];

    if (search) {
      const s = search.toLowerCase();
      result = result.filter(p =>
        p.nome?.toLowerCase().includes(s) ||
        p.descricao?.toLowerCase().includes(s) ||
        p.categoria?.toLowerCase().includes(s)
      );
    }

    if (categoryFilter) {
      result = result.filter(p => p.categoria === categoryFilter);
    }

    switch (sortBy) {
      case 'name': result.sort((a, b) => a.nome?.localeCompare(b.nome)); break;
      case 'price-asc': result.sort((a, b) => (a.preco || 0) - (b.preco || 0)); break;
      case 'price-desc': result.sort((a, b) => (b.preco || 0) - (a.preco || 0)); break;
      case 'stock': result.sort((a, b) => (b.quantidade || 0) - (a.quantidade || 0)); break;
    }

    return result;
  }, [allProducts, search, categoryFilter, sortBy]);

  const handleWhatsApp = (product) => {
    const msg = encodeURIComponent(
      `Olá! Tenho interesse no produto: ${product.nome} - ${formatPrice(product.preco)}\n\n` +
      `(via Loja MEEC)`
    );
    window.open(`https://wa.me/5561981257477?text=${msg}`, '_blank');
  };

  const handleContact = () => {
    window.open('https://wa.me/5561981257477?text=Olá! Gostaria de saber mais sobre os produtos da Garagem do MEEC.', '_blank');
  };

  if (loading) {
    return (
      <div className="store-page">
        <div className="store-loading">
          <div className="store-loading-spinner" />
          <p>Carregando loja...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="store-page">
      {/* Top Bar */}
      <div className="store-topbar">
        <div className="store-topbar-content">
          <span className="store-topbar-item">
            <MapPin size={14} /> R. 102, Jardim Ceu Azul — Valparaíso de Goiás · GO
          </span>
          <span className="store-topbar-item">
            <Clock size={14} /> Seg–Sex 8h–18h · Sáb 8h–12h
          </span>
          <span className="store-topbar-item">
            <Phone size={14} /> (61) 98125-7477
          </span>
        </div>
      </div>

      {/* Header / Navigation */}
      <header className="store-header">
        <div className="store-header-content">
          <a href="/" className="store-logo" onClick={(e) => { e.preventDefault(); window.location.href = '/meec-store'; }}>
            <Wrench size={28} />
            <span>Garagem do <strong>MEEC</strong></span>
          </a>
          <nav className="store-nav">
            <a href="#produtos" className="store-nav-link active" onClick={(e) => { e.preventDefault(); document.getElementById('produtos')?.scrollIntoView({ behavior: 'smooth' }); }}>
              Produtos
            </a>
            <a href="#sobre" className="store-nav-link" onClick={(e) => { e.preventDefault(); document.getElementById('sobre')?.scrollIntoView({ behavior: 'smooth' }); }}>
              Sobre
            </a>
            <button className="store-nav-cta" onClick={handleContact}>
              <Phone size={16} /> Fale Conosco
            </button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="store-hero">
        <div className="store-hero-bg" />
        <div className="store-hero-content">
          <div className="store-hero-text">
            <h1>
              Peças Automotivas<br />
              <span className="store-hero-highlight">de Qualidade</span>
            </h1>
            <p>
              Encontre tudo que seu carro precisa na Garagem do MEEC.
              Óleos, filtros, freios, suspensão e muito mais com os melhores preços.
            </p>
            <div className="store-hero-stats">
              <div className="store-hero-stat">
                <Package size={24} />
                <strong>{summary?.total || 0}</strong>
                <span>Produtos</span>
              </div>
              <div className="store-hero-stat">
                <Truck size={24} />
                <strong>Pronta</strong>
                <span>Entrega</span>
              </div>
              <div className="store-hero-stat">
                <Shield size={24} />
                <strong>Garantia</strong>
                <span>Qualidade</span>
              </div>
            </div>
          </div>
          <div className="store-hero-card">
            <ShoppingCart size={32} />
            <h3>Como Comprar?</h3>
            <p>Veja nossos produtos e entre em contato pelo WhatsApp. Fazemos orçamento personalizado para você!</p>
            <div className="store-hero-card-features">
              <span><CheckCircle size={16} /> Catálogo completo de peças</span>
              <span><CheckCircle size={16} /> Preços atualizados</span>
              <span><CheckCircle size={16} /> Estoque real em tempo real</span>
              <span><CheckCircle size={16} /> Atendimento via WhatsApp</span>
            </div>
            <button className="store-btn store-btn-primary store-btn-block" onClick={handleContact} style={{ marginTop: 20 }}>
              <Phone size={18} /> Fale Conosco no WhatsApp
            </button>
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section id="produtos" className="store-products-section">
        <div className="store-container">
          <div className="store-section-header">
            <h2>Nossos Produtos</h2>
            <p>Confira nosso catálogo completo de peças automotivas</p>
          </div>

          {/* Category Pills */}
          <div className="store-category-pills">
            <button
              className={`store-category-pill ${!categoryFilter ? 'active' : ''}`}
              onClick={() => setCategoryFilter('')}
            >
              🏷️ Todos
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                className={`store-category-pill ${categoryFilter === cat ? 'active' : ''}`}
                onClick={() => setCategoryFilter(cat)}
                style={categoryFilter === cat ? {
                  background: `${CATEGORY_COLORS[cat] || '#636366'}20`,
                  color: CATEGORY_COLORS[cat] || '#636366',
                  borderColor: CATEGORY_COLORS[cat] || '#636366'
                } : {}}
              >
                {CATEGORY_ICONS[cat] || '📦'} {CATEGORY_LABELS[cat] || cat}
              </button>
            ))}
          </div>

          {/* Search & Sort */}
          <div className="store-toolbar">
            <div className="store-search">
              <Search size={18} />
              <input
                type="text"
                placeholder="Buscar produtos..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              {search && (
                <button className="store-search-clear" onClick={() => setSearch('')}>
                  <X size={16} />
                </button>
              )}
            </div>
            <div className="store-sort">
              <Filter size={16} />
              <select value={sortBy} onChange={e => setSortBy(e.target.value)}>
                <option value="name">Nome</option>
                <option value="price-asc">Menor Preço</option>
                <option value="price-desc">Maior Preço</option>
                <option value="stock">Estoque</option>
              </select>
            </div>
            <button className="store-filter-btn" onClick={() => setShowMobileFilter(!showMobileFilter)}>
              <Filter size={16} /> Categorias <ChevronDown size={14} />
            </button>
          </div>

          {/* Mobile Filter */}
          {showMobileFilter && (
            <div className="store-mobile-filter">
              <button
                className={`store-category-pill ${!categoryFilter ? 'active' : ''}`}
                onClick={() => { setCategoryFilter(''); setShowMobileFilter(false); }}
              >
                🏷️ Todos
              </button>
              {categories.map(cat => (
                <button
                  key={cat}
                  className={`store-category-pill ${categoryFilter === cat ? 'active' : ''}`}
                  onClick={() => { setCategoryFilter(cat); setShowMobileFilter(false); }}
                  style={categoryFilter === cat ? {
                    background: `${CATEGORY_COLORS[cat] || '#636366'}20`,
                    color: CATEGORY_COLORS[cat] || '#636366',
                    borderColor: CATEGORY_COLORS[cat] || '#636366'
                  } : {}}
                >
                  {CATEGORY_ICONS[cat] || '📦'} {CATEGORY_LABELS[cat] || cat}
                </button>
              ))}
            </div>
          )}

          {/* Summary Bar */}
          {summary && (
            <div className="store-summary-bar">
              <span><Package size={16} /> {filtered.length} de {allProducts.length} produtos</span>
              <span><CreditCard size={16} /> Valor total em estoque: {formatPrice(summary.valorEstoque)}</span>
            </div>
          )}

          {/* Products Grid */}
          {filtered.length === 0 ? (
            <div className="store-empty">
              <Package size={64} />
              <h3>Nenhum produto encontrado</h3>
              <p>Tente ajustar os filtros ou buscar por outro termo</p>
              <button className="store-btn store-btn-outline" onClick={() => { setSearch(''); setCategoryFilter(''); }}>
                Limpar Filtros
              </button>
            </div>
          ) : (
            <div className="store-products-grid">
              {filtered.map(product => {
                const color = CATEGORY_COLORS[product.categoria] || '#636366';
                const inStock = product.quantidade > 0;
                const lowStock = product.quantidade > 0 && product.quantidade <= 5;
                return (
                  <div
                    key={product.id}
                    className="store-product-card"
                    onClick={() => setSelectedProduct(product)}
                  >
                    {/* Category Badge */}
                    <div className="store-product-category" style={{ background: `${color}15`, color }}>
                      {CATEGORY_ICONS[product.categoria] || '📦'} {CATEGORY_LABELS[product.categoria] || product.categoria}
                    </div>

                    {/* Icon Area */}
                    <div className="store-product-icon">
                      <span style={{ fontSize: '2.5rem' }}>{CATEGORY_ICONS[product.categoria] || '📦'}</span>
                    </div>

                    {/* Info */}
                    <div className="store-product-info">
                      <h3>{product.nome}</h3>
                      {product.descricao && (
                        <p className="store-product-desc">{product.descricao}</p>
                      )}
                    </div>

                    {/* Price & Stock */}
                    <div className="store-product-footer">
                      <div className="store-product-price">
                        <strong>{formatPrice(product.preco)}</strong>
                      </div>
                      <div className="store-product-stock">
                        {inStock ? (
                          lowStock ? (
                            <span className="store-stock-low">
                              <AlertCircle size={14} /> Apenas {product.quantidade} und.
                            </span>
                          ) : (
                            <span className="store-stock-ok">
                              <CheckCircle size={14} /> Em estoque
                            </span>
                          )
                        ) : (
                          <span className="store-stock-out">
                            <X size={14} /> Indisponível
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="store-product-actions">
                      <button
                        className="store-btn store-btn-sm store-btn-primary"
                        style={{ flex: 1 }}
                        onClick={(e) => { e.stopPropagation(); handleWhatsApp(product); }}
                      >
                        <Phone size={14} /> Consultar
                      </button>
                      <button
                        className="store-btn store-btn-sm store-btn-outline"
                        onClick={(e) => { e.stopPropagation(); setSelectedProduct(product); }}
                      >
                        Detalhes
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Load More / End */}
          {filtered.length > 0 && (
            <div className="store-products-end">
              <span>Mostrando {filtered.length} produto{filtered.length !== 1 ? 's' : ''}</span>
            </div>
          )}
        </div>
      </section>

      {/* About Section */}
      <section id="sobre" className="store-about-section">
        <div className="store-container">
          <div className="store-section-header">
            <h2>Sobre a Garagem do MEEC</h2>
            <p>Conheça nossa história e compromisso com a qualidade</p>
          </div>
          <div className="store-about-grid">
            <div className="store-about-card">
              <Shield size={32} />
              <h3>Qualidade Garantida</h3>
              <p>Trabalhamos com marcas reconhecidas e garantimos a procedência de todas as peças.</p>
            </div>
            <div className="store-about-card">
              <Truck size={32} />
              <h3>Entrega Rápida</h3>
              <p>Entregamos para toda a região. Consulte prazos e taxas no momento da compra.</p>
            </div>
            <div className="store-about-card">
              <Star size={32} />
              <h3>Profissionais Expert</h3>
              <p>Equipe especializada pronta para ajudar na escolha da peça certa para seu veículo.</p>
            </div>
            <div className="store-about-card">
              <CreditCard size={32} />
              <h3>Melhores Preços</h3>
              <p>Preços competitivos e condições especiais de pagamento à vista ou parcelado.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="store-cta-section">
        <div className="store-container">
          <div className="store-cta-card">
            <h2>Não encontrou o que precisa?</h2>
            <p>Entre em contato conosco! Fazemos encomendas especiais e damos todo o suporte necessário.</p>
            <button className="store-btn store-btn-primary store-btn-lg" onClick={handleContact}>
              <Phone size={20} /> Fale Conosco no WhatsApp
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="store-footer">
        <div className="store-footer-content">
          <div className="store-footer-main">
            <div className="store-footer-col">
              <div className="store-footer-logo">
                <Wrench size={20} />
                <span>Garagem do <strong>MEEC</strong></span>
              </div>
              <p className="store-footer-desc">
                Sua oficina e loja de peças automotivas de confiança. Qualidade e preço justo para cuidar do seu carro.
              </p>
            </div>
            <div className="store-footer-col">
              <h4>Horários</h4>
              <ul className="store-footer-list">
                <li><Clock size={14} /> Seg–Sex: 8h às 18h</li>
                <li><Clock size={14} /> Sáb: 8h às 12h</li>
                <li><X size={14} /> Dom: Fechado</li>
              </ul>
            </div>
            <div className="store-footer-col">
              <h4>Contato</h4>
              <ul className="store-footer-list">
                <li><Phone size={14} /> (61) 98125-7477</li>
                <li><MapPin size={14} /> R. 102, Jardim Ceu Azul</li>
                <li>Valparaíso de Goiás · GO, 72871-102</li>
              </ul>
            </div>
            <div className="store-footer-col">
              <h4>Links</h4>
              <ul className="store-footer-list">
                <li><a href="#produtos">Produtos</a></li>
                <li><a href="#sobre">Sobre Nós</a></li>
                <li><button className="store-footer-btn" onClick={handleContact}>Fale Conosco</button></li>
              </ul>
            </div>
          </div>
          <div className="store-footer-bottom">
            <p>© 2026 Garagem do MEEC. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div className="store-modal-overlay" onClick={() => setSelectedProduct(null)}>
          <div className="store-modal" onClick={e => e.stopPropagation()}>
            <button className="store-modal-close" onClick={() => setSelectedProduct(null)}>
              <X size={20} />
            </button>
            <div className="store-modal-body">
              <div className="store-modal-icon">
                <span style={{ fontSize: '4rem' }}>{CATEGORY_ICONS[selectedProduct.categoria] || '📦'}</span>
              </div>
              <div className="store-modal-info">
                <div className="store-modal-category-badge" style={{
                  background: `${CATEGORY_COLORS[selectedProduct.categoria] || '#636366'}20`,
                  color: CATEGORY_COLORS[selectedProduct.categoria] || '#636366'
                }}>
                  {CATEGORY_LABELS[selectedProduct.categoria] || selectedProduct.categoria}
                </div>
                <h2>{selectedProduct.nome}</h2>
                {selectedProduct.descricao && <p className="store-modal-desc">{selectedProduct.descricao}</p>}
                <div className="store-modal-price">
                  <span className="store-modal-price-label">Preço</span>
                  <strong>{formatPrice(selectedProduct.preco)}</strong>
                </div>
                <div className="store-modal-stock">
                  <span className="store-modal-stock-label">Disponibilidade</span>
                  {selectedProduct.quantidade > 0 ? (
                    <span className="store-stock-ok">
                      <CheckCircle size={16} /> {selectedProduct.quantidade} unidades em estoque
                    </span>
                  ) : (
                    <span className="store-stock-out">
                      <X size={16} /> Indisponível no momento
                    </span>
                  )}
                </div>
                <button className="store-btn store-btn-primary store-btn-block" onClick={() => { handleWhatsApp(selectedProduct); setSelectedProduct(null); }}>
                  <Phone size={18} /> Consultar Preço pelo WhatsApp
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
