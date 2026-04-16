import React, { useEffect, useState } from 'react';
import { 
  ArrowDownCircle, Plus, Search, Loader2, 
  Calendar, Truck, Tag, CreditCard, Banknote,
  Filter, ExternalLink, AlertCircle
} from 'lucide-react';
import { expenseService } from '../services/expenseService';
import { cashService } from '../../cash/services/cashService';
import { useToast } from '../../../context/ToastContext';
import { usePermissions } from '../../../hooks/usePermissions';
import { ExpenseFormModal } from '../components/ExpenseFormModal';

export const ExpenseListPage = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCashOpen, setIsCashOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { hasPermission } = usePermissions();
  const { showToast } = useToast();

  const loadData = async () => {
    setLoading(true);
    try {
      // Validamos si hay caja abierta y cargamos gastos en paralelo
      const [expRes, cashRes] = await Promise.all([
        expenseService.getExpenses(),
        cashService.getCurrentCash()
      ]);

      if (expRes.status === true) setExpenses(expRes.data.items || []);
      setIsCashOpen(cashRes.status === true && !!cashRes.data);
      
    } catch (e) {
   
      showToast("Error al sincronizar datos", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const filteredExpenses = expenses.filter(exp => 
    exp.descripcion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    exp.proveedor?.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    exp.categoria_gasto?.nombre?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 md:p-8 space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 uppercase flex items-center gap-3">
            <ArrowDownCircle className="text-red-500" size={28} /> Gastos Administrativos
          </h2>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest italic">
            Registro de egresos y salidas de dinero
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="relative group">
            <Search className="absolute left-4 top-3 text-slate-400 group-focus-within:text-zinc-900 transition-colors" size={18} />
            <input 
              type="text" placeholder="Buscar gasto..." 
              className="w-full md:w-64 pl-12 pr-4 py-3 bg-white border border-slate-100 rounded-2xl text-xs outline-none focus:border-zinc-900 shadow-sm transition-all"
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {hasPermission('crear_gastos') && (
            <button 
              onClick={() => setIsModalOpen(true)}
              disabled={!isCashOpen}
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-[10px] uppercase transition-all shadow-xl ${
                isCashOpen 
                ? 'bg-zinc-900 text-white hover:bg-black shadow-zinc-200' 
                : 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none border border-slate-200'
              }`}
            >
              <Plus size={16} /> Registrar Gasto
            </button>
          )}
        </div>
      </header>

      {/* AVISO DE CAJA CERRADA */}
      {!isCashOpen && !loading && (
        <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex items-center gap-4 text-amber-700">
          <AlertCircle size={20} className="shrink-0" />
          <p className="text-[10px] font-black uppercase">
            Atención: La caja general está cerrada. Debes realizar la apertura de caja para poder registrar nuevos gastos.
          </p>
        </div>
      )}

      {/* TABLA DE GASTOS */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-50">
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Fecha / Descripción</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Categoría</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Proveedor</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Medio Pago</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Valor</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center w-20"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-20 text-center">
                    <Loader2 className="animate-spin mx-auto text-slate-200" size={32} />
                  </td>
                </tr>
              ) : filteredExpenses.length > 0 ? (
                filteredExpenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-xs font-black text-slate-700 uppercase tracking-tight line-clamp-1">{exp.descripcion}</span>
                        <div className="flex items-center gap-1 text-[9px] font-bold text-slate-400">
                          <Calendar size={10} /> {new Date(exp.fecha_gasto).toLocaleDateString()}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Tag size={12} className="text-slate-300" />
                        <span className="text-[10px] font-black text-slate-500 uppercase">{exp.categoria_gasto?.nombre}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Truck size={12} className="text-slate-300" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                          {exp.proveedor?.nombre || 'Gasto General'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {exp.medio_pago === 'efectivo' ? (
                          <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100">
                            <Banknote size={12} />
                            <span className="text-[9px] font-black uppercase">Efectivo</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 px-2 py-1 bg-blue-50 text-blue-600 rounded-lg border border-blue-100">
                            <CreditCard size={12} />
                            <span className="text-[9px] font-black uppercase">Virtual</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm font-black text-red-500 tracking-tighter">
                        - ${parseFloat(exp.valor).toLocaleString('es-CO')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button className="p-2 text-slate-300 hover:text-zinc-900 transition-colors">
                        <ExternalLink size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="py-20 text-center">
                    <p className="text-slate-400 text-xs font-bold uppercase italic tracking-widest">
                      No se han registrado gastos en el periodo actual
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ExpenseFormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={loadData} />
    </div>
  );
};