import React, { useEffect, useState } from 'react';
import { 
  FileText, CheckCircle2, Clock, AlertTriangle, ExternalLink, ShieldCheck, RefreshCw, Loader2
} from 'lucide-react';
import { documentosElectronicosService } from '../../settings/services/documentosElectronicosService';

export const DocumentosRelacionadosSection = ({ sale }) => {
  const [loading, setLoading] = useState(false);
  const [documentos, setDocumentos] = useState([]);

  const fetchDocumentosRelacionados = async () => {
    if (!sale?.id) return;
    setLoading(true);
    try {
      const res = await documentosElectronicosService.getDocumentos({
        venta_id: sale.id,
        per_page: 50
      });

      if (res && res.status && res.data && res.data.items) {
        const relacionados = res.data.items.filter(doc => doc.venta_id === sale.id);
        setDocumentos(relacionados);
      }
    } catch (e) {
      console.error("Error al obtener documentos relacionados:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocumentosRelacionados();
  }, [sale?.id]);

  const formatCurrency = (amount) => {
    return '$ ' + parseFloat(amount || 0).toLocaleString('es-CO');
  };

  const renderStateBadge = (estado) => {
    const est = (estado || '').toLowerCase();
    if (est === 'emitido' || est === 'aceptado') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-50 text-emerald-600 border border-emerald-200">
          <CheckCircle2 size={10} /> Emitido
        </span>
      );
    }
    if (est === 'pendiente') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase bg-amber-50 text-amber-600 border border-amber-200">
          <Clock size={10} /> Pendiente
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase bg-red-50 text-red-600 border border-red-200">
        <AlertTriangle size={10} /> {estado || 'Rechazado'}
      </span>
    );
  };

  const facturas = documentos.filter(d => d.tipo_documento === 'factura_electronica');
  const notasCredito = documentos.filter(d => d.tipo_documento === 'nota_credito');
  const notasDebito = documentos.filter(d => d.tipo_documento === 'nota_debito');

  // Cálculos informativos del valor ajustado
  const totalOriginal = parseFloat(sale?.total || 0);

  // Sumatoria de notas crédito emitidas
  const totalNotasCredito = notasCredito
    .filter(nc => nc.estado === 'emitido' || nc.estado === 'aceptado')
    .reduce((acc, nc) => acc + (parseFloat(nc.monto_total ?? nc.venta_total ?? totalOriginal)), 0);

  // Sumatoria de notas débito emitidas
  const totalNotasDebito = notasDebito
    .filter(nd => nd.estado === 'emitido' || nd.estado === 'aceptado')
    .reduce((acc, nd) => acc + (parseFloat(nd.monto_total ?? nd.venta_total ?? 0)), 0);

  const valorAjustado = totalOriginal - totalNotasCredito + totalNotasDebito;

  return (
    <div className="pt-6 border-t border-slate-200 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck size={18} className="text-blue-600" />
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
            Documentos Electrónicos Relacionados
          </h3>
        </div>

        <button 
          onClick={fetchDocumentosRelacionados} 
          disabled={loading}
          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all"
          title="Actualizar documentos"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {loading ? (
        <div className="p-6 text-center text-slate-400 text-xs">
          <Loader2 className="animate-spin mx-auto mb-2 text-blue-500" size={24} />
          Cargando documentos electrónicos...
        </div>
      ) : (
        <div className="space-y-4">
          
          {/* Tarjeta Informativa de Resumen de Ajuste Fiscal */}
          <div className="bg-slate-900 text-white p-4 md:p-5 rounded-2xl space-y-2 shadow-sm text-xs">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
              Resumen Informativo de Ajustes Fiscales
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1 border-t border-slate-800">
              <div>
                <span className="text-[9px] font-bold text-slate-400 uppercase block">Factura Original</span>
                <span className="font-black text-slate-200 block mt-0.5">{formatCurrency(totalOriginal)}</span>
              </div>
              <div>
                <span className="text-[9px] font-bold text-red-400 uppercase block">Notas Crédito</span>
                <span className="font-black text-red-400 block mt-0.5">
                  -{formatCurrency(totalNotasCredito)}
                </span>
              </div>
              <div>
                <span className="text-[9px] font-bold text-blue-400 uppercase block">Notas Débito</span>
                <span className="font-black text-blue-400 block mt-0.5">
                  +{formatCurrency(totalNotasDebito)}
                </span>
              </div>
              <div>
                <span className="text-[9px] font-bold text-emerald-400 uppercase block">Valor Ajustado</span>
                <span className="font-black text-emerald-400 block mt-0.5">{formatCurrency(valorAjustado)}</span>
              </div>
            </div>

            <p className="text-[9px] text-slate-400 italic pt-1">
              * Este cálculo es puramente informativo y no modifica el valor histórico de la factura original.
            </p>
          </div>

          {/* Lista de Documentos Relacionados */}
          <div className="space-y-2">
            
            {/* FACTURA ELECTRÓNICA PRINCIPAL */}
            {facturas.length > 0 ? (
              facturas.map((doc) => (
                <div key={doc.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                      <FileText size={16} />
                    </div>
                    <div>
                      <span className="font-black text-slate-800 uppercase block">
                        Factura Electrónica #{doc.prefijo ? `${doc.prefijo}-` : ''}{doc.numero_documento || 'S/N'}
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold block">
                        CUFE: {doc.cufe ? `${doc.cufe.substring(0, 20)}...` : 'No disponible'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 sm:justify-end">
                    <span className="font-black text-slate-800">{formatCurrency(sale.total)}</span>
                    {renderStateBadge(doc.estado)}
                  </div>
                </div>
              ))
            ) : sale.factura_electronica ? (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-xs">
                <span className="font-bold text-emerald-800 uppercase">Factura Electrónica Emitida</span>
                <span className="px-2 py-0.5 bg-emerald-600 text-white rounded-full text-[9px] font-black uppercase">Emitido</span>
              </div>
            ) : null}

            {/* NOTAS CRÉDITO */}
            {notasCredito.map((nc) => (
              <div key={nc.id} className="p-3.5 bg-red-50/50 border border-red-200/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0 font-black text-[10px]">
                    NC
                  </div>
                  <div>
                    <span className="font-black text-slate-800 uppercase block">
                      Nota Crédito #{nc.prefijo ? `${nc.prefijo}-` : ''}{nc.numero_documento || nc.id}
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium block">
                      CUDE: {nc.cufe ? `${nc.cufe.substring(0, 24)}...` : 'N/A'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 sm:justify-end">
                  <span className="font-black text-red-600">-{formatCurrency(nc.monto_total ?? nc.venta_total ?? sale.total)}</span>
                  {renderStateBadge(nc.estado)}
                </div>
              </div>
            ))}

            {/* NOTAS DÉBITO */}
            {notasDebito.map((nd) => (
              <div key={nd.id} className="p-3.5 bg-blue-50/50 border border-blue-200/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 font-black text-[10px]">
                    ND
                  </div>
                  <div>
                    <span className="font-black text-slate-800 uppercase block">
                      Nota Débito #{nd.prefijo ? `${nd.prefijo}-` : ''}{nd.numero_documento || nd.id}
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium block">
                      CUDE: {nd.cufe ? `${nd.cufe.substring(0, 24)}...` : 'N/A'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 sm:justify-end">
                  <span className="font-black text-blue-600">+{formatCurrency(nd.monto_total ?? nd.venta_total ?? 0)}</span>
                  {renderStateBadge(nd.estado)}
                </div>
              </div>
            ))}

            {documentos.length === 0 && (
              <p className="text-xs text-slate-400 italic text-center py-2">
                No se registran Notas Crédito o Débito asociadas a esta factura.
              </p>
            )}

          </div>
        </div>
      )}
    </div>
  );
};
