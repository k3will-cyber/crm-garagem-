import React, { useState, useEffect } from 'react';
import { getAllStockMovements } from '../api/parts';
import { useAuth } from '../contexts/AuthContext';
import { Package, ArrowUpRight, ArrowDownLeft, Clock, User, Search, Filter } from 'lucide-react';

const reasonLabels = {
  purchase: 'Compra',
  sale: 'Venda',
  service_order: 'Ordem de Serviço',
  adjustment: 'Ajuste',
  return: 'Devolução',
  part_request: 'Solicitação Interna',
};

const reasonColors = {
  purchase: 'badge-green',
  sale: 'badge-red',
  service_order: 'badge-blue',
  adjustment: 'badge-yellow',
  return: 'badge-purple',
  part_request: 'badge-gray',
};

export default function StockMovements() {
  const { user } = useAuth();
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await getAllStockMovements();
        setMovements(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const filtered = movements.filter(m => {
    const matchesSearch = !search ||
      m.part?.name?.toLowerCase().includes(search.toLowerCase()) ||
      m.part?.sku?.toLowerCase().includes(search.toLowerCase());
    const matchesType = filterType === 'all' || m.type === filterType;
    return matchesSearch && matchesType;
  });

  if (loading) {
    return <div className="page-loading"><div className="loading-spinner" /></div>;
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2>Histórico de Estoque</h2>
          <p>{movements.length} movimentação(ões) registrada(s)</p>
        </div>
      </div>

      <div className="filter-bar">
        <div className="search-bar" style={{ marginBottom: 0, flex: 1 }}>
          <Search size={18} />
          <input type="text" placeholder="Buscar por peça ou SKU..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="filter-group">
          <Filter size={16} />
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
            <option value="all">Todos</option>
            <option value="in">Entradas</option>
            <option value="out">Saídas</option>
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <Package size={48} />
          <h3>Nenhuma movimentação encontrada</h3>
          <p>As movimentações de estoque aparecerão aqui</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Peça</th>
                <th>Tipo</th>
                <th>Quantidade</th>
                <th>Motivo</th>
                <th>Responsável</th>
                <th>Observações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(m => (
                <tr key={m.id}>
                  <td className="text-muted">
                    {new Date(m.createdAt).toLocaleString('pt-BR')}
                  </td>
                  <td>
                    <span className="table-link">{m.part?.name || `ID: ${m.partId}`}</span>
                    {m.part?.sku && <span className="text-muted"> ({m.part.sku})</span>}
                  </td>
                  <td>
                    <span className={`movement-type ${m.type === 'in' ? 'movement-in' : 'movement-out'}`}>
                      {m.type === 'in' ? <ArrowUpRight size={14} /> : <ArrowDownLeft size={14} />}
                      {m.type === 'in' ? 'Entrada' : 'Saída'}
                    </span>
                  </td>
                  <td className={m.type === 'in' ? 'text-success' : 'text-danger'} style={{ fontWeight: 600 }}>
                    {m.type === 'in' ? '+' : '-'}{m.quantity}
                  </td>
                  <td>
                    <span className={`badge ${reasonColors[m.reason] || 'badge-gray'}`}>
                      {reasonLabels[m.reason] || m.reason}
                    </span>
                  </td>
                  <td>
                    <div className="contact-info">
                      <User size={14} />
                      {m.createdByUser?.name || `ID: ${m.createdBy}`}
                    </div>
                  </td>
                  <td className="text-muted">{m.notes || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
