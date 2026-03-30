import React, { useEffect, useState, useMemo } from 'react';
import { Search, Edit2, Power, UserPlus, Loader2, Download } from 'lucide-react';
import { clientService } from '../services/clientService';
import { useToast } from '../../../context/ToastContext';
import { ClientModal } from '../components/ClientModal';
import { exportToExcel } from '../../../shared/utils/exportExcel';

export const ClientListPage = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const { showToast } = useToast();

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
        client.documento?.toLowerCase().includes(target) ||
        client.email?.toLowerCase().includes(target)
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
      {/* Header: Se apila en móvil, se alinea en desktop */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight uppercase">Gestión de Clientes</h2>
          <p className="text-slate-500 text-xs md:text-sm">Administra la información de tus clientes.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2 md:gap-3">
          <button 
            onClick={() => exportToExcel(filteredClients, 'Clientes_LasGranjas')}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-2xl font-bold text-[10px] md:text-xs uppercase hover:bg-emerald-700 transition-all shadow-md"
          >
            <Download size={16} /> <span className="hidden sm:inline">Exportar</span>
          </button>

          <div className="relative flex-1 md:flex-none min-w-[150px]">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Buscar..." 
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs outline-none focus:border-yellow-500 transition-all shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <button 
            onClick={() => { setSelectedClient(null); setIsModalOpen(true); }}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-zinc-900 text-white px-4 py-2.5 rounded-2xl font-bold text-[10px] md:text-xs uppercase hover:bg-black transition-all shadow-md"
          >
            <UserPlus size={16} /> <span className="hidden sm:inline">Nuevo</span>
          </button>
        </div>
      </div>

      {/* Tabla con Scroll Horizontal */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar-light">
          {loading ? (
            <div className="p-20 flex flex-col items-center justify-center text-slate-400 gap-3">
              <Loader2 className="animate-spin" size={40} />
              <p className="text-[10px] font-bold uppercase tracking-widest">Cargando...</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse min-w-[600px] md:min-w-full">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nombre completo</th>
                  <th className="hidden md:table-cell p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Documento</th>
                  <th className="hidden lg:table-cell p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Email</th>
                  <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Estado</th>
                  <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredClients.map((client) => (
                  <tr key={client.id} className="hover:bg-slate-50/30 transition-colors group">
                    <td className="p-4">
                      <p className="text-xs font-bold text-slate-700">{client.nombre} {client.apellidos}</p>
                      <p className="md:hidden text-[10px] text-slate-400">{client.documento}</p>
                    </td>
                    <td className="hidden md:table-cell p-4 text-xs text-slate-600 font-medium">{client.documento}</td>
                    <td className="hidden lg:table-cell p-4 text-xs text-slate-500 italic">{client.email || 'N/A'}</td>
                    <td className="p-4 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                        client.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                      }`}>
                        {client.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-1 md:gap-2">
                        <button 
                          onClick={() => { setSelectedClient(client); setIsModalOpen(true); }}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button 
                          onClick={() => handleToggleStatus(client)}
                          className={`p-2 rounded-lg transition-all ${
                            client.is_active ? 'text-slate-400 hover:text-red-600 hover:bg-red-50' : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                          }`}
                        >
                          <Power size={14} />
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
    </div>
  );
};