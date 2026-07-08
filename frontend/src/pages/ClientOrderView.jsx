import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Wrench, CheckCircle, Clock, AlertCircle, ArrowLeft, Calendar, ChevronRight, Mail } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const statusConfig = {
  draft: { label: 'Em análise', color: '#6b7280', bg: '#f3f4f6', icon: Clock },
  scheduled: { label: 'Agendado', color: '#2563eb', bg: '#eff6ff', icon: Calendar },
  'in-progress': { label: 'Em andamento', color: '#f59e0b', bg: '#fffbeb', icon: Clock },
  completed: { label: 'Concluído', color: '#10b981', bg: '#ecfdf5', icon: CheckCircle },
  delivered: { label: 'Entregue', color: '#059669', bg: '#ecfdf5', icon: CheckCircle },
  cancelled: { label: 'Cancelado', color: '#ef4444', bg: '#fef2f2', icon: AlertCircle },
};

const statusFlow = ['draft', 'scheduled', 'in-progress', 'completed', 'delivered'];

export default function ClientOrderView() {
  const { shareToken } = useParams();
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await axios.get(`${API_URL}/public/os/${shareToken}`);
        setOrder(res.data);
      } catch (err) {
        setError(err.response?.data?.msg || 'Ordem de serviço não encontrada');
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [shareToken]);

  if (loading) {
    return (
      <div className="client-page">
        <div className="client-loading">
          <div className="loading-spinner" />
          <p>Carregando...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="client-page">
        <div className="client-card client-error">
          <AlertCircle size={48} />
          <h2>Ordem não encontrada</h2>
          <p>{error || 'O link pode estar incorreto ou a ordem foi removida.'}</p>
          <button className="btn btn-secondary" onClick={() => window.location.href = '/'}>
            <ArrowLeft size={18} /> Voltar
          </button>
        </div>
      </div>
    );
  }

  const StatusIcon = statusConfig[order.status]?.icon || Clock;
  const currentIdx = statusFlow.indexOf(order.status);
  const isCancelled = order.status === 'cancelled';

  return (
    <div className={`client-page ${isDark ? 'client-dark' : ''}`}>
      {/* Header */}
      <div className="client-header">
        <div className="client-logo">
          <Wrench size={28} />
          <span>CRM Garagem</span>
        </div>
      </div>

      <div className="client-content">
        {/* Order Status Card */}
        <div className="client-card client-status-card">
          <div className="client-order-header">
            <div>
              <h1>{order.orderNumber}</h1>
              <p className="client-date">
                Aberta em {new Date(order.createdAt).toLocaleDateString('pt-BR')}
              </p>
            </div>
            <div
              className="client-status-badge"
              style={{
                background: statusConfig[order.status]?.bg,
                color: statusConfig[order.status]?.color,
              }}
            >
              <StatusIcon size={16} />
              <span>{statusConfig[order.status]?.label}</span>
            </div>
          </div>

          {/* Progress Steps */}
          {!isCancelled && (
            <div className="client-progress">
              {statusFlow.filter(s => s !== 'delivered').map((status, idx) => {
                const isDone = idx <= currentIdx;
                const isCurrent = idx === currentIdx;
                const StepIcon = statusConfig[status]?.icon || Clock;
                return (
                  <div key={status} className={`progress-step ${isDone ? 'done' : ''} ${isCurrent ? 'current' : ''}`}>
                    <div className="progress-dot">
                      <StepIcon size={14} />
                    </div>
                    <span className="progress-label">{statusConfig[status]?.label}</span>
                    {idx < statusFlow.filter(s => s !== 'delivered').length - 1 && (
                      <div className={`progress-line ${isDone && idx < currentIdx ? 'done' : ''}`} />
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {isCancelled && (
            <div className="client-cancelled-banner">
              <AlertCircle size={20} />
              Esta ordem de serviço foi cancelada.
            </div>
          )}
        </div>

        {/* Details Grid */}
        <div className="client-details-grid">
          {/* Client Info */}
          {order.client && (
            <div className="client-card">
              <h3>Cliente</h3>
              <div className="client-info-row">
                <span className="client-label">Nome</span>
                <span className="client-value">{order.client.name}</span>
              </div>
              {order.client.phone && (
                <div className="client-info-row">
                  <span className="client-label">Telefone</span>
                  <span className="client-value">{order.client.phone}</span>
                </div>
              )}
              {order.client.email && (
                <div className="client-info-row">
                  <span className="client-label">Email</span>
                  <span className="client-value">{order.client.email}</span>
                </div>
              )}
            </div>
          )}

          {/* Service Info */}
          <div className="client-card">
            <h3>Serviço</h3>
            {order.serviceType && (
              <div className="client-info-row">
                <span className="client-label">Tipo</span>
                <span className="client-value">{order.serviceType.name}</span>
              </div>
            )}
            {order.scheduledDate && (
              <div className="client-info-row">
                <span className="client-label">Agendado</span>
                <span className="client-value">
                  {new Date(order.scheduledDate).toLocaleString('pt-BR')}
                </span>
              </div>
            )}
            {order.completionDate && (
              <div className="client-info-row">
                <span className="client-label">Concluído</span>
                <span className="client-value">
                  {new Date(order.completionDate).toLocaleString('pt-BR')}
                </span>
              </div>
            )}
            <div className="client-info-row">
              <span className="client-label">Valor</span>
              <span className="client-value client-total">
                {Number(order.totalAmount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </span>
            </div>
          </div>
        </div>

        {/* Description */}
        {order.description && (
          <div className="client-card">
            <h3>Descrição do Serviço</h3>
            <p className="client-description">{order.description}</p>
          </div>
        )}

        {/* Parts Used */}
        {order.items && order.items.length > 0 && (
          <div className="client-card">
            <h3>Peças Utilizadas</h3>
            <div className="client-items-table">
              <div className="client-items-header">
                <span>Peça</span>
                <span>Qtd</span>
                <span>Preço</span>
                <span>Total</span>
              </div>
              {order.items.map((item, idx) => (
                <div key={idx} className="client-items-row">
                  <span>{item.part?.name || 'Peça'}</span>
                  <span>{item.quantity}x</span>
                  <span>{Number(item.unitPrice).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                  <span className="client-item-total">
                    {Number(item.totalPrice).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </div>
              ))}
              <div className="client-items-total">
                <span>Valor Total</span>
                <strong>
                  {Number(order.totalAmount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </strong>
              </div>
            </div>
          </div>
        )}

        {/* Status History Timeline */}
        {order.statusHistory && order.statusHistory.length > 0 && (
          <div className="client-card">
            <h3>Histórico de Atualizações</h3>
            <div className="client-timeline">
              {order.statusHistory.map((entry, idx) => {
                const isLatest = idx === 0;
                const Config = statusConfig[entry.toStatus] || statusConfig.draft;
                return (
                  <div key={idx} className={`timeline-item ${isLatest ? 'timeline-latest' : ''}`}>
                    <div className="timeline-dot" style={{ background: Config.color }}>
                      <Config.icon size={12} />
                    </div>
                    <div className="timeline-content">
                      <div className="timeline-header">
                        <span className="timeline-status">{entry.toLabel}</span>
                        <span className="timeline-time">
                          {new Date(entry.timestamp).toLocaleString('pt-BR')}
                        </span>
                      </div>
                      {entry.fromLabel && (
                        <div className="timeline-transition">
                          <span className="text-muted">{entry.fromLabel}</span>
                          <ChevronRight size={12} />
                          <span>{entry.toLabel}</span>
                        </div>
                      )}
                      {entry.notifySent && (
                        <div className="timeline-notify">
                          <Mail size={12} />
                          Notificação enviada ao cliente
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="client-footer">
          <p>CRM Garagem — Acompanhamento de Ordens de Serviço</p>
        </div>
      </div>
    </div>
  );
}
