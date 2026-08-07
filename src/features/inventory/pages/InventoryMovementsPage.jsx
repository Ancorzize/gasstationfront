import React, { useEffect, useState } from 'react';
import { 
  ArrowLeftRight, Search, Loader2, 
  FileSpreadsheet, History 
} from 'lucide-react';
import { inventoryService } from '../services/inventoryService';
import { ImportInventoryModal } from '../components/ImportInventoryModal';
import { TransferModal } from '../components/TransferModal'; 
import { useToast } from '../../../context/ToastContext';

export const InventoryMovementsPage = () => {
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false); // Estado para controlar el modal
  const { showToast } = useToast();

  const fetchMovements = async () => {
    setLoading(true);
    try {
      const res = await inventoryService.getMovements();
      if (res.status) setMovements(res.data.items);
    } catch (e) { 
      showToast("Error al cargar historial", "error"); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { fetchMovements(); }, []);

  return (
    <div className="p-4 md:p-8 space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase flex items-center gap-2">
            Movimientos de Stock
          </h2>
          <p className="text-slate-500 text-xs font-medium uppercase tracking-tighter">Control de traslados y entradas de inventario</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button 
            onClick={() => setIsImportOpen(true)} 
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-emerald-50 text-emerald-700 px-6 py-3 rounded-2xl font-black text-[10px] uppercase hover:bg-emerald-100 transition-all border border-emerald-100 shadow-sm"
          >
            <FileSpreadsheet size={16} /> Importar Excel
          </button>
          
          {/* BOTÓN ACTIVADO */}
          <button 
            onClick={() => setIsTransferOpen(true)} 
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-zinc-900 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase hover:bg-black transition-all shadow-xl shadow-zinc-200"
          >
            <ArrowLeftRight size={16} /> Nuevo Traslado
          </button>
        </div>
      </header>

      {/* Tabla de Movimientos */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/50">
              <tr>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Fecha / Usuario</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Producto</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tipo / Ruta</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Cantidad</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Detalle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan="5" className="p-20 text-center">
                    <Loader2 className="animate-spin mx-auto text-slate-300" size={40} />
                  </td>
                </tr>
              ) : movements.length > 0 ? (
                movements.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-500 uppercase">
                          {m.usuario?.name.substring(0, 2)}
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-700 uppercase tracking-tight">{m.usuario?.name}</p>
                          <p className="text-[9px] font-bold text-slate-400">{new Date(m.created_at).toLocaleString()}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-slate-700 uppercase">{m.producto?.nombre}</span>
                        <span className="text-[9px] font-bold text-slate-400 tracking-widest">{m.producto?.codigo}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border ${
                          m.tipo_movimiento === 'traslado' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                        }`}>
                          {m.tipo_movimiento}
                        </span>
                        <div className="flex items-center text-[9px] font-bold text-slate-400 uppercase">
                          {m.bodega_origen?.nombre || 'Proveedor'} 
                          <ArrowLeftRight size={10} className="mx-1 text-slate-300" />
                          {m.bodega_destino?.nombre}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm font-black text-zinc-900 tracking-tight">
                        {parseFloat(m.cantidad).toLocaleString('es-CO')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                       <p className="text-[10px] text-slate-400 font-medium italic max-w-[150px] truncate ml-auto">
                        {m.observacion || '-'}
                       </p>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="p-10 text-center text-slate-400 italic text-xs uppercase font-black">
                    No hay movimientos registrados
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODALES */}
      <ImportInventoryModal 
        isOpen={isImportOpen} 
        onClose={() => setIsImportOpen(false)} 
        onImportSuccess={fetchMovements} 
      />

      <TransferModal 
        isOpen={isTransferOpen} 
        onClose={() => setIsTransferOpen(false)} 
        onSave={fetchMovements} 
      />
    </div>
  );
};