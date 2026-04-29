import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, ShoppingBag, Calendar, Truck, Warehouse, 
  CheckCircle2, Printer, Loader2, Edit3, Plus, Info, 
  User, AlertTriangle, Eye, Wallet
} from 'lucide-react';
import { purchaseService } from '../services/purchaseService';
import { purchasePaymentService } from '../services/purchasePaymentService'; // Importamos el servicio de pagos
import { useToast } from '../../../context/ToastContext';
import { PaymentModal } from '../components/PaymentModal';

const ConfirmModal = ({ isOpen, onClose, onConfirm, loading }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-zinc-950/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="p-8 text-center space-y-6">
          <div className="w-20 h-20 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto shadow-sm">
            <AlertTriangle size={40} />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">¿Confirmar Compra?</h3>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
              Esta acción cargará el inventario inmediatamente y no podrá revertirse fácilmente.
            </p>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 px-6 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black text-[10px] uppercase hover:bg-slate-200 transition-all">
              Cancelar
            </button>
            <button onClick={onConfirm} disabled={loading} className="flex-1 px-6 py-4 bg-zinc-900 text-white rounded-2xl font-black text-[10px] uppercase hover:bg-black transition-all shadow-xl shadow-zinc-200 flex items-center justify-center gap-2">
              {loading ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}
              Confirmar Ingreso
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const PurchaseDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [purchase, setPurchase] = useState(null);
  const [pagos, setPagos] = useState([]); // Estado para los abonos
  const [loading, setLoading] = useState(true);
  const [loadingPagos, setLoadingPagos] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const fetchPurchase = async () => {
    setLoading(true);
    try {
      const res = await purchaseService.getPurchaseById(id);
      if (res.status) {
        setPurchase(res.data);
        // Si la compra es crédito, buscamos sus abonos inmediatamente
        if (res.data.tipo_pago === 'credito') {
            fetchPagos();
        }
      }
    } catch (e) { 
      showToast("Error al cargar detalle", "error"); 
    } finally { 
      setLoading(false); 
    }
  };

  // Nueva función para traer abonos filtrados por compra_id
  const fetchPagos = async () => {
    setLoadingPagos(true);
    try {
      const res = await purchasePaymentService.getPayments({ compra_id: id });
      if (res.status) {
        setPagos(res.data.items || []);
      }
    } catch (e) {
      console.error("Error cargando abonos:", e);
    } finally {
      setLoadingPagos(false);
    }
  };

  useEffect(() => { fetchPurchase(); }, [id]);

  const handlePrint = async () => {
    setIsPrinting(true);
    try {
      const token = localStorage.getItem('token'); 
      const response = await fetch(`${import.meta.env.VITE_API_URL}/compras/${id}/pdf`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/pdf' }
      });
      if (!response.ok) throw new Error('Error al generar PDF');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (e) {
      showToast("No se pudo generar el PDF", "error");
    } finally {
      setIsPrinting(false);
    }
  };

  const handleConfirm = async () => {
    setConfirming(true);
    try {
      const res = await purchaseService.confirmPurchase(id);
      if (res.status) {
        showToast("Compra confirmada e inventario actualizado", "success");
        setIsConfirmOpen(false);
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

  if (!purchase) return <div className="p-20 text-center uppercase font-black text-slate-400">Compra no encontrada</div>;

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
              <button onClick={() => setIsConfirmOpen(true)} className="flex items-center gap-2 px-6 py-3 bg-zinc-900 text-white rounded-2xl font-black text-[10px] uppercase hover:bg-black shadow-xl transition-all">
                <CheckCircle2 size={16} /> Confirmar e Ingresar
              </button>
            </>
          )}
          <button onClick={handlePrint} disabled={isPrinting} className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-zinc-900 transition-all shadow-sm flex items-center justify-center disabled:opacity-50">
            {isPrinting ? <Loader2 className="animate-spin" size={20} /> : <Printer size={20} />}
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
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-50 bg-slate-50/30">
                    <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase">Producto</th>
                    <th className="px-4 py-4 text-[9px] font-black text-slate-400 uppercase text-center">Cant.</th>
                    <th className="px-4 py-4 text-[9px] font-black text-slate-400 uppercase text-right">Costo U.</th>
                    <th className="px-4 py-4 text-[9px] font-black text-slate-400 uppercase text-right">Iva valor</th>
                    <th className="px-4 py-4 text-[9px] font-black text-slate-400 uppercase text-right">Soldicom</th>
                    <th className="px-4 py-4 text-[9px] font-black text-slate-400 uppercase text-right">Sobre Tasa</th>
                    <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {purchase.detalles?.map((det) => (
                    <tr key={det.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="text-xs font-black text-slate-700 uppercase leading-tight">{det.producto?.nombre}</p>
                        <p className="text-[9px] font-bold text-slate-400 tracking-tighter uppercase">{det.producto?.codigo}</p>
                      </td>
                      <td className="px-4 py-4 text-center font-black text-xs text-slate-600">{parseFloat(det.cantidad).toLocaleString()}</td>
                      <td className="px-4 py-4 text-right font-bold text-xs text-slate-500">${parseFloat(det.costo_unitario).toLocaleString('es-CO')}</td>
                      <td className="px-4 py-4 text-right font-bold text-xs text-slate-500">${parseFloat(det.iva_valor).toLocaleString('es-CO')}</td>
                      <td className="px-4 py-4 text-right font-black text-xs text-blue-600">${(parseFloat(det.soldicom || 0) * parseFloat(det.cantidad)).toLocaleString('es-CO')}</td>
                      <td className="px-4 py-4 text-right font-black text-xs text-orange-600">${(parseFloat(det.sobre_tasa || 0) * parseFloat(det.cantidad)).toLocaleString('es-CO')}</td>
                      <td className="px-6 py-4 text-right font-black text-xs text-zinc-900">${parseFloat(det.total || 0).toLocaleString('es-CO')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-slate-50 text-slate-400 flex items-center justify-center"><Info size={14} /></span> 
              Observaciones Internas
            </h3>
            <p className="text-xs font-medium text-slate-600 italic leading-relaxed uppercase">{purchase.observacion || 'Sin observaciones registradas.'}</p>
          </div>

          {/* LISTADO DE ABONOS CENTRALIZADO */}
          {purchase.tipo_pago === 'credito' && (
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="p-6 border-b bg-slate-50/50 flex justify-between items-center">
                <h3 className="text-xs font-black text-slate-500 uppercase flex items-center gap-2">
                  <Wallet size={16} /> Historial de Pagos realizados
                </h3>
                <div className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-[9px] font-black uppercase text-slate-400">
                  {pagos.length} Abonos
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-50 bg-slate-50/30">
                      <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Fecha</th>
                      <th className="px-4 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Método</th>
                      <th className="px-4 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Monto Pagado</th>
                      <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Recibo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {loadingPagos ? (
                       <tr><td colSpan="4" className="p-10 text-center text-[10px] font-black uppercase text-slate-300">Cargando pagos...</td></tr>
                    ) : pagos.length > 0 ? pagos.map((pago) => (
                      <tr key={pago.id} className="hover:bg-slate-50/30 transition-colors">
                        <td className="px-6 py-4 text-xs font-bold text-slate-700 uppercase">{pago.fecha_pago}</td>
                        <td className="px-4 py-4">
                           <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${pago.metodo_pago === 'efectivo' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
                             {pago.metodo_pago}
                           </span>
                        </td>
                        <td className="px-4 py-4 text-right font-black text-slate-900 text-xs tracking-tighter">
                          $ {parseFloat(pago.monto).toLocaleString('es-CO')}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button 
                            onClick={() => navigate(`/pagos-compra/${pago.id}`)}
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                          >
                            <Eye size={16} />
                          </button>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan="4" className="p-10 text-center text-slate-400 text-[10px] font-black uppercase italic tracking-widest">
                          Esta factura aún no registra abonos.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          
        </div>

        <div className="lg:col-span-1 space-y-6">
          <div className="bg-zinc-900 rounded-[2.5rem] p-8 text-white shadow-xl shadow-zinc-200">
            <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-8">Resumen Financiero</h3>
            <div className="space-y-5">
              <div className="flex justify-between items-center text-xs font-bold border-b border-zinc-800 pb-4">
                <span className="text-zinc-500 uppercase">Total Iva</span>
                <span className="text-blue-400 font-black">$ {purchase.detalles?.reduce((acc, d) => acc + (parseFloat(d.iva_valor || 0) * parseFloat(d.cantidad)), 0).toLocaleString('es-CO')}</span>
              </div>
              <div className="flex justify-between items-center text-xs font-bold border-b border-zinc-800 pb-4">
                <span className="text-zinc-500 uppercase">Total Soldicom</span>
                <span className="text-blue-400 font-black">$ {purchase.detalles?.reduce((acc, d) => acc + (parseFloat(d.soldicom || 0) * parseFloat(d.cantidad)), 0).toLocaleString('es-CO')}</span>
              </div>
              <div className="flex justify-between items-center text-xs font-bold border-b border-zinc-800 pb-4">
                <span className="text-zinc-500 uppercase">Total Sobre Tasa</span>
                <span className="text-orange-400 font-black">$ {purchase.detalles?.reduce((acc, d) => acc + (parseFloat(d.sobre_tasa || 0) * parseFloat(d.cantidad)), 0).toLocaleString('es-CO')}</span>
              </div>
              <div className="flex justify-between items-center pt-4">
                <span className="text-xs font-black uppercase text-yellow-500">Total Factura</span>
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
                  <div className="bg-orange-500 h-full transition-all duration-700" style={{ width: `${Math.min((purchase.total_pagado / calculatedTotal) * 100, 100)}%` }} />
                </div>
                {purchase.estado === 'confirmada' && purchase.saldo_pendiente > 0 && (
                  <button onClick={() => setIsPaymentOpen(true)} className="w-full py-4 bg-orange-500 text-white rounded-2xl font-black text-[10px] uppercase hover:bg-orange-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-orange-900/20">
                    <Plus size={14} /> Registrar Abono
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm space-y-8">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 shadow-sm"><Truck size={20} /></div>
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Proveedor</p>
                <p className="text-xs font-black text-slate-700 uppercase leading-tight">{purchase.proveedor?.nombre}</p>
                <p className="text-[9px] font-bold text-slate-400 uppercase">NIT: {purchase.proveedor?.nit}</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 shadow-sm"><Warehouse size={20} /></div>
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Bodega de Ingreso</p>
                <p className="text-xs font-black text-slate-700 uppercase leading-tight">{purchase.bodega?.nombre}</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-2xl bg-slate-50 text-slate-600 flex items-center justify-center shrink-0 shadow-sm"><Calendar size={20} /></div>
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

      <ConfirmModal isOpen={isConfirmOpen} onClose={() => setIsConfirmOpen(false)} onConfirm={handleConfirm} loading={confirming} />
      <PaymentModal isOpen={isPaymentOpen} onClose={() => setIsPaymentOpen(false)} purchase={purchase} onSave={fetchPurchase} />
    </div>
  );
};