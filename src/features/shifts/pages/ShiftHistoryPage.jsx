import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { 
  Search, Loader2, Calendar, Download, Eye 
} from 'lucide-react';
import { shiftService } from '../services/shiftService';
import { useToast } from '../../../context/ToastContext';
import { getTodayStr } from '../../../shared/utils/dateUtils';
import { ShiftReadingsModal } from '../components/ShiftReadingsModal'; 

export const ShiftHistoryPage = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState(getTodayStr());
  const [endDate, setEndDate] = useState(getTodayStr());

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTurnoId, setSelectedTurnoId] = useState(null);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await shiftService.getShiftHistory({
        fecha_desde: startDate,
        fecha_hasta: endDate
      });
      if (res.status) {
        setShifts(res.data.items || res.data || []);
      }
    } catch (e) {
      showToast("Error al cargar historial de turnos", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchHistory(); 
  }, [startDate, endDate]);

  const filteredShifts = shifts.filter(s => {
    const term = searchTerm.toLowerCase();
    return (
      s.id?.toString().includes(term) ||
      s.estacion?.nombre?.toLowerCase().includes(term) ||
      s.usuario?.name?.toLowerCase().includes(term) ||
      s.estado?.toLowerCase().includes(term) ||
      s.fecha_apertura?.includes(term)
    );
  });

  const handleOpenModal = (turnoId) => {
    setSelectedTurnoId(turnoId);
    setIsModalOpen(true);
  };

  const handleExport = () => {
    if (filteredShifts.length === 0) {
      showToast("No hay datos para exportar", "info");
      return;
    }

    const dataToExport = filteredShifts.map(s => ({
      'ID Turno': s.id,
      'Estación': s.estacion?.nombre || 'N/A',
      'Código Estación': s.estacion?.codigo || 'N/A',
      'Islero': s.usuario?.name || 'N/A',
      'Email Islero': s.usuario?.email || 'N/A',
      'Fecha Apertura': s.fecha_apertura,
      'Fecha Cierre': s.fecha_cierre || 'Abierto',
      'Estado': s.estado?.toUpperCase(),
      'Observación Apertura': s.observacion_apertura || '',
      'Total Sistema': parseFloat(s.total_sistema || 0),
      'Total Reportado': parseFloat(s.total_reportado || 0),
      'Balance Final': parseFloat(s.balance_final || 0),
      'Observación Cierre': s.observacion_cierre || ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Turnos Islero");
    
    XLSX.writeFile(workbook, `Reporte_Turnos_Islero_${startDate}_al_${endDate}.xlsx`);
    showToast("Archivo Excel generado con éxito", "success");
  };

  const StatusBadge = ({ status }) => {
    const isClosed = status === 'cerrado';
    return (
      <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase border ${isClosed ? 'bg-slate-100 text-slate-600 border-slate-200' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="p-4 md:p-8 space-y-6 text-left relative">
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight uppercase">Turnos de Islero</h2>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Auditoría de cierres y balances</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button 
            onClick={handleExport}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-2xl font-bold text-[10px] md:text-xs uppercase hover:bg-emerald-700 transition-all shadow-md"
          >
            <Download size={16} /> <span className="hidden sm:inline">Exportar</span>
          </button>

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

          <div className="relative group">
            <Search className="absolute left-4 top-3 text-slate-400 group-focus-within:text-zinc-900 transition-colors" size={18} />
            <input 
              type="text" placeholder="Buscar..." 
              className="w-full md:w-48 pl-12 pr-4 py-3 bg-white border border-slate-100 rounded-2xl text-xs outline-none focus:border-zinc-900 shadow-sm transition-all"
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <button 
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 px-6 py-3 bg-zinc-900 text-white rounded-2xl font-black text-[10px] uppercase hover:bg-black shadow-xl transition-all"
          >
            Volver
          </button>
        </div>
      </header>

      {/* TABLA DE DATOS */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="max-h-[60vh] overflow-y-auto overflow-x-auto relative">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-slate-50 z-10">
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-5 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Turno / Estación</th>
                <th className="px-5 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Islero</th>
                <th className="px-5 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Apertura</th>
                <th className="px-5 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Obs. Apertura</th>
                <th className="px-5 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Estado</th>
                <th className="px-5 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Sistema</th>
                <th className="px-5 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Balance</th>
                <th className="px-5 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-20 text-center">
                    <Loader2 className="animate-spin mx-auto text-slate-200" size={32} />
                  </td>
                </tr>
              ) : filteredShifts.length > 0 ? (
                filteredShifts.map((s) => {
                  const balance = Number(s.balance_final || 0);
                  return (
                    <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex flex-col">
                          <span className="text-xs font-black text-slate-700 uppercase">Turno #{s.id}</span>
                          <span className="text-[9px] font-bold text-slate-400 uppercase">{s.estacion?.nombre}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-col">
                          <span className="text-xs font-black text-slate-700 uppercase">{s.usuario?.name || 'N/A'}</span>
                          <span className="text-[9px] font-bold text-slate-400">{s.usuario?.email}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-[10px] font-bold text-slate-400 uppercase">
                        {s.fecha_apertura ? new Date(s.fecha_apertura).toLocaleString() : ''}
                      </td>
                      <td className="px-5 py-4 text-[10px] text-slate-500 italic max-w-[150px] truncate">
                        {s.observacion_apertura || '-'}
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge status={s.estado} />
                      </td>
                      <td className="px-5 py-4 text-right text-xs font-black text-slate-700">
                        $ {Number(s.total_sistema || 0).toLocaleString('es-CO')}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <span className={`text-xs font-black ${balance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                          {balance >= 0 ? '+' : ''} $ {balance.toLocaleString('es-CO')}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <button 
                          onClick={() => handleOpenModal(s.id)}
                          className="p-2 text-slate-400 hover:text-zinc-900 hover:bg-slate-100 rounded-xl transition-all"
                        >
                          <Eye size={18} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="8" className="py-20 text-center text-slate-400 text-xs font-bold uppercase italic">
                    No se encontraron turnos en este rango de fechas
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ShiftReadingsModal 
        turnoId={selectedTurnoId} 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </div>
  );
};