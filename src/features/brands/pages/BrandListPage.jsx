import React, { useEffect, useState, useMemo } from 'react';
import { Search, Edit2, Power, Tag, Loader2, Download, Plus, Trash2 } from 'lucide-react';
import { brandService } from '../services/brandService';
import { BrandModal } from '../components/BrandModal';
import { useToast } from '../../../context/ToastContext';
import { exportToExcel } from '../../../shared/utils/exportExcel';
import { ConfirmModal } from '../../../shared/components/ConfirmModal';

export const BrandListPage = () => {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState(null);
  const { showToast } = useToast();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [brandToDelete, setBrandToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchBrands = async () => {
    setLoading(true);
    try {
      const result = await brandService.getBrands('');
      if (result.status) setBrands(result.data.items);
    } catch (error) {
      showToast("Error al cargar marcas", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBrands(); }, []);

  const filteredBrands = useMemo(() => {
    return brands.filter(b => b.nombre?.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [searchTerm, brands]);

  const handleToggleStatus = async (brand) => {
    const result = await brandService.toggleStatus(brand.id, !brand.is_active);
    if (result.status) {
      showToast(result.message, "success");
      fetchBrands();
    }
  };

  const handleDeleteClick = (brand) => {
    setBrandToDelete(brand);
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    setDeleting(true);
    try {
      const result = await brandService.deleteBrand(brandToDelete.id);
      if (result.status) {
        showToast(result.message, "success");
        fetchBrands();
        setIsConfirmOpen(false);
      }
    } catch (error) {
      showToast("Error al eliminar", "error");
    } finally {
      setDeleting(false);
      setBrandToDelete(null);
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight uppercase">Marcas de Productos</h2>
          <p className="text-slate-500 text-xs md:text-sm">Administra los fabricantes y líneas de productos.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2 md:gap-3">
          <button 
            onClick={() => exportToExcel(filteredBrands, 'Marcas_LasGranjas')}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-2xl font-bold text-[10px] md:text-xs uppercase hover:bg-emerald-700 transition-all shadow-md"
          >
            <Download size={16} /> <span className="hidden sm:inline">Exportar</span>
          </button>

          <div className="relative flex-1 md:flex-none min-w-[150px]">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
            <input 
              type="text" placeholder="Buscar..." 
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs outline-none focus:border-yellow-500 transition-all shadow-sm"
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <button 
            onClick={() => { setSelectedBrand(null); setIsModalOpen(true); }}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-zinc-900 text-white px-4 py-2.5 rounded-2xl font-bold text-[10px] md:text-xs uppercase hover:bg-black transition-all shadow-md"
          >
            <Plus size={16} /> <span className="hidden sm:inline">Nueva Marca</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-20 flex flex-col items-center justify-center text-slate-400 gap-3">
              <Loader2 className="animate-spin" size={40} />
              <p className="text-[10px] font-bold uppercase tracking-widest">Consultando marcas...</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse min-w-[500px]">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Marca</th>
                  <th className="hidden md:table-cell p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Descripción</th>
                  <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Estado</th>
                  <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredBrands.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/30 transition-colors group">
                    <td className="p-4 font-bold text-slate-800 text-xs uppercase tracking-tight">{b.nombre}</td>
                    <td className="hidden md:table-cell p-4 text-xs text-slate-500 max-w-xs truncate">{b.descripcion || 'Sin descripción'}</td>
                    <td className="p-4 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                        b.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                      }`}>
                        {b.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => { setSelectedBrand(b); setIsModalOpen(true); }}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"><Edit2 size={14} /></button>
                        <button onClick={() => handleToggleStatus(b)}
                          className={`p-2 rounded-lg transition-all ${b.is_active ? 'hover:text-red-600 hover:bg-red-50' : 'hover:text-emerald-600 hover:bg-emerald-50'}`}><Power size={14} /></button>
                        <button onClick={() => handleDeleteClick(b)} 
                          className="p-2 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-all"><Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <BrandModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={fetchBrands} brandToEdit={selectedBrand} />
      <ConfirmModal 
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Confirmar Eliminación"
        message={`¿Estás seguro de que deseas eliminar la marca "${brandToDelete?.nombre}"?`}
        loading={deleting}
      />
    </div>
  );
};