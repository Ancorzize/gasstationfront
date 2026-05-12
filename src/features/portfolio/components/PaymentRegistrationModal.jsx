import React, { useState } from 'react';
import { X, DollarSign, Wallet, Calendar, MessageSquare, Loader2, CheckCircle } from 'lucide-react';
import { portfolioService } from '../services/portfolioService';
import { useToast } from '../../../context/ToastContext';
import { getTodayStr } from '../../../shared/utils/dateUtils';

export const PaymentRegistrationModal = ({ isOpen, onClose, onSave, client }) => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    cliente_id: client?.id,
    fecha_abono: getTodayStr(),
    valor: '',
    medio_pago: 'efectivo',
    observacion: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (parseFloat(formData.valor) > parseFloat(client?.saldo_credito)) {
      return showToast("El abono no puede superar el saldo pendiente", "error");
    }

    setLoading(true);
    try {
      const res = await portfolioService.registerPayment({
        ...formData,
        cliente_id: client.id
      });

      if (res.status) {
        showToast("Abono registrado con éxito", "success");
        onSave();
        onClose();
      } else {
        showToast(res.message, "error");
      }
    } catch (error) {
      showToast("Error de conexión con el servidor", "error");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in duration-200">
        <header className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-200">
              <DollarSign size={24} />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">Registrar Abono de Cartera</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Saldo Actual: $ {Number(client?.saldo_credito).toLocaleString()}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-xl transition-colors text-slate-400"><X size={24} /></button>
        </header>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Fecha de Recaudo</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-3.5 text-slate-300" size={16} />
                <input
                  type="date"
                  required
                  className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold outline-none focus:border-zinc-900 transition-all uppercase"
                  value={formData.fecha_abono}
                  onChange={(e) => setFormData({ ...formData, fecha_abono: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Monto a Abonar</label>
              <div className="relative">
                <DollarSign className="absolute left-4 top-3.5 text-emerald-500" size={16} />
                <input
                  type="number"
                  required
                  step="0.01"
                  placeholder="0.00"
                  className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-black outline-none focus:border-emerald-500 transition-all"
                  value={formData.valor}
                  onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Medio de Pago</label>
            <div className="grid grid-cols-3 gap-3">
              {['efectivo', 'transferencia', 'consignacion', 'datafono', 'qr'].map((method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => setFormData({ ...formData, medio_pago: method })}
                  className={`py-3 rounded-xl border text-[9px] font-black uppercase transition-all ${
                    formData.medio_pago === method 
                    ? 'bg-zinc-900 text-white border-zinc-900 shadow-md' 
                    : 'bg-white text-slate-400 border-slate-100 hover:border-slate-300'
                  }`}
                >
                  {method}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Observaciones</label>
            <div className="relative">
              <MessageSquare className="absolute left-4 top-4 text-slate-300" size={16} />
              <textarea
                rows="2"
                className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-medium outline-none focus:border-zinc-900 transition-all resize-none"
                placeholder="Ej: Abono parcial factura #123..."
                value={formData.observacion}
                onChange={(e) => setFormData({ ...formData, observacion: e.target.value })}
              />
            </div>
          </div>

          <div className="pt-4 flex gap-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-4 rounded-2xl text-[10px] font-black uppercase text-slate-400 hover:bg-slate-50 transition-all"
            >
              Cerrar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-[2] bg-emerald-600 text-white py-4 rounded-2xl text-[10px] font-black uppercase shadow-xl shadow-emerald-100 hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle size={18} />}
              Confirmar Abono
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};