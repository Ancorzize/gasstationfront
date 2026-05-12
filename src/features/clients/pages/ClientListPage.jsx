import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Edit2, Power, UserPlus, Loader2, Download, CreditCard, FileText } from 'lucide-react';
import { clientService } from '../services/clientService';
import { useToast } from '../../../context/ToastContext';
import { usePermissions } from '../../../hooks/usePermissions';
import { ClientModal } from '../components/ClientModal';
import { CreditConfigModal } from '../components/CreditConfigModal';
import { exportToExcel } from '../../../shared/utils/exportExcel';

export const ClientListPage = () => {
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const { showToast } = useToast();

  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreditModalOpen, setIsCreditModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);

  const fetchClients = async () => {
    setLoading(true);
    try {
      const result = await clientService.getClients('');
      if (result.status) setClients(result.data.items);
    } catch (error) {
      showToast("Error al cargar clientes", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchClients(); }, []);

  const filteredClients = useMemo(() => {
    return clients.filter(client => {
      const target = searchTerm.toLowerCase();
      return (
        client.nombre?.toLowerCase().includes(target) ||
        client.apellidos?.toLowerCase().includes(target) ||
        client.documento?.toLowerCase().includes(target)
      );
    });
  }, [searchTerm, clients]);

  const handleToggleStatus = async (client) => {
    const result = await clientService.toggleStatus(client.id, !client.is_active);
    if (result.status) {
      showToast(result.message, "success");
      fetchClients();
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight uppercase">Gestión de Clientes</h2>
          <p className="text-slate-500 text-xs md:text-sm uppercase font-bold tracking-widest">Cartera y datos generales</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2 md:gap-3">
          <button 
            onClick={() => exportToExcel(filteredClients, 'Clientes_Cartera')}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-600 px-4 py-2.5 rounded-2xl font-bold text-[10px] uppercase hover:bg-slate-50 transition-all shadow-sm"
          >
            <Download size={16} /> <span className="hidden sm:inline">Exportar</span>
          </button>

          <div className="relative flex-1 md:flex-none min-w-[150px]">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Buscar cliente..." 
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs outline-none focus:border-zinc-900 transition-all shadow-sm font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <button 
            onClick={() => { setSelectedClient(null); setIsModalOpen(true); }}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-zinc-900 text-white px-4 py-2.5 rounded-2xl font-bold text-[10px] uppercase hover:bg-black transition-all shadow-md"
          >
            <UserPlus size={16} /> <span className="hidden sm:inline">Nuevo cliente</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar-light">
          {loading ? (
            <div className="p-20 flex flex-col items-center justify-center text-slate-400 gap-3">
              <Loader2 className="animate-spin" size={40} />
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Sincronizando clientes...</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="p-5 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Información del Cliente</th>
                  <th className="p-5 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Crédito / Saldo</th>
                  <th className="p-5 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Estado</th>
                  <th className="p-5 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredClients.map((client) => (
                  <tr key={client.id} className="hover:bg-slate-50/30 transition-colors group">
                    <td className="p-5">
                      <div className="flex flex-col">
                        <span className="text-xs font-black text-slate-700 uppercase">{client.nombre} {client.apellidos}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">{client.documento}</span>
                      </div>
                    </td>
                    <td className="p-5">
                      {client.maneja_credito ? (
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-slate-700 tracking-tighter">SALDO: ${Number(client.saldo_credito || 0).toLocaleString()}</span>
                            {client.cupo_disponible <= 0 && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />}
                          </div>
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">CUPO DISP: ${Number(client.cupo_disponible || 0).toLocaleString()}</span>
                        </div>
                      ) : (
                        <span className="text-[9px] font-bold text-slate-300 uppercase italic">Sin crédito activo</span>
                      )}
                    </td>
                    <td className="p-5 text-center">
                      <span className={`px-3 py-1 rounded-xl text-[9px] font-black uppercase ${
                        client.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                      }`}>
                        {client.is_active ? 'Habilitado' : 'Bloqueado'}
                      </span>
                    </td>
                    <td className="p-5">
                      <div className="flex items-center justify-center gap-1">
                        {hasPermission('ver_estado_cuenta_clientes') && client.maneja_credito && (
                          <button 
                            onClick={() => navigate(`/clientes/${client.id}/estado-cuenta`)}
                            className="p-2.5 text-slate-400 hover:text-zinc-900 hover:bg-slate-100 rounded-xl transition-all"
                            title="Estado de Cuenta"
                          >
                            <FileText size={16} />
                          </button>
                        )}
                        {hasPermission('configurar_credito_clientes') && (
                          <button 
                            onClick={() => { setSelectedClient(client); setIsCreditModalOpen(true); }}
                            className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                            title="Configurar Crédito"
                          >
                            <CreditCard size={16} />
                          </button>
                        )}
                        <button 
                          onClick={() => { setSelectedClient(client); setIsModalOpen(true); }}
                          className="p-2.5 text-slate-400 hover:text-zinc-900 hover:bg-slate-100 rounded-xl transition-all"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => handleToggleStatus(client)}
                          className={`p-2.5 rounded-xl transition-all ${
                            client.is_active ? 'text-slate-400 hover:text-red-600 hover:bg-red-50' : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                          }`}
                        >
                          <Power size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <ClientModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={fetchClients} 
        clientToEdit={selectedClient} 
      />

      {isCreditModalOpen && (
        <CreditConfigModal 
          isOpen={isCreditModalOpen}
          onClose={() => setIsCreditModalOpen(false)}
          onSave={fetchClients}
          client={selectedClient}
        />
      )}
    </div>
  );
};