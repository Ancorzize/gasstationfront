import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Loader2, Fuel, MapPin, User, AlertCircle, ArrowRight, Droplets, CreditCard } from 'lucide-react';
import { shiftService } from '../services/shiftService';
import { useToast } from '../../../context/ToastContext';
import { OpenShiftModal } from '../components/OpenShiftModal';
import { SearchClientModal } from '../components/SearchClientModal';

export const ShiftManagementPage = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [currentShift, setCurrentShift] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isOpeningModal, setIsOpeningModal] = useState(false);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);

  const checkShiftStatus = async () => {
    setLoading(true);
    try {
      const res = await shiftService.getCurrentShift();
      if (res.status && res.data) {
        setCurrentShift(res.data);
      } else {
        setCurrentShift(null);
      }
    } catch (e) {
      showToast("Error al verificar estado del turno", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { checkShiftStatus(); }, []);

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <Loader2 className="animate-spin text-zinc-900" size={40} />
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Sincronizando estado de turno...</p>
    </div>
  );

  return (
    <div className="p-3 md:p-8 space-y-6 max-w-6xl mx-auto pb-24">
      <header className="px-1">
        <h2 className="text-xl md:text-2xl font-black text-slate-800 uppercase tracking-tight">Operación de Turno</h2>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Gestión de turnos y lecturas</p>
      </header>

      {!currentShift ? (
        <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 md:p-12 text-center max-w-xl mx-auto space-y-6 shadow-sm">
          <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto text-slate-300">
            <Fuel size={32} />
          </div>
          <div>
            <h3 className="text-lg md:text-xl font-black text-slate-800 uppercase italic">No tienes un turno abierto</h3>
            <p className="text-xs text-slate-400 font-medium px-2 mt-1">Para comenzar a registrar ventas de combustible y lubricantes, debes abrir un turno en tu estación asignada.</p>
          </div>
          <button 
            onClick={() => setIsOpeningModal(true)}
            className="w-full md:w-auto inline-flex items-center justify-center gap-3 bg-zinc-900 text-white px-8 py-4 rounded-2xl font-black uppercase text-xs hover:bg-black transition-all shadow-xl shadow-zinc-200"
          >
            <Play size={16} fill="currentColor" /> Abrir Nuevo Turno
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Tarjeta de Turno en Curso adaptada a Móvil */}
            <div className="bg-zinc-900 rounded-[2rem] p-6 md:p-8 text-white relative overflow-hidden shadow-xl shadow-zinc-200">
              <div className="relative z-10 space-y-4">
                <div className="flex justify-between items-start">
                  <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-[9px] font-black uppercase tracking-widest border border-emerald-500/30">Turno en curso</span>
                  <div className="text-right text-[9px] font-bold text-zinc-400 uppercase tracking-widest">
                    <p>Iniciado el</p>
                    <p className="text-white">{new Date(currentShift.fecha_apertura).toLocaleString()}</p>
                  </div>
                </div>
                <div>
                  <h3 className="text-2xl md:text-3xl font-black tracking-tighter uppercase italic">{currentShift.estacion?.nombre}</h3>
                  <div className="flex flex-wrap items-center gap-3 mt-2 text-zinc-400 text-[9px] md:text-[10px] font-bold uppercase tracking-widest">
                    <span className="flex items-center gap-1"><MapPin size={12} /> {currentShift.estacion?.ciudad}</span>
                    <span className="flex items-center gap-1"><User size={12} /> {currentShift.user?.name}</span>
                  </div>
                </div>
              </div>
              <Fuel className="absolute -right-6 -bottom-6 text-white opacity-5 pointer-events-none" size={160} />
            </div>
            
            {/* Acciones Rápidas con los 3 botones rediseñados y diferenciados */}
            <div className="bg-white rounded-[2rem] border border-slate-100 p-6 shadow-sm">
               <h4 className="text-xs font-black text-slate-800 uppercase mb-4 flex items-center gap-2">
                 <AlertCircle size={16} className="text-yellow-500" /> Acciones Rápidas
               </h4>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                 
                 {/* Botón 1: Venta Combustible */}
                 <button 
                  onClick={() => navigate('/ventas/nueva')}
                  className="p-5 bg-gradient-to-br from-amber-500/10 to-amber-500/5 border border-amber-500/20 rounded-2xl text-left hover:border-amber-500/40 transition-all group"
                 >
                   <p className="text-[9px] font-black text-amber-600 uppercase mb-1 flex items-center gap-1">
                     <Fuel size={12} /> Combustible
                   </p>
                   <div className="flex items-center justify-between">
                    <span className="text-xs md:text-sm font-black text-slate-800 uppercase">Venta Combustible</span>
                    <ArrowRight size={16} className="text-amber-500 group-hover:translate-x-1 transition-transform" />
                   </div>
                 </button>

                 {/* Botón 2: Venta Lubricantes */}
                 <button 
                  onClick={() => navigate('/ventas/lubricantes')}
                  className="p-5 bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/20 rounded-2xl text-left hover:border-blue-500/40 transition-all group"
                 >
                   <p className="text-[9px] font-black text-blue-600 uppercase mb-1 flex items-center gap-1">
                     <Droplets size={12} /> Tienda / Stock
                   </p>
                   <div className="flex items-center justify-between">
                    <span className="text-xs md:text-sm font-black text-slate-800 uppercase">Venta Lubricantes</span>
                    <ArrowRight size={16} className="text-blue-500 group-hover:translate-x-1 transition-transform" />
                   </div>
                 </button>

                 {/* Botón 3: Registrar Abonos */}
                 <button 
                  onClick={() => setIsClientModalOpen(true)}
                  className="p-5 bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20 rounded-2xl text-left hover:border-emerald-500/40 transition-all group sm:col-span-2"
                 >
                   <p className="text-[9px] font-black text-emerald-600 uppercase mb-1 flex items-center gap-1">
                     <CreditCard size={12} /> Cartera y Créditos
                   </p>
                   <div className="flex items-center justify-between">
                    <span className="text-xs md:text-sm font-black text-slate-800 uppercase">Registrar Abonos</span>
                    <ArrowRight size={16} className="text-emerald-500 group-hover:translate-x-1 transition-transform" />
                   </div>
                 </button>

               </div>

               {/* Botón de Cierre de Turno integrado de forma limpia */}
               <div className="mt-4 pt-4 border-t border-slate-100">
                 <button 
                  onClick={() => navigate(`/turnos-islero/${currentShift.id}/resumen`)}
                  className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-wider hover:bg-black transition-all flex items-center justify-center gap-2"
                 >
                   Cerrar Turno Actual <ArrowRight size={14} />
                 </button>
               </div>
            </div>
          </div>
          
          {/* Lecturas de Apertura Compactas */}
          <div className="bg-white rounded-[2rem] border border-slate-100 p-6 h-fit">
            <h4 className="text-xs font-black text-slate-800 uppercase mb-4">Lecturas de Apertura</h4>
            <div className="space-y-3">
              {currentShift.lecturas?.map((l) => (
                <div key={l.id} className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-100/50">
                  <div>
                    <p className="text-[10px] font-black text-slate-700 uppercase">{l.manguera?.nombre}</p>
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">{l.manguera?.producto?.nombre}</p>
                  </div>
                  <p className="text-xs font-black text-slate-800 tracking-tighter">{Number(l.lectura_inicial).toLocaleString()}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <OpenShiftModal 
        isOpen={isOpeningModal} 
        onClose={() => setIsOpeningModal(false)} 
        onSave={checkShiftStatus} 
      />

      <SearchClientModal
        isOpen={isClientModalOpen}
        onClose={() => setIsClientModalOpen(false)}
      />
    </div>
  );
};