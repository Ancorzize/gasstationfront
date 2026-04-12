import React, { useEffect, useState, useMemo } from 'react';
import { Search, Edit2, Power, Home, Loader2, Plus, Trash2, MapPin, Phone, Star } from 'lucide-react';
import { warehouseService } from '../services/warehouseService';
import { WarehouseModal } from '../components/WarehouseModal';
import { ConfirmModal } from '../../../shared/components/ConfirmModal';
import { useToast } from '../../../context/ToastContext';

export const WarehouseListPage = () => {
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [warehouseToDelete, setWarehouseToDelete] = useState(null);
  
  const { showToast } = useToast();

  const fetchWarehouses = async () => {
    setLoading(true);
    try {
      const result = await warehouseService.getWarehouses();
      if (result.status) setWarehouses(result.data.items);
    } catch (error) {
      showToast("Error al cargar bodegas", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchWarehouses(); }, []);

  const filteredWarehouses = useMemo(() => {
    return warehouses.filter(w => 
      w.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      w.codigo?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, warehouses]);

  const handleToggleStatus = async (warehouse) => {
    const result = await warehouseService.toggleStatus(warehouse.id, !warehouse.is_active);
    if (result.status) {
      showToast(result.message, "success");
      fetchWarehouses();
    } else {
      showToast(result.message, "error");
    }
  };

  const handleDelete = async () => {
    const result = await warehouseService.deleteWarehouse(warehouseToDelete.id);
    if (result.status) {
      showToast(result.message, "success");
      fetchWarehouses();
      setIsConfirmOpen(false);
    } else {
      showToast(result.message, "error");
      setIsConfirmOpen(false);
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight uppercase">Bodegas y Almacenes</h2>
          <p className="text-slate-500 text-xs md:text-sm font-medium">Gestión física de inventario en Las Granjas S.A.S.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-4 top-3 text-slate-400 group-focus-within:text-zinc-900 transition-colors" size={16} />
            <input type="text" placeholder="Buscar bodega..." 
              className="w-full md:w-64 pl-12 pr-4 py-3 bg-white border border-slate-100 rounded-2xl text-xs outline-none focus:border-zinc-900 shadow-sm transition-all"
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>

          <button onClick={() => { setSelectedWarehouse(null); setIsModalOpen(true); }}
            className="flex items-center gap-2 bg-zinc-900 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase hover:bg-black transition-all shadow-xl shadow-zinc-200">
            <Plus size={16} /> Nueva Bodega
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full p-20 flex flex-col items-center justify-center text-slate-300 gap-3">
            <Loader2 className="animate-spin" size={40} />
            <p className="text-[10px] font-black uppercase tracking-widest">Sincronizando depósitos...</p>
          </div>
        ) : filteredWarehouses.length > 0 ? (
          filteredWarehouses.map((w) => (
            <div key={w.id} className={`group relative bg-white rounded-[2.5rem] border transition-all duration-500 p-6 space-y-5 overflow-hidden
              ${w.is_principal ? 'border-yellow-200 shadow-xl shadow-yellow-500/5' : 'border-slate-100 hover:border-zinc-200 hover:shadow-xl hover:shadow-slate-200/50'}`}>
              
              {/* Badge Principal */}
              {w.is_principal && (
                <div className="absolute top-0 right-0 bg-yellow-400 text-black px-4 py-1.5 rounded-bl-3xl text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-sm">
                  <Star size={10} fill="black" /> Principal
                </div>
              )}

              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors
                    ${w.is_principal ? 'bg-yellow-50 text-yellow-600' : 'bg-slate-50 text-slate-400 group-hover:bg-zinc-900 group-hover:text-white'}`}>
                    <Home size={22} />
                  </div>
                  <div>
                    <h4 className="font-black text-slate-800 text-sm uppercase tracking-tight line-clamp-1">{w.nombre}</h4>
                    <span className="text-[10px] font-black text-slate-400 bg-slate-50 px-2 py-0.5 rounded uppercase">{w.codigo}</span>
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-slate-400 font-medium italic line-clamp-2 h-8 normal-case">{w.descripcion || 'Sin descripción detallada.'}</p>

              <div className="space-y-2 pt-2">
                <div className="flex items-center gap-3 text-slate-500">
                  <MapPin size={14} className="shrink-0" />
                  <span className="text-[10px] font-bold uppercase truncate">{w.direccion || 'No registrada'}</span>
                </div>
                <div className="flex items-center gap-3 text-slate-500">
                  <Phone size={14} className="shrink-0" />
                  <span className="text-[10px] font-bold uppercase">{w.telefono || 'Sin teléfono'}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Responsable</span>
                  <span className="text-[10px] font-bold text-slate-600 uppercase">{w.responsable?.name || 'No asignado'}</span>
                </div>

                <div className="flex items-center gap-1">
                  <button onClick={() => { setSelectedWarehouse(w); setIsModalOpen(true); }} 
                    className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"><Edit2 size={16} /></button>
                  <button onClick={() => handleToggleStatus(w)} 
                    className={`p-2.5 rounded-xl transition-all ${w.is_active ? 'text-slate-400 hover:text-red-600 hover:bg-red-50' : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'}`}><Power size={16} /></button>
                  {!w.is_principal && (
                    <button onClick={() => { setWarehouseToDelete(w); setIsConfirmOpen(true); }} 
                      className="p-2.5 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-xl transition-all"><Trash2 size={16} /></button>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-20 text-center">
            <p className="text-slate-400 italic text-sm">No se encontraron bodegas que coincidan con la búsqueda.</p>
          </div>
        )}
      </div>

      <WarehouseModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={fetchWarehouses} warehouseToEdit={selectedWarehouse} />
      <ConfirmModal isOpen={isConfirmOpen} onClose={() => setIsConfirmOpen(false)} onConfirm={handleDelete} title="Eliminar Bodega" 
        message={`¿Deseas eliminar "${warehouseToDelete?.nombre}"? Esta acción borrará el punto de almacenamiento del sistema.`} loading={loading} />
    </div>
  );
};