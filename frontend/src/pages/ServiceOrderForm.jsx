import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getServiceOrder, createServiceOrder, updateServiceOrder } from '../api/serviceOrders';
import { getClients } from '../api/clients';
import { getServiceTypes } from '../api/serviceTypes';
import { getParts } from '../api/parts';
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react';

export default function ServiceOrderForm() {
  const { id } = useParams();
  const isEditing = !!id;
  const navigate = useNavigate();

  const [clients, setClients] = useState([]);
  const [serviceTypes, setServiceTypes] = useState([]);
  const [parts, setParts] = useState([]);

  const [form, setForm] = useState({
    clientId: '',
    serviceTypeId: '',
    description: '',
    scheduledDate: '',
    priority: 'medium',
    notes: '',
    items: [],
  });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [clientsRes, typesRes, partsRes] = await Promise.all([
          getClients(),
          getServiceTypes(),
          getParts(),
        ]);
        setClients(clientsRes.data);
        setServiceTypes(typesRes.data);
        setParts(partsRes.data);

        if (isEditing) {
          const orderRes = await getServiceOrder(id);
          const o = orderRes.data;
          setForm({
            clientId: o.clientId || '',
            serviceTypeId: o.serviceTypeId || '',
            description: o.description || '',
            scheduledDate: o.scheduledDate ? o.scheduledDate.slice(0, 16) : '',
            priority: o.priority || 'medium',
            notes: o.notes || '',
            items: o.items?.map((item) => ({
              partId: item.partId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
            })) || [],
          });
        }
      } catch (err) {
        setError('Erro ao carregar dados');
      } finally {
        setFetching(false);
      }
    };
    fetchData();
  }, [id, isEditing]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAddItem = () => {
    setForm({
      ...form,
      items: [...form.items, { partId: '', quantity: 1, unitPrice: '' }],
    });
  };

  const handleRemoveItem = (index) => {
    setForm({
      ...form,
      items: form.items.filter((_, i) => i !== index),
    });
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...form.items];
    newItems[index] = { ...newItems[index], [field]: value };

    // Auto-fill unit price when part is selected
    if (field === 'partId') {
      const part = parts.find((p) => p.id === parseInt(value));
      if (part) {
        newItems[index].unitPrice = part.price;
      }
    }

    setForm({ ...form, items: newItems });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = {
        ...form,
        clientId: parseInt(form.clientId),
        serviceTypeId: parseInt(form.serviceTypeId),
        scheduledDate: form.scheduledDate ? new Date(form.scheduledDate).toISOString() : null,
        items: form.items.map((item) => ({
          partId: parseInt(item.partId),
          quantity: parseInt(item.quantity),
          unitPrice: parseFloat(item.unitPrice),
        })),
      };

      if (isEditing) {
        await updateServiceOrder(id, data);
      } else {
        await createServiceOrder(data);
      }
      navigate('/service-orders');
    } catch (err) {
      setError(err.response?.data?.msg || 'Erro ao salvar ordem de serviço');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = () => {
    const selectedType = serviceTypes.find((t) => t.id === parseInt(form.serviceTypeId));
    let total = selectedType?.basePrice ? parseFloat(selectedType.basePrice) : 0;
    form.items.forEach((item) => {
      total += (parseFloat(item.unitPrice) || 0) * (parseInt(item.quantity) || 0);
    });
    return total;
  };

  if (fetching) {
    return (
      <div className="page-loading">
        <div className="loading-spinner" />
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <button className="btn btn-secondary" onClick={() => navigate('/service-orders')}>
          <ArrowLeft size={18} />
          Voltar
        </button>
        <h2>{isEditing ? 'Editar Ordem de Serviço' : 'Nova Ordem de Serviço'}</h2>
      </div>

      {error && <div className="alert alert-error"><span>{error}</span></div>}

      <div className="form-card">
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="clientId">Cliente *</label>
              <select id="clientId" name="clientId" value={form.clientId} onChange={handleChange} required>
                <option value="">Selecione um cliente...</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="serviceTypeId">Tipo de Serviço *</label>
              <select id="serviceTypeId" name="serviceTypeId" value={form.serviceTypeId} onChange={handleChange} required>
                <option value="">Selecione um serviço...</option>
                {serviceTypes.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} - {Number(t.basePrice).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="priority">Prioridade</label>
              <select id="priority" name="priority" value={form.priority} onChange={handleChange}>
                <option value="low">Baixa</option>
                <option value="medium">Média</option>
                <option value="high">Alta</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="scheduledDate">Data Agendada</label>
              <input
                id="scheduledDate"
                name="scheduledDate"
                type="datetime-local"
                value={form.scheduledDate}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="description">Descrição do Serviço</label>
            <textarea
              id="description"
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={3}
              placeholder="Descreva o serviço a ser realizado..."
            />
          </div>

          {/* Items Section */}
          <div className="form-section">
            <div className="form-section-header">
              <h3>Peças Utilizadas</h3>
              <button type="button" className="btn btn-secondary btn-sm" onClick={handleAddItem}>
                <Plus size={16} />
                Adicionar Peça
              </button>
            </div>

            {form.items.length === 0 ? (
              <p className="text-muted">Nenhuma peça adicionada. Clique em "Adicionar Peça" para incluir.</p>
            ) : (
              <div className="items-table">
                <div className="items-header">
                  <span className="item-col-name">Peça</span>
                  <span className="item-col-qty">Qtd</span>
                  <span className="item-col-price">Preço Unit.</span>
                  <span className="item-col-total">Total</span>
                  <span className="item-col-action"></span>
                </div>
                {form.items.map((item, index) => {
                  const part = parts.find((p) => p.id === parseInt(item.partId));
                  const totalPrice = (parseFloat(item.unitPrice) || 0) * (parseInt(item.quantity) || 0);
                  return (
                    <div key={index} className="items-row">
                      <select
                        value={item.partId}
                        onChange={(e) => handleItemChange(index, 'partId', e.target.value)}
                        required
                      >
                        <option value="">Selecione...</option>
                        {parts.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} (Estoque: {p.stockQuantity})
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                        required
                      />
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.unitPrice}
                        onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)}
                        required
                      />
                      <span className="item-total">
                        {totalPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </span>
                      <button type="button" className="btn-icon btn-icon-danger" onClick={() => handleRemoveItem(index)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="form-total">
              <span>Valor Total Estimado:</span>
              <strong>
                {calculateTotal().toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </strong>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="notes">Observações</label>
            <textarea
              id="notes"
              name="notes"
              value={form.notes}
              onChange={handleChange}
              rows={3}
              placeholder="Observações sobre a ordem de serviço..."
            />
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/service-orders')}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              <Save size={18} />
              {loading ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
