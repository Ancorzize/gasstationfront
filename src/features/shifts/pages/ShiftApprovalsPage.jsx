import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, ShieldCheck, CheckCircle, XCircle, Eye, 
  MapPin, ArrowLeft, Loader2, AlertTriangle, Droplets, Banknote, Users 
} from 'lucide-react';
import { shiftService } from '../services/shiftService';
import { useToast } from '../../../context/ToastContext';

export const ShiftApprovalsPage = () => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [pendientes, setPendientes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  const [selectedTurno, setSelectedTurno] = useState(null);
  const [revisionData, setRevisionData] = useState(null);
  const [loadingRevision, setLoadingRevision] = useState(false);

  const [actionLoading, setActionLoading] = useState(false);
  const [showDevolverModal, setShowDevolverModal] = useState(false);
  const [observacionDevolucion, setObservacionDevolucion] = useState('');

  const fetchPendientes = async () => {
    setLoading(true);
    try {
      const response = await shiftService.getPendingsClose();
      if (response && response.status) {
        setPendientes(response.data?.items || []);
      } else {
        showToast(response?.message || 'Error al cargar los turnos pendientes', 'error');
      }
    } catch (error) {
      showToast('Error de conexión al cargar los turnos pendientes de aprobación', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendientes();
  }, []);

  const handleSelectTurno = async (turno) => {
    setSelectedTurno(turno);
    setLoadingRevision(true);
    try {
      const response = await shiftService.getPendingsCloseRevision(turno.id);
      if (response && response.status) {
        setRevisionData(response.data);
      } else {
        showToast(response?.message || 'Error al obtener la información de revisión', 'error');
      }
    } catch (error) {
      showToast('Error de conexión al obtener la información de revisión', 'error');
    } finally {
      setLoadingRevision(false);
    }
  };

  const handleAprobar = async () => {
    if (!selectedTurno) return;
    setActionLoading(true);
    try {
      const response = await shiftService.approveShift(selectedTurno.id);
      if (response && response.status) {
        showToast('Turno aprobado exitosamente', 'success');
        setSelectedTurno(null);
        setRevisionData(null);
        fetchPendientes();
      } else {
        showToast(response?.message || 'Error al aprobar el turno', 'error');
      }
    } catch (error) {
      showToast('Error de conexión al aprobar el turno', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDevolver = async () => {
    if (!selectedTurno || !observacionDevolucion.trim()) {
      showToast('Debe ingresar una observación de devolución', 'error');
      return;
    }
    setActionLoading(true);
    try {
      const response = await shiftService.returnShift(selectedTurno.id, {
        observacion_devolucion: observacionDevolucion
      });
      if (response && response.status) {
        showToast('Turno devuelto al islero correctamente', 'success');
        setShowDevolverModal(false);
        setObservacionDevolucion('');
        setSelectedTurno(null);
        setRevisionData(null);
        fetchPendientes();
      } else {
        showToast(response?.message || 'Error al devolver el turno', 'error');
      }
    } catch (error) {
      showToast('Error de conexión al devolver el turno', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Cálculo del balance basado en los datos del cierre pendiente (Esperado vs Reportado)
  const calculatedValues = useMemo(() => {
    if (!revisionData || !revisionData.datos_cierre_pendiente) {
      return { totalEsperado: 0, totalReportado: 0, balance: 0 };
    }
    
    const cierre = revisionData.datos_cierre_pendiente;
    
    const totalVentasCombustible = Number(cierre.total_ventas_combustible || 0);
    const totalVentasLubricantes = Number(cierre.total_ventas_lubricantes || 0);
    
    const totalEsperado = totalVentasCombustible + totalVentasLubricantes;
    const totalReportado = Number(cierre.total_dinero_recaudado || 0) - Number(cierre.total_abonos || 0);
    
    return { 
      totalEsperado, 
      totalReportado, 
      balance: totalReportado - totalEsperado 
    };
  }, [revisionData]);

  // Mapeo y estructuración de destinos de recaudo usando datos_cierre_pendiente
  const destinosRecaudoFormateados = useMemo(() => {
    if (!revisionData) return [];
    const pendientesDestinos = revisionData.datos_cierre_pendiente?.destinos_recaudo || [];
    
    const baseDestinos = [
      { destino_recaudo_id: 1, nombre: 'Combustible', pagos: { efectivo: 0, qr: 0, datafono: 0, transferencia: 0, consignacion: 0 } },
      { destino_recaudo_id: 2, nombre: 'Lubricantes', pagos: { efectivo: 0, qr: 0, datafono: 0, transferencia: 0, consignacion: 0 } }
    ];

    return baseDestinos.map(base => {
      const encontrado = pendientesDestinos.find(p => p.destino_recaudo_id === base.destino_recaudo_id);
      return {
        ...base,
        pagos: encontrado ? { ...encontrado.pagos } : base.pagos
      };
    });
  }, [revisionData]);

  const filteredPendientes = pendientes.filter(t => {
    const term = searchTerm.toLowerCase();
    const estacion = t.estacion?.nombre?.toLowerCase() || '';
    const islero = t.usuario?.name?.toLowerCase() || '';
    const idStr = String(t.id);
    return estacion.includes(term) || islero.includes(term) || idStr.includes(term);
  });

  return (
    <div className="p-4 md:p-8 text-left max-w-6xl mx-auto space-y-6 pb-20">

      {selectedTurno ? (
        <div className="space-y-6">
          <button
            onClick={() => { setSelectedTurno(null); setRevisionData(null); }}
            className="flex items-center gap-2 text-xs font-black uppercase text-yellow-600 hover:text-yellow-700 transition-colors"
          >
            <ArrowLeft size={16} /> Volver al listado
          </button>

          {loadingRevision ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <Loader2 className="animate-spin text-yellow-500 mb-2" size={32} />
              <p className="text-[10px] font-bold uppercase tracking-widest">Cargando información de revisión...</p>
            </div>
          ) : revisionData ? (
            <div className="space-y-6">
              
              {/* Sticky Header con Banner de Esperado vs Reportado integrado */}
              <div className="sticky top-0 z-40 bg-slate-50/90 dark:bg-zinc-950/90 backdrop-blur-md pt-2 pb-4 space-y-4 -mx-4 px-4 md:mx-0 md:px-0">
                <header className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black px-3 py-1 rounded-full bg-yellow-500/10 text-yellow-600 border border-yellow-500/25 uppercase">
                      Turno #{revisionData.id} - {revisionData.estado}
                    </span>
                  </div>
                  <div className="text-right">
                    <h2 className="text-xl md:text-2xl font-black text-slate-800 uppercase tracking-tight">Revisión y Aprobación de Turno</h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Estación: {revisionData.estacion?.nombre} | Islero: {revisionData.usuario?.name}</p>
                  </div>
                </header>

                {/* Banner de Balance (Esperado vs Reportado) */}
                <div className={`p-5 rounded-[2rem] shadow-md border flex items-center justify-between transition-colors ${calculatedValues.balance === 0 ? 'bg-emerald-50 border-emerald-100 text-emerald-900' : calculatedValues.balance < 0 ? 'bg-rose-50 border-rose-100 text-rose-900' : 'bg-blue-50 border-blue-100 text-blue-900'}`}>
                  <div>
                    <h4 className="text-[10px] md:text-xs font-black uppercase tracking-wider">Balance del Turno: Mangueras + Lubricantes</h4>
                    <p className="text-[9px] md:text-[10px] font-bold opacity-75">Esperado: ${calculatedValues.totalEsperado.toLocaleString()} | Reportado: ${calculatedValues.totalReportado.toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm md:text-xl font-black">{calculatedValues.balance >= 0 ? 'Sobrante' : 'Faltante'}: ${Math.abs(calculatedValues.balance).toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Grid de Contenido principal: Usamos flex-col-reverse en móvil para que el Resumen (y botones) quede al final de la pantalla visualmente */}
              <div className="flex flex-col-reverse lg:grid lg:grid-cols-2 gap-8">
                
                {/* Columna Izquierda en Desktop / Abajo en Móvil: Mangueras y Recaudos */}
                <div className="space-y-6">
                  {/* Panel Izquierdo: Mangueras / Lecturas Finales */}
                  <div className="bg-white rounded-[2.5rem] border border-slate-100 p-6 md:p-8 shadow-sm space-y-4">
                    <h3 className="text-xs font-black text-slate-800 uppercase mb-6 flex items-center gap-2">
                      <Droplets size={16} /> Mangueras y Lecturas (Cierre Pendiente)
                    </h3>
                    {revisionData.lecturas?.map((l) => {
                      const lecturaPendiente = revisionData.datos_cierre_pendiente?.lecturas_finales?.find(lf => lf.manguera_id === l.manguera_id);
                      
                      return (
                        <div key={l.id} className="p-4 bg-slate-50 rounded-2xl space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-black uppercase text-slate-800">
                              Manguera #{l.manguera_id} ({lecturaPendiente?.codigo_manguera || 'N/A'})
                            </span>
                            <span className="text-[9px] font-black text-yellow-600 bg-yellow-50 px-2.5 py-0.5 rounded-full border border-yellow-200">
                              Galones: {lecturaPendiente?.galones_vendidos ?? 0}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-[8px] font-bold text-slate-400 uppercase block mb-1">Lectura Inicial</label>
                              <input 
                                type="text" 
                                readOnly 
                                disabled 
                                className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 cursor-not-allowed outline-none" 
                                value={l.lectura_inicial} 
                              />
                            </div>
                            <div>
                              <label className="text-[8px] font-bold text-slate-400 uppercase block mb-1">Lectura Final Reportada</label>
                              <input 
                                type="text" 
                                readOnly 
                                disabled 
                                className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-black text-slate-800 cursor-not-allowed outline-none" 
                                value={lecturaPendiente?.lectura_final ?? 'N/A'} 
                              />
                            </div>
                          </div>

                          <div className="flex justify-between items-center text-[9px] pt-1 border-t border-slate-200/60 font-bold text-slate-500">
                            <span>Precio/Galón: ${Number(lecturaPendiente?.precio_galon || l.precio_galon || 0).toLocaleString()}</span>
                            <span className="text-slate-900 font-black">Total Venta: ${Number(lecturaPendiente?.total_venta || 0).toLocaleString()}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Destinos de Recaudo */}
                  {destinosRecaudoFormateados.map((destino) => (
                    <div key={destino.destino_recaudo_id} className="bg-white rounded-[2.5rem] border border-slate-100 p-6 md:p-8 shadow-sm">
                      <h3 className="text-xs font-black uppercase mb-6 flex items-center gap-2 text-slate-800">
                        <Banknote size={16} /> Recaudo: {destino.nombre}
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        {Object.keys(destino.pagos).map((medio) => (
                          <div key={medio} className="space-y-1">
                            <label className="text-[9px] font-bold text-slate-400 uppercase">{medio}</label>
                            <input 
                              type="text" 
                              readOnly
                              disabled
                              className="w-full p-3 bg-slate-100 border border-slate-200 rounded-xl text-xs font-black text-right text-slate-700 cursor-not-allowed outline-none" 
                              value={`$ ${Number(destino.pagos[medio] || 0).toLocaleString()}`} 
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Columna Derecha en Desktop / Arriba en Móvil (Se ve al final en móvil gracias a flex-col-reverse): Resumen y Acciones */}
                <div className="space-y-6">
                  {/* Resumen General del Cierre Pendiente (Con Total Abonos de Cartera integrado) */}
                  <div className="bg-zinc-900 rounded-[2.5rem] p-8 text-white shadow-xl space-y-4">
                    <h3 className="text-xs font-black uppercase tracking-widest text-yellow-500 flex items-center gap-2">
                      <ShieldCheck size={16} /> Resumen del Cierre Reportado
                    </h3>
                    <div className="space-y-2 text-[10px] font-bold">
                      <div className="flex justify-between bg-zinc-800/40 p-3 rounded-xl border border-white/5">
                        <span className="text-zinc-400 uppercase">Total Ventas Combustible:</span>
                        <span className="text-white">${Number(revisionData.datos_cierre_pendiente?.total_ventas_combustible || 0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between bg-zinc-800/40 p-3 rounded-xl border border-white/5">
                        <span className="text-zinc-400 uppercase">Total Ventas Lubricantes:</span>
                        <span className="text-white">${Number(revisionData.datos_cierre_pendiente?.total_ventas_lubricantes || 0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between bg-zinc-800/40 p-3 rounded-xl border border-white/5">
                        <span className="text-zinc-400 uppercase flex items-center gap-1.5"><Users size={12} className="text-yellow-500" /> Total Abonos de Cartera:</span>
                        <span className="text-yellow-400 font-black">${Number(revisionData.datos_cierre_pendiente?.total_abonos || 0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between bg-zinc-800/40 p-3 rounded-xl border border-white/5 pt-3 border-t border-zinc-700">
                        <span className="text-zinc-300 uppercase font-black">Total Dinero Recaudado:</span>
                        <span className="text-emerald-400 font-black text-xs">${Number(revisionData.datos_cierre_pendiente?.total_dinero_recaudado || 0).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Botones de Aprobación o Devolución */}
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <button
                      onClick={handleAprobar}
                      disabled={actionLoading}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white py-5 rounded-[2rem] font-black uppercase text-xs transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
                    >
                      {actionLoading ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle size={18} />} 
                      Aprobar Turno
                    </button>
                    <button
                      onClick={() => setShowDevolverModal(true)}
                      disabled={actionLoading}
                      className="bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 py-5 rounded-[2rem] font-black uppercase text-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm"
                    >
                      <XCircle size={18} /> Devolver Turno
                    </button>
                  </div>
                </div>

              </div>
            </div>
          ) : null}
        </div>
      ) : (
        /* VISTA DE LISTADO DE TURNOS PENDIENTES */
        <div className="space-y-6">
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight italic">Aprobación de Turnos</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Gestión y revisión de cierres pendientes de isleros</p>
            </div>

            <div className="flex items-center gap-3 self-start md:self-auto w-full md:w-auto">
              <div className="relative group flex-1 md:w-72">
                <Search className="absolute left-3.5 top-3 text-slate-300 group-focus-within:text-zinc-900 transition-colors" size={16} />
                <input 
                  type="text" 
                  placeholder="Buscar turno, islero..."
                  className="w-full pl-10 pr-4 py-3 bg-white border border-slate-100 rounded-2xl text-[10px] font-bold outline-none focus:border-zinc-900 shadow-sm uppercase text-slate-800 placeholder-slate-300"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <button
                onClick={fetchPendientes}
                className="px-5 py-3 bg-white border border-slate-100 rounded-2xl text-[10px] font-black uppercase text-slate-700 hover:border-zinc-900 transition-all shadow-sm whitespace-nowrap"
              >
                Actualizar
              </button>
            </div>
          </header>

          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden p-2">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <Loader2 className="animate-spin text-zinc-900 mb-2" size={32} />
                <p className="text-[10px] font-bold uppercase tracking-widest">Cargando turnos pendientes...</p>
              </div>
            ) : filteredPendientes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400 space-y-2">
                <CheckCircle size={40} className="text-emerald-500 opacity-40 mb-1" />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-700">No hay turnos pendientes por aprobar</p>
                <p className="text-[9px] font-bold text-slate-400 uppercase italic">Todos los cierres de turno han sido procesados correctamente.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[10px]">
                  <thead className="bg-slate-50 text-slate-400 font-bold uppercase">
                    <tr>
                      <th className="p-4 rounded-l-2xl">ID Turno</th>
                      <th className="p-4">Estación</th>
                      <th className="p-4">Islero</th>
                      <th className="p-4">Fecha Apertura</th>
                      <th className="p-4">Estado</th>
                      <th className="p-4 text-right rounded-r-2xl">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-bold text-slate-700">
                    {filteredPendientes.map((turno) => (
                      <tr 
                        key={turno.id} 
                        onClick={() => handleSelectTurno(turno)}
                        className="hover:bg-slate-50/85 cursor-pointer transition-colors group"
                      >
                        <td className="p-4 font-black text-slate-900">#{turno.id}</td>
                        <td className="p-4 flex items-center gap-2">
                          <MapPin size={14} className="text-yellow-500" />
                          <span className="uppercase">{turno.estacion?.nombre}</span>
                        </td>
                        <td className="p-4">
                          <div className="text-slate-900 uppercase font-black">{turno.usuario?.name}</div>
                          <div className="text-[9px] text-slate-400 font-normal lowercase">{turno.usuario?.email}</div>
                        </td>
                        <td className="p-4 text-slate-500">
                          {new Date(turno.fecha_apertura).toLocaleString()}
                        </td>
                        <td className="p-4">
                          <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase bg-yellow-50 text-yellow-600 border border-yellow-200">
                            {turno.estado}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <button className="px-4 py-2 bg-slate-100 group-hover:bg-zinc-900 group-hover:text-white rounded-xl text-slate-700 transition-all inline-flex items-center gap-1.5 text-[9px] font-black uppercase">
                            <Eye size={14} /> Revisar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal para Devolver Turno */}
      {showDevolverModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] w-full max-w-md p-8 space-y-6 shadow-2xl text-white">
            <div className="space-y-2">
              <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-2 text-red-400">
                <AlertTriangle size={18} /> Devolver Turno al Islero
              </h3>
              <p className="text-[10px] text-zinc-400 font-bold uppercase leading-relaxed">
                Ingrese el motivo o la observación de la devolución para que el islero pueda corregir la información reportada.
              </p>
            </div>

            <textarea
              rows={4}
              value={observacionDevolucion}
              onChange={(e) => setObservacionDevolucion(e.target.value)}
              placeholder="Escriba la observación detallada aquí..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-4 text-[10px] font-bold uppercase outline-none focus:border-yellow-500 transition-all text-white placeholder-zinc-600 resize-none"
            />

            <div className="flex gap-3 justify-end pt-2">
              <button
                onClick={() => { setShowDevolverModal(false); setObservacionDevolucion(''); }}
                className="px-5 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-black uppercase rounded-2xl transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDevolver}
                disabled={actionLoading}
                className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white text-[10px] font-black uppercase rounded-2xl transition-colors shadow-lg disabled:opacity-50 flex items-center gap-2"
              >
                {actionLoading && <Loader2 className="animate-spin" size={14} />}
                Confirmar Devolución
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};