import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ShoppingBag, Plus, Trash2, Save, ArrowLeft, 
  Search, Package, Truck, Warehouse, Calendar, Info 
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
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Datos maestros
  const [providers, setProviders] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);

  // Estado del formulario
  const [formData, setFormData] = useState({
    proveedor_id: '',
    bodega_id: '',
    numero_documento: '',
    fecha_compra: new Date().toISOString().split('T')[0],
    fecha_vencimiento: '',
    tipo_pago: 'contado',
    impuesto: 0,
    observacion: '',
    detalles: []
  });

  useEffect(() => {
    loadMasters();
    if (id) loadPurchase();
  }, [id]);

  const loadMasters = async () => {
    setLoading(true);
    try {
        // Ejecutamos las 3 llamadas en paralelo
        const [suppsRes, warsRes, prodsRes] = await Promise.all([
            supplierService.getSuppliers(),  
            warehouseService.getWarehouses(),
            productService.getProducts({ per_page: 1000 }) 
        ]);

        if (suppsRes.status) {
        setProviders(suppsRes.data?.items || []);
        }
        
        if (warsRes.status) {
        setWarehouses(warsRes.data?.items || []);
        }

        if (prodsRes.status) {
        setProducts(prodsRes.data?.items || []);
        }

    } catch (e) {
        console.error("Error detallado:", e); 
        showToast("Error al cargar datos maestros", "error");
    } finally {
        setLoading(false);
    }
    };

  const loadPurchase = async () => {
    setLoading(true);
    try {
      const res = await purchaseService.getPurchaseById(id);
      if (res.status) {
        if (res.data.estado !== 'borrador') {
          showToast("Solo se pueden editar compras en borrador", "warning");
          navigate('/compras');
          return;
        }
        setFormData(res.data);
      }
    } catch (e) { showToast("Error al cargar compra", "error"); }
    finally { setLoading(false); }
  };

  const addDetail = () => {
    setFormData({
      ...formData,
      detalles: [...formData.detalles, { producto_id: '', cantidad: 1, costo_unitario: 0 }]
    });
  };

  const removeDetail = (index) => {
    const newDetalles = [...formData.detalles];
    newDetalles.splice(index, 1);
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
    if (formData.detalles.length === 0) return showToast("Debe agregar al menos un producto", "error");
    
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
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <ArrowLeft size={24} className="text-slate-600" />
          </button>
          <div>
            <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">
              {id ? 'Editar Compra' : 'Nueva Compra'}
            </h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              {id ? `ID: #${id}` : 'Registro de entrada de mercancía'}
            </p>
          </div>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna Izquierda: Datos de la Compra */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-4">
            <h3 className="text-xs font-black text-slate-400 uppercase flex items-center gap-2">
              <Info size={14} /> Información General
            </h3>
            
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Proveedor</label>
                <div className="relative">
                  <Truck className="absolute left-4 top-3 text-slate-300" size={16} />
                  <select required className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs outline-none focus:border-zinc-900"
                    value={formData.proveedor_id} onChange={e => setFormData({...formData, proveedor_id: e.target.value})}>
                    <option value="">Seleccione proveedor</option>
                    {providers.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Bodega de Ingreso</label>
                <div className="relative">
                  <Warehouse className="absolute left-4 top-3 text-slate-300" size={16} />
                  <select required className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs outline-none focus:border-zinc-900"
                    value={formData.bodega_id} onChange={e => setFormData({...formData, bodega_id: e.target.value})}>
                    <option value="">Seleccione bodega</option>
                    {warehouses.map(w => <option key={w.id} value={w.id}>{w.nombre}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Documento #</label>
                  <input className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs outline-none focus:border-zinc-900"
                    placeholder="FC-000" value={formData.numero_documento} onChange={e => setFormData({...formData, numero_documento: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Tipo Pago</label>
                  <select className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold uppercase outline-none focus:border-zinc-900"
                    value={formData.tipo_pago} onChange={e => setFormData({...formData, tipo_pago: e.target.value})}>
                    <option value="contado">Contado</option>
                    <option value="credito">Crédito</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Fecha</label>
                  <input type="date" className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs outline-none focus:border-zinc-900"
                    value={formData.fecha_compra} onChange={e => setFormData({...formData, fecha_compra: e.target.value})} />
                </div>
                {formData.tipo_pago === 'credito' && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Vencimiento</label>
                    <input type="date" className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs outline-none focus:border-zinc-900 border-yellow-200"
                      value={formData.fecha_vencimiento} onChange={e => setFormData({...formData, fecha_vencimiento: e.target.value})} />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-zinc-900 p-8 rounded-[2.5rem] text-white shadow-xl shadow-zinc-200 space-y-4">
             <div className="flex justify-between items-center text-zinc-400 uppercase font-black text-[10px]">
                <span>Total Compra</span>
                <span className="bg-zinc-800 px-3 py-1 rounded-full">{formData.detalles.length} Items</span>
             </div>
             <p className="text-4xl font-black tracking-tighter">$ {calculateTotal().toLocaleString('es-CO')}</p>
             <button type="submit" disabled={saving} className="w-full py-4 bg-yellow-500 text-black font-black uppercase text-xs rounded-2xl hover:bg-yellow-400 transition-all flex items-center justify-center gap-2">
                {saving ? 'Guardando...' : <><Save size={18}/> Guardar Borrador</>}
             </button>
          </div>
        </div>

        {/* Columna Derecha: Detalles */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
            <div className="p-6 border-b flex justify-between items-center bg-slate-50/50">
               <h3 className="text-xs font-black text-slate-500 uppercase flex items-center gap-2">
                 <Package size={16} /> Lista de Productos
               </h3>
               <button type="button" onClick={addDetail} className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-xl text-[10px] font-black uppercase hover:bg-black transition-all">
                 <Plus size={14} /> Agregar Item
               </button>
            </div>

            <div className="flex-1 overflow-x-auto p-4">
              <table className="w-full text-left border-separate border-spacing-y-3">
                <thead>
                  <tr>
                    <th className="px-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Producto</th>
                    <th className="px-4 text-[9px] font-black text-slate-400 uppercase tracking-widest w-24">Cantidad</th>
                    <th className="px-4 text-[9px] font-black text-slate-400 uppercase tracking-widest w-32">Costo Unit.</th>
                    <th className="px-4 text-[9px] font-black text-slate-400 uppercase tracking-widest w-32 text-right">Subtotal</th>
                    <th className="px-4 w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {formData.detalles.map((det, idx) => (
                    <tr key={idx} className="bg-slate-50 rounded-2xl overflow-hidden group">
                      <td className="px-4 py-3 rounded-l-2xl">
                        <select required className="w-full bg-transparent text-xs font-bold outline-none"
                          value={det.producto_id} onChange={e => updateDetail(idx, 'producto_id', e.target.value)}>
                          <option value="">Seleccionar...</option>
                          {products.map(p => <option key={p.id} value={p.id}>{p.nombre} ({p.codigo})</option>)}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <input type="number" min="1" step="any" className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-black"
                          value={det.cantidad} onChange={e => updateDetail(idx, 'cantidad', parseFloat(e.target.value))} />
                      </td>
                      <td className="px-4 py-3">
                        <input type="number" min="0" step="any" className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-black"
                          value={det.costo_unitario} onChange={e => updateDetail(idx, 'costo_unitario', parseFloat(e.target.value))} />
                      </td>
                      <td className="px-4 py-3 text-right text-xs font-black text-slate-700">
                        ${(det.cantidad * det.costo_unitario).toLocaleString('es-CO')}
                      </td>
                      <td className="px-4 py-3 rounded-r-2xl">
                        <button type="button" onClick={() => removeDetail(idx)} className="p-2 text-slate-300 hover:text-red-500 transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {formData.detalles.length === 0 && (
                    <tr>
                      <td colSpan="5" className="py-20 text-center">
                        <p className="text-xs font-bold text-slate-300 uppercase italic">Haga clic en "Agregar Item" para empezar</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-8 bg-slate-50/50 border-t border-slate-100">
               <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center gap-10">
                     <span className="text-[10px] font-black text-slate-400 uppercase">Impuestos / IVA</span>
                     <input type="number" className="w-32 bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-black text-right outline-none"
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