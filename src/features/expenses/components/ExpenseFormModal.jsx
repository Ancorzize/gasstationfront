import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowDownCircle, Loader2, Save, Calendar } from 'lucide-react';
import { expenseService } from '../services/expenseService';
import { supplierService } from '../../suppliers/services/supplierService';
import { cashService } from '../../cash/services/cashService';
import { useToast } from '../../../context/ToastContext';

export const ExpenseFormModal = ({ isOpen, onClose, onSave }) => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [cajasAbiertas, setCajasAbiertas] = useState([]);
  const [displayValor, setDisplayValor] = useState('');

  const getLocalDateString = () => new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    fecha_gasto: getLocalDateString(), proveedor_id: '', categoria_gasto_id: '',
    caja_id: '', tipo_caja: '', valor: '', descripcion: ''
  });

  useEffect(() => {
    if (isOpen) {
      loadMasters();
      setDisplayValor('');
    }
  }, [isOpen]);

  const loadMasters = async () => {
    try {
      const [catRes, suppRes, cashRes] = await Promise.all([
        expenseService.getCategories({ is_active: 1 }),
        supplierService.getSuppliers(),
        cashService.getCurrentCash()
      ]);
      setCategories(catRes.status ? catRes.data.items : []);
      setSuppliers(suppRes.status ? suppRes.data.items : []);
      setCajasAbiertas(cashRes.status ? cashRes.data : []);
      
      const lastCajaId = localStorage.getItem('last_selected_caja_id');
      const cajaEncontrada = cashRes.data?.find(c => String(c.id) === String(lastCajaId));
      setFormData(prev => ({
        ...prev, 
        caja_id: cajaEncontrada?.id || '',
        tipo_caja: cajaEncontrada?.tipo_caja || ''
      }));
    } catch (e) { showToast("Error al cargar opciones", "error"); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.caja_id || !formData.valor) return showToast("Completa los campos obligatorios", "warning");
    setLoading(true);
    const res = await expenseService.createExpense(formData);
    if (res.status) {
      localStorage.setItem('last_selected_caja_id', formData.caja_id);
      showToast("Gasto registrado", "success");
      onSave(); onClose();
    } else showToast(res.message || "Error", "error");
    setLoading(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-zinc-950/60 backdrop-blur-sm" />
          <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center bg-slate-50/50">
              <h3 className="font-black text-slate-700 text-xs uppercase tracking-wider flex items-center gap-2">
                <ArrowDownCircle size={16} className="text-red-500" /> Registrar Gasto
              </h3>
              <button onClick={onClose}><X size={18} className="text-slate-400" /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Fecha</label>
                  <input required type="date" className="w-full px-3 py-2.5 bg-slate-50 border rounded-xl text-xs font-bold outline-none" value={formData.fecha_gasto} onChange={e => setFormData({...formData, fecha_gasto: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Valor</label>
                  <input required type="text" className="w-full px-3 py-2.5 bg-slate-50 border rounded-xl text-xs font-black outline-none" placeholder="$ 0" value={displayValor} onChange={e => { const raw = e.target.value.replace(/\D/g, ''); setDisplayValor(raw ? new Intl.NumberFormat('es-CO').format(raw) : ''); setFormData({...formData, valor: raw}); }} />
                </div>
              </div>

              <select required className="w-full px-3 py-2.5 bg-slate-50 border rounded-xl text-xs font-bold outline-none" value={formData.caja_id} onChange={e => { const c = cajasAbiertas.find(x => String(x.id) === String(e.target.value)); setFormData({...formData, caja_id: e.target.value, tipo_caja: c?.tipo_caja || ''}); }}>
                <option value="">Seleccionar caja...</option>
                {cajasAbiertas.map(c => <option key={c.id} value={c.id}>{c.nombre} ({c.tipo_caja})</option>)}
              </select>

              <div className="grid grid-cols-2 gap-3">
                <select className="w-full px-3 py-2.5 bg-slate-50 border rounded-xl text-xs font-bold outline-none" value={formData.categoria_gasto_id} onChange={e => setFormData({...formData, categoria_gasto_id: e.target.value})}>
                  <option value="">Categoría...</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
                <select className="w-full px-3 py-2.5 bg-slate-50 border rounded-xl text-xs font-bold outline-none" value={formData.proveedor_id} onChange={e => setFormData({...formData, proveedor_id: e.target.value})}>
                  <option value="">Proveedor (Opcional)...</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                </select>
              </div>

              <textarea required className="w-full px-3 py-2.5 bg-slate-50 border rounded-xl text-xs outline-none h-16 resize-none" placeholder="Descripción del gasto..." value={formData.descripcion} onChange={e => setFormData({...formData, descripcion: e.target.value})} />

              <button type="submit" disabled={loading} className="w-full py-3 rounded-xl bg-zinc-900 text-white font-black text-xs uppercase hover:bg-black transition-all flex items-center justify-center gap-2">
                {loading ? <Loader2 className="animate-spin" size={16} /> : <><Save size={16}/> Registrar Gasto</>}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};