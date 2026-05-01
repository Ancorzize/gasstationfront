import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Loader2, Info, AlertTriangle, 
  Calendar, User, Tag, Banknote, CreditCard, 
  Truck, Archive, FileText, CheckCircle2 
} from 'lucide-react';
import { expenseService } from '../services/expenseService';
import { useToast } from '../../../context/ToastContext';
import { usePermissions } from '../../../hooks/usePermissions';
import { VoidExpenseModal } from '../components/VoidExpenseModal';

export const ExpenseDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { hasPermission } = usePermissions();
  
  const [expense, setExpense] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isVoidModalOpen, setIsVoidModalOpen] = useState(false);

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const res = await expenseService.getExpenseById(id);
      if (res.status) {
        setExpense(res.data);
      } else {
        showToast(res.message, "error");
        navigate('/gastos');
      }
    } catch (e) { 
      showToast("Error al cargar detalle", "error"); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { fetchDetail(); }, [id]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <Loader2 className="animate-spin text-zinc-900" size={40} />
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cargando detalle...</p>
    </div>
  );

  if (!expense) return <div className="p-20 text-center uppercase font-black">Gasto no encontrado</div>;

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/gastos')} className="p-3 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-zinc-900 shadow-sm transition-all">
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Gasto #{expense.id}</h2>
              <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase border ${
                expense.estado === 'anulado' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'
              }`}>
                {expense.estado}
              </span>
            </div>
          </div>
        </div>

        {expense.estado !== 'anulado' && hasPermission('anular_gastos') && (
          <button 
            onClick={() => setIsVoidModalOpen(true)}
            className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-2xl font-black text-[10px] uppercase hover:bg-red-700 transition-all shadow-lg"
          >
            <AlertTriangle size={16} /> Anular Gasto
          </button>
        )}
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna Principal */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm space-y-6">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <FileText size={14} /> Información General
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Concepto</p>
                <p className="text-sm font-black text-slate-800 uppercase mt-1">{expense.descripcion}</p>
              </div>
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Categoría</p>
                <p className="text-sm font-bold text-slate-600 uppercase mt-1 bg-slate-100 inline-block px-3 py-1 rounded-lg">{expense.categoria_gasto?.nombre}</p>
              </div>
            </div>
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Proveedor</p>
              <p className="text-xs font-black text-slate-700 uppercase mt-1">{expense.proveedor?.nombre || 'Gasto General / Sin Proveedor'}</p>
            </div>
          </div>

          {/* Sección de Anulación (Solo visible si está anulado) */}
          {expense.estado === 'anulado' && (
            <div className="bg-red-50 rounded-[2.5rem] p-8 border border-red-100 shadow-sm space-y-4">
              <h3 className="text-[10px] font-black text-red-600 uppercase tracking-widest flex items-center gap-2">
                <AlertTriangle size={14} /> Información de Anulación
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><p className="text-[9px] font-black text-red-400 uppercase">Motivo</p><p className="text-xs font-bold text-red-900">{expense.motivo_anulacion}</p></div>
                <div><p className="text-[9px] font-black text-red-400 uppercase">Fecha Anulación</p><p className="text-xs font-bold text-red-900">{new Date(expense.fecha_anulacion).toLocaleString()}</p></div>
                <div><p className="text-[9px] font-black text-red-400 uppercase">Usuario Anulación</p><p className="text-xs font-bold text-red-900">{expense.usuario_anulacion?.name}</p></div>
              </div>
            </div>
          )}
        </div>

        {/* Columna Lateral (Resumen) */}
        <div className="space-y-6">
          <div className="bg-zinc-900 rounded-[2.5rem] p-8 text-white shadow-xl shadow-zinc-200">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-2">Valor Total</p>
            <h3 className="text-4xl font-black tracking-tighter">$ {parseFloat(expense.valor).toLocaleString('es-CO')}</h3>
            
            <div className="mt-8 space-y-4 border-t border-zinc-800 pt-6">
              <div className="flex justify-between text-[10px] font-bold uppercase">
                <span className="text-zinc-500">Medio de Pago</span>
                <span className="flex items-center gap-2">
                    {expense.medio_pago === 'efectivo' ? <Banknote size={14}/> : <CreditCard size={14}/>}
                    {expense.medio_pago}
                </span>
              </div>
              <div className="flex justify-between text-[10px] font-bold uppercase">
                <span className="text-zinc-500">Caja Asociada</span>
                <span>{expense.caja?.tipo_caja}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm space-y-6">
             <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400"><User size={20} /></div>
                <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase">Registrado por</p>
                    <p className="text-xs font-black text-slate-700 uppercase">{expense.usuario?.name}</p>
                </div>
             </div>
             <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400"><Calendar size={20} /></div>
                <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase">Fecha Registro</p>
                    <p className="text-xs font-black text-slate-700 uppercase">{new Date(expense.created_at).toLocaleDateString()}</p>
                </div>
             </div>
          </div>
        </div>
      </div>

      <VoidExpenseModal 
        isOpen={isVoidModalOpen} 
        onClose={() => setIsVoidModalOpen(false)} 
        onConfirm={fetchDetail} 
        expenseId={id} 
      />
    </div>
  );
};