import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, ShoppingBag, Calendar, Truck, Warehouse, 
  CheckCircle2, Printer, Loader2, Edit3, Plus, Info, 
  Package, User
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
    } catch (e) { 
      showToast("Error al cargar detalle", "error"); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { fetchPurchase(); }, [id]);

  const handleConfirm = async () => {
    if (!window.confirm("¿Confirmar compra? Esto cargará el inventario inmediatamente.")) return;
    setConfirming(true);
    try {
      const res = await purchaseService.confirmPurchase(id);
      if (res.status) {
        showToast("Compra confirmada e inventario actualizado", "success");
        fetchPurchase();
      } else { 
        showToast(res.message, "error"); 
      }
    } catch (e) { 
      showToast("Error de conexión", "error"); 
    } finally { 
      setConfirming(false); 
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <Loader2 className="animate-spin text-zinc-900" size={40} />
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cargando documento...</p>
    </div>
  );

  if (!purchase) return <div className="p-20 text-center uppercase font-black">Compra no encontrada</div>;

  const calculatedTotal = purchase.detalles?.reduce((acc, d) => acc + parseFloat(d.total || 0), 0) || 0;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/compras')} className="p-3 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-zinc-900 shadow-sm transition-all">
            <ArrowLeft size={20} />
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
              <button onClick={handleConfirm} disabled={confirming} className="flex items-center gap-2 px-6 py-3 bg-zinc-900 text-white rounded-2xl font-black text-[10px] uppercase hover:bg-black shadow-xl transition-all">
                {confirming ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}
                Confirmar e Ingresar
              </button>
            </>
          )}
          <button className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-zinc-900 transition-all shadow-sm">
            <Printer size={20} />
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b bg-slate-50/50 flex justify-between items-center">
              <h3 className="text-xs font-black text-slate-500 uppercase flex items-center gap-2">
                <ShoppingBag size={16} /> Detalle de Mercancía
              </h3>
              <div className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-[9px] font-black uppercase text-slate-400">
                {purchase.detalles?.length} Productos
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-50 bg-slate-50/30">
                    <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase">Producto</th>
                    <th className="px-4 py-4 text-[9px] font-black text-slate-400 uppercase text-center">UM</th>
                    <th className="px-4 py-4 text-[9px] font-black text-slate-400 uppercase text-center">Cant.</th>
                    <th className="px-4 py-4 text-[9px] font-black text-slate-400 uppercase text-right">Costo U.</th>
                    <th className="px-4 py-4 text-[9px] font-black text-slate-400 uppercase text-center">IVA %</th>
                    <th className="px-4 py-4 text-[9px] font-black text-slate-400 uppercase text-right">IVA Valor</th>
                    <th className="px-4 py-4 text-[9px] font-black text-slate-400 uppercase text-right">Soldicom</th>
                    <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {purchase.detalles?.map((det) => (
                    <tr key={det.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="text-xs font-black text-slate-700 uppercase leading-tight">{det.producto?.nombre}</p>
                        <p className="text-[9px] font-bold text-slate-400 tracking-tighter uppercase">{det.producto?.codigo} | {det.producto?.marca?.nombre || 'Genérico'}</p>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="text-[10px] font-black text-slate-400 uppercase bg-slate-100 px-2 py-1 rounded-md">
                          {det.producto?.unidad_medida?.abreviatura || 'UND'}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center font-black text-xs text-slate-600">
                        {parseFloat(det.cantidad).toLocaleString()}
                      </td>
                      <td className="px-4 py-4 text-right font-bold text-xs text-slate-500">
                        ${parseFloat(det.costo_unitario).toLocaleString('es-CO')}
                      </td>
                      <td className="px-4 py-4 text-center font-black text-xs text-emerald-600">
                        {det.iva || 0}%
                      </td>
                      <td className="px-4 py-4 text-right font-black text-xs text-emerald-700">
                        ${parseFloat(det.iva_valor || 0).toLocaleString('es-CO')}
                      </td>
                      <td className="px-4 py-4 text-right font-black text-xs text-blue-600">
                        ${parseFloat(det.soldicom || 0).toLocaleString('es-CO')}
                      </td>
                      <td className="px-6 py-4 text-right font-black text-xs text-zinc-900 tracking-tighter">
                        ${parseFloat(det.total || 0).toLocaleString('es-CO')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Info size={14} /> Observaciones Internas
            </h3>
            <p className="text-xs font-medium text-slate-600 italic leading-relaxed">
              {purchase.observacion || 'Sin observaciones registradas para esta compra.'}
            </p>
          </div>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <div className="bg-zinc-900 rounded-[2.5rem] p-8 text-white shadow-xl shadow-zinc-200">
            <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-8">Resumen Financiero</h3>
            <div className="space-y-5">
              <div className="flex justify-between items-center text-xs font-bold border-b border-zinc-800 pb-4">
                <span className="text-zinc-500 uppercase">Subtotal Neto</span>
                <span className="font-black">$ {parseFloat(purchase.subtotal).toLocaleString('es-CO')}</span>
              </div>
              <div className="flex justify-between items-center text-xs font-bold border-b border-zinc-800 pb-4">
                <span className="text-zinc-500 uppercase">IVA Acumulado</span>
                <span className="text-emerald-400 font-black">$ {purchase.detalles?.reduce((acc, d) => acc + parseFloat(d.iva_valor || 0), 0).toLocaleString('es-CO')}</span>
              </div>
              <div className="flex justify-between items-center text-xs font-bold border-b border-zinc-800 pb-4">
                <span className="text-zinc-500 uppercase">Soldicom Acumulado</span>
                <span className="text-blue-400 font-black">$ {purchase.detalles?.reduce((acc, d) => acc + (parseFloat(d.soldicom || 0)), 0).toLocaleString('es-CO')}</span>
              </div>
              <div className="flex justify-between items-center pt-4">
                <span className="text-xs font-black uppercase text-yellow-500">Total a Pagar</span>
                <span className="text-3xl font-black tracking-tighter">$ {calculatedTotal.toLocaleString('es-CO')}</span>
              </div>
            </div>

            {purchase.tipo_pago === 'credito' && (
              <div className="mt-8 pt-6 border-t border-zinc-800 space-y-4">
                <div className="flex justify-between text-[10px] font-black uppercase">
                  <span className="text-zinc-500 tracking-widest">Saldo Pendiente</span>
                  <span className="text-orange-400">$ {parseFloat(purchase.saldo_pendiente).toLocaleString('es-CO')}</span>
                </div>
                <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-orange-500 h-full transition-all duration-700" 
                    style={{ width: `${(purchase.total_pagado / calculatedTotal) * 100}%` }}
                  />
                </div>
                {purchase.estado === 'confirmada' && purchase.saldo_pendiente > 0 && (
                  <button 
                    onClick={() => setIsPaymentOpen(true)}
                    className="w-full py-4 bg-orange-500 text-white rounded-2xl font-black text-[10px] uppercase hover:bg-orange-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-orange-900/20"
                  >
                    <Plus size={14} /> Registrar Abono
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm space-y-8">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 shadow-sm">
                <Truck size={20} />
              </div>
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Proveedor</p>
                <p className="text-xs font-black text-slate-700 uppercase leading-tight">{purchase.proveedor?.nombre}</p>
                <p className="text-[9px] font-bold text-slate-400 uppercase">NIT: {purchase.proveedor?.nit}</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 shadow-sm">
                <Warehouse size={20} />
              </div>
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Bodega de Ingreso</p>
                <p className="text-xs font-black text-slate-700 uppercase leading-tight">{purchase.bodega?.nombre}</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-2xl bg-slate-50 text-slate-600 flex items-center justify-center shrink-0 shadow-sm">
                <User size={20} />
              </div>
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Registrado por</p>
                <p className="text-xs font-black text-slate-700 uppercase leading-tight">{purchase.usuario?.name}</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-2xl bg-slate-50 text-slate-600 flex items-center justify-center shrink-0 shadow-sm">
                <Calendar size={20} />
              </div>
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Fechas</p>
                <p className="text-xs font-black text-slate-700 uppercase">Compra: {purchase.fecha_compra}</p>
                {purchase.tipo_pago === 'credito' && (
                  <p className="text-[10px] font-bold text-orange-600 uppercase italic mt-1">Vencimiento: {purchase.fecha_vencimiento}</p>
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