import React, { useEffect, useState, useMemo } from 'react';
import { 
  Layers, Plus, Search, Loader2, Edit2, 
  Power, Info, Download 
} from 'lucide-react';
import { expenseService } from '../services/expenseService';
import { useToast } from '../../../context/ToastContext';
import { usePermissions } from '../../../hooks/usePermissions';
import { CategoryFormModal } from '../components/CategoryFormModal';

export const ExpenseCategoryPage = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null); // Para edición
  const { hasPermission } = usePermissions();
  const { showToast } = useToast();

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await expenseService.getCategories();
      if (res.status === true) setCategories(res.data.items || []);
    } catch (e) {
      showToast("Error al cargar categorías", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCategories(); }, []);

  const handleStatusChange = async (category) => {
    if (!hasPermission('cambiar_estado_categorias_gasto')) return;
    
    try {
      const res = await expenseService.updateCategoryStatus(category.id, !category.is_active);
      if (res.status === true) {
        showToast("Estado actualizado", "success");
        fetchCategories(); // Recargamos para mantener consistencia con proveedores
      }
    } catch (e) {
      showToast("No se pudo cambiar el estado", "error");
    }
  };

  const filteredCategories = useMemo(() => {
    return categories.filter(cat => 
      cat.nombre.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, categories]);

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight uppercase flex items-center gap-3">
             Categorías
          </h2>
          <p className="text-slate-500 text-xs md:text-sm">Clasificación para egresos administrativos.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 md:gap-3">
          <div className="relative flex-1 md:flex-none min-w-[150px]">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
            <input 
              type="text" placeholder="Buscar..." 
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs outline-none focus:border-emerald-500 transition-all shadow-sm"
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {hasPermission('crear_categorias_gasto') && (
            <button 
              onClick={() => { setSelectedCategory(null); setIsModalOpen(true); }}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-zinc-900 text-white px-4 py-2.5 rounded-2xl font-bold text-[10px] md:text-xs uppercase hover:bg-black transition-all shadow-md"
            >
              <Plus size={16} /> <span className="hidden sm:inline">Nueva Categoría</span>
            </button>
          )}
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
            <table className="w-full text-left border-collapse min-w-[600px] md:min-w-full">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Categoría</th>
                  <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Descripción</th>
                  <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Estado</th>
                  <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredCategories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-slate-50/30 transition-colors group text-slate-600">
                    <td className="p-4 font-bold text-slate-800 text-xs uppercase">{cat.nombre}</td>
                    <td className="p-4 text-xs italic text-slate-400">{cat.descripcion || '---'}</td>
                    <td className="p-4 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                        cat.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                      }`}>
                        {cat.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {hasPermission('editar_categorias_gasto') && (
                          <button 
                            onClick={() => { setSelectedCategory(cat); setIsModalOpen(true); }}
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                          >
                            <Edit2 size={14} />
                          </button>
                        )}
                        
                        {hasPermission('cambiar_estado_categorias_gasto') && (
                          <button 
                            onClick={() => handleStatusChange(cat)}
                            className={`p-2 rounded-lg transition-all ${cat.is_active ? 'hover:text-red-600 hover:bg-red-50' : 'hover:text-emerald-600 hover:bg-emerald-50'}`}
                          >
                            <Power size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
        <Info size={18} className="text-blue-500" />
        <p className="text-[10px] font-bold text-slate-400 uppercase">
          Las categorías inactivas no aparecerán en nuevos registros pero se mantienen en reportes.
        </p>
      </div>

      <CategoryFormModal 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); setSelectedCategory(null); }} 
        onSave={fetchCategories} 
        categoryToEdit={selectedCategory} 
      />
    </div>
  );
};