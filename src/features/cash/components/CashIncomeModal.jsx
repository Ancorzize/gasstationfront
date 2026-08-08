import React, { useState } from 'react';
import { X, Loader2, ArrowUpCircle } from 'lucide-react';
import { cashService } from '../services/cashService';
import { useToast } from '../../../context/ToastContext';

const MEDIOS_PAGO = [
  { id: 'efectivo', label: 'Efectivo' },
  { id: 'qr', label: 'QR' },
  { id: 'transferencia', label: 'Transferencia' },
  { id: 'consignacion', label: 'Consignación' },
  { id: 'datáfono', label: 'Datáfono' },
  { id: 'digital', label: 'Digital' },
];

export const CashIncomeModal = ({ isOpen, onClose, cashSessions, summary, onSave }) => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    caja_id: '',
    monto: '',
    medio_pago: 'efectivo',
    descripcion: ''
  });

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.caja_id || !formData.monto) return;

    setLoading(true);
    try {
      const res = await cashService.registerIncome({
        caja_id: Number(formData.caja_id),
        monto: Number(formData.monto),
        medio_pago: formData.medio_pago,
        descripcion: formData.descripcion
      });
      if (res.status) {
        showToast(res.message || "Ingreso registrado correctamente.", "success");
        onSave();
        onClose();
        setFormData({ caja_id: '', monto: '', medio_pago: 'efectivo', descripcion: '' });
      } else {
        showToast(res.message || "Error al registrar ingreso", "error");
      }
    } catch (error) {
      showToast("Error de conexión al registrar ingreso", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-[2.5rem] w-full max-w-lg p-6 md:p-8 shadow-2xl border border-slate-100 space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-black text-slate-800 uppercase flex items-center gap-2">
            <ArrowUpCircle className="text-emerald-500" size={20} /> Ingreso Manual de Caja
          </h3>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-full bg-slate-50">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Caja</label>
            <select
              required
              className="w-full mt-1 p-3 bg-slate-50 rounded-xl border text-xs font-black uppercase outline-none focus:ring-2 focus:ring-zinc-900"
              value={formData.caja_id}
              onChange={(e) => setFormData({ ...formData, caja_id: e.target.value })}
            >
              <option value="">Seleccione una caja</option>
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
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Medio de Pago</label>
            <select
              className="w-full mt-1 p-3 bg-slate-50 rounded-xl border text-xs font-black uppercase outline-none focus:ring-2 focus:ring-zinc-900"
              value={formData.medio_pago}
              onChange={(e) => setFormData({ ...formData, medio_pago: e.target.value })}
            >
              {MEDIOS_PAGO.map((m) => (
                <option key={m.id} value={m.id}>{m.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Descripción</label>
            <textarea
              required
              rows={3}
              placeholder="Detalle del ingreso..."
              className="w-full mt-1 p-3 bg-slate-50 rounded-xl border text-xs font-black outline-none focus:ring-2 focus:ring-zinc-900 resize-none"
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-zinc-900 text-white py-4 rounded-2xl font-black uppercase text-xs hover:bg-black transition-all shadow-lg flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" size={16} /> : "Guardar Ingreso"}
          </button>
        </form>
      </div>
    </div>
  );
};