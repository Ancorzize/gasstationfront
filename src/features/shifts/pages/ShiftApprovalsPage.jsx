import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, ShieldCheck, CheckCircle, Eye, 
  MapPin, ArrowLeft, Loader2, Droplets, Banknote, Users, Save, FileText, CreditCard 
} from 'lucide-react';
import { shiftService } from '../services/shiftService';
import { useToast } from '../../../context/ToastContext';

// Formato a 3 decimales para Mangueras y Lecturas
const formatLectura = (value) => {
  if (value === '' || value === null || value === undefined) return '';
  const num = Number(value);
  if (isNaN(num)) return '';
  
  const parts = num.toFixed(3).split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${parts[0]},${parts[1]}`;
};

const parseLectura = (str) => {
  if (!str) return '';
  const clean = str.toString().replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.');
  const num = parseFloat(clean);
  return isNaN(num) ? '' : num;
};

// Funciones auxiliares de formateo en pesos colombianos (mantiene 2 decimales)
const formatPesos = (value) => {
  if (value === '' || value === null || value === undefined) return '';
  const num = Number(value);
  if (isNaN(num)) return '';
  
  const parts = num.toFixed(2).split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${parts[0]},${parts[1]}`;
};

const parsePesos = (str) => {
  if (!str) return '';
  const clean = str.toString().replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.');
  const num = parseFloat(clean);
  return isNaN(num) ? '' : num;
};

export const ShiftApprovalsPage = () => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [pendientes, setPendientes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  const [selectedTurno, setSelectedTurno] = useState(null);
  const [revisionData, setRevisionData] = useState(null);
  const [loadingRevision, setLoadingRevision] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Estados locales editables
  const [editLecturas, setEditLecturas] = useState([]);
  const [editDestinosRecaudo, setEditDestinosRecaudo] = useState([]);
  const [otrosMovimientos, setOtrosMovimientos] = useState(0);
  const [otrosMovimientosInput, setOtrosMovimientosInput] = useState('');
  const [otrosDetalle, setOtrosDetalle] = useState('');
  const [observacionCierre, setObservacionCierre] = useState('');

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
        const data = response.data;
        setRevisionData(data);

        setEditLecturas(
          (data.turno?.lecturas || []).map(l => {
            const valFinal = l.lectura_final !== null ? parseFloat(l.lectura_final) : '';
            return {
              manguera_id: l.manguera_id,
              lectura_final: valFinal,
              lecturaFinalInput: valFinal !== '' ? formatLectura(valFinal) : '',
              lectura_inicial: parseFloat(l.lectura_inicial || 0),
              precio_galon: parseFloat(l.precio_galon || 0),
              manguera: l.manguera
            };
          })
        );

        setEditDestinosRecaudo(
          (data.destinos_recaudo || []).map(d => {
            const recaudoIslero = (data.turno?.recaudos || []).find(
              r => r.destino_recaudo_id === d.destino_recaudo_id
            );

            const initialPagos = recaudoIslero ? {
              efectivo: parseFloat(recaudoIslero.efectivo || 0),
              qr: parseFloat(recaudoIslero.qr || 0),
              datafono: parseFloat(recaudoIslero.datafono || 0),
              transferencia: parseFloat(recaudoIslero.transferencia || 0),
              consignacion: parseFloat(recaudoIslero.consignacion || 0)
            } : { ...(d.pagos || { efectivo: 0, qr: 0, datafono: 0, transferencia: 0, consignacion: 0 }) };

            const pagosInputs = {};
            Object.keys(initialPagos).forEach(medio => {
              pagosInputs[medio] = initialPagos[medio] ? formatPesos(initialPagos[medio]) : '';
            });

            return {
              destino_recaudo_id: d.destino_recaudo_id,
              nombre: d.nombre,
              pagos: initialPagos,
              pagosInputs: pagosInputs
            };
          })
        );

        const valOtros = parseFloat(data.resumen?.otros_movimientos || 0);
        setOtrosMovimientos(valOtros);
        setOtrosMovimientosInput(valOtros ? formatPesos(valOtros) : '');
        setOtrosDetalle(data.resumen?.otros_movimientos_detalle || '');
        setObservacionCierre(data.resumen?.observacion_cierre || 'Cierre revisado y corregido por administrador.');

      } else {
        showToast(response?.message || 'Error al obtener la información de revisión', 'error');
      }
    } catch (error) {
      showToast('Error de conexión al obtener la información de revisión', 'error');
    } finally {
      setLoadingRevision(false);
    }
  };

  const handleReadingChange = (mangueraId, rawValue) => {
    setEditLecturas(prev => prev.map(l => {
      if (l.manguera_id !== mangueraId) return l;
      const parsedNum = parseLectura(rawValue);
      return {
        ...l,
        lectura_final: parsedNum === '' ? '' : parsedNum,
        lecturaFinalInput: rawValue
      };
    }));
  };

  const handleReadingBlur = (mangueraId) => {
    setEditLecturas(prev => prev.map(l => {
      if (l.manguera_id !== mangueraId) return l;
      const num = l.lectura_final;
      return {
        ...l,
        lecturaFinalInput: num !== '' && !isNaN(num) ? formatLectura(num) : ''
      };
    }));
  };

  const handlePaymentChange = (destinoId, medio, rawValue) => {
    setEditDestinosRecaudo(prev => prev.map(d => {
      if (d.destino_recaudo_id !== destinoId) return d;

      const parsedNum = parsePesos(rawValue);
      return {
        ...d,
        pagos: { ...d.pagos, [medio]: parsedNum === '' ? 0 : parsedNum },
        pagosInputs: { ...d.pagosInputs, [medio]: rawValue }
      };
    }));
  };

  const handlePaymentBlur = (destinoId, medio) => {
    setEditDestinosRecaudo(prev => prev.map(d => {
      if (d.destino_recaudo_id !== destinoId) return d;
      const num = d.pagos[medio];
      return {
        ...d,
        pagosInputs: { ...d.pagosInputs, [medio]: num ? formatPesos(num) : '' }
      };
    }));
  };

  const handleOtrosMovimientosChange = (rawValue) => {
    setOtrosMovimientosInput(rawValue);
    const parsedNum = parsePesos(rawValue);
    setOtrosMovimientos(parsedNum === '' ? 0 : parsedNum);
  };

  const handleOtrosMovimientosBlur = () => {
    setOtrosMovimientosInput(otrosMovimientos ? formatPesos(otrosMovimientos) : '');
  };

  const handleAprobar = async (e) => {
    e.preventDefault();
    if (!selectedTurno) return;
    setActionLoading(true);
    try {
      const payload = {
        lecturas_finales: editLecturas.map(({ manguera_id, lectura_final }) => ({
          manguera_id,
          lectura_final: Number(lectura_final) || 0
        })),
        destinos_recaudo: editDestinosRecaudo.map(d => ({
          destino_recaudo_id: d.destino_recaudo_id,
          pagos: d.pagos
        })),
        otros_movimientos: Number(otrosMovimientos) || 0,
        otros_movimientos_detalle: otrosDetalle ? otrosDetalle : null,
        observacion_cierre: observacionCierre
      };

      const response = await shiftService.closeShift(selectedTurno.id, payload);
      
      if (response && response.status) {
        showToast('Turno modificado y aprobado exitosamente', 'success');
        setSelectedTurno(null);
        setRevisionData(null);
        fetchPendientes();
      } else {
        showToast(response?.message || 'Error al procesar el cierre del turno', 'error');
      }
    } catch (error) {
      showToast('Error de conexión al guardar y aprobar el turno', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const calculatedValues = useMemo(() => {
    if (!revisionData) return { totalEsperado: 0, totalReportado: 0, balance: 0, totalCreditos: 0 };
    
    const totalCombustible = editLecturas.reduce((acc, l) => {
      const final = l.lectura_final !== '' ? Number(l.lectura_final) : l.lectura_inicial;
      const galonesVendidos = Math.max(0, final - l.lectura_inicial);
      return acc + (galonesVendidos * l.precio_galon);
    }, 0);

    const abonos = (revisionData.abonos || []).reduce((acc, a) => acc + Number(a.monto || 0), 0);
    const ventasLubricantes = Number(revisionData.resumen?.total_ventas_lubricantes || 0);
    const totalCreditos = Number(revisionData.resumen?.total_creditos || 0);
    
    let totalEsperado = totalCombustible + ventasLubricantes - totalCreditos + abonos;

    if (Math.abs(totalEsperado) < 100) {
      totalEsperado = 0;
    }

    const totalReportado = editDestinosRecaudo.reduce((acc, d) => {
      return acc + Object.values(d.pagos).reduce((sum, val) => sum + Number(val || 0), 0);
    }, 0) + Number(otrosMovimientos || 0) + abonos;
            
    return { 
      totalEsperado: Number(totalEsperado || 0), 
      totalReportado: Number(totalReportado || 0), 
      balance: Number(totalReportado || 0) - Number(totalEsperado || 0),
      totalCreditos: Number(totalCreditos || 0)
    };
  }, [revisionData, editLecturas, editDestinosRecaudo, otrosMovimientos]);

  const filteredPendientes = pendientes.filter(t => {
    const term = searchTerm.toLowerCase();
    const estacion = t.estacion?.nombre?.toLowerCase() || '';
    const islero = t.usuario?.name?.toLowerCase() || '';
    const idStr = String(t.id);
    return estacion.includes(term) || islero.includes(term) || idStr.includes(term);
  });

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-6xl mx-auto pb-20 text-left">

      {selectedTurno ? (
        <div className="space-y-6">
          
          <div className="sticky top-0 z-40 bg-slate-50/90 dark:bg-zinc-950/90 backdrop-blur-md pt-2 pb-4 space-y-4 -mx-4 px-4 md:mx-0 md:px-0">
            <header className="flex items-center justify-between">
              <button 
                onClick={() => { setSelectedTurno(null); setRevisionData(null); }} 
                className="p-3 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-zinc-900 shadow-sm transition-all"
              >
                <ArrowLeft size={20} />
              </button>
              <div className="text-right">
                <h2 className="text-xl md:text-2xl font-black text-slate-800 uppercase tracking-tight">Modificación y Aprobación</h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Estación: {revisionData?.turno?.estacion?.nombre} | Islero: {revisionData?.turno?.usuario?.name}
                </p>
              </div>
            </header>

            {loadingRevision ? null : (
              <div className={`p-5 rounded-[2rem] shadow-md border flex items-center justify-between transition-colors ${calculatedValues.balance === 0 ? 'bg-emerald-50 border-emerald-100 text-emerald-900' : calculatedValues.balance < 0 ? 'bg-rose-50 border-rose-100 text-rose-900' : 'bg-blue-50 border-blue-100 text-blue-900'}`}>
                <div>
                  <h4 className="text-[10px] md:text-xs font-black uppercase tracking-wider">Balance del Turno (Control de Saldo)</h4>
                  <p className="text-[9px] md:text-[10px] font-bold opacity-75">
                    Esperado: {formatPesos(calculatedValues.totalEsperado)} | Reportado: {formatPesos(calculatedValues.totalReportado)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm md:text-xl font-black">
                    {calculatedValues.balance >= 0 ? 'Sobrante' : 'Faltante (Negativo)'}: {formatPesos(Math.abs(calculatedValues.balance))}
                  </p>
                  {calculatedValues.balance < 0 && (
                    <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-[8px] font-black bg-rose-200 text-rose-800 uppercase tracking-widest">
                      Alerta: Saldo negativo detectado
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {loadingRevision ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <Loader2 className="animate-spin text-zinc-900 mb-2" size={32} />
              <p className="text-[10px] font-bold uppercase tracking-widest">Cargando información de revisión...</p>
            </div>
          ) : revisionData ? (
            <form onSubmit={handleAprobar} className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* Mangueras (Con formato a 3 decimales) */}
                <div className="bg-white rounded-[2.5rem] border border-slate-100 p-6 md:p-8 shadow-sm space-y-4">
                  <h3 className="text-xs font-black text-slate-800 uppercase mb-6 flex items-center gap-2">
                    <Droplets size={16} /> Mangueras y Lecturas (Modificables)
                  </h3>
                  {editLecturas.map((l) => (
                    <div key={l.manguera_id} className="mb-4 p-4 bg-slate-50 rounded-2xl space-y-2 border border-slate-100">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-[9px] font-bold uppercase text-slate-600">{l.manguera?.nombre || `Manguera #${l.manguera_id}`}</p>
                          <p className="text-[10px] font-black text-slate-800">{formatPesos(l.precio_galon)} /gal</p>
                        </div>
                        <span className="text-[9px] font-black text-yellow-600 bg-yellow-50 px-2.5 py-0.5 rounded-full border border-yellow-200">
                          Inicial: {formatLectura(l.lectura_inicial)}
                        </span>
                      </div>
                      <div>
                        <label className="text-[8px] font-bold text-slate-400 uppercase block mb-1">Lectura Final</label>
                        <input 
                          type="text" 
                          placeholder="0,000"
                          className="w-full p-3 rounded-xl border border-slate-200 bg-white text-right text-xs font-black outline-none focus:border-zinc-900 transition-all text-slate-800" 
                          value={l.lecturaFinalInput ?? ''} 
                          onChange={(e) => handleReadingChange(l.manguera_id, e.target.value)} 
                          onBlur={() => handleReadingBlur(l.manguera_id)}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-6">
                  {/* Destinos de Recaudo */}
                  {editDestinosRecaudo.map((destino) => {
                    const esLubricantes = destino.nombre === 'Lubricantes';

                    return (
                      <div key={destino.destino_recaudo_id} className="bg-white rounded-[2.5rem] border border-slate-100 p-6 md:p-8 shadow-sm space-y-4">
                        <h3 className="text-xs font-black uppercase mb-6 flex items-center gap-2 text-slate-800">
                          <Banknote size={16} /> {destino.nombre}
                          {esLubricantes && <span className="text-[9px] font-bold text-slate-400 ml-auto">(Automático)</span>}
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                          {Object.keys(destino.pagos).map((medio) => (
                            <div key={medio} className="space-y-1">
                              <label className="text-[9px] font-bold text-slate-400 uppercase">{medio}</label>
                              <input 
                                type="text" 
                                readOnly={esLubricantes}
                                disabled={esLubricantes}
                                className={`w-full p-3 rounded-xl text-xs font-black text-right outline-none transition-all ${
                                  esLubricantes 
                                    ? 'bg-slate-100 border border-slate-200 text-slate-700 cursor-not-allowed' 
                                    : 'bg-slate-50 border border-slate-200 focus:border-zinc-900 text-slate-800'
                                }`} 
                                value={esLubricantes ? formatPesos(destino.pagos[medio]) : (destino.pagosInputs?.[medio] ?? '')} 
                                placeholder="0,00"
                                onChange={(e) => handlePaymentChange(destino.destino_recaudo_id, medio, e.target.value)} 
                                onBlur={() => handlePaymentBlur(destino.destino_recaudo_id, medio)}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}

                  {/* Sección de Créditos */}
                  <div className="bg-white rounded-[2.5rem] border border-slate-100 p-6 md:p-8 shadow-sm space-y-3">
                    <h3 className="text-xs font-black uppercase flex items-center gap-2 text-slate-800">
                      <CreditCard size={16} /> Total Créditos del Turno
                    </h3>
                    <input
                      type="text"
                      readOnly
                      disabled
                      className="w-full p-4 bg-slate-100 border border-slate-200 rounded-2xl text-sm font-black text-slate-700 text-right outline-none cursor-not-allowed"
                      value={formatPesos(calculatedValues.totalCreditos)}
                    />
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">
                      {revisionData.creditos?.length || 0} crédito(s) registrado(s) en este turno
                    </p>
                  </div>

                  {/* Total Abonos de Cartera */}
                  <div className="bg-white rounded-[2.5rem] border border-slate-100 p-6 md:p-8 shadow-sm space-y-3">
                    <h3 className="text-xs font-black uppercase flex items-center gap-2 text-slate-800">
                      <Users size={16} /> Total Abonos de Cartera
                    </h3>
                    <input
                      type="text"
                      readOnly
                      disabled
                      className="w-full p-4 bg-slate-100 border border-slate-200 rounded-2xl text-sm font-black text-slate-700 text-right outline-none cursor-not-allowed"
                      value={formatPesos((revisionData.abonos || []).reduce((acc, a) => acc + Number(a.monto || 0), 0))}
                    />
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">
                      {revisionData.abonos?.length || 0} abono(s) registrado(s) en este turno
                    </p>
                  </div>

                  {/* Otros Movimientos y Observaciones */}
                  <div className="bg-white rounded-[2.5rem] border border-slate-100 p-6 md:p-8 shadow-sm space-y-4">
                    <h3 className="text-xs font-black uppercase flex items-center gap-2 text-slate-800">
                      <FileText size={16} /> Ajustes y Observaciones
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-400 uppercase">Otros Movimientos</label>
                        <input 
                          type="text"
                          placeholder="0,00"
                          className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-black text-right text-slate-800 outline-none focus:border-zinc-900 transition-all"
                          value={otrosMovimientosInput}
                          onChange={(e) => handleOtrosMovimientosChange(e.target.value)}
                          onBlur={handleOtrosMovimientosBlur}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-400 uppercase">Detalle Movimientos</label>
                        <input 
                          type="text"
                          placeholder="Ej. Ajuste de caja"
                          className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-zinc-900 transition-all"
                          value={otrosDetalle}
                          onChange={(e) => setOtrosDetalle(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="space-y-1 pt-2">
                      <label className="text-[9px] font-bold text-slate-400 uppercase">Observación de Cierre</label>
                      <textarea 
                        rows="2"
                        className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-zinc-900 transition-all resize-none"
                        value={observacionCierre}
                        onChange={(e) => setObservacionCierre(e.target.value)}
                      />
                    </div>
                  </div>

                </div>

              </div>

              <button 
                type="submit" 
                disabled={actionLoading} 
                className="w-full flex items-center justify-center gap-2 bg-emerald-600 text-white py-5 rounded-[2rem] font-black uppercase text-xs hover:bg-emerald-500 transition-all shadow-xl disabled:opacity-50"
              >
                {actionLoading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                Guardar Cambios y Aprobar Turno
              </button>
            </form>
          ) : null}
        </div>
      ) : (
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
                            <Eye size={14} /> Modificar y Revisar
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
    </div>
  );
};