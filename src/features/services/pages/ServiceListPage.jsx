import React, { useEffect, useState, useMemo } from 'react';
import { Search, Edit2, Power, Wrench, Loader2, Download, Plus, Trash2, Clock } from 'lucide-react';
import { serviceService } from '../services/serviceService';
import { ServiceModal } from '../components/ServiceModal';
import { ConfirmModal } from '../../../shared/components/ConfirmModal';
import { useToast } from '../../../context/ToastContext';
import { exportToExcel } from '../../../shared/utils/exportExcel';

export const ServiceListPage = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState(null);
  
  const { showToast } = useToast();

  const fetchServices = async () => {
    setLoading(true);
    try {
      const result = await serviceService.getServices();
      if (result.status) setServices(result.data.items);
    } catch (error) {
      showToast("Error al cargar servicios", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchServices(); }, []);

  const filteredServices = useMemo(() => {
    return services.filter(s => 
      s.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      s.codigo?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, services]);

  const handleToggleStatus = async (service) => {
    const result = await serviceService.toggleStatus(service.id, !service.is_active);
    if (result.status) {
      showToast(result.message, "success");
      fetchServices();
    }
  };

  const handleDelete = async () => {
    setLoading(true); 
    try {
        const result = await serviceService.deleteService(serviceToDelete.id);
        
        if (result.status) {
     
        showToast(result.message || "Servicio eliminado correctamente", "success");
        fetchServices();
        setIsConfirmOpen(false);
        } else {
      
        showToast(result.message || "No tienes permisos para realizar esta acción", "error");
        setIsConfirmOpen(false); 
        }
    } catch (error) {

        showToast("Error de conexión con el servidor", "error");
    } finally {
        setLoading(false);
        setServiceToDelete(null);
    }
    };

  const formatCurrency = (val) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(val);

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight uppercase">Catálogo de Servicios</h2>
          <p className="text-slate-500 text-xs md:text-sm">Configuración de mano de obra y servicios técnicos.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2 md:gap-3">
          <button onClick={() => exportToExcel(filteredServices, 'Servicios_LasGranjas')}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-2xl font-bold text-xs uppercase shadow-md">
            <Download size={16} /> <span className="hidden sm:inline">Excel</span>
          </button>

          <div className="relative flex-1 md:flex-none min-w-[160px]">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
            <input type="text" placeholder="Buscar..." 
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs outline-none focus:border-blue-500 shadow-sm"
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>

          <button onClick={() => { setSelectedService(null); setIsModalOpen(true); }}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-zinc-900 text-white px-4 py-2.5 rounded-2xl font-bold text-xs uppercase hover:bg-black transition-all shadow-md">
            <Plus size={16} /> <span className="hidden sm:inline">Nuevo Servicio</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar-light">
          {loading ? (
            <div className="p-20 flex flex-col items-center justify-center text-slate-400 gap-3">
              <Loader2 className="animate-spin" size={40} />
              <p className="text-[10px] font-bold uppercase tracking-widest">Consultando...</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Código</th>
                  <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nombre</th>
                  <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Descripción</th>
                  <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Duración</th>
                  <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">U. Medida</th>
                  <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Precio</th>
                  <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Estado</th>
                  <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredServices.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/50 transition-colors uppercase text-slate-600">
                    <td className="p-4"><span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-1 rounded">{s.codigo}</span></td>
                    <td className="p-4 text-xs font-bold text-slate-700">{s.nombre}</td>
                    <td className="p-4 text-[10px] max-w-[200px] truncate normal-case italic">{s.descripcion || '---'}</td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-1 text-[10px] font-bold text-slate-500">
                        <Clock size={12} /> {s.duracion_minutos ? `${s.duracion_minutos} min` : 'N/A'}
                      </div>
                    </td>
                    <td className="p-4 text-center text-[10px] font-bold text-slate-400">{s.unidad_medida?.abreviatura || 'FIJO'}</td>
                    <td className="p-4 text-right text-xs font-black text-slate-800">{formatCurrency(s.precio)}</td>
                    <td className="p-4 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${s.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                        {s.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => { setSelectedService(s); setIsModalOpen(true); }} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"><Edit2 size={14} /></button>
                        <button onClick={() => handleToggleStatus(s)} className={`p-2 rounded-lg transition-all ${s.is_active ? 'hover:text-red-600 hover:bg-red-50' : 'hover:text-emerald-600 hover:bg-emerald-50'}`}><Power size={14} /></button>
                        <button onClick={() => { setServiceToDelete(s); setIsConfirmOpen(true); }} className="p-2 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-all"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <ServiceModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={fetchServices} serviceToEdit={selectedService} />
      <ConfirmModal isOpen={isConfirmOpen} onClose={() => setIsConfirmOpen(false)} onConfirm={handleDelete} title="Eliminar Servicio" 
        message={`¿Deseas eliminar "${serviceToDelete?.nombre}"? Esta acción no se puede deshacer.`} loading={loading} />
    </div>
  );
};