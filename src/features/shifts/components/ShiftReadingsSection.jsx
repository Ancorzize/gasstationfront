import React, { useEffect, useState } from 'react';
import { Loader2, Fuel, ShieldAlert, Printer, Calendar, User, MapPin, Banknote, ArrowLeft } from 'lucide-react';
import { shiftService } from '../services/shiftService';
import { useToast } from '../../../context/ToastContext';

export const ShiftReadingsSection = ({ turnoId, onBack }) => {
  const [loading, setLoading] = useState(false);
  const [turnoDetalle, setTurnoDetalle] = useState(null);
  const { showToast } = useToast();

  useEffect(() => {
    if (turnoId) {
      const fetchDetalleTurno = async () => {
        setLoading(true);
        try {
          const res = await shiftService.getShiftDetail(turnoId);
          if (res.status) {
            setTurnoDetalle(res.data);
          } else {
            showToast("No se pudo cargar el detalle del turno", "error");
            setTurnoDetalle(null);
          }
        } catch (e) {
          showToast("Error de conexión al consultar el detalle", "error");
          setTurnoDetalle(null);
        } finally {
          setLoading(false);
        }
      };
      fetchDetalleTurno();
    }
  }, [turnoId]);

  const handlePrint = () => {
    window.print();
  };

  const lecturas = turnoDetalle?.lecturas || [];
  const datosCierre = turnoDetalle?.datos_cierre_pendiente || {};
  const destinosRecaudo = datosCierre.destinos_recaudo || [];

  const getNombreDestino = (id) => {
    switch (Number(id)) {
      case 1: return 'Combustible';
      case 2: return 'Lubricantes';
      default: return `Destino #${id}`;
    }
  };

  return (
    <>
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-shift-section, #printable-shift-section * {
            visibility: visible;
          }
          #printable-shift-section {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            height: auto !important;
            background: white !important;
            padding: 4px !important;
            margin: 0 !important;
          }
          .print\:hidden {
            display: none !important;
          }
          tr, div {
            break-inside: avoid;
          }
        }
      `}</style>

      <div id="printable-shift-section" className="space-y-3 text-left">
        
        {/* Barra superior de navegación / acciones compacta */}
        <div className="flex items-center justify-between bg-white p-3 rounded-2xl border border-slate-100 shadow-sm print:hidden">
          <div className="flex items-center gap-2">
            <button 
              onClick={onBack}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-black text-[9px] uppercase transition-all"
            >
              <ArrowLeft size={14} /> Volver
            </button>
            <div className="h-4 w-px bg-slate-200"></div>
            <div className="flex items-center gap-1.5">
              <div className="p-2 bg-zinc-900 text-white rounded-xl">
                <Fuel size={14} />
              </div>
              <div>
                <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-tight">Turno #{turnoId}</h3>
                <p className="text-[8px] font-bold text-slate-400 uppercase">Detalle y recaudos</p>
              </div>
            </div>
          </div>

          <button 
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-zinc-900 hover:bg-black text-white rounded-xl font-black text-[9px] uppercase transition-all shadow-md"
          >
            <Printer size={14} /> Imprimir
          </button>
        </div>

        {/* Contenido Principal con espacios reducidos */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4">
          {loading ? (
            <div className="py-12 text-center">
              <Loader2 className="animate-spin mx-auto text-slate-300" size={28} />
              <p className="text-[10px] font-bold text-slate-400 uppercase mt-2 tracking-widest">Cargando...</p>
            </div>
          ) : turnoDetalle ? (
            <>
              {/* Encabezado e info general compacta */}
              <div className="bg-slate-50 border border-slate-100 p-3.5 rounded-2xl space-y-2.5 print:bg-white print:border-slate-300">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1 border-b border-slate-200/60 pb-2">
                  <div>
                    <h2 className="text-xs font-black uppercase text-slate-900">Estación: {turnoDetalle.estacion?.nombre}</h2>
                    <p className="text-[9px] font-bold text-slate-500 uppercase flex items-center gap-1">
                      <MapPin size={10} /> Código: {turnoDetalle.estacion?.codigo} | ID: #{turnoDetalle.id}
                    </p>
                  </div>
                  <span className="px-2.5 py-0.5 bg-yellow-500/10 text-yellow-700 border border-yellow-500/20 rounded-full text-[9px] font-black uppercase">
                    {turnoDetalle.estado}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[10px]">
                  <div className="flex items-center gap-1.5 text-slate-700">
                    <User size={12} className="text-slate-400 shrink-0" />
                    <div>
                      <span className="text-[7px] font-bold text-slate-400 uppercase block">Islero</span>
                      <span className="font-black uppercase text-[9px]">{turnoDetalle.usuario?.name}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-700">
                    <Calendar size={12} className="text-slate-400 shrink-0" />
                    <div>
                      <span className="text-[7px] font-bold text-slate-400 uppercase block">Apertura</span>
                      <span className="font-bold text-[9px]">{new Date(turnoDetalle.fecha_apertura).toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-700">
                    <Calendar size={12} className="text-slate-400 shrink-0" />
                    <div>
                      <span className="text-[7px] font-bold text-slate-400 uppercase block">Cierre</span>
                      <span className="font-bold text-[9px]">{turnoDetalle.fecha_cierre ? new Date(turnoDetalle.fecha_cierre).toLocaleString() : 'N/A'}</span>
                    </div>
                  </div>
                </div>

                {/* Totales rápidos en grid ajustado */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1.5 border-t border-slate-200/60">
                  <div className="bg-white p-2 rounded-xl border border-slate-100 shadow-2xs print:border-slate-300">
                    <span className="text-[7px] font-bold text-slate-400 uppercase block">Ventas Combustible</span>
                    <span className="text-[10px] font-black text-slate-800">${Number(datosCierre.total_ventas_combustible || turnoDetalle.total_ventas_combustible || 0).toLocaleString()}</span>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-slate-100 shadow-2xs print:border-slate-300">
                    <span className="text-[7px] font-bold text-slate-400 uppercase block">Ventas Lubricantes</span>
                    <span className="text-[10px] font-black text-slate-800">${Number(datosCierre.total_ventas_lubricantes || turnoDetalle.total_ventas_lubricantes || 0).toLocaleString()}</span>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-slate-100 shadow-2xs print:border-slate-300">
                    <span className="text-[7px] font-bold text-slate-400 uppercase block">Total Abonos</span>
                    <span className="text-[10px] font-black text-slate-800">${Number(datosCierre.total_abonos || turnoDetalle.total_abonos || 0).toLocaleString()}</span>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-slate-100 shadow-2xs print:border-slate-300">
                    <span className="text-[7px] font-bold text-slate-400 uppercase block">Dinero Recaudado</span>
                    <span className="text-[10px] font-black text-emerald-600">${Number(datosCierre.total_dinero_recaudado || turnoDetalle.total_reportado || 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Destinos de Recaudo */}
              {destinosRecaudo.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Banknote size={14} /> Destinos de Recaudo y Medios de Pago
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {destinosRecaudo.map((destino) => (
                      <div key={destino.destino_recaudo_id} className="bg-slate-50 border border-slate-100 p-3 rounded-2xl space-y-2 print:bg-white print:border-slate-300">
                        <h5 className="text-[10px] font-black text-slate-900 uppercase border-b border-slate-200/60 pb-1.5">
                          {getNombreDestino(destino.destino_recaudo_id)}
                        </h5>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-[9px]">
                          {destino.pagos && Object.entries(destino.pagos).map(([medio, valor]) => (
                            <div key={medio} className="bg-white p-2 rounded-xl border border-slate-100 shadow-2xs print:border-slate-300">
                              <span className="text-[7px] font-bold text-slate-400 uppercase block">{medio}</span>
                              <span className="font-black text-slate-700">${Number(valor || 0).toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Listado de Lecturas (tabla compacta optimizada para pantallas móviles) */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-wider">Detalle de Mangueras y Lecturas</h4>
                {lecturas.length > 0 ? (
                  <div className="overflow-x-auto border border-slate-100 rounded-2xl print:border-slate-300">
                    <table className="w-full text-left border-collapse text-[10px]">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100 print:bg-slate-100">
                          <th className="px-3 py-2 font-black text-slate-400 uppercase tracking-wider">Manguera</th>
                          <th className="px-3 py-2 font-black text-slate-400 uppercase tracking-wider">Producto</th>
                          <th className="px-3 py-2 font-black text-slate-400 uppercase tracking-wider text-right">L. Inicial</th>
                          <th className="px-3 py-2 font-black text-slate-400 uppercase tracking-wider text-right">L. Final</th>
                          <th className="px-3 py-2 font-black text-slate-400 uppercase tracking-wider text-right">Galones</th>
                          <th className="px-3 py-2 font-black text-slate-400 uppercase tracking-wider text-right">P/Galón</th>
                          <th className="px-3 py-2 font-black text-slate-400 uppercase tracking-wider text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {lecturas.map((lec) => (
                          <tr key={lec.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-3 py-2">
                              <div className="flex flex-col">
                                <span className="font-black text-slate-700 uppercase">{lec.manguera?.nombre}</span>
                                <span className="text-[8px] font-bold text-slate-400 uppercase">{lec.manguera?.bomba?.nombre}</span>
                              </div>
                            </td>
                            <td className="px-3 py-2">
                              <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[9px] font-black uppercase print:border print:border-slate-300">
                                {lec.manguera?.producto?.nombre || 'N/A'}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-right font-bold text-slate-600">
                              {Number(lec.lectura_inicial).toLocaleString('es-CO', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="px-3 py-2 text-right font-bold text-slate-600">
                              {Number(lec.lectura_final).toLocaleString('es-CO', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="px-3 py-2 text-right font-black text-emerald-600">
                              {Number(lec.galones_vendidos).toLocaleString('es-CO', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="px-3 py-2 text-right font-bold text-slate-500">
                              ${Number(lec.precio_galon).toLocaleString('es-CO')}
                            </td>
                            <td className="px-3 py-2 text-right font-black text-zinc-900">
                              ${Number(lec.total_venta).toLocaleString('es-CO')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="py-8 text-center text-slate-400 border border-dashed border-slate-200 rounded-2xl">
                    <ShieldAlert className="mx-auto text-slate-300 mb-1" size={24} />
                    <p className="text-[10px] font-bold uppercase italic">No hay registros de lecturas</p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="py-12 text-center text-slate-400">
              <ShieldAlert className="mx-auto text-slate-300 mb-1" size={24} />
              <p className="text-[10px] font-bold uppercase italic">No se pudo cargar la información</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};