import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ShoppingBag,
  Calendar,
  Truck,
  Warehouse,
  CheckCircle2,
  Printer,
  Loader2,
  Edit3,
  Plus,
  Info,
  AlertTriangle,
  Eye,
  Wallet,
  Sparkles,
  DollarSign,
} from "lucide-react";
import { purchaseService } from "../services/purchaseService";
import { purchasePaymentService } from "../services/purchasePaymentService";
import { cashService } from "../../cash/services/cashService";
import { useToast } from "../../../context/ToastContext";
import { PaymentModal } from "../components/PaymentModal";
import { usePermissions } from "../../../hooks/usePermissions";

const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  loading,
  cajas,
  selectedCaja,
  setSelectedCaja,
  purchase,
}) => {
  const [usarAnticipo, setUsarAnticipo] = useState(false);
  const [montoAnticipo, setMontoAnticipo] = useState("");

  const saldoDisponible = parseFloat(purchase?.proveedor?.saldo_anticipo || 0);
  const totalCompra = parseFloat(purchase?.total || 0);
  const maxAplicable = Math.min(saldoDisponible, totalCompra);

  useEffect(() => {
    if (isOpen) {
      setUsarAnticipo(false);
      setMontoAnticipo("");
    }
  }, [isOpen]);

  const tipoCajaEsperado = ["efectivo", "consignacion"].includes(purchase?.tipo_pago)
    ? "efectivo"
    : "digital";
  const cajasFiltradas = cajas.filter((c) => c.tipo_caja === tipoCajaEsperado);

  useEffect(() => {
    if (isOpen) {
      const esCompatible = cajas.some(
        (c) => String(c.id) === String(selectedCaja) && c.tipo_caja === tipoCajaEsperado
      );
      if (!esCompatible) {
        const compatible = cajas.find((c) => c.tipo_caja === tipoCajaEsperado);
        setSelectedCaja(compatible ? compatible.id : "");
      }
    }
  }, [isOpen, tipoCajaEsperado, cajas]);

  if (!isOpen) return null;

  const montoAnticipoNum = usarAnticipo ? Math.min(maxAplicable, Math.max(0, parseFloat(montoAnticipo) || 0)) : 0;
  const saldoRestanteCaja = Math.max(0, Math.round((totalCompra - montoAnticipoNum) * 100) / 100);
  const requiereCaja = purchase?.tipo_pago !== "credito" && saldoRestanteCaja > 0;
  const puedeConfirmar = !loading && (!requiereCaja || selectedCaja);

  const handleConfirmClick = () => {
    onConfirm(requiereCaja ? selectedCaja : null, montoAnticipoNum);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-zinc-950/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="p-8 text-center space-y-6">
          <div className="w-20 h-20 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto shadow-sm">
            <AlertTriangle size={40} />
          </div>
          <div className="space-y-4">
            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">
              ¿Confirmar Compra?
            </h3>

            {/* Bloque voluntario de saldo a favor */}
            {saldoDisponible > 0 && (
              <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-2xl text-left space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-emerald-900 flex items-center gap-1.5">
                    <Sparkles size={14} className="text-emerald-600" /> Saldo a Favor Disponible
                  </span>
                  <span className="font-black text-xs text-emerald-700">
                    $ {saldoDisponible.toLocaleString("es-CO")}
                  </span>
                </div>
                
                <label className="flex items-center gap-2 pt-1 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={usarAnticipo}
                    onChange={(e) => {
                      setUsarAnticipo(e.target.checked);
                      if (e.target.checked && !montoAnticipo) {
                        setMontoAnticipo(maxAplicable.toString());
                      }
                    }}
                    className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                  />
                  <span className="text-[11px] font-bold text-slate-700">
                    ¿Desea aplicar saldo a favor a esta compra?
                  </span>
                </label>

                {usarAnticipo && (
                  <div className="pt-2 space-y-2 animate-in fade-in">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase">
                        Monto a aplicar (Máx: $ {maxAplicable.toLocaleString("es-CO")})
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        max={maxAplicable}
                        min="0"
                        value={montoAnticipo}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          if (val > maxAplicable) {
                            setMontoAnticipo(maxAplicable.toString());
                          } else {
                            setMontoAnticipo(e.target.value);
                          }
                        }}
                        placeholder="0.00"
                        className="w-full p-3 bg-white border border-emerald-200 rounded-xl text-xs font-black text-emerald-800 outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div className="p-2.5 bg-white rounded-xl border border-emerald-100 text-[10px] space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-medium">Anticipo aplicado:</span>
                        <span className="font-black text-emerald-700">$ {montoAnticipoNum.toLocaleString("es-CO")}</span>
                      </div>
                      {purchase?.tipo_pago !== "credito" ? (
                        <div className="flex justify-between border-t border-slate-100 pt-1">
                          <span className="text-slate-500 font-medium">Desembolso restante de caja:</span>
                          <span className="font-black text-slate-800">$ {saldoRestanteCaja.toLocaleString("es-CO")}</span>
                        </div>
                      ) : (
                        <div className="flex justify-between border-t border-slate-100 pt-1">
                          <span className="text-slate-500 font-medium">Saldo restante a crédito:</span>
                          <span className="font-black text-orange-600">$ {saldoRestanteCaja.toLocaleString("es-CO")}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Selección de caja de origen (solo si la caja debe desembolsar) */}
            {requiereCaja ? (
              <div className="text-left space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase ml-2">
                  Seleccionar Caja de Origen (Desembolso: $ {saldoRestanteCaja.toLocaleString("es-CO")})
                </label>
                <select
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none uppercase"
                  value={selectedCaja}
                  onChange={(e) => setSelectedCaja(e.target.value)}
                >
                  <option value="">Seleccione una caja...</option>
                  {cajasFiltradas.length === 0 ? (
                    <option value="" disabled>No hay cajas disponibles de tipo {tipoCajaEsperado}</option>
                  ) : (
                    cajasFiltradas.map((caja) => (
                      <option key={caja.id} value={caja.id}>
                        {caja.nombre} ({caja.tipo_caja})
                      </option>
                    ))
                  )}
                </select>
              </div>
            ) : (
              usarAnticipo && saldoRestanteCaja === 0 && (
                <div className="p-3 bg-emerald-100/60 text-emerald-800 rounded-2xl text-xs font-bold border border-emerald-200 text-center">
                  Totalmente cubierta con saldo a favor. No requiere desembolso de caja.
                </div>
              )
            )}
          </div>
          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black text-[10px] uppercase hover:bg-slate-200 transition-all"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirmClick}
              disabled={!puedeConfirmar}
              className="flex-1 px-6 py-4 bg-zinc-900 text-white rounded-2xl font-black text-[10px] uppercase hover:bg-black transition-all shadow-xl disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={16} />
              ) : (
                <CheckCircle2 size={16} />
              )}
              Confirmar Ingreso
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ApplyAdvanceModal = ({
  isOpen,
  onClose,
  onConfirm,
  loading,
  maxAplicable,
  saldoDisponible,
}) => {
  const [monto, setMonto] = useState(maxAplicable.toString());

  useEffect(() => {
    if (isOpen) {
      setMonto(maxAplicable.toString());
    }
  }, [isOpen, maxAplicable]);

  if (!isOpen) return null;

  const montoNum = Math.min(maxAplicable, Math.max(0, parseFloat(monto) || 0));

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-zinc-950/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="p-8 text-center space-y-6">
          <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
            <Sparkles size={32} />
          </div>
          <div className="space-y-4">
            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">
              Aplicar Saldo a Favor
            </h3>
            <p className="text-xs text-slate-500">
              Saldo a favor total disponible:{" "}
              <strong className="text-indigo-600">
                $ {saldoDisponible.toLocaleString("es-CO")}
              </strong>
            </p>
            <div className="text-left space-y-1">
              <label className="text-[9px] font-black text-slate-400 uppercase ml-2">
                Monto a Compensar (Máx: $ {maxAplicable.toLocaleString("es-CO")})
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                max={maxAplicable}
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-black outline-none focus:border-indigo-600"
              />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black text-[10px] uppercase hover:bg-slate-200 transition-all"
            >
              Cancelar
            </button>
            <button
              onClick={() => onConfirm(montoNum)}
              disabled={loading || montoNum <= 0}
              className="flex-1 px-6 py-4 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase hover:bg-indigo-700 transition-all shadow-xl disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={16} />
              ) : (
                <CheckCircle2 size={16} />
              )}
              Aplicar Saldo
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
  const { hasPermission } = usePermissions();

  const [purchase, setPurchase] = useState(null);
  const [pagos, setPagos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingPagos, setLoadingPagos] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isApplyAdvanceOpen, setIsApplyAdvanceOpen] = useState(false);
  const [applyingAdvance, setApplyingAdvance] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const [cajas, setCajas] = useState([]);
  const [selectedCaja, setSelectedCaja] = useState("");

  const fetchCajas = async () => {
    try {
      const res = await cashService.getCurrentCash();
      if (res.status) {
        const ordenadas = res.data.sort((a, b) => a.id - b.id);
        setCajas(ordenadas);

        const lastName = localStorage.getItem(
          "last_selected_purchase_caja_nombre",
        );
        if (lastName) {
          const cajaEncontrada = ordenadas.find((c) => c.nombre === lastName);
          if (cajaEncontrada) {
            setSelectedCaja(cajaEncontrada.id);
          }
        }
      }
    } catch (e) {
      showToast("Error al cargar cajas", "error");
    }
  };

  useEffect(() => {
    if (isConfirmOpen) fetchCajas();
  }, [isConfirmOpen]);

  const handleInitiateConfirm = () => {
    const saldoAnticipo = parseFloat(purchase?.proveedor?.saldo_anticipo || 0);
    if (purchase?.tipo_pago === "credito" && saldoAnticipo === 0) {
      handleConfirm(null, 0);
    } else {
      setIsConfirmOpen(true);
    }
  };

  const handleConfirm = async (cajaId, montoAnticipo = 0) => {
    if (cajaId) {
      const cajaSeleccionadaObj = cajas.find(
        (c) => String(c.id) === String(cajaId),
      );
      if (cajaSeleccionadaObj) {
        localStorage.setItem(
          "last_selected_purchase_caja_nombre",
          cajaSeleccionadaObj.nombre,
        );
      }
    }

    setConfirming(true);
    try {
      const res = await purchaseService.confirmPurchase(id, cajaId, montoAnticipo);
      if (res.status) {
        showToast("Compra confirmada e inventario actualizado", "success");
        setIsConfirmOpen(false);
        fetchPurchase();
      } else {
        showToast(res.message, "error");
        fetchPurchase();
      }
    } catch (e) {
      showToast("Error de conexión", "error");
      fetchPurchase();
    } finally {
      setConfirming(false);
    }
  };

  const handleApplyAdvanceConfirm = async (monto) => {
    setApplyingAdvance(true);
    try {
      const res = await purchaseService.applyAdvance(id, { monto });
      if (res.status) {
        showToast("Saldo a favor aplicado correctamente", "success");
        setIsApplyAdvanceOpen(false);
        fetchPurchase();
      } else {
        showToast(res.message, "error");
      }
    } catch (e) {
      showToast("Error al aplicar saldo a favor", "error");
    } finally {
      setApplyingAdvance(false);
    }
  };

  const fetchPurchase = async () => {
    setLoading(true);
    try {
      const res = await purchaseService.getPurchaseById(id);
      if (res.status) {
        setPurchase(res.data);
        if (res.data.tipo_pago === "credito") fetchPagos();
      }
    } catch (e) {
      showToast("Error al cargar detalle", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchPagos = async () => {
    setLoadingPagos(true);
    try {
      const res = await purchasePaymentService.getPayments({ compra_id: id });
      if (res.status) setPagos(res.data.items || []);
    } catch (e) {
      console.error("Error cargando abonos:", e);
    } finally {
      setLoadingPagos(false);
    }
  };

  useEffect(() => {
    fetchPurchase();
  }, [id]);

  // Impresión nativa del navegador
  const handlePrint = () => {
    window.print();
  };

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <Loader2 className="animate-spin text-zinc-900" size={40} />
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
          Cargando documento...
        </p>
      </div>
    );

  if (!purchase)
    return (
      <div className="p-20 text-center uppercase font-black text-slate-400">
        Compra no encontrada
      </div>
    );

  const calculatedTotal =
    purchase.detalles?.reduce((acc, d) => acc + parseFloat(d.total || 0), 0) ||
    0;
  const totalIva =
    purchase.detalles?.reduce(
      (acc, d) => acc + parseFloat(d.iva_valor || 0) * parseFloat(d.cantidad),
      0,
    ) || 0;

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6 pb-20">
      {/* BOTONERA SUPERIOR */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <button
          onClick={() => navigate("/compras")}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold uppercase text-slate-700 hover:bg-slate-50 transition-all shadow-sm w-fit"
        >
          <ArrowLeft size={16} /> Regresar
        </button>

        <div className="flex items-center gap-2">
          {purchase.estado === "borrador" && (
            <>
              {hasPermission("editar_compras") && (
                <button
                  onClick={() => navigate(`/compras/editar/${id}`)}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl font-black text-[10px] uppercase hover:bg-slate-50 transition-all shadow-sm"
                >
                  <Edit3 size={14} /> Editar
                </button>
              )}
              {hasPermission("confirmar_compras") && (
                <button
                  onClick={handleInitiateConfirm}
                  disabled={confirming}
                  className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-xl font-black text-[10px] uppercase hover:bg-black shadow-md transition-all disabled:opacity-50"
                >
                  {confirming ? (
                    <Loader2 className="animate-spin" size={14} />
                  ) : (
                    <CheckCircle2 size={14} />
                  )}
                  Confirmar e Ingresar
                </button>
              )}
            </>
          )}
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-5 py-2 bg-zinc-900 text-white rounded-xl font-black text-[10px] uppercase hover:bg-zinc-800 transition-all shadow-md"
          >
            <Printer size={16} /> Imprimir Factura
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
              Compra #{purchase.id}{" "}
              {purchase.numero_documento
                ? `• Ref: ${purchase.numero_documento}`
                : ""}
            </p>
          </div>
          <div className="text-right">
            <span
              className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase border ${
                purchase.estado === "confirmada"
                  ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                  : "bg-slate-100 text-slate-500 border-slate-200"
              }`}
            >
              {purchase.estado}
            </span>
            <div className="mt-1">
              <span
                className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase border bg-slate-50 text-slate-600 border-slate-200`}
              >
                Pago: {purchase.tipo_pago}
              </span>
            </div>
          </div>
        </div>

        {/* DATOS GENERALES */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50/60 p-4 rounded-2xl border border-slate-100 text-xs">
          <div className="space-y-1.5">
            <div className="flex justify-between">
              <span className="font-bold text-slate-400 uppercase">
                Proveedor:
              </span>
              <span className="font-black text-slate-800 uppercase text-right">
                {purchase.proveedor?.nombre || "N/A"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-bold text-slate-400 uppercase">
                NIT Proveedor:
              </span>
              <span className="font-bold text-slate-700">
                {purchase.proveedor?.nit || "N/A"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-bold text-slate-400 uppercase">
                Bodega Destino:
              </span>
              <span className="font-bold text-slate-700 uppercase">
                {purchase.bodega?.nombre || "N/A"}
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between">
              <span className="font-bold text-slate-400 uppercase">
                Fecha Compra:
              </span>
              <span className="font-bold text-slate-700">
                {purchase.fecha_compra}
              </span>
            </div>
            {purchase.tipo_pago === "credito" && (
              <div className="flex justify-between">
                <span className="font-bold text-slate-400 uppercase">
                  Vencimiento:
                </span>
                <span className="font-bold text-orange-600">
                  {purchase.fecha_vencimiento}
                </span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="font-bold text-slate-400 uppercase">
                Doc. Soporte (DS):
              </span>
              {purchase.documento_soporte_electronico ? (
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase border ${
                    purchase.estado_documento_soporte === "emitido"
                      ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                      : purchase.estado_documento_soporte === "rechazado"
                      ? "bg-red-50 text-red-600 border-red-100"
                      : "bg-amber-50 text-amber-600 border-amber-100"
                  }`}
                >
                  DS {purchase.estado_documento_soporte || "pendiente"}
                </span>
              ) : (
                <span className="text-slate-400 font-bold uppercase text-[10px]">
                  No Requerido
                </span>
              )}
            </div>
          </div>
        </div>

        {/* TABLA DE DETALLE DE MERCANCÍA */}
        <div className="space-y-3">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Detalle de Mercancía
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="py-2.5 px-3 text-[10px] font-black text-slate-500 uppercase">
                    Producto
                  </th>
                  <th className="py-2.5 px-3 text-[10px] font-black text-slate-500 uppercase text-center">
                    Cant.
                  </th>
                  <th className="py-2.5 px-3 text-[10px] font-black text-slate-500 uppercase text-right">
                    Costo U.
                  </th>
                  <th className="py-2.5 px-3 text-[10px] font-black text-slate-500 uppercase text-right">
                    Iva Valor
                  </th>
                  <th className="py-2.5 px-3 text-[10px] font-black text-slate-500 uppercase text-right">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {purchase.detalles?.map((det) => (
                  <tr key={det.id}>
                    <td className="py-3 px-3">
                      <p className="text-xs font-black text-slate-800 uppercase">
                        {det.producto?.nombre}
                      </p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase">
                        Cod: {det.producto?.codigo}
                      </p>
                    </td>
                    <td className="py-3 px-3 text-center text-xs font-black text-slate-800">
                      {parseFloat(det.cantidad).toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-right text-xs font-bold text-slate-600">
                      $ {parseFloat(det.costo_unitario).toLocaleString("es-CO")}
                    </td>
                    <td className="py-3 px-3 text-right text-xs font-bold text-slate-600">
                      $ {parseFloat(det.iva_valor).toLocaleString("es-CO")}
                    </td>
                    <td className="py-3 px-3 text-right text-xs font-black text-zinc-900">
                      $ {parseFloat(det.total || 0).toLocaleString("es-CO")}
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
            <span>$ {totalIva.toLocaleString("es-CO")}</span>
          </div>
          <div className="flex justify-between w-64 text-sm font-black text-zinc-900 pt-2 border-t border-slate-100">
            <span>TOTAL FACTURA:</span>
            <span>$ {calculatedTotal.toLocaleString("es-CO")}</span>
          </div>
          {purchase.tipo_pago === "credito" && (
            <div className="flex justify-between w-64 text-xs font-bold text-orange-600 pt-1">
              <span>Saldo Pendiente:</span>
              <span>
                ${" "}
                {parseFloat(purchase.saldo_pendiente || 0).toLocaleString(
                  "es-CO",
                )}
              </span>
            </div>
          )}
        </div>

        {/* OBSERVACIONES */}
        {purchase.observacion && (
          <div className="pt-4 border-t border-slate-100 text-xs">
            <span className="font-black text-slate-400 uppercase tracking-widest block text-[10px] mb-1">
              Observaciones:
            </span>
            <p className="font-bold text-slate-700 uppercase">
              {purchase.observacion}
            </p>
          </div>
        )}

        {/* HISTORIAL DE ABONOS */}
        {purchase.tipo_pago === "credito" && pagos.length > 0 && (
          <div className="pt-6 border-t border-slate-200 space-y-3">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Historial de Abonos / Pagos
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-[10px] font-black text-slate-400 uppercase">
                    <th className="py-2 px-2">Fecha</th>
                    <th className="py-2 px-2">Método</th>
                    <th className="py-2 px-2 text-right">Monto</th>
                    <th className="py-2 px-2 text-center print:hidden">
                      Acción
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pagos.map((pago) => (
                    <tr key={pago.id}>
                      <td className="py-2.5 px-2 font-bold text-slate-700">
                        {pago.fecha_pago}
                      </td>
                      <td className="py-2.5 px-2 font-bold uppercase text-slate-600">
                        {pago.metodo_pago}
                      </td>
                      <td className="py-2.5 px-2 text-right font-black text-slate-900">
                        $ {parseFloat(pago.monto).toLocaleString("es-CO")}
                      </td>
                      <td className="py-2.5 px-2 text-center print:hidden">
                        <button
                          onClick={() => navigate(`/pagos-compra/${pago.id}`)}
                          className="p-1 text-slate-400 hover:text-blue-600"
                        >
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

        {/* COMPENSACIONES CON SALDO A FAVOR */}
        {purchase.aplicaciones_anticipo && purchase.aplicaciones_anticipo.length > 0 && (
          <div className="pt-6 border-t border-slate-200 space-y-3">
            <h3 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-1.5">
              <Sparkles size={14} /> Historial de Saldo a Favor Aplicado
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-[10px] font-black text-slate-400 uppercase">
                    <th className="py-2 px-2">Fecha</th>
                    <th className="py-2 px-2">Anticipo</th>
                    <th className="py-2 px-2 text-right">Monto Aplicado</th>
                    <th className="py-2 px-2 text-center">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {purchase.aplicaciones_anticipo.map((app) => (
                    <tr key={app.id}>
                      <td className="py-2.5 px-2 font-bold text-slate-700">
                        {app.created_at ? app.created_at.split(" ")[0] : "N/A"}
                      </td>
                      <td className="py-2.5 px-2 font-bold text-indigo-700 uppercase">
                        {app.anticipo_numero || `ANTICIPO #${app.anticipo_id}`}
                      </td>
                      <td className="py-2.5 px-2 text-right font-black text-indigo-900">
                        $ {parseFloat(app.monto_aplicado).toLocaleString("es-CO")}
                      </td>
                      <td className="py-2.5 px-2 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                            app.estado === "aplicada"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-rose-50 text-rose-700 border border-rose-200"
                          }`}
                        >
                          {app.estado}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* BOTÓN REGISTRAR ABONO Y APLICAR ANTICIPO */}
        {purchase.tipo_pago === "credito" &&
          purchase.estado === "confirmada" &&
          purchase.saldo_pendiente > 0 && (
            <div className="pt-4 flex flex-wrap gap-3 print:hidden">
              {hasPermission("registrar_pagos_compra") && (
                <button
                  onClick={() => setIsPaymentOpen(true)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl font-black text-xs uppercase hover:bg-emerald-700 transition-all shadow-md"
                >
                  <Plus size={16} /> Registrar Abono
                </button>
              )}
              {parseFloat(purchase.proveedor?.saldo_anticipo || 0) > 0 && (
                <button
                  onClick={() => setIsApplyAdvanceOpen(true)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase hover:bg-indigo-700 transition-all shadow-md"
                >
                  <Sparkles size={16} /> Aplicar Saldo a Favor ($ {parseFloat(purchase.proveedor.saldo_anticipo).toLocaleString("es-CO")} disp.)
                </button>
              )}
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
        purchase={purchase}
      />

      <ApplyAdvanceModal
        isOpen={isApplyAdvanceOpen}
        onClose={() => setIsApplyAdvanceOpen(false)}
        onConfirm={handleApplyAdvanceConfirm}
        loading={applyingAdvance}
        maxAplicable={Math.min(
          parseFloat(purchase?.proveedor?.saldo_anticipo || 0),
          parseFloat(purchase?.saldo_pendiente || 0)
        )}
        saldoDisponible={parseFloat(purchase?.proveedor?.saldo_anticipo || 0)}
      />
      <PaymentModal
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        purchase={purchase}
        onSave={fetchPurchase}
      />
    </div>
  );
};
