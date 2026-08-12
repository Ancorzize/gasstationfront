import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AsyncSelect from 'react-select/async';
import debounce from 'lodash/debounce';
import { 
  X, ArrowLeftRight, Package, Home, 
  Loader2, CheckCircle 
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

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (isOpen) {
      loadWarehouses();
      setFormData({ producto_id: '', bodega_origen_id: '', bodega_destino_id: '', cantidad: '', observacion: '' });
      setSelectedProduct(null);
    }
  }, [isOpen]);

  const loadWarehouses = async () => {
    setLoading(true);
    try {
      const warRes = await warehouseService.getWarehouses();
      setWarehouses(warRes.data?.items || []);
    } catch (error) {
      showToast("Error al cargar bodegas", "error");
    } finally {
      setLoading(false);
    }
  };

  // Función ajustada a tu estructura de API
  const loadOptions = async (inputValue) => {
    if (!inputValue || inputValue.length < 2) return [];
    
    try {
      const res = await productService.getProducts({ search: inputValue, per_page: 10 });
      // Mapeo correcto basado en el JSON que enviaste
      return (res.data?.items || []).map(p => ({
        value: p.id,
        label: `${p.codigo} - ${p.nombre}`
      }));
    } catch (error) {
      console.error("Error buscando productos:", error);
      return [];
    }
  };

  const debouncedLoadOptions = useCallback(
    debounce((inputValue, callback) => {
      loadOptions(inputValue).then(callback);
    }, 500),
    []
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.bodega_origen_id === formData.bodega_destino_id) {
      return showToast("La bodega destino debe ser diferente al origen", "error");
    }

    setSubmitting(true);
    try {
      const res = await inventoryService.createTransfer(formData);
      if (res.status) {
        showToast(res.message, "success");
        onSave();
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
            <div className="p-6 border-b flex justify-between items-center bg-white sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-zinc-900 text-white flex items-center justify-center shadow-lg shadow-zinc-200">
                  <ArrowLeftRight size={20} />
                </div>
                <div>
                  <h3 className="font-black text-slate-800 text-sm uppercase">Registrar Traslado</h3>
                </div>
              </div>
              <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-50 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Producto</label>
                <div className="relative">
                  <Package className="absolute left-4 top-3.5 text-slate-300 z-10" size={16} />
                  <AsyncSelect
                    cacheOptions
                    loadOptions={debouncedLoadOptions}
                    placeholder="Buscar por código o nombre..."
                    value={selectedProduct}
                    onChange={(option) => {
                      setSelectedProduct(option);
                      setFormData({...formData, producto_id: option?.value || ''});
                    }}
                    styles={{
                      control: (base) => ({ 
                        ...base, 
                        paddingLeft: '32px', 
                        borderRadius: '1rem', 
                        backgroundColor: '#f8fafc', 
                        borderColor: '#f1f5f9',
                        paddingTop: '4px',
                        paddingBottom: '4px'
                      })
                    }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Bodega Origen</label>
                  <select required className="w-full px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm outline-none"
                    value={formData.bodega_origen_id} onChange={e => setFormData({...formData, bodega_origen_id: e.target.value})}>
                    <option value="">Seleccione...</option>
                    {warehouses.map(w => <option key={w.id} value={w.id}>{w.nombre}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Bodega Destino</label>
                  <select required className="w-full px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm outline-none"
                    value={formData.bodega_destino_id} onChange={e => setFormData({...formData, bodega_destino_id: e.target.value})}>
                    <option value="">Seleccione...</option>
                    {warehouses.map(w => <option key={w.id} value={w.id}>{w.nombre}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input required type="number" step="any" className="md:col-span-1 w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm"
                  value={formData.cantidad} onChange={e => setFormData({...formData, cantidad: e.target.value})} placeholder="Cantidad" />
                <input className="md:col-span-2 w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm"
                  value={formData.observacion} onChange={e => setFormData({...formData, observacion: e.target.value})} placeholder="Observación..." />
              </div>

              <button type="submit" disabled={submitting} className="w-full py-4 rounded-2xl bg-zinc-900 text-white font-black text-[10px] uppercase transition-all hover:bg-black disabled:opacity-50">
                {submitting ? <Loader2 className="animate-spin mx-auto" size={16} /> : "Confirmar Traslado"}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};