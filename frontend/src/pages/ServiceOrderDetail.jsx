import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getServiceOrder, updateServiceOrderStatus } from '../api/serviceOrders';
import api from '../api/axios';
import { useToast } from '../contexts/ToastContext';
import { ArrowLeft, Edit2, Printer, Share2, MessageCircle, CheckCircle, XCircle, Send, Clock, AlertCircle, Copy, RefreshCw, Bell, BellOff, DollarSign, User } from 'lucide-react';

const statusColors = {
  draft: 'badge-gray',
  scheduled: 'badge-blue',
  'in-progress': 'badge-yellow',
  completed: 'badge-green',
  delivered: 'badge-green',
  cancelled: 'badge-red',
};

const statusLabels = {
  draft: 'Rascunho',
  scheduled: 'Agendado',
  'in-progress': 'Em Andamento',
  completed: 'Concluído',
  delivered: 'Entregue',
  cancelled: 'Cancelado',
};

const priorityLabels = {
  low: 'Baixa',
  medium: 'Média',
  high: 'Alta',
};

const statusFlow = ['draft', 'scheduled', 'in-progress', 'completed', 'delivered'];

export default function ServiceOrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusLoading, setStatusLoading] = useState(false);
  const [error, setError] = useState('');
  const [shareInfo, setShareInfo] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareLoading, setShareLoading] = useState(false);
  const [notifLoading, setNotifLoading] = useState(false);

  const fetchOrder = async () => {
    try {
      const res = await getServiceOrder(id);
      setOrder(res.data);
    } catch (err) {
      setError('Erro ao carregar ordem de serviço');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const handleStatusChange = async (newStatus) => {
    setStatusLoading(true);
    try {
      await updateServiceOrderStatus(id, newStatus);
      fetchOrder();
    } catch (err) {
      setError(err.response?.data?.msg || 'Erro ao atualizar status');
    } finally {
      setStatusLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const loadShareInfo = async () => {
    setShareLoading(true);
    try {
      const shareRes = await api.get(`/service-orders/${id}/share-info`);
      setShareInfo(shareRes.data);
    } catch (err) {
      addToast('Erro ao carregar link de compartilhamento', 'error');
    } finally {
      setShareLoading(false);
    }
  };

  const openShareModal = async () => {
    setShowShareModal(true);
    setShareInfo(null);
    await loadShareInfo();
  };

  const regenerateToken = async () => {
    setShareLoading(true);
    try {
      await api.patch(`/service-orders/${id}/share-token`);
      await loadShareInfo();
      addToast('Novo link gerado com sucesso!', 'success');
    } catch (err) {
      addToast('Erro ao gerar novo link', 'error');
    } finally {
      setShareLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    addToast('Link copiado!', 'success');
  };

  const handleToggleNotifications = async () => {
    setNotifLoading(true);
    try {
      const res = await api.patch(`/service-orders/${id}/toggle-notifications`);
      setOrder(prev => ({ ...prev, notifyClient: res.data.notifyClient }));
      addToast(
        res.data.notifyClient ? '🔔 Notificações ativadas' : '🔕 Notificações desativadas',
        res.data.notifyClient ? 'success' : 'info'
      );
    } catch (err) {
      addToast('Erro ao alterar notificações', 'error');
    } finally {
      setNotifLoading(false);
    }
  };

  const getNextStatus = () => {
    if (!order) return null;
    const idx = statusFlow.indexOf(order.status);
    if (idx >= 0 && idx < statusFlow.length - 1) {
      return statusFlow[idx + 1];
    }
    return null;
  };

  const getStatusActions = () => {
    const actions = [];
    if (order.status === 'draft') {
      actions.push({ status: 'scheduled', label: 'Agendar', icon: Send, variant: 'btn-primary' });
    } else if (order.status === 'scheduled') {
      actions.push({ status: 'in-progress', label: 'Iniciar', icon: Clock, variant: 'btn-primary' });
      actions.push({ status: 'cancelled', label: 'Cancelar', icon: XCircle, variant: 'btn-danger' });
    } else if (order.status === 'in-progress') {
      actions.push({ status: 'completed', label: 'Concluir', icon: CheckCircle, variant: 'btn-success' });
    } else if (order.status === 'completed') {
      actions.push({ status: 'delivered', label: 'Entregar', icon: Send, variant: 'btn-primary' });
    }
    return actions;
  };

  if (loading) {
    return (
      <div className="page-loading">
        <div className="loading-spinner" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="page">
        <div className="alert alert-error"><span>{error || 'Ordem não encontrada'}</span></div>
        <button className="btn btn-secondary" onClick={() => navigate('/service-orders')}>
          <ArrowLeft size={18} /> Voltar
        </button>
      </div>
    );
  }

  const statusActions = getStatusActions();

  return (
    <div className="page">
      <div className="page-header">
        <button className="btn btn-secondary" onClick={() => navigate('/service-orders')}>
          <ArrowLeft size={18} />
          Voltar
        </button>
        <div className="page-header-actions">
          <button className="btn btn-secondary" onClick={handlePrint}>
            <Printer size={18} />
            Imprimir
          </button>
          <button className="btn btn-secondary" onClick={openShareModal}>
            <Share2 size={18} />
            Compartilhar
          </button>
          <button className="btn btn-secondary" onClick={() => navigate(`/service-orders/${id}/edit`)}>
            <Edit2 size={18} />
            Editar
          </button>
        </div>
      </div>

      {/* Order Header */}
      <div className="detail-card">
        <div className="detail-card-header">
          <div>
            <h2>{order.orderNumber}</h2>
            <p className="text-muted">Criada em {new Date(order.createdAt).toLocaleDateString('pt-BR')}</p>
          </div>
          <div className="detail-status-group">
            <span className={`badge ${statusColors[order.status]}`}>{statusLabels[order.status]}</span>
            <span className={`priority-badge priority-${order.priority}`}>
              {priorityLabels[order.priority]}
            </span>
            <button
              className={`btn-icon ${order.notifyClient !== false ? 'btn-icon-success' : ''}`}
              onClick={handleToggleNotifications}
              disabled={notifLoading}
              title={order.notifyClient !== false ? 'Notificações ao cliente: Ativadas' : 'Notificações ao cliente: Desativadas'}
            >
              {order.notifyClient !== false ? <Bell size={16} /> : <BellOff size={16} />}
            </button>
          </div>
        </div>

        {/* Status Actions */}
        {statusActions.length > 0 && (
          <div className="status-actions">
            {statusActions.map((action) => (
              <button
                key={action.status}
                className={`btn ${action.variant}`}
                onClick={() => handleStatusChange(action.status)}
                disabled={statusLoading}
              >
                <action.icon size={18} />
                {statusLoading ? '...' : action.label}
              </button>
            ))}
          </div>
        )}

        <div className="detail-grid">
          <div className="detail-section">
            <h3>Informações do Cliente</h3>
            <div className="detail-field">
              <span className="detail-label">Nome</span>
              <span className="detail-value">{order.client?.name || '—'}</span>
            </div>
            {order.client?.phone && (
              <div className="detail-field">
                <span className="detail-label">Telefone</span>
                <span className="detail-value">{order.client.phone}</span>
              </div>
            )}
            {order.client?.email && (
              <div className="detail-field">
                <span className="detail-label">Email</span>
                <span className="detail-value">{order.client.email}</span>
              </div>
            )}
          </div>

          <div className="detail-section">
            <h3>Informações do Serviço</h3>
            <div className="detail-field">
              <span className="detail-label">Tipo de Serviço</span>
              <span className="detail-value">{order.serviceType?.name || '—'}</span>
            </div>
            {order.scheduledDate && (
              <div className="detail-field">
                <span className="detail-label">Agendado para</span>
                <span className="detail-value">
                  {new Date(order.scheduledDate).toLocaleString('pt-BR')}
                </span>
              </div>
            )}
            {order.completionDate && (
              <div className="detail-field">
                <span className="detail-label">Concluído em</span>
                <span className="detail-value">
                  {new Date(order.completionDate).toLocaleString('pt-BR')}
                </span>
              </div>
            )}
          </div>
        </div>

        {order.description && (
          <div className="detail-section">
            <h3>Descrição</h3>
            <p>{order.description}</p>
          </div>
        )}

        {order.notes && (
          <div className="detail-section">
            <h3>Observações</h3>
            <p>{order.notes}</p>
          </div>
        )}

        {/* Items */}
        {/* Mechanic & Commission */}
        {order.commission > 0 && (
          <div className="detail-section">
            <h3>💰 Comissão do Mecânico</h3>
            <div className="detail-field">
              <span className="detail-label">
                <User size={14} style={{ marginRight: 4 }} />
                Mecânico Responsável
              </span>
              <span className="detail-value">{order.mechanic?.name || order['mechanic.name'] || '—'}</span>
            </div>
            <div className="detail-field">
              <span className="detail-label">
                <DollarSign size={14} style={{ marginRight: 4 }} />
                Comissão (30%)
              </span>
              <span className="detail-value" style={{ color: 'var(--success)', fontWeight: 700 }}>
                {Number(order.commission).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </span>
            </div>
            <div className="detail-field">
              <span className="detail-label">Valor Total da OS</span>
              <span className="detail-value">
                {Number(order.totalAmount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </span>
            </div>
          </div>
        )}

        {order.items && order.items.length > 0 && (
          <div className="detail-section">
            <h3>Peças Utilizadas</h3>
            <table className="table">
              <thead>
                <tr>
                  <th>Peça</th>
                  <th>Quantidade</th>
                  <th>Preço Unit.</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item) => (
                  <tr key={item.id}>
                    <td>{item.part?.name || 'Peça #' + item.partId}</td>
                    <td>{item.quantity}</td>
                    <td>{Number(item.unitPrice).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                    <td>{Number(item.totalPrice).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan="3" className="text-right"><strong>Valor Total</strong></td>
                  <td>
                    <strong>
                      {Number(order.totalAmount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </strong>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="modal-overlay" onClick={() => setShowShareModal(false)}>
          <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <Share2 size={20} />
              <h3>Compartilhar {order.orderNumber}</h3>
            </div>

            {shareInfo ? (
              <div className="share-modal-content">
                <p className="text-muted" style={{ marginBottom: 16 }}>
                  Compartilhe este link com o cliente para que ele acompanhe o status da OS em tempo real.
                </p>

                <div className="share-link-box">
                  <input
                    type="text"
                    value={shareInfo.shareUrl}
                    readOnly
                    onClick={(e) => e.target.select()}
                  />
                  <button className="btn btn-sm btn-secondary" onClick={() => copyToClipboard(shareInfo.shareUrl)}>
                    <Copy size={14} />
                  </button>
                </div>

                <div className="share-actions">
                  <a
                    href={shareInfo.whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-success btn-block"
                  >
                    <MessageCircle size={20} />
                    Compartilhar no WhatsApp
                  </a>
                </div>

                <div className="share-footer">
                  <button
                    className="btn btn-sm btn-secondary"
                    onClick={regenerateToken}
                    disabled={shareLoading}
                  >
                    <RefreshCw size={14} />
                    {shareLoading ? 'Gerando...' : 'Gerar novo link'}
                  </button>
                  <span className="text-muted">
                    O link antigo será invalidado.
                  </span>
                </div>
              </div>
            ) : (
              <div className="share-loading">
                <div className="loading-spinner" />
                <p>Carregando link...</p>
              </div>
            )}

            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowShareModal(false)}>
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
