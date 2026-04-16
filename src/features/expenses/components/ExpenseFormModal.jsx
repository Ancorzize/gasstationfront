import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowDownCircle, Banknote, CreditCard, Tag, Truck, Loader2, Save } from 'lucide-react';
import { expenseService } from '../services/expenseService';
import { supplierService } from '../../suppliers/services/supplierService';
import { useToast } from '../../../context/ToastContext';

export const ExpenseFormModal = ({ isOpen, onClose, onSave }) => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  
  const [formData, setFormData] = useState({
    fecha_gasto: new Date().toISOString().split('T')[0],
    proveedor_id: '',
    categoria_gasto_id: '',
    medio_pago: 'efectivo',
    valor: '',
    descripcion: ''
  });

  useEffect(() => {
    if (isOpen) {
      loadMasters();
    }
  }, [isOpen]);

  const loadMasters = async () => {
    try {
      const [catRes, suppRes] = await Promise.all([
        expenseService.getCategories({ is_active: 1 }),
        supplierService.getSuppliers()
      ]);
      if (catRes.status) setCategories(catRes.data.items || []);
      if (suppRes.status) setSuppliers(suppRes.data.items || []);
    } catch (e) { showToast("Error al cargar opciones", "error"); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await expenseService.createExpense(formData);
      if (res.status) {
        showToast("Gasto registrado y caja actualizada", "success");
        onSave();
        onClose();
        setFormData({ ...formData, valor: '', descripcion: '', proveedor_id: '', categoria_gasto_id: '' });
      } else { showToast(res.message, "error"); }
    } catch (e) { showToast("Error al registrar el gasto", "error"); }
    finally { setLoading(false); }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose} className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm" />
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
            className="relative bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden"
          >
            <div className="p-6 border-b flex justify-between items-center bg-red-50/30">
              <h3 className="font-black text-slate-800 text-sm uppercase flex items-center gap-2">
                <ArrowDownCircle size={18} className="text-red-500" /> Registrar Gasto Administrativo
              </h3>
              <button onClick={onClose} className="p-2 text-slate-400 hover:bg-white rounded-full"><X size={20} /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 grid grid-cols-2 gap-4">
              <div className="col-span-1 space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Fecha</label>
                <input required type="date" className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold outline-none"
                  value={formData.fecha_gasto} onChange={e => setFormData({...formData, fecha_gasto: e.target.value})} />
              </div>

              <div className="col-span-1 space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Medio de Pago</label>
                <div className="flex bg-slate-100 p-1 rounded-2xl">
                  <button type="button" onClick={() => setFormData({...formData, medio_pago: 'efectivo'})}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-[9px] font-black uppercase transition-all ${formData.medio_pago === 'efectivo' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400'}`}>
                    <Banknote size={14} /> Efectivo
                  </button>
                  <button type="button" onClick={() => setFormData({...formData, medio_pago: 'electronico'})}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-[9px] font-black uppercase transition-all ${formData.medio_pago === 'electronico' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}>
                    <CreditCard size={14} /> Virtual
                  </button>
                </div>
              </div>

              <div className="col-span-2 space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Categoría del Gasto</label>
                <div className="relative">
                  <Tag className="absolute left-4 top-3 text-slate-300" size={16} />
                  <select required className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold outline-none focus:border-zinc-900"
                    value={formData.categoria_gasto_id} onChange={e => setFormData({...formData, categoria_gasto_id: e.target.value})}>
                    <option value="">Seleccionar categoría...</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                  </select>
                </div>
              </div>

              <div className="col-span-2 space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Proveedor (Opcional)</label>
                <div className="relative">
                  <Truck className="absolute left-4 top-3 text-slate-300" size={16} />
                  <select className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold outline-none focus:border-zinc-900"
                    value={formData.proveedor_id} onChange={e => setFormData({...formData, proveedor_id: e.target.value})}>
                    <option value="">Gasto General / Sin Proveedor</option>
                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                  </select>
                </div>
              </div>

              <div className="col-span-2 space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Valor del Gasto</label>
                <div className="relative">
                  <span className="absolute left-4 top-3.5 text-slate-300 font-black">$</span>
                  <input required type="number" step="any" className="w-full pl-10 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-lg font-black outline-none focus:border-zinc-900"
                    placeholder="0.00" value={formData.valor} onChange={e => setFormData({...formData, valor: e.target.value})} />
                </div>
              </div>

              <div className="col-span-2 space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Descripción / Concepto</label>
                <textarea required className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs outline-none focus:border-zinc-900 h-20 resize-none"
                  placeholder="Detalle del gasto..." value={formData.descripcion}
                  onChange={e => setFormData({...formData, descripcion: e.target.value})} />
              </div>

              <button type="submit" disabled={loading} className="col-span-2 mt-2 py-4 bg-zinc-900 text-white rounded-2xl font-black text-xs uppercase hover:bg-black flex items-center justify-center gap-2 transition-all shadow-xl">
                {loading ? <Loader2 className="animate-spin" size={18} /> : 'Registrar Gasto'}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};