import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Loader2,
  ArrowLeft,
  Banknote,
  Droplets,
  Send,
  Clock,
  ShieldAlert,
  AlertCircle,
  Calculator,
  CheckCircle2,
  RotateCcw,
} from "lucide-react";
import { shiftService } from "../services/shiftService";
import { useToast } from "../../../context/ToastContext";
import { usePermissions } from "../../../hooks/usePermissions";
import { ShiftOperationsSection } from "../components/ShiftOperationsSection";

// Formato colombiano a 3 decimales para Mangueras y Lecturas (ej: 12.345,334)
const formatLectura = (value) => {
  if (value === "" || value === null || value === undefined) return "";
  const num = Number(value);
  if (isNaN(num)) return "";

  const parts = num.toFixed(3).split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${parts[0]},${parts[1]}`;
};

// Conversión segura de texto colombiano / numpad a número flotante estándar
const parseLectura = (str, lecturaInicial = 0) => {
  if (str === "" || str === null || str === undefined) return "";
  const clean = String(str).replace(/[^\d,.-]/g, "").trim();
  if (clean === "") return "";

  const hasComma = clean.includes(",");
  const dotCount = (clean.match(/\./g) || []).length;

  // Caso 1: Tiene coma decimal (Formato estándar colombiano: 12.346,334 o 12346,334)
  if (hasComma) {
    const parts = clean.split(",");
    const integerPart = parts[0].replace(/\./g, "");
    const decimalPart = parts.slice(1).join("").replace(/[^\d]/g, "");
    const num = parseFloat(`${integerPart}.${decimalPart}`);
    return isNaN(num) ? "" : num;
  }

  // Caso 2: No tiene coma, pero tiene múltiples puntos (ej: 1.234.567) -> Puntos de miles
  if (dotCount > 1) {
    const num = parseFloat(clean.replace(/\./g, ""));
    return isNaN(num) ? "" : num;
  }

  // Caso 3: No tiene coma y tiene exactamente 1 punto
  if (dotCount === 1) {
    const [before, after] = clean.split(".");

    // Si después del punto NO hay 3 dígitos (ej: 12.5, 12346.45)
    // o antes del punto hay más de 3 dígitos (ej: 12346.334),
    // se distingue inequívocamente como punto decimal del teclado numérico.
    if (after.length !== 3 || before.length > 3) {
      const num = parseFloat(clean);
      return isNaN(num) ? "" : num;
    }

    // Ambigüedad de 1-3 dígitos antes y 3 dígitos después (ej: 12.346)
    // Si la lectura inicial es >= 100, 12.346 como decimal sería 12 galones (< inicial),
    // mientras que como miles representa 12346 galones (>= inicial).
    const asThousands = parseFloat(clean.replace(/\./g, ""));
    const asDecimal = parseFloat(clean);
    const inicial = Number(lecturaInicial) || 0;

    if (inicial >= 100 && asDecimal < inicial && asThousands >= inicial) {
      return asThousands;
    }

    return asDecimal;
  }

  // Caso 4: Solo dígitos (ej: 12346) -> Entero directo
  const num = parseFloat(clean);
  return isNaN(num) ? "" : num;
};

// Funciones auxiliares de formateo numérico estilo colombiano con hasta 3 decimales
const formatPesos = (value) => {
  if (value === "" || value === null || value === undefined) return "";
  const stringValue = String(value);

  const parts = stringValue.split(",");
  let entera = parts[0].replace(/[^\d]/g, "");

  if (entera !== "") {
    entera = Number(entera).toLocaleString("es-CO");
  }

  if (parts.length > 1) {
    const decimal = parts[1].replace(/[^\d]/g, "").slice(0, 3);
    return `${entera},${decimal}`;
  }

  return entera;
};

const parsePesos = (str) => {
  if (!str && str !== 0) return "";
  const clean = String(str).replace(/\./g, "").replace(",", ".");
  const num = parseFloat(clean);
  return isNaN(num) ? "" : num;
};

export const ShiftClosingPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { hasPermission } = usePermissions();

  const [loading, setLoading] = useState(false);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [summary, setSummary] = useState(null);

  const [formData, setFormData] = useState({
    lecturas_finales: [],
    destinos_recaudo: [],
  });

  const estadoActual = summary?.turno?.estado;
  const isReadOnly =
    estadoActual === "pendiente_cierre" || estadoActual === "cerrado";

  const showManguerasSection =
    hasPermission("vender_combustible") &&
    Array.isArray(summary?.lecturas) &&
    summary.lecturas.length > 0;

  // Carga y refresco del resumen del turno
  const fetchSummary = async (isInitial = false) => {
    if (isInitial) setLoadingSummary(true);
    try {
      const res = await shiftService.getClosingSummary(id);
      if (res.status && res.data) {
        const data = res.data;
        setSummary(data);

        if (isInitial) {
          // Inicialización del formulario editable
          const lecturasInits = (data.lecturas || []).map((l) => {
            const val =
              l.lectura_final !== null && l.lectura_final !== undefined
                ? l.lectura_final
                : l.lectura_sugerida !== null &&
                    l.lectura_sugerida !== undefined
                  ? l.lectura_sugerida
                  : "";
            const formattedVal =
              val !== "" ? formatLectura(val) : "";
            return {
              manguera_id: l.manguera_id,
              lectura_final: val,
              lecturaFinalInput: formattedVal,
              lectura_inicial: l.lectura_inicial,
              precio_galon: l.precio_galon,
            };
          });

          const destinosInits = (data.destinos_recaudo || []).map((d) => {
            // Si el turno tiene recaudos guardados (ej: turno devuelto), precargar
            const prevRecaudo = (data.turno?.recaudos || []).find(
              (r) => r.destino_recaudo_id === d.destino_recaudo_id,
            );
            const initialPagos = prevRecaudo
              ? {
                  efectivo: Number(prevRecaudo.efectivo || 0),
                  qr: Number(prevRecaudo.qr || 0),
                  datafono: Number(prevRecaudo.datafono || 0),
                  transferencia: Number(prevRecaudo.transferencia || 0),
                  consignacion: Number(prevRecaudo.consignacion || 0),
                }
              : { ...d.pagos };

            const pagosInputs = {};
            Object.keys(initialPagos).forEach((medio) => {
              const val = initialPagos[medio];
              pagosInputs[medio] = val
                ? formatPesos(String(val).replace(".", ","))
                : "";
            });

            return {
              destino_recaudo_id: d.destino_recaudo_id,
              codigo: d.codigo,
              nombre: d.nombre,
              pagos: initialPagos,
              pagosInputs: pagosInputs,
            };
          });

          setFormData({
            lecturas_finales: lecturasInits,
            destinos_recaudo: destinosInits,
          });
        } else {
          // Refresco tras editar/anular operaciones:
          // PRESERVAR lecturas finales y recaudo de combustible digitados por el islero.
          // Actualizar destinos automáticos (Lubricantes) con los nuevos totales del backend.
          setFormData((prev) => ({
            ...prev,
            destinos_recaudo: (data.destinos_recaudo || []).map((d) => {
              const existing = prev.destinos_recaudo.find(
                (p) => p.destino_recaudo_id === d.destino_recaudo_id,
              );
              const esEditable =
                d.codigo === "COMB" || d.nombre !== "Lubricantes";
              if (existing && esEditable) {
                return existing;
              }
              const initialPagos = { ...d.pagos };
              const pagosInputs = {};
              Object.keys(initialPagos).forEach((medio) => {
                const val = initialPagos[medio];
                pagosInputs[medio] = val
                  ? formatPesos(String(val).replace(".", ","))
                  : "";
              });
              return {
                destino_recaudo_id: d.destino_recaudo_id,
                codigo: d.codigo,
                nombre: d.nombre,
                pagos: initialPagos,
                pagosInputs: pagosInputs,
              };
            }),
          }));
        }
      } else {
        showToast(
          res.message || "Error al cargar información del turno",
          "error",
        );
      }
    } catch (e) {
      showToast("Error de conexión al cargar el resumen del turno", "error");
    } finally {
      if (isInitial) setLoadingSummary(false);
    }
  };

  useEffect(() => {
    fetchSummary(true);
  }, [id]);

  const handleOperationsChanged = () => {
    // Al editar o anular una operación, refresca los datos del servidor sin borrar los inputs del islero
    fetchSummary(false);
  };

  // Cálculo en tiempo real del Balance del Turno con anticipos aplicados
  const calculatedValues = useMemo(() => {
    if (!summary)
      return {
        totalCombustible: 0,
        ventasLubricantes: 0,
        creditos: 0,
        anticipos: 0,
        abonos: 0,
        totalEsperado: 0,
        totalReportado: 0,
        balance: 0,
      };

    // 1. Combustible físico a partir de las lecturas ingresadas en el formulario
    const totalCombustible = formData.lecturas_finales.reduce((acc, l) => {
      const inicial = Number(l.lectura_inicial) || 0;
      const final =
        l.lectura_final !== "" && !isNaN(Number(l.lectura_final))
          ? Number(l.lectura_final)
          : inicial;
      const galonesVendidos = Math.max(0, final - inicial);
      const galonesRedondeados = Math.round(galonesVendidos * 1000) / 1000;
      return acc + galonesRedondeados * Number(l.precio_galon || 0);
    }, 0);

    // 2. Ventas de lubricantes (POS)
    const ventasLubricantes = Number(
      summary.totales_sistema?.ventas_lubricantes || 0,
    );

    // 3. Créditos otorgados en el turno (saldo pendiente de ventas)
    const creditos = Number(
      summary.totales_sistema?.creditos ||
        summary.totales_pago_sugeridos?.creditos ||
        0,
    );

    // 4. Anticipos de clientes aplicados a ventas del turno (saldo a favor consumido)
    const anticipos = Number(
      summary.totales_sistema?.anticipos_aplicados ||
        summary.totales_pago_sugeridos?.anticipos_aplicados ||
        0,
    );

    // 5. Abonos de cartera recibidos en el turno
    const abonos = (summary.abonos_recibidos || []).reduce(
      (acc, a) => acc + Number(a.monto || 0),
      0,
    );

    // Total Esperado = Combustible físico + Lubricantes - Créditos - Anticipos + Abonos
    let totalEsperado =
      totalCombustible + ventasLubricantes - creditos - anticipos + abonos;

    if (Math.abs(totalEsperado) < 100) {
      totalEsperado = 0;
    }

    // Total Reportado = Recaudos por destino (combustible + lubricantes automáticos) + Abonos
    const totalReportado =
      formData.destinos_recaudo.reduce((acc, d) => {
        return (
          acc +
          Object.values(d.pagos || {}).reduce(
            (sum, val) => sum + (Number(val) || 0),
            0,
          )
        );
      }, 0) + abonos;

    let balance = totalReportado - totalEsperado;

    if (Math.abs(balance) < 100) {
      balance = 0;
    }

    return {
      totalCombustible: Math.round(totalCombustible),
      ventasLubricantes: Math.round(ventasLubricantes),
      creditos: Math.round(creditos),
      anticipos: Math.round(anticipos),
      abonos: Math.round(abonos),
      totalEsperado: Math.round(totalEsperado),
      totalReportado: Math.round(totalReportado),
      balance: Math.round(balance),
    };
  }, [summary, formData]);

  const handleReadingChange = (mangueraId, rawValue) => {
    // Permitir dígitos, comas, puntos y guiones sin alterar destructivamente el texto mientras se escribe
    const filtered = rawValue.replace(/[^0-9,.-]/g, "");

    setFormData((prev) => ({
      ...prev,
      lecturas_finales: prev.lecturas_finales.map((l) => {
        if (l.manguera_id !== mangueraId) return l;
        const parsedNum = parseLectura(filtered, l.lectura_inicial);
        return {
          ...l,
          lecturaFinalInput: filtered,
          lectura_final: parsedNum,
        };
      }),
    }));
  };

  const handleReadingBlur = (mangueraId) => {
    setFormData((prev) => ({
      ...prev,
      lecturas_finales: prev.lecturas_finales.map((l) => {
        if (l.manguera_id !== mangueraId) return l;
        const num = l.lectura_final;
        return {
          ...l,
          lecturaFinalInput:
            num !== "" && !isNaN(num) ? formatLectura(num) : "",
        };
      }),
    }));
  };

  const handleClearReading = (mangueraId) => {
    setFormData((prev) => ({
      ...prev,
      lecturas_finales: prev.lecturas_finales.map((l) => {
        if (l.manguera_id !== mangueraId) return l;
        return {
          ...l,
          lectura_final: "",
          lecturaFinalInput: "",
        };
      }),
    }));
  };

  const handlePaymentChange = (destinoId, medio, rawValue) => {
    const filtered = rawValue.replace(/[^0-9,.-]/g, "").replace(/\./g, ",");
    const parts = filtered.split(",");
    const cleanValue =
      parts.length > 1 ? `${parts[0]},${parts.slice(1).join("")}` : parts[0];

    setFormData((prev) => ({
      ...prev,
      destinos_recaudo: prev.destinos_recaudo.map((d) => {
        if (d.destino_recaudo_id !== destinoId) return d;
        const numericVal = parsePesos(cleanValue);
        return {
          ...d,
          pagos: { ...d.pagos, [medio]: numericVal === "" ? 0 : numericVal },
          pagosInputs: { ...d.pagosInputs, [medio]: cleanValue },
        };
      }),
    }));
  };

  const handlePaymentBlur = (destinoId, medio) => {
    setFormData((prev) => ({
      ...prev,
      destinos_recaudo: prev.destinos_recaudo.map((d) => {
        if (d.destino_recaudo_id !== destinoId) return d;
        const num = d.pagos[medio];
        return {
          ...d,
          pagosInputs: {
            ...d.pagosInputs,
            [medio]: num ? formatPesos(String(num).replace(".", ",")) : "",
          },
        };
      }),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isReadOnly) return;

    // Validación de lecturas obligatorias antes de enviar
    if (showManguerasSection && formData.lecturas_finales.length > 0) {
      for (const l of formData.lecturas_finales) {
        if (
          l.lectura_final === "" ||
          l.lectura_final === null ||
          l.lectura_final === undefined ||
          isNaN(Number(l.lectura_final))
        ) {
          showToast(
            "Debe ingresar la lectura final para todas las mangueras asignadas.",
            "error",
          );
          return;
        }

        const numFinal = Number(l.lectura_final);
        const numInicial = Number(l.lectura_inicial || 0);

        if (numFinal < numInicial) {
          showToast(
            `La lectura final (${formatLectura(numFinal)}) no puede ser menor a la lectura inicial (${formatLectura(numInicial)}).`,
            "error",
          );
          return;
        }
      }
    }

    setLoading(true);
    try {
      const payload = {
        lecturas_finales: formData.lecturas_finales.map(
          ({ manguera_id, lectura_final }) => ({
            manguera_id,
            lectura_final: Number(lectura_final),
          }),
        ),
        destinos_recaudo: formData.destinos_recaudo.map((d) => ({
          destino_recaudo_id: d.destino_recaudo_id,
          pagos: d.pagos,
        })),
        otros_movimientos: 0,
        otros_movimientos_detalle: null,
        observacion_cierre: "",
      };

      const res = await shiftService.requestCloseShift(id, payload);
      if (res && res.status) {
        showToast(
          "Cierre de turno solicitado exitosamente. Pendiente de aprobación administrativa.",
          "success",
        );
        navigate(`/operacion/turnos`);
      } else {
        showToast(
          res?.message || "Error al solicitar el cierre del turno",
          "error",
        );
      }
    } catch (error) {
      showToast(
        error?.message || "Error al solicitar el cierre del turno",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  if (loadingSummary) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="animate-spin text-zinc-900" size={40} />
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
          Cargando datos del turno y balance del sistema...
        </p>
      </div>
    );
  }

  const turno = summary?.turno || {};

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-6xl mx-auto pb-24 text-left">
      {/* 1. Cabecera y Alertas de Estado */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate("/operacion/turnos")}
            className="flex items-center gap-2 text-slate-400 hover:text-zinc-900 transition-colors p-2 rounded-xl bg-white border border-slate-100 shadow-sm"
          >
            <ArrowLeft size={18} />
            <span className="text-[10px] font-black uppercase tracking-widest">
              Volver
            </span>
          </button>
          <div className="text-right">
            <h2 className="text-xl md:text-2xl font-black text-slate-800 uppercase tracking-tight italic">
              Cierre de Turno
            </h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Estación: {turno?.estacion?.nombre} | Turno #{id} | Estado:{" "}
              <span className="uppercase font-black text-zinc-900">
                {estadoActual}
              </span>
            </p>
          </div>
        </div>

        {/* Banners condicionales de estado */}
        {estadoActual === "pendiente_cierre" && (
          <div className="bg-amber-50 border border-amber-200 rounded-3xl p-5 flex items-center gap-4 text-amber-800 shadow-sm">
            <Clock size={24} className="shrink-0" />
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider">
                Pendiente de aprobación administrativa
              </h4>
              <p className="text-xs mt-0.5 font-medium">
                Has solicitado el cierre de este turno. Los datos se encuentran
                en revisión por la administración.
              </p>
            </div>
          </div>
        )}

        {estadoActual === "devuelto" && (
          <div className="bg-red-50 border border-red-200 rounded-3xl p-5 flex items-start gap-4 text-red-800 shadow-sm">
            <ShieldAlert size={24} className="shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-xs font-black uppercase tracking-wider">
                Turno Devuelto por el Administrador
              </h4>
              <p className="text-xs font-bold">
                Motivo: {turno?.observacion_devolucion || "Sin especificar"}
              </p>
              <p className="text-[11px] text-red-600">
                Corrige las lecturas de mangueras o el recaudo de combustible
                antes de reenviar la solicitud.
              </p>
            </div>
          </div>
        )}

        {estadoActual === "cerrado" && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-5 flex items-center gap-4 text-emerald-800 shadow-sm">
            <AlertCircle size={24} className="shrink-0" />
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider">
                Turno Cerrado Definitivamente
              </h4>
              <p className="text-xs mt-0.5 font-medium">
                Este turno fue aprobado y cerrado por la administración. No
                permite modificaciones adicionales.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 2. Banner Flotante / Destacado de Balance del Turno */}
      <div
        className={`p-6 rounded-[2rem] shadow-md border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors ${
          calculatedValues.balance === 0
            ? "bg-emerald-50 border-emerald-100 text-emerald-950"
            : calculatedValues.balance < 0
              ? "bg-rose-50 border-rose-100 text-rose-950"
              : "bg-blue-50 border-blue-100 text-blue-950"
        }`}
      >
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Calculator size={18} />
            <h4 className="text-xs font-black uppercase tracking-wider">
              Balance del Turno
            </h4>
          </div>
          <p className="text-xs font-bold opacity-85">
            Esperado: $ {calculatedValues.totalEsperado.toLocaleString("es-CO")}{" "}
            | Reportado: ${" "}
            {calculatedValues.totalReportado.toLocaleString("es-CO")}
          </p>
          <p className="text-[9px] font-semibold opacity-70 uppercase tracking-tight">
            Combustible: $
            {calculatedValues.totalCombustible.toLocaleString("es-CO")} |{" "}
            Lubricantes: $
            {calculatedValues.ventasLubricantes.toLocaleString("es-CO")} |{" "}
            Créditos: -${calculatedValues.creditos.toLocaleString("es-CO")} |{" "}
            Anticipos: -${calculatedValues.anticipos.toLocaleString("es-CO")} |{" "}
            Abonos: +${calculatedValues.abonos.toLocaleString("es-CO")}
          </p>
        </div>
        <div className="text-left md:text-right">
          <p className="text-[10px] font-black uppercase tracking-widest opacity-60">
            Diferencia
          </p>
          <p className="text-xl md:text-2xl font-black">
            {calculatedValues.balance >= 0 ? "Sobrante" : "Faltante"}: ${" "}
            {Math.abs(calculatedValues.balance).toLocaleString("es-CO")}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* 3. Bloque Principal: Mangueras y Recaudo de Combustible */}
        <div
          className={
            showManguerasSection
              ? "grid grid-cols-1 lg:grid-cols-2 gap-8 items-start"
              : "space-y-6 max-w-2xl mx-auto"
          }
        >
          {/* A. Mangueras (Lecturas Físicas) */}
          {showManguerasSection && (
            <div className="bg-white rounded-[2.5rem] border border-slate-100 p-6 md:p-8 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-slate-50 pb-4">
                <h3 className="text-xs font-black text-slate-800 uppercase flex items-center gap-2">
                  <Droplets size={16} /> Mangueras y Lecturas Físicas
                </h3>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                  {formData.lecturas_finales.length} Manguera(s)
                </span>
              </div>

              <div className="space-y-4">
                {formData.lecturas_finales.map((l, index) => {
                  const summaryItem = summary?.lecturas?.[index];
                  const inicial = Number(l.lectura_inicial) || 0;
                  const final =
                    l.lectura_final !== "" && !isNaN(Number(l.lectura_final))
                      ? Number(l.lectura_final)
                      : inicial;
                  const galones = Math.max(0, final - inicial);
                  const subtotalManguera =
                    (Math.round(galones * 1000) / 1000) *
                    Number(l.precio_galon || 0);

                  return (
                    <div
                      key={l.manguera_id}
                      className="p-4 bg-slate-50 rounded-2xl space-y-3 border border-slate-100"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-[10px] font-black uppercase text-slate-800">
                            {summaryItem?.manguera?.nombre ||
                              `Manguera #${l.manguera_id}`}
                          </p>
                          <p className="text-[9px] font-bold text-slate-400">
                            {summaryItem?.manguera?.bomba?.nombre} |{" "}
                            {summaryItem?.manguera?.producto?.nombre}
                          </p>
                          <p className="text-[10px] font-black text-slate-700 mt-1">
                            ${Number(l.precio_galon).toLocaleString("es-CO")}{" "}
                            /gal
                          </p>
                        </div>
                        <span className="text-[9px] font-black text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                          Inicial: {formatLectura(l.lectura_inicial)}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-[8px] font-bold text-slate-400 uppercase">
                              Lectura Final
                            </label>
                            {!isReadOnly && l.lecturaFinalInput !== "" && (
                              <button
                                type="button"
                                onClick={() => handleClearReading(l.manguera_id)}
                                className="text-[9px] font-bold text-rose-500 hover:text-rose-700 flex items-center gap-1 transition-colors"
                                title="Limpiar lectura final de esta manguera"
                              >
                                <RotateCcw size={10} /> Limpiar
                              </button>
                            )}
                          </div>
                          <input
                            type="text"
                            inputMode="decimal"
                            disabled={isReadOnly}
                            placeholder="0,000"
                            className="w-full p-3 rounded-xl border border-slate-200 text-right font-black outline-none focus:border-zinc-900 bg-white text-xs text-slate-800 disabled:bg-slate-100 disabled:cursor-not-allowed"
                            value={l.lecturaFinalInput ?? ""}
                            onChange={(e) =>
                              handleReadingChange(l.manguera_id, e.target.value)
                            }
                            onBlur={() => handleReadingBlur(l.manguera_id)}
                          />
                        </div>

                        <div className="bg-white p-3 rounded-xl border border-slate-100 text-right flex flex-col justify-center">
                          <p className="text-[8px] font-bold text-slate-400 uppercase">
                            Despacho Estimado
                          </p>
                          <p className="text-[11px] font-black text-slate-800">
                            {galones.toLocaleString("es-CO", {
                              minimumFractionDigits: 3,
                              maximumFractionDigits: 3,
                            })}{" "}
                            gal
                          </p>
                          <p className="text-[9px] font-bold text-slate-500">
                            $
                            {Math.round(subtotalManguera).toLocaleString(
                              "es-CO",
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* B. Recaudo de Combustible y Destinos */}
          <div className="space-y-6">
            {formData.destinos_recaudo
              .filter(
                (destino) =>
                  destino.codigo !== "LUBR" && destino.nombre !== "Lubricantes",
              )
              .map((destino) => {
                const esCombustible =
                  destino.codigo === "COMB" || destino.nombre !== "Lubricantes";

                return (
                  <div
                    key={destino.destino_recaudo_id}
                    className="bg-white rounded-[2.5rem] border border-slate-100 p-6 md:p-8 shadow-sm space-y-4"
                  >
                    <div className="flex items-center justify-between border-b border-slate-50 pb-3">
                      <h3 className="text-xs font-black uppercase flex items-center gap-2 text-slate-800">
                        <Banknote size={16} /> Recaudo de {destino.nombre}
                      </h3>
                    </div>

                    {esCombustible && (
                      <p className="text-[9px] font-bold text-slate-400 uppercase leading-relaxed">
                        Declare exclusivamente el dinero recibido por ventas de
                        combustible. Los abonos de cartera se gestionan y
                        contabilizan por separado.
                      </p>
                    )}

                    <div className="grid grid-cols-2 gap-3 pt-2">
                      {Object.keys(destino.pagos).map((medio) => (
                        <div key={medio} className="space-y-1">
                          <label className="text-[8px] font-bold text-slate-400 uppercase block">
                            {medio}
                          </label>
                          <input
                            type="text"
                            inputMode="decimal"
                            readOnly={isReadOnly}
                            disabled={isReadOnly}
                            className={`w-full p-3 rounded-xl text-xs font-black text-right outline-none ${
                              isReadOnly
                                ? "bg-slate-100 border border-slate-200 text-slate-600 cursor-not-allowed"
                                : "bg-slate-50 border border-slate-200 focus:border-zinc-900 text-slate-800"
                            }`}
                            value={destino.pagosInputs?.[medio] ?? ""}
                            placeholder="0,000"
                            onChange={(e) =>
                              handlePaymentChange(
                                destino.destino_recaudo_id,
                                medio,
                                e.target.value,
                              )
                            }
                            onBlur={() =>
                              handlePaymentBlur(destino.destino_recaudo_id, medio)
                            }
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* 4. Sección Operaciones del Turno (Integración con ShiftOperationsSection) */}
        <div className="bg-white rounded-[2.5rem] border border-slate-100 p-6 md:p-8 shadow-sm">
          <ShiftOperationsSection
            turnoId={id}
            turnoEstado={estadoActual}
            onOperationsChanged={handleOperationsChanged}
          />
        </div>

        {/* 5. Botón de Acción Principal */}
        {!isReadOnly ? (
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-zinc-900 text-white py-5 rounded-[2rem] font-black uppercase text-xs hover:bg-black transition-all shadow-xl disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              <Send size={18} />
            )}
            {estadoActual === "devuelto"
              ? "Reenviar Solicitud de Cierre"
              : "Solicitar Aprobación de Cierre"}
          </button>
        ) : (
          <div className="p-4 bg-slate-100 rounded-2xl text-center text-slate-500 font-black text-[10px] uppercase tracking-widest border border-slate-200">
            {estadoActual === "pendiente_cierre"
              ? "El turno ya se encuentra enviado y pendiente de revisión administrativa."
              : "Turno cerrado definitivamente. No admite modificaciones."}
          </div>
        )}
      </form>
    </div>
  );
};
