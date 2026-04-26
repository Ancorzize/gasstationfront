import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Plus, Trash2, Save, ArrowLeft, 
  Search, Info, Loader2, Calendar as CalendarIcon, Hash,
  Database, CreditCard, ShoppingBag
} from 'lucide-react';
import { purchaseService } from '../services/purchaseService';
import { supplierService } from '../../suppliers/services/supplierService';
import { warehouseService } from '../../warehouses/services/warehouseService';
import { productService } from '../../products/services/productService';
import { companyService } from '../../settings/services/companyService';
import { useToast } from '../../../context/ToastContext';
import { getTodayStr } from '../../../shared/utils/dateUtils';

export const PurchaseFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [suppliers, setSuppliers] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [searchProduct, setSearchProduct] = useState('');
  const [productResults, setProductResults] = useState([]);
  const [activeDetailIndex, setActiveDetailIndex] = useState(null);
  const [defaultIva, setDefaultIva] = useState(0);

  const [formData, setFormData] = useState({
    proveedor_id: '',
    bodega_id: '',
    numero_documento: '',
    fecha_compra: getTodayStr(),
    tipo_pago: 'efectivo',
    fecha_vencimiento: '',
    numero_comprobante: '',
    observacion: '',
    detalles: [{ 
      producto_id: '', 
      nombre_temp: '', 
      unidad_temp: '',
      cantidad: 1, 
      costo_unitario: 0,
      porcentaje_iva: 0,
      iva_valor: 0,
      soldicom: 0,
      sobre_tasa: 0,
      subtotal: 0,
      total: 0
    }]
  });

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await loadMasters();
      if (id) await loadPurchaseToEdit();
      setLoading(false);
    };
    init();
  }, [id]);

  const loadMasters = async () => {
    try {
      const [suppRes, wareRes, compRes] = await Promise.all([
        supplierService.getSuppliers(),
        warehouseService.getWarehouses(),
        companyService.getConfig()
      ]);
      if (suppRes.status) setSuppliers(suppRes.data.items || []);
      if (wareRes.status) setWarehouses(wareRes.data.items || []);
      if (compRes.status) {
        const iva = parseFloat(compRes.data.porcentaje_iva) || 0;
        setDefaultIva(iva);
        if (!id) {
            setFormData(prev => ({
                ...prev,
                detalles: prev.detalles.map(d => ({ ...d, porcentaje_iva: iva }))
            }));
        }
      }
    } catch (e) { showToast("Error al cargar maestros", "error"); }
  };

  const recalculateRow = (row, fieldChanged) => {
    const cantidad = parseFloat(row.cantidad) || 0;
    const costo = parseFloat(row.costo_unitario) || 0;
    const soldicomUnitario = parseFloat(row.soldicom) || 0;
    const sobreTasaUnitario = parseFloat(row.sobre_tasa) || 0;
    const subtotal = cantidad * costo;

    let iva_valor = parseFloat(row.iva_valor) || 0;
    let porcentaje_iva = parseFloat(row.porcentaje_iva) || 0;

    if (fieldChanged === 'porcentaje_iva' || fieldChanged === 'cantidad' || fieldChanged === 'costo_unitario' || fieldChanged === 'init') {
      iva_valor = subtotal * (porcentaje_iva / 100);
    } else if (fieldChanged === 'iva_valor') {
      porcentaje_iva = subtotal > 0 ? (iva_valor / subtotal) * 100 : 0;
    }

    const totalSoldicom = soldicomUnitario * cantidad;
    const totalSobreTasa = sobreTasaUnitario * cantidad;
    const total = subtotal + iva_valor + totalSoldicom + totalSobreTasa;

    return { 
      ...row, 
      subtotal: parseFloat(subtotal.toFixed(2)), 
      iva_valor: parseFloat(iva_valor.toFixed(2)), 
      porcentaje_iva: parseFloat(porcentaje_iva.toFixed(2)), 
      total: parseFloat(total.toFixed(2)) 
    };
  };

  const loadPurchaseToEdit = async () => {
    try {
      const res = await purchaseService.getPurchaseById(id);
      if (res.status) {
        const p = res.data;
        const detallesCalculados = p.detalles.map(d => recalculateRow({
          producto_id: d.producto_id,
          nombre_temp: d.producto?.nombre,
          unidad_temp: d.producto?.unidad_medida?.abreviatura,
          cantidad: d.cantidad,
          costo_unitario: d.costo_unitario,
          porcentaje_iva: d.iva,
          iva_valor: d.iva_valor,
          soldicom: d.soldicom,
          sobre_tasa: d.sobre_tasa || 0,
        }, 'init'));

        setFormData({
          proveedor_id: p.proveedor_id,
          bodega_id: p.bodega_id,
          numero_documento: p.numero_documento,
          fecha_compra: p.fecha_compra,
          tipo_pago: p.tipo_pago,
          fecha_vencimiento: p.fecha_vencimiento || '',
          numero_comprobante: p.numero_comprobante || '',
          observacion: p.observacion || '',
          detalles: detallesCalculados
        });
      }
    } catch (e) { showToast("Error al cargar la compra", "error"); }
  };

  const updateDetail = (index, field, value) => {
    setFormData(prev => {
      const newDetalles = [...prev.detalles];
      const updatedRow = { ...newDetalles[index], [field]: value };
      newDetalles[index] = recalculateRow(updatedRow, field);
      return { ...prev, detalles: newDetalles };
    });
  };

  const addDetail = () => {
    const newRow = recalculateRow({ 
      producto_id: '', nombre_temp: '', unidad_temp: '',
      cantidad: 1, costo_unitario: 0, porcentaje_iva: defaultIva, 
      iva_valor: 0, soldicom: 0, sobre_tasa: 0, subtotal: 0, total: 0
    }, 'porcentaje_iva');
    setFormData(prev => ({ ...prev, detalles: [...prev.detalles, newRow] }));
  };

  const removeDetail = (index) => {
    if (formData.detalles.length === 1) return;
    setFormData(prev => ({ ...prev, detalles: prev.detalles.filter((_, i) => i !== index) }));
  };

  const totalPagar = formData.detalles.reduce((acc, item) => acc + (parseFloat(item.total) || 0), 0);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchProduct.length >= 3) performProductSearch();
      else setProductResults([]);
    }, 400);
    return () => clearTimeout(delayDebounceFn);
  }, [searchProduct]);

  const performProductSearch = async () => {
    try {
      const res = await productService.getProducts({ search: searchProduct });
      if (res.status) setProductResults(res.data.items || []);
    } catch (e) { console.error(e); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.detalles.some(d => !d.producto_id)) {
      return showToast("Complete todos los productos", "warning");
    }
    if (formData.tipo_pago === 'credito' && !formData.fecha_vencimiento) {
        return showToast("Debe seleccionar una fecha de vencimiento", "warning");
    }

    const payload = {
      ...formData,
      impuesto: formData.detalles.reduce((acc, d) => acc + (parseFloat(d.iva_valor) || 0), 0),
      soldicom: formData.detalles.reduce((acc, d) => acc + (parseFloat(d.soldicom) * parseFloat(d.cantidad)), 0),
      sobre_tasa: formData.detalles.reduce((acc, d) => acc + (parseFloat(d.sobre_tasa) * parseFloat(d.cantidad)), 0),
      total: totalPagar,
      detalles: formData.detalles.map(d => ({
        producto_id: d.producto_id,
        cantidad: d.cantidad,
        costo_unitario: d.costo_unitario,
        iva: d.porcentaje_iva,
        iva_valor: d.iva_valor,
        soldicom: d.soldicom,
        sobre_tasa: d.sobre_tasa,
        subtotal: d.subtotal,
        total: d.total
      }))
    };

    setIsSaving(true);
    try {
      const res = id 
        ? await purchaseService.updatePurchase(id, payload) 
        : await purchaseService.createPurchase(payload);

      if (res.status) {
        showToast(id ? "Compra actualizada" : "Compra registrada", "success");
        navigate('/compras');
      }
    } catch (e) { showToast("Error de conexión", "error"); }
    finally { setIsSaving(false); }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <Loader2 className="animate-spin text-zinc-900" size={40} />
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cargando...</p>
    </div>
  );

  return (
    <div className="p-4 md:p-8 space-y-6 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/compras')} className="p-3 bg-white border border-slate-100 rounded-2xl text-slate-400 shadow-sm transition-all hover:text-zinc-900">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">{id ? 'Editar' : 'Nueva'} Compra</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Gestión de adquisiciones</p>
          </div>
        </div>

        <div className="flex items-center gap-8">
          <div className="text-right">
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Total a Pagar</p>
            <p className="text-3xl font-black text-zinc-900 tracking-tighter">$ {totalPagar.toLocaleString('es-CO')}</p>
          </div>
          <button form="purchase-form" type="submit" disabled={isSaving} className="flex items-center gap-2 px-8 py-4 bg-zinc-900 text-white rounded-2xl font-black text-xs uppercase hover:bg-black transition-all shadow-xl shadow-zinc-200">
            {isSaving ? <Loader2 className="animate-spin" size={18} /> : <><Save size={18}/> {id ? 'Actualizar' : 'Procesar'} Compra</>}
          </button>
        </div>
      </header>

      <form id="purchase-form" onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-50 pb-4">
            <Info className="text-slate-300" size={18} />
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Datos de Facturación e Impuestos</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Proveedor</label>
              <select required className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold outline-none focus:border-zinc-900 transition-all"
                value={formData.proveedor_id} onChange={e => setFormData({...formData, proveedor_id: e.target.value})}>
                <option value="">Seleccione...</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Bodega</label>
              <select required className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold outline-none focus:border-zinc-900 transition-all"
                value={formData.bodega_id} onChange={e => setFormData({...formData, bodega_id: e.target.value})}>
                <option value="">Seleccione...</option>
                {warehouses.map(w => <option key={w.id} value={w.id}>{w.nombre}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Factura #</label>
              <input required className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold outline-none focus:border-zinc-900 transition-all"
                placeholder="N° Documento" value={formData.numero_documento} onChange={e => setFormData({...formData, numero_documento: e.target.value.toUpperCase()})} />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Tipo de Pago</label>
              <select className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold outline-none focus:border-zinc-900 transition-all text-center"
                value={formData.tipo_pago} onChange={e => setFormData({...formData, tipo_pago: e.target.value, fecha_vencimiento: '', numero_comprobante: ''})}>
                <option value="efectivo">EFECTIVO</option>
                <option value="transferencia">TRANSFERENCIA</option>
                <option value="consignacion">CONSIGNACIÓN</option>
                <option value="credito">CRÉDITO</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Fecha Emisión</label>
              <input required type="date" className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold outline-none focus:border-zinc-900 transition-all"
                value={formData.fecha_compra} onChange={e => setFormData({...formData, fecha_compra: e.target.value})} />
            </div>
          </div>

          {(formData.tipo_pago === 'credito' || formData.tipo_pago === 'transferencia' || formData.tipo_pago === 'consignacion') && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 animate-in fade-in slide-in-from-top-2">
              {formData.tipo_pago === 'credito' && (
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-orange-500 uppercase ml-1 flex items-center gap-1.5"><CalendarIcon size={12} /> Fecha de Vencimiento</label>
                  <input required type="date" className="w-full px-5 py-4 bg-orange-50 border border-orange-100 rounded-2xl text-xs font-bold outline-none focus:border-orange-500 transition-all text-orange-700"
                    value={formData.fecha_vencimiento} onChange={e => setFormData({...formData, fecha_vencimiento: e.target.value})} />
                </div>
              )}
              {(formData.tipo_pago === 'transferencia' || formData.tipo_pago === 'consignacion') && (
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-blue-500 uppercase ml-1 flex items-center gap-1.5"><Hash size={12} /> Número de Comprobante</label>
                  <input required className="w-full px-5 py-4 bg-blue-50 border border-blue-100 rounded-2xl text-xs font-bold outline-none focus:border-blue-500 transition-all text-blue-700"
                    placeholder="Ref. Operación" value={formData.numero_comprobante} onChange={e => setFormData({...formData, numero_comprobante: e.target.value.toUpperCase()})} />
                </div>
              )}
            </div>
          )}
        </div>

        {/* DETALLE DE MERCANCÍA - MEJORA DE OVERFLOW PARA EL BUSCADOR */}
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8">
          <div className="flex justify-between items-center mb-8 px-2">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-3">
               <ShoppingBag className="text-slate-300" size={18} /> Detalle de Mercancía
            </h3>
            <button type="button" onClick={addDetail} className="flex items-center gap-2 px-6 py-3 bg-zinc-900 text-white rounded-2xl font-black text-[10px] uppercase hover:bg-black transition-all shadow-lg">
              <Plus size={14} /> Agregar Producto
            </button>
          </div>
          
          {/* ELIMINADO overflow-x-auto AQUÍ PARA QUE EL BUSCADOR NO SE CORTE */}
          <div className="relative">
            <table className="w-full border-separate border-spacing-y-3">
              <thead>
                <tr className="text-[9px] font-black text-slate-400 uppercase text-left tracking-widest">
                  <th className="px-3 pb-2 min-w-[250px]">Buscador de Producto</th>
                  <th className="px-2 pb-2 text-center w-16">UM</th>
                  <th className="px-2 pb-2 text-center w-18">Cant.</th>
                  <th className="px-2 pb-2 text-right w-28">Costo U.</th>
                  <th className="px-2 pb-2 text-center w-14">IVA%</th>
                  <th className="px-2 pb-2 text-right w-28">IVA Valor</th>
                  <th className="px-2 pb-2 text-right w-24">Soldicom</th>
                  <th className="px-2 pb-2 text-right w-24">Sobre Tasa</th>
                  <th className="px-3 pb-2 text-right w-36">Total Línea</th>
                  <th className="px-2 pb-2 w-10 text-center"></th>
                </tr>
              </thead>
              <tbody>
                {formData.detalles.map((det, idx) => (
                  <tr key={idx} className="group relative">
                    <td className="px-1 relative">
                      <div className="relative">
                        <Search className={`absolute left-3 top-3.5 ${det.producto_id ? 'text-emerald-500' : 'text-slate-300'}`} size={14} />
                        <input type="text" className={`w-full pl-9 pr-3 py-3 bg-slate-50 border rounded-xl text-[10px] font-bold outline-none transition-all ${activeDetailIndex === idx ? 'border-zinc-900 bg-white' : 'border-slate-100'}`}
                          placeholder="Buscar..." value={det.producto_id ? det.nombre_temp : (activeDetailIndex === idx ? searchProduct : '')}
                          onFocus={() => setActiveDetailIndex(idx)}
                          onChange={(e) => {
                            if (det.producto_id) updateDetail(idx, 'producto_id', '');
                            setSearchProduct(e.target.value);
                            setActiveDetailIndex(idx);
                          }} />
                      </div>
                      
                      {activeDetailIndex === idx && productResults.length > 0 && (
                        <div className="absolute z-[9999] left-0 right-[-200px] mt-1 bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                          <div className="max-h-60 overflow-y-auto">
                            {productResults.map(p => (
                              <button key={p.id} type="button" className="w-full px-4 py-3 text-left hover:bg-slate-50 border-b border-slate-50 flex justify-between items-center group/item"
                                onClick={() => {
                                  setFormData(prev => {
                                      const newDetalles = [...prev.detalles];
                                      newDetalles[idx] = recalculateRow({
                                          ...newDetalles[idx],
                                          producto_id: p.id,
                                          nombre_temp: p.nombre,
                                          unidad_temp: p.unidad_medida?.abreviatura || 'UND',
                                          costo_unitario: parseFloat(p.precio_compra) || 0
                                      }, 'costo_unitario');
                                      return { ...prev, detalles: newDetalles };
                                  });
                                  setProductResults([]);
                                  setSearchProduct('');
                                  setActiveDetailIndex(null);
                                }}>
                                <div className="flex flex-col">
                                  <span className="text-[10px] font-black uppercase text-slate-700">{p.nombre}</span>
                                  <span className="text-[8px] font-bold text-slate-400">CÓD: {p.codigo}</span>
                                </div>
                                <span className="text-[9px] font-black bg-slate-100 px-2 py-0.5 rounded text-slate-500 group-hover/item:bg-zinc-900 group-hover/item:text-white transition-all">{p.unidad_medida?.abreviatura}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="px-1 text-center font-black text-slate-400 text-[10px] uppercase">{det.unidad_temp || '---'}</td>
                    <td className="px-1">
                      <input type="number" step="any" className="w-full py-3 bg-slate-50 border border-slate-100 rounded-xl text-center text-[11px] font-black outline-none focus:bg-white focus:border-zinc-900"
                        value={det.cantidad || ''} onChange={e => updateDetail(idx, 'cantidad', e.target.value)} />
                    </td>
                    <td className="px-1">
                      <input type="number" step="any" className="w-full py-3 bg-slate-50 border border-slate-100 rounded-xl text-right text-[11px] font-black outline-none focus:bg-white focus:border-zinc-900"
                        value={det.costo_unitario || ''} onChange={e => updateDetail(idx, 'costo_unitario', e.target.value)} />
                    </td>
                    <td className="px-1">
                      <input type="number" step="any" className="w-full py-3 bg-slate-50 border border-slate-100 rounded-xl text-center text-[11px] font-black outline-none focus:bg-white focus:border-emerald-500 text-emerald-600"
                        value={det.porcentaje_iva || ''} onChange={e => updateDetail(idx, 'porcentaje_iva', e.target.value)} />
                    </td>
                    <td className="px-1">
                      <input type="number" step="any" className="w-full py-3 bg-slate-50 border border-slate-100 rounded-xl text-right text-[11px] font-black outline-none focus:bg-white focus:border-emerald-500 text-emerald-700 font-bold"
                        value={det.iva_valor || ''} onChange={e => updateDetail(idx, 'iva_valor', e.target.value)} />
                    </td>
                    <td className="px-1">
                      <input type="number" step="any" className="w-full py-3 bg-slate-50 border border-slate-100 rounded-xl text-right text-[11px] font-black outline-none focus:bg-white focus:border-blue-500 text-blue-600"
                        placeholder="0" value={det.soldicom || ''} onChange={e => updateDetail(idx, 'soldicom', e.target.value)} />
                    </td>
                    <td className="px-1">
                      <input type="number" step="any" className="w-full py-3 bg-slate-50 border border-slate-100 rounded-xl text-right text-[11px] font-black outline-none focus:bg-white focus:border-orange-500 text-orange-600"
                        placeholder="0" value={det.sobre_tasa || ''} onChange={e => updateDetail(idx, 'sobre_tasa', e.target.value)} />
                    </td>
                    <td className="px-3 text-right font-black text-slate-700 text-sm tracking-tighter">$ {det.total.toLocaleString('es-CO')}</td>
                    <td className="px-1 text-center">
                      <button type="button" onClick={() => removeDetail(idx)} className="p-2 text-slate-300 hover:text-red-500 transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">Observaciones</label>
              <textarea 
                className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-[1.5rem] text-[11px] outline-none focus:bg-white focus:border-zinc-900 h-24 resize-none transition-all uppercase font-medium"
                placeholder="Notas adicionales..." 
                value={formData.observacion} 
                onChange={e => setFormData({...formData, observacion: e.target.value})} 
              />
            </div>
            
            <div className="bg-slate-50 rounded-[2rem] p-6 space-y-3">
              <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">
                <span>Subtotal Neto</span>
                <span>$ {formData.detalles.reduce((acc, d) => acc + d.subtotal, 0).toLocaleString('es-CO')}</span>
              </div>
              <div className="flex justify-between text-[10px] font-black text-emerald-600 uppercase tracking-widest px-2">
                <span>IVA Acumulado</span>
                <span>$ {formData.detalles.reduce((acc, d) => acc + d.iva_valor, 0).toLocaleString('es-CO')}</span>
              </div>
              <div className="flex justify-between text-[10px] font-black text-blue-600 uppercase tracking-widest px-2">
                <span>Total Soldicom</span>
                <span>$ {formData.detalles.reduce((acc, d) => acc + (parseFloat(d.soldicom || 0) * d.cantidad), 0).toLocaleString('es-CO')}</span>
              </div>
              <div className="flex justify-between text-[10px] font-black text-orange-600 uppercase tracking-widest px-2">
                <span>Total Sobre Tasa</span>
                <span>$ {formData.detalles.reduce((acc, d) => acc + (parseFloat(d.sobre_tasa || 0) * d.cantidad), 0).toLocaleString('es-CO')}</span>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};