import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, Loader2 } from 'lucide-react';
import { destinationService } from '../services/destinationService';
import { useToast } from '../../../context/ToastContext';
import { DestinationModal } from '../components/DestinationModal';
import { ConfirmModal } from '../components/ConfirmModal'; 

export const DestinationListPage = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const { showToast } = useToast();

  const loadData = async () => {
    setLoading(true);
    const res = await destinationService.getDestinos({ search: searchTerm });
    if (res.status) setData(res.data.items);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, [searchTerm]);

  const toggleStatus = async (item) => {
    const res = await destinationService.toggleStatus(item.id, !item.is_active);
    if (res.status) { 
      showToast("Estado actualizado", "success"); 
      loadData(); 
    } else {
      showToast(res.message || "No se pudo actualizar el estado", "error");
    }
  };

  const promptDelete = (item) => {
    setItemToDelete(item);
    setIsConfirmOpen(true);
  };


  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;
    
    setDeleting(true);
    try {
      const res = await destinationService.deleteDestino(itemToDelete.id);
      
      if (res && res.status === true) {
        showToast("Destino eliminado con éxito", "success");
        setIsConfirmOpen(false);
        setItemToDelete(null);
        loadData();
      } else {
        showToast("No se pudo eliminar el destino, puede tener histórico", "error");
      }
    } catch (error) {
      showToast("Error de conexión al intentar eliminar", "error");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="p-8 space-y-6 text-left">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-black uppercase text-slate-800">Destinos de Recaudo</h2>
        </div>
        <button onClick={() => { setSelected(null); setIsModalOpen(true); }} className="bg-zinc-900 text-white px-5 py-2.5 rounded-2xl text-[10px] font-bold uppercase flex items-center gap-2 hover:bg-black transition-all">
          <Plus size={16} /> Nuevo Destino
        </button>
      </div>

      <div className="bg-white rounded-[2.5rem] p-6 border border-slate-100 shadow-sm">
        <div className="relative mb-6">
          <Search className="absolute left-3 top-3 text-slate-400" size={16} />
          <input className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs outline-none focus:border-zinc-900 transition-all" placeholder="Buscar por código o nombre..." onChange={e => setSearchTerm(e.target.value)} />
        </div>

        {loading ? <Loader2 className="animate-spin mx-auto text-slate-400 my-10" size={32} /> : (
          <table className="w-full">
            <thead>
              <tr className="text-[9px] text-slate-400 uppercase tracking-widest border-b border-slate-100">
                <th className="p-4 text-left">Código</th>
                <th className="p-4 text-left">Nombre</th>
                <th className="p-4 text-left">Descripción</th>
                <th className="p-4 text-center">Estado</th>
                <th className="p-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {data.map(item => (
                <tr key={item.id} className="text-xs hover:bg-slate-50/50 transition-colors">
                  <td className="p-4 font-black text-slate-700">{item.codigo}</td>
                  <td className="p-4 font-bold text-slate-600">{item.nombre}</td>
                  <td className="p-4 text-slate-500">{item.descripcion}</td>
                  <td className="p-4 text-center">
                    <button onClick={() => toggleStatus(item)} className={`px-3 py-1 rounded-full font-black text-[10px] uppercase transition-all ${item.is_active ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}>
                      {item.is_active ? 'Activo' : 'Inactivo'}
                    </button>
                  </td>
                  <td className="p-4 flex justify-center gap-2">
                    <button onClick={() => { setSelected(item); setIsModalOpen(true); }} className="p-2 text-slate-400 hover:bg-slate-100 rounded-xl transition-all"><Edit2 size={16}/></button>
                    <button onClick={() => promptDelete(item)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={16}/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <DestinationModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={loadData} destinoToEdit={selected} />

      <ConfirmModal
        isOpen={isConfirmOpen}
        title="Eliminar Destino"
        message={`¿Estás seguro de que deseas eliminar el destino "${itemToDelete?.nombre}"? Esta acción no se puede deshacer.`}
        confirmText="Sí, eliminar"
        cancelText="Cancelar"
        loading={deleting}
        onClose={() => !deleting && setIsConfirmOpen(false)}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
};