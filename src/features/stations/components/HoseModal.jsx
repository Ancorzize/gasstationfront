import React, { useState, useEffect, useRef } from 'react';
import { X, Save, Loader2, Droplets, Hash, Search, Check } from 'lucide-react';
import { stationService } from '../services/stationService';
import { productService } from '../../products/services/productService';
import { useToast } from '../../../context/ToastContext';

export const HoseModal = ({ isOpen, onClose, onSave, hoseToEdit }) => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [pumps, setPumps] = useState([]);
  const [products, setProducts] = useState([]);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [showProductList, setShowProductList] = useState(false);
  const productListRef = useRef(null);

  const [formData, setFormData] = useState({
    nombre: '',
    codigo: '', 
    bomba_id: '',
    producto_id: ''
  });

  useEffect(() => {
    const loadInitialData = async () => {
      const resPumps = await stationService.getPumps();
      if (resPumps.status) setPumps(resPumps.data.items || []);
    };

    if (isOpen) {
      loadInitialData();
      if (hoseToEdit) {
        setFormData({
          nombre: hoseToEdit.nombre || '',
          codigo: hoseToEdit.codigo || '',
          bomba_id: hoseToEdit.bomba_id || '',
          producto_id: hoseToEdit.producto_id || ''
        });
        setSearchTerm(hoseToEdit.producto?.nombre || '');
      } else {
        setFormData({ nombre: '', codigo: '', bomba_id: '', producto_id: '' });
        setSearchTerm('');
      }
    }
  }, [hoseToEdit, isOpen]);


  useEffect(() => {
    const searchProducts = async () => {
      if (searchTerm.length < 2) {
        setProducts([]);
        return;
      }
      
      setSearching(true);
      try {
       
        const res = await productService.getProducts({ 
          search: searchTerm, 
          categoria: 'Combustibles' 
        });
        if (res.status) setProducts(res.data.items || []);
      } catch (e) {
        console.error("Error buscando productos", e);
      } finally {
        setSearching(false);
      }
    };

    const timeoutId = setTimeout(() => {
      if (showProductList) searchProducts();
    }, 400); 

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const selectProduct = (product) => {
    setFormData({ ...formData, producto_id: product.id });
    setSearchTerm(product.nombre);
    setShowProductList(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.producto_id) {
      showToast("Debes seleccionar un combustible válido de la lista", "error");
      return;
    }
    setLoading(true);
    try {
      const res = await stationService.saveHose(formData, hoseToEdit?.id);
      if (res.status) {
        showToast(res.message, "success");
        onSave();
        onClose();
      } else {
        showToast(res.message, "error");
      }
    } catch (error) {
      showToast("Error al procesar la solicitud", "error");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm text-left">
      <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100">
        <header className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-zinc-900 rounded-2xl flex items-center justify-center text-white">
              <Droplets size={20} />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">Configurar Manguera</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Asignación de producto y bomba</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:bg-white rounded-xl transition-colors"><X size={20} /></button>
        </header>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Código Interno</label>
              <div className="relative">
                <Hash className="absolute left-4 top-3.5 text-slate-300" size={16} />
                <input
                  type="text" required placeholder="M-001"
                  className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold outline-none focus:border-zinc-900 transition-all uppercase"
                  value={formData.codigo}
                  onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Nombre / Etiqueta</label>
              <div className="relative">
                <Droplets className="absolute left-4 top-3.5 text-slate-300" size={16} />
                <input
                  type="text" required placeholder="Manguera Norte"
                  className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold outline-none focus:border-zinc-900 transition-all uppercase"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Bomba / Isla Asignada</label>
            <select
              required
              className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold outline-none focus:border-zinc-900 transition-all uppercase appearance-none"
              value={formData.bomba_id}
              onChange={(e) => setFormData({ ...formData, bomba_id: e.target.value })}
            >
              <option value="">-- Seleccionar Bomba --</option>
              {pumps.map(p => (
                <option key={p.id} value={p.id}>{p.nombre} ({p.estacion?.nombre})</option>
              ))}
            </select>
          </div>

          <div className="space-y-2 relative" ref={productListRef}>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Buscar Combustible</label>
            <div className="relative">
              <Search className="absolute left-4 top-3.5 text-slate-300" size={16} />
              <input
                type="text"
                placeholder="Escribe el nombre del combustible..."
                className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold outline-none focus:border-zinc-900 transition-all uppercase"
                value={searchTerm}
                onFocus={() => setShowProductList(true)}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setShowProductList(true);
                  if (formData.producto_id) setFormData({...formData, producto_id: ''});
                }}
              />
              {searching && <Loader2 className="absolute right-4 top-3.5 animate-spin text-zinc-400" size={16} />}
            </div>

            {showProductList && searchTerm.length >= 2 && (
              <div className="absolute z-50 w-full mt-2 bg-white border border-slate-100 rounded-2xl shadow-xl max-h-48 overflow-y-auto">
                {products.length > 0 ? (
                  products.map(p => (
                    <button
                      key={p.id}
                      type="button"
                      className="w-full text-left px-6 py-3 text-[10px] font-bold uppercase hover:bg-slate-50 flex items-center justify-between"
                      onClick={() => selectProduct(p)}
                    >
                      <span>{p.nombre} <span className="text-slate-400 ml-2">[{p.codigo}]</span></span>
                      {formData.producto_id === p.id && <Check size={14} className="text-emerald-500" />}
                    </button>
                  ))
                ) : !searching ? (
                  <p className="p-4 text-[10px] text-slate-400 uppercase italic text-center">No se encontraron combustibles</p>
                ) : null}
              </div>
            )}
          </div>

          <div className="pt-4 flex gap-3">
            <button
              type="button" onClick={onClose}
              className="flex-1 py-4 rounded-2xl text-[10px] font-black uppercase text-slate-400 hover:bg-slate-50 transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit" disabled={loading}
              className="flex-[2] bg-zinc-900 text-white py-4 rounded-2xl text-[10px] font-black uppercase shadow-xl shadow-zinc-200 hover:bg-black transition-all flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
              Guardar Manguera
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};