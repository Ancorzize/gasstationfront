import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, Loader2 } from 'lucide-react';
import { expenseService } from '../services/expenseService';
import { useToast } from '../../../context/ToastContext';

export const VoidExpenseModal = ({ isOpen, onClose, onConfirm, expenseId }) => {
  const [motivo, setMotivo] = useState('');
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const handleVoid = async () => {
    if (motivo.length < 5) return showToast("El motivo debe tener al menos 5 caracteres", "warning");
    
    setLoading(true);
    try {
      const res = await expenseService.voidExpense(expenseId, motivo);
      if (res.status) {
        showToast("Gasto anulado correctamente", "success");
        onConfirm();
        onClose();
      } else { showToast(res.message, "error"); }
    } catch (e) { showToast("Error al anular", "error"); }
    finally { setLoading(false); }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm" 
            onClick={onClose} 
          />
          
          {/* Contenido del Modal: Forzamos nitidez absoluta */}
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }} 
            className="relative bg-white p-8 rounded-[2.5rem] w-full max-w-sm text-center space-y-6 shadow-2xl"
            style={{ backdropFilter: 'none', WebkitBackdropFilter: 'none' }} // Forzar nitidez
          >
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle size={32} />
            </div>
            
            <div className="space-y-2">
              <h3 className="font-black text-slate-800 uppercase text-sm">¿Anular este gasto?</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Esta acción no se puede deshacer.</p>
            </div>

            <textarea 
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs outline-none focus:border-zinc-900 transition-all" 
              placeholder="Escribe el motivo (mínimo 5 caracteres)..."
              onChange={(e) => setMotivo(e.target.value)}
            />
            
            <div className="flex gap-2">
              <button onClick={onClose} className="flex-1 py-4 bg-slate-100 rounded-2xl font-black text-[10px] uppercase hover:bg-slate-200 transition-all">Cancelar</button>
              <button onClick={handleVoid} disabled={loading} className="flex-1 py-4 bg-red-600 text-white rounded-2xl font-black text-[10px] uppercase hover:bg-red-700 transition-all shadow-lg flex items-center justify-center">
                {loading ? <Loader2 className="animate-spin" size={16} /> : "Confirmar Anulación"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};