import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShoppingBag, Search, Plus, Loader2, Filter, 
  FileText, Calendar, Eye, Edit3, MoreVertical,
  CheckCircle2, Clock, AlertCircle, CreditCard, Wallet
} from 'lucide-react';
import { purchaseService } from '../services/purchaseService';
import { useToast } from '../../../context/ToastContext';

export const PurchaseListPage = () => {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const { showToast } = useToast();

  const fetchPurchases = async () => {
    setLoading(true);
    try {
      const res = await purchaseService.getPurchases();
      if (res.status) setPurchases(res.data.items || []);
    } catch (e) {
      showToast("Error al cargar listado de compras", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPurchases(); }, []);

  // Badge de Estado de la Compra (Inventario)
  const StatusBadge = ({ status }) => {
    const styles = {
      borrador: "bg-slate-100 text-slate-500 border-slate-200",
      confirmada: "bg-emerald-50 text-emerald-600 border-emerald-100"
    };
    return (
      <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase border ${styles[status] || styles.borrador}`}>
        {status === 'confirmada' ? <><CheckCircle2 size={10} className="inline mr-1" /> Confirmada</> : 'Borrador'}
      </span>
    );
  };

  // Badge de Estado de Pago (Finanzas)
  const PaymentBadge = ({ status }) => {
    const styles = {
      pendiente: "bg-orange-50 text-orange-600 border-orange-100",
      pagado: "bg-blue-50 text-blue-600 border-blue-100"
    };
    return (
      <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase border ${styles[status] || styles.pendiente}`}>
        {status === 'pagado' ? <><Wallet size={10} className="inline mr-1" /> Pagado</> : <><Clock size={10} className="inline mr-1" /> Pendiente</>}
      </span>
    );
  };

  const filteredPurchases = purchases.filter(p => 
    p.numero_documento?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.proveedor?.nombre?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 md:p-8 space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase flex items-center gap-3">
            <ShoppingBag className="text-zinc-400" size={28} /> Compras Realizadas
          </h2>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Historial de adquisiciones y facturas</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-4 top-3 text-slate-400 group-focus-within:text-zinc-900 transition-colors" size={18} />
            <input 
              type="text" placeholder="Buscar por factura o proveedor..." 
              className="w-full md:w-80 pl-12 pr-4 py-3 bg-white border border-slate-100 rounded-2xl text-xs outline-none focus:border-zinc-900 shadow-sm transition-all"
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <button 
            onClick={() => navigate('/compras/nueva')}
            className="flex items-center gap-2 px-6 py-3 bg-zinc-900 text-white rounded-2xl font-black text-[10px] uppercase hover:bg-black shadow-xl shadow-zinc-200 transition-all"
          >
            <Plus size={16} /> Nueva Compra
          </button>
        </div>
      </header>

      {/* Tabla de Compras */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-50">
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Documento / Fecha</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Proveedor</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Estatus</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tipo / Pago</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Total</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center w-24">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-20 text-center">
                    <Loader2 className="animate-spin mx-auto text-slate-200" size={32} />
                  </td>
                </tr>
              ) : filteredPurchases.length > 0 ? (
                filteredPurchases.map((purchase) => (
                  <tr key={purchase.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-xs font-black text-slate-700 uppercase">{purchase.numero_documento || 'S/N'}</span>
                        <div className="flex items-center gap-1 text-[9px] font-bold text-slate-400">
                          <Calendar size={10} /> {purchase.fecha_compra}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-xs font-black text-slate-700 uppercase">{purchase.proveedor?.nombre}</span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">NIT: {purchase.proveedor?.nit}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={purchase.estado} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1.5">
                        <span className={`text-[9px] font-black uppercase tracking-tighter ${purchase.tipo_pago === 'credito' ? 'text-orange-500' : 'text-slate-500'}`}>
                          {purchase.tipo_pago === 'credito' ? 'Crédito' : 'Contado'}
                        </span>
                        <PaymentBadge status={purchase.estado_pago} />
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <p className="text-sm font-black text-zinc-900 tracking-tighter">$ {parseFloat(purchase.total).toLocaleString('es-CO')}</p>
                      {purchase.saldo_pendiente > 0 && (
                        <p className="text-[9px] font-bold text-red-500 uppercase tracking-tighter">Saldo: $ {parseFloat(purchase.saldo_pendiente).toLocaleString('es-CO')}</p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-1">
                        <button 
                          onClick={() => navigate(`/compras/${purchase.id}`)}
                          className="p-2 text-slate-400 hover:text-zinc-900 hover:bg-slate-100 rounded-xl transition-all"
                          title="Ver Detalle"
                        >
                          <Eye size={18} />
                        </button>
                        
                        {purchase.estado === 'borrador' && (
                          <button 
                            onClick={() => navigate(`/compras/editar/${purchase.id}`)}
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                            title="Editar Borrador"
                          >
                            <Edit3 size={18} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="py-20 text-center">
                    <p className="text-slate-400 text-xs font-bold uppercase italic">No se encontraron facturas de compra</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};