import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getParts, deletePart } from '../api/parts';
import { Package, Plus, Search, Edit2, Trash2, AlertCircle, AlertTriangle, DollarSign, Hash } from 'lucide-react';

export default function Parts() {
  const [parts, setParts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState(null);
  const navigate = useNavigate();

  const fetchParts = async () => {
    try {
      const res = await getParts();
      setParts(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParts();
  }, []);

  const handleDelete = async (id) => {
    try {
      await deletePart(id);
      setParts(parts.filter((p) => p.id !== id));
      setDeleteId(null);
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = parts.filter(
    (p) =>
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.sku?.toLowerCase().includes(search.toLowerCase()) ||
      p.supplier?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="page-loading">
        <div className="loading-spinner" />
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2>Peças</h2>
          <p>{parts.length} peça(s) cadastrada(s)</p>
        </div>
        <Link to="/parts/new" className="btn btn-primary">
          <Plus size={18} />
          Nova Peça
        </Link>
      </div>

      <div className="search-bar">
        <Search size={18} />
        <input
          type="text"
          placeholder="Buscar por nome, SKU ou fornecedor..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <Package size={48} />
          <h3>{search ? 'Nenhuma peça encontrada' : 'Nenhuma peça cadastrada'}</h3>
          <p>{search ? 'Tente buscar por outro termo' : 'Clique em "Nova Peça" para cadastrar a primeira'}</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>SKU</th>
                <th>Preço</th>
                <th>Estoque</th>
                <th>Estoque Mín.</th>
                <th>Fornecedor</th>
                <th>Data</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((part) => {
                const isLowStock = part.stockQuantity <= part.minStockLevel;
                return (
                  <tr key={part.id} className={isLowStock ? 'row-warning' : ''}>
                    <td>
                      <span className="table-link" onClick={() => navigate(`/parts/${part.id}/edit`)}>
                        {part.name}
                      </span>
                    </td>
                    <td className="text-muted">{part.sku || '—'}</td>
                    <td>
                      {Number(part.price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </td>
                    <td>
                      <div className="stock-info">
                        <span className={isLowStock ? 'text-danger' : ''}>{part.stockQuantity}</span>
                        {isLowStock && <AlertTriangle size={14} className="text-danger" />}
                      </div>
                    </td>
                    <td>{part.minStockLevel}</td>                    <td>{part.supplier || '—'}</td>
                  <td className="text-muted" style={{ whiteSpace: 'nowrap', fontSize: 13 }}>
                    {new Date(part.createdAt).toLocaleDateString('pt-BR')}
                  </td>
                  <td>
                    <div className="action-buttons">
                        <button className="btn-icon" title="Editar" onClick={() => navigate(`/parts/${part.id}/edit`)}>
                          <Edit2 size={16} />
                        </button>
                        <button className="btn-icon btn-icon-danger" title="Excluir" onClick={() => setDeleteId(part.id)}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {deleteId && (
        <div className="modal-overlay" onClick={() => setDeleteId(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <AlertCircle size={24} className="text-danger" />
              <h3>Confirmar exclusão</h3>
            </div>
            <p>Tem certeza que deseja excluir esta peça?</p>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setDeleteId(null)}>Cancelar</button>
              <button className="btn btn-danger" onClick={() => handleDelete(deleteId)}>Excluir</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
