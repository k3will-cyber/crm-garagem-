import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getParts } from '../api/parts';
import { getPartRequests, createPartRequest, decidePartRequest } from '../api/partRequests';
import { getServiceOrders } from '../api/serviceOrders';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { useToast } from '../contexts/ToastContext';
import {
  Package, ShoppingCart, Search, Plus, Check, X,
  AlertTriangle, DollarSign, Clock, User, FileText,
  ThumbsUp, ThumbsDown, Send, List
} from 'lucide-react';

const statusColors = {
  pending: { label: 'Pendente', class: 'badge-yellow', color: '#f59e0b' },
  approved: { label: 'Aprovado', class: 'badge-green', color: '#10b981' },
  rejected: { label: 'Rejeitado', class: 'badge-red', color: '#ef4444' },
  fulfilled: { label: 'Retirado', class: 'badge-blue', color: '#3b82f6' },
};

export default function PartsStore() {
  const { user } = useAuth();
  const { subscribe } = useSocket();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const isManager = user?.role === 'admin' || user?.role === 'manager';

  const [parts, setParts] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState(isManager ? 'requests' : 'store');
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [requestForm, setRequestForm] = useState({ partId: '', quantity: 1, serviceOrderId: '', notes: '' });
  const [serviceOrders, setServiceOrders] = useState([]);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const [partsRes, requestsRes, osRes] = await Promise.all([
        getParts(),
        getPartRequests(),
        getServiceOrders(),
      ]);
      setParts(partsRes.data);
      setRequests(requestsRes.data);
      setServiceOrders(osRes.data.filter(o => ['draft', 'scheduled', 'in-progress'].includes(o.status)));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Real-time updates via socket
  useEffect(() => {
    if (!subscribe) return;

    const unsubNew = subscribe('new-part-request', () => {
      fetchData();
      if (isManager) {
        // Auto-switch to requests tab on new request
        setTab('requests');
      }
    });

    const unsubUpdated = subscribe('part-request-updated', () => {
      fetchData();
      addToast('Sua solicitação foi atualizada!', 'part_request_updated');
    });

    const unsubDecided = subscribe('part-request-decided', () => {
      fetchData();
    });

    return () => {
      unsubNew?.();
      unsubUpdated?.();
      unsubDecided?.();
    };
  }, [subscribe, fetchData, isManager, addToast]);

  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await createPartRequest({
        partId: parseInt(requestForm.partId),
        quantity: parseInt(requestForm.quantity),
        serviceOrderId: requestForm.serviceOrderId ? parseInt(requestForm.serviceOrderId) : null,
        notes: requestForm.notes
      });
      setShowRequestForm(false);
      setRequestForm({ partId: '', quantity: 1, serviceOrderId: '', notes: '' });
      fetchData();
    } catch (err) {
      setError(err.response?.data?.msg || 'Erro ao solicitar peça');
    }
  };

  const handleDecide = async (id, decision) => {
    try {
      await decidePartRequest(id, decision);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.msg || 'Erro ao processar solicitação');
    }
  };

  const filteredParts = parts.filter(p =>
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.sku?.toLowerCase().includes(search.toLowerCase()) ||
    p.supplier?.toLowerCase().includes(search.toLowerCase())
  );

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const myRequests = requests.filter(r => r.requestedBy === user?.id);

  if (loading) {
    return <div className="page-loading"><div className="loading-spinner" /></div>;
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2>🛒 Loja de Peças</h2>
          <p>Estoque interno disponível para solicitação</p>
        </div>
        {!isManager && (
          <button className="btn btn-primary" onClick={() => setShowRequestForm(true)}>
            <Plus size={18} /> Solicitar Peça
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="tabs">
        {isManager && (
          <button className={`tab ${tab === 'requests' ? 'active' : ''}`} onClick={() => setTab('requests')}>
            <List size={16} />
            Solicitações
            {pendingRequests.length > 0 && <span className="tab-badge">{pendingRequests.length}</span>}
          </button>
        )}
        <button className={`tab ${tab === 'store' ? 'active' : ''}`} onClick={() => setTab('store')}>
          <Package size={16} />
          Estoque
        </button>
        <button className={`tab ${tab === 'my-requests' ? 'active' : ''}`} onClick={() => setTab('my-requests')}>
          <Send size={16} />
          Minhas Solicitações
        </button>
      </div>

      {/* Tab: Pending Requests (Manager View) */}
      {tab === 'requests' && isManager && (
        <div>
          <h3 className="tab-section-title">
            Solicitações Pendentes
            {pendingRequests.length > 0 && <span className="badge badge-yellow">{pendingRequests.length} pendente(s)</span>}
          </h3>

          {pendingRequests.length === 0 ? (
            <div className="empty-state">
              <ThumbsUp size={48} />
              <h3>Nenhuma solicitação pendente</h3>
              <p>Todas as solicitações foram processadas</p>
            </div>
          ) : (
            <div className="requests-list">
              {pendingRequests.map(req => (
                <div key={req.id} className="request-card request-card-pending">
                  <div className="request-card-header">
                    <div className="request-part-info">
                      <strong>{req.part?.name}</strong>
                      <span className="text-muted">Qtd: {req.quantity}x</span>
                    </div>
                    <span className={`badge ${statusColors[req.status]?.class}`}>
                      {statusColors[req.status]?.label}
                    </span>
                  </div>
                  <div className="request-card-meta">
                    <span><User size={14} /> {req.requester?.name}</span>
                    {req.serviceOrder && <span><FileText size={14} /> {req.serviceOrder.orderNumber}</span>}
                    <span><Clock size={14} /> {new Date(req.createdAt).toLocaleString('pt-BR')}</span>
                  </div>
                  {req.notes && <p className="request-notes">{req.notes}</p>}
                  <div className="request-actions">
                    <button className="btn btn-sm btn-success" onClick={() => handleDecide(req.id, 'approved')}>
                      <ThumbsUp size={14} /> Aprovar
                    </button>
                    <button className="btn btn-sm btn-danger" onClick={() => handleDecide(req.id, 'rejected')}>
                      <ThumbsDown size={14} /> Rejeitar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Parts Store */}
      {tab === 'store' && (
        <div>
          <div className="search-bar">
            <Search size={18} />
            <input type="text" placeholder="Buscar peças por nome, SKU ou fornecedor..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>

          {filteredParts.length === 0 ? (
            <div className="empty-state">
              <Package size={48} />
              <h3>{search ? 'Nenhuma peça encontrada' : 'Nenhuma peça no estoque'}</h3>
              <p>{search ? 'Tente buscar por outro termo' : 'Gerencie as peças na página de Peças'}</p>
            </div>
          ) : (
            <div className="parts-store-grid">
              {filteredParts.map(part => {
                const isLowStock = part.stockQuantity <= part.minStockLevel;
                return (
                  <div key={part.id} className={`part-store-card ${isLowStock ? 'part-low-stock' : ''}`}>
                    <div className="part-store-header">
                      <h4>{part.name}</h4>
                      {part.sku && <span className="text-muted">SKU: {part.sku}</span>}
                    </div>
                    <div className="part-store-details">
                      <div className="part-store-price">
                        <DollarSign size={14} />
                        {Number(part.price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </div>
                      <div className={`part-store-stock ${isLowStock ? 'part-stock-low' : ''}`}>
                        <Package size={14} />
                        {part.stockQuantity} {isLowStock && <AlertTriangle size={12} className="text-danger" />}
                        {isLowStock && <span className="text-danger">(mín: {part.minStockLevel})</span>}
                      </div>
                    </div>
                    <button
                      className="btn btn-sm btn-primary btn-block"
                      disabled={part.stockQuantity <= 0}
                      onClick={() => {
                        setRequestForm({ partId: part.id, quantity: 1, serviceOrderId: '', notes: '' });
                        setShowRequestForm(true);
                      }}
                    >
                      <ShoppingCart size={14} />
                      {part.stockQuantity > 0 ? 'Solicitar' : 'Indisponível'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab: My Requests */}
      {tab === 'my-requests' && (
        <div>
          {(isManager ? requests : myRequests).length === 0 ? (
            <div className="empty-state">
              <Send size={48} />
              <h3>Nenhuma solicitação</h3>
              <p>Você ainda não fez nenhuma solicitação de peças</p>
            </div>
          ) : (
            <div className="requests-list">
              {(isManager ? requests : myRequests).map(req => (
                <div key={req.id} className={`request-card request-card-${req.status}`}>
                  <div className="request-card-header">
                    <div className="request-part-info">
                      <strong>{req.part?.name}</strong>
                      <span className="text-muted">Qtd: {req.quantity}x · {Number(req.part?.price || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                    </div>
                    <span className={`badge ${statusColors[req.status]?.class}`}>
                      {statusColors[req.status]?.label}
                    </span>
                  </div>
                  <div className="request-card-meta">
                    {!isManager && <span><User size={14} /> {req.requester?.name}</span>}
                    {req.serviceOrder && <span><FileText size={14} /> {req.serviceOrder.orderNumber}</span>}
                    <span><Clock size={14} /> {new Date(req.createdAt).toLocaleString('pt-BR')}</span>
                  </div>
                  {req.notes && <p className="request-notes">{req.notes}</p>}
                  {req.rejectionReason && (
                    <div className="request-rejection">
                      <X size={14} />
                      {req.rejectionReason}
                    </div>
                  )}
                  {req.approver && req.status !== 'pending' && (
                    <div className="request-approved-by">
                      <Check size={14} />
                      {req.status === 'fulfilled' ? 'Aprovado' : 'Processado'} por {req.approver.name}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Request Form Modal */}
      {showRequestForm && (
        <div className="modal-overlay" onClick={() => setShowRequestForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <ShoppingCart size={20} />
              <h3>Solicitar Peça</h3>
            </div>
            {error && <div className="alert alert-error"><span>{error}</span></div>}
            <form onSubmit={handleRequestSubmit}>
              <div className="form-group">
                <label>Peça</label>
                <select
                  value={requestForm.partId}
                  onChange={(e) => setRequestForm({ ...requestForm, partId: e.target.value })}
                  required
                >
                  <option value="">Selecione uma peça...</option>
                  {parts.filter(p => p.stockQuantity > 0).map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} - {Number(p.price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} ({p.stockQuantity} em estoque)
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Quantidade</label>
                <input type="number" min="1" value={requestForm.quantity} onChange={(e) => setRequestForm({ ...requestForm, quantity: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Ordem de Serviço (opcional)</label>
                <select value={requestForm.serviceOrderId} onChange={(e) => setRequestForm({ ...requestForm, serviceOrderId: e.target.value })}>
                  <option value="">Sem OS vinculada</option>
                  {serviceOrders.map(os => (
                    <option key={os.id} value={os.id}>{os.orderNumber} - {os.client?.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Observações</label>
                <textarea value={requestForm.notes} onChange={(e) => setRequestForm({ ...requestForm, notes: e.target.value })} rows={2} placeholder="Motivo da solicitação..." />
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowRequestForm(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">
                  <Send size={18} /> Solicitar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
