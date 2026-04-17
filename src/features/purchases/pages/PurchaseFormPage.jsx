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

  // ESTADOS
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Maestros
  const [suppliers, setSuppliers] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  
  // Buscador de productos
  const [searchProduct, setSearchProduct] = useState('');
  const [productResults, setProductResults] = useState([]);
  const [isSearchingProduct, setIsSearchingProduct] = useState(false);
  const [activeDetailIndex, setActiveDetailIndex] = useState(null);

  const [formData, setFormData] = useState({
    proveedor_id: '',
    bodega_id: '',
    numero_documento: '',
    fecha_compra: new Date().toISOString().split('T')[0],
    tipo_pago: 'contado',
    observacion: '',
    detalles: [{ producto_id: '', nombre_temp: '', cantidad: 1, costo_unitario: 0 }]
  });

  // CARGA INICIAL
  useEffect(() => {
    loadMasters();
    if (id) loadPurchase();
  }, [id]);

  const loadMasters = async () => {
    setLoading(true);
    try {
      const [suppRes, wareRes] = await Promise.all([
        supplierService.getSuppliers(),
        warehouseService.getWarehouses()
      ]);
      if (suppRes.status) setSuppliers(suppRes.data.items || []);
      if (wareRes.status) setWarehouses(wareRes.data.items || []);
    } catch (e) {
      showToast("Error al cargar datos maestros", "error");
    } finally {
      setLoading(false);
    }
  };

  const loadPurchase = async () => {
    // Lógica para editar si fuera necesario
  };

  // LÓGICA DE BÚSQUEDA DE PRODUCTOS
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchProduct.length >= 3) {
        performProductSearch();
      } else {
        setProductResults([]);
      }
    }, 400);
    return () => clearTimeout(delayDebounceFn);
  }, [searchProduct]);

  const performProductSearch = async () => {
    setIsSearchingProduct(true);
    try {
      const res = await productService.getProducts({ search: searchProduct });
      if (res.status) setProductResults(res.data.items || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSearchingProduct(false);
    }
  };

  // MANEJO DE DETALLES
  const addDetail = () => {
    setFormData({
      ...formData,
      detalles: [...formData.detalles, { producto_id: '', nombre_temp: '', cantidad: 1, costo_unitario: 0 }]
    });
  };

  const removeDetail = (index) => {
    if (formData.detalles.length === 1) return;
    const newDetalles = formData.detalles.filter((_, i) => i !== index);
    setFormData({ ...formData, detalles: newDetalles });
  };

  const updateDetail = (index, field, value) => {
    const newDetalles = [...formData.detalles];
    newDetalles[index][field] = value;
    setFormData({ ...formData, detalles: newDetalles });
  };

  // CÁLCULOS
  const totalPagar = formData.detalles.reduce((acc, item) => acc + (item.cantidad * item.costo_unitario), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.detalles.some(d => !d.producto_id)) {
      return showToast("Todos los ítems deben tener un producto seleccionado", "warning");
    }

    setIsSaving(true);
    try {
      const res = await purchaseService.createPurchase(formData);
      if (res.status) {
        showToast("Compra registrada con éxito", "success");
        navigate('/compras');
      } else {
        showToast(res.message, "error");
      }
    } catch (e) {
      showToast("Error de conexión", "error");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <Loader2 className="animate-spin text-zinc-900" size={40} />
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Preparando formulario...</p>
    </div>
  );

  return (
    <div className="p-4 md:p-8 space-y-6 pb-20 overflow-visible">
      {/* HEADER */}
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/compras')} className="p-3 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-zinc-900 shadow-sm transition-all">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Nueva Compra</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Entrada de mercancía al inventario</p>
          </div>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8 overflow-visible">
        
        {/* COLUMNA IZQUIERDA: DATOS MAESTROS */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm space-y-6">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
              <Info size={14} /> Datos de Facturación
            </h3>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Proveedor</label>
              <select required className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold outline-none focus:border-zinc-900"
                value={formData.proveedor_id} onChange={e => setFormData({...formData, proveedor_id: e.target.value})}>
                <option value="">Seleccione proveedor...</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Bodega de Destino</label>
              <select required className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold outline-none focus:border-zinc-900"
                value={formData.bodega_id} onChange={e => setFormData({...formData, bodega_id: e.target.value})}>
                <option value="">Seleccione bodega...</option>
                {warehouses.map(w => <option key={w.id} value={w.id}>{w.nombre}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Factura #</label>
                <input required className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold outline-none focus:border-zinc-900"
                  placeholder="000-000" value={formData.numero_documento} onChange={e => setFormData({...formData, numero_documento: e.target.value.toUpperCase()})} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Tipo Pago</label>
                <select className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold outline-none focus:border-zinc-900"
                  value={formData.tipo_pago} onChange={e => setFormData({...formData, tipo_pago: e.target.value})}>
                  <option value="contado">Contado</option>
                  <option value="credito">Crédito</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Fecha de Compra</label>
              <input required type="date" className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold outline-none focus:border-zinc-900"
                value={formData.fecha_compra} onChange={e => setFormData({...formData, fecha_compra: e.target.value})} />
            </div>
          </div>

          {/* RESUMEN TOTAL */}
          <div className="bg-zinc-900 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-zinc-200 space-y-4">
             <div className="flex justify-between items-center">
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Total a Pagar</span>
                <div className="px-3 py-1 bg-white/10 rounded-lg text-[9px] font-black uppercase">{formData.detalles.length} Items</div>
             </div>
             <p className="text-5xl font-black tracking-tighter">$ {totalPagar.toLocaleString('es-CO')}</p>
             <button type="submit" disabled={isSaving} className="w-full py-5 bg-white text-zinc-900 rounded-2xl font-black text-xs uppercase hover:bg-zinc-100 transition-all flex items-center justify-center gap-2 mt-4">
               {isSaving ? <Loader2 className="animate-spin" /> : <><Save size={18}/> Procesar Compra</>}
             </button>
          </div>
        </div>

        {/* COLUMNA DERECHA: TABLA DE PRODUCTOS (LA CRÍTICA) */}
        <div className="lg:col-span-2 overflow-visible">
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-6 overflow-visible">
            <div className="flex justify-between items-center mb-8 px-2">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Detalle de Mercancía</h3>
              <button type="button" onClick={addDetail} className="flex items-center gap-2 px-4 py-2 bg-slate-50 text-slate-600 rounded-xl font-black text-[9px] uppercase hover:bg-zinc-900 hover:text-white transition-all border border-slate-100">
                <Plus size={14} /> Nuevo Ítem
              </button>
            </div>

            <div className="overflow-visible">
              <table className="w-full border-separate border-spacing-y-3 overflow-visible">
                <thead>
                  <tr className="text-[9px] font-black text-slate-400 uppercase text-left tracking-tighter">
                    <th className="px-4 pb-2 w-1/2">Buscador de Producto</th>
                    <th className="px-4 pb-2 text-center w-24">Cantidad</th>
                    <th className="px-4 pb-2 text-right w-32">Costo Unitario</th>
                    <th className="px-4 pb-2 text-center w-12"></th>
                  </tr>
                </thead>
                <tbody className="overflow-visible">
                  {formData.detalles.map((det, idx) => (
                    <tr key={idx} className="group overflow-visible relative">
                      {/* BUSCADOR DE PRODUCTO CON DROPDOWN EXPANDIDO */}
                      <td className="px-2 relative overflow-visible">
                        <div className="relative">
                          <Search className={`absolute left-4 top-4 ${det.producto_id ? 'text-emerald-500' : 'text-slate-300'}`} size={16} />
                          <input 
                            type="text"
                            className={`w-full pl-12 pr-4 py-4 bg-slate-50 border rounded-2xl text-xs font-bold outline-none transition-all ${activeDetailIndex === idx ? 'border-zinc-900 bg-white ring-4 ring-zinc-50' : 'border-slate-100'}`}
                            placeholder="Buscar código o nombre..."
                            value={det.producto_id ? (det.nombre_temp || '') : (activeDetailIndex === idx ? searchProduct : '')}
                            onFocus={() => setActiveDetailIndex(idx)}
                            onChange={(e) => {
                              if (det.producto_id) updateDetail(idx, 'producto_id', '');
                              setSearchProduct(e.target.value);
                              setActiveDetailIndex(idx);
                            }}
                          />
                        </div>

                        {/* EL DROPDOWN: AHORA REALMENTE LARGO Y FLOTANTE */}
                        {activeDetailIndex === idx && productResults.length > 0 && (
                          <div className="absolute z-[999] left-0 right-[-150px] md:right-[-300px] mt-2 bg-white border border-slate-200 rounded-[2rem] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] border-t-4 border-t-zinc-900 animate-in fade-in slide-in-from-top-2 overflow-hidden">
                            <div className="min-h-[220px] max-h-[480px] overflow-y-auto custom-scrollbar-light">
                              {productResults.map(p => (
                                <button 
                                  key={p.id} 
                                  type="button" 
                                  className="w-full px-6 py-5 text-left hover:bg-slate-50 border-b border-slate-50 last:border-0 flex justify-between items-center group transition-all"
                                  onClick={() => {
                                    updateDetail(idx, 'producto_id', p.id);
                                    updateDetail(idx, 'nombre_temp', `${p.nombre} (${p.unidad_medida?.abreviatura || 'UND'})`);
                                    updateDetail(idx, 'costo_unitario', parseFloat(p.precio_compra) || 0);
                                    setProductResults([]);
                                    setSearchProduct('');
                                    setActiveDetailIndex(null);
                                  }}
                                >
                                  <div className="flex flex-col gap-1">
                                    <p className="text-[11px] font-black text-slate-700 uppercase group-hover:text-zinc-900 transition-colors">{p.nombre}</p>
                                    <div className="flex items-center gap-2">
                                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">Cód: {p.codigo}</span>
                                      <span className="w-1 h-1 rounded-full bg-slate-200"></span>
                                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">{p.marca?.nombre || 'Genérico'}</span>
                                    </div>
                                  </div>
                                  <div className="shrink-0 ml-4">
                                    <span className="text-[9px] font-black bg-slate-100 text-slate-500 px-3 py-1.5 rounded-xl uppercase tracking-widest border border-slate-100 group-hover:bg-zinc-900 group-hover:text-white group-hover:border-zinc-900 transition-all">
                                      {p.unidad_medida?.nombre || 'Unidad'}
                                    </span>
                                  </div>
                                </button>
                              ))}
                            </div>
                            <div className="bg-slate-50 px-6 py-2 border-t border-slate-100">
                               <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest text-center">Resultados de búsqueda activos</p>
                            </div>
                          </div>
                        )}
                      </td>

                      {/* CANTIDAD */}
                      <td className="px-2">
                        <input required type="number" step="any" className="w-full py-4 bg-slate-50 border border-slate-100 rounded-2xl text-center text-xs font-black outline-none focus:bg-white focus:border-zinc-900"
                          value={det.cantidad} onChange={e => updateDetail(idx, 'cantidad', e.target.value)} />
                      </td>

                      {/* COSTO UNITARIO */}
                      <td className="px-2">
                        <div className="relative">
                          <span className="absolute left-3 top-4 text-[10px] font-black text-slate-300">$</span>
                          <input required type="number" step="any" className="w-full pl-7 pr-3 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-right text-xs font-black outline-none focus:bg-white focus:border-zinc-900"
                            value={det.costo_unitario} onChange={e => updateDetail(idx, 'costo_unitario', e.target.value)} />
                        </div>
                      </td>

                      {/* ELIMINAR */}
                      <td className="px-2 text-center">
                        <button type="button" onClick={() => removeDetail(idx)} className="p-3 text-slate-300 hover:text-red-500 transition-colors">
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* OBSERVACIONES */}
            <div className="mt-10 p-2 space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Notas de la compra</label>
              <textarea className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-[1.5rem] text-xs outline-none focus:bg-white focus:border-zinc-900 h-24 resize-none"
                placeholder="Escriba aquí alguna observación interna..." value={formData.observacion} onChange={e => setFormData({...formData, observacion: e.target.value})} />
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};