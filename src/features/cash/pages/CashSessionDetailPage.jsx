import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { ArrowLeft, Loader2, ArrowUpCircle, ArrowDownCircle, Download } from 'lucide-react';
import { cashService } from '../services/cashService';
import { useToast } from '../../../context/ToastContext';

export const CashSessionDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMovements = async () => {
      setLoading(true);
      try {
        const res = await cashService.getMovements({ caja_id: id });
        if (res.status) {
          setMovements(res.data.items || []);
        }
      } catch (e) {
        showToast("Error al cargar movimientos", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchMovements();
  }, [id]);

  const handleExport = () => {
    if (movements.length === 0) {
      showToast("No hay movimientos para exportar", "warning");
      return;
    }

    const dataToExport = movements.map(m => ({
      "ID": m.id,
      "Fecha": new Date(m.fecha_movimiento).toLocaleString(),
      "Tipo Movimiento": m.tipo_movimiento,
      "Descripción": m.descripcion,
      "Categoría": m.categoria_movimiento,
      "Origen": `${m.origen_modulo} #${m.origen_id}`,
      "Medio Pago": m.medio_pago,
      "Usuario": m.usuario?.name,
      "Monto": parseFloat(m.monto)
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Movimientos");
    XLSX.writeFile(workbook, `Detalle_Caja_${id}_${new Date().toLocaleDateString()}.xlsx`);
    showToast("Exportado correctamente", "success");
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      <header className="flex justify-between items-center gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/caja/historico')} className="p-3 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-zinc-900 shadow-sm transition-all">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Auditoría Sesión #{id}</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Detalle técnico de movimientos</p>
          </div>
        </div>

        <button 
          onClick={handleExport}
          className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase hover:bg-emerald-700 transition-all shadow-md"
        >
          <Download size={14} /> Exportar
        </button>
      </header>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-slate-400" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/50 border-b border-slate-100">
                  <th className="p-4">ID</th>
                  <th className="p-4">Fecha</th>
                  <th className="p-4">Tipo</th>
                  <th className="p-4">Descripción / Categoría</th>
                  <th className="p-4">Origen</th>
                  <th className="p-4">Medio Pago</th>
                  <th className="p-4">Usuario</th>
                  <th className="p-4 text-right">Monto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {movements.length > 0 ? movements.map((mov) => (
                  <tr key={mov.id} className="hover:bg-slate-50/50 transition-colors text-[10px] text-slate-600 font-bold uppercase">
                    <td className="p-4 text-slate-400">#{mov.id}</td>
                    <td className="p-4 whitespace-nowrap">
                      {new Date(mov.fecha_movimiento).toLocaleDateString()}
                      <span className="block text-[8px] text-slate-400">{new Date(mov.fecha_movimiento).toLocaleTimeString()}</span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-lg ${mov.tipo_movimiento === 'ingreso' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                        {mov.tipo_movimiento}
                      </span>
                    </td>
                    <td className="p-4">
                      <p className="text-slate-800">{mov.descripcion}</p>
                      <p className="text-[8px] text-slate-400">{mov.categoria_movimiento}</p>
                    </td>
                    <td className="p-4 text-slate-500 font-mono">
                      {mov.origen_modulo} #{mov.origen_id}
                    </td>
                    <td className="p-4 text-slate-700">{mov.medio_pago}</td>
                    <td className="p-4 text-slate-700">{mov.usuario?.name}</td>
                    <td className="p-4 text-right font-black text-slate-900">
                      $ {parseFloat(mov.monto).toLocaleString('es-CO')}
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan="8" className="p-20 text-center text-slate-400 italic">No hay movimientos registrados en esta sesión.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};