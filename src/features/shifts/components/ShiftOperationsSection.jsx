import React, { useState, useEffect } from "react";
import {
  Fuel,
  Droplets,
  CreditCard,
  Receipt,
  Loader2,
  Eye,
  Edit3,
  Ban,
  AlertCircle,
  X,
  Check,
  Search,
  Save,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Package,
  UserCheck,
  AlertTriangle,
} from "lucide-react";
import { shiftService } from "../services/shiftService";
import { salesService } from "../../sales/services/salesService";
import { portfolioService } from "../../portfolio/services/portfolioService";
import { productService } from "../../products/services/productService";
import { clientService } from "../../clients/services/clientService";
import { cashService } from "../../cash/services/cashService";
import { useToast } from "../../../context/ToastContext";
import { usePermissions } from "../../../hooks/usePermissions";

export const ShiftOperationsSection = ({
  turnoId,
  turnoEstado,
  onOperationsChanged,
}) => {
  const { showToast } = useToast();
  const { hasPermission } = usePermissions();

  const canSeeCombustible = hasPermission("vender_combustible");
  const canSeeLubricantes = hasPermission("vender_lubricantes");
  const canSeeCreditos = hasPermission("crear_ventas") || hasPermission("vender_combustible") || hasPermission("vender_lubricantes");
  const canSeeAbonos = hasPermission("registrar_abonos_cartera");

  const canEditAnularSale = hasPermission("vender_lubricantes") || hasPermission("anular_ventas");
  const canEditAnularAbono = hasPermission("registrar_abonos_cartera") || hasPermission("anular_abonos_cartera");

  const [loadingSummary, setLoadingSummary] = useState(false);
  const [loadingItems, setLoadingItems] = useState(false);

  const [summaryData, setSummaryData] = useState(null);
  const [activeType, setActiveType] = useState(() => {
    if (canSeeLubricantes) return "lubricantes";
    if (canSeeCombustible) return "combustible";
    if (canSeeCreditos) return "creditos";
    if (canSeeAbonos) return "abonos";
    return "lubricantes";
  }); // combustible | lubricantes | creditos | abonos

  useEffect(() => {
    if (activeType === "lubricantes" && !canSeeLubricantes) {
      if (canSeeCombustible) setActiveType("combustible");
      else if (canSeeCreditos) setActiveType("creditos");
      else if (canSeeAbonos) setActiveType("abonos");
    } else if (activeType === "combustible" && !canSeeCombustible) {
      if (canSeeLubricantes) setActiveType("lubricantes");
      else if (canSeeCreditos) setActiveType("creditos");
      else if (canSeeAbonos) setActiveType("abonos");
    } else if (activeType === "creditos" && !canSeeCreditos) {
      if (canSeeLubricantes) setActiveType("lubricantes");
      else if (canSeeCombustible) setActiveType("combustible");
      else if (canSeeAbonos) setActiveType("abonos");
    } else if (activeType === "abonos" && !canSeeAbonos) {
      if (canSeeLubricantes) setActiveType("lubricantes");
      else if (canSeeCombustible) setActiveType("combustible");
      else if (canSeeCreditos) setActiveType("creditos");
    }
  }, [canSeeCombustible, canSeeLubricantes, canSeeCreditos, canSeeAbonos]);
  const [items, setItems] = useState([]);

  // Modales
  const [editSaleModal, setEditSaleModal] = useState(null); // objeto venta a editar
  const [annulSaleModal, setAnnulSaleModal] = useState(null); // objeto venta a anular
  const [editAbonoModal, setEditAbonoModal] = useState(null); // objeto abono a editar
  const [annulAbonoModal, setAnnulAbonoModal] = useState(null); // objeto abono a anular

  // Formularios de modales
  const [motivoAnulacion, setMotivoAnulacion] = useState("");
  const [submittingAction, setSubmittingAction] = useState(false);

  // Formulario & Estados para Edición de Abono
  const [cajasModal, setCajasModal] = useState([]);
  const [loadingCajasModal, setLoadingCajasModal] = useState(false);
  const [valorDisplay, setValorDisplay] = useState("");
  const [abonoForm, setAbonoForm] = useState({
    valor: "",
    medio_pago: "efectivo",
    caja_id: "",
    observacion: "",
  });

  // Formulario Edición de Venta
  const [saleForm, setSaleForm] = useState({
    cliente_id: null,
    cliente_nombre: "",
    tipo_venta: "contado",
    observacion: "",
    detalles: [],
    pagos: [],
  });

  // Buscadores modal edición de venta
  const [productSearchTerm, setProductSearchTerm] = useState("");
  const [modalProducts, setModalProducts] = useState([]);
  const [loadingModalProducts, setLoadingModalProducts] = useState(false);

  const [clientSearchTerm, setClientSearchTerm] = useState("");
  const [modalClients, setModalClients] = useState([]);
  const [loadingModalClients, setLoadingModalClients] = useState(false);

  const fetchSummary = async () => {
    setLoadingSummary(true);
    try {
      const res = await shiftService.getShiftOperations(turnoId);
      if (res && res.status) {
        setSummaryData(res.data);
      } else {
        showToast(
          res?.message || "Error al obtener resumen de operaciones",
          "error",
        );
      }
    } catch (e) {
      showToast("Error de conexión al obtener operaciones del turno", "error");
    } finally {
      setLoadingSummary(false);
    }
  };

  const fetchItemsByType = async (tipo) => {
    setLoadingItems(true);
    try {
      const res = await shiftService.getShiftOperationsByType(turnoId, tipo);
      if (res && res.status) {
        setItems(res.data?.items || []);
      } else {
        showToast(
          res?.message || `Error al obtener operaciones de ${tipo}`,
          "error",
        );
        setItems([]);
      }
    } catch (e) {
      showToast(`Error de conexión al obtener lista de ${tipo}`, "error");
      setItems([]);
    } finally {
      setLoadingItems(false);
    }
  };

  useEffect(() => {
    if (turnoId) {
      fetchSummary();
      fetchItemsByType(activeType);
    }
  }, [turnoId]);

  useEffect(() => {
    if (turnoId && activeType) {
      fetchItemsByType(activeType);
    }
  }, [activeType]);

  const reloadData = () => {
    fetchSummary();
    fetchItemsByType(activeType);
    if (onOperationsChanged) {
      onOperationsChanged();
    }
  };

  const isReadOnly = turnoEstado === "cerrado";

  // --- Manejo de Anulación Venta ---
  const handleOpenAnnulSale = (venta) => {
    setAnnulSaleModal(venta);
    setMotivoAnulacion("");
  };

  const handleConfirmAnnulSale = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (e && e.stopPropagation) e.stopPropagation();
    if (!motivoAnulacion.trim()) {
      showToast("El motivo de anulación es obligatorio", "error");
      return;
    }
    setSubmittingAction(true);
    try {
      const res = await salesService.anularSale(
        annulSaleModal.id,
        motivoAnulacion,
      );
      if (res && res.status) {
        showToast(res.message || "Venta anulada correctamente", "success");
        setAnnulSaleModal(null);
        setMotivoAnulacion("");
        reloadData();
      } else {
        showToast(res?.message || "No se pudo anular la venta", "error");
      }
    } catch (e) {
      showToast(e?.message || "Error al anular la venta", "error");
    } finally {
      setSubmittingAction(false);
    }
  };

  // --- Manejo de Anulación Abono ---
  const handleOpenAnnulAbono = (abono) => {
    setAnnulAbonoModal(abono);
    setMotivoAnulacion("");
  };

  const handleConfirmAnnulAbono = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (e && e.stopPropagation) e.stopPropagation();
    if (!motivoAnulacion.trim()) {
      showToast("El motivo de anulación es obligatorio", "error");
      return;
    }
    setSubmittingAction(true);
    try {
      const res = await portfolioService.anularAbono(
        annulAbonoModal.id,
        motivoAnulacion,
      );
      if (res && res.status) {
        showToast(res.message || "Abono anulado correctamente", "success");
        setAnnulAbonoModal(null);
        setMotivoAnulacion("");
        reloadData();
      } else {
        showToast(res?.message || "No se pudo anular el abono", "error");
      }
    } catch (e) {
      showToast(e?.message || "Error al anular el abono", "error");
    } finally {
      setSubmittingAction(false);
    }
  };

  // --- Manejo de Edición Abono ---
  const parseAbonoValor = (val) => {
    if (val === "" || val === null || val === undefined) return "";
    if (typeof val === "number") return isNaN(val) ? "" : val;
    const str = String(val);
    if (str.includes(",")) {
      const clean = str.replace(/\./g, "").replace(",", ".");
      const num = parseFloat(clean);
      return isNaN(num) ? "" : num;
    } else {
      const num = parseFloat(str);
      return isNaN(num) ? "" : num;
    }
  };

  const formatAbonoValorDisplay = (value) => {
    if (value === "" || value === null || value === undefined) return "";
    const num = parseAbonoValor(value);
    if (num === "" || isNaN(num)) return "";
    return new Intl.NumberFormat("es-CO", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  };

  const loadCajasForAbonoModal = async (currentCajaObj, currentCajaId) => {
    setLoadingCajasModal(true);
    try {
      const res = await cashService.getCurrentCash();
      let openCajas = res && res.status && Array.isArray(res.data) ? res.data : [];

      if (currentCajaId && !openCajas.some((c) => String(c.id) === String(currentCajaId))) {
        if (currentCajaObj) {
          openCajas = [currentCajaObj, ...openCajas];
        }
      }
      setCajasModal(openCajas);
    } catch (e) {
      console.error("Error al cargar cajas para modal de abono", e);
    } finally {
      setLoadingCajasModal(false);
    }
  };

  const handleOpenEditAbono = (abono) => {
    setEditAbonoModal(abono);
    const initialValorRaw = abono.valor || abono.monto || "";
    const parsedValor = parseAbonoValor(initialValorRaw);
    const currentCajaId = abono.caja_id
      ? String(abono.caja_id)
      : abono.caja?.id
      ? String(abono.caja.id)
      : "";

    setAbonoForm({
      valor: parsedValor,
      medio_pago: abono.medio_pago || "efectivo",
      caja_id: currentCajaId,
      observacion: abono.observacion || "",
    });

    setValorDisplay(
      parsedValor !== "" ? formatAbonoValorDisplay(parsedValor) : ""
    );
    loadCajasForAbonoModal(abono.caja, currentCajaId);
  };

  const handleAbonoValorChange = (e) => {
    const rawValue = e.target.value;
    const filtered = rawValue.replace(/[^0-9,.-]/g, "").replace(/\./g, ",");
    const parts = filtered.split(",");
    const cleanValue =
      parts.length > 1 ? `${parts[0]},${parts.slice(1).join("")}` : parts[0];

    setValorDisplay(cleanValue);
    const numericVal = parseAbonoValor(cleanValue);
    setAbonoForm((prev) => ({ ...prev, valor: numericVal }));
  };

  const handleAbonoValorBlur = () => {
    if (abonoForm.valor !== "" && !isNaN(abonoForm.valor)) {
      setValorDisplay(formatAbonoValorDisplay(abonoForm.valor));
    }
  };

  const handleConfirmEditAbono = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (e && e.stopPropagation) e.stopPropagation();
    const val = parseFloat(abonoForm.valor);
    if (isNaN(val) || val <= 0) {
      showToast("El valor del abono debe ser mayor a cero", "error");
      return;
    }
    setSubmittingAction(true);
    try {
      const payload = {
        valor: val,
        medio_pago: abonoForm.medio_pago,
        observacion: abonoForm.observacion,
        caja_id: abonoForm.caja_id ? Number(abonoForm.caja_id) : null,
      };

      const res = await portfolioService.updateAbono(
        editAbonoModal.id,
        payload
      );
      if (res && res.status) {
        showToast(
          res.message || "Abono actualizado correctamente",
          "success"
        );
        setEditAbonoModal(null);
        reloadData();
      } else {
        showToast(res?.message || "No se pudo actualizar el abono", "error");
      }
    } catch (e) {
      showToast(e?.message || "Error al actualizar el abono", "error");
    } finally {
      setSubmittingAction(false);
    }
  };

  // --- Carga de Productos y Clientes para Modal ---
  const loadModalProducts = async (query = "", targetBodegaId = null) => {
    setLoadingModalProducts(true);
    try {
      const shiftBodegaId =
        targetBodegaId ||
        editSaleModal?.bodega_id ||
        summaryData?.turno?.bodega_id ||
        summaryData?.turno?.usuario?.bodega_id;

      const params = { per_page: 30 };
      if (shiftBodegaId) {
        params.bodega_id = shiftBodegaId;
      }
      if (query.trim()) params.search = query.trim();
      const res = await productService.getProducts(params);
      if (res && res.status && res.data?.items) {
        const filtered = res.data.items.filter(
          (p) => p.categoria_producto?.nombre !== "Combustible" && p.is_active !== false
        );
        setModalProducts(filtered);
      } else {
        setModalProducts([]);
      }
    } catch (e) {
      console.error("Error cargando productos para modal", e);
    } finally {
      setLoadingModalProducts(false);
    }
  };

  const loadModalClients = async (query = "") => {
    setLoadingModalClients(true);
    try {
      const res = await clientService.getClients({ search: query, per_page: 15 });
      if (res && res.status && res.data?.items) {
        setModalClients(res.data.items);
      } else if (Array.isArray(res?.data)) {
        setModalClients(res.data);
      } else {
        setModalClients([]);
      }
    } catch (e) {
      console.error("Error cargando clientes para modal", e);
    } finally {
      setLoadingModalClients(false);
    }
  };

  useEffect(() => {
    if (editSaleModal) {
      const timer = setTimeout(() => {
        loadModalProducts(productSearchTerm);
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [productSearchTerm, editSaleModal]);

  useEffect(() => {
    if (editSaleModal && clientSearchTerm) {
      const timer = setTimeout(() => {
        loadModalClients(clientSearchTerm);
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [clientSearchTerm, editSaleModal]);

  // --- Manejo de Edición Venta (Estilo Carrito) ---
  const handleOpenEditSale = (venta) => {
    setEditSaleModal(venta);
    setProductSearchTerm("");
    setClientSearchTerm("");
    setModalProducts([]);
    setModalClients([]);

    const detallesFormatted = (venta.detalles || venta.items || []).map(
      (d) => ({
        producto_id: d.producto_id || d.producto?.id,
        nombre: d.producto?.nombre || d.nombre_producto || d.nombre || "Producto",
        cantidad: parseFloat(d.cantidad || 1),
        precio_unitario: parseFloat(d.precio_unitario || d.precio || 0),
        total: parseFloat(d.total || d.subtotal || 0),
        stock_actual: d.producto?.stock_actual ?? d.producto?.stock ?? 0,
      })
    );

    const pagosFormatted = (venta.pagos || []).map((p) => ({
      metodo_pago: p.metodo_pago || "efectivo",
      monto: parseFloat(p.monto || 0),
      observacion: p.observacion || "",
    }));

    const initialTotal = detallesFormatted.reduce(
      (acc, item) => acc + (parseFloat(item.total) || 0),
      0
    );

    setSaleForm({
      cliente_id: venta.cliente_id || venta.cliente?.id || null,
      cliente_nombre: venta.cliente?.nombre || venta.cliente?.razon_social || "",
      tipo_venta: venta.tipo_venta || "contado",
      observacion: venta.observacion || "",
      detalles: detallesFormatted,
      pagos:
        pagosFormatted.length > 0
          ? pagosFormatted
          : [{ metodo_pago: "efectivo", monto: initialTotal, observacion: "" }],
    });

    const shiftBodegaId =
      venta.bodega_id ||
      summaryData?.turno?.bodega_id ||
      summaryData?.turno?.usuario?.bodega_id;

    loadModalProducts("", shiftBodegaId);
    if (venta.cliente_id) {
      loadModalClients("");
    }
  };

  const addProductToCart = (product) => {
    setSaleForm((prev) => {
      const existingIdx = prev.detalles.findIndex(
        (d) => Number(d.producto_id) === Number(product.id)
      );
      const unitPrice = parseFloat(product.precio_venta || product.precio || 0);

      if (existingIdx >= 0) {
        const newDetalles = [...prev.detalles];
        const newQty = (parseFloat(newDetalles[existingIdx].cantidad) || 0) + 1;
        newDetalles[existingIdx] = {
          ...newDetalles[existingIdx],
          cantidad: newQty,
          total: newQty * unitPrice,
        };
        return { ...prev, detalles: newDetalles };
      } else {
        const newDetail = {
          producto_id: product.id,
          nombre: product.nombre,
          cantidad: 1,
          precio_unitario: unitPrice,
          total: unitPrice,
          stock_actual: product.stock_actual ?? product.stock ?? 0,
        };
        return { ...prev, detalles: [...prev.detalles, newDetail] };
      }
    });
  };

  const updateCartQuantity = (index, deltaOrValue) => {
    setSaleForm((prev) => {
      const newDetalles = [...prev.detalles];
      let newQty;
      if (typeof deltaOrValue === "number") {
        newQty = (parseFloat(newDetalles[index].cantidad) || 0) + deltaOrValue;
      } else {
        newQty = parseFloat(deltaOrValue);
      }

      if (isNaN(newQty) || newQty <= 0) {
        newQty = 1;
      }

      const unitPrice = parseFloat(newDetalles[index].precio_unitario) || 0;
      newDetalles[index] = {
        ...newDetalles[index],
        cantidad: newQty,
        total: newQty * unitPrice,
      };
      return { ...prev, detalles: newDetalles };
    });
  };

  const removeCartItem = (index) => {
    setSaleForm((prev) => ({
      ...prev,
      detalles: prev.detalles.filter((_, i) => i !== index),
    }));
  };

  const handlePagoChange = (index, field, value) => {
    setSaleForm((prev) => {
      const newPagos = [...prev.pagos];
      newPagos[index] = { ...newPagos[index], [field]: value };
      return { ...prev, pagos: newPagos };
    });
  };

  const handleConfirmEditSale = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (e && e.stopPropagation) e.stopPropagation();

    if (!saleForm.detalles || saleForm.detalles.length === 0) {
      showToast("El carrito no puede estar vacío. Agregue al menos un producto.", "error");
      return;
    }

    for (const d of saleForm.detalles) {
      if (!d.cantidad || parseFloat(d.cantidad) <= 0) {
        showToast(`La cantidad para "${d.nombre}" debe ser mayor a cero`, "error");
        return;
      }
    }

    if (saleForm.tipo_venta === "credito" && !saleForm.cliente_id) {
      showToast("Debe seleccionar un cliente para ventas a crédito", "error");
      return;
    }

    const grandTotal = saleForm.detalles.reduce(
      (acc, item) => acc + (parseFloat(item.cantidad || 0) * parseFloat(item.precio_unitario || 0)),
      0
    );

    setSubmittingAction(true);
    try {
      const payload = {
        cliente_id: saleForm.cliente_id ? parseInt(saleForm.cliente_id) : null,
        tipo_venta: saleForm.tipo_venta,
        observacion: saleForm.observacion || "",
        detalles: saleForm.detalles.map((d) => ({
          producto_id: parseInt(d.producto_id),
          cantidad: parseFloat(d.cantidad),
          precio_unitario: parseFloat(d.precio_unitario),
          total: parseFloat(d.cantidad) * parseFloat(d.precio_unitario),
        })),
        pagos:
          saleForm.tipo_venta === "contado"
            ? (saleForm.pagos.length > 0
                ? saleForm.pagos.map((p, idx) => ({
                    metodo_pago: p.metodo_pago || "efectivo",
                    monto: idx === 0 ? grandTotal : parseFloat(p.monto || 0),
                    observacion: p.observacion || "",
                  }))
                : [{ metodo_pago: "efectivo", monto: grandTotal, observacion: "" }]
              )
            : [],
      };

      const res = await salesService.updateSale(editSaleModal.id, payload);
      if (res && res.status) {
        showToast(res.message || "Venta actualizada correctamente", "success");
        setEditSaleModal(null);
        reloadData();
      } else {
        showToast(res?.message || "No se pudo actualizar la venta", "error");
      }
    } catch (e) {
      showToast(e?.message || "Error al actualizar la venta", "error");
    } finally {
      setSubmittingAction(false);
    }
  };

  const resumen = summaryData?.resumen || {};

  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-100 p-6 md:p-8 shadow-sm space-y-6 text-left">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-base font-black text-slate-800 uppercase tracking-tight">
            Operaciones del Turno
          </h3>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Revisión, consulta y corrección administrativa de transacciones
          </p>
        </div>
        {isReadOnly && (
          <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-[9px] font-black uppercase border border-slate-200">
            Turno Cerrado (Solo Lectura)
          </span>
        )}
      </div>

      {/* Tarjetas de Resumen por Categoría */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Combustibles */}
        {canSeeCombustible && (
          <div
            onClick={() => setActiveType("combustible")}
            className={`p-4 rounded-2xl border cursor-pointer transition-all ${
              activeType === "combustible"
                ? "bg-blue-50 border-blue-400 ring-2 ring-blue-400/20"
                : "bg-slate-50 border-slate-100 hover:border-slate-300"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[9px] font-black uppercase tracking-wider text-blue-700 flex items-center gap-1">
                <Fuel size={14} /> Combustible
              </span>
              <span className="text-[9px] font-bold text-slate-400 bg-white px-2 py-0.5 rounded-full border">
                {resumen.combustible?.cantidad || 0}
              </span>
            </div>
            <p className="text-sm md:text-base font-black text-slate-800">
              $ {Number(resumen.combustible?.total || 0).toLocaleString("es-CO")}
            </p>
            <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">
              Solo consulta
            </p>
          </div>
        )}

        {/* Lubricantes */}
        {canSeeLubricantes && (
          <div
            onClick={() => setActiveType("lubricantes")}
            className={`p-4 rounded-2xl border cursor-pointer transition-all ${
              activeType === "lubricantes"
                ? "bg-zinc-900 text-white border-zinc-900 ring-2 ring-zinc-900/20"
                : "bg-slate-50 border-slate-100 hover:border-slate-300"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span
                className={`text-[9px] font-black uppercase tracking-wider flex items-center gap-1 ${activeType === "lubricantes" ? "text-zinc-300" : "text-slate-700"}`}
              >
                <Droplets size={14} /> Lubricantes (POS)
              </span>
              <span
                className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${activeType === "lubricantes" ? "bg-zinc-800 text-white border-zinc-700" : "bg-white text-slate-400"}`}
              >
                {resumen.lubricantes?.cantidad || 0}
              </span>
            </div>
            <p
              className={`text-sm md:text-base font-black ${activeType === "lubricantes" ? "text-white" : "text-slate-800"}`}
            >
              $ {Number(resumen.lubricantes?.total || 0).toLocaleString("es-CO")}
            </p>
            <p
              className={`text-[8px] font-bold uppercase mt-1 ${activeType === "lubricantes" ? "text-zinc-400" : "text-slate-400"}`}
            >
              Editables / Anulables
            </p>
          </div>
        )}

        {/* Créditos */}
        {canSeeCreditos && (
          <div
            onClick={() => setActiveType("creditos")}
            className={`p-4 rounded-2xl border cursor-pointer transition-all ${
              activeType === "creditos"
                ? "bg-rose-50 border-rose-400 ring-2 ring-rose-400/20"
                : "bg-slate-50 border-slate-100 hover:border-slate-300"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[9px] font-black uppercase tracking-wider text-rose-700 flex items-center gap-1">
                <CreditCard size={14} /> Créditos
              </span>
              <span className="text-[9px] font-bold text-slate-400 bg-white px-2 py-0.5 rounded-full border">
                {resumen.creditos?.cantidad || 0}
              </span>
            </div>
            <p className="text-sm md:text-base font-black text-slate-800">
              $ {Number(resumen.creditos?.total || 0).toLocaleString("es-CO")}
            </p>
            <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">
              Editables / Anulables
            </p>
          </div>
        )}

        {/* Abonos */}
        {canSeeAbonos && (
          <div
            onClick={() => setActiveType("abonos")}
            className={`p-4 rounded-2xl border cursor-pointer transition-all ${
              activeType === "abonos"
                ? "bg-emerald-50 border-emerald-400 ring-2 ring-emerald-400/20"
                : "bg-slate-50 border-slate-100 hover:border-slate-300"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[9px] font-black uppercase tracking-wider text-emerald-700 flex items-center gap-1">
                <Receipt size={14} /> Abonos Cartera
              </span>
              <span className="text-[9px] font-bold text-slate-400 bg-white px-2 py-0.5 rounded-full border">
                {resumen.abonos?.cantidad || 0}
              </span>
            </div>
            <p className="text-sm md:text-base font-black text-slate-800">
              $ {Number(resumen.abonos?.total || 0).toLocaleString("es-CO")}
            </p>
            <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">
              Editables / Anulables
            </p>
          </div>
        )}
      </div>

      {/* Listado de la categoría activa */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">
            Listado de {activeType} ({items.length})
          </h4>
        </div>

        {loadingItems ? (
          <div className="py-12 text-center text-slate-400">
            <Loader2
              className="animate-spin mx-auto text-zinc-900 mb-2"
              size={24}
            />
            <p className="text-[10px] font-bold uppercase tracking-widest">
              Cargando operaciones...
            </p>
          </div>
        ) : items.length === 0 ? (
          <div className="py-10 text-center text-slate-400 border border-dashed border-slate-200 rounded-2xl">
            <p className="text-[10px] font-bold uppercase italic">
              No se registraron operaciones de {activeType} en este turno.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto border border-slate-100 rounded-2xl">
            <table className="w-full text-left text-[10px] border-collapse">
              <thead className="bg-slate-50 text-slate-400 font-bold uppercase border-b border-slate-100">
                <tr>
                  <th className="p-3">Documento / ID</th>
                  <th className="p-3">Fecha</th>
                  <th className="p-3">Cliente / Atendido</th>
                  <th className="p-3">Detalle / Medios</th>
                  <th className="p-3 text-right">Monto Total</th>
                  <th className="p-3 text-center">Estado</th>
                  <th className="p-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-bold text-slate-700">
                {items.map((item) => {
                  const isAbono = activeType === "abonos";
                  const doc = isAbono
                    ? `ABO-#${item.id}`
                    : `${item.prefijo || ""}-${item.numero_factura || item.id}`;
                  const fecha = item.fecha_abono || item.fecha_venta;
                  const clienteNombre = item.cliente
                    ? `${item.cliente.nombre} ${item.cliente.apellidos || ""}`.trim()
                    : isAbono
                      ? "N/A"
                      : "Público General";
                  const usuarioNombre = item.usuario?.name || "N/A";
                  const total = parseFloat(
                    item.valor || item.monto || item.total || 0,
                  );
                  const estadoStr = item.estado || "normal";

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/70 transition-colors"
                    >
                      <td className="p-3 font-black text-slate-900 uppercase">
                        {doc}
                      </td>
                      <td className="p-3 text-slate-500 whitespace-nowrap">
                        {fecha ? new Date(fecha).toLocaleString() : "N/A"}
                      </td>
                      <td className="p-3">
                        <div className="flex flex-col">
                          <span className="font-black text-slate-800 uppercase">
                            {clienteNombre}
                          </span>
                          <span className="text-[8px] text-slate-400 font-normal">
                            Por: {usuarioNombre}
                          </span>
                        </div>
                      </td>
                      <td className="p-3">
                        {isAbono ? (
                          <div className="flex flex-col">
                            <span className="text-[9px] uppercase text-emerald-600 font-black">
                              Medio: {item.medio_pago}
                            </span>
                            {item.observacion && (
                              <span className="text-[8px] text-slate-400 italic">
                                {item.observacion}
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="flex flex-col max-w-[200px]">
                            <span className="text-[9px] text-slate-600 truncate">
                              {(item.detalles || item.items || [])
                                .map(
                                  (d) =>
                                    `${d.cantidad}x ${d.producto?.nombre || d.nombre_producto || "Producto"}`,
                                )
                                .join(", ") || "N/A"}
                            </span>
                            {item.placa && (
                              <span className="text-[8px] text-slate-400">
                                Placa: {item.placa}
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="p-3 text-right font-black text-slate-900 text-xs">
                        $ {total.toLocaleString("es-CO")}
                      </td>
                      <td className="p-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase ${
                            estadoStr === "anulado" || estadoStr === "anulada"
                              ? "bg-red-50 text-red-600 border border-red-200"
                              : "bg-emerald-50 text-emerald-600 border border-emerald-200"
                          }`}
                        >
                          {estadoStr}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        {activeType === "combustible" || isReadOnly || (isAbono && !canEditAnularAbono) || (!isAbono && !canEditAnularSale) ? (
                          <span className="text-[8px] font-bold text-slate-400 uppercase italic">
                            Solo Lectura
                          </span>
                        ) : (
                          <div className="flex items-center justify-center gap-1">
                            {estadoStr !== "anulado" &&
                            estadoStr !== "anulada" ? (
                              <>
                                <button
                                  onClick={() =>
                                    isAbono
                                      ? handleOpenEditAbono(item)
                                      : handleOpenEditSale(item)
                                  }
                                  className="p-1.5 bg-slate-100 hover:bg-zinc-900 hover:text-white rounded-lg transition-all text-slate-600"
                                  title="Editar Operación"
                                >
                                  <Edit3 size={13} />
                                </button>
                                <button
                                  onClick={() =>
                                    isAbono
                                      ? handleOpenAnnulAbono(item)
                                      : handleOpenAnnulSale(item)
                                  }
                                  className="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white rounded-lg transition-all"
                                  title="Anular Operación"
                                >
                                  <Ban size={13} />
                                </button>
                              </>
                            ) : (
                              <span className="text-[8px] font-bold text-slate-400 uppercase">
                                Sin acciones
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* --- MODAL ANULAR VENTA --- */}
      {annulSaleModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-6 space-y-4 text-left">
            <div className="flex justify-between items-center border-b pb-3">
              <h4 className="font-black text-slate-800 text-xs uppercase flex items-center gap-2">
                <AlertCircle className="text-rose-500" size={16} /> Anular Venta
                #{annulSaleModal.prefijo || ""}-
                {annulSaleModal.numero_factura || annulSaleModal.id}
              </h4>
              <button
                onClick={() => setAnnulSaleModal(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleConfirmAnnulSale} className="space-y-4">
              <div>
                <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">
                  Motivo de Anulación *
                </label>
                <textarea
                  required
                  rows="3"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-rose-500 transition-all resize-none text-slate-800"
                  placeholder="Ingrese el motivo de la anulación..."
                  value={motivoAnulacion}
                  onChange={(e) => setMotivoAnulacion(e.target.value)}
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAnnulSaleModal(null)}
                  className="flex-1 py-3 rounded-xl bg-slate-100 text-slate-600 font-black text-[10px] uppercase hover:bg-slate-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submittingAction || !motivoAnulacion.trim()}
                  className="flex-1 py-3 rounded-xl bg-rose-600 text-white font-black text-[10px] uppercase hover:bg-rose-700 disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {submittingAction ? (
                    <Loader2 className="animate-spin" size={14} />
                  ) : (
                    <Ban size={14} />
                  )}{" "}
                  Confirmar Anulación
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL ANULAR ABONO --- */}
      {annulAbonoModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-6 space-y-4 text-left">
            <div className="flex justify-between items-center border-b pb-3">
              <h4 className="font-black text-slate-800 text-xs uppercase flex items-center gap-2">
                <AlertCircle className="text-rose-500" size={16} /> Anular Abono
                ABO-#${annulAbonoModal.id}
              </h4>
              <button
                onClick={() => setAnnulAbonoModal(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleConfirmAnnulAbono} className="space-y-4">
              <div>
                <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">
                  Motivo de Anulación *
                </label>
                <textarea
                  required
                  rows="3"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-rose-500 transition-all resize-none text-slate-800"
                  placeholder="Ingrese el motivo obligatorio..."
                  value={motivoAnulacion}
                  onChange={(e) => setMotivoAnulacion(e.target.value)}
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAnnulAbonoModal(null)}
                  className="flex-1 py-3 rounded-xl bg-slate-100 text-slate-600 font-black text-[10px] uppercase hover:bg-slate-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submittingAction || !motivoAnulacion.trim()}
                  className="flex-1 py-3 rounded-xl bg-rose-600 text-white font-black text-[10px] uppercase hover:bg-rose-700 disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {submittingAction ? (
                    <Loader2 className="animate-spin" size={14} />
                  ) : (
                    <Ban size={14} />
                  )}{" "}
                  Confirmar Anulación
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL EDITAR ABONO --- */}
      {editAbonoModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-6 space-y-4 text-left">
            <div className="flex justify-between items-center border-b pb-3">
              <h4 className="font-black text-slate-800 text-xs uppercase flex items-center gap-2">
                <Edit3 className="text-emerald-600" size={16} /> Editar Abono
                ABO-#{editAbonoModal.id}
              </h4>
              <button
                type="button"
                onClick={() => setEditAbonoModal(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleConfirmEditAbono} className="space-y-4">
              {/* Selección de Caja / Destino */}
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase">
                  Caja / Destino de Recaudo
                </label>
                <select
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-zinc-900 uppercase"
                  value={abonoForm.caja_id}
                  onChange={(e) =>
                    setAbonoForm({ ...abonoForm, caja_id: e.target.value })
                  }
                >
                  <option value="">-- Sin caja asignada --</option>
                  {cajasModal.map((caja) => (
                    <option key={caja.id} value={caja.id}>
                      {caja.nombre} - {caja.tipo_caja}
                    </option>
                  ))}
                </select>
              </div>

              {/* Valor con formato monetario al blur */}
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase">
                  Valor ($) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="0,00"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-slate-800 text-right outline-none focus:border-zinc-900"
                  value={valorDisplay}
                  onChange={handleAbonoValorChange}
                  onBlur={handleAbonoValorBlur}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase">
                  Medio de Pago *
                </label>
                <select
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-zinc-900 uppercase"
                  value={abonoForm.medio_pago}
                  onChange={(e) =>
                    setAbonoForm({ ...abonoForm, medio_pago: e.target.value })
                  }
                >
                  <option value="efectivo">Efectivo</option>
                  <option value="qr">QR</option>
                  <option value="datafono">Datáfono</option>
                  <option value="transferencia">Transferencia</option>
                  <option value="consignacion">Consignación</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase">
                  Observación
                </label>
                <input
                  type="text"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-zinc-900"
                  value={abonoForm.observacion}
                  onChange={(e) =>
                    setAbonoForm({ ...abonoForm, observacion: e.target.value })
                  }
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditAbonoModal(null)}
                  className="flex-1 py-3 rounded-xl bg-slate-100 text-slate-600 font-black text-[10px] uppercase hover:bg-slate-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submittingAction || loadingCajasModal}
                  className="flex-1 py-3 rounded-xl bg-emerald-600 text-white font-black text-[10px] uppercase hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {submittingAction ? (
                    <Loader2 className="animate-spin" size={14} />
                  ) : (
                    <Save size={14} />
                  )}{" "}
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL EDITAR VENTA (TIPO CARRITO) --- */}
      {editSaleModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 md:p-6 bg-zinc-950/70 backdrop-blur-xs">
          <div className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl p-4 md:p-6 space-y-4 text-left max-h-[92vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 flex-shrink-0">
              <div>
                <h4 className="font-black text-slate-800 text-sm md:text-base uppercase flex items-center gap-2">
                  <Edit3 className="text-blue-600" size={18} /> Editar Venta POS #
                  {editSaleModal.prefijo || ""}-
                  {editSaleModal.numero_factura || editSaleModal.id}
                </h4>
                <p className="text-[10px] font-bold text-slate-400 uppercase">
                  Gestión de productos en carrito y medio de pago
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditSaleModal(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-full hover:bg-slate-100 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content: 2-Column Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 overflow-y-auto pr-1">
              {/* Columna Izquierda: Agregar Productos */}
              <div className="lg:col-span-5 bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3 flex flex-col">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-800 uppercase flex items-center gap-1.5">
                    <Package size={16} className="text-blue-600" /> Catálogo / Buscar
                    {(summaryData?.turno?.bodega?.nombre || summaryData?.turno?.usuario?.bodega?.nombre || editSaleModal?.bodega?.nombre) && (
                      <span className="text-[9px] font-black bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200">
                        {summaryData?.turno?.bodega?.nombre || summaryData?.turno?.usuario?.bodega?.nombre || editSaleModal?.bodega?.nombre}
                      </span>
                    )}
                  </span>
                  {loadingModalProducts && (
                    <Loader2 size={14} className="animate-spin text-slate-400" />
                  )}
                </div>

                <div className="relative">
                  <Search
                    size={16}
                    className="absolute left-3 top-3 text-slate-400"
                  />
                  <input
                    type="text"
                    placeholder="Buscar producto por nombre o código..."
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-zinc-900 shadow-xs uppercase"
                    value={productSearchTerm}
                    onChange={(e) => setProductSearchTerm(e.target.value)}
                  />
                </div>

                <div className="flex-1 overflow-y-auto max-h-[300px] space-y-2 pr-1 custom-scrollbar">
                  {modalProducts.length > 0 ? (
                    modalProducts.map((p) => {
                      const stockVal = Number(p.stock_actual ?? p.stock ?? 0);
                      const unitPrice = parseFloat(p.precio_venta || p.precio || 0);

                      return (
                        <div
                          key={p.id}
                          className="p-2.5 bg-white rounded-xl border border-slate-200 hover:border-blue-400 transition-all flex items-center justify-between gap-2 shadow-xs group"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-[11px] font-black text-slate-800 uppercase truncate">
                              {p.nombre}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] font-bold text-emerald-600">
                                ${unitPrice.toLocaleString("es-CO")}
                              </span>
                              <span
                                className={`text-[8px] font-black px-1.5 py-0.2 rounded ${
                                  stockVal > 0
                                    ? "bg-emerald-50 text-emerald-600"
                                    : "bg-red-50 text-red-500"
                                }`}
                              >
                                Stock: {stockVal}
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => addProductToCart(p)}
                            className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-lg transition-colors flex items-center gap-1 font-bold text-[10px]"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      );
                    })
                  ) : (
                    <div className="py-6 text-center text-slate-400 text-xs font-bold uppercase italic">
                      {loadingModalProducts
                        ? "Buscando productos..."
                        : "No se encontraron productos"}
                    </div>
                  )}
                </div>
              </div>

              {/* Columna Derecha: Carrito, Pagos & Totales */}
              <div className="lg:col-span-7 space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  {/* Carrito List */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-800 uppercase flex items-center gap-1.5">
                      <ShoppingCart size={16} className="text-amber-600" /> Carrito de Venta
                    </span>
                    <span className="text-[10px] font-black bg-amber-50 text-amber-700 px-2.5 py-0.5 rounded-full border border-amber-200">
                      {saleForm.detalles.length} productos
                    </span>
                  </div>

                  <div className="max-h-[260px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                    {saleForm.detalles.length > 0 ? (
                      saleForm.detalles.map((det, idx) => {
                        const lineTotal =
                          (parseFloat(det.cantidad) || 0) *
                          (parseFloat(det.precio_unitario) || 0);

                        return (
                          <div
                            key={idx}
                            className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between gap-3 shadow-xs"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-[11px] font-black text-slate-800 uppercase truncate">
                                {det.nombre}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[10px] text-slate-500 font-bold">
                                  P. Unitario (Informativo):{" "}
                                  <strong className="text-slate-700">
                                    ${parseFloat(det.precio_unitario).toLocaleString("es-CO")}
                                  </strong>
                                </span>
                              </div>
                            </div>

                            {/* Controles de Cantidad [-] qty [+] */}
                            <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-xs">
                              <button
                                type="button"
                                onClick={() => updateCartQuantity(idx, -1)}
                                className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-black"
                              >
                                <Minus size={12} />
                              </button>
                              <input
                                type="number"
                                step="any"
                                min="0.01"
                                className="w-14 text-center text-xs font-black text-slate-900 bg-transparent outline-none"
                                value={det.cantidad}
                                onChange={(e) => updateCartQuantity(idx, e.target.value)}
                              />
                              <button
                                type="button"
                                onClick={() => updateCartQuantity(idx, 1)}
                                className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-black"
                              >
                                <Plus size={12} />
                              </button>
                            </div>

                            {/* Subtotal de Línea */}
                            <div className="text-right min-w-[80px]">
                              <p className="text-[9px] text-slate-400 font-bold uppercase">Total</p>
                              <p className="text-xs font-black text-emerald-600">
                                ${lineTotal.toLocaleString("es-CO")}
                              </p>
                            </div>

                            {/* Eliminar ítem */}
                            <button
                              type="button"
                              onClick={() => removeCartItem(idx)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Eliminar de carrito"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        );
                      })
                    ) : (
                      <div className="py-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400 text-xs font-bold uppercase italic">
                        El carrito está vacío. Agregue productos desde la izquierda.
                      </div>
                    )}
                  </div>
                </div>

                {/* Configuración de Pago & Totales */}
                <div className="bg-slate-900 text-white p-4 rounded-2xl space-y-3 shadow-lg">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                    <span className="text-xs font-bold uppercase text-slate-400">Total Venta</span>
                    <span className="text-lg font-black text-emerald-400">
                      $
                      {saleForm.detalles
                        .reduce(
                          (acc, d) =>
                            acc +
                            (parseFloat(d.cantidad || 0) * parseFloat(d.precio_unitario || 0)),
                          0
                        )
                        .toLocaleString("es-CO")}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-800 text-left">
                    <div>
                      <label className="text-[9px] font-bold text-slate-300 uppercase block mb-1">
                        Tipo de Venta
                      </label>
                      <select
                        className="w-full p-2 bg-slate-800 text-white border border-slate-700 rounded-xl text-xs font-bold outline-none focus:border-emerald-500"
                        value={saleForm.tipo_venta}
                        onChange={(e) =>
                          setSaleForm({ ...saleForm, tipo_venta: e.target.value })
                        }
                      >
                        <option value="contado">Contado</option>
                        <option value="credito">Crédito</option>
                      </select>
                    </div>

                    {saleForm.tipo_venta === "contado" && (
                      <div>
                        <label className="text-[9px] font-bold text-slate-300 uppercase block mb-1">
                          Medio de Pago
                        </label>
                        <select
                          className="w-full p-2 bg-slate-800 text-white border border-slate-700 rounded-xl text-xs font-bold outline-none focus:border-emerald-500 uppercase"
                          value={
                            saleForm.pagos[0]?.metodo_pago || "efectivo"
                          }
                          onChange={(e) =>
                            handlePagoChange(0, "metodo_pago", e.target.value)
                          }
                        >
                          <option value="efectivo">Efectivo</option>
                          <option value="qr">QR</option>
                          <option value="datafono">Datáfono</option>
                          <option value="transferencia">Transferencia</option>
                          <option value="consignacion">Consignación</option>
                        </select>
                      </div>
                    )}
                  </div>

                  {/* Cliente y Observaciones */}
                  <div className="space-y-2 text-left">
                    {saleForm.tipo_venta === "credito" && (
                      <div>
                        <label className="text-[9px] font-bold text-slate-300 uppercase block mb-1">
                          Cliente (Requerido para Crédito)
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="Buscar o seleccionar cliente..."
                            className="w-full p-2 bg-slate-800 text-white border border-slate-700 rounded-xl text-xs font-bold outline-none focus:border-emerald-500 uppercase"
                            value={clientSearchTerm || saleForm.cliente_nombre}
                            onChange={(e) => {
                              setClientSearchTerm(e.target.value);
                              setSaleForm({ ...saleForm, cliente_nombre: e.target.value });
                            }}
                          />
                          {modalClients.length > 0 && clientSearchTerm && (
                            <div className="absolute left-0 right-0 top-full mt-1 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-50 max-h-36 overflow-y-auto">
                              {modalClients.map((c) => (
                                <button
                                  key={c.id}
                                  type="button"
                                  onClick={() => {
                                    setSaleForm({
                                      ...saleForm,
                                      cliente_id: c.id,
                                      cliente_nombre: c.nombre || c.razon_social,
                                    });
                                    setClientSearchTerm("");
                                    setModalClients([]);
                                  }}
                                  className="w-full p-2 text-left text-xs text-white hover:bg-slate-700 border-b border-slate-700 flex justify-between"
                                >
                                  <span>{c.nombre || c.razon_social}</span>
                                  <span className="text-[10px] text-slate-400">NIT/CC: {c.identificacion || c.documento}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                        {saleForm.cliente_id && (
                          <span className="text-[9px] text-emerald-400 font-bold mt-1 block">
                            Cliente seleccionado: {saleForm.cliente_nombre} (ID: {saleForm.cliente_id})
                          </span>
                        )}
                      </div>
                    )}

                    <div>
                      <label className="text-[9px] font-bold text-slate-300 uppercase block mb-1">
                        Observación
                      </label>
                      <input
                        type="text"
                        placeholder="Observación opcional..."
                        className="w-full p-2 bg-slate-800 text-white border border-slate-700 rounded-xl text-xs font-bold outline-none focus:border-emerald-500"
                        value={saleForm.observacion}
                        onChange={(e) =>
                          setSaleForm({ ...saleForm, observacion: e.target.value })
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-2 pt-2 border-t border-slate-100 flex-shrink-0">
              <button
                type="button"
                onClick={() => setEditSaleModal(null)}
                className="flex-1 py-3 rounded-xl bg-slate-100 text-slate-600 font-black text-[10px] uppercase hover:bg-slate-200"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmEditSale}
                disabled={submittingAction || saleForm.detalles.length === 0}
                className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-black text-[10px] uppercase hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {submittingAction ? (
                  <Loader2 className="animate-spin" size={14} />
                ) : (
                  <Save size={14} />
                )}{" "}
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
