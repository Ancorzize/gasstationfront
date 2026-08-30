import React, { useState, useEffect } from 'react';
import { Search, MapPin, Loader2, FileText, RefreshCw, ArrowLeft, ShieldCheck, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { shiftService } from '../services/shiftService';
import { useToast } from '../../../context/ToastContext';
import { IsleroTurnoDetalleView } from './IsleroTurnoDetalleView';

export const IsleroMisTurnosPage = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  const [activeTab, setActiveTab] = useState('cerrados'); // 'cerrados' | 'devueltos'
  const [loadingTurnos, setLoadingTurnos] = useState(false);
  const [turnos, setTurnos] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTurno, setSelectedTurno] = useState(null);

  const fetchMisTurnos = async () => {
    setLoadingTurnos(true);
    try {
      let response;
      const storedUser = localStorage.getItem('user');
      const userId = storedUser ? JSON.parse(storedUser)?.id : '';

      if (activeTab === 'cerrados') {
        response = await shiftService.getIsleroTurns({ estado: 'cerrado', user_id: userId });
      } else if (activeTab === 'devueltos') {
        response = await shiftService.getIsleroReturnedTurns();
      }

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
  }, [activeTab]);

  const filteredTurnos = turnos.filter(t => {
    const term = searchTerm.toLowerCase();
    const estacion = t.estacion?.nombre?.toLowerCase() || '';
    const idStr = String(t.id);
    return estacion.includes(term) || idStr.includes(term);
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-slate-800 uppercase tracking-tight italic">Mis Turnos Registrados</h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Historial de turnos cerrados y devueltos</p>
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

      {selectedTurno ? (
        <div className="space-y-6">
          <button
            onClick={() => setSelectedTurno(null)}
            className="flex items-center gap-2 text-xs font-black uppercase text-yellow-600 hover:text-yellow-700 transition-colors"
          >
            <ArrowLeft size={16} /> Volver al listado
          </button>

          {/* Renderiza el detalle del turno */}
          <IsleroTurnoDetalleView selectedTurno={selectedTurno} />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex border-b border-slate-100 gap-6 text-xs font-black uppercase">
            <button
              onClick={() => setActiveTab('cerrados')}
              className={`pb-4 transition-colors border-b-2 ${activeTab === 'cerrados' ? 'border-zinc-900 text-zinc-900' : 'border-transparent text-slate-400 hover:text-slate-700'}`}
            >
              Turnos Cerrados
            </button>
            <button
              onClick={() => setActiveTab('devueltos')}
              className={`pb-4 transition-colors border-b-2 ${activeTab === 'devueltos' ? 'border-red-600 text-red-600' : 'border-transparent text-slate-400 hover:text-slate-700'}`}
            >
              Turnos Devueltos
            </button>
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
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-700">No hay turnos en esta sección</p>
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
                          ${Number(turno.total_reportado || 0).toLocaleString()}
                        </td>
                        <td className="p-4">
                          <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase border ${
                            turno.estado === 'devuelto' 
                              ? 'bg-red-50 text-red-600 border-red-200' 
                              : 'bg-emerald-50 text-emerald-600 border-emerald-200'
                          }`}>
                            {turno.estado}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          {turno.estado === 'devuelto' ? (
                            <button 
                              onClick={async (e) => {
                                e.stopPropagation();
                                try {
                                  const res = await shiftService.editShiftClosing(turno.id);
                                  if (res.status) {
                                    navigate(`/turnos-islero/${turno.id}/editar-cierre`, { state: { editData: res.data } });
                                  } else {
                                    showToast(res.message || 'No se pudo cargar la información para edición', 'error');
                                  }
                                } catch (error) {
                                  showToast('Error de conexión al obtener datos de edición', 'error');
                                }
                              }}
                              className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all inline-flex items-center gap-1.5 text-[9px] font-black uppercase shadow-sm"
                            >
                              Corregir Cierre
                            </button>
                          ) : (
                            <button 
                              onClick={() => setSelectedTurno(turno)}
                              className="px-4 py-2 bg-slate-100 group-hover:bg-zinc-900 group-hover:text-white rounded-xl text-slate-700 transition-all inline-flex items-center gap-1.5 text-[9px] font-black uppercase"
                            >
                              Ver Detalle
                            </button>
                          )}
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