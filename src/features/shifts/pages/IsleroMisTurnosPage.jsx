import React, { useState, useEffect } from 'react';
import { Search, MapPin, Loader2, FileText, RefreshCw, ArrowLeft, Banknote, Droplets } from 'lucide-react';
import { shiftService } from '../services/shiftService';
import { useToast } from '../../../context/ToastContext';

const formatPesos = (value) => {
  if (value === '' || value === null || value === undefined) return '$0';
  const num = Number(value);
  if (isNaN(num)) return '$0';
  return `$ ${num.toLocaleString()}`;
};

export const IsleroTurnoDetalleView = ({ selectedTurno, onBack }) => {
  if (!selectedTurno) return null;

  const balance = Number(selectedTurno.balance_final || 0);
  const totalEsperado = Number(selectedTurno.total_sistema || 0);
  const totalReportado = Number(selectedTurno.total_reportado || 0);

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-6xl mx-auto pb-20">
      
      {/* Cabecera Sticky */}
      <div className="sticky top-0 z-40 bg-slate-50/90 dark:bg-zinc-950/90 backdrop-blur-md pt-2 pb-4 space-y-4 -mx-4 px-4 md:mx-0 md:px-0">
        <header className="flex items-center justify-between">
          <button 
            onClick={onBack} 
            className="p-3 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-zinc-900 shadow-sm flex items-center gap-2 text-xs font-black uppercase transition-colors"
          >
            <ArrowLeft size={20} /> <span className="hidden sm:inline">Volver</span>
          </button>
          <div className="text-right">
            <h2 className="text-xl md:text-2xl font-black text-slate-800 uppercase tracking-tight">
              Detalle de Turno #{selectedTurno.id}
            </h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Estación: {selectedTurno.estacion?.nombre} | Islero: {selectedTurno.usuario?.name}
            </p>
          </div>
        </header>

        {/* Banner de Balance */}
        <div className={`p-5 rounded-[2rem] shadow-md border flex items-center justify-between transition-colors ${balance === 0 ? 'bg-emerald-50 border-emerald-100 text-emerald-900' : balance < 0 ? 'bg-rose-50 border-rose-100 text-rose-900' : 'bg-blue-50 border-blue-100 text-blue-900'}`}>
          <div>
            <h4 className="text-[10px] md:text-xs font-black uppercase tracking-wider">Balance del Turno</h4>
            <p className="text-[9px] md:text-[10px] font-bold opacity-75">
              Esperado: {formatPesos(totalEsperado)} | Reportado: {formatPesos(totalReportado)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm md:text-xl font-black">
              {balance >= 0 ? 'Sobrante' : 'Faltante'}: {formatPesos(Math.abs(balance))}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Mangueras / Lecturas Registradas */}
          <div className="bg-white rounded-[2.5rem] border border-slate-100 p-6 md:p-8 shadow-sm">
            <h3 className="text-xs font-black text-slate-800 uppercase mb-6 flex items-center gap-2">
              <Droplets size={16} /> Mangueras y Ventas de Combustible
            </h3>
            
            {selectedTurno.lecturas && selectedTurno.lecturas.length > 0 ? (
              selectedTurno.lecturas.map((l) => {
                const nombreManguera = l.manguera?.nombre || 'Manguera';
                const nombreProducto = l.manguera?.producto?.nombre || 'Combustible';
                const galones = Number(l.galones_vendidos || 0);
                const precioGalon = Number(l.precio_galon || 0);
                const totalVenta = Number(l.total_venta || 0);

                return (
                  <div key={l.id || l.manguera_id} className="mb-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-black text-slate-900 uppercase block">
                          {nombreManguera} - <span className="text-emerald-700">{nombreProducto}</span>
                        </span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase">
                          Precio Galón: {formatPesos(precioGalon)}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-black text-slate-900 block">{formatPesos(totalVenta)}</span>
                        <span className="text-[9px] font-bold text-emerald-600">{galones.toFixed(3)} gal</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/60 text-[9px] font-bold text-slate-500">
                      <div>Inicial: <span className="text-slate-800 font-black">{l.lectura_inicial}</span></div>
                      <div className="text-right">Final: <span className="text-slate-800 font-black">{l.lectura_final}</span></div>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-[10px] font-bold text-slate-400 uppercase text-center py-6">No hay registros de lecturas para este turno.</p>
            )}
          </div>

          <div className="space-y-6">
            {/* Desglose por Destinos de Recaudo */}
            {selectedTurno.recaudos && selectedTurno.recaudos.map((destino) => (
              <div key={destino.id} className="bg-white rounded-[2.5rem] border border-slate-100 p-6 md:p-8 shadow-sm">
                <h3 className="text-xs font-black uppercase mb-6 flex items-center gap-2 text-slate-800">
                  <Banknote size={16} /> {destino.destino_recaudo?.nombre || 'Recaudo'}
                  <span className="text-[9px] font-black text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 ml-auto">
                    Total: {formatPesos(destino.total)}
                  </span>
                </h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase">Efectivo</label>
                    <input type="text" readOnly disabled className="w-full p-3 rounded-xl text-xs font-black text-right outline-none bg-slate-100 border border-slate-200 text-slate-700 cursor-not-allowed" value={formatPesos(destino.efectivo)} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase">QR</label>
                    <input type="text" readOnly disabled className="w-full p-3 rounded-xl text-xs font-black text-right outline-none bg-slate-100 border border-slate-200 text-slate-700 cursor-not-allowed" value={formatPesos(destino.qr)} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase">Datáfono</label>
                    <input type="text" readOnly disabled className="w-full p-3 rounded-xl text-xs font-black text-right outline-none bg-slate-100 border border-slate-200 text-slate-700 cursor-not-allowed" value={formatPesos(destino.datafono)} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase">Transferencia</label>
                    <input type="text" readOnly disabled className="w-full p-3 rounded-xl text-xs font-black text-right outline-none bg-slate-100 border border-slate-200 text-slate-700 cursor-not-allowed" value={formatPesos(destino.transferencia)} />
                  </div>
                </div>
              </div>
            ))}

            {/* Observaciones y Movimientos */}
            <div className="bg-white rounded-[2.5rem] border border-slate-100 p-6 md:p-8 shadow-sm space-y-4">
              <h3 className="text-xs font-black uppercase mb-2 flex items-center gap-2 text-slate-800">
                <FileText size={16} /> Observaciones y Ajustes
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-slate-50 rounded-xl space-y-1 border border-slate-100">
                  <span className="text-[9px] font-bold text-slate-400 uppercase block">Otros Movimientos</span>
                  <span className="text-xs font-black text-slate-800">{formatPesos(selectedTurno.otros_movimientos)}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl space-y-1 border border-slate-100">
                  <span className="text-[9px] font-bold text-slate-400 uppercase block">Detalle Movimiento</span>
                  <span className="text-xs font-bold text-slate-800">{selectedTurno.otros_movimientos_detalle || 'N/A'}</span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl space-y-1 border border-slate-100">
                <span className="text-[9px] font-bold text-slate-400 uppercase block">Observación de Cierre</span>
                <p className="text-xs font-bold text-slate-700">{selectedTurno.observacion_cierre || 'Sin observaciones registradas.'}</p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

// Componente Principal IsleroMisTurnosPage
export const IsleroMisTurnosPage = () => {
  const { showToast } = useToast();
  
  const [loadingTurnos, setLoadingTurnos] = useState(false);
  const [turnos, setTurnos] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTurno, setSelectedTurno] = useState(null);

  const fetchMisTurnos = async () => {
    setLoadingTurnos(true);
    try {
      const storedUser = localStorage.getItem('user');
      const userId = storedUser ? JSON.parse(storedUser)?.id : '';

      const response = await shiftService.getIsleroTurns({ estado: 'cerrado', user_id: userId });

      if (response && response.status) {
        const fetchedItems = response.data?.items || response.data || [];
        setTurnos(fetchedItems);
      } else {
        showToast(response?.message || 'Error al cargar los turnos', 'error');
        setTurnos([]);
      }
    } catch (error) {
      showToast('Error de conexión al obtener los turnos', 'error');
      setTurnos([]);
    } finally {
      setLoadingTurnos(false);
    }
  };

  useEffect(() => {
    fetchMisTurnos();
  }, []);

  const filteredTurnos = turnos.filter(t => {
    const term = searchTerm.toLowerCase();
    const estacion = t.estacion?.nombre?.toLowerCase() || '';
    const idStr = String(t.id);
    return estacion.includes(term) || idStr.includes(term);
  });

  if (selectedTurno) {
    return <IsleroTurnoDetalleView selectedTurno={selectedTurno} onBack={() => setSelectedTurno(null)} />;
  }

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-6xl mx-auto pb-20 animate-fadeIn">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-slate-800 uppercase tracking-tight">Mis Turnos Registrados</h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Historial de turnos cerrados</p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative group flex-1 md:w-72">
            <Search className="absolute left-3.5 top-3 text-slate-300 group-focus-within:text-zinc-900 transition-colors" size={16} />
            <input 
              type="text" 
              placeholder="Buscar por ID o estación..."
              className="w-full pl-10 pr-4 py-3 bg-white border border-slate-100 rounded-2xl text-[10px] font-bold outline-none focus:border-zinc-900 shadow-sm uppercase text-slate-800 placeholder-slate-300"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            onClick={fetchMisTurnos}
            className="px-5 py-3 bg-white border border-slate-100 rounded-2xl text-[10px] font-black uppercase text-slate-700 hover:border-zinc-900 transition-all shadow-sm whitespace-nowrap flex items-center gap-1.5"
          >
            <RefreshCw size={14} /> Actualizar
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden p-2">
        {loadingTurnos ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Loader2 className="animate-spin text-zinc-900 mb-2" size={32} />
            <p className="text-[10px] font-bold uppercase tracking-widest">Cargando turnos...</p>
          </div>
        ) : filteredTurnos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 space-y-2">
            <FileText size={40} className="text-slate-300 mb-1" />
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-700">No hay turnos cerrados registrados</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[10px]">
              <thead className="bg-slate-50 text-slate-400 font-bold uppercase">
                <tr>
                  <th className="p-4 rounded-l-2xl">ID Turno</th>
                  <th className="p-4">Estación</th>
                  <th className="p-4">Fecha Cierre</th>
                  <th className="p-4">Total Reportado</th>
                  <th className="p-4">Estado</th>
                  <th className="p-4 text-right rounded-r-2xl">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-bold text-slate-700">
                {filteredTurnos.map((turno) => (
                  <tr 
                    key={turno.id} 
                    onClick={() => setSelectedTurno(turno)}
                    className="hover:bg-slate-50/85 cursor-pointer transition-colors group"
                  >
                    <td className="p-4 font-black text-slate-900">#{turno.id}</td>
                    <td className="p-4 flex items-center gap-2">
                      <MapPin size={14} className="text-yellow-500" />
                      <span className="uppercase">{turno.estacion?.nombre}</span>
                    </td>
                    <td className="p-4 text-slate-500">
                      {turno.fecha_cierre ? new Date(turno.fecha_cierre).toLocaleString() : 'N/A'}
                    </td>
                    <td className="p-4 font-black text-slate-900">
                      {formatPesos(turno.total_reportado)}
                    </td>
                    <td className="p-4">
                      <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase border bg-emerald-50 text-emerald-600 border-emerald-200">
                        {turno.estado}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTurno(turno);
                        }}
                        className="px-4 py-2 bg-slate-100 group-hover:bg-zinc-900 group-hover:text-white rounded-xl text-slate-700 transition-all inline-flex items-center gap-1.5 text-[9px] font-black uppercase"
                      >
                        Ver Detalle
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
  );
};