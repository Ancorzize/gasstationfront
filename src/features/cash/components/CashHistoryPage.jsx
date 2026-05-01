import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx'; 
import { 
  ArrowLeft, Loader2, Search, History, Download 
} from 'lucide-react';
import { cashService } from '../services/cashService';
import { useToast } from '../../../context/ToastContext';
import { getTodayStr } from '../../../shared/utils/dateUtils';

export const CashHistoryPage = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [dateRange, setDateRange] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return {
      fecha_desde: d.toISOString().split('T')[0],
      fecha_hasta: getTodayStr()
    };
  });

  const loadHistory = async () => {
    setLoading(true);
    try {
      const res = await cashService.getHistory({
        fecha_desde: dateRange.fecha_desde,
        fecha_hasta: dateRange.fecha_hasta
      });
      if (res.status) setItems(res.data.items || []);
    } catch (e) {
      showToast("Error al cargar el histórico", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadHistory(); }, [dateRange]);

  const filteredData = useMemo(() => {
    return items.filter(i => 
      i.tipo_caja?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.estado?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.usuario_apertura?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.observacion_apertura?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, items]);

  const handleExport = () => {
    if (filteredData.length === 0) {
      showToast("No hay datos para exportar", "warning");
      return;
    }

    const dataToExport = filteredData.map(c => ({
      ID: c.id,
      'Tipo Caja': c.tipo_caja,
      'Estado': c.estado,
      'Fecha Apertura': c.fecha_apertura,
      'Fecha Cierre': c.fecha_cierre || 'N/A',
      'Monto Apertura': parseFloat(c.monto_apertura),
      'Monto Cierre Sistema': parseFloat(c.monto_cierre_sistema || 0),
      'Monto Cierre Real': parseFloat(c.monto_cierre_real || 0),
      'Diferencia': parseFloat(c.diferencia_cierre || 0),
      'Usuario Apertura': c.usuario_apertura?.name,
      'Usuario Cierre': c.usuario_cierre?.name || 'N/A',
      'Observación Apertura': c.observacion_apertura,
      'Observación Cierre': c.observacion_cierre
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Histórico");
    XLSX.writeFile(workbook, `Historico_Cajas_${new Date().toLocaleDateString()}.xlsx`);
    showToast("Archivo exportado correctamente", "success");
  };

  return (
    <div className="p-4 md:p-8 max-w-[95rem] mx-auto space-y-6 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/caja')} className="p-3 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-zinc-900 shadow-sm transition-all">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Histórico de Cajas</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Consultas de aperturas y cierres</p>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
          <input type="date" className="px-4 py-2 bg-slate-50 rounded-xl text-[10px] font-black uppercase outline-none" 
            value={dateRange.fecha_desde} onChange={e => setDateRange({...dateRange, fecha_desde: e.target.value})} />
          <span className="text-slate-300 font-bold">AL</span>
          <input type="date" className="px-4 py-2 bg-slate-50 rounded-xl text-[10px] font-black uppercase outline-none" 
            value={dateRange.fecha_hasta} onChange={e => setDateRange({...dateRange, fecha_hasta: e.target.value})} />
        </div>
      </header>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b flex justify-between items-center bg-slate-50/50 gap-4">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
            <input type="text" placeholder="Buscar..." className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase outline-none focus:border-zinc-900" 
              value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
          
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white rounded-xl font-black text-[10px] uppercase hover:bg-emerald-700 transition-all shadow-md"
          >
            <Download size={14} /> Exportar
          </button>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-20 text-center text-slate-400"><Loader2 className="animate-spin mx-auto mb-2" /> Cargando...</div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/50">
                  <th className="p-4">ID</th><th className="p-4">Tipo</th><th className="p-4">Estado</th>
                  <th className="p-4">F. Apertura</th><th className="p-4">F. Cierre</th>
                  <th className="p-4 text-right">Monto Ap.</th><th className="p-4 text-right">Cierre Sist.</th>
                  <th className="p-4 text-right">Cierre Real</th><th className="p-4 text-right">Diferencia</th>
                  <th className="p-4">Usuario Ap.</th><th className="p-4">Usuario Cie.</th>
                  <th className="p-4">Obs. Ap.</th><th className="p-4">Obs. Cie.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredData.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50/50 text-[10px] font-bold text-slate-700 uppercase">
                    <td className="p-4">{c.id}</td>
                    <td className="p-4"><span className={`px-2 py-1 rounded-md ${c.tipo_caja === 'efectivo' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>{c.tipo_caja}</span></td>
                    <td className="p-4"><span className={`px-2 py-1 rounded-md ${c.estado === 'abierta' ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-600'}`}>{c.estado}</span></td>
                    <td className="p-4">{new Date(c.fecha_apertura).toLocaleString()}</td>
                    <td className="p-4">{c.fecha_cierre ? new Date(c.fecha_cierre).toLocaleString() : '---'}</td>
                    <td className="p-4 text-right">$ {parseFloat(c.monto_apertura).toLocaleString('es-CO')}</td>
                    <td className="p-4 text-right">$ {parseFloat(c.monto_cierre_sistema || 0).toLocaleString('es-CO')}</td>
                    <td className="p-4 text-right">$ {parseFloat(c.monto_cierre_real || 0).toLocaleString('es-CO')}</td>
                    <td className={`p-4 text-right font-black ${parseFloat(c.diferencia_cierre) > 0 ? 'text-emerald-600' : parseFloat(c.diferencia_cierre) < 0 ? 'text-red-600' : 'text-slate-600'}`}>
                      $ {parseFloat(c.diferencia_cierre || 0).toLocaleString('es-CO')}
                    </td>
                    <td className="p-4">{c.usuario_apertura?.name}</td>
                    <td className="p-4">{c.usuario_cierre?.name || '---'}</td>
                    <td className="p-4 max-w-[150px] truncate">{c.observacion_apertura || '-'}</td>
                    <td className="p-4 max-w-[150px] truncate">{c.observacion_cierre || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};