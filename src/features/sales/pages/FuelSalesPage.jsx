import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Fuel, DollarSign, User, Droplets, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import { shiftService } from '../../shifts/services/shiftService';
import { fuelSalesService } from '../services/fuelSalesService';
import { useToast } from '../../../context/ToastContext';

export const FuelSalesPage = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [currentShift, setCurrentShift] = useState(null);
  const [formData, setFormData] = useState({
    manguera_id: '',
    tipo_pago: 'contado',
    cliente_id: null,
    monto: '',
    cantidad_galones: ''
  });

  useEffect(() => {
    const loadShift = async () => {
      try {
        const res = await shiftService.getCurrentShift();
    
        if ((res.status || res.success) && res.data) {
          setCurrentShift(res.data);
        } else {
          showToast("Debes tener un turno abierto para vender", "error");
          navigate('/operacion/turnos');
        }
      } catch (error) {
        showToast("Error al cargar información del turno", "error");
      }
    };
    loadShift();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fuelSalesService.createSale({
        ...formData,
        turno_islero_id: currentShift.id
      });
      if (res.status || res.success) {
        showToast("Venta registrada correctamente", "success");
        navigate('/operacion/turnos');
      } else {
        showToast(res.message, "error");
      }
    } catch (error) {
      showToast("Error al registrar venta", "error");
    } finally {
      setLoading(false);
    }
  };

  if (!currentShift) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <Loader2 className="animate-spin text-zinc-900" size={40} />
    </div>
  );

  const manguerasDisponibles = currentShift.lecturas?.map(l => l.manguera) || [];

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto space-y-8">
      <header className="text-center">
        <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight italic">Nueva Venta de Combustible</h2>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          Estación: {currentShift.estacion?.nombre} | Turno #{currentShift.id}
        </p>
      </header>

      <form onSubmit={handleSubmit} className="bg-white rounded-[3rem] border border-slate-100 p-10 shadow-2xl shadow-slate-200/50 space-y-8">
        <div className="space-y-4 text-left">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Seleccionar Manguera</label>
          
          {manguerasDisponibles.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {manguerasDisponibles.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setFormData({ ...formData, manguera_id: m.id })}
                  className={`p-4 rounded-3xl border-2 transition-all flex flex-col items-center gap-2 ${
                    formData.manguera_id === m.id 
                    ? 'border-zinc-900 bg-zinc-900 text-white' 
                    : 'border-slate-50 bg-slate-50 text-slate-400 hover:border-slate-200'
                  }`}
                >
                  <Droplets size={20} />
                  <span className="text-[10px] font-black uppercase tracking-tighter text-center">
                    {m.nombre} <br />
                    <span className="opacity-60 font-bold">({m.producto?.nombre})</span>
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-6 bg-red-50 text-red-500 rounded-2xl flex items-center gap-3 border border-red-100">
              <AlertTriangle size={20} />
              <p className="text-[10px] font-black uppercase">No hay mangueras configuradas en este turno.</p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-6 text-left">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Valor a Vender ($)</label>
            <div className="relative">
              <DollarSign className="absolute left-4 top-4 text-emerald-500" size={18} />
              <input
                type="number" required placeholder="0.00"
                className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-lg font-black outline-none focus:border-zinc-900 transition-all"
                value={formData.monto}
                onChange={(e) => setFormData({ ...formData, monto: e.target.value })}
              />
            </div>
          </div>
          
          <div className="space-y-2 text-left">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Tipo de Pago</label>
            <select
              className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-black outline-none focus:border-zinc-900 appearance-none uppercase"
              value={formData.tipo_pago}
              onChange={(e) => setFormData({ ...formData, tipo_pago: e.target.value })}
            >
              <option value="contado">Contado / Efectivo</option>
              <option value="credito">Crédito / Vale</option>
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !formData.manguera_id || !formData.monto}
          className="w-full bg-zinc-900 text-white py-6 rounded-[2rem] font-black uppercase text-sm shadow-xl shadow-zinc-200 hover:bg-black transition-all flex items-center justify-center gap-3 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          {loading ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle size={20} />}
          {formData.tipo_pago === 'credito' ? 'Registrar Vale de Crédito' : 'Confirmar Venta Contado'}
        </button>
      </form>
    </div>
  );
};