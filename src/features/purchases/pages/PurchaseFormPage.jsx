import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Plus, Trash2, Save, ArrowLeft, 
  Search, Package, Truck, Warehouse, Info, Loader2 
} from 'lucide-react';
import { purchaseService } from '../services/purchaseService';
import { supplierService } from '../../suppliers/services/supplierService';
import { warehouseService } from '../../warehouses/services/warehouseService';
import { productService } from '../../products/services/productService';
import { useToast } from '../../../context/ToastContext';

export const PurchaseFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  // Estados de carga
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Datos maestros fijos (Bodegas son pocas, se cargan normal)
  const [warehouses, setWarehouses] = useState([]);

  // Estados para búsqueda dinámica de Proveedor
  const [searchProvider, setSearchProvider] = useState('');
  const [providerResults, setProviderResults] = useState([]);
  const [isSearchingProvider, setIsSearchingProvider] = useState(false);

  // Estados para búsqueda dinámica de Productos
  const [searchProduct, setSearchProduct] = useState('');
  const [productResults, setProductResults] = useState([]);
  const [isSearchingProduct, setIsSearchingProduct] = useState(false);
  const [activeDetailIndex, setActiveDetailIndex] = useState(null);

  // Estado del formulario
  const [formData, setFormData] = useState({
    proveedor_id: '',
    nombre_proveedor_temp: '', // Para mostrar el nombre seleccionado
    bodega_id: '',
    numero_documento: '',
    fecha_compra: new Date().toISOString().split('T')[0],
    fecha_vencimiento: '',
    tipo_pago: 'contado',
    impuesto: 0,
    observacion: '',
    detalles: []
  });

  // 1. Cargar datos iniciales (Solo bodegas y compra si es edición)
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        const res = await warehouseService.getWarehouses();
        if (res.status) setWarehouses(res.data.items || []);
        if (id) loadPurchase();
      } catch (e) { showToast("Error al cargar configuración", "error"); }
      finally { setLoading(false); }
    };
    init();
  }, [id]);

  const loadPurchase = async () => {
    try {
      const res = await purchaseService.getPurchaseById(id);
      if (res.status) {
        if (res.data.estado !== 'borrador') {
          showToast("Solo se pueden editar compras en borrador", "warning");
          navigate('/compras');
          return;
        }
        setFormData({
          ...res.data,
          nombre_proveedor_temp: res.data.proveedor?.nombre || ''
        });
        setSearchProvider(res.data.proveedor?.nombre || '');
      }
    } catch (e) { showToast("Error al cargar compra", "error"); }
  };

  // 2. LÓGICA DE BÚSQUEDA DINÁMICA DE PROVEEDORES (Debounce)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchProvider.length >= 4 && searchProvider !== formData.nombre_proveedor_temp) {
        searchSuppliers();
      } else {
        setProviderResults([]);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchProvider]);

  const searchSuppliers = async () => {
    setIsSearchingProvider(true);
    try {
      const res = await supplierService.getSuppliers({ search: searchProvider });
      setProviderResults(res.data?.items || []);
    } finally { setIsSearchingProvider(false); }
  };

  // 3. LÓGICA DE BÚSQUEDA DINÁMICA DE PRODUCTOS (Debounce)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchProduct.length >= 4) {
        searchProducts();
      } else {
        setProductResults([]);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchProduct]);

  const searchProducts = async () => {
    setIsSearchingProduct(true);
    try {
      const res = await productService.getProducts({ search: searchProduct });
      setProductResults(res.data?.items || []);
    } finally { setIsSearchingProduct(false); }
  };

  // Manejadores de detalles
  const addDetail = () => {
    setFormData({
      ...formData,
      detalles: [...formData.detalles, { producto_id: '', nombre_temp: '', cantidad: 1, costo_unitario: 0 }]
    });
  };

  const removeDetail = (index) => {
    const newDetalles = formData.detalles.filter((_, i) => i !== index);
    setFormData({ ...formData, detalles: newDetalles });
  };

  const updateDetail = (index, field, value) => {
    const newDetalles = [...formData.detalles];
    newDetalles[index][field] = value;
    setFormData({ ...formData, detalles: newDetalles });
  };

  const calculateTotal = () => {
    const subtotal = formData.detalles.reduce((acc, det) => acc + (det.cantidad * det.costo_unitario), 0);
    return subtotal + parseFloat(formData.impuesto || 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.detalles.length === 0) return showToast("Agregue al menos un producto", "error");
    if (!formData.proveedor_id) return showToast("Seleccione un proveedor válido", "error");

    setSaving(true);
    try {
      const res = id 
        ? await purchaseService.updatePurchase(id, formData)
        : await purchaseService.createPurchase(formData);
      
      if (res.status) {
        showToast(res.message, "success");
        navigate(`/compras/${res.data.id}`);
      } else { showToast(res.message, "error"); }
    } catch (e) { showToast("Error de conexión", "error"); }
    finally { setSaving(false); }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 pb-20">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <ArrowLeft size={24} className="text-slate-600" />
          </button>
          <div>
            <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">
              {id ? 'Editar Compra' : 'Nueva Compra'}
            </h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Mínimo 4 caracteres para buscar proveedores y productos</p>
          </div>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* PANEL IZQUIERDO: CABECERA */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-5 relative">
            <h3 className="text-xs font-black text-slate-400 uppercase flex items-center gap-2">
              <Info size={14} /> Datos Maestros
            </h3>
            
            {/* BUSCADOR PROVEEDOR */}
            <div className="space-y-1 relative">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Proveedor</label>
              <div className="relative">
                <Truck className={`absolute left-4 top-3.5 transition-colors ${formData.proveedor_id ? 'text-emerald-500' : 'text-slate-300'}`} size={16} />
                <input 
                  required
                  type="text"
                  className="w-full pl-12 pr-10 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-xs outline-none focus:border-zinc-900 font-bold"
                  placeholder="Escriba 4+ letras..."
                  value={searchProvider}
                  onChange={(e) => {
                    setSearchProvider(e.target.value);
                    if (formData.proveedor_id) setFormData({...formData, proveedor_id: '', nombre_proveedor_temp: ''});
                  }}
                />
                {isSearchingProvider && <Loader2 size={16} className="absolute right-4 top-4 animate-spin text-slate-400" />}
              </div>
              
              {/* Resultados Proveedor */}
              {providerResults.length > 0 && (
                <div className="absolute z-[100] w-full mt-2 bg-white border border-slate-100 rounded-2xl shadow-2xl overflow-hidden max-h-60 overflow-y-auto">
                  {providerResults.map(p => (
                    <button key={p.id} type="button" className="w-full px-5 py-3 text-left hover:bg-slate-50 border-b border-slate-50 last:border-0 transition-colors"
                      onClick={() => {
                        setFormData({...formData, proveedor_id: p.id, nombre_proveedor_temp: p.nombre});
                        setSearchProvider(p.nombre);
                        setProviderResults([]);
                      }}>
                      <p className="text-[11px] font-black text-slate-700 uppercase">{p.nombre}</p>
                      <p className="text-[9px] text-slate-400 font-bold tracking-tighter">NIT: {p.nit}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* BODEGA SELECCION */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Bodega de Ingreso</label>
              <div className="relative">
                <Warehouse className="absolute left-4 top-3.5 text-slate-300" size={16} />
                <select required className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold outline-none focus:border-zinc-900"
                  value={formData.bodega_id} onChange={e => setFormData({...formData, bodega_id: e.target.value})}>
                  <option value="">Seleccione bodega...</option>
                  {warehouses.map(w => <option key={w.id} value={w.id}>{w.nombre}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Factura #</label>
                <input className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold outline-none focus:border-zinc-900"
                  placeholder="000-000" value={formData.numero_documento} onChange={e => setFormData({...formData, numero_documento: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Pago</label>
                <select className="w-full px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-black uppercase outline-none focus:border-zinc-900"
                  value={formData.tipo_pago} onChange={e => setFormData({...formData, tipo_pago: e.target.value})}>
                  <option value="contado">Contado</option>
                  <option value="credito">Crédito</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Fecha Compra</label>
                <input type="date" className="w-full px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold outline-none focus:border-zinc-900"
                  value={formData.fecha_compra} onChange={e => setFormData({...formData, fecha_compra: e.target.value})} />
              </div>
              {formData.tipo_pago === 'credito' && (
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1 text-orange-500">Vencimiento</label>
                  <input type="date" className="w-full px-4 py-3.5 bg-orange-50 border border-orange-100 rounded-2xl text-xs font-bold outline-none focus:border-zinc-900"
                    value={formData.fecha_vencimiento} onChange={e => setFormData({...formData, fecha_vencimiento: e.target.value})} />
                </div>
              )}
            </div>
          </div>

          {/* TOTALES */}
          <div className="bg-zinc-900 p-8 rounded-[2.5rem] text-white shadow-2xl shadow-zinc-200">
             <div className="flex justify-between items-center text-zinc-500 uppercase font-black text-[10px] mb-2">
                <span>Total a Pagar</span>
                <span className="bg-zinc-800 px-3 py-1 rounded-full">{formData.detalles.length} Items</span>
             </div>
             <p className="text-4xl font-black tracking-tighter mb-6">$ {calculateTotal().toLocaleString('es-CO')}</p>
             <button type="submit" disabled={saving} className="w-full py-4 bg-yellow-500 text-black font-black uppercase text-xs rounded-2xl hover:bg-yellow-400 transition-all flex items-center justify-center gap-2 shadow-lg shadow-yellow-500/20">
                {saving ? <Loader2 size={18} className="animate-spin"/> : <><Save size={18}/> Guardar en Borrador</>}
             </button>
          </div>
        </div>

        {/* PANEL DERECHO: PRODUCTOS */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col min-h-[550px]">
            <div className="p-6 border-b flex justify-between items-center bg-slate-50/50">
               <h3 className="text-xs font-black text-slate-500 uppercase flex items-center gap-2">
                 <Package size={16} /> Detalle de Mercancía
               </h3>
               <button type="button" onClick={addDetail} className="flex items-center gap-2 px-5 py-2.5 bg-zinc-900 text-white rounded-xl text-[10px] font-black uppercase hover:bg-black transition-all shadow-lg shadow-zinc-200">
                 <Plus size={14} /> Nuevo Item
               </button>
            </div>

            <div className="p-4 overflow-x-auto">
              <table className="w-full text-left border-separate border-spacing-y-2">
                <thead>
                  <tr className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                    <th className="px-4 pb-2">Buscador de Producto (4+ carac.)</th>
                    <th className="px-4 pb-2 w-24 text-center">Cantidad</th>
                    <th className="px-4 pb-2 w-36 text-right">Costo Unitario</th>
                    <th className="px-4 pb-2 w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {formData.detalles.map((det, idx) => (
                    <tr key={idx} className="group relative">
                      <td className="px-2 py-1 relative">
                        <div className="relative">
                          <Search className={`absolute left-4 top-3.5 ${det.producto_id ? 'text-emerald-500' : 'text-slate-300'}`} size={14} />
                          <input 
                            type="text"
                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold outline-none focus:border-zinc-900"
                            placeholder="Escriba código o nombre..."
                            value={det.producto_id ? (det.nombre_temp || '') : (activeDetailIndex === idx ? searchProduct : '')}
                            onFocus={() => {
                              setActiveDetailIndex(idx);
                              setSearchProduct('');
                            }}
                            onChange={(e) => {
                              if (det.producto_id) updateDetail(idx, 'producto_id', '');
                              setSearchProduct(e.target.value);
                              setActiveDetailIndex(idx);
                            }}
                          />
                          {activeDetailIndex === idx && isSearchingProduct && (
                            <Loader2 size={12} className="absolute right-4 top-4 animate-spin text-slate-400" />
                          )}
                        </div>

                        {/* Dropdown de productos */}
                        {activeDetailIndex === idx && productResults.length > 0 && (
                          <div className="absolute z-[110] left-0 right-0 mt-2 bg-white border border-slate-100 rounded-2xl shadow-2xl overflow-hidden max-h-52 overflow-y-auto border-t-4 border-t-zinc-900">
                            {productResults.map(p => (
                              <button key={p.id} type="button" className="w-full px-5 py-3 text-left hover:bg-slate-50 border-b border-slate-50 last:border-0 flex justify-between items-center"
                                onClick={() => {
                                  const newDetalles = [...formData.detalles];
                                  newDetalles[idx] = { 
                                    ...newDetalles[idx], 
                                    producto_id: p.id, 
                                    nombre_temp: `${p.codigo} - ${p.nombre}`,
                                    costo_unitario: parseFloat(p.precio_compra) || 0 
                                  };
                                  setFormData({...formData, detalles: newDetalles});
                                  setProductResults([]);
                                  setSearchProduct('');
                                  setActiveDetailIndex(null);
                                }}>
                                <div>
                                  <p className="text-[11px] font-black text-slate-700 uppercase">{p.nombre}</p>
                                  <p className="text-[9px] text-slate-400 font-bold">{p.codigo} | {p.marca?.nombre}</p>
                                </div>
                                <span className="text-[9px] font-black bg-zinc-100 px-2 py-1 rounded text-zinc-500">{p.unidad_medida?.abreviatura}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-2 py-1 text-center">
                        <input type="number" step="any" className="w-full px-3 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-black text-center outline-none focus:bg-white"
                          value={det.cantidad} onChange={(e) => updateDetail(idx, 'cantidad', parseFloat(e.target.value) || 0)} />
                      </td>
                      <td className="px-2 py-1">
                        <input type="number" step="any" className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-black text-right outline-none focus:bg-white"
                          value={det.costo_unitario} onChange={(e) => updateDetail(idx, 'costo_unitario', parseFloat(e.target.value) || 0)} />
                      </td>
                      <td className="px-2 py-1 text-center">
                        <button type="button" onClick={() => removeDetail(idx)} className="p-2 text-slate-300 hover:text-red-500 transition-colors">
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {formData.detalles.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-slate-300">
                   <Package size={48} className="mb-4 opacity-20" />
                   <p className="text-[10px] font-black uppercase tracking-widest">No hay items en la lista</p>
                </div>
              )}
            </div>

            {/* IVA / TAX */}
            <div className="mt-auto p-8 bg-slate-50/50 border-t border-slate-100">
               <div className="flex justify-end items-center gap-6">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Impuestos adicionales (IVA)</span>
                  <div className="relative w-40">
                    <span className="absolute left-4 top-3 text-slate-300 text-xs font-bold">$</span>
                    <input type="number" className="w-full pl-8 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-black text-right outline-none focus:border-zinc-900"
                      value={formData.impuesto} onChange={e => setFormData({...formData, impuesto: e.target.value})} />
                  </div>
               </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};