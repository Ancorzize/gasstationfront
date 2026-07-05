import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Power, Trash2, Loader2 } from 'lucide-react';
import { destinationService } from '../services/destinationService';
import { useToast } from '../../../context/ToastContext';
import { DestinationModal } from '../components/DestinationModal';

export const DestinationListPage = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selected, setSelected] = useState(null);
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
    if (res.success) { showToast("Estado actualizado", "success"); loadData(); }
  };

  const deleteItem = async (id) => {
    if (!confirm("¿Eliminar este destino?")) return;
    const res = await destinationService.deleteDestino(id);
    if (res.success) { showToast("Destino eliminado", "success"); loadData(); }
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-black uppercase text-slate-800">Destinos de Recaudo</h2>
        </div>
        <button onClick={() => { setSelected(null); setIsModalOpen(true); }} className="bg-zinc-900 text-white px-5 py-2.5 rounded-2xl text-[10px] font-bold uppercase flex items-center gap-2">
          <Plus size={16} /> Nuevo Destino
        </button>
      </div>

      <div className="bg-white rounded-[2.5rem] p-6 border border-slate-100">
        <div className="relative mb-6">
          <Search className="absolute left-3 top-3 text-slate-400" size={16} />
          <input className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs" placeholder="Buscar por código o nombre..." onChange={e => setSearchTerm(e.target.value)} />
        </div>

        {loading ? <Loader2 className="animate-spin mx-auto" /> : (
          <table className="w-full">
            <thead>
              <tr className="text-[9px] text-slate-400 uppercase tracking-widest border-b">
                <th className="p-4 text-left">Código</th>
                <th className="p-4 text-left">Nombre</th>
                <th className="p-4 text-left">Descripción</th>
                <th className="p-4 text-center">Estado</th>
                <th className="p-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {data.map(item => (
                <tr key={item.id} className="text-xs">
                  <td className="p-4 font-black">{item.codigo}</td>
                  <td className="p-4">{item.nombre}</td>
                  <td className="p-4 text-slate-500">{item.descripcion}</td>
                  <td className="p-4 text-center">
                    <button onClick={() => toggleStatus(item)} className={`px-3 py-1 rounded-full font-bold ${item.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                      {item.is_active ? 'Activo' : 'Inactivo'}
                    </button>
                  </td>
                  <td className="p-4 flex justify-center gap-2">
                    <button onClick={() => { setSelected(item); setIsModalOpen(true); }} className="p-2 text-slate-400 hover:bg-slate-100 rounded-xl"><Edit2 size={16}/></button>
                    <button onClick={() => deleteItem(item.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl"><Trash2 size={16}/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <DestinationModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={loadData} destinoToEdit={selected} />
    </div>
  );
};