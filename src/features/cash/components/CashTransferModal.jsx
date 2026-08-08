import React, { useState } from 'react';
import { X, Loader2, ArrowLeftRight, AlertTriangle } from 'lucide-react';
import { cashService } from '../services/cashService';
import { useToast } from '../../../context/ToastContext';

export const CashTransferModal = ({ isOpen, onClose, cashSessions, summary, onSave }) => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [formData, setFormData] = useState({
    caja_origen_id: '',
    caja_destino_id: '',
    monto: '',
    descripcion: ''
  });

  if (!isOpen) return null;

  const handleInitialSubmit = (e) => {
    e.preventDefault();
    if (!formData.caja_origen_id || !formData.caja_destino_id || !formData.monto) return;

    if (formData.caja_origen_id === formData.caja_destino_id) {
      showToast("La caja origen y destino no pueden ser la misma", "error");
      return;
    }

    setShowConfirm(true);
  };

  const executeTransfer = async () => {
    setLoading(true);
    try {
      const res = await cashService.registerTransfer({
        caja_origen_id: Number(formData.caja_origen_id),
        caja_destino_id: Number(formData.caja_destino_id),
        monto: Number(formData.monto),
        descripcion: formData.descripcion
      });
      if (res.status) {
        showToast(res.message || "Transferencia realizada correctamente.", "success");
        onSave();
        onClose();
        setShowConfirm(false);
        setFormData({ caja_origen_id: '', caja_destino_id: '', monto: '', descripcion: '' });
      } else {
        showToast(res.message || "Error al realizar transferencia", "error");
        setShowConfirm(false);
      }
    } catch (error) {
      showToast("Error de conexión al realizar transferencia", "error");
      setShowConfirm(false);
    } finally {
      setLoading(false);
    }
  };

  const origenNombre = cashSessions.find(c => c.id === Number(formData.caja_origen_id))?.nombre || '';
  const destinoNombre = cashSessions.find(c => c.id === Number(formData.caja_destino_id))?.nombre || '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-[2.5rem] w-full max-w-lg p-6 md:p-8 shadow-2xl border border-slate-100 space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-black text-slate-800 uppercase flex items-center gap-2">
            <ArrowLeftRight className="text-blue-500" size={20} /> Transferencia entre Cajas
          </h3>
          <button onClick={() => { setShowConfirm(false); onClose(); }} className="p-2 text-slate-400 hover:text-slate-600 rounded-full bg-slate-50">
            <X size={18} />
          </button>
        </div>

        {showConfirm ? (
          <div className="space-y-6 py-4 text-center">
            <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-3xl mx-auto flex items-center justify-center">
              <AlertTriangle size={32} />
            </div>
            <div className="space-y-2">
              <h4 className="text-base font-black text-slate-800 uppercase">¿Confirma la transferencia?</h4>
              <p className="text-xs text-slate-500 font-medium">
                Está a punto de mover <strong className="text-slate-800 font-black">$ {Number(formData.monto || 0).toLocaleString()}</strong> de <span className="font-bold text-slate-700">{origenNombre}</span> hacia <span className="font-bold text-slate-700">{destinoNombre}</span>.
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                disabled={loading}
                onClick={() => setShowConfirm(false)}
                className="flex-1 bg-slate-100 text-slate-700 py-4 rounded-2xl font-black uppercase text-xs hover:bg-slate-200 transition-all"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={executeTransfer}
                className="flex-1 bg-zinc-900 text-white py-4 rounded-2xl font-black uppercase text-xs hover:bg-black transition-all shadow-lg flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="animate-spin" size={16} /> : "Sí, Transferir"}
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleInitialSubmit} className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Caja Origen</label>
              <select
                required
                className="w-full mt-1 p-3 bg-slate-50 rounded-xl border text-xs font-black uppercase outline-none focus:ring-2 focus:ring-zinc-900"
                value={formData.caja_origen_id}
                onChange={(e) => setFormData({ ...formData, caja_origen_id: e.target.value })}
              >
                <option value="">Seleccione caja origen</option>
                {cashSessions.map((caja) => {
                  const cajaSummary = Array.isArray(summary) ? summary.find(s => s.id === caja.id) : null;
                  const saldo = cajaSummary ? Number(cajaSummary.saldo_sistema || 0) : 0;
                  return (
                    <option key={caja.id} value={caja.id}>
                      {caja.nombre} - Saldo: $ {saldo.toLocaleString()}
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Caja Destino</label>
              <select
                required
                className="w-full mt-1 p-3 bg-slate-50 rounded-xl border text-xs font-black uppercase outline-none focus:ring-2 focus:ring-zinc-900"
                value={formData.caja_destino_id}
                onChange={(e) => setFormData({ ...formData, caja_destino_id: e.target.value })}
              >
                <option value="">Seleccione caja destino</option>
                {cashSessions.map((caja) => {
                  const cajaSummary = Array.isArray(summary) ? summary.find(s => s.id === caja.id) : null;
                  const saldo = cajaSummary ? Number(cajaSummary.saldo_sistema || 0) : 0;
                  return (
                    <option key={caja.id} value={caja.id}>
                      {caja.nombre} - Saldo: $ {saldo.toLocaleString()}
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Monto</label>
              <input
                type="number"
                step="any"
                required
                placeholder="0"
                className="w-full mt-1 p-3 bg-slate-50 rounded-xl border text-xs font-black text-right outline-none focus:ring-2 focus:ring-zinc-900"
                value={formData.monto}
                onChange={(e) => setFormData({ ...formData, monto: e.target.value })}
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Descripción</label>
              <textarea
                required
                rows={3}
                placeholder="Motivo de la transferencia..."
                className="w-full mt-1 p-3 bg-slate-50 rounded-xl border text-xs font-black outline-none focus:ring-2 focus:ring-zinc-900 resize-none"
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              />
            </div>

            <button
              type="submit"
              className="w-full bg-zinc-900 text-white py-4 rounded-2xl font-black uppercase text-xs hover:bg-black transition-all shadow-lg flex items-center justify-center gap-2"
            >
              Continuar con la Transferencia
            </button>
          </form>
        )}
      </div>
    </div>
  );
};