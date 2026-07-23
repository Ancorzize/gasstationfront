import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wallet, Plus, Lock, ArrowUpCircle, ArrowDownCircle, Banknote, CreditCard, History, Loader2, Power, X, Tag } from 'lucide-react';
import { cashService } from '../services/cashService';
import { useToast } from '../../../context/ToastContext';
import { usePermissions } from '../../../hooks/usePermissions';
import { CashOpenModal } from '../components/CashOpenModal';
import { CashCloseModal } from '../components/CashCloseModal';
import { getTodayStr } from '../../../shared/utils/dateUtils';

export const CashSessionPage = () => {
  const navigate = useNavigate();
  const [cashSessions, setCashSessions] = useState([]);
  const [summary, setSummary] = useState([]);
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMovements, setLoadingMovements] = useState(false);
  const [selectedCajaId, setSelectedCajaId] = useState(null);
  const [isOpenModalOpen, setIsOpenModalOpen] = useState(false);
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  
  const { hasPermission } = usePermissions();
  const { showToast } = useToast();

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const res = await cashService.getCurrentCash();
      if (res.status === true) {
        setCashSessions(res.data || []);
        const [sumRes, movRes] = await Promise.all([
          cashService.getSummary(),
          cashService.getMovements({ fecha: getTodayStr() })
        ]);
        if (sumRes.status) setSummary(sumRes.data || []);
        if (movRes.status) setMovements(movRes.data.items || []);
      }
    } catch (e) {
      showToast("Error al sincronizar datos de caja", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const handleCajaClick = async (id) => {
    if (selectedCajaId === id) {
      setSelectedCajaId(null);
      await loadInitialData();
    } else {
      setSelectedCajaId(id);
      setLoadingMovements(true);
      try {
        const res = await cashService.getMovements({ 
          caja_id: id, 
          fecha: getTodayStr() 
        });
        setMovements(res.status ? (res.data.items || []) : []);
      } catch (e) {
        showToast("Error al filtrar movimientos", "error");
      } finally {
        setLoadingMovements(false);
      }
    }
  };

  const isCashOpen = cashSessions.length > 0;

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <Loader2 className="animate-spin text-zinc-900" size={40} />
    </div>
  );

  return (
    <div className="p-4 md:p-8 space-y-6">
      <header className="flex justify-between items-center">
        <h2 className="text-2xl font-black text-slate-800 uppercase flex items-center gap-3">
          <Wallet className={isCashOpen ? "text-emerald-500" : "text-slate-300"} size={28} /> Control de Caja
        </h2>
        <div className="flex gap-2">
          {hasPermission('ver_caja') && (
            <button onClick={() => navigate('/caja/historico')} className="px-5 py-3 bg-white border border-slate-200 rounded-2xl font-black text-[10px] uppercase hover:bg-slate-50 shadow-sm">
              <History size={16} />
            </button>
          )}
          {hasPermission('abrir_caja') && (
            <button onClick={() => setIsOpenModalOpen(true)} className="px-5 py-3 bg-zinc-900 text-white rounded-2xl font-black text-[10px] uppercase hover:bg-black shadow-lg">
              <Plus size={16} /> Nueva Caja
            </button>
          )}
          {isCashOpen && hasPermission('cerrar_caja') && (
            <button onClick={() => setIsCloseModalOpen(true)} className="px-5 py-3 bg-red-50 text-red-600 rounded-2xl font-black text-[10px] uppercase hover:bg-red-600 hover:text-white transition-all shadow-sm">
              <Power size={16} /> Cerrar Cajas
            </button>
          )}
        </div>
      </header>

      {isCashOpen ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {cashSessions.map((caja) => {
            const data = Array.isArray(summary) ? summary.find(s => s.id === caja.id) : null;
            const isSelected = selectedCajaId === caja.id;
            return (
              <div 
                key={caja.id} 
                onClick={() => handleCajaClick(caja.id)} 
                className={`cursor-pointer p-6 rounded-[2rem] border-2 transition-all duration-300 flex flex-col justify-between ${
                  isSelected ? 'border-zinc-900 bg-slate-50 shadow-md' : 'border-slate-100 bg-white hover:border-slate-200 shadow-sm'
                }`}
              >
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">{caja.nombre}</span>
                    {caja.tipo_caja === 'efectivo' ? (
                      <Banknote className="text-emerald-500 shrink-0" size={18} />
                    ) : (
                      <CreditCard className="text-blue-500 shrink-0" size={18} />
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1.5 mb-4">
                    <span className="text-[8px] font-black uppercase px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md">
                      {caja.tipo_caja}
                    </span>
                    {caja.destino_recaudo && (
                      <span className="text-[8px] font-black uppercase px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-md flex items-center gap-1">
                        <Tag size={10} /> {caja.destino_recaudo.codigo} - {caja.destino_recaudo.nombre}
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Saldo Sistema</p>
                  <p className="text-2xl font-black text-slate-800">$ {Number(data?.saldo_sistema || 0).toLocaleString()}</p>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center p-12 border-2 border-dashed border-slate-100 rounded-[3rem] text-slate-400 font-black uppercase text-xs">No hay cajas abiertas</div>
      )}

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b flex justify-between items-center bg-slate-50/50">
          <h3 className="text-xs font-black text-slate-500 uppercase">{selectedCajaId ? 'Movimientos filtrados' : 'Auditoría General'}</h3>
          {selectedCajaId && <button onClick={() => handleCajaClick(selectedCajaId)} className="text-[9px] font-black text-red-500 bg-red-50 px-3 py-1 rounded-lg flex items-center gap-1"><X size={12}/> Quitar filtro</button>}
        </div>
        
        {loadingMovements ? (
            <div className="p-20 text-center text-slate-400"><Loader2 className="animate-spin mx-auto" /></div>
        ) : (
            <table className="w-full text-left">
              <tbody className="divide-y divide-slate-50">
                {movements.length > 0 ? movements.map((mov) => (
                  <tr key={mov.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${mov.tipo_movimiento === 'ingreso' ? 'bg-emerald-50 text-emerald-500' : 'bg-red-50 text-red-500'}`}>
                          {mov.tipo_movimiento === 'ingreso' ? <ArrowUpCircle size={20} /> : <ArrowDownCircle size={20} />}
                        </div>
                        <div>
                          <p className="text-xs font-black text-slate-700 uppercase">{mov.descripcion}</p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase">{mov.categoria_movimiento}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-black text-sm text-slate-700">
                      {mov.tipo_movimiento === 'ingreso' ? '+' : '-'} $ {Number(mov.monto).toLocaleString()}
                    </td>
                  </tr>
                )) : (
                    <tr><td colSpan="2" className="text-center py-10 text-[10px] font-black text-slate-400 uppercase">No hay movimientos registrados</td></tr>
                )}
              </tbody>
            </table>
        )}
      </div>

      <CashOpenModal isOpen={isOpenModalOpen} onClose={() => setIsOpenModalOpen(false)} onSave={loadInitialData} />
      <CashCloseModal isOpen={isCloseModalOpen} onClose={() => setIsCloseModalOpen(false)} summary={summary} onSave={loadInitialData} />
    </div>
  );
};