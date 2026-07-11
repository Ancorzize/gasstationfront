import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Fuel, DollarSign, User, Droplets, Loader2, CheckCircle, AlertTriangle, Search, Check, X } from 'lucide-react';
import { shiftService } from '../../shifts/services/shiftService';
import { fuelSalesService } from '../services/fuelSalesService';
import { clientService } from '../../clients/services/clientService';
import { useToast } from '../../../context/ToastContext';

export const FuelSalesPage = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [currentShift, setCurrentShift] = useState(null);
  
  const [searchingClients, setSearchingClients] = useState(false);
  const [clients, setClients] = useState([]);
  const [clientSearchTerm, setClientSearchTerm] = useState('');
  const [showClientList, setShowClientList] = useState(false);
  const clientListRef = useRef(null);

  const [formData, setFormData] = useState({
    manguera_id: '',
    tipo_venta: 'contado',
    metodo_pago: 'efectivo',
    cliente_id: null,
    monto: '',
    observacion: 'Venta combustible'
  });

  useEffect(() => {
    const loadShiftData = async () => {
      const res = await shiftService.getCurrentShift();
      if (res.status && res.data) {
        setCurrentShift(res.data);
      } else {
        showToast("No tienes un turno de islero abierto", "error");
        navigate('/operacion/turnos');
      }
    };
    loadShiftData();
  }, []);

  useEffect(() => {
    const searchClients = async () => {
      if (clientSearchTerm.length < 3) {
        setClients([]);
        return;
      }
      setSearchingClients(true);
      try {
        const res = await clientService.getClients({ search: clientSearchTerm });
        if (res.status) setClients(res.data.items || []);
      } catch (e) {
        console.error("Error buscando clientes", e);
      } finally {
        setSearchingClients(false);
      }
    };

    const timeoutId = setTimeout(() => {
      if (showClientList) searchClients();
    }, 400);

    return () => clearTimeout(timeoutId);
  }, [clientSearchTerm, showClientList]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (clientListRef.current && !clientListRef.current.contains(e.target)) {
        setShowClientList(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectClient = (client) => {
    setFormData({ ...formData, cliente_id: client.id });
    setClientSearchTerm(client.nombre || client.razon_social);
    setShowClientList(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if ((formData.tipo_venta === 'credito' || formData.tipo_venta === 'mixta') && !formData.cliente_id) {
      return showToast("Debes seleccionar un cliente para esta venta", "error");
    }

    setLoading(true);
    try {
      const res = await fuelSalesService.createFuelSale(formData);
      if (res.status) {
        showToast(res.message, "success");
        navigate('/operacion/turnos');
      } else {
        showToast(res.message, "error");
        if (res.message.includes("asignada")) window.location.reload();
      }
    } catch (error) {
      showToast("Error de conexión con el servidor", "error");
    } finally {
      setLoading(false);
    }
  };

  if (!currentShift) return null;

  const manguerasTurno = currentShift.lecturas?.map(l => ({
    ...l.manguera,
    precio_congelado: l.precio_galon
  })) || [];

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto space-y-8 text-left">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight italic">Despacho de Combustible</h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            {currentShift.estacion?.nombre} | Islero: {currentShift.usuario?.name}
          </p>
        </div>
        <Fuel className="text-slate-200" size={40} />
      </header>

      <form onSubmit={handleSubmit} className="bg-white rounded-[3rem] border border-slate-100 p-8 md:p-12 shadow-2xl shadow-slate-200/50 space-y-8">
        
        <div className="space-y-4">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Mangueras en mi turno</label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {manguerasTurno.map((m) => {
              const isSelected = formData.manguera_id === m.id;
              return (
                <button
                  key={m.id} type="button"
                  onClick={() => setFormData({ ...formData, manguera_id: m.id })}
                  className={`p-4 rounded-3xl border-2 transition-all flex flex-col items-center gap-1 ${
                    isSelected ? 'border-zinc-900 bg-zinc-900 text-white shadow-lg' : 'border-slate-50 bg-slate-50 text-slate-400 hover:border-slate-200'
                  }`}
                >
                  <Droplets size={20} className={isSelected ? 'text-blue-400' : 'text-slate-300'} />
                  <span className="text-[10px] font-black uppercase">{m.nombre}</span>
                  <span className={`text-[8px] font-bold ${isSelected ? 'text-zinc-400' : 'text-slate-400'}`}>
                    {m.producto?.nombre}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Tipo de Venta</label>
            <select
              className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-black outline-none focus:border-zinc-900 appearance-none uppercase"
              value={formData.tipo_venta}
              onChange={(e) => {
                const val = e.target.value;
                setFormData({ ...formData, tipo_venta: val, cliente_id: val === 'contado' ? null : formData.cliente_id });
                if (val === 'contado') setClientSearchTerm('');
              }}
            >
              <option value="contado">Venta Contado</option>
              <option value="credito">Venta Crédito</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Método de Pago</label>
            <select
              className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-black outline-none focus:border-zinc-900 appearance-none uppercase disabled:opacity-30 disabled:cursor-not-allowed"
              value={formData.metodo_pago}
              disabled={formData.tipo_venta === 'credito'}
              onChange={(e) => setFormData({ ...formData, metodo_pago: e.target.value })}
            >
              <option value="efectivo">Efectivo</option>
              <option value="transferencia">Transferencia</option>
              <option value="datafono">Datáfono</option>
              <option value="consignacion">Consignación</option>
              <option value="qr">Código QR</option>
            </select>
          </div>
        </div>

        {(formData.tipo_venta === 'credito' || formData.tipo_venta === 'mixta') && (
          <div className="space-y-2 relative" ref={clientListRef}>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Buscar Cliente (Nit/Nombre)</label>
            <div className="relative">
              <User className="absolute left-4 top-4 text-slate-300" size={18} />
              <input
                type="text"
                placeholder="Escribe para buscar cliente..."
                className="w-full pl-12 pr-12 py-4 bg-white border border-blue-100 rounded-2xl text-xs font-bold outline-none focus:border-blue-500 shadow-sm transition-all uppercase"
                value={clientSearchTerm}
                onFocus={() => setShowClientList(true)}
                onChange={(e) => {
                  setClientSearchTerm(e.target.value);
                  setShowClientList(true);
                  if (formData.cliente_id) setFormData({ ...formData, cliente_id: null });
                }}
              />
              {searchingClients && <Loader2 className="absolute right-4 top-4 animate-spin text-zinc-400" size={18} />}
              {!searchingClients && formData.cliente_id && <Check className="absolute right-4 top-4 text-emerald-500" size={18} />}
            </div>

            {showClientList && clientSearchTerm.length >= 3 && (
              <div className="absolute z-50 w-full mt-2 bg-white border border-slate-100 rounded-2xl shadow-xl max-h-48 overflow-y-auto">
                {clients.length > 0 ? (
                  clients.map(c => (
                    <button
                      key={c.id}
                      type="button"
                      className="w-full text-left px-6 py-3 text-[10px] font-bold uppercase hover:bg-slate-50 flex items-center justify-between border-b border-slate-50 last:border-0"
                      onClick={() => selectClient(c)}
                    >
                      <div>
                        <p className="text-slate-800">{c.nombre || c.razon_social}</p>
                        <p className="text-[8px] text-slate-400">{c.documento} {c.cupo_disponible ? `| Cupo: $${Number(c.cupo_disponible).toLocaleString()}` : ''}</p>
                      </div>
                      {formData.cliente_id === c.id && <Check size={14} className="text-emerald-500" />}
                    </button>
                  ))
                ) : !searchingClients ? (
                  <p className="p-4 text-[10px] text-slate-400 uppercase italic text-center">No se encontraron clientes</p>
                ) : null}
              </div>
            )}
          </div>
        )}

        <div className="space-y-2">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Monto a Despachar ($)</label>
        <div className="relative">
          <DollarSign className="absolute left-6 top-6 text-emerald-500" size={24} />
          <input
            type="text" 
            required 
            placeholder="0"
            className="w-full pl-16 pr-8 py-6 bg-slate-50 border border-slate-100 rounded-[2rem] text-3xl font-black outline-none focus:border-zinc-900 transition-all text-slate-800"
            value={formData.monto ? Number(formData.monto).toLocaleString('es-ES') : ''}
            onChange={(e) => {
              const rawValue = e.target.value.replace(/\D/g, "");
              setFormData({ ...formData, monto: rawValue });
            }}
          />
        </div>
        {formData.manguera_id && (
          <p className="text-[9px] font-bold text-slate-400 ml-6 uppercase">
            Precio actual por galón: <span className="text-zinc-600">
              ${Number(manguerasTurno.find(m => m.id === formData.manguera_id)?.precio_congelado).toLocaleString()}
            </span>
          </p>
        )}
      </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Observación</label>
          <input
            type="text"
            className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold outline-none focus:border-zinc-900 uppercase"
            value={formData.observacion}
            onChange={(e) => setFormData({ ...formData, observacion: e.target.value })}
          />
        </div>

        <button
          type="submit"
          disabled={loading || !formData.manguera_id || !formData.monto}
          className="w-full bg-zinc-900 text-white py-6 rounded-[2rem] font-black uppercase text-sm shadow-xl shadow-zinc-200 hover:bg-black transition-all flex items-center justify-center gap-3 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          {loading ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle size={20} />}
          Confirmar Venta y Generar Ticket
        </button>
      </form>
      
      <div className="p-6 bg-blue-50 border border-blue-100 rounded-[2rem] flex gap-4 text-blue-700">
        <AlertTriangle size={24} className="shrink-0" />
        <p className="text-[10px] font-bold uppercase leading-relaxed">
          Los galones se calcularán automáticamente en el sistema usando el precio vigente congelado al abrir el turno.
        </p>
      </div>
    </div>
  );
};