import React, { useEffect, useState, useMemo } from 'react';
import { Search, Edit2, Power, Truck, Loader2, Download, Plus } from 'lucide-react';
import { supplierService } from '../services/supplierService';
import { SupplierModal } from '../components/SupplierModal';
import { useToast } from '../../../context/ToastContext';
import { exportToExcel } from '../../../shared/utils/exportExcel';

export const SupplierListPage = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const { showToast } = useToast();

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const result = await supplierService.getSuppliers('');
      if (result.status) setSuppliers(result.data.items);
    } catch (error) {
      showToast("Error al cargar proveedores", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSuppliers(); }, []);

  const filteredSuppliers = useMemo(() => {
    return suppliers.filter(s => 
      s.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.nit?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, suppliers]);

  const handleToggleStatus = async (supplier) => {
    const result = await supplierService.toggleStatus(supplier.id, !supplier.is_active);
    if (result.status) {
      showToast(result.message, "success");
      fetchSuppliers();
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight uppercase">Proveedores</h2>
          <p className="text-slate-500 text-xs md:text-sm">Gestión de abastecimiento y contactos.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2 md:gap-3">
          <button 
            onClick={() => exportToExcel(filteredSuppliers, 'Proveedores_LasGranjas')}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-2xl font-bold text-[10px] md:text-xs uppercase hover:bg-emerald-700 transition-all shadow-md"
          >
            <Download size={16} /> <span className="hidden sm:inline">Exportar</span>
          </button>

          <div className="relative flex-1 md:flex-none min-w-[150px]">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
            <input 
              type="text" placeholder="Buscar..." 
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs outline-none focus:border-emerald-500 transition-all shadow-sm"
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <button 
            onClick={() => { setSelectedSupplier(null); setIsModalOpen(true); }}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-zinc-900 text-white px-4 py-2.5 rounded-2xl font-bold text-[10px] md:text-xs uppercase hover:bg-black transition-all shadow-md"
          >
            <Plus size={16} /> <span className="hidden sm:inline">Nuevo Proveedor</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar-light">
          {loading ? (
            <div className="p-20 flex flex-col items-center justify-center text-slate-400 gap-3">
              <Loader2 className="animate-spin" size={40} />
              <p className="text-[10px] font-bold uppercase tracking-widest">Cargando...</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse min-w-[700px] md:min-w-full">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Proveedor</th>
                  <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">NIT</th>
                  <th className="hidden md:table-cell p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Contacto</th>
                  <th className="hidden lg:table-cell p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Email</th>
                  <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Estado</th>
                  <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredSuppliers.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/30 transition-colors group text-slate-600">
                    <td className="p-4 font-bold text-slate-800 text-xs uppercase">{s.nombre}</td>
                    <td className="p-4 text-xs">{s.nit}</td>
                    <td className="hidden md:table-cell p-4 text-xs">{s.telefono || '---'}</td>
                    <td className="hidden lg:table-cell p-4 text-xs italic">{s.email || '---'}</td>
                    <td className="p-4 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                        s.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                      }`}>
                        {s.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => { setSelectedSupplier(s); setIsModalOpen(true); }}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"><Edit2 size={14} /></button>
                        <button onClick={() => handleToggleStatus(s)}
                          className={`p-2 rounded-lg transition-all ${s.is_active ? 'hover:text-red-600 hover:bg-red-50' : 'hover:text-emerald-600 hover:bg-emerald-50'}`}><Power size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <SupplierModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={fetchSuppliers} supplierToEdit={selectedSupplier} />
    </div>
  );
};