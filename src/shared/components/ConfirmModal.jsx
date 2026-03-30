import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';

export const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, loading = false }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose} className="absolute inset-0 bg-zinc-950/70 backdrop-blur-sm" 
          />
          
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }} 
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden border border-slate-100"
          >
            <div className="p-6 text-center">
              <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 mb-4">
                <AlertTriangle size={32} />
              </div>
              
              <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight mb-2">
                {title}
              </h3>
              
              <p className="text-sm text-slate-500 mb-6">
                {message}
              </p>

              <div className="flex gap-3">
                <button 
                  onClick={onClose}
                  className="flex-1 py-3 rounded-2xl border border-slate-200 text-slate-600 font-bold text-xs uppercase hover:bg-slate-50 transition-all"
                >
                  Cancelar
                </button>
                <button 
                  onClick={onConfirm}
                  disabled={loading}
                  className="flex-1 py-3 rounded-2xl bg-orange-600 text-white font-bold text-xs uppercase hover:bg-orange-700 transition-all shadow-lg shadow-orange-100 disabled:opacity-50"
                >
                  {loading ? "Eliminando..." : "Confirmar"}
                </button>
              </div>
            </div>
            
            <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
              <X size={20} />
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};