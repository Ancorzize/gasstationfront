import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Package, Tag, Layers, Ruler, DollarSign, Hash, AlignLeft, Info } from 'lucide-react';
import { productService } from '../services/productService';
import { brandService } from '../../brands/services/brandService';
import { categoryService } from '../../categories/services/categoryService';
import { unitService } from '../../units/services/unitService';
import { useToast } from '../../../context/ToastContext';

export const ProductModal = ({ isOpen, onClose, onSave, productToEdit = null }) => {
  const [formData, setFormData] = useState({
    codigo: '', nombre: '', descripcion: '', 
    marca_id: '', categoria_producto_id: '', unidad_medida_id: '',
    precio_compra: '', precio_venta: '', permite_decimal: false
  });

  const [options, setOptions] = useState({ brands: [], categories: [], units: [] });
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (isOpen) {
      loadDependencies();
      if (productToEdit) {
        setFormData({
          codigo: productToEdit.codigo || '',
          nombre: productToEdit.nombre || '',
          descripcion: productToEdit.descripcion || '',
          marca_id: productToEdit.marca_id || '',
          categoria_producto_id: productToEdit.categoria_producto_id || '',
          unidad_medida_id: productToEdit.unidad_medida_id || '',
          precio_compra: productToEdit.precio_compra || '',
          precio_venta: productToEdit.precio_venta || '',
          permite_decimal: !!productToEdit.permite_decimal
        });
      } else {
        setFormData({
          codigo: '', nombre: '', descripcion: '', marca_id: '',
          categoria_producto_id: '', unidad_medida_id: '',
          precio_compra: '', precio_venta: '', permite_decimal: false
        });
      }
    }
  }, [isOpen, productToEdit]);

  const loadDependencies = async () => {
    try {
      const [b, c, u] = await Promise.all([
        brandService.getBrands('', true),
        categoryService.getCategories('', true),
        unitService.getUnits('', true)
      ]);
      setOptions({
        brands: b.data?.items || [],
        categories: c.data?.items || [],
        units: u.data?.items || []
      });
    } catch (error) {
      showToast("Error al cargar dependencias", "error");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = productToEdit 
        ? await productService.updateProduct(productToEdit.id, formData)
        : await productService.createProduct(formData);

      if (result.status) {
        showToast(result.message, "success");
        onSave();
        onClose();
      } else {
        showToast(result.message || "Error en validación", "error");
      }
    } catch (err) {
      showToast("Error de conexión", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 md:p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose} className="absolute inset-0 bg-zinc-950/70 backdrop-blur-sm" />
          
          <motion.div 
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            className="relative bg-white w-full h-full md:h-auto md:max-w-2xl md:rounded-3xl shadow-2xl flex flex-col overflow-hidden"
          >
            <div className="p-5 border-b flex justify-between items-center bg-white sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-yellow-500/10 flex items-center justify-center text-yellow-600">
                  <Package size={18} />
                </div>
                <h3 className="font-black text-slate-800 text-xs md:text-sm uppercase">{productToEdit ? 'Editar Producto' : 'Nuevo Producto'}</h3>
              </div>
              <button onClick={onClose} className="p-2 text-slate-400"><X size={20} /></button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 md:p-6 space-y-4 custom-scrollbar-light">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Código Único</label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-3 text-slate-400" size={16} />
                    <input required className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-yellow-500 outline-none"
                      value={formData.codigo} onChange={e => setFormData({...formData, codigo: e.target.value.toUpperCase()})} placeholder="REF-001" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Nombre del Producto</label>
                  <div className="relative">
                    <Package className="absolute left-3 top-3 text-slate-400" size={16} />
                    <input required className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-yellow-500 outline-none"
                      value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} placeholder="Nombre comercial" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 text-xs">Categoría</label>
                  <select required className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-yellow-500"
                    value={formData.categoria_producto_id} onChange={e => setFormData({...formData, categoria_producto_id: e.target.value})}>
                    <option value="">Seleccione...</option>
                    {options.categories.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 text-xs">Marca (Opcional)</label>
                  <select className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-yellow-500"
                    value={formData.marca_id} onChange={e => setFormData({...formData, marca_id: e.target.value})}>
                    <option value="">Ninguna</option>
                    {options.brands.map(b => <option key={b.id} value={b.id}>{b.nombre}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 text-xs">Unidad de Medida</label>
                  <select required className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-yellow-500"
                    value={formData.unidad_medida_id} onChange={e => setFormData({...formData, unidad_medida_id: e.target.value})}>
                    <option value="">Seleccione...</option>
                    {options.units.map(u => <option key={u.id} value={u.id}>{u.nombre} ({u.abreviatura})</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Precio Compra</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3 text-emerald-500" size={16} />
                    <input type="number" step="any" className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-yellow-500 outline-none"
                      value={formData.precio_compra} onChange={e => setFormData({...formData, precio_compra: e.target.value})} />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Precio Venta (Base)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3 text-blue-500" size={16} />
                    <input required type="number" step="any" className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-yellow-500 outline-none"
                      value={formData.precio_venta} onChange={e => setFormData({...formData, precio_venta: e.target.value})} />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                <input type="checkbox" id="decimal" className="w-4 h-4 accent-yellow-500"
                  checked={formData.permite_decimal} onChange={e => setFormData({...formData, permite_decimal: e.target.checked})} />
                <label htmlFor="decimal" className="text-xs font-bold text-slate-600 cursor-pointer flex items-center gap-2 uppercase">
                  Permite Decimales <Info size={14} className="text-slate-400" title="Activar para productos como combustible" />
                </label>
              </div>

              <div className="pt-4 flex flex-col-reverse md:flex-row gap-3">
                <button type="button" onClick={onClose} className="flex-1 py-3 rounded-2xl border border-slate-200 text-slate-600 font-bold text-xs uppercase hover:bg-slate-50">Cancelar</button>
                <button type="submit" disabled={loading} className="flex-1 py-3 rounded-2xl bg-zinc-900 text-white font-bold text-xs hover:bg-black transition-all flex items-center justify-center gap-2 uppercase">
                  {loading ? "..." : (productToEdit ? "Actualizar Producto" : "Registrar Producto")}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};