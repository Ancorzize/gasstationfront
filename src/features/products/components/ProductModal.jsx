import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Package, Tag, Layers, Ruler, DollarSign, Hash, AlignLeft, Info, Barcode, Percent, AlertTriangle } from 'lucide-react';
import { productService } from '../services/productService';
import { brandService } from '../../brands/services/brandService';
import { categoryService } from '../../categories/services/categoryService';
import { unitService } from '../../units/services/unitService';
import { useToast } from '../../../context/ToastContext';
import { usePermissions } from '../../../hooks/usePermissions';

const OPCIONES_TRIBUTARIAS = [
  { value: 'gravado_19', label: 'Gravado IVA 19 %' },
  { value: 'gravado_5', label: 'Gravado IVA 5 %' },
  { value: 'gravado_otro', label: 'Gravado con otra tarifa' },
  { value: 'exento', label: 'Exento de IVA 0 %' },
  { value: 'excluido', label: 'Excluido / No gravado' },
];

export const ProductModal = ({ isOpen, onClose, onSave, productToEdit = null }) => {
  const [formData, setFormData] = useState({
    codigo: '', codigo_barras: '', nombre: '', descripcion: '', 
    marca_id: '', categoria_producto_id: '', unidad_medida_id: '',
    precio_compra: '', precio_venta: '', permite_decimal: false,
    opcion_tributaria: '', otra_tarifa_iva: ''
  });

  const [options, setOptions] = useState({ brands: [], categories: [], units: [] });
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();
  const { hasPermission } = usePermissions();

  const isEditing = Boolean(productToEdit);
  const requiredPermission = isEditing ? 'editar_productos' : 'crear_productos';
  const canSave = hasPermission(requiredPermission);

  // Función para formatear números con puntos en miles y coma en decimales
  const formatNumberDisplay = (value) => {
    if (value === '' || value === null || value === undefined) return '';
    let stringValue = value.toString().replace('.', ',');
    const parts = stringValue.split(',');
    let integerPart = parts[0].replace(/\D/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return integerPart + (parts[1] !== undefined ? ',' + parts[1].replace(/\D/g, '') : '');
  };

  const resolverOpcionTributariaInicial = (product) => {
    if (!product || !product.tipo_impuesto) {
      return { opcion_tributaria: '', otra_tarifa_iva: '' };
    }
    const tipo = String(product.tipo_impuesto).toLowerCase().trim();
    const tarifa = product.porcentaje_iva !== null && product.porcentaje_iva !== undefined
      ? parseFloat(product.porcentaje_iva)
      : null;

    if (tipo === 'exento') {
      return { opcion_tributaria: 'exento', otra_tarifa_iva: '' };
    }
    if (tipo === 'excluido') {
      return { opcion_tributaria: 'excluido', otra_tarifa_iva: '' };
    }
    if (tipo === 'gravado' && tarifa !== null && !isNaN(tarifa) && tarifa > 0) {
      if (Math.abs(tarifa - 19) < 0.001) {
        return { opcion_tributaria: 'gravado_19', otra_tarifa_iva: '' };
      }
      if (Math.abs(tarifa - 5) < 0.001) {
        return { opcion_tributaria: 'gravado_5', otra_tarifa_iva: '' };
      }
      return { opcion_tributaria: 'gravado_otro', otra_tarifa_iva: String(tarifa) };
    }

    return { opcion_tributaria: '', otra_tarifa_iva: '' };
  };

  useEffect(() => {
    if (isOpen) {
      loadDependencies();
      if (productToEdit) {
        const tribInicial = resolverOpcionTributariaInicial(productToEdit);
        setFormData({
          codigo: productToEdit.codigo || '',
          codigo_barras: productToEdit.codigo_barras || '',
          nombre: productToEdit.nombre || '',
          descripcion: productToEdit.descripcion || '',
          marca_id: productToEdit.marca_id || '',
          categoria_producto_id: productToEdit.categoria_producto_id || '',
          unidad_medida_id: productToEdit.unidad_medida_id || '',
          precio_compra: productToEdit.precio_compra ? formatNumberDisplay(productToEdit.precio_compra) : '',
          precio_venta: productToEdit.precio_venta ? formatNumberDisplay(productToEdit.precio_venta) : '',
          permite_decimal: !!productToEdit.permite_decimal,
          opcion_tributaria: tribInicial.opcion_tributaria,
          otra_tarifa_iva: tribInicial.otra_tarifa_iva,
        });
      } else {
        setFormData({
          codigo: '', codigo_barras: '', nombre: '', descripcion: '', marca_id: '',
          categoria_producto_id: '', unidad_medida_id: '',
          precio_compra: '', precio_venta: '', permite_decimal: false,
          opcion_tributaria: '', otra_tarifa_iva: ''
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

  // Manejador específico para formatear precios mientras se escribe
  const handlePriceChange = (field, e) => {
    let val = e.target.value;
    let raw = val.replace(/[^0-9,]/g, '');
    
    // Permitir solo una coma decimal
    const firstCommaIndex = raw.indexOf(',');
    if (firstCommaIndex !== -1) {
      raw = raw.substring(0, firstCommaIndex + 1) + raw.substring(firstCommaIndex + 1).replace(/,/g, '');
    }

    const parts = raw.split(',');
    let integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    let formatted = integerPart + (parts[1] !== undefined ? ',' + parts[1] : '');

    setFormData(prev => ({ ...prev, [field]: formatted }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSave) {
      return showToast(`No tienes permisos para ${isEditing ? 'editar' : 'crear'} productos`, "error");
    }

    if (!formData.opcion_tributaria) {
      return showToast("Debe seleccionar la clasificación tributaria del producto (DIAN)", "error");
    }

    let tipo_impuesto = '';
    let porcentaje_iva = 0;
    let codigo_impuesto = null;

    if (formData.opcion_tributaria === 'gravado_19') {
      tipo_impuesto = 'gravado';
      porcentaje_iva = 19;
      codigo_impuesto = '1';
    } else if (formData.opcion_tributaria === 'gravado_5') {
      tipo_impuesto = 'gravado';
      porcentaje_iva = 5;
      codigo_impuesto = '1';
    } else if (formData.opcion_tributaria === 'gravado_otro') {
      const parsedTarifa = parseFloat(String(formData.otra_tarifa_iva).replace(',', '.'));
      if (isNaN(parsedTarifa) || parsedTarifa <= 0 || parsedTarifa > 100) {
        return showToast("Ingrese una tarifa de IVA válida mayor a 0% y hasta 100%", "error");
      }
      tipo_impuesto = 'gravado';
      porcentaje_iva = Number(parsedTarifa.toFixed(2));
      codigo_impuesto = '1';
    } else if (formData.opcion_tributaria === 'exento') {
      tipo_impuesto = 'exento';
      porcentaje_iva = 0;
      codigo_impuesto = '1';
    } else if (formData.opcion_tributaria === 'excluido') {
      tipo_impuesto = 'excluido';
      porcentaje_iva = 0;
      codigo_impuesto = null;
    } else {
      return showToast("La clasificación tributaria seleccionada no es válida", "error");
    }

    setLoading(true);
    try {
      // Limpiar formato visual antes de enviar al backend (puntos fuera, coma a punto decimal)
      const cleanPrecioCompra = formData.precio_compra ? formData.precio_compra.toString().replace(/\./g, '').replace(',', '.') : null;
      const cleanPrecioVenta = formData.precio_venta ? formData.precio_venta.toString().replace(/\./g, '').replace(',', '.') : null;

      const payload = {
        codigo: formData.codigo,
        codigo_barras: formData.codigo_barras || null,
        nombre: formData.nombre,
        descripcion: formData.descripcion || null,
        marca_id: formData.marca_id || null,
        categoria_producto_id: formData.categoria_producto_id,
        unidad_medida_id: formData.unidad_medida_id,
        precio_compra: cleanPrecioCompra,
        precio_venta: cleanPrecioVenta,
        tipo_impuesto,
        porcentaje_iva,
        codigo_impuesto,
        permite_decimal: formData.permite_decimal,
      };

      const result = productToEdit 
        ? await productService.updateProduct(productToEdit.id, payload)
        : await productService.createProduct(payload);

      if (result.status) {
        showToast(result.message, "success");
        onSave();
        onClose();
      } else {
        let msg = result.message || "Error en validación";
        if (result.errors && typeof result.errors === 'object') {
          const firstErr = Object.values(result.errors)[0];
          if (Array.isArray(firstErr) && firstErr.length > 0) {
            msg = firstErr[0];
          }
        }
        showToast(msg, "error");
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
                    <input required className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-yellow-500 outline-none uppercase"
                      value={formData.codigo} onChange={e => setFormData({...formData, codigo: e.target.value.toUpperCase()})} placeholder="REF-001" />
                  </div>
                </div>
                
                {/* Nuevo campo de Código de Barras */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Código de Barras (Opcional)</label>
                  <div className="relative">
                    <Barcode className="absolute left-3 top-3 text-slate-400" size={16} />
                    <input className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-yellow-500 outline-none uppercase"
                      value={formData.codigo_barras} onChange={e => setFormData({...formData, codigo_barras: e.target.value.toUpperCase()})} placeholder="770123456789" />
                  </div>
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
                    <input 
                      type="text" 
                      inputMode="decimal"
                      className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-yellow-500 outline-none font-medium"
                      value={formData.precio_compra} 
                      onChange={e => handlePriceChange('precio_compra', e)} 
                      placeholder="0,00"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Precio Venta (Base)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3 text-blue-500" size={16} />
                    <input 
                      required 
                      type="text" 
                      inputMode="decimal"
                      className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-yellow-500 outline-none font-medium"
                      value={formData.precio_venta} 
                      onChange={e => handlePriceChange('precio_venta', e)} 
                      placeholder="0,00"
                    />
                  </div>
                </div>
              </div>

              {/* Sección: Configuración Tributaria (DIAN) */}
              <div className="border-t pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Percent size={15} className="text-yellow-600" />
                    <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-wider">
                      Configuración Tributaria (DIAN)
                    </h4>
                  </div>
                  {isEditing && !formData.opcion_tributaria && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase bg-amber-50 text-amber-700 border border-amber-200">
                      <AlertTriangle size={11} /> Pendiente de clasificación
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">
                      Tratamiento Tributario <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-yellow-500 font-medium"
                      value={formData.opcion_tributaria}
                      onChange={e => setFormData({
                        ...formData,
                        opcion_tributaria: e.target.value,
                        otra_tarifa_iva: e.target.value === 'gravado_otro' ? formData.otra_tarifa_iva : ''
                      })}
                    >
                      <option value="">Seleccione clasificación...</option>
                      {OPCIONES_TRIBUTARIAS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>

                  {formData.opcion_tributaria === 'gravado_otro' && (
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">
                        Tarifa de IVA (%) <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Percent className="absolute left-3 top-3 text-yellow-600" size={15} />
                        <input
                          required
                          type="number"
                          step="0.01"
                          min="0.01"
                          max="100"
                          placeholder="Ej: 16.00"
                          className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-yellow-500 outline-none font-bold"
                          value={formData.otra_tarifa_iva}
                          onChange={e => setFormData({ ...formData, otra_tarifa_iva: e.target.value })}
                        />
                      </div>
                    </div>
                  )}
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
                {canSave && (
                  <button type="submit" disabled={loading} className="flex-1 py-3 rounded-2xl bg-zinc-900 text-white font-bold text-xs hover:bg-black transition-all flex items-center justify-center gap-2 uppercase">
                    {loading ? "..." : (productToEdit ? "Actualizar Producto" : "Registrar Producto")}
                  </button>
                )}
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};