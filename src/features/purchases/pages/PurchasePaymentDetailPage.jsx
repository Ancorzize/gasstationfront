import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, ShoppingBag, Calendar, Truck, Warehouse, 
  Printer, Loader2, Info, User, Wallet
} from 'lucide-react';
import { purchasePaymentService } from '../services/purchasePaymentService';
import { useToast } from '../../../context/ToastContext';

export const PurchasePaymentDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPrinting, setIsPrinting] = useState(false);

  const fetchPaymentDetail = async () => {
    setLoading(true);
    try {
      const res = await purchasePaymentService.getPaymentById(id);
      if (res.status) {
        setPayment(res.data);
      } else {
        showToast(res.message, "error");
        navigate('/pagos-compra');
      }
    } catch (e) { 
      showToast("Error al cargar el comprobante", "error"); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { fetchPaymentDetail(); }, [id]);

  const handlePrint = async () => {
    setIsPrinting(true);
    try {
      const token = localStorage.getItem('token'); 
      const response = await fetch(`${import.meta.env.VITE_API_URL}/pagos-compra/${id}/pdf`, {
        headers: { 
          'Authorization': `Bearer ${token}`, 
          'Accept': 'application/pdf' 
        }
      });

      if (!response.ok) throw new Error('Error al generar PDF del pago');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (e) {
      showToast("No se pudo generar el recibo de pago", "error");
    } finally {
      setIsPrinting(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <Loader2 className="animate-spin text-zinc-900" size={40} />
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Generando Comprobante...</p>
    </div>
  );

  if (!payment) return <div className="p-20 text-center uppercase font-black text-slate-400">Comprobante no encontrado</div>;

  const purchase = payment.compra;
  const detalles = payment.detalles || [];

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(purchase?.id ? `/compras/${purchase.id}` : '/pagos-compra')} 
            className="p-3 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-zinc-900 shadow-sm transition-all"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Comprobante #{payment.id}</h2>
              <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase border bg-blue-50 text-blue-600 border-blue-100">
                Abono Registrado
              </span>
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Factura Ref: {purchase?.numero_documento || 'S/N'}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={handlePrint}
            disabled={isPrinting}
            className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-2xl font-black text-[10px] uppercase hover:bg-slate-50 transition-all shadow-sm disabled:opacity-50"
          >
            {isPrinting ? <Loader2 className="animate-spin" size={16} /> : <Printer size={16} />}
            Imprimir Recibo
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b bg-slate-50/50 flex justify-between items-center">
              <h3 className="text-xs font-black text-slate-500 uppercase flex items-center gap-2">
                <ShoppingBag size={16} /> Detalle de Mercancía1
              </h3>
              <div className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-[9px] font-black uppercase text-slate-400">
                {detalles.length} Productos
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
                    <th className="px-4 py-4 text-[9px] font-black text-slate-400 uppercase text-right">Sobre Tasa</th>
                    <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {detalles.map((det) => (
                    <tr key={det.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="text-xs font-black text-slate-700 uppercase leading-tight">{det.producto?.nombre}</p>
                        <p className="text-[9px] font-bold text-slate-400 tracking-tighter uppercase">{det.producto?.codigo} | {det.producto?.marca}</p>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="text-[10px] font-black text-slate-400 uppercase bg-slate-100 px-2 py-1 rounded-md">
                          {det.producto?.unidad_medida || 'UND'}
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
                        ${(parseFloat(det.soldicom || 0) * parseFloat(det.cantidad)).toLocaleString('es-CO')}
                      </td>
                      <td className="px-4 py-4 text-right font-black text-xs text-orange-600">
                        ${(parseFloat(det.sobre_tasa || 0) * parseFloat(det.cantidad)).toLocaleString('es-CO')}
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
              <span className="w-6 h-6 rounded-lg bg-slate-50 text-slate-400 flex items-center justify-center">
                <Info size={14} />
              </span> 
              Nota del Pago
            </h3>
            <p className="text-xs font-medium text-slate-600 italic leading-relaxed uppercase">
              {payment.observacion || 'Sin observaciones registradas para este abono.'}
            </p>
          </div>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <div className="bg-zinc-900 rounded-[2.5rem] p-8 text-white shadow-xl shadow-zinc-200">
            <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-8">Resumen de Abono</h3>
            <div className="space-y-5">
              <div className="flex justify-between items-center text-xs font-bold border-b border-zinc-800 pb-4">
                <span className="text-zinc-500 uppercase">Vía</span>
                <span className="font-black uppercase text-blue-400">{payment.metodo_pago}</span>
              </div>
              <div className="flex justify-between items-center pt-4">
                <span className="text-xs font-black uppercase text-emerald-500">Monto Pagado</span>
                <span className="text-3xl font-black tracking-tighter">$ {parseFloat(payment.monto).toLocaleString('es-CO')}</span>
              </div>
              
              <div className="mt-8 pt-6 border-t border-zinc-800 space-y-4 text-[10px]">
                <div className="flex justify-between font-black uppercase">
                  <span className="text-zinc-500 tracking-widest">Total Factura</span>
                  <span className="text-zinc-300">$ {parseFloat(purchase?.total || 0).toLocaleString('es-CO')}</span>
                </div>
                <div className="flex justify-between font-black uppercase">
                  <span className="text-zinc-500 tracking-widest">Saldo Restante</span>
                  <span className="text-orange-400">$ {parseFloat(purchase?.saldo_pendiente || 0).toLocaleString('es-CO')}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm space-y-8">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 shadow-sm">
                <Truck size={20} />
              </div>
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Proveedor</p>
                <p className="text-xs font-black text-slate-700 uppercase leading-tight">{payment.proveedor?.nombre}</p>
                <p className="text-[9px] font-bold text-slate-400 uppercase">NIT: {payment.proveedor?.nit}</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 shadow-sm">
                <Warehouse size={20} />
              </div>
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Bodega</p>
                <p className="text-xs font-black text-slate-700 uppercase leading-tight">{payment.bodega?.nombre}</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-2xl bg-slate-50 text-slate-600 flex items-center justify-center shrink-0 shadow-sm">
                <User size={20} />
              </div>
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Cajero</p>
                <p className="text-xs font-black text-slate-700 uppercase leading-tight">{payment.usuario?.name}</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-2xl bg-slate-50 text-slate-600 flex items-center justify-center shrink-0 shadow-sm">
                <Calendar size={20} />
              </div>
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Fecha Pago</p>
                <p className="text-xs font-black text-slate-700 uppercase">{payment.fecha_pago}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};