import React, { useEffect, useState } from 'react';
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

export const CashSessionPage = () => {
  const [cashSession, setCashSession] = useState(null);
  const [summary, setSummary] = useState(null);
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Estados de Modales
  const [isOpenModalOpen, setIsOpenModalOpen] = useState(false);
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);

  const { hasPermission } = usePermissions();
  const { showToast } = useToast();

  const loadCashData = async () => {
    setLoading(true);
    try {

      const res = await cashService.getCurrentCash();

      if (res.status === true && res.data) {
        setCashSession(res.data);
      
        const [sumRes, movRes] = await Promise.all([
          cashService.getSummary(),
          cashService.getMovements({ per_page: 10 })
        ]);
        
        if (sumRes.success) setSummary(sumRes.data);
        if (movRes.success) setMovements(movRes.data.items || []);
      } else {
        setCashSession(null);
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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="animate-spin text-zinc-900" size={40} />
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Verificando estado de caja...</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* HEADER DINÁMICO */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 uppercase flex items-center gap-3">
            <Wallet className={cashSession ? "text-emerald-500" : "text-slate-300"} size={28} /> 
            Caja General
          </h2>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            {cashSession 
              ? `Sesión activa desde las ${new Date(cashSession.fecha_apertura).toLocaleTimeString()}` 
              : 'Sistema de tesorería cerrado'}
          </p>
        </div>

        {cashSession && hasPermission('cerrar_caja') && (
          <button 
            onClick={() => setIsCloseModalOpen(true)}
            className="flex items-center gap-2 px-6 py-3 bg-red-50 text-red-600 border border-red-100 rounded-2xl font-black text-[10px] uppercase hover:bg-red-600 hover:text-white transition-all shadow-sm"
          >
            <Power size={16} /> Finalizar Jornada
          </button>
        )}
      </header>

      {!cashSession ? (
        /* VISTA CUANDO LA CAJA ESTÁ CERRADA */
        <div className="max-w-2xl mx-auto mt-12">
          <div className="bg-white rounded-[3rem] p-12 text-center border-2 border-dashed border-slate-100 shadow-sm">
            <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 border border-slate-100">
              <Lock className="text-slate-200" size={48} />
            </div>
            <h3 className="text-xl font-black text-slate-700 uppercase mb-2">Caja Fuera de Servicio</h3>
            <p className="text-slate-400 text-xs font-medium uppercase tracking-tight mb-10 max-w-sm mx-auto">
              Para registrar ventas, gastos o cualquier movimiento de dinero, primero debe realizar la apertura oficial.
            </p>
            
            {hasPermission('abrir_caja') ? (
              <button 
                onClick={() => setIsOpenModalOpen(true)}
                className="inline-flex items-center gap-3 bg-zinc-900 text-white px-10 py-5 rounded-[1.5rem] font-black uppercase text-xs hover:bg-black transition-all shadow-2xl shadow-zinc-200 active:scale-95"
              >
                <LockOpen size={18} /> Iniciar Apertura de Caja
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
        /* VISTA CUANDO LA CAJA ESTÁ ABIERTA */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* LADO IZQUIERDO: RESUMEN Y MOVIMIENTOS */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* CARDS DE SALDOS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Saldo Efectivo */}
              <div className="bg-emerald-600 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-emerald-100 relative overflow-hidden">
                <Banknote className="absolute -right-4 -bottom-4 text-emerald-500 opacity-20" size={120} />
                <div className="relative z-10">
                  <div className="flex justify-between items-center mb-6">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] bg-white/10 px-3 py-1 rounded-full">Sistema Efectivo</span>
                    <ArrowUpCircle size={20} className="text-emerald-300" />
                  </div>
                  <p className="text-4xl font-black tracking-tighter mb-2">
                    $ {parseFloat(summary?.saldo_efectivo_sistema || 0).toLocaleString('es-CO')}
                  </p>
                  <div className="flex gap-4 mt-6 pt-4 border-t border-white/10 text-[10px] font-black uppercase">
                    <span className="text-emerald-200">Entradas: ${parseFloat(summary?.ingresos_efectivo || 0).toLocaleString()}</span>
                    <span className="text-emerald-200">Salidas: ${parseFloat(summary?.egresos_efectivo || 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Saldo Electrónico */}
              <div className="bg-zinc-900 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-zinc-200 relative overflow-hidden">
                <CreditCard className="absolute -right-4 -bottom-4 text-zinc-800 opacity-30" size={120} />
                <div className="relative z-10">
                  <div className="flex justify-between items-center mb-6">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] bg-white/5 px-3 py-1 rounded-full">Medios Digitales</span>
                    <CreditCard size={20} className="text-zinc-500" />
                  </div>
                  <p className="text-4xl font-black tracking-tighter mb-2">
                    $ {parseFloat(summary?.saldo_electronico_sistema || 0).toLocaleString('es-CO')}
                  </p>
                  <div className="flex gap-4 mt-6 pt-4 border-t border-white/5 text-[10px] font-black uppercase">
                    <span className="text-zinc-500">Recibido: ${parseFloat(summary?.ingresos_electronico || 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* TABLA DE MOVIMIENTOS RECIENTES */}
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
              <div className="p-6 border-b flex justify-between items-center bg-slate-50/50">
                <h3 className="text-xs font-black text-slate-500 uppercase flex items-center gap-2">
                  <History size={16} /> Auditoría en Tiempo Real (Hoy)
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <tbody className="divide-y divide-slate-50">
                    {movements.length > 0 ? (
                      movements.map((mov) => (
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
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                                  {mov.categoria_movimiento} • {new Date(mov.fecha_movimiento).toLocaleTimeString()}
                                </p>
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
                        <td className="px-6 py-20 text-center">
                          <p className="text-[10px] font-black text-slate-300 uppercase italic">Esperando primer movimiento del día...</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* LADO DERECHO: INFO DE SESIÓN */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm space-y-8">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Detalles del Turno</h4>
              
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400">
                  <User size={20} />
                </div>
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase">Responsable Apertura</p>
                  <p className="text-xs font-black text-slate-700 uppercase">{cashSession.usuario_apertura?.name}</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400">
                  <Calendar size={20} />
                </div>
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase">Inicio de Jornada</p>
                  <p className="text-xs font-black text-slate-700 uppercase">
                    {new Date(cashSession.fecha_apertura).toLocaleDateString()}
                  </p>
                  <p className="text-[10px] font-bold text-slate-400">{new Date(cashSession.fecha_apertura).toLocaleTimeString()}</p>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-50 space-y-4">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <p className="text-[9px] font-black text-slate-400 uppercase mb-2 flex items-center gap-1">
                    <Info size={12} /> Observación Inicial
                  </p>
                  <p className="text-[11px] font-medium text-slate-600 italic">
                    "{cashSession.observacion_apertura || 'Sin observaciones al abrir'}"
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-amber-50 rounded-[2.5rem] p-6 border border-amber-100 flex items-start gap-4">
               <AlertTriangle className="text-amber-500 shrink-0" size={20} />
               <p className="text-[10px] font-bold text-amber-700 leading-relaxed uppercase">
                 Recuerde que el cierre de caja comparará el efectivo real contado contra el saldo del sistema.
               </p>
            </div>
          </div>
        </div>
      )}

      {/* MODALES DE ACCIÓN */}
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