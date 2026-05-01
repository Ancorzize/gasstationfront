import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom'; // <--- 1. Importar esto
import { 
  ArrowDownCircle, Plus, Search, Loader2, 
  Calendar, Truck, Tag, Banknote, 
  ExternalLink, AlertCircle, FileSpreadsheet, Eye
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { expenseService } from '../services/expenseService';
import { cashService } from '../../cash/services/cashService';
import { useToast } from '../../../context/ToastContext';
import { usePermissions } from '../../../hooks/usePermissions';
import { ExpenseFormModal } from '../components/ExpenseFormModal';
import { getTodayStr } from '../../../shared/utils/dateUtils';

export const ExpenseListPage = () => {
  const navigate = useNavigate(); // <--- 2. Inicializar esto
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCashOpen, setIsCashOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [dateRange, setDateRange] = useState({
    inicio: getTodayStr(),
    fin: getTodayStr()
  });

  const { hasPermission } = usePermissions();
  const { showToast } = useToast();

  const loadData = async () => {
    setLoading(true);
    try {
      const [expRes, cashRes] = await Promise.all([
        expenseService.getExpenses({ 
          fecha_desde: dateRange.inicio, 
          fecha_hasta: dateRange.fin 
        }),
        cashService.getCurrentCash()
      ]);

      if (expRes.status) setExpenses(expRes.data.items || []);
      setIsCashOpen(cashRes.status === true && !!cashRes.data);
      
    } catch (e) {
      showToast("Error al sincronizar datos", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [dateRange]);

  const exportToExcel = () => {
    if (expenses.length === 0) return showToast("No hay datos para exportar", "warning");

    const dataToExport = expenses.map(exp => ({
      ID: exp.id,
      'Fecha gasto': exp.fecha_gasto,
      Descripción: exp.descripcion,
      Categoría: exp.categoria_gasto?.nombre,
      Proveedor: exp.proveedor?.nombre || 'Gasto General',
      'Medio Pago': exp.medio_pago,
      Valor: parseFloat(exp.valor),
      'Usuario registro': exp.usuario?.name,
      Estado: exp.estado,
      'Motivo anulación':exp.motivo_anulacion,
      'Usuario anulación': exp.usuario_anulacion?.name,
      'Fecha anulación':exp.fecha_anulacion,
   
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Gastos");
    XLSX.writeFile(wb, `Reporte_Gastos_${dateRange.inicio}_al_${dateRange.fin}.xlsx`);
  };

  const filteredExpenses = expenses.filter(exp => 
    exp.descripcion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    exp.proveedor?.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    exp.categoria_gasto?.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    exp.medio_pago.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 md:p-8 space-y-6 pb-20">
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-black text-slate-800 uppercase flex items-center gap-3">
              Gastos Administrativos
          </h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">
            Control financiero de egresos
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center bg-white border border-slate-100 p-1.5 rounded-2xl shadow-sm">
             <div className="flex items-center gap-2 px-3">
                <Calendar size={14} className="text-slate-400" />
                <input type="date" className="text-[10px] font-black outline-none uppercase"
                  value={dateRange.inicio} onChange={(e) => setDateRange({...dateRange, inicio: e.target.value})} />
             </div>
             <div className="w-px h-4 bg-slate-100 mx-2" />
             <div className="flex items-center gap-2 px-3">
                <input type="date" className="text-[10px] font-black outline-none uppercase"
                  value={dateRange.fin} onChange={(e) => setDateRange({...dateRange, fin: e.target.value})} />
             </div>
          </div>

          <button 
            onClick={exportToExcel}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-2xl font-bold text-[10px] md:text-xs uppercase hover:bg-emerald-700 transition-all shadow-md"
          >
            <FileSpreadsheet size={16} /> Exportar
          </button>

          {hasPermission('crear_gastos') && (
            <button 
              onClick={() => setIsModalOpen(true)}
              disabled={!isCashOpen}
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-[10px] uppercase transition-all shadow-xl ${
                isCashOpen ? 'bg-zinc-900 text-white hover:bg-black shadow-zinc-200' : 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none border border-slate-200'
              }`}
            >
              <Plus size={16} /> Registrar Gasto
            </button>
          )}
        </div>
      </header>

      <div className="relative group max-w-md">
        <Search className="absolute left-4 top-3 text-slate-400 group-focus-within:text-zinc-900 transition-colors" size={18} />
        <input 
          type="text" placeholder="Buscar por descripción, proveedor o categoría..." 
          className="w-full pl-12 pr-4 py-3 bg-white border border-slate-100 rounded-2xl text-[10px] font-bold uppercase outline-none focus:border-zinc-900 shadow-sm transition-all"
          value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {!isCashOpen && !loading && (
        <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex items-center gap-4 text-amber-700">
          <AlertCircle size={20} />
          <p className="text-[10px] font-black uppercase">Caja cerrada. No se permiten nuevos registros.</p>
        </div>
      )}

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Fecha</th>
                
                <th className="px-6 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Categoría</th>
                <th className="px-6 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Proveedor</th>
                <th className="px-6 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Medio</th>
                <th className="px-6 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Monto</th>
                <th className="px-6 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Estado</th>
                <th className="px-6 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan="7" className="py-20 text-center"><Loader2 className="animate-spin mx-auto text-slate-200" size={32} /></td></tr>
              ) : filteredExpenses.map((exp) => (
                <tr key={exp.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4"><span className="text-[10px] font-bold text-slate-500">{exp.fecha_gasto}</span></td>
                 
                  <td className="px-6 py-4"><span className="px-3 py-1 bg-slate-100 rounded-full text-[9px] font-black text-slate-500 uppercase">{exp.categoria_gasto?.nombre}</span></td>
                  <td className="px-6 py-4"><span className="text-[10px] font-bold text-slate-400 uppercase">{exp.proveedor?.nombre || 'Gasto General'}</span></td>
                  <td className="px-6 py-4"><span className="px-3 py-1 bg-slate-100 rounded-full text-[9px] font-black text-slate-500 uppercase">{exp.medio_pago}</span></td>
                  <td className="px-6 py-4"><span className="text-xs font-black text-red-500 tracking-tighter">- ${parseFloat(exp.valor).toLocaleString('es-CO')}</span></td>
                  <td className="px-6 py-4"><span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${exp.estado === 'anulado'? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>{exp.estado}</span></td>
                  <td className="px-6 py-4 text-center">
                    <button 
                      onClick={() => navigate(`/gastos/${exp.id}`)} 
                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                    >
                      <Eye size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ExpenseFormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={loadData} />
    </div>
  );
};