import React, { useMemo } from 'react';
import { 
  ArrowLeft, Droplets, Banknote, 
  Users, Clock, ShieldAlert
} from 'lucide-react';

export const IsleroTurnoDetalleView = ({ selectedTurno, onBack }) => {
  const turnoData = selectedTurno; // Usamos el objeto directamente

  // Mapeo y estructuración de destinos de recaudo usando datos de cierre
  const destinosRecaudoFormateados = useMemo(() => {
    if (!turnoData) return [];
    const datosCierre = turnoData.datos_cierre_pendiente || turnoData.datos_cierre || {};
    const pendientesDestinos = datosCierre.destinos_recaudo || [];
    
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
  }, [turnoData]);

  if (!turnoData) {
    return (
      <div className="p-4 md:p-8 text-left max-w-6xl mx-auto space-y-6">
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-xs font-black uppercase text-yellow-600 hover:text-yellow-700 transition-colors"
          >
            <ArrowLeft size={16} /> Volver
          </button>
        )}
        <div className="text-center py-20 text-slate-400 font-bold uppercase text-xs">
          No se encontró información para este turno
        </div>
      </div>
    );
  }

  const datosCierreRef = turnoData.datos_cierre_pendiente || turnoData.datos_cierre || {};
  const esDevuelto = turnoData.estado === 'devuelto' || turnoData.observacion_devolucion;

  return (
    <div className="p-4 md:p-8 text-left max-w-6xl mx-auto space-y-6 pb-20">
      <div className="space-y-6">
        {/* Botón de Volver recibido por props */}
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-xs font-black uppercase text-yellow-600 hover:text-yellow-700 transition-colors"
          >
            <ArrowLeft size={16} /> Volver al listado
          </button>
        )}

        {/* Alerta de Devolución si el administrador lo rechazó */}
        {esDevuelto && (
          <div className="bg-rose-500/10 border border-rose-500/30 rounded-[2rem] p-6 text-rose-600 space-y-2">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider">
              <ShieldAlert size={18} /> Turno devuelto por el administrador
            </div>
            <p className="text-[10px] font-bold uppercase leading-relaxed text-slate-700">
              <span className="text-rose-500 font-black">Observación:</span> {turnoData.observacion_devolucion || 'Sin observaciones detalladas. Por favor revise los valores.'}
            </p>
          </div>
        )}

        {/* Sticky Header con Información General del Turno */}
        <div className="sticky top-0 z-40 bg-slate-50/90 backdrop-blur-md pt-2 pb-4 space-y-4 -mx-4 px-4 md:mx-0 md:px-0">
          <header className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black px-3 py-1 rounded-full bg-yellow-500/10 text-yellow-600 border border-yellow-500/25 uppercase">
                Turno #{turnoData.id} - {turnoData.estado}
              </span>
            </div>
            <div className="text-right">
              <h2 className="text-xl md:text-2xl font-black text-slate-800 uppercase tracking-tight">Detalle de Turno</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Estación: {turnoData.estacion?.nombre} | Islero: {turnoData.usuario?.name || turnoData.user?.name}
              </p>
            </div>
          </header>
        </div>

        {/* Grid de Contenido */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Panel Izquierdo: Mangueras / Lecturas */}
          <div className="space-y-6">
            <div className="bg-white rounded-[2.5rem] border border-slate-100 p-6 md:p-8 shadow-sm space-y-4">
              <h3 className="text-xs font-black text-slate-800 uppercase mb-6 flex items-center gap-2">
                <Droplets size={16} /> Mangueras y Lecturas
              </h3>
              {turnoData.lecturas?.map((l) => {
                const lecturaFinalItem = datosCierreRef.lecturas_finales?.find(lf => lf.manguera_id === l.manguera_id);
                
                return (
                  <div key={l.id} className="p-4 bg-slate-50 rounded-2xl space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black uppercase text-slate-800">
                        Manguera #{l.manguera_id} ({lecturaFinalItem?.codigo_manguera || l.manguera?.nombre || 'N/A'})
                      </span>
                      <span className="text-[9px] font-black text-yellow-600 bg-yellow-50 px-2.5 py-0.5 rounded-full border border-yellow-200">
                        Galones: {lecturaFinalItem?.galones_vendidos ?? 0}
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
                        <label className="text-[8px] font-bold text-slate-400 uppercase block mb-1">Lectura Final</label>
                        <input 
                          type="text" 
                          readOnly 
                          disabled 
                          className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-black text-slate-800 cursor-not-allowed outline-none" 
                          value={lecturaFinalItem?.lectura_final ?? 'N/A'} 
                        />
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-[9px] pt-1 border-t border-slate-200/60 font-bold text-slate-500">
                      <span>Precio/Galón: ${Number(lecturaFinalItem?.precio_galon || l.precio_galon || 0).toLocaleString()}</span>
                      <span className="text-slate-900 font-black">Total Venta: ${Number(lecturaFinalItem?.total_venta || 0).toLocaleString()}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Resumen General del Cierre */}
            <div className="bg-zinc-900 rounded-[2.5rem] p-8 text-white shadow-xl space-y-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-yellow-500 flex items-center gap-2">
                <Clock size={16} /> Resumen del Cierre
              </h3>
              <div className="space-y-2 text-[10px] font-bold">
                <div className="flex justify-between bg-zinc-800/40 p-3 rounded-xl border border-white/5">
                  <span className="text-zinc-400 uppercase">Total Ventas Combustible:</span>
                  <span className="text-white">${Number(datosCierreRef.total_ventas_combustible || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between bg-zinc-800/40 p-3 rounded-xl border border-white/5">
                  <span className="text-zinc-400 uppercase">Total Ventas Lubricantes:</span>
                  <span className="text-white">${Number(datosCierreRef.total_ventas_lubricantes || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between bg-zinc-800/40 p-3 rounded-xl border border-white/5">
                  <span className="text-zinc-400 uppercase">Total Dinero Recaudado:</span>
                  <span className="text-emerald-400 font-black">${Number(datosCierreRef.total_dinero_recaudado || 0).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Panel Derecho: Destinos de Recaudo y Cartera */}
          <div className="space-y-6">
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

            {/* Total Abonos de Cartera */}
            <div className="bg-white rounded-[2.5rem] border border-slate-100 p-6 md:p-8 shadow-sm">
              <h3 className="text-xs font-black uppercase mb-4 flex items-center gap-2 text-slate-800">
                <Users size={16} /> Total Abonos de Cartera
              </h3>
              <div className="relative">
                <input
                  type="text"
                  readOnly
                  disabled
                  className="w-full p-4 bg-slate-100 border border-slate-200 rounded-2xl text-sm font-black text-slate-700 text-right outline-none cursor-not-allowed"
                  value={`$ ${Number(datosCierreRef.total_abonos || 0).toLocaleString()}`}
                />
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
};