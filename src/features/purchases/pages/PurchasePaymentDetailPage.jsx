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

  // Impresión nativa del navegador
  const handlePrint = () => {
    window.print();
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <Loader2 className="animate-spin text-zinc-900" size={40} />
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cargando Comprobante...</p>
    </div>
  );

  if (!payment) return <div className="p-20 text-center uppercase font-black text-slate-400">Comprobante no encontrado</div>;

  const purchase = payment.compra;
  const detalles = payment.detalles || [];

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6 pb-20">
      
      {/* BOTONERA SUPERIOR */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <button 
          onClick={() => navigate(purchase?.id ? `/compras/${purchase.id}` : '/pagos-compra')} 
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold uppercase text-slate-700 hover:bg-slate-50 transition-all shadow-sm w-fit"
        >
          <ArrowLeft size={16} /> Regresar
        </button>

        <button 
          onClick={handlePrint}
          className="flex items-center gap-2 px-5 py-2 bg-zinc-900 text-white rounded-xl font-black text-[10px] uppercase hover:bg-zinc-800 transition-all shadow-md"
        >
          <Printer size={16} /> Imprimir Recibo
        </button>
      </header>

      {/* CONTENEDOR TIPO FACTURA / RECIBO */}
      <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-200 shadow-sm space-y-6 print:border-none print:shadow-none print:p-0">
        
        {/* ENCABEZADO */}
        <div className="flex justify-between items-start border-b border-slate-100 pb-5">
          <div>
            <h1 className="text-lg font-black text-slate-900 uppercase tracking-tight">
              Comprobante de Abono / Pago
            </h1>
            <p className="text-xs font-black text-blue-600 mt-0.5">
              Comprobante #{payment.id} • Factura Ref: {purchase?.numero_documento || 'S/N'}
            </p>
          </div>
          <div className="text-right">
            <span className="inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase border bg-emerald-50 text-emerald-600 border-emerald-100">
              Abono Registrado
            </span>
          </div>
        </div>

        {/* DATOS GENERALES DEL PAGO Y PROVEEDOR */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50/60 p-4 rounded-2xl border border-slate-100 text-xs">
          <div className="space-y-1.5">
            <div className="flex justify-between">
              <span className="font-bold text-slate-400 uppercase">Proveedor:</span>
              <span className="font-black text-slate-800 uppercase text-right">{payment.proveedor?.nombre || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-bold text-slate-400 uppercase">NIT Proveedor:</span>
              <span className="font-bold text-slate-700">{payment.proveedor?.nit || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-bold text-slate-400 uppercase">Bodega:</span>
              <span className="font-bold text-slate-700 uppercase">{payment.bodega?.nombre || 'N/A'}</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between">
              <span className="font-bold text-slate-400 uppercase">Fecha de Pago:</span>
              <span className="font-bold text-slate-700">{payment.fecha_pago}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-bold text-slate-400 uppercase">Método de Pago:</span>
              <span className="font-black text-blue-600 uppercase">{payment.metodo_pago}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-bold text-slate-400 uppercase">Cajero:</span>
              <span className="font-bold text-slate-700 uppercase">{payment.usuario?.name || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* DETALLE DE MERCANCÍA ASOCIADA */}
        <div className="space-y-3">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Detalle de Mercancía de la Factura</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="py-2.5 px-3 text-[10px] font-black text-slate-500 uppercase">Producto</th>
                  <th className="py-2.5 px-3 text-[10px] font-black text-slate-500 uppercase text-center">Cant.</th>
                  <th className="py-2.5 px-3 text-[10px] font-black text-slate-500 uppercase text-right">Costo U.</th>
                  <th className="py-2.5 px-3 text-[10px] font-black text-slate-500 uppercase text-right">Iva Valor</th>
                  <th className="py-2.5 px-3 text-[10px] font-black text-slate-500 uppercase text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {detalles.map((det) => (
                  <tr key={det.id}>
                    <td className="py-3 px-3">
                      <p className="text-xs font-black text-slate-800 uppercase">{det.producto?.nombre}</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase">Cod: {det.producto?.codigo} | {det.producto?.marca}</p>
                    </td>
                    <td className="py-3 px-3 text-center text-xs font-black text-slate-800">
                      {parseFloat(det.cantidad).toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-right text-xs font-bold text-slate-600">
                      $ {parseFloat(det.costo_unitario).toLocaleString('es-CO')}
                    </td>
                    <td className="py-3 px-3 text-right text-xs font-bold text-slate-600">
                      $ {parseFloat(det.iva_valor || 0).toLocaleString('es-CO')}
                    </td>
                    <td className="py-3 px-3 text-right text-xs font-black text-zinc-900">
                      $ {parseFloat(det.total || 0).toLocaleString('es-CO')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* RESUMEN FINANCIERO DEL PAGO */}
        <div className="flex flex-col items-end pt-4 border-t border-slate-200 space-y-1.5 text-right">
          <div className="flex justify-between w-64 text-xs font-bold text-slate-500">
            <span>Total Factura:</span>
            <span>$ {parseFloat(purchase?.total || 0).toLocaleString('es-CO')}</span>
          </div>
          <div className="flex justify-between w-64 text-sm font-black text-emerald-600 pt-1">
            <span>Monto Pagado:</span>
            <span>$ {parseFloat(payment.monto).toLocaleString('es-CO')}</span>
          </div>
          <div className="flex justify-between w-64 text-xs font-bold text-orange-600 pt-1 border-t border-slate-100">
            <span>Saldo Restante:</span>
            <span>$ {parseFloat(purchase?.saldo_pendiente || 0).toLocaleString('es-CO')}</span>
          </div>
        </div>

        {/* OBSERVACIONES / NOTA */}
        {payment.observacion && (
          <div className="pt-4 border-t border-slate-100 text-xs">
            <span className="font-black text-slate-400 uppercase tracking-widest block text-[10px] mb-1">Nota del Pago:</span>
            <p className="font-bold text-slate-700 uppercase italic">{payment.observacion}</p>
          </div>
        )}

      </div>
    </div>
  );
};