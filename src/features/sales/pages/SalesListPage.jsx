import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShoppingBag, Search, Plus, Loader2, 
  Calendar, Eye, Download, User, Fuel, Ban, X, AlertTriangle 
} from 'lucide-react';
import { salesService } from '../services/salesService';
import { useToast } from '../../../context/ToastContext';
import { getTodayStr } from '../../../shared/utils/dateUtils';

export const SalesListPage = () => {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState(getTodayStr());
  const [endDate, setEndDate] = useState(getTodayStr());

  // Estados para el Modal de Anulación
  const [saleToAnular, setSaleToAnular] = useState(null);
  const [motivoAnulacion, setMotivoAnulacion] = useState('');
  const [submittingAnular, setSubmittingAnular] = useState(false);

  const navigate = useNavigate();
  const { showToast } = useToast();

  const fetchSales = async () => {
    setLoading(true);
    try {
      const res = await salesService.getSales({
        fecha_desde: startDate,
        fecha_hasta: endDate
      });
      if (res.status) {
        setSales(res.data.items || []);
      } else {
        showToast("No se pudo obtener el listado de ventas", "error");
      }
    } catch (e) {
      showToast("Error al conectar con el servidor", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchSales(); 
  }, [startDate, endDate]);

  const filteredSales = sales.filter(sale => {
    const term = searchTerm.toLowerCase();
    const clienteNombre = sale.cliente ? `${sale.cliente.nombre} ${sale.cliente.apellidos || ''}`.toLowerCase() : '';
    const documentoFactura = `${sale.prefijo || ''}-${sale.numero_factura || ''}`.toLowerCase();
    const usuarioNombre = sale.usuario?.name?.toLowerCase() || '';

    return (
      documentoFactura.includes(term) ||
      clienteNombre.includes(term) ||
      usuarioNombre.includes(term) ||
      sale.tipo_venta?.toLowerCase().includes(term) ||
      sale.tipo_origen?.toLowerCase().includes(term) ||
      sale.estado_pago?.toLowerCase().includes(term)
    );
  });

  const handleExport = () => {
    if (filteredSales.length === 0) {
      showToast("No hay datos para exportar", "info");
      return;
    }

    const dataToExport = filteredSales.map(sale => ({
      'Factura': `${sale.prefijo || 'POS'}-${sale.numero_factura || 'S/N'}`,
      'Fecha Venta': sale.fecha_venta,
      'Cliente': sale.cliente ? `${sale.cliente.nombre} ${sale.cliente.apellidos || ''}`.trim() : 'Público General',
      'Documento Cliente': sale.cliente?.documento || 'N/A',
      'Atendido Por': sale.usuario?.name || 'N/A',
      'Tipo Venta': (sale.tipo_venta || '').toUpperCase(),
      'Origen': (sale.tipo_origen || '').toUpperCase(),
      'Estado': (sale.estado || '').toUpperCase(),
      'Estado Pago': (sale.estado_pago || '').toUpperCase(),
      'Subtotal': parseFloat(sale.subtotal || 0),
      'Descuento': parseFloat(sale.descuento || 0),
      'Total': parseFloat(sale.total || 0),
      'Total Pagado': parseFloat(sale.total_pagado || 0),
      'Saldo Pendiente': parseFloat(sale.saldo_pendiente || 0),
      'Observación': sale.observacion || ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Ventas");
    
    XLSX.writeFile(workbook, `Reporte_Ventas_${startDate}_al_${endDate}.xlsx`);
    showToast("Archivo Excel generado con éxito", "success");
  };

  const handleOpenAnularModal = (sale) => {
    setSaleToAnular(sale);
    setMotivoAnulacion('');
  };

  const handleCloseAnularModal = () => {
    setSaleToAnular(null);
    setMotivoAnulacion('');
  };

  const handleConfirmAnular = async (e) => {
    e.preventDefault();
    if (!motivoAnulacion.trim()) {
      showToast("El motivo de anulación es obligatorio", "error");
      return;
    }

    setSubmittingAnular(true);
    try {
      const res = await salesService.anularSale(saleToAnular.id, motivoAnulacion);
      if (res.status) {
        showToast(res.message || "Venta anulada correctamente", "success");
        fetchSales();
        handleCloseAnularModal();
      } else {
        showToast(res.message || "No se pudo anular la venta", "error");
      }
    } catch (error) {
      if (error.message.includes("permisos")) {
        showToast("No tienes permisos para anular ventas.", "error");
      } else {
        showToast("Error al procesar la anulación", "error");
      }
    } finally {
      setSubmittingAnular(false);
    }
  };

  const PaymentBadge = ({ status }) => {
    const styles = {
      pendiente: "bg-orange-50 text-orange-600 border-orange-100",
      pagado: "bg-blue-50 text-blue-600 border-blue-100"
    };
    return (
      <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase border ${styles[status] || styles.pendiente}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight uppercase">Ventas realizadas</h2>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Control y facturación POS / Combustible</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* BOTÓN EXPORTAR */}
          <button 
            onClick={handleExport}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-2xl font-bold text-[10px] md:text-xs uppercase hover:bg-emerald-700 transition-all shadow-md"
          >
            <Download size={16} /> <span className="hidden sm:inline">Exportar</span>
          </button>

          {/* FILTROS DE FECHA */}
          <div className="flex items-center gap-2 bg-white border border-slate-100 p-1 rounded-2xl shadow-sm">
            <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl border border-slate-100">
              <Calendar size={14} className="text-slate-400" />
              <input 
                type="date" 
                className="bg-transparent text-[10px] font-black uppercase outline-none text-slate-600"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <span className="text-slate-300 font-bold">-</span>
            <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl border border-slate-100">
              <Calendar size={14} className="text-slate-400" />
              <input 
                type="date" 
                className="bg-transparent text-[10px] font-black uppercase outline-none text-slate-600"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          {/* BUSCADOR */}
          <div className="relative group">
            <Search className="absolute left-4 top-3 text-slate-400 group-focus-within:text-zinc-900 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Buscar venta..." 
              className="w-full md:w-48 pl-12 pr-4 py-3 bg-white border border-slate-100 rounded-2xl text-xs outline-none focus:border-zinc-900 shadow-sm transition-all"
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </header>

      {/* TABLA DE VENTAS */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-50">
                <th className="px-5 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Factura</th>
                <th className="px-5 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Fecha</th>
                <th className="px-5 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Cliente</th>
                <th className="px-5 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Atendido Por</th>
                <th className="px-5 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Origen / Tipo</th>
                <th className="px-5 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Pago</th>
                <th className="px-5 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Total</th>
                <th className="px-5 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center w-36">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-20 text-center">
                    <Loader2 className="animate-spin mx-auto text-slate-200" size={32} />
                  </td>
                </tr>
              ) : filteredSales.length > 0 ? (
                filteredSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-50/30 transition-colors group">
                    <td className="px-5 py-4 font-black text-slate-700 text-xs uppercase">
                      {sale.prefijo}-{sale.numero_factura}
                    </td>
                    <td className="px-5 py-4 text-[10px] font-bold text-slate-400 uppercase whitespace-nowrap">
                      {new Date(sale.fecha_venta).toLocaleString()}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-col">
                        <span className="text-xs font-black text-slate-700 uppercase">
                          {sale.cliente ? `${sale.cliente.nombre} ${sale.cliente.apellidos || ''}` : 'Público General'}
                        </span>
                        {sale.cliente && (
                          <span className="text-[9px] font-bold text-slate-400">Doc: {sale.cliente.documento}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-xs font-bold text-slate-600">
                      {sale.usuario?.name || 'N/A'}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase text-blue-600">
                          {sale.tipo_origen}
                        </span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase">
                          {sale.tipo_venta}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <PaymentBadge status={sale.estado_pago} />
                    </td>
                    <td className="px-5 py-4 text-right">
                      <p className="text-sm font-black text-zinc-900 tracking-tighter">
                        $ {parseFloat(sale.total || 0).toLocaleString('es-CO')}
                      </p>
                      {parseFloat(sale.saldo_pendiente || 0) > 0 && (
                        <p className="text-[9px] font-bold text-red-500 uppercase">
                          Saldo: $ {parseFloat(sale.saldo_pendiente).toLocaleString('es-CO')}
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button 
                          onClick={() => navigate(`/ventas/${sale.id}`)}
                          className="p-2 text-slate-400 hover:text-zinc-900 hover:bg-slate-100 rounded-xl transition-all"
                          title="Ver detalle"
                        >
                          <Eye size={18} />
                        </button>

                        {sale.estado !== 'anulada' ? (
                          <button
                            onClick={() => handleOpenAnularModal(sale)}
                            className="px-2.5 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl text-[9px] font-black uppercase transition-all flex items-center gap-1"
                            title="Anular Venta"
                          >
                            <Ban size={14} /> Anular
                          </button>
                        ) : (
                          <span className="px-2 py-1 bg-zinc-100 text-zinc-500 rounded-xl text-[9px] font-black uppercase tracking-wider">
                            Anulada
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="py-20 text-center text-slate-400 text-xs font-bold uppercase italic">
                    No se encontraron ventas registradas
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DE CONFIRMACIÓN DE ANULACIÓN */}
      <AnimatePresence>
        {saleToAnular && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={handleCloseAnularModal} 
              className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm" 
            />
            
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden p-6 md:p-8 space-y-6 z-10"
            >
              <div className="flex justify-between items-center border-b pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center shadow-inner">
                    <AlertTriangle size={20} />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-800 text-sm uppercase">Anular venta</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Confirme la operación</p>
                  </div>
                </div>
                <button onClick={handleCloseAnularModal} className="p-2 text-slate-400 hover:bg-slate-50 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <p className="text-xs font-bold text-slate-600">
                  ¿Está seguro de que desea anular esta venta?
                </p>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-1.5 text-xs">
                  <p className="font-black text-slate-700 uppercase">
                    Venta: {saleToAnular.prefijo}-{saleToAnular.numero_factura}
                  </p>
                  <p className="font-bold text-slate-500">
                    Total: $ {parseFloat(saleToAnular.total || 0).toLocaleString('es-CO')}
                  </p>
                </div>

                <form onSubmit={handleConfirmAnular} id="form-anular" className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Motivo de anulación *</label>
                  <textarea 
                    required
                    rows="3"
                    placeholder="Escriba el motivo obligatorio..."
                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs outline-none focus:border-red-500 transition-all resize-none"
                    value={motivoAnulacion}
                    onChange={(e) => setMotivoAnulacion(e.target.value)}
                  />
                </form>

                <p className="text-[10px] font-bold text-red-500/80 italic">
                  * Esta operación afectará inventario, caja y cartera según corresponda.
                </p>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={handleCloseAnularModal}
                  className="flex-1 py-3.5 rounded-2xl bg-slate-100 text-slate-600 font-black text-[10px] uppercase hover:bg-slate-200 transition-all"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  form="form-anular"
                  disabled={submittingAnular || !motivoAnulacion.trim()}
                  className="flex-1 py-3.5 rounded-2xl bg-red-600 text-white font-black text-[10px] uppercase hover:bg-red-700 transition-all shadow-lg shadow-red-200 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submittingAnular ? <Loader2 className="animate-spin" size={16} /> : "Anular venta"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};