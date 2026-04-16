import React, { useEffect, useState } from 'react';
import { 
  Layers, Plus, Search, Loader2, Edit3, 
  ToggleLeft, ToggleRight, Info, Trash2 
} from 'lucide-react';
import { expenseService } from '../services/expenseService';
import { useToast } from '../../../context/ToastContext';
import { usePermissions } from '../../../hooks/usePermissions';

export const ExpenseCategoryPage = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
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

  const handleStatusChange = async (id, currentStatus) => {
    if (!hasPermission('cambiar_estado_categorias_gasto')) return;
    
    try {
      const res = await expenseService.updateCategoryStatus(id, !currentStatus);
      if (res.status === true) {
        showToast("Estado actualizado", "success");
        setCategories(categories.map(cat => 
          cat.id === id ? { ...cat, is_active: !currentStatus } : cat
        ));
      }
    } catch (e) {
      showToast("No se pudo cambiar el estado", "error");
    }
  };

  const filteredCategories = categories.filter(cat => 
    cat.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 md:p-8 space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 uppercase flex items-center gap-3">
            <Layers className="text-zinc-400" size={28} /> Categorías de Gasto
          </h2>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Clasificación para egresos administrativos
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-4 top-3 text-slate-400 group-focus-within:text-zinc-900 transition-colors" size={18} />
            <input 
              type="text" placeholder="Buscar categoría..." 
              className="w-full md:w-64 pl-12 pr-4 py-3 bg-white border border-slate-100 rounded-2xl text-xs outline-none focus:border-zinc-900 shadow-sm transition-all"
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {hasPermission('crear_categorias_gasto') && (
            <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-6 py-3 bg-zinc-900 text-white rounded-2xl font-black text-[10px] uppercase hover:bg-black shadow-xl shadow-zinc-200 transition-all">
              <Plus size={16} /> Nueva Categoría
            </button>
          )}
        </div>
      </header>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-50">
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Nombre de Categoría</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Descripción</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Estado</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center w-32">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan="4" className="py-20 text-center">
                    <Loader2 className="animate-spin mx-auto text-slate-200" size={32} />
                  </td>
                </tr>
              ) : filteredCategories.length > 0 ? (
                filteredCategories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <span className="text-xs font-black text-slate-700 uppercase tracking-tight">{cat.nombre}</span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-[10px] font-bold text-slate-400 uppercase italic">
                        {cat.descripcion || 'Sin descripción adicional'}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button 
                        onClick={() => handleStatusChange(cat.id, cat.is_active)}
                        className={`flex items-center justify-center gap-2 mx-auto transition-colors ${cat.is_active ? 'text-emerald-500' : 'text-slate-300'}`}
                      >
                        {cat.is_active ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                        <span className="text-[9px] font-black uppercase w-12 text-left">
                          {cat.is_active ? 'Activa' : 'Inactiva'}
                        </span>
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        {hasPermission('editar_categorias_gasto') && (
                          <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all shadow-sm">
                            <Edit3 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="py-20 text-center text-slate-400 text-xs font-bold uppercase italic italic">
                    No se encontraron categorías de gasto
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Nota de Ayuda */}
      <div className="flex items-center gap-3 p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
        <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center text-blue-500 shadow-sm">
          <Info size={20} />
        </div>
        <p className="text-[10px] font-bold text-slate-400 uppercase leading-relaxed">
          Las categorías inactivas <strong className="text-slate-600">no aparecerán</strong> al momento de registrar nuevos gastos, pero se mantendrán en el historial de reportes antiguos.
        </p>
      </div>

      <CategoryFormModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={fetchCategories} 
      />
    </div>
  );
};