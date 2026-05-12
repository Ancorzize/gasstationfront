import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Loader2, CreditCard, DollarSign, 
  TrendingUp, Activity, PlusCircle, Calendar, FileText
} from 'lucide-react';
import { clientService } from '../services/clientService';
import { useToast } from '../../../context/ToastContext';
import { PaymentRegistrationModal } from '../../portfolio/components/PaymentRegistrationModal';

export const CustomerStatementPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

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

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <Loader2 className="animate-spin text-zinc-900" size={40} />
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Generando estado de cuenta...</p>
    </div>
  );

  // Desestructuramos solo si loading es false y data existe
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

        <button 
          onClick={() => setIsPaymentModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-zinc-900 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase hover:bg-black transition-all shadow-xl shadow-zinc-200"
        >
          <PlusCircle size={18} /> Registrar Abono
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-5">
          <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0">
            <CreditCard size={28} />
          </div>
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Cupo Total</p>
            <p className="text-xl font-black text-slate-800">$ {Number(cupo_credito).toLocaleString()}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-5">
          <div className="w-14 h-14 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center shrink-0">
            <Activity size={28} />
          </div>
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Saldo Deuda</p>
            <p className="text-xl font-black text-slate-800">$ {Number(saldo_credito).toLocaleString()}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-5">
          <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0">
            <TrendingUp size={28} />
          </div>
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Cupo Disponible</p>
            <p className="text-xl font-black text-slate-800">$ {Number(cupo_disponible).toLocaleString()}</p>
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
                    {mov.tipo_movimiento === 'abono' ? '-' : '+'} ${Number(mov.valor).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right text-[10px] font-bold text-slate-400">
                    ${Number(mov.saldo_anterior).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right text-[11px] font-black text-slate-800">
                    ${Number(mov.saldo_nuevo).toLocaleString()}
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
    </div>
  );
};