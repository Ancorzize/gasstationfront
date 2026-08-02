import React, { useEffect, useState } from 'react';
import { Loader2, X, Fuel, ShieldAlert } from 'lucide-react';
import { shiftService } from '../services/shiftService';
import { useToast } from '../../../context/ToastContext';

export const ShiftReadingsModal = ({ turnoId, isOpen, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [lecturas, setLecturas] = useState([]);
  const { showToast } = useToast();

  useEffect(() => {
    if (isOpen && turnoId) {
      const fetchLecturas = async () => {
        setLoading(true);
        try {
          const res = await shiftService.getShiftReadings(turnoId);
          if (res.status) {
            setLecturas(res.data.items || []);
          } else {
            showToast("No se pudieron cargar las lecturas", "error");
            setLecturas([]);
          }
        } catch (e) {
          showToast("Error de conexión al consultar lecturas", "error");
          setLecturas([]);
        } finally {
          setLoading(false);
        }
      };
      fetchLecturas();
    }
  }, [isOpen, turnoId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-5xl rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header del Modal */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-zinc-900 text-white rounded-2xl">
              <Fuel size={20} />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-800 uppercase tracking-tight">Lecturas del Turno #{turnoId}</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Detalle de mangueras, galones y ventas</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Contenido del Modal */}
        <div className="p-6 overflow-y-auto flex-1 text-left">
          {loading ? (
            <div className="py-20 text-center">
              <Loader2 className="animate-spin mx-auto text-slate-300" size={36} />
              <p className="text-xs font-bold text-slate-400 uppercase mt-3 tracking-widest">Cargando lecturas...</p>
            </div>
          ) : lecturas.length > 0 ? (
            <div className="overflow-x-auto border border-slate-100 rounded-2xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Manguera / Bomba</th>
                    <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Producto</th>
                    <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">L. Inicial</th>
                    <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">L. Final</th>
                    <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Galones</th>
                    <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Precio Galón</th>
                    <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Total Venta</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {lecturas.map((lec) => (
                    <tr key={lec.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className="text-xs font-black text-slate-700 uppercase">{lec.manguera?.nombre} ({lec.manguera?.codigo})</span>
                          <span className="text-[9px] font-bold text-slate-400 uppercase">{lec.bomba?.nombre}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-full text-[10px] font-black uppercase">
                          {lec.producto?.nombre}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-xs font-bold text-slate-600">
                        {Number(lec.lectura_inicial).toLocaleString('es-CO', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 text-right text-xs font-bold text-slate-600">
                        {Number(lec.lectura_final).toLocaleString('es-CO', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 text-right text-xs font-black text-emerald-600">
                        {Number(lec.galones_vendidos).toLocaleString('es-CO', { minimumFractionDigits: 2 })} gal
                      </td>
                      <td className="px-4 py-3 text-right text-xs font-bold text-slate-500">
                        $ {Number(lec.precio_galon).toLocaleString('es-CO')}
                      </td>
                      <td className="px-4 py-3 text-right text-xs font-black text-zinc-900">
                        $ {Number(lec.total_venta).toLocaleString('es-CO')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-16 text-center text-slate-400">
              <ShieldAlert className="mx-auto text-slate-300 mb-2" size={32} />
              <p className="text-xs font-bold uppercase italic">No se encontraron registros de lecturas para este turno</p>
            </div>
          )}
        </div>

        {/* Footer del Modal */}
        <div className="flex items-center justify-end px-6 py-4 border-t border-slate-100 bg-slate-50/50">
          <button 
            onClick={onClose}
            className="px-6 py-2.5 bg-zinc-900 text-white rounded-xl font-black text-[10px] uppercase hover:bg-black transition-all shadow-md"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};