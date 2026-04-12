import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Wallet, Calendar, DollarSign, Info, Loader2 } from 'lucide-react';
import { purchaseService } from '../services/purchaseService';
import { useToast } from '../../../context/ToastContext';

export const PaymentModal = ({ isOpen, onClose, purchase, onSave }) => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fecha_pago: new Date().toISOString().split('T')[0],
    monto: '',
    metodo_pago: 'transferencia',
    observacion: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (parseFloat(formData.monto) > parseFloat(purchase.saldo_pendiente)) {
      return showToast("El monto supera el saldo pendiente", "error");
    }

    setLoading(true);
    try {
      const res = await purchaseService.registerPayment(purchase.id, formData);
      if (res.status) {
        showToast("Pago registrado correctamente", "success");
        onSave(); // Refrescar detalle de compra
        onClose();
      } else { showToast(res.message, "error"); }
    } catch (e) { showToast("Error al registrar pago", "error"); }
    finally { setLoading(false); }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose} className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm" />
          
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
            className="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden"
          >
            <div className="p-6 border-b flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Wallet size={20} />
                </div>
                <h3 className="font-black text-slate-800 text-sm uppercase">Registrar Abono</h3>
              </div>
              <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-50 rounded-full"><X size={20} /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-5">
              <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 mb-2">
                <div className="flex justify-between text-[10px] font-black uppercase text-blue-800">
                  <span>Saldo Actual:</span>
                  <span>$ {parseFloat(purchase?.saldo_pendiente).toLocaleString('es-CO')}</span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Monto a Pagar</label>
                <div className="relative">
                  <DollarSign className="absolute left-4 top-3.5 text-slate-300" size={16} />
                  <input required type="number" step="any" min="1" max={purchase?.saldo_pendiente}
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-black outline-none focus:border-zinc-900"
                    value={formData.monto} onChange={e => setFormData({...formData, monto: e.target.value})} placeholder="0.00" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Fecha</label>
                  <input type="date" required className="w-full px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-xs outline-none focus:border-zinc-900"
                    value={formData.fecha_pago} onChange={e => setFormData({...formData, fecha_pago: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Método</label>
                  <select className="w-full px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] font-black uppercase outline-none focus:border-zinc-900"
                    value={formData.metodo_pago} onChange={e => setFormData({...formData, metodo_pago: e.target.value})}>
                    <option value="transferencia">Transferencia</option>
                    <option value="efectivo">Efectivo</option>
                    <option value="consignacion">Consignación</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Observación</label>
                <textarea className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs outline-none focus:border-zinc-900 h-20 resize-none"
                  value={formData.observacion} onChange={e => setFormData({...formData, observacion: e.target.value})} placeholder="Detalle del pago..." />
              </div>

              <button type="submit" disabled={loading} className="w-full py-4 bg-zinc-900 text-white rounded-2xl font-black text-xs uppercase hover:bg-black transition-all flex items-center justify-center gap-2">
                {loading ? <Loader2 className="animate-spin" size={18} /> : 'Confirmar Pago'}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};