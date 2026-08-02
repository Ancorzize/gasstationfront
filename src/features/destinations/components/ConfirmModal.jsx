import React from 'react';
import { AlertTriangle, X, Loader2 } from 'lucide-react';

export const ConfirmModal = ({ 
  isOpen, 
  title = "Confirmar acción", 
  message = "¿Estás seguro de realizar esta acción?", 
  confirmText = "Eliminar", 
  cancelText = "Cancelar", 
  onConfirm, 
  onClose, 
  loading = false 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden flex flex-col p-6 text-left">
        
        <div className="flex items-center justify-between mb-4">
          <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center">
            <AlertTriangle size={24} />
          </div>
          <button 
            onClick={onClose}
            disabled={loading}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all"
          >
            <X size={20} />
          </button>
        </div>

        <div className="mb-6 space-y-1">
          <h3 className="text-base font-black text-slate-800 uppercase tracking-tight">{title}</h3>
          <p className="text-xs font-bold text-slate-500 leading-relaxed">{message}</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl font-black text-[10px] uppercase transition-all"
          >
            {cancelText}
          </button>
          
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-black text-[10px] uppercase transition-all shadow-lg shadow-red-600/20 disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={14} /> : confirmText}
          </button>
        </div>

      </div>
    </div>
  );
};