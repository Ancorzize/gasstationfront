import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, ArrowLeftRight, Package, Home, 
  Info, Loader2, AlertTriangle, CheckCircle 
} from 'lucide-react';
import { inventoryService } from '../services/inventoryService';
import { warehouseService } from '../../warehouses/services/warehouseService';
import { productService } from '../../products/services/productService';
import { useToast } from '../../../context/ToastContext';

export const TransferModal = ({ isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    producto_id: '',
    bodega_origen_id: '',
    bodega_destino_id: '',
    cantidad: '',
    observacion: ''
  });

  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (isOpen) {
      loadInitialData();
      setFormData({
        producto_id: '', bodega_origen_id: '', bodega_destino_id: '',
        cantidad: '', observacion: ''
      });
    }
  }, [isOpen]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [prodRes, warRes] = await Promise.all([
        productService.getProducts({ per_page: 100 }),
        warehouseService.getWarehouses()
      ]);
      setProducts(prodRes.data?.items || []);
      setWarehouses(warRes.data?.items || []);
    } catch (error) {
      showToast("Error al cargar datos necesarios", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validación básica en frontend
    if (formData.bodega_origen_id === formData.bodega_destino_id) {
      return showToast("La bodega destino debe ser diferente al origen", "error");
    }

    setSubmitting(true);
    try {
      const res = await inventoryService.createTransfer(formData);
      if (res.status) {
        showToast(res.message, "success");
        onSave(); // Refrescar lista de movimientos
        onClose();
      } else {
        showToast(res.message, "error");
      }
    } catch (error) {
      showToast("Error al registrar movimiento", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-0 md:p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose} className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm" />
          
          <motion.div 
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            className="relative bg-white w-full h-full md:h-auto md:max-w-xl md:rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-6 border-b flex justify-between items-center bg-white sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-zinc-900 text-white flex items-center justify-center shadow-lg shadow-zinc-200">
                  <ArrowLeftRight size={20} />
                </div>
                <div>
                  <h3 className="font-black text-slate-800 text-sm uppercase">Registrar Traslado</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Movimiento interno de productos</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-50 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            {loading ? (
              <div className="p-20 flex flex-col items-center justify-center gap-4 text-slate-300">
                <Loader2 className="animate-spin" size={40} />
                <p className="text-[10px] font-black uppercase tracking-widest">Cargando existencias...</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto custom-scrollbar-light">
                
                {/* Selector de Producto */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Producto a trasladar</label>
                  <div className="relative">
                    <Package className="absolute left-4 top-3.5 text-slate-300" size={16} />
                    <select 
                      required className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm outline-none focus:border-zinc-900 appearance-none"
                      value={formData.producto_id} onChange={e => setFormData({...formData, producto_id: e.target.value})}>
                      <option value="">Seleccione un producto...</option>
                      {products.map(p => <option key={p.id} value={p.id}>{p.codigo} - {p.nombre}</option>)}
                    </select>
                  </div>
                </div>

                {/* Bodegas */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Bodega Origen</label>
                    <div className="relative">
                      <Home className="absolute left-4 top-3.5 text-slate-300" size={16} />
                      <select 
                        required className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm outline-none focus:border-zinc-900 appearance-none"
                        value={formData.bodega_origen_id} onChange={e => setFormData({...formData, bodega_origen_id: e.target.value})}>
                        <option value="">Origen...</option>
                        {warehouses.map(w => <option key={w.id} value={w.id}>{w.nombre}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Bodega Destino</label>
                    <div className="relative">
                      <Home className="absolute left-4 top-3.5 text-slate-300" size={16} />
                      <select 
                        required className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm outline-none focus:border-zinc-900 appearance-none"
                        value={formData.bodega_destino_id} onChange={e => setFormData({...formData, bodega_destino_id: e.target.value})}>
                        <option value="">Destino...</option>
                        {warehouses.map(w => <option key={w.id} value={w.id}>{w.nombre}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Cantidad y Observación */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                  <div className="space-y-1.5 md:col-span-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Cantidad</label>
                    <input 
                      required type="number" step="any" min="0.01" 
                      className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:border-zinc-900 outline-none"
                      value={formData.cantidad} onChange={e => setFormData({...formData, cantidad: e.target.value})} placeholder="0.00" />
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Observación</label>
                    <input 
                      className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:border-zinc-900 outline-none"
                      value={formData.observacion} onChange={e => setFormData({...formData, observacion: e.target.value})} placeholder="Ej: Traslado por falta de stock..." />
                  </div>
                </div>

                {formData.bodega_origen_id && formData.bodega_origen_id === formData.bodega_destino_id && (
                  <div className="p-4 bg-orange-50 border border-orange-100 rounded-2xl flex items-center gap-3 text-orange-700 animate-pulse">
                    <AlertTriangle size={18} />
                    <p className="text-[10px] font-black uppercase">¡Error! Las bodegas no pueden ser iguales.</p>
                  </div>
                )}

                {/* Botones */}
                <div className="pt-4 flex gap-3">
                  <button type="button" onClick={onClose} className="flex-1 py-4 rounded-2xl border border-slate-100 text-slate-400 font-black text-[10px] uppercase hover:bg-slate-50 transition-all">
                    Descartar
                  </button>
                  <button 
                    type="submit" disabled={submitting || (formData.bodega_origen_id === formData.bodega_destino_id)}
                    className="flex-1 py-4 rounded-2xl bg-zinc-900 text-white font-black text-[10px] uppercase hover:bg-black transition-all flex items-center justify-center gap-2 shadow-xl shadow-zinc-200 disabled:opacity-50"
                  >
                    {submitting ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle size={16} />}
                    Confirmar Traslado
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};