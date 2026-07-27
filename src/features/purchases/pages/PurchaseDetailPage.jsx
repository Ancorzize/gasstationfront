import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, ShoppingBag, Calendar, Truck, Warehouse, 
  CheckCircle2, Printer, Loader2, Edit3, Plus, Info, 
  AlertTriangle, Eye, Wallet
} from 'lucide-react';
import { purchaseService } from '../services/purchaseService';
import { purchasePaymentService } from '../services/purchasePaymentService';
import { cashService } from '../../cash/services/cashService'; 
import { useToast } from '../../../context/ToastContext';
import { PaymentModal } from '../components/PaymentModal';

const ConfirmModal = ({ isOpen, onClose, onConfirm, loading, cajas, selectedCaja, setSelectedCaja }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-zinc-950/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="p-8 text-center space-y-6">
          <div className="w-20 h-20 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto shadow-sm">
            <AlertTriangle size={40} />
          </div>
          <div className="space-y-4">
            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">¿Confirmar Compra?</h3>
            <div className="text-left space-y-1">
              <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Seleccionar Caja de Origen</label>
              <select 
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none uppercase"
                value={selectedCaja}
                onChange={(e) => setSelectedCaja(e.target.value)}
              >
                <option value="">Seleccione una caja...</option>
                {cajas.map(caja => (
                  <option key={caja.id} value={caja.id}>
                    {caja.nombre} ({caja.tipo_caja})
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 px-6 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black text-[10px] uppercase hover:bg-slate-200 transition-all">
              Cancelar
            </button>
            <button 
              onClick={onConfirm} 
              disabled={loading || !selectedCaja} 
              className="flex-1 px-6 py-4 bg-zinc-900 text-white rounded-2xl font-black text-[10px] uppercase hover:bg-black transition-all shadow-xl disabled:opacity-50 flex items-center justify-center gap-2"
            >
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
  const [pagos, setPagos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingPagos, setLoadingPagos] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const [cajas, setCajas] = useState([]);
  const [selectedCaja, setSelectedCaja] = useState('');

  const fetchCajas = async () => {
    try {
      const res = await cashService.getCurrentCash();
      if (res.status) {
        const ordenadas = res.data.sort((a, b) => a.id - b.id);
        setCajas(ordenadas);
        
        const lastName = localStorage.getItem('last_selected_purchase_caja_nombre');
        if (lastName) {
          const cajaEncontrada = ordenadas.find(c => c.nombre === lastName);
          if (cajaEncontrada) {
            setSelectedCaja(cajaEncontrada.id);
          }
        }
      }
    } catch (e) { showToast("Error al cargar cajas", "error"); }
  };

  useEffect(() => {
    if (isConfirmOpen) fetchCajas();
  }, [isConfirmOpen]);

  const handleConfirm = async () => {
    if (!selectedCaja) {
      showToast("Por favor selecciona una caja para continuar", "warning");
      return;
    }
    setConfirming(true);
    try {
      const cajaSeleccionadaObj = cajas.find(c => String(c.id) === String(selectedCaja));
      if (cajaSeleccionadaObj) {
        localStorage.setItem('last_selected_purchase_caja_nombre', cajaSeleccionadaObj.nombre);
      }

      const res = await purchaseService.confirmPurchase(id, selectedCaja);
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

  const fetchPurchase = async () => {
    setLoading(true);
    try {
      const res = await purchaseService.getPurchaseById(id);
      if (res.status) {
        setPurchase(res.data);
        if (res.data.tipo_pago === 'credito') fetchPagos();
      }
    } catch (e) { showToast("Error al cargar detalle", "error"); }
    finally { setLoading(false); }
  };

  const fetchPagos = async () => {
    setLoadingPagos(true);
    try {
      const res = await purchasePaymentService.getPayments({ compra_id: id });
      if (res.status) setPagos(res.data.items || []);
    } catch (e) { console.error("Error cargando abonos:", e); }
    finally { setLoadingPagos(false); }
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
    } catch (e) { showToast("No se pudo generar el PDF", "error"); }
    finally { setIsPrinting(false); }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <Loader2 className="animate-spin text-zinc-900" size={40} />
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cargando documento...</p>
    </div>
  );

  if (!purchase) return <div className="p-20 text-center uppercase font-black text-slate-400">Compra no encontrada</div>;

  const calculatedTotal = purchase.detalles?.reduce((acc, d) => acc + parseFloat(d.total || 0), 0) || 0;
  const totalIva = purchase.detalles?.reduce((acc, d) => acc + (parseFloat(d.iva_valor || 0) * parseFloat(d.cantidad)), 0) || 0;

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6 pb-20">
      
      {/* BOTONERA SUPERIOR */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <button onClick={() => navigate('/compras')} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold uppercase text-slate-700 hover:bg-slate-50 transition-all shadow-sm w-fit">
          <ArrowLeft size={16} /> Regresar
        </button>

        <div className="flex items-center gap-2">
          {purchase.estado === 'borrador' && (
            <>
              <button onClick={() => navigate(`/compras/editar/${id}`)} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl font-black text-[10px] uppercase hover:bg-slate-50 transition-all shadow-sm">
                <Edit3 size={14} /> Editar
              </button>
              <button onClick={() => setIsConfirmOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-xl font-black text-[10px] uppercase hover:bg-black shadow-md transition-all">
                <CheckCircle2 size={14} /> Confirmar e Ingresar
              </button>
            </>
          )}
          <button onClick={handlePrint} disabled={isPrinting} className="flex items-center gap-2 px-5 py-2 bg-zinc-900 text-white rounded-xl font-black text-[10px] uppercase hover:bg-zinc-800 transition-all shadow-md disabled:opacity-50">
            {isPrinting ? <Loader2 className="animate-spin" size={16} /> : <Printer size={16} />} Imprimir Factura
          </button>
        </div>
      </header>

      {/* CONTENEDOR PRINCIPAL TIPO FACTURA */}
      <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-200 shadow-sm space-y-6 print:border-none print:shadow-none print:p-0">
        
        {/* ENCABEZADO FACTURA */}
        <div className="flex justify-between items-start border-b border-slate-100 pb-5">
          <div>
            <h1 className="text-lg font-black text-slate-900 uppercase tracking-tight">
              Factura de Compra
            </h1>
            <p className="text-xs font-black text-blue-600 mt-0.5">
              Compra #{purchase.id} {purchase.numero_documento ? `• Ref: ${purchase.numero_documento}` : ''}
            </p>
          </div>
          <div className="text-right">
            <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase border ${
              purchase.estado === 'confirmada' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-100 text-slate-500 border-slate-200'
            }`}>
              {purchase.estado}
            </span>
            <div className="mt-1">
              <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase border bg-slate-50 text-slate-600 border-slate-200`}>
                Pago: {purchase.tipo_pago}
              </span>
            </div>
          </div>
        </div>

        {/* DATOS GENERALES */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50/60 p-4 rounded-2xl border border-slate-100 text-xs">
          <div className="space-y-1.5">
            <div className="flex justify-between">
              <span className="font-bold text-slate-400 uppercase">Proveedor:</span>
              <span className="font-black text-slate-800 uppercase text-right">{purchase.proveedor?.nombre || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-bold text-slate-400 uppercase">NIT Proveedor:</span>
              <span className="font-bold text-slate-700">{purchase.proveedor?.nit || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-bold text-slate-400 uppercase">Bodega Destino:</span>
              <span className="font-bold text-slate-700 uppercase">{purchase.bodega?.nombre || 'N/A'}</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between">
              <span className="font-bold text-slate-400 uppercase">Fecha Compra:</span>
              <span className="font-bold text-slate-700">{purchase.fecha_compra}</span>
            </div>
            {purchase.tipo_pago === 'credito' && (
              <div className="flex justify-between">
                <span className="font-bold text-slate-400 uppercase">Vencimiento:</span>
                <span className="font-bold text-orange-600">{purchase.fecha_vencimiento}</span>
              </div>
            )}
          </div>
        </div>

        {/* TABLA DE DETALLE DE MERCANCÍA */}
        <div className="space-y-3">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Detalle de Mercancía</h3>
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
                {purchase.detalles?.map((det) => (
                  <tr key={det.id}>
                    <td className="py-3 px-3">
                      <p className="text-xs font-black text-slate-800 uppercase">{det.producto?.nombre}</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase">Cod: {det.producto?.codigo}</p>
                    </td>
                    <td className="py-3 px-3 text-center text-xs font-black text-slate-800">
                      {parseFloat(det.cantidad).toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-right text-xs font-bold text-slate-600">
                      $ {parseFloat(det.costo_unitario).toLocaleString('es-CO')}
                    </td>
                    <td className="py-3 px-3 text-right text-xs font-bold text-slate-600">
                      $ {parseFloat(det.iva_valor).toLocaleString('es-CO')}
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

        {/* TOTALES FINANCIEROS */}
        <div className="flex flex-col items-end pt-4 border-t border-slate-200 space-y-1 text-right">
          <div className="flex justify-between w-64 text-xs font-bold text-slate-500">
            <span>Total IVA:</span>
            <span>$ {totalIva.toLocaleString('es-CO')}</span>
          </div>
          <div className="flex justify-between w-64 text-sm font-black text-zinc-900 pt-2 border-t border-slate-100">
            <span>TOTAL FACTURA:</span>
            <span>$ {calculatedTotal.toLocaleString('es-CO')}</span>
          </div>
          {purchase.tipo_pago === 'credito' && (
            <div className="flex justify-between w-64 text-xs font-bold text-orange-600 pt-1">
              <span>Saldo Pendiente:</span>
              <span>$ {parseFloat(purchase.saldo_pendiente || 0).toLocaleString('es-CO')}</span>
            </div>
          )}
        </div>

        {/* OBSERVACIONES */}
        {purchase.observacion && (
          <div className="pt-4 border-t border-slate-100 text-xs">
            <span className="font-black text-slate-400 uppercase tracking-widest block text-[10px] mb-1">Observaciones:</span>
            <p className="font-bold text-slate-700 uppercase">{purchase.observacion}</p>
          </div>
        )}

        {/* HISTORIAL DE ABONOS */}
        {purchase.tipo_pago === 'credito' && pagos.length > 0 && (
          <div className="pt-6 border-t border-slate-200 space-y-3">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Historial de Abonos / Pagos</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-[10px] font-black text-slate-400 uppercase">
                    <th className="py-2 px-2">Fecha</th>
                    <th className="py-2 px-2">Método</th>
                    <th className="py-2 px-2 text-right">Monto</th>
                    <th className="py-2 px-2 text-center print:hidden">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pagos.map((pago) => (
                    <tr key={pago.id}>
                      <td className="py-2.5 px-2 font-bold text-slate-700">{pago.fecha_pago}</td>
                      <td className="py-2.5 px-2 font-bold uppercase text-slate-600">{pago.metodo_pago}</td>
                      <td className="py-2.5 px-2 text-right font-black text-slate-900">$ {parseFloat(pago.monto).toLocaleString('es-CO')}</td>
                      <td className="py-2.5 px-2 text-center print:hidden">
                        <button onClick={() => navigate(`/pagos-compra/${pago.id}`)} className="p-1 text-slate-400 hover:text-blue-600">
                          <Eye size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* BOTÓN REGISTRAR ABONO */}
        {purchase.tipo_pago === 'credito' && purchase.estado === 'confirmada' && purchase.saldo_pendiente > 0 && (
          <div className="pt-4 print:hidden">
            <button onClick={() => setIsPaymentOpen(true)} className="w-full py-3 bg-orange-500 text-white rounded-xl font-black text-[10px] uppercase hover:bg-orange-600 transition-all flex items-center justify-center gap-2 shadow-sm">
              <Plus size={14} /> Registrar Abono
            </button>
          </div>
        )}

      </div>

      <ConfirmModal 
        isOpen={isConfirmOpen} 
        onClose={() => setIsConfirmOpen(false)} 
        onConfirm={handleConfirm} 
        loading={confirming}
        cajas={cajas}
        selectedCaja={selectedCaja}
        setSelectedCaja={setSelectedCaja}
      />
      <PaymentModal isOpen={isPaymentOpen} onClose={() => setIsPaymentOpen(false)} purchase={purchase} onSave={fetchPurchase} />
    </div>
  );
};