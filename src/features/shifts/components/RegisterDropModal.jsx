import React, { useState } from "react";
import { X, Banknote, Loader2, Clock, CheckCircle2 } from "lucide-react";
import { shiftService } from "../services/shiftService";
import { useToast } from "../../../context/ToastContext";

const formatCurrency = (val) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number(val) || 0);

const formatDateTime = (dateStr) => {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleString("es-CO", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const RegisterDropModal = ({
  isOpen,
  onClose,
  shiftId,
  descargues = [],
  totalDescargues = 0,
  onSuccess,
}) => {
  const { showToast } = useToast();
  const [montoInput, setMontoInput] = useState("");
  const [observacion, setObservacion] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const parseMonto = (raw) => {
    const cleaned = String(raw || "")
      .replace(/\./g, "")
      .replace(",", ".");
    return parseFloat(cleaned);
  };

  const handleMontoChange = (e) => {
    const raw = e.target.value.replace(/[^\d]/g, "");
    if (!raw) {
      setMontoInput("");
      return;
    }
    const formatted = Number(raw).toLocaleString("es-CO");
    setMontoInput(formatted);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const monto = parseMonto(montoInput);

    if (!monto || isNaN(monto) || monto <= 0) {
      showToast("Ingrese un monto válido mayor a cero.", "error");
      return;
    }

    setSubmitting(true);
    try {
      const res = await shiftService.registerShiftDrop(shiftId, {
        monto,
        observacion: observacion.trim() || null,
      });

      if (res.status) {
        showToast("Descargue registrado correctamente.", "success");
        setMontoInput("");
        setObservacion("");
        if (onSuccess) onSuccess(res.data);
      } else {
        showToast(res.message || "No se pudo registrar el descargue.", "error");
      }
    } catch {
      showToast("Error de conexión al registrar el descargue.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Banknote size={22} />
            </div>
            <div>
              <h3 className="text-base font-black tracking-tight">
                Registrar Descargue de Dinero
              </h3>
              <p className="text-[11px] text-slate-400 font-medium">
                Turno #{shiftId} · Entrega parcial de efectivo
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-black uppercase tracking-widest text-slate-500 mb-1.5">
                Monto entregado (Efectivo)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-black">
                  $
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={montoInput}
                  onChange={handleMontoChange}
                  placeholder="0"
                  disabled={submitting}
                  className="w-full pl-9 pr-4 py-3.5 rounded-2xl border border-slate-200 focus:border-slate-900 focus:ring-0 text-lg font-black text-slate-900 bg-slate-50"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-black uppercase tracking-widest text-slate-500 mb-1.5">
                Observación (opcional)
              </label>
              <input
                type="text"
                maxLength={255}
                value={observacion}
                onChange={(e) => setObservacion(e.target.value)}
                placeholder="Ej. Entrega en caja principal / billetes de 50k"
                disabled={submitting}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:border-slate-900 focus:ring-0 text-sm text-slate-700 bg-slate-50"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-1">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Cerrar
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-colors disabled:opacity-60"
              >
                {submitting ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <CheckCircle2 size={15} />
                )}
                Guardar Descargue
              </button>
            </div>
          </form>

          {/* Resumen y lista de descargues registrados */}
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-widest text-slate-500">
                Descargues registrados ({descargues.length})
              </span>
              <span className="text-sm font-black text-emerald-700">
                Total: {formatCurrency(totalDescargues)}
              </span>
            </div>

            {descargues.length === 0 ? (
              <p className="text-xs text-slate-400 italic text-center py-3 bg-slate-50 rounded-2xl">
                Aún no se han registrado descargues en este turno.
              </p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {descargues.map((d, idx) => (
                  <div
                    key={d.id || idx}
                    className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100"
                  >
                    <div className="min-w-0 pr-3">
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500">
                        <Clock size={12} />
                        <span>{formatDateTime(d.fecha_descargue || d.created_at)}</span>
                      </div>
                      {d.observacion && (
                        <p className="text-xs text-slate-600 truncate mt-0.5">
                          {d.observacion}
                        </p>
                      )}
                    </div>
                    <span className="text-sm font-black text-slate-900 whitespace-nowrap">
                      {formatCurrency(d.monto)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
