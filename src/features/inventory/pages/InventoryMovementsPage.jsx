import React, { useEffect, useState, useRef } from 'react';
import { 
  ArrowLeftRight, Loader2, 
  FileSpreadsheet, Layers3, Calendar, X, Eye, Printer
} from 'lucide-react';
import { inventoryService } from '../services/inventoryService';
import { ImportInventoryModal } from '../components/ImportInventoryModal';
import { TransferModal } from '../components/TransferModal'; 
import { TransferBulkModal } from '../components/TransferBulkModal'; 
import { useToast } from '../../../context/ToastContext';

export const InventoryMovementsPage = () => {
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);

  const getLocalDate = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [fechaDesde, setFechaDesde] = useState(getLocalDate());
  const [fechaHasta, setFechaHasta] = useState(getLocalDate());
  
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [isBulkTransferOpen, setIsBulkTransferOpen] = useState(false);
  
  // Estados para el Modal de Detalle del Lote
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedLote, setSelectedLote] = useState(null);
  const [loteDetails, setLoteDetails] = useState([]);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const printRef = useRef();
  const { showToast } = useToast();

  const fetchMovements = async () => {
    setLoading(true);
    try {
      const params = {};
      if (fechaDesde) params.fecha_desde = fechaDesde;
      if (fechaHasta) params.fecha_hasta = fechaHasta;

      const res = await inventoryService.getMovements(params);
      if (res.status) {
        const dataList = Array.isArray(res.data) ? res.data : (res.data?.items || []);
        setMovements(dataList);
      }
    } catch (e) { 
      showToast("Error al cargar historial", "error"); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { 
    fetchMovements(); 
  }, [fechaDesde, fechaHasta]); 

  const clearFilters = () => {
    setFechaDesde('');
    setFechaHasta('');
  };

  const handleOpenDetail = async (loteItem) => {
    if (!loteItem?.codigo_lote) return;
    setSelectedLote(loteItem);
    setIsDetailOpen(true);
    setLoadingDetail(true);
    try {
      const res = await inventoryService.getMovementDetail(loteItem.codigo_lote);
      if (res.status || res.data) {
        setLoteDetails(res.data || []);
      } else {
        setLoteDetails([]);
      }
    } catch (error) {
      showToast("Error al cargar el detalle del lote", "error");
      setLoteDetails([]);
    } finally {
      setLoadingDetail(false);
    }
  };

  // Función para imprimir compactando los espacios de la lista
  const handlePrint = () => {
    const printContent = printRef.current.innerHTML;
    const originalContent = document.body.innerHTML;

    const printStyles = `
      <style>
        @media print {
          body { background: white !important; color: black !important; font-size: 11px !important; }
          .max-h-\\[50vh\\] { max-height: none !important; overflow: visible !important; }
          table { width: 100% !important; border-collapse: collapse !important; }
          th, td { padding: 4px 6px !important; line-height: 1.1 !important; }
          tr { page-break-inside: avoid; }
          thead { display: table-header-group; }
          .grid { display: flex !important; justify-content: space-between !important; gap: 10px !important; }
          .grid > div { flex: 1 !important; }
        }
      </style>
    `;

    document.body.innerHTML = printStyles + printContent;
    window.print();
    document.body.innerHTML = originalContent;
    window.location.reload();
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      <header className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase flex items-center gap-2">
              Movimientos de Stock por Lotes
            </h2>
            <p className="text-slate-500 text-xs font-medium uppercase tracking-tighter">Control de traslados y entradas de inventario</p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button 
              onClick={() => setIsImportOpen(true)} 
              className="flex items-center justify-center gap-2 bg-emerald-50 text-emerald-700 px-6 py-3 rounded-2xl font-black text-[10px] uppercase hover:bg-emerald-100 transition-all border border-emerald-100 shadow-sm"
            >
              <FileSpreadsheet size={16} /> Importar Excel
            </button>
            
            <button 
              onClick={() => setIsBulkTransferOpen(true)} 
              className="flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase hover:bg-blue-700 transition-all shadow-xl shadow-blue-100"
            >
              <Layers3 size={16} /> Traslado Masivo
            </button>

            <button 
              onClick={() => setIsTransferOpen(true)} 
              className="flex items-center justify-center gap-2 bg-zinc-900 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase hover:bg-black transition-all shadow-xl shadow-zinc-200"
            >
              <ArrowLeftRight size={16} /> Nuevo Traslado
            </button>
          </div>
        </div>

        {/* Fila de Filtros */}
        <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm w-fit">
          <div className="flex items-center px-3 gap-2">
            <Calendar size={14} className="text-slate-400" />
            <input 
              type="date" 
              className="text-[10px] font-bold text-slate-600 bg-transparent outline-none uppercase"
              value={fechaDesde}
              onChange={(e) => setFechaDesde(e.target.value)}
            />
          </div>
          <div className="h-4 w-[1px] bg-slate-200" />
          <div className="flex items-center px-3 gap-2">
            <input 
              type="date" 
              className="text-[10px] font-bold text-slate-600 bg-transparent outline-none uppercase"
              value={fechaHasta}
              onChange={(e) => setFechaHasta(e.target.value)}
            />
          </div>
          {(fechaDesde || fechaHasta) && (
            <button onClick={clearFilters} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-red-500 transition-colors">
              <X size={14} />
            </button>
          )}
        </div>
      </header>

      {/* Tabla de Movimientos por Lotes */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/50">
              <tr>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Código Lote / Fecha</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tipo / Ruta</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Productos</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Usuario</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan="5" className="p-20 text-center">
                    <Loader2 className="animate-spin mx-auto text-slate-300" size={40} />
                  </td>
                </tr>
              ) : movements.length > 0 ? (
                movements.map((m) => (
                  <tr key={m.codigo_lote || m.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-slate-800 uppercase tracking-tight">{m.codigo_lote || 'N/A'}</span>
                        <span className="text-[9px] font-bold text-slate-400">{m.fecha_traslado || new Date(m.created_at).toLocaleString()}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border ${
                          m.tipo_movimiento === 'traslado' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                        }`}>
                          {m.tipo_movimiento || 'movimiento'}
                        </span>
                        <div className="flex items-center text-[9px] font-bold text-slate-400 uppercase">
                          {m.bodega_origen?.nombre || 'Proveedor'} 
                          <ArrowLeftRight size={10} className="mx-1 text-slate-300" />
                          {m.bodega_destino?.nombre || 'Destino'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-black text-zinc-900 tracking-tight">
                        {m.cantidad_productos ?? m.cantidad ?? 1} producto(s)
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-[9px] font-black text-slate-500 uppercase">
                          {m.usuario?.name ? m.usuario.name.substring(0, 2) : 'US'}
                        </div>
                        <span className="text-[10px] font-black text-slate-700 uppercase tracking-tight">{m.usuario?.name || 'Sistema'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => handleOpenDetail(m)}
                        className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl transition-all inline-flex items-center gap-1 text-[10px] font-black uppercase"
                        title="Ver detalle del lote"
                      >
                        <Eye size={16} className="text-indigo-600" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="p-10 text-center text-slate-400 italic text-xs uppercase font-black">
                    No hay movimientos registrados en el periodo seleccionado
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Detalle del Lote con Encabezado y Opción de Impresión */}
      {isDetailOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[2rem] shadow-2xl border border-slate-100 max-w-2xl w-full p-6 space-y-6 animate-in fade-in zoom-in duration-200">
            
            {/* Contenedor que se imprimirá */}
            <div ref={printRef} className="space-y-4 p-2">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Detalle del Lote</h3>
                  <p className="text-xs font-bold text-indigo-600">{selectedLote?.codigo_lote}</p>
                </div>
              </div>

              {/* Encabezado con Bodega Origen, Destino y Fecha */}
              <div className="grid grid-cols-3 gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-100 text-xs">
                <div>
                  <span className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">Bodega Origen</span>
                  <span className="font-bold text-slate-700 uppercase">{selectedLote?.bodega_origen?.nombre || 'Proveedor'}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">Bodega Destino</span>
                  <span className="font-bold text-slate-700 uppercase">{selectedLote?.bodega_destino?.nombre || 'Destino'}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">Fecha Traslado</span>
                  <span className="font-bold text-slate-700">{selectedLote?.fecha_traslado || 'N/A'}</span>
                </div>
              </div>

              {/* Tabla de Productos del Lote */}
              <div className="max-h-[50vh] overflow-y-auto pr-2">
                {loadingDetail ? (
                  <div className="py-12 flex justify-center">
                    <Loader2 className="animate-spin text-slate-300" size={32} />
                  </div>
                ) : loteDetails.length > 0 ? (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase">
                        <th className="py-2.5 px-2">Producto</th>
                        <th className="py-2.5 px-2">SKU / Código</th>
                        <th className="py-2.5 px-2 text-center">Cantidad</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {loteDetails.map((item, index) => (
                        <tr key={index} className="text-xs">
                          <td className="py-2 px-2 font-bold text-slate-700 uppercase">{item.nombre_producto || item.producto?.nombre}</td>
                          <td className="py-2 px-2 font-medium text-slate-400">{item.sku || item.producto?.codigo}</td>
                          <td className="py-2 px-2 text-center font-black text-slate-900">{parseFloat(item.cantidad).toLocaleString('es-CO')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="text-center py-8 text-xs text-slate-400 font-bold uppercase">No se encontraron productos en este lote</p>
                )}
              </div>
            </div>

            {/* Botones de Acción inferior (Imprimir y Cerrar) */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all border border-indigo-100"
              >
                <Printer size={16} /> Imprimir Lote
              </button>

              <button
                onClick={() => setIsDetailOpen(false)}
                className="bg-slate-900 hover:bg-black text-white px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all"
              >
                Cerrar
              </button>
            </div>

          </div>
        </div>
      )}

      <ImportInventoryModal isOpen={isImportOpen} onClose={() => setIsImportOpen(false)} onImportSuccess={fetchMovements} />
      <TransferModal isOpen={isTransferOpen} onClose={() => setIsTransferOpen(false)} onSave={fetchMovements} />
      <TransferBulkModal isOpen={isBulkTransferOpen} onClose={() => setIsBulkTransferOpen(false)} onSave={fetchMovements} />
    </div>
  );
};