import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Wallet, Plus, Lock, ArrowUpCircle, ArrowDownCircle, 
  Banknote, CreditCard, History, Loader2, Info, 
  LockOpen, Power, AlertTriangle, User, Calendar
} from 'lucide-react';
import { cashService } from '../services/cashService';
import { useToast } from '../../../context/ToastContext';
import { usePermissions } from '../../../hooks/usePermissions';
import { CashOpenModal } from '../components/CashOpenModal';
import { CashCloseModal } from '../components/CashCloseModal';
import { getTodayStr } from '../../../shared/utils/dateUtils';

export const CashSessionPage = () => {
  const navigate = useNavigate();
  const [cashSessions, setCashSessions] = useState([]);
  const [summary, setSummary] = useState(null);
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('');
  const [isOpenModalOpen, setIsOpenModalOpen] = useState(false);
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const { hasPermission } = usePermissions();
  const { showToast } = useToast();

  const loadCashData = async () => {
    setLoading(true);
    try {
      const res = await cashService.getCurrentCash();
      if (res.status === true && res.data && res.data.length > 0) {
        setCashSessions(res.data);
      
        const [sumRes, movRes] = await Promise.all([
          cashService.getSummary(),
          cashService.getMovements({ 
            per_page: 100, 
            fecha: getTodayStr() 
          })
        ]);
        
        if (sumRes.status) setSummary(sumRes.data);
        if (movRes.status) setMovements(movRes.data.items || []);
      } else {
        setCashSessions([]);
        setSummary(null);
        setMovements([]);
      }
    } catch (e) {
      showToast("Error al sincronizar datos de caja", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCashData();
  }, []);

 const displayedMovements = React.useMemo(() => {
  if (filterType === '') return movements;
  return movements.filter(mov => mov.caja?.tipo_caja === filterType);
}, [movements, filterType]);

  const isCashOpen = cashSessions.length > 0;
  const mainSession = cashSessions[0];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="animate-spin text-zinc-900" size={40} />
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Verificando estado de cajas...</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 uppercase flex items-center gap-3">
            <Wallet className={isCashOpen ? "text-emerald-500" : "text-slate-300"} size={28} /> 
            Control de Caja
          </h2>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            {isCashOpen 
              ? `Jornada abierta por ${mainSession.usuario_apertura?.name}` 
              : 'Sistema de tesorería fuera de línea'}
          </p>
        </div>

        <div className="flex items-center gap-2">
            {hasPermission('ver_caja') && (
              <button 
                onClick={() => navigate('/caja/historico')}
                className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-2xl font-black text-[10px] uppercase hover:bg-slate-50 transition-all shadow-sm"
              >
                <History size={16} /> Histórico de cajas
              </button>
            )}

            {isCashOpen && hasPermission('cerrar_caja') && (
              <button 
                onClick={() => setIsCloseModalOpen(true)}
                className="flex items-center gap-2 px-6 py-3 bg-red-50 text-red-600 border border-red-100 rounded-2xl font-black text-[10px] uppercase hover:bg-red-600 hover:text-white transition-all shadow-sm"
              >
                <Power size={16} /> Cerrar Cajas
              </button>
            )}
        </div>
      </header>

      {!isCashOpen ? (
        <div className="max-w-2xl mx-auto mt-12">
          <div className="bg-white rounded-[3rem] p-12 text-center border-2 border-dashed border-slate-100 shadow-sm">
            <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 border border-slate-100">
              <Lock className="text-slate-200" size={48} />
            </div>
            <h3 className="text-xl font-black text-slate-700 uppercase mb-2">Cajas Cerradas</h3>
            <p className="text-slate-400 text-xs font-medium uppercase tracking-tight mb-10 max-w-sm mx-auto">
              Para registrar cualquier movimiento de efectivo o digital, primero debe realizar la apertura de ambas cajas.
            </p>
            
            {hasPermission('abrir_caja') ? (
              <button 
                onClick={() => setIsOpenModalOpen(true)}
                className="inline-flex items-center gap-3 bg-zinc-900 text-white px-10 py-5 rounded-[1.5rem] font-black uppercase text-xs hover:bg-black transition-all shadow-2xl shadow-zinc-200"
              >
                <LockOpen size={18} /> Abrir Cajas (Efectivo & Digital)
              </button>
            ) : (
              <div className="flex items-center justify-center gap-2 text-amber-500 bg-amber-50 py-3 px-6 rounded-2xl inline-block mx-auto">
                <AlertTriangle size={16} />
                <span className="text-[10px] font-black uppercase">No tienes permisos para abrir caja</span>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-emerald-600 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-emerald-100 relative overflow-hidden">
                <Banknote className="absolute -right-4 -bottom-4 text-emerald-500 opacity-20" size={120} />
                <div className="relative z-10">
                  <div className="flex justify-between items-center mb-6">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] bg-white/10 px-3 py-1 rounded-full text-white">Caja Efectivo</span>
                    <ArrowUpCircle size={20} className="text-emerald-300" />
                  </div>
                  <p className="text-4xl font-black tracking-tighter mb-2">
                    $ {Number(summary?.efectivo?.saldo_sistema || 0).toLocaleString('es-CO')}
                  </p>
                  <div className="flex flex-col gap-1 mt-6 pt-4 border-t border-white/10 text-[10px] font-black uppercase">
                    <span className="text-emerald-200">Ingresos: ${Number(summary?.efectivo?.ingresos || 0).toLocaleString()}</span>
                    <span className="text-emerald-200 opacity-70">Egresos: ${Number(summary?.efectivo?.egresos || 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="bg-blue-600 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-blue-100 relative overflow-hidden">
                <CreditCard className="absolute -right-4 -bottom-4 text-blue-500 opacity-30" size={120} />
                <div className="relative z-10">
                  <div className="flex justify-between items-center mb-6">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] bg-white/10 px-3 py-1 rounded-full text-white">Caja Digital</span>
                    <CreditCard size={20} className="text-blue-300" />
                  </div>
                  <p className="text-4xl font-black tracking-tighter mb-2">
                    $ {Number(summary?.digital?.saldo_sistema || 0).toLocaleString('es-CO')}
                  </p>
                  <div className="flex flex-col gap-1 mt-6 pt-4 border-t border-white/10 text-[10px] font-black uppercase">
                    <span className="text-blue-200">Ingresos: ${Number(summary?.digital?.ingresos || 0).toLocaleString()}</span>
                    <span className="text-blue-200 opacity-70">Egresos: ${Number(summary?.digital?.egresos || 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
              <div className="p-6 border-b flex flex-col md:flex-row justify-between items-center bg-slate-50/50 gap-4">
                <h3 className="text-xs font-black text-slate-500 uppercase flex items-center gap-2">
                  <History size={16} /> Auditoría Combinada
                </h3>
                <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
                   <button 
                    onClick={() => setFilterType('')}
                    className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${filterType === '' ? 'bg-zinc-900 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}
                   >Todos</button>
                   <button 
                    onClick={() => setFilterType('efectivo')}
                    className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${filterType === 'efectivo' ? 'bg-zinc-900 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}
                   >Efectivo</button>
                   <button 
                    onClick={() => setFilterType('digital')}
                    className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${filterType === 'digital' ? 'bg-zinc-900 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}
                   >Digital</button>
                </div>
              </div>
               <div className="max-h-[450px] overflow-y-auto overflow-x-auto custom-scrollbar-light">
                <table className="w-full text-left">
                  <tbody className="divide-y divide-slate-50">
                    {displayedMovements.length > 0 ? (
                      displayedMovements.map((mov) => (
                        <tr key={mov.id} className="group hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-4">
                              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                                mov.tipo_movimiento === 'ingreso' ? 'bg-emerald-50 text-emerald-500' : 'bg-red-50 text-red-500'
                              }`}>
                                {mov.tipo_movimiento === 'ingreso' ? <ArrowUpCircle size={20} /> : <ArrowDownCircle size={20} />}
                              </div>
                              <div>
                                <p className="text-xs font-black text-slate-700 uppercase leading-tight">{mov.descripcion}</p>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded border 
                                    ${mov.caja?.tipo_caja === 'efectivo' 
                                      ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                                      : 'bg-blue-50 text-blue-600 border-blue-100'
                                    }`}>
                                      {mov.caja?.tipo_caja}
                                  </span>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                                        {mov.categoria_movimiento} • {new Date(mov.created_at).toLocaleTimeString()}
                                    </p>
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className={`text-sm font-black tracking-tighter ${
                              mov.tipo_movimiento === 'ingreso' ? 'text-emerald-600' : 'text-red-500'
                            }`}>
                              {mov.tipo_movimiento === 'ingreso' ? '+' : '-'} $ {parseFloat(mov.monto).toLocaleString()}
                            </span>
                            <p className="text-[9px] font-black text-slate-300 uppercase">{mov.medio_pago}</p>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td className="px-6 py-20 text-center text-[10px] font-black text-slate-300 uppercase italic">
                          No se registran movimientos para este filtro
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm space-y-8">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Estado de Operación</h4>
              
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400">
                  <User size={20} />
                </div>
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase">Cajero de Turno</p>
                  <p className="text-xs font-black text-slate-700 uppercase">{mainSession.usuario_apertura?.name}</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400">
                  <Calendar size={20} />
                </div>
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase">Apertura Global</p>
                  <p className="text-xs font-black text-slate-700 uppercase">
                    {new Date(mainSession.fecha_apertura).toLocaleDateString()}
                  </p>
                  <p className="text-[10px] font-bold text-slate-400">{new Date(mainSession.fecha_apertura).toLocaleTimeString()}</p>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-50">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <p className="text-[9px] font-black text-slate-400 uppercase mb-2 flex items-center gap-1">
                    <Info size={12} /> Nota de Apertura
                  </p>
                  <p className="text-[11px] font-medium text-slate-600 italic">
                    "{mainSession.observacion_apertura || 'Sin observaciones'}"
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-amber-50 rounded-[2.5rem] p-6 border border-amber-100 flex items-start gap-4">
               <AlertTriangle className="text-amber-500 shrink-0" size={20} />
               <p className="text-[10px] font-bold text-amber-700 leading-relaxed uppercase">
                 El cierre de cajas es simultáneo. Verifique el saldo digital en su plataforma bancaria antes de finalizar.
               </p>
            </div>
          </div>
        </div>
      )}

      <CashOpenModal 
        isOpen={isOpenModalOpen} 
        onClose={() => setIsOpenModalOpen(false)} 
        onSave={loadCashData} 
      />

      <CashCloseModal 
        isOpen={isCloseModalOpen} 
        onClose={() => setIsCloseModalOpen(false)} 
        summary={summary}
        onSave={loadCashData} 
      />
    </div>
  );
};