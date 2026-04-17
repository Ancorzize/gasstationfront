import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowDownCircle, Banknote, CreditCard, Tag, Truck, Loader2, Save, AlignLeft, Calendar } from 'lucide-react';
import { expenseService } from '../services/expenseService';
import { supplierService } from '../../suppliers/services/supplierService';
import { useToast } from '../../../context/ToastContext';

export const ExpenseFormModal = ({ isOpen, onClose, onSave }) => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [displayValor, setDisplayValor] = useState('');
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
      setDisplayValor('');
      setFormData({
        fecha_gasto: new Date().toISOString().split('T')[0],
        proveedor_id: '',
        categoria_gasto_id: '',
        medio_pago: 'efectivo',
        valor: '',
        descripcion: ''
      });
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
    } catch (e) { 
      showToast("Error al cargar opciones", "error"); 
    }
  };

  const handleMoneyChange = (e) => {
    const rawValue = e.target.value.replace(/\D/g, '');
    if (rawValue === '') {
      setDisplayValor('');
      setFormData({ ...formData, valor: '' });
      return;
    }
    const formatted = new Intl.NumberFormat('es-CO').format(rawValue);
    setDisplayValor(formatted);
    setFormData({ ...formData, valor: rawValue });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.valor || formData.valor <= 0) {
        return showToast("El valor del gasto debe ser mayor a 0", "warning");
    }
    setLoading(true);
    try {
      const res = await expenseService.createExpense(formData);
      if (res.status) {
        showToast("Gasto registrado y caja actualizada", "success");
        onSave();
        onClose();
      } else { 
        showToast(res.message, "error"); 
      }
    } catch (e) { 
      showToast("Error al registrar el gasto", "error"); 
    } finally { 
      setLoading(false); 
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-0 md:p-4">
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose} className="absolute inset-0 bg-zinc-950/70 backdrop-blur-sm" 
          />
          <motion.div 
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            className="relative bg-white w-full h-full md:h-auto md:max-w-xl md:rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden"
          >
            <div className="p-5 border-b flex justify-between items-center bg-white sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center text-red-600">
                  <ArrowDownCircle size={18} />
                </div>
                <h3 className="font-black text-slate-800 text-xs md:text-sm uppercase tracking-tight">
                    Registrar Gasto Administrativo
                </h3>
              </div>
              <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-50 rounded-full transition-all">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 md:p-8 space-y-5 custom-scrollbar-light">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">Fecha</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-3.5 text-slate-300" size={16} />
                    <input required type="date" 
                      className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:border-zinc-900 focus:bg-white transition-all"
                      value={formData.fecha_gasto} onChange={e => setFormData({...formData, fecha_gasto: e.target.value})} />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">Medio de Pago</label>
                  <div className="flex bg-slate-100 p-1 rounded-2xl h-[46px]">
                    <button type="button" onClick={() => setFormData({...formData, medio_pago: 'efectivo'})}
                      className={`flex-1 flex items-center justify-center gap-2 rounded-xl text-[9px] font-black uppercase transition-all ${formData.medio_pago === 'efectivo' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400'}`}>
                      <Banknote size={14} /> Efectivo
                    </button>
                    <button type="button" onClick={() => setFormData({...formData, medio_pago: 'electronico'})}
                      className={`flex-1 flex items-center justify-center gap-2 rounded-xl text-[9px] font-black uppercase transition-all ${formData.medio_pago === 'electronico' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}>
                      <CreditCard size={14} /> Virtual
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">Categoría del Gasto</label>
                <div className="relative">
                  <Tag className="absolute left-4 top-3.5 text-slate-300" size={16} />
                  <select required className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:border-zinc-900 focus:bg-white appearance-none transition-all"
                    value={formData.categoria_gasto_id} onChange={e => setFormData({...formData, categoria_gasto_id: e.target.value})}>
                    <option value="">Seleccionar categoría...</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">Proveedor (Opcional)</label>
                <div className="relative">
                  <Truck className="absolute left-4 top-3.5 text-slate-300" size={16} />
                  <select className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:border-zinc-900 focus:bg-white appearance-none transition-all"
                    value={formData.proveedor_id} onChange={e => setFormData({...formData, proveedor_id: e.target.value})}>
                    <option value="">Gasto General / Sin Proveedor</option>
                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">Valor del Gasto</label>
                <div className="relative">
                  <div className="absolute left-5 top-3.5 text-slate-400 font-black text-sm">$</div>
                  <input required type="text"
                    className="w-full pl-10 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-xl font-black outline-none focus:border-zinc-900 focus:bg-white transition-all"
                    placeholder="0" value={displayValor} onChange={handleMoneyChange} />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">Descripción / Concepto</label>
                <div className="relative">
                    <AlignLeft className="absolute left-4 top-4 text-slate-300" size={16} />
                    <textarea required className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs outline-none focus:border-zinc-900 focus:bg-white transition-all h-24 resize-none"
                    placeholder="Detalle del gasto..." value={formData.descripcion}
                    onChange={e => setFormData({...formData, descripcion: e.target.value})} />
                </div>
              </div>

              <div className="pt-4 flex flex-col-reverse md:flex-row gap-3">
                <button type="button" onClick={onClose} 
                    className="flex-1 py-4 rounded-2xl border border-slate-200 text-slate-600 font-black text-[10px] uppercase hover:bg-slate-50 transition-all">
                    Cancelar
                </button>
                <button type="submit" disabled={loading} 
                    className="flex-1 py-4 rounded-2xl bg-zinc-900 text-white font-black text-[10px] uppercase hover:bg-black transition-all flex items-center justify-center gap-2 shadow-xl shadow-zinc-200">
                  {loading ? <Loader2 className="animate-spin" size={18} /> : <><Save size={18}/> Registrar Gasto</>}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};