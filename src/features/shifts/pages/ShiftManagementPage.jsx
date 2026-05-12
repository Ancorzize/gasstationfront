import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Loader2, Fuel, MapPin, User, AlertCircle, ArrowRight } from 'lucide-react';
import { shiftService } from '../services/shiftService';
import { useToast } from '../../../context/ToastContext';
import { OpenShiftModal } from '../components/OpenShiftModal';

export const ShiftManagementPage = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [currentShift, setCurrentShift] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isOpeningModal, setIsOpeningModal] = useState(false);

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
    <div className="p-4 md:p-8 space-y-8">
      <header>
        <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Operación de Islero</h2>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Gestión de turnos y lecturas</p>
      </header>

      {!currentShift ? (
        <div className="bg-white rounded-[3rem] border border-slate-100 p-12 text-center max-w-2xl mx-auto space-y-6 shadow-sm">
          <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto text-slate-300">
            <Fuel size={40} />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-800 uppercase italic">No tienes un turno abierto</h3>
            <p className="text-xs text-slate-400 font-medium px-10">Para comenzar a registrar ventas de combustible y lubricantes, debes abrir un turno en tu estación asignada.</p>
          </div>
          <button 
            onClick={() => setIsOpeningModal(true)}
            className="inline-flex items-center gap-3 bg-zinc-900 text-white px-10 py-5 rounded-[1.5rem] font-black uppercase text-xs hover:bg-black transition-all shadow-xl shadow-zinc-200"
          >
            <Play size={18} fill="currentColor" /> Abrir Nuevo Turno
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-zinc-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl shadow-zinc-200">
              <div className="relative z-10 space-y-6">
                <div className="flex justify-between items-start">
                  <span className="px-4 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-[9px] font-black uppercase tracking-widest border border-emerald-500/30">Turno en curso</span>
                  <div className="text-right text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                    <p>Iniciado el</p>
                    <p className="text-white">{new Date(currentShift.fecha_apertura).toLocaleString()}</p>
                  </div>
                </div>
                <div>
                  <h3 className="text-3xl font-black tracking-tighter uppercase italic">{currentShift.estacion?.nombre}</h3>
                  <div className="flex items-center gap-4 mt-2 text-zinc-400 text-[10px] font-bold uppercase tracking-widest">
                    <span className="flex items-center gap-1"><MapPin size={12} /> {currentShift.estacion?.ciudad}</span>
                    <span className="flex items-center gap-1"><User size={12} /> {currentShift.user?.name}</span>
                  </div>
                </div>
              </div>
              <Fuel className="absolute -right-8 -bottom-8 text-white opacity-5" size={200} />
            </div>
            
            <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8">
               <h4 className="text-xs font-black text-slate-800 uppercase mb-6 flex items-center gap-2">
                 <AlertCircle size={16} className="text-yellow-500" /> Acciones Rápidas
               </h4>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <button 
                  onClick={() => navigate('/ventas/nueva')}
                  className="p-6 bg-slate-50 rounded-3xl text-left hover:bg-slate-100 transition-all group"
                 >
                   <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Ventas</p>
                   <div className="flex items-center justify-between">
                    <span className="text-sm font-black text-slate-800 uppercase">Nueva Venta</span>
                    <ArrowRight size={16} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
                   </div>
                 </button>

                 <button 
                  onClick={() => navigate(`/turnos-islero/${currentShift.id}/resumen`)}
                  className="p-6 bg-slate-50 rounded-3xl text-left hover:bg-slate-100 transition-all group"
                 >
                   <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Cierre</p>
                   <div className="flex items-center justify-between">
                    <span className="text-sm font-black text-slate-800 uppercase">Cerrar Turno</span>
                    <ArrowRight size={16} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
                   </div>
                 </button>
               </div>
            </div>
          </div>
          
          <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 h-fit">
            <h4 className="text-xs font-black text-slate-800 uppercase mb-6">Lecturas de Apertura</h4>
            <div className="space-y-4">
              {currentShift.lecturas?.map((l) => (
                <div key={l.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100/50">
                  <div>
                    <p className="text-[10px] font-black text-slate-700 uppercase">{l.manguera?.nombre}</p>
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">{l.manguera?.producto?.nombre}</p>
                  </div>
                  <p className="text-sm font-black text-slate-800 tracking-tighter">{Number(l.lectura_inicial).toLocaleString()}</p>
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
    </div>
  );
};