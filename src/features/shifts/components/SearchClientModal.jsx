import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Search, Loader2, UserCheck, ChevronRight } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';
import { clientService } from '../../clients/services/clientService';

export const SearchClientModal = ({ isOpen, onClose }) => {
  const [documento, setDocumento] = useState('');
  const [loading, setLoading] = useState(false);
  const [client, setClient] = useState(null);
  const [searched, setSearched] = useState(false);
  
  const navigate = useNavigate();
  const { showToast } = useToast();

  if (!isOpen) return null;

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!documento.trim()) return;

    setLoading(true);
    setSearched(true);
    setClient(null);

    try {
      const response = await clientService.getClients({ search: documento.trim() });

      if (response.status && response.data?.items?.length > 0) {
        setClient(response.data.items[0]);
      } else {
        showToast("No se encontró ningún cliente con ese documento", "error");
      }
    } catch (error) {
      showToast("Error al buscar el cliente", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectClient = (clientId) => {
    onClose();
    navigate(`/clientes/${clientId}/estado-cuenta`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] p-6 md:p-8 shadow-2xl border border-slate-100 space-y-6">
        
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
            <UserCheck size={18} className="text-yellow-500" /> Registrar Abonos de Cartera
          </h3>
          <button onClick={onClose} className="p-2 bg-slate-50 text-slate-400 hover:text-slate-700 rounded-2xl transition-all">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSearch} className="space-y-4">
          <div>
            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Número de Cédula / Documento</label>
            <div className="flex gap-2">
              <input 
                type="text" 
                placeholder="Ej. 1089483"
                value={documento}
                onChange={(e) => setDocumento(e.target.value)}
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black text-slate-800 outline-none focus:ring-2 focus:ring-zinc-900"
                autoFocus
                required
              />
              <button type="submit" disabled={loading} className="bg-zinc-900 text-white px-5 rounded-2xl hover:bg-black transition-all flex items-center justify-center">
                {loading ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
              </button>
            </div>
          </div>
        </form>

        {searched && !loading && client && (
          <div className="space-y-3 pt-2">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Resultado encontrado:</p>
            <div 
              onClick={() => handleSelectClient(client.id)}
              className="p-4 bg-slate-50 hover:bg-slate-100 border border-slate-200/60 rounded-2xl flex items-center justify-between cursor-pointer transition-all group"
            >
              <div>
                <p className="text-xs font-black text-slate-800 uppercase">{client.nombre} {client.apellidos}</p>
                <p className="text-[10px] font-bold text-slate-500 mt-0.5">Doc: {client.documento}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-xl">Cupo disp: ${Number(client.cupo_disponible || 0).toLocaleString()}</span>
                <ChevronRight size={16} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};