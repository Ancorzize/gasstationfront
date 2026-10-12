import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Loader2,
  Printer,
  MoreVertical,
  FileText,
  PlusCircle,
  MinusCircle,
  AlertCircle,
} from "lucide-react";
import { salesService } from "../services/salesService";
import { useToast } from "../../../context/ToastContext";
import { NotaCreditoModal } from "../components/NotaCreditoModal";
import { NotaDebitoModal } from "../components/NotaDebitoModal";
import { DocumentosRelacionadosSection } from "../components/DocumentosRelacionadosSection";

export const SaleDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [sale, setSale] = useState(null);
  const [loading, setLoading] = useState(true);

  // Estados de Modales y Menú de Acciones
  const [isActionsMenuOpen, setIsActionsMenuOpen] = useState(false);
  const [isNotaCreditoModalOpen, setIsNotaCreditoModalOpen] = useState(false);
  const [isNotaDebitoModalOpen, setIsNotaDebitoModalOpen] = useState(false);

  const fetchSaleDetail = async () => {
    setLoading(true);
    try {
      const res = await salesService.getSaleById(id);
      if (res.status) {
        setSale(res.data);
      } else {
        showToast(
          res.message || "No se pudo cargar el detalle de la venta",
          "error",
        );
      }
    } catch (e) {
      showToast("Error al conectar con el servidor", "error");
    }
    fontally: {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchSaleDetail();
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  const handleOpenNotaCredito = () => {
    setIsActionsMenuOpen(false);
    if (sale?.factura_electronica === false && sale?.estado !== "confirmada") {
      showToast(
        "No se puede generar Nota Crédito: Esta venta no cuenta con una factura electrónica emitida.",
        "error",
      );
      return;
    }
    setIsNotaCreditoModalOpen(true);
  };

  const handleOpenNotaDebito = () => {
    setIsActionsMenuOpen(false);
    if (sale?.factura_electronica === false && sale?.estado !== "confirmada") {
      showToast(
        "No se puede generar Nota Débito: Esta venta no cuenta con una factura electrónica emitida.",
        "error",
      );
      return;
    }
    setIsNotaDebitoModalOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-zinc-900" size={40} />
      </div>
    );
  }

  if (!sale) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-slate-400 font-bold uppercase text-xs">
          Venta no encontrada
        </p>
        <button
          onClick={() => navigate("/ventas")}
          className="px-5 py-2.5 bg-zinc-900 text-white rounded-2xl text-xs font-black uppercase"
        >
          Volver al listado
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-4xl mx-auto">
      {/* Barra de Acciones Superior */}
      <div className="flex items-center justify-between print:hidden">
        <button
          onClick={() => navigate("/ventas")}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold uppercase transition-all shadow-sm"
        >
          <ArrowLeft size={16} /> Regresar
        </button>

        <div className="flex items-center gap-2 relative">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold uppercase transition-all shadow-sm"
          >
            <Printer size={16} /> Imprimir Factura
          </button>

          {/* Menú "Más acciones" */}
          <div className="relative">
            <button
              onClick={() => setIsActionsMenuOpen(!isActionsMenuOpen)}
              className="flex items-center gap-2 px-5 py-2 bg-zinc-900 text-white rounded-xl text-xs font-black uppercase hover:bg-zinc-800 transition-all shadow-md cursor-pointer"
            >
              Más acciones <MoreVertical size={16} />
            </button>

            {isActionsMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-1.5 text-[9px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-100">
                  Acciones Electrónicas DIAN
                </div>

                <button
                  onClick={handleOpenNotaCredito}
                  className="w-full text-left px-4 py-2.5 hover:bg-red-50 text-slate-700 hover:text-red-600 text-xs font-bold flex items-center gap-2.5 transition-colors"
                >
                  <MinusCircle size={16} className="text-red-500" /> Crear Nota
                  Crédito
                </button>

                <button
                  onClick={handleOpenNotaDebito}
                  className="w-full text-left px-4 py-2.5 hover:bg-blue-50 text-slate-700 hover:text-blue-600 text-xs font-bold flex items-center gap-2.5 transition-colors"
                >
                  <PlusCircle size={16} className="text-blue-500" /> Crear Nota
                  Débito
                </button>

                <div className="border-t border-slate-100 my-1"></div>

                <button
                  onClick={() => {
                    setIsActionsMenuOpen(false);
                    const docSec = document.getElementById(
                      "seccion-documentos-relacionados",
                    );
                    if (docSec) docSec.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="w-full text-left px-4 py-2 text-slate-600 hover:bg-slate-50 text-xs font-medium flex items-center gap-2 transition-colors"
                >
                  <FileText size={15} /> Ver documentos relacionados
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Documento Principal de Factura */}
      <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-200 shadow-sm space-y-6 print:border-none print:shadow-none print:p-0">
        <div className="flex justify-between items-start border-b border-slate-100 pb-5">
          <div>
            <h1 className="text-lg font-black text-slate-900 uppercase tracking-tight">
              Factura de Venta
            </h1>
            <p className="text-xs font-black text-blue-600 mt-0.5">
              {sale.prefijo}-{sale.numero_factura}
            </p>
          </div>
          <div className="text-right">
            <span
              className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase border ${
                sale.estado === "confirmada"
                  ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                  : "bg-slate-100 text-slate-500 border-slate-200"
              }`}
            >
              {sale.estado}
            </span>
            <div className="mt-1">
              <span
                className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase border ${
                  sale.estado_pago === "pagado"
                    ? "bg-blue-50 text-blue-600 border-blue-100"
                    : "bg-orange-50 text-orange-600 border-orange-100"
                }`}
              >
                Pago: {sale.estado_pago}
              </span>
            </div>
          </div>
        </div>

        {/* BLOQUE DE DATOS GENERALES */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50/60 p-4 rounded-2xl border border-slate-100 text-xs">
          <div className="space-y-1.5">
            <div className="flex justify-between">
              <span className="font-bold text-slate-400 uppercase">
                Cliente:
              </span>
              <span className="font-black text-slate-800 uppercase text-right">
                {sale.cliente
                  ? `${sale.cliente.nombre} ${sale.cliente.apellidos || ""}`
                  : "Público General"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-bold text-slate-400 uppercase">
                Documento:
              </span>
              <span className="font-bold text-slate-700">
                {sale.cliente?.documento || "N/A"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-bold text-slate-400 uppercase">
                Atendido por:
              </span>
              <span className="font-bold text-slate-700 uppercase">
                {sale.usuario?.name || "N/A"}
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between">
              <span className="font-bold text-slate-400 uppercase">Fecha:</span>
              <span className="font-bold text-slate-700">
                {new Date(sale.fecha_venta).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-bold text-slate-400 uppercase">
                Origen / Tipo:
              </span>
              <span className="font-bold text-slate-700 uppercase">
                {sale.tipo_origen} / {sale.tipo_venta}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-bold text-slate-400 uppercase">
                Estación / Turno:
              </span>
              <span className="font-bold text-slate-700 uppercase">
                {sale.turno_islero?.estacion?.nombre || "N/A"} (#
                {sale.turno_islero_id || "N/A"})
              </span>
            </div>
          </div>
        </div>

        {/* DETALLE DE PRODUCTOS */}
        <div className="space-y-3">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Detalle de Productos
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="py-2.5 px-3 text-[10px] font-black text-slate-500 uppercase">
                    Ítem
                  </th>
                  <th className="py-2.5 px-3 text-[10px] font-black text-slate-500 uppercase">
                    Ubicación
                  </th>
                  <th className="py-2.5 px-3 text-[10px] font-black text-slate-500 uppercase text-center">
                    Cant.
                  </th>
                  <th className="py-2.5 px-3 text-[10px] font-black text-slate-500 uppercase text-right">
                    P. Unit
                  </th>
                  <th className="py-2.5 px-3 text-[10px] font-black text-slate-500 uppercase text-right">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sale.detalles && sale.detalles.length > 0 ? (
                  sale.detalles.map((det) => (
                    <tr key={det.id}>
                      <td className="py-3 px-3">
                        <p className="text-xs font-black text-slate-800 uppercase">
                          {det.producto?.nombre}
                        </p>
                        <p className="text-[9px] font-bold text-slate-400">
                          Cod: {det.producto?.codigo}
                        </p>
                      </td>
                      <td className="py-3 px-3 text-xs font-bold text-slate-600 uppercase">
                        {det.manguera?.nombre || "N/A"}
                      </td>
                      <td className="py-3 px-3 text-center text-xs font-black text-slate-800">
                        {parseFloat(det.cantidad || 0).toLocaleString("es-CO")}{" "}
                        {det.producto?.unidad_medida || ""}
                      </td>
                      <td className="py-3 px-3 text-right text-xs font-bold text-slate-600">
                        ${" "}
                        {parseFloat(det.precio_unitario || 0).toLocaleString(
                          "es-CO",
                        )}
                      </td>
                      <td className="py-3 px-3 text-right text-xs font-black text-zinc-900">
                        $ {parseFloat(det.total || 0).toLocaleString("es-CO")}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="5"
                      className="py-6 text-center text-slate-400 text-xs italic"
                    >
                      Sin ítems
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* TOTALES */}
        <div className="flex flex-col items-end pt-4 border-t border-slate-200 space-y-1 text-right">
          <div className="flex justify-between w-56 text-xs font-bold text-slate-500">
            <span>Subtotal:</span>
            <span>
              $ {parseFloat(sale.subtotal || 0).toLocaleString("es-CO")}
            </span>
          </div>
          {parseFloat(sale.descuento || 0) > 0 && (
            <div className="flex justify-between w-56 text-xs font-bold text-slate-500">
              <span>Descuento:</span>
              <span>
                $ {parseFloat(sale.descuento || 0).toLocaleString("es-CO")}
              </span>
            </div>
          )}
          <div className="flex justify-between w-56 text-sm font-black text-zinc-900 pt-2 border-t border-slate-100">
            <span>TOTAL:</span>
            <span>$ {parseFloat(sale.total || 0).toLocaleString("es-CO")}</span>
          </div>
          {parseFloat(sale.saldo_pendiente || 0) > 0 && (
            <div className="flex justify-between w-56 text-xs font-bold text-red-500 pt-1">
              <span>Saldo Pendiente:</span>
              <span>
                ${" "}
                {parseFloat(sale.saldo_pendiente || 0).toLocaleString("es-CO")}
              </span>
            </div>
          )}
        </div>

        {sale.observacion && (
          <div className="pt-4 border-t border-slate-100 text-xs">
            <span className="font-black text-slate-400 uppercase tracking-widest block text-[10px] mb-1">
              Observaciones:
            </span>
            <p className="font-bold text-slate-700">{sale.observacion}</p>
          </div>
        )}

        {/* --- SECCIÓN CONDICIONAL: HISTORIAL DE PAGOS --- */}
        {sale.pagos && sale.pagos.length > 0 && (
          <div className="pt-4 border-t border-slate-200 space-y-3">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Historial de Pagos
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="py-2.5 px-3 text-[10px] font-black text-slate-500 uppercase">
                      Fecha
                    </th>
                    <th className="py-2.5 px-3 text-[10px] font-black text-slate-500 uppercase">
                      Método
                    </th>
                    <th className="py-2.5 px-3 text-[10px] font-black text-slate-500 uppercase">
                      Caja
                    </th>
                    <th className="py-2.5 px-3 text-[10px] font-black text-slate-500 uppercase">
                      Usuario
                    </th>
                    <th className="py-2.5 px-3 text-[10px] font-black text-slate-500 uppercase text-right">
                      Monto
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sale.pagos.map((pago) => (
                    <tr key={pago.id}>
                      <td className="py-3 px-3 text-slate-700">
                        {new Date(pago.fecha_pago).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-3 capitalize text-slate-700 font-bold">
                        {pago.metodo_pago}
                      </td>
                      <td className="py-3 px-3 text-slate-600 uppercase">
                        {pago.caja?.tipo_caja || "N/A"}
                      </td>
                      <td className="py-3 px-3 text-slate-600 uppercase">
                        {pago.usuario?.name}
                      </td>
                      <td className="py-3 px-3 text-right font-black text-zinc-900">
                        $ {parseFloat(pago.monto || 0).toLocaleString("es-CO")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* --- SECCIÓN CONDICIONAL: ABONOS DE CARTERA --- */}
        {sale.abonos_cartera && sale.abonos_cartera.length > 0 && (
          <div className="pt-4 border-t border-slate-200 space-y-3">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Abonos a Cartera
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="py-2.5 px-3 text-[10px] font-black text-slate-500 uppercase">
                      Fecha de Abono
                    </th>
                    <th className="py-2.5 px-3 text-[10px] font-black text-slate-500 uppercase">
                      Medio de Pago
                    </th>
                    <th className="py-2.5 px-3 text-[10px] font-black text-slate-500 uppercase">
                      Registrado por
                    </th>
                    <th className="py-2.5 px-3 text-[10px] font-black text-slate-500 uppercase text-right">
                      Valor Aplicado
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sale.abonos_cartera.map((abono) => (
                    <tr key={abono.id}>
                      <td className="py-3 px-3 text-slate-700">
                        {new Date(abono.fecha_abono).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-3 capitalize text-slate-700 font-bold">
                        {abono.medio_pago}
                      </td>
                      <td className="py-3 px-3 text-slate-600 uppercase">
                        {abono.usuario?.name}
                      </td>
                      <td className="py-3 px-3 text-right font-black text-emerald-600">
                        ${" "}
                        {parseFloat(abono.valor_aplicado || 0).toLocaleString(
                          "es-CO",
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* --- SECCIÓN DOCUMENTOS RELACIONADOS FISCALES --- */}
        <div id="seccion-documentos-relacionados">
          <DocumentosRelacionadosSection sale={sale} />
        </div>
      </div>

      {/* Modal de Nota Crédito */}
      {isNotaCreditoModalOpen && (
        <NotaCreditoModal
          sale={sale}
          onClose={() => setIsNotaCreditoModalOpen(false)}
          onSuccess={() => {
            fetchSaleDetail();
          }}
        />
      )}

      {/* Modal de Nota Débito */}
      {isNotaDebitoModalOpen && (
        <NotaDebitoModal
          sale={sale}
          onClose={() => setIsNotaDebitoModalOpen(false)}
          onSuccess={() => {
            fetchSaleDetail();
          }}
        />
      )}
    </div>
  );
};
