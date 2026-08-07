import React, { useState } from 'react';
import * as XLSX from 'xlsx'; // Importamos la librería
import { motion, AnimatePresence } from 'framer-motion';
import { X, FileSpreadsheet, Upload, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { inventoryService } from '../services/inventoryService';
import { useToast } from '../../../context/ToastContext';

export const ImportInventoryModal = ({ isOpen, onClose, onImportSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [previewData, setPreviewData] = useState([]); // Para mostrar al usuario qué se leyó
  const { showToast } = useToast();

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        
    
        const rawData = XLSX.utils.sheet_to_json(ws);
        
  
        const formattedData = rawData.map(row => {
     
        const getValue = (keyName) => {
            const foundKey = Object.keys(row).find(k => 
            k.trim().toLowerCase() === keyName.toLowerCase()
            );
            return foundKey ? row[foundKey] : null;
        };

        return {
            codigo_producto: getValue('codigo_producto')?.toString().trim() || '',
            bodega_codigo: getValue('bodega_codigo')?.toString().trim() || '',
            cantidad: Number(getValue('cantidad')) || 0,
            observacion: getValue('observacion')?.toString().trim() || ''
        };
        });

      
        const cleanData = formattedData.filter(item => item.codigo_producto && item.bodega_codigo);

        setPreviewData(cleanData);
    };
    reader.readAsBinaryString(file);
    };

  const handleProcessImport = async () => {
    if (previewData.length === 0) return showToast("No hay datos para importar", "error");
    
    setLoading(true);
    try {
      const res = await inventoryService.importInventoryJSON(previewData);
      if (res.status) {
        setResult(res.data);
        showToast(res.message, "success");
        if (onImportSuccess) onImportSuccess();
      } else {
        showToast(res.message, "error");
      }
    } catch (error) {
      showToast("Error al procesar la importación", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose} className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm" />
          
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
            className="relative bg-white w-full max-w-3xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="p-6 border-b flex justify-between items-center bg-white sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <FileSpreadsheet size={20} />
                </div>
                <h3 className="font-black text-slate-800 text-sm uppercase">Importación Inteligente</h3>
              </div>
              <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-50 rounded-full"><X size={20} /></button>
            </div>

            <div className="p-8 overflow-y-auto">
              {!result ? (
                <div className="space-y-6">
                  {previewData.length === 0 ? (
                    <label className="group relative border-2 border-dashed border-slate-200 rounded-[2rem] p-12 flex flex-col items-center justify-center gap-4 hover:border-emerald-400 hover:bg-emerald-50/30 transition-all cursor-pointer">
                      <input type="file" className="hidden" accept=".xlsx, .xls, .csv" onChange={handleFileChange} />
                      <div className="w-16 h-16 rounded-3xl bg-slate-50 group-hover:bg-white flex items-center justify-center text-slate-400 group-hover:text-emerald-500 transition-all">
                        <Upload size={28} />
                      </div>
                      <div className="text-center">
                        <p className="text-xs font-black text-slate-700 uppercase">Cargar archivo Excel o CSV</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">El navegador procesará los datos localmente</p>
                      </div>
                    </label>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Vista previa de datos ({previewData.length} filas)</p>
                        <button onClick={() => setPreviewData([])} className="text-[10px] font-bold text-red-500 uppercase hover:underline">Cambiar archivo</button>
                      </div>
                      <div className="max-h-60 overflow-y-auto border border-slate-100 rounded-3xl">
                        <table className="w-full text-[10px] text-left">
                          <thead className="bg-slate-50 sticky top-0">
                            <tr>
                              <th className="px-4 py-3 uppercase font-black text-slate-400">Producto</th>
                              <th className="px-4 py-3 uppercase font-black text-slate-400">Bodega</th>
                              <th className="px-4 py-3 uppercase font-black text-slate-400">Cant.</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                            {previewData.slice(0, 5).map((row, i) => (
                              <tr key={i}>
                                <td className="px-4 py-2 font-bold text-slate-600">{row.codigo_producto}</td>
                                <td className="px-4 py-2 font-bold text-slate-600">{row.bodega_codigo}</td>
                                <td className="px-4 py-2 font-bold text-emerald-600">{row.cantidad}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {previewData.length > 5 && <div className="p-3 text-center text-[9px] text-slate-400 font-bold uppercase bg-slate-50/50">Y {previewData.length - 5} filas más...</div>}
                      </div>
                      <button onClick={handleProcessImport} disabled={loading} className="w-full py-4 bg-zinc-900 text-white rounded-2xl font-black text-xs uppercase hover:bg-black transition-all flex items-center justify-center gap-2 shadow-xl">
                        {loading ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
                        Confirmar e Importar {previewData.length} Registros
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                   {/* ... (Sección de resultados igual a la anterior, usando result.procesadas, exitosas, fallidas y errores) */}
                   <div className="grid grid-cols-3 gap-4 text-center font-black uppercase tracking-tighter">
                      <div className="bg-slate-50 p-4 rounded-3xl"><p className="text-[9px] text-slate-400">Leídas</p><p className="text-xl">{result.procesadas}</p></div>
                      <div className="bg-emerald-50 p-4 rounded-3xl text-emerald-600"><p className="text-[9px]">Éxito</p><p className="text-xl">{result.exitosas}</p></div>
                      <div className="bg-red-50 p-4 rounded-3xl text-red-600"><p className="text-[9px]">Error</p><p className="text-xl">{result.fallidas}</p></div>
                   </div>

                   {result.errores?.length > 0 && (
                     <div className="max-h-60 overflow-y-auto border border-red-50 border-t-red-100 rounded-3xl">
                        <table className="w-full text-[9px] text-left">
                          <thead className="bg-red-50 text-red-600">
                            <tr><th className="px-4 py-2">Fila</th><th className="px-4 py-2">Producto</th><th className="px-4 py-2">Error</th></tr>
                          </thead>
                          <tbody>
                            {result.errores.map((err, i) => (
                              <tr key={i} className="border-b border-red-50 text-red-500 font-bold uppercase tracking-tighter">
                                <td className="px-4 py-2">#{err.fila}</td>
                                <td className="px-4 py-2">{err.codigo_producto}</td>
                                <td className="px-4 py-2">{err.error}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                     </div>
                   )}
                   <button onClick={() => {setResult(null); setPreviewData([]);}} className="w-full py-4 bg-zinc-900 text-white rounded-2xl font-black text-xs uppercase">Entendido</button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};