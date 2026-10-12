import React, { useState, useEffect } from 'react';
import { 
  Search, Calendar, Filter, Loader2, Eye, X, 
  CheckCircle2, Clock, AlertTriangle, FileText, ChevronLeft, ChevronRight, Server, Hash, User,
  RotateCw
} from 'lucide-react';
import { documentosElectronicosService } from '../services/documentosElectronicosService';
import { useToast } from '../../../context/ToastContext';

const getTodayDateString = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const ElectronicInvoicesTab = () => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [documentos, setDocumentos] = useState([]);
  
  const [fechaInicial, setFechaInicial] = useState(getTodayDateString());
  const [fechaFinal, setFechaFinal] = useState(getTodayDateString());
  const [searchTerm, setSearchTerm] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('');

  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 15,
    total: 0
  });

  const [selectedDocument, setSelectedDocument] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Estados para Reintento Masivo
  const [bulkRetrying, setBulkRetrying] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [summaryData, setSummaryData] = useState(null);

  const fetchDocumentos = async (page = 1) => {
    if (!fechaInicial || !fechaFinal) {
      showToast("Las fechas inicial y final son obligatorias.", "error");
      return;
    }

    if (fechaInicial > fechaFinal) {
      showToast("La fecha inicial no puede ser posterior a la fecha final.", "error");
      return;
    }

    try {
      setLoading(true);
      const filters = {
        fecha_inicial: fechaInicial,
        fecha_final: fechaFinal,
        search: searchTerm.trim() || undefined,
        estado: estadoFilter || undefined,
        page,
        per_page: 15
      };

      const res = await documentosElectronicosService.getDocumentos(filters);
      if (res && res.status && res.data) {
        setDocumentos(res.data.items || []);
        if (res.data.pagination) {
          setPagination(res.data.pagination);
        }
      } else {
        showToast(res.message || "Error al obtener los documentos electrónicos.", "error");
      }
    } catch {
      showToast("Error de conexión al cargar documentos electrónicos.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocumentos(1);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchDocumentos(1);
  };

  const handleExecuteBulkRetry = async () => {
    try {
      setBulkRetrying(true);
      const res = await documentosElectronicosService.reintentarMasivoDS();

      if (res && res.status && res.data) {
        setSummaryData(res.data);
        setIsConfirmModalOpen(false);
        setIsSummaryModalOpen(true);
        showToast(res.message || "Proceso de reintento masivo finalizado.", "success");
        fetchDocumentos(pagination.current_page || 1);
      } else {
        showToast((res && res.message) || "Error al ejecutar el reintento masivo.", "error");
      }
    } catch (error) {
      showToast("Error de conexión al procesar el reintento masivo: " + (error.message || ""), "error");
    } finally {
      setBulkRetrying(false);
    }
  };

  const rechazadosCount = documentos.filter(
    (doc) => (doc.estado || '').toLowerCase() === 'rechazado'
  ).length;

  const renderStateBadge = (estado) => {
    const est = (estado || '').toLowerCase();
    if (est === 'emitido' || est === 'aceptado') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-50 text-emerald-600 border border-emerald-200">
          <CheckCircle2 size={12} /> Emitido
        </span>
      );
    }
    if (est === 'pendiente') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase bg-amber-50 text-amber-600 border border-amber-200">
          <Clock size={12} /> Pendiente
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase bg-red-50 text-red-600 border border-red-200">
        <AlertTriangle size={12} /> {estado || 'Error'}
      </span>
    );
  };

  const formatDate = (isoString) => {
    if (!isoString) return '-';
    try {
      const date = new Date(isoString);
      return date.toLocaleString('es-CO', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      
      {/* Banner Global de Reintento Masivo */}
      {(rechazadosCount > 0 || estadoFilter === 'rechazado') && (
        <div className="bg-red-50 border border-red-200 rounded-[2.5rem] p-6 md:p-8 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm animate-in fade-in duration-300">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center text-red-600 shrink-0 shadow-inner">
              <RotateCw size={24} className={bulkRetrying ? "animate-spin" : ""} />
            </div>
            <div>
              <h4 className="font-black text-slate-800 text-sm uppercase tracking-wider">
                {rechazadosCount > 0 
                  ? `Se detectaron ${rechazadosCount} documento(s) soporte en estado rechazado`
                  : 'Reintento masivo de Documentos Soporte rechazados'}
              </h4>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Permite retransmitir secuencialmente a MATIAS API todos los documentos soporte que fueron rechazados.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsConfirmModalOpen(true)}
            disabled={bulkRetrying || loading}
            className="bg-red-600 hover:bg-red-700 text-white px-8 py-3.5 rounded-2xl font-black text-xs uppercase transition-all flex items-center gap-2.5 shadow-md hover:shadow-lg disabled:opacity-50 shrink-0 cursor-pointer"
          >
            {bulkRetrying ? <Loader2 className="animate-spin" size={16} /> : <RotateCw size={16} />}
            {bulkRetrying ? 'Procesando Reintento...' : 'Reintentar documentos rechazados'}
          </button>
        </div>
      )}

      {/* Formulario de Filtros de Búsqueda */}
      <form onSubmit={handleSearchSubmit} className="bg-white border border-slate-100 rounded-[2.5rem] p-6 md:p-8 shadow-sm space-y-4">
        <div className="flex items-center justify-between gap-4 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <Filter className="text-yellow-600" size={20} />
            <h3 className="font-black text-slate-800 text-sm uppercase tracking-wider">Filtros de Trazabilidad</h3>
          </div>

          {/* Botón de Reintento Masivo también disponible en la barra superior cuando no hay banner */}
          {rechazadosCount === 0 && estadoFilter !== 'rechazado' && (
            <button
              type="button"
              onClick={() => setIsConfirmModalOpen(true)}
              disabled={bulkRetrying || loading}
              className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-4 py-2 rounded-2xl font-bold text-xs uppercase transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {bulkRetrying ? <Loader2 className="animate-spin" size={14} /> : <RotateCw size={14} />}
              Reintentar rechazados
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 flex items-center gap-1">
              <Calendar size={12} /> Fecha Inicial (Obligatoria)
            </label>
            <input
              type="date"
              required
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:border-zinc-900 transition-all"
              value={fechaInicial}
              onChange={(e) => setFechaInicial(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 flex items-center gap-1">
              <Calendar size={12} /> Fecha Final (Obligatoria)
            </label>
            <input
              type="date"
              required
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:border-zinc-900 transition-all"
              value={fechaFinal}
              onChange={(e) => setFechaFinal(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Estado</label>
            <select
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:border-zinc-900 transition-all uppercase"
              value={estadoFilter}
              onChange={(e) => setEstadoFilter(e.target.value)}
            >
              <option value="">Todos los Estados</option>
              <option value="emitido">Emitido / Aceptado</option>
              <option value="pendiente">Pendiente</option>
              <option value="rechazado">Rechazado</option>
              <option value="error">Error</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Búsqueda general</label>
            <div className="relative">
              <Search className="absolute left-3.5 top-3.5 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Número, prefijo, CUFE..."
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:border-zinc-900 transition-all uppercase"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={loading}
            className="bg-zinc-900 text-white px-8 py-3 rounded-2xl font-bold text-xs uppercase hover:bg-black transition-all flex items-center gap-2 shadow-md disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={16} /> : <Search size={16} />}
            Consultar Documentos
          </button>
        </div>
      </form>

      {/* Tabla de Documentos Electrónicos */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar-light">
          {loading ? (
            <div className="p-20 flex flex-col items-center justify-center text-slate-400 gap-3">
              <Loader2 className="animate-spin text-yellow-500" size={40} />
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Consultando documentos electrónicos...</p>
            </div>
          ) : documentos.length === 0 ? (
            <div className="p-16 flex flex-col items-center justify-center text-slate-400 gap-3 text-center">
              <FileText className="text-slate-300" size={48} />
              <h4 className="font-black text-sm uppercase text-slate-700">No se encontraron documentos electrónicos</h4>
              <p className="text-xs text-slate-400 font-medium">No existen documentos registrados en el rango de fechas seleccionado ({fechaInicial} al {fechaFinal}).</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="p-5 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Fecha y Hora</th>
                  <th className="p-5 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Documento</th>
                  <th className="p-5 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Cliente / Adquirente</th>
                  <th className="p-5 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Venta ERP</th>
                  <th className="p-5 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Estado</th>
                  <th className="p-5 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Proveedor / Amb.</th>
                  <th className="p-5 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {documentos.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50/30 transition-colors">
                    <td className="p-5">
                      <span className="text-xs font-bold text-slate-700 block">{formatDate(doc.created_at)}</span>
                    </td>
                    <td className="p-5">
                      <div className="flex flex-col">
                        <span className="text-xs font-black text-slate-800 uppercase">
                          {doc.prefijo ? `${doc.prefijo}-` : ''}{doc.numero_documento || 'S/N'}
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase">{doc.tipo_documento}</span>
                      </div>
                    </td>
                    <td className="p-5">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-800 uppercase">
                          {doc.cliente_nombre || 'Consumidor Final'}
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase">
                          {doc.cliente_documento || '222222222222'}
                        </span>
                      </div>
                    </td>
                    <td className="p-5">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-700">Venta #{doc.venta_id || '-'}</span>
                        <span className="text-[10px] font-black text-emerald-600">
                          {doc.venta_total ? `$ ${Number(doc.venta_total).toLocaleString()}` : '-'}
                        </span>
                      </div>
                    </td>
                    <td className="p-5 text-center">
                      {renderStateBadge(doc.estado)}
                    </td>
                    <td className="p-5">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-800 uppercase">{doc.proveedor || 'MATIAS'}</span>
                        <span className="text-[9px] font-black text-slate-400 uppercase">{doc.ambiente || 'sandbox'}</span>
                      </div>
                    </td>
                    <td className="p-5 text-center">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedDocument(doc);
                          setIsDetailModalOpen(true);
                        }}
                        className="p-2.5 text-slate-500 hover:text-zinc-900 hover:bg-slate-100 rounded-xl transition-all"
                        title="Ver Detalle Técnico"
                      >
                        <Eye size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Paginación */}
        {pagination.total > 0 && (
          <div className="p-5 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-xs font-bold text-slate-500 uppercase">
              Mostrando {documentos.length} de {pagination.total} registros | Página {pagination.current_page} de {pagination.last_page}
            </span>
            
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={pagination.current_page <= 1 || loading}
                onClick={() => fetchDocumentos(pagination.current_page - 1)}
                className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-30 transition-all"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                disabled={pagination.current_page >= pagination.last_page || loading}
                onClick={() => fetchDocumentos(pagination.current_page + 1)}
                className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-30 transition-all"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Detalle Técnico del Documento (Solo Consulta) */}
      {isDetailModalOpen && selectedDocument && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative bg-white w-full max-w-3xl max-h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden">
            
            {/* Header del Modal */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-yellow-500/10 flex items-center justify-center text-yellow-600">
                  <FileText size={20} />
                </div>
                <div>
                  <h3 className="font-black text-slate-800 text-sm uppercase tracking-wider">
                    Detalle de Documento Electrónico #{selectedDocument.id}
                  </h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">
                    Prefijo: {selectedDocument.prefijo || '-'} | Folio: {selectedDocument.numero_documento || '-'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsDetailModalOpen(false)}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400"
              >
                <X size={20} />
              </button>
            </div>

            {/* Contenido del Modal con Scroll */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar-light text-left">
              
              {/* Sección 1: Información General y Estado */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-5 bg-slate-50 rounded-2xl border border-slate-100">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Estado</span>
                  <div className="mt-1">{renderStateBadge(selectedDocument.estado)}</div>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Proveedor / Ambiente</span>
                  <span className="text-xs font-black text-slate-800 uppercase block mt-1">
                    {selectedDocument.proveedor} ({selectedDocument.ambiente})
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Fecha de Registro</span>
                  <span className="text-xs font-bold text-slate-800 block mt-1">
                    {formatDate(selectedDocument.created_at)}
                  </span>
                </div>
              </div>

              {/* Sección 2: Identificadores DIAN / MATIAS */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-slate-500 border-b border-slate-100 pb-1">
                  <Hash size={16} />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-700">Identificadores Técnicos</span>
                </div>

                <div className="space-y-2">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">UUID MATIAS / Identificador Externo</span>
                    <span className="text-xs font-mono font-bold bg-slate-100 p-2.5 rounded-xl block break-all text-slate-800">
                      {selectedDocument.identificador_externo || 'No generado'}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">CUFE / CUDE</span>
                    <span className="text-xs font-mono font-bold bg-slate-100 p-2.5 rounded-xl block break-all text-slate-800">
                      {selectedDocument.cufe || 'No disponible'}
                    </span>
                  </div>

                  {selectedDocument.track_id && (
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Track ID</span>
                      <span className="text-xs font-mono font-bold bg-slate-100 p-2.5 rounded-xl block break-all text-slate-800">
                        {selectedDocument.track_id}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Sección 3: Venta y Cliente Asoc. */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-slate-500 border-b border-slate-100 pb-1">
                  <User size={16} />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-700">Venta y Cliente</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Venta ERP ID</span>
                    <span className="text-xs font-bold text-slate-800 block mt-0.5">#{selectedDocument.venta_id || '-'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Cliente</span>
                    <span className="text-xs font-bold text-slate-800 block mt-0.5">{selectedDocument.cliente_nombre || 'Consumidor Final'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Documento Cliente</span>
                    <span className="text-xs font-bold text-slate-800 block mt-0.5">{selectedDocument.cliente_documento || '222222222222'}</span>
                  </div>
                </div>
              </div>

              {/* Sección 4: Mensaje y Errores */}
              {(selectedDocument.mensaje || selectedDocument.errores) && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-slate-500 border-b border-slate-100 pb-1">
                    <Server size={16} />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-700">Mensajes de Respuesta / Errores</span>
                  </div>

                  {selectedDocument.mensaje && (
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Mensaje</span>
                      <p className="text-xs font-bold text-slate-700 mt-1">{selectedDocument.mensaje}</p>
                    </div>
                  )}

                  {selectedDocument.errores && Object.keys(selectedDocument.errores).length > 0 && (
                    <div className="p-4 bg-red-50 rounded-2xl border border-red-200 text-red-700 space-y-1">
                      <span className="text-[10px] font-black uppercase block text-red-800">Detalle de Errores</span>
                      <pre className="text-[11px] font-mono whitespace-pre-wrap overflow-x-auto">
                        {JSON.stringify(selectedDocument.errores, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}

              {/* Sección 5: JSON Datos Técnicos */}
              {selectedDocument.datos_tecnicos && Object.keys(selectedDocument.datos_tecnicos).length > 0 && (
                <div className="space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 block">Respuesta Técnica Completa (datos_tecnicos)</span>
                  <div className="bg-zinc-900 text-zinc-100 p-4 rounded-2xl overflow-x-auto max-h-60 custom-scrollbar">
                    <pre className="text-[11px] font-mono leading-relaxed">
                      {JSON.stringify(selectedDocument.datos_tecnicos, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

            </div>

            {/* Footer del Modal */}
            <div className="p-4 border-t border-slate-100 flex justify-end bg-slate-50/50">
              <button
                type="button"
                onClick={() => setIsDetailModalOpen(false)}
                className="px-6 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs uppercase rounded-xl transition-all"
              >
                Cerrar Detalle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmación de Reintento Masivo */}
      {isConfirmModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-slate-100 p-6 text-center space-y-5">
            <div className="mx-auto w-14 h-14 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center">
              <RotateCw size={28} className={bulkRetrying ? "animate-spin" : ""} />
            </div>
            
            <div>
              <h3 className="text-base font-black text-slate-800 uppercase tracking-tight">
                ¿Desea reintentar el envío de todos los documentos soporte rechazados?
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-2 leading-relaxed">
                Esta acción procesará secuencialmente cada documento soporte en estado rechazado para reconstruir su información actual y retransmitirlo a MATIAS API.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                disabled={bulkRetrying}
                onClick={() => setIsConfirmModalOpen(false)}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase rounded-2xl transition-all"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={bulkRetrying}
                onClick={handleExecuteBulkRetry}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-200 disabled:opacity-50 cursor-pointer"
              >
                {bulkRetrying ? <Loader2 className="animate-spin" size={16} /> : <RotateCw size={16} />}
                {bulkRetrying ? 'Enviando...' : 'Sí, Reintentar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Resumen General del Reintento Masivo */}
      {isSummaryModalOpen && summaryData && (
        <div className="fixed inset-0 z-[115] flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative bg-white w-full max-w-2xl max-h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden">
            
            {/* Header del Modal */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-zinc-900 text-white flex items-center justify-center">
                  <RotateCw size={20} />
                </div>
                <div>
                  <h3 className="font-black text-slate-800 text-sm uppercase tracking-wider">
                    Resumen de Reintento Masivo
                  </h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">
                    Resultados de procesamiento de Documentos Soporte
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSummaryModalOpen(false)}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400"
              >
                <X size={20} />
              </button>
            </div>

            {/* Contenido del Modal */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar-light text-left">
              
              {/* Alerta si hay rechazados residuales */}
              {summaryData.rechazados > 0 && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-3 text-amber-800">
                  <AlertTriangle size={20} className="text-amber-600 shrink-0" />
                  <p className="text-xs font-bold">
                    Atención: {summaryData.rechazados} documento(s) continúan en estado rechazado tras el proceso.
                  </p>
                </div>
              )}

              {/* Tarjetas de Métricas Resumen */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl text-center">
                  <span className="text-[9px] font-black text-slate-400 uppercase block">Encontrados</span>
                  <span className="text-base font-black text-slate-800 block mt-0.5">{summaryData.total_encontrados ?? 0}</span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl text-center">
                  <span className="text-[9px] font-black text-slate-400 uppercase block">Procesados</span>
                  <span className="text-base font-black text-slate-800 block mt-0.5">{summaryData.procesados ?? 0}</span>
                </div>
                <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-2xl text-center">
                  <span className="text-[9px] font-black text-emerald-600 uppercase block">Emitidos</span>
                  <span className="text-base font-black text-emerald-700 block mt-0.5">{summaryData.emitidos ?? 0}</span>
                </div>
                <div className="p-3 bg-red-50 border border-red-100 rounded-2xl text-center">
                  <span className="text-[9px] font-black text-red-600 uppercase block">Rechazados</span>
                  <span className="text-base font-black text-red-700 block mt-0.5">{summaryData.rechazados ?? 0}</span>
                </div>
                <div className="p-3 bg-amber-50 border border-amber-100 rounded-2xl text-center col-span-2 sm:col-span-1">
                  <span className="text-[9px] font-black text-amber-600 uppercase block">Pendientes</span>
                  <span className="text-base font-black text-amber-700 block mt-0.5">{summaryData.pendientes ?? 0}</span>
                </div>
              </div>

              {/* Detalles por Documento */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400">Detalle Individual de Documentos</h4>
                {(!summaryData.detalles || summaryData.detalles.length === 0) ? (
                  <p className="text-xs text-slate-400 font-medium italic">No hubo documentos rechazados para procesar.</p>
                ) : (
                  <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden bg-white">
                    {summaryData.detalles.map((det, idx) => (
                      <div key={idx} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 transition-colors">
                        <div className="flex items-center gap-3">
                          {det.exitoso ? (
                            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                              <CheckCircle2 size={16} />
                            </div>
                          ) : (
                            <div className="w-8 h-8 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                              <AlertTriangle size={16} />
                            </div>
                          )}
                          <div>
                            <span className="text-xs font-black text-slate-800 uppercase block">
                              Documento Electrónico #{det.documento_electronico_id}
                            </span>
                            <span className="text-[10px] text-slate-400 font-bold block">
                              {det.estado_anterior} &rarr; <strong className="uppercase">{det.estado_final}</strong>
                            </span>
                          </div>
                        </div>

                        <div className="text-left sm:text-right">
                          <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border inline-block ${
                            det.exitoso 
                              ? 'bg-emerald-50 text-emerald-600 border-emerald-200' 
                              : 'bg-red-50 text-red-600 border-red-200'
                          }`}>
                            {det.exitoso ? 'Emitido' : 'No Emitido'}
                          </span>
                          {det.mensaje && (
                            <p className="text-[11px] text-slate-500 mt-1 font-medium max-w-sm truncate">
                              {det.mensaje}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

            {/* Footer del Modal */}
            <div className="p-4 border-t border-slate-100 flex justify-end bg-slate-50/50">
              <button
                type="button"
                onClick={() => setIsSummaryModalOpen(false)}
                className="px-6 py-2.5 bg-zinc-900 hover:bg-black text-white font-bold text-xs uppercase rounded-xl transition-all shadow-md"
              >
                Cerrar Resumen
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
