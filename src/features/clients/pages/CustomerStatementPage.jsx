import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Loader2, CreditCard, DollarSign, 
  TrendingUp, Activity, PlusCircle, Calendar, FileText, X, AlertTriangle 
} from 'lucide-react';
import { clientService } from '../services/clientService';
import { portfolioService } from '../../portfolio/services/portfolioService';
import { useToast } from '../../../context/ToastContext';
import { PaymentRegistrationModal } from '../../portfolio/components/PaymentRegistrationModal';
import { getTodayStr } from '../../../shared/utils/dateUtils';
import { usePermissions } from '../../../hooks/usePermissions';

export const CustomerStatementPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { hasPermission } = usePermissions();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const [isInitialDebtModalOpen, setIsInitialDebtModalOpen] = useState(false);
  const [initialDebtData, setInitialDebtData] = useState({
    fecha_documento: getTodayStr(),
    valor: '',
    observacion: ''
  });
  const [submittingDebt, setSubmittingDebt] = useState(false);

  const fetchStatement = async () => {
    setLoading(true);
    try {
      const res = await clientService.getStatement(id);
      if (res.status) {
        setData(res.data);
      } else {
        showToast(res.message, "error");
        navigate('/clientes');
      }
    } catch (e) {
      showToast("Error al cargar el estado de cuenta", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStatement(); }, [id]);

  const handleRegisterInitialDebt = async (e) => {
    e.preventDefault();
    if (!initialDebtData.fecha_documento) {
      return showToast("La fecha es obligatoria", "error");
    }
    const val = parseFloat(initialDebtData.valor);
    if (!val || val <= 0) {
      return showToast("El valor debe ser mayor a 0", "error");
    }

    setSubmittingDebt(true);
    try {
      const res = await portfolioService.createInitialDebt({
        cliente_id: parseInt(id),
        fecha_documento: initialDebtData.fecha_documento,
        valor: val,
        observacion: initialDebtData.observacion
      });

      if (res.status) {
        showToast(res.message || "Deuda inicial registrada correctamente.", "success");
        setIsInitialDebtModalOpen(false);
        setInitialDebtData({ fecha_documento: getTodayStr(), valor: '', observacion: '' });
        fetchStatement();
      } else {
        showToast(res.message || "Error al registrar deuda inicial", "error");
      }
    } catch (error) {
      showToast("Error al conectar con el servidor", "error");
    } finally {
      setSubmittingDebt(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <Loader2 className="animate-spin text-zinc-900" size={40} />
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Generando estado de cuenta...</p>
    </div>
  );

  const { cliente, movimientos, cupo_credito, saldo_credito, cupo_disponible } = data;

  return (
    <div className="p-4 md:p-8 space-y-8 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/clientes')} className="p-3 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-zinc-900 shadow-sm transition-all">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Estado de Cuenta</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              {cliente?.nombre} {cliente?.apellidos} • {cliente?.documento}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {hasPermission('crear_saldos_iniciales_cartera') && (
            <button 
              onClick={() => setIsInitialDebtModalOpen(true)}
              className="flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 px-6 py-4 rounded-2xl font-black text-[10px] uppercase hover:bg-slate-50 transition-all shadow-sm"
            >
              <PlusCircle size={18} className="text-blue-600" /> Registrar deuda inicial
            </button>
          )}

          <button 
            onClick={() => setIsPaymentModalOpen(true)}
            className="flex items-center justify-center gap-2 bg-zinc-900 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase hover:bg-black transition-all shadow-xl shadow-zinc-200"
          >
            <PlusCircle size={18} /> Registrar Abono
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-5">
          <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0">
            <CreditCard size={28} />
          </div>
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Cupo Total</p>
            <p className="text-xl font-black text-slate-800">$ {Number(cupo_credito || 0).toLocaleString()}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-5">
          <div className="w-14 h-14 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center shrink-0">
            <Activity size={28} />
          </div>
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Saldo Deuda</p>
            <p className="text-xl font-black text-slate-800">$ {Number(saldo_credito || 0).toLocaleString()}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-5">
          <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0">
            <TrendingUp size={28} />
          </div>
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Cupo Disponible</p>
            <p className="text-xl font-black text-slate-800">$ {Number(cupo_disponible || 0).toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
        <div className="p-6 border-b flex items-center justify-between bg-slate-50/50">
          <h3 className="text-xs font-black text-slate-500 uppercase flex items-center gap-2">
            <FileText size={16} /> Historial de Movimientos de Cartera
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/30 border-b border-slate-50">
                <th className="px-6 py-4">Fecha</th>
                <th className="px-6 py-4">Tipo</th>
                <th className="px-6 py-4">Descripción</th>
                <th className="px-6 py-4 text-right">Monto</th>
                <th className="px-6 py-4 text-right">Saldo Anterior</th>
                <th className="px-6 py-4 text-right">Nuevo Saldo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {movimientos?.length > 0 ? movimientos.map((mov) => (
                <tr key={mov.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-slate-400">
                      <Calendar size={14} />
                      <span className="text-[10px] font-bold uppercase">{new Date(mov.fecha_movimiento).toLocaleDateString()}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase ${
                      mov.tipo_movimiento === 'abono' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                    }`}>
                      {mov.tipo_movimiento}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-[10px] font-black text-slate-700 uppercase leading-tight">{mov.descripcion}</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase">{mov.medio_pago || 'CRÉDITO'}</p>
                  </td>
                  <td className={`px-6 py-4 text-right font-black text-xs ${mov.tipo_movimiento === 'abono' ? 'text-emerald-600' : 'text-red-600'}`}>
                    {mov.tipo_movimiento === 'abono' ? '-' : '+'} ${Number(mov.valor || 0).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right text-[10px] font-bold text-slate-400">
                    ${Number(mov.saldo_anterior || 0).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right text-[11px] font-black text-slate-800">
                    ${Number(mov.saldo_nuevo || 0).toLocaleString()}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="6" className="px-6 py-20 text-center text-[10px] font-black text-slate-300 uppercase italic">
                    Este cliente no registra movimientos de cartera
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {cliente && (
        <PaymentRegistrationModal 
          isOpen={isPaymentModalOpen} 
          onClose={() => setIsPaymentModalOpen(false)} 
          onSave={fetchStatement} 
          client={cliente} 
        />
      )}

      {/* MODAL: REGISTRAR DEUDA INICIAL */}
      <AnimatePresence>
        {isInitialDebtModalOpen && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsInitialDebtModalOpen(false)} 
              className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm" 
            />
            
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden p-6 md:p-8 space-y-6 z-10"
            >
              <div className="flex justify-between items-center border-b pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-inner">
                    <PlusCircle size={20} />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-800 text-sm uppercase">Registrar deuda inicial</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{cliente?.nombre} {cliente?.apellidos}</p>
                  </div>
                </div>
                <button onClick={() => setIsInitialDebtModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-50 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleRegisterInitialDebt} id="form-initial-debt" className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Fecha de la deuda *</label>
                  <input 
                    type="date"
                    required
                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold uppercase outline-none focus:border-zinc-900 transition-all"
                    value={initialDebtData.fecha_documento}
                    onChange={(e) => setInitialDebtData({...initialDebtData, fecha_documento: e.target.value})}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Valor *</label>
                  <input 
                    type="number"
                    step="any"
                    required
                    placeholder="0.00"
                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-black outline-none focus:border-zinc-900 transition-all"
                    value={initialDebtData.valor}
                    onChange={(e) => setInitialDebtData({...initialDebtData, valor: e.target.value})}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Observación</label>
                  <textarea 
                    rows="3"
                    placeholder="Ej. Saldo pendiente al iniciar el sistema..."
                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs outline-none focus:border-zinc-900 transition-all resize-none"
                    value={initialDebtData.observacion}
                    onChange={(e) => setInitialDebtData({...initialDebtData, observacion: e.target.value})}
                  />
                </div>
              </form>

              <div className="flex items-center gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setIsInitialDebtModalOpen(false)}
                  className="flex-1 py-3.5 rounded-2xl bg-slate-100 text-slate-600 font-black text-[10px] uppercase hover:bg-slate-200 transition-all"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  form="form-initial-debt"
                  disabled={submittingDebt}
                  className="flex-1 py-3.5 rounded-2xl bg-zinc-900 text-white font-black text-[10px] uppercase hover:bg-black transition-all shadow-lg shadow-zinc-200 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submittingDebt ? <Loader2 className="animate-spin" size={16} /> : "Registrar deuda"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};