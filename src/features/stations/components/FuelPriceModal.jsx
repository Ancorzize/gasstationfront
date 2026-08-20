import React, { useState, useEffect, useRef } from 'react';
import { X, Save, Loader2, Fuel, DollarSign, Calendar, AlertTriangle, Search, Check } from 'lucide-react';
import { fuelPriceService } from '../services/fuelPriceService';
import { productService } from '../../products/services/productService';
import { useToast } from '../../../context/ToastContext';
import { getTodayStr } from '../../../shared/utils/dateUtils';

export const FuelPriceModal = ({ isOpen, onClose, onSave }) => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [combustibles, setCombustibles] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showProductList, setShowProductList] = useState(false);
  const productListRef = useRef(null);

  // Estado para el valor visual (con puntos) y el valor real (número limpio)
  const [displayPrecio, setDisplayPrecio] = useState('');
  const [formData, setFormData] = useState({
    producto_id: '',
    precio: '',
    fecha_inicio: getTodayStr() + " 00:00:00"
  });

  // Manejador del formato de precio
  const handlePrecioChange = (e) => {
    const rawValue = e.target.value.replace(/\D/g, ''); // Solo números
    if (rawValue === '') {
      setDisplayPrecio('');
      setFormData({ ...formData, precio: '' });
      return;
    }
    // Formatear con puntos de miles
    const formatted = new Intl.NumberFormat('es-CO').format(rawValue);
    setDisplayPrecio(formatted);
    setFormData({ ...formData, precio: rawValue });
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (productListRef.current && !productListRef.current.contains(e.target)) {
        setShowProductList(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const searchProducts = async () => {
      if (searchTerm.length < 2) return;
      setSearching(true);
      try {
        const res = await productService.getProducts({ 
          search: searchTerm, 
          categoria: 'Combustibles' 
        });
        if (res.status) setCombustibles(res.data.items || []);
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
  }, [searchTerm, showProductList]);

  const selectProduct = (p) => {
    setFormData({ ...formData, producto_id: p.id });
    setSearchTerm(p.nombre);
    setShowProductList(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.producto_id) return showToast("Selecciona un producto de la lista", "error");
    if (Number(formData.precio) <= 0) return showToast("El precio debe ser mayor a 0", "error");

    setLoading(true);
    try {
      const res = await fuelPriceService.createPrice(formData);
      if (res.status || res.success) {
        showToast(res.message || "Precio actualizado", "success");
        onSave(); 
        onClose(); 
      } else {
        showToast(res.message || "Error al guardar", "error");
      }
    } catch (e) {
      showToast("Error al conectar con el servidor", "error");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden border border-slate-100">
        <header className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
              <Fuel size={24} />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">Actualizar Precio</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nueva vigencia de combustible</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:bg-white rounded-xl transition-colors"><X size={24} /></button>
        </header>

        <form onSubmit={handleSubmit} className="p-8 space-y-6 text-left">
          <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex gap-3 text-amber-700">
            <AlertTriangle size={20} className="shrink-0" />
            <p className="text-[10px] font-bold uppercase leading-tight">
              Al guardar, el precio anterior se cerrará automáticamente con fecha de hoy.
            </p>
          </div>
      
          <div className="space-y-2 relative" ref={productListRef}>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Producto Combustible</label>
            <div className="relative">
              <Search className="absolute left-4 top-4 text-slate-300" size={18} />
              <input
                type="text"
                placeholder="Escribe para buscar combustible..."
                className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold outline-none focus:border-zinc-900 transition-all uppercase"
                value={searchTerm}
                onFocus={() => setShowProductList(true)}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setShowProductList(true);
                  if (formData.producto_id) setFormData({...formData, producto_id: ''});
                }}
              />
              {searching && <Loader2 className="absolute right-4 top-4 animate-spin text-zinc-400" size={18} />}
            </div>

            {showProductList && searchTerm.length >= 2 && (
              <div className="absolute z-50 w-full mt-2 bg-white border border-slate-100 rounded-2xl shadow-xl max-h-48 overflow-y-auto">
                {combustibles.length > 0 ? (
                  combustibles.map(p => (
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
                  <p className="p-4 text-[10px] text-slate-400 uppercase italic text-center">No se encontraron resultados</p>
                ) : null}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Precio Galón ($)</label>
              <div className="relative">
                <DollarSign className="absolute left-4 top-4 text-emerald-500" size={18} />
                <input
                  type="text" 
                  required 
                  placeholder="0"
                  className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-black outline-none focus:border-zinc-900 transition-all"
                  value={displayPrecio}
                  onChange={handlePrecioChange}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Fecha Inicio</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-4 text-slate-300" size={18} />
                <input
                  type="date" required
                  className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] font-black outline-none focus:border-zinc-900 transition-all uppercase"
                  value={formData.fecha_inicio.split(' ')[0]}
                  onChange={(e) => setFormData({ ...formData, fecha_inicio: e.target.value + " 00:00:00" })}
                />
              </div>
            </div>
          </div>

          <div className="pt-4 flex gap-4">
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
              {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
              Publicar Nuevo Precio
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};