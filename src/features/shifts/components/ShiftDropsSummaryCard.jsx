import React from "react";
import { Banknote, Clock, AlertTriangle } from "lucide-react";

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

/**
 * Bloque informativo de descargues de dinero realizados durante el turno.
 * No altera cálculos de cierre, total_reportado ni movimientos_caja.
 */
export const ShiftDropsSummaryCard = ({
  descargues = [],
  totalDescargues = 0,
  efectivoTotal = 0,
  mode = "islero", // 'islero' | 'admin' | 'detalle'
}) => {
  const totalDesc = Math.round((Number(totalDescargues) || 0) * 100) / 100;
  const totalEfec = Math.round((Number(efectivoTotal) || 0) * 100) / 100;
  const efectivoRestante = Math.round((totalEfec - totalDesc) * 100) / 100;
  const excedeEfectivo = totalDesc > 0 && totalEfec < totalDesc;

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <Banknote size={17} />
          </div>
          <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-800">
              {mode === "admin"
                ? "Desglose de Efectivo y Descargues del Turno"
                : "Descargues de Dinero del Turno"}
            </h3>
            <p className="text-[11px] text-slate-500 font-medium">
              {mode === "islero"
                ? "El campo Efectivo representa el efectivo total de la jornada; los descargues ya entregados se descuentan aquí como referencia."
                : "Control informativo de entregas parciales de efectivo durante la jornada."}
            </p>
          </div>
        </div>
        <span className="px-2.5 py-1 rounded-full bg-slate-200/70 text-slate-700 text-[10px] font-black uppercase tracking-wider">
          {descargues.length} {descargues.length === 1 ? "descargue" : "descargues"}
        </span>
      </div>

      {/* KPI Cards */}
      <div className="p-5 space-y-4">
        <div
          className={`grid grid-cols-1 ${
            mode === "islero" ? "sm:grid-cols-2" : "sm:grid-cols-3"
          } gap-3`}
        >
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-100">
            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700">
              Total Descargado
            </p>
            <p className="text-lg font-black text-emerald-900 mt-1">
              {formatCurrency(totalDesc)}
            </p>
          </div>

          <div
            className={`p-3.5 rounded-2xl border ${
              excedeEfectivo
                ? "bg-amber-50 border-amber-200"
                : "bg-slate-50 border-slate-200"
            }`}
          >
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-600">
              {mode === "admin"
                ? "Efectivo Restante al Cierre"
                : "Efectivo Restante por Entregar"}
            </p>
            <p
              className={`text-lg font-black mt-1 ${
                excedeEfectivo ? "text-amber-700" : "text-slate-900"
              }`}
            >
              {formatCurrency(efectivoRestante)}
            </p>
          </div>

          {mode !== "islero" && (
            <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-100">
              <p className="text-[10px] font-black uppercase tracking-widest text-blue-700">
                Efectivo Total Recibido (Jornada)
              </p>
              <p className="text-lg font-black text-blue-900 mt-1">
                {formatCurrency(totalEfec)}
              </p>
            </div>
          )}
        </div>

        {excedeEfectivo && (
          <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold">
            <AlertTriangle size={16} className="shrink-0 mt-0.5 text-amber-600" />
            <span>
              El efectivo total reportado ({formatCurrency(totalEfec)}) es menor al
              total de descargues registrados ({formatCurrency(totalDesc)}). Verifique
              que el campo Efectivo incluya el efectivo total de toda la jornada.
            </span>
          </div>
        )}

        {/* Detail Table */}
        {descargues.length === 0 ? (
          <p className="text-xs text-slate-400 italic text-center py-3 bg-slate-50 rounded-2xl">
            No se registraron descargues de dinero en este turno.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-100">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-100">
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">Fecha y Hora</th>
                  <th className="py-2.5 px-3">Observación</th>
                  <th className="py-2.5 px-3 text-right">Monto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {descargues.map((d, index) => (
                  <tr key={d.id || index} className="hover:bg-slate-50/70">
                    <td className="py-2.5 px-3 font-bold text-slate-400">
                      {index + 1}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-700 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5">
                        <Clock size={12} className="text-slate-400" />
                        {formatDateTime(d.fecha_descargue || d.created_at)}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">
                      {d.observacion || (
                        <span className="text-slate-400 italic">Sin observación</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right font-black text-slate-900 whitespace-nowrap">
                      {formatCurrency(d.monto)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
