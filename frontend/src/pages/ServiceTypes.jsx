import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getServiceTypes, deleteServiceType } from '../api/serviceTypes';
import { Wrench, Plus, Search, Edit2, Trash2, AlertCircle, Clock } from 'lucide-react';

export default function ServiceTypes() {
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState(null);
  const navigate = useNavigate();

  const fetchTypes = async () => {
    try {
      const res = await getServiceTypes();
      setTypes(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTypes();
  }, []);

  const handleDelete = async (id) => {
    try {
      await deleteServiceType(id);
      setTypes(types.filter((t) => t.id !== id));
      setDeleteId(null);
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = types.filter(
    (t) => t.name?.toLowerCase().includes(search.toLowerCase()) || t.description?.toLowerCase().includes(search.toLowerCase())
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
          <h2>Tipos de Serviço</h2>
          <p>{types.length} tipo(s) cadastrado(s)</p>
        </div>
        <Link to="/service-types/new" className="btn btn-primary">
          <Plus size={18} />
          Novo Tipo
        </Link>
      </div>

      <div className="search-bar">
        <Search size={18} />
        <input
          type="text"
          placeholder="Buscar por nome..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <Wrench size={48} />
          <h3>{search ? 'Nenhum tipo encontrado' : 'Nenhum tipo de serviço cadastrado'}</h3>
          <p>{search ? 'Tente buscar por outro termo' : 'Clique em "Novo Tipo" para cadastrar o primeiro'}</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Descrição</th>
                <th>Preço Base</th>
                <th>Data</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((type) => (
                <tr key={type.id}>
                  <td>
                    <span className="table-link" onClick={() => navigate(`/service-types/${type.id}/edit`)}>
                      {type.name}
                    </span>
                  </td>
                  <td className="text-muted">{type.description || '—'}</td>
                  <td>
                    {Number(type.basePrice).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </td>
                  <td className="text-muted" style={{ whiteSpace: 'nowrap', fontSize: 13 }}>
                    {new Date(type.createdAt).toLocaleDateString('pt-BR')}
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn-icon"
                        title="Editar"
                        onClick={() => navigate(`/service-types/${type.id}/edit`)}
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        className="btn-icon btn-icon-danger"
                        title="Excluir"
                        onClick={() => setDeleteId(type.id)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
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
            <p>Tem certeza que deseja excluir este tipo de serviço?</p>
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
