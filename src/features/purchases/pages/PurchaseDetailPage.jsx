import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, ShoppingBag, Calendar, Truck, Warehouse, 
  CheckCircle2, Clock, AlertCircle, Printer, Save,
  Plus, Wallet, History, Loader2, Edit3
} from 'lucide-react';
import { purchaseService } from '../services/purchaseService';
import { useToast } from '../../../context/ToastContext';
import { PaymentModal } from '../components/PaymentModal';

export const PurchaseDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  const [purchase, setPurchase] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);

  const fetchPurchase = async () => {
    setLoading(true);
    try {
      const res = await purchaseService.getPurchaseById(id);
      if (res.status) setPurchase(res.data);
    } catch (e) { showToast("Error al cargar detalle", "error"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchPurchase(); }, [id]);

  const handleConfirm = async () => {
    if (!window.confirm("¿Confirmar compra? Esto cargará el inventario inmediatamente.")) return;
    
    setConfirming(true);
    try {
      const res = await purchaseService.confirmPurchase(id);
      if (res.status) {
        showToast("Compra confirmada e inventario actualizado", "success");
        fetchPurchase(); // Recargar datos
      } else { showToast(res.message, "error"); }
    } catch (e) { showToast("Error de conexión", "error"); }
    finally { setConfirming(false); }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <Loader2 className="animate-spin text-zinc-900" size={40} />
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cargando documento...</p>
    </div>
  );

  if (!purchase) return <div className="p-20 text-center uppercase font-black">Compra no encontrada</div>;

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6 pb-20">
      {/* HEADER ACCIONES */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/compras')} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <ArrowLeft size={24} className="text-slate-600" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Compra #{purchase.id}</h2>
              <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase border ${
                purchase.estado === 'confirmada' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-100 text-slate-500 border-slate-200'
              }`}>
                {purchase.estado}
              </span>
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ref: {purchase.numero_documento || 'S/N'}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {purchase.estado === 'borrador' && (
            <>
              <button onClick={() => navigate(`/compras/editar/${id}`)} className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-2xl font-black text-[10px] uppercase hover:bg-slate-50 transition-all">
                <Edit3 size={16} /> Editar
              </button>
              <button onClick={handleConfirm} disabled={confirming} className="flex items-center gap-2 px-6 py-3 bg-zinc-900 text-white rounded-2xl font-black text-[10px] uppercase hover:bg-black shadow-xl shadow-zinc-200 transition-all">
                {confirming ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}
                Confirmar e Ingresar
              </button>
            </>
          )}
          <button className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-zinc-900 transition-all">
            <Printer size={20} />
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* INFO LADO IZQUIERDO */}
        <div className="lg:col-span-2 space-y-6">
          {/* Detalles de Productos */}
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b bg-slate-50/50">
              <h3 className="text-xs font-black text-slate-500 uppercase flex items-center gap-2">
                <ShoppingBag size={16} /> Items Adquiridos
              </h3>
            </div>
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-50">
                  <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase">Producto</th>
                  <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase text-center">Cant.</th>
                  <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase text-right">Costo</th>
                  <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {purchase.detalles.map((det) => (
                  <tr key={det.id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4">
                      <p className="text-xs font-black text-slate-700 uppercase">{det.producto?.nombre}</p>
                      <p className="text-[9px] font-bold text-slate-400 tracking-tighter">{det.producto?.codigo} | {det.producto?.marca?.nombre}</p>
                    </td>
                    <td className="px-6 py-4 text-center font-black text-xs text-slate-600">
                      {parseFloat(det.cantidad).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-xs text-slate-500">
                      ${parseFloat(det.costo_unitario).toLocaleString('es-CO')}
                    </td>
                    <td className="px-6 py-4 text-right font-black text-xs text-zinc-900">
                      ${parseFloat(det.subtotal).toLocaleString('es-CO')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* INFO LADO DERECHO */}
        <div className="lg:col-span-1 space-y-6">
          {/* Resumen Financiero */}
          <div className="bg-zinc-900 rounded-[2.5rem] p-8 text-white shadow-xl">
            <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-6">Resumen de Cuenta</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center text-xs font-bold border-b border-zinc-800 pb-3">
                <span className="text-zinc-500 uppercase">Subtotal</span>
                <span>$ {parseFloat(purchase.subtotal).toLocaleString('es-CO')}</span>
              </div>
              <div className="flex justify-between items-center text-xs font-bold border-b border-zinc-800 pb-3">
                <span className="text-zinc-500 uppercase">Impuestos</span>
                <span>$ {parseFloat(purchase.impuesto).toLocaleString('es-CO')}</span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-xs font-black uppercase text-yellow-500">Total Factura</span>
                <span className="text-2xl font-black tracking-tighter">$ {parseFloat(purchase.total).toLocaleString('es-CO')}</span>
              </div>
            </div>

            {purchase.tipo_pago === 'credito' && (
              <div className="mt-8 pt-6 border-t border-zinc-800 space-y-3">
                <div className="flex justify-between text-[10px] font-black uppercase">
                  <span className="text-zinc-500">Saldo Pendiente</span>
                  <span className="text-orange-400">$ {parseFloat(purchase.saldo_pendiente).toLocaleString('es-CO')}</span>
                </div>
                <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-orange-500 h-full transition-all duration-500" 
                    style={{ width: `${(purchase.total_pagado / purchase.total) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {purchase.estado === 'confirmada' && purchase.saldo_pendiente > 0 && (
            <button 
                onClick={() => setIsPaymentOpen(true)}
                className="w-full mt-4 py-3 bg-blue-600 text-white rounded-xl font-black text-[10px] uppercase hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-200"
            >
                <Plus size={14} /> Registrar Abono
            </button>
            )}
          </div>

          {/* Datos de Entrega y Proveedor */}
          <div className="bg-white rounded-[2.5rem] p-6 border border-slate-100 shadow-sm space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Truck size={20} />
              </div>
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Proveedor</p>
                <p className="text-xs font-black text-slate-700 uppercase">{purchase.provider?.nombre || purchase.proveedor?.nombre}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase">NIT: {purchase.provider?.nit || purchase.proveedor?.nit}</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <Warehouse size={20} />
              </div>
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Destino</p>
                <p className="text-xs font-black text-slate-700 uppercase">{purchase.bodega?.nombre}</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
                <Calendar size={20} />
              </div>
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Fechas</p>
                <p className="text-xs font-black text-slate-700 uppercase">Compra: {purchase.fecha_compra}</p>
                {purchase.tipo_pago === 'credito' && (
                  <p className="text-[10px] font-black text-orange-600 uppercase italic">Vence: {purchase.fecha_vencimiento}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <PaymentModal 
        isOpen={isPaymentOpen} 
        onClose={() => setIsPaymentOpen(false)} 
        purchase={purchase} 
        onSave={fetchPurchase} 
        />
    </div>
  );
};