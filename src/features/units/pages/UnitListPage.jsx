import React, { useEffect, useState, useMemo } from 'react';
import { Search, Edit2, Power, Ruler, Loader2, Download, Plus, Trash2 } from 'lucide-react';
import { unitService } from '../services/unitService';
import { UnitModal } from '../components/UnitModal';
import { ConfirmModal } from '../../../shared/components/ConfirmModal';
import { useToast } from '../../../context/ToastContext';
import { exportToExcel } from '../../../shared/utils/exportExcel';

export const UnitListPage = () => {
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState(null);
  
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [unitToDelete, setUnitToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const { showToast } = useToast();

  const fetchUnits = async () => {
    setLoading(true);
    try {
      const result = await unitService.getUnits('');
      if (result.status) setUnits(result.data.items);
    } catch (error) {
      showToast("Error al cargar unidades", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUnits(); }, []);

  const filteredUnits = useMemo(() => {
    return units.filter(u => 
      u.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      u.abreviatura?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, units]);

  const handleToggleStatus = async (unit) => {
    const result = await unitService.toggleStatus(unit.id, !unit.is_active);
    if (result.status) {
      showToast(result.message, "success");
      fetchUnits();
    }
  };

  const handleDeleteClick = (unit) => {
    setUnitToDelete(unit);
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    setDeleting(true);
    try {
      const result = await unitService.deleteUnit(unitToDelete.id);
      if (result.status) {
        showToast(result.message, "success");
        fetchUnits();
        setIsConfirmOpen(false);
      }
    } catch (error) {
      showToast("Error al eliminar registro", "error");
    } finally {
      setDeleting(false);
      setUnitToDelete(null);
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight uppercase flex items-center gap-3">
            Unidades de Medida
          </h2>
          <p className="text-slate-500 text-xs md:text-sm">Magnitudes para el control de inventario.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          <button 
            onClick={() => exportToExcel(filteredUnits, 'Unidades_Medida')}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-2xl font-bold text-[10px] md:text-xs uppercase hover:bg-emerald-700 transition-all shadow-md"
          >
            <Download size={16} /> <span className="hidden sm:inline">Excel</span>
          </button>

          <div className="relative flex-1 md:flex-none min-w-[150px]">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
            <input 
              type="text" placeholder="Buscar unidad..." 
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs outline-none focus:border-orange-500 transition-all shadow-sm"
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <button 
            onClick={() => { setSelectedUnit(null); setIsModalOpen(true); }}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-zinc-900 text-white px-4 py-2.5 rounded-2xl font-bold text-[10px] md:text-xs uppercase hover:bg-black transition-all shadow-md"
          >
            <Plus size={16} /> <span className="hidden sm:inline">Nueva Unidad</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-20 flex flex-col items-center justify-center text-slate-400 gap-3">
              <Loader2 className="animate-spin" size={40} />
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-300">Consultando...</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse min-w-[500px]">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Abrev.</th>
                  <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nombre</th>
                  <th className="hidden md:table-cell p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Descripción</th>
                  <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Estado</th>
                  <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredUnits.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/30 transition-colors">
                    <td className="p-4"><span className="bg-slate-100 text-slate-600 px-2 py-1 rounded-lg text-[10px] font-black">{u.abreviatura}</span></td>
                    <td className="p-4 font-bold text-slate-800 text-xs uppercase">{u.nombre}</td>
                    <td className="hidden md:table-cell p-4 text-xs text-slate-500 truncate max-w-xs">{u.descripcion || '---'}</td>
                    <td className="p-4 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                        u.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                      }`}>
                        {u.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => { setSelectedUnit(u); setIsModalOpen(true); }}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"><Edit2 size={14} /></button>
                        <button onClick={() => handleToggleStatus(u)}
                          className={`p-2 rounded-lg transition-all ${u.is_active ? 'hover:text-red-600 hover:bg-red-50' : 'hover:text-emerald-600 hover:bg-emerald-50'}`}><Power size={14} /></button>
                        <button onClick={() => handleDeleteClick(u)}
                          className="p-2 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-all"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <UnitModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={fetchUnits} unitToEdit={selectedUnit} />
      
      <ConfirmModal 
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Eliminar Unidad"
        message={`¿Estás seguro de eliminar "${unitToDelete?.nombre}"? Esta acción borrará el registro definitivamente de la base de datos.`}
        loading={deleting}
      />
    </div>
  );
};