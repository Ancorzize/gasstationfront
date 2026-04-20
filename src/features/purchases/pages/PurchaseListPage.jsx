import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx'; // Importación para Excel
import { 
  ShoppingBag, Search, Plus, Loader2, 
  Calendar, Eye, Edit3, CheckCircle2, 
  Clock, Wallet, Download // Importamos el icono de descarga
} from 'lucide-react';
import { purchaseService } from '../services/purchaseService';
import { useToast } from '../../../context/ToastContext';
import { getTodayStr } from '../../../shared/utils/dateUtils';

export const PurchaseListPage = () => {

  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState(getTodayStr());
  const [endDate, setEndDate] = useState(getTodayStr());

  const navigate = useNavigate();
  const { showToast } = useToast();

  const fetchPurchases = async () => {
    setLoading(true);
    try {
      const res = await purchaseService.getPurchases({
        fecha_desde: startDate,
        fecha_hasta: endDate
      });
      if (res.status) setPurchases(res.data.items || []);
    } catch (e) {
      showToast("Error al cargar listado de compras", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchPurchases(); 
  }, [startDate, endDate]);

  const filteredPurchases = purchases.filter(p => {
    const term = searchTerm.toLowerCase();
    return (
      p.numero_documento?.toLowerCase().includes(term) ||
      p.proveedor?.nombre?.toLowerCase().includes(term) ||
      p.estado?.toLowerCase().includes(term) ||
      p.estado_pago?.toLowerCase().includes(term) ||
      p.tipo_pago?.toLowerCase().includes(term) ||
      p.fecha_compra?.includes(term)
    );
  });

  // FUNCIÓN DE EXPORTACIÓN
  const handleExport = () => {
    if (filteredPurchases.length === 0) {
      showToast("No hay datos para exportar", "info");
      return;
    }

    // Mapeamos los datos para que el Excel tenga nombres de columna claros
    const dataToExport = filteredPurchases.map(p => ({
      'Documento': p.numero_documento || 'S/N',
      'Fecha': p.fecha_compra,
      'Proveedor': p.proveedor?.nombre,
      'NIT': p.proveedor?.nit,
      'Estado': p.estado.toUpperCase(),
      'Tipo Pago': p.tipo_pago.toUpperCase(),
      'Estado Pago': p.estado_pago.toUpperCase(),
      'Total': parseFloat(p.total),
      'Saldo Pendiente': parseFloat(p.saldo_pendiente)
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Compras");
    
    // Generar archivo y descargar
    XLSX.writeFile(workbook, `Reporte_Compras_${startDate}_al_${endDate}.xlsx`);
    showToast("Archivo Excel generado con éxito", "success");
  };

  const StatusBadge = ({ status }) => {
    const styles = {
      borrador: "bg-slate-100 text-slate-500 border-slate-200",
      confirmada: "bg-emerald-50 text-emerald-600 border-emerald-100"
    };
    return (
      <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase border ${styles[status] || styles.borrador}`}>
        {status === 'confirmada' ? 'Confirmada' : 'Borrador'}
      </span>
    );
  };

  const PaymentBadge = ({ status }) => {
    const styles = {
      pendiente: "bg-orange-50 text-orange-600 border-orange-100",
      pagado: "bg-blue-50 text-blue-600 border-blue-100"
    };
    return (
      <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase border ${styles[status] || styles.pendiente}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight uppercase">Compras realizadas</h2>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Control detallado pagos</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* BOTÓN EXPORTAR */}
          <button 
            onClick={handleExport}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-2xl font-bold text-[10px] md:text-xs uppercase hover:bg-emerald-700 transition-all shadow-md"
          >
            <Download size={16} /> <span className="hidden sm:inline">Exportar</span>
          </button>

          <div className="flex items-center gap-2 bg-white border border-slate-100 p-1 rounded-2xl shadow-sm">
            <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl border border-slate-100">
              <Calendar size={14} className="text-slate-400" />
              <input 
                type="date" 
                className="bg-transparent text-[10px] font-black uppercase outline-none text-slate-600"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <span className="text-slate-300 font-bold">-</span>
            <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl border border-slate-100">
              <Calendar size={14} className="text-slate-400" />
              <input 
                type="date" 
                className="bg-transparent text-[10px] font-black uppercase outline-none text-slate-600"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <div className="relative group">
            <Search className="absolute left-4 top-3 text-slate-400 group-focus-within:text-zinc-900 transition-colors" size={18} />
            <input 
              type="text" placeholder="Buscar..." 
              className="w-full md:w-48 pl-12 pr-4 py-3 bg-white border border-slate-100 rounded-2xl text-xs outline-none focus:border-zinc-900 shadow-sm transition-all"
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <button 
            onClick={() => navigate('/compras/nueva')}
            className="flex items-center gap-2 px-6 py-3 bg-zinc-900 text-white rounded-2xl font-black text-[10px] uppercase hover:bg-black shadow-xl transition-all"
          >
            <Plus size={16} /> Nueva Compra
          </button>
        </div>
      </header>

      {/* ... Resto del componente (Tabla) se mantiene igual ... */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-50">
                <th className="px-5 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Documento</th>
                <th className="px-5 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Fecha</th>
                <th className="px-5 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Proveedor</th>
                <th className="px-5 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Estatus</th>
                <th className="px-5 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tipo</th>
                <th className="px-5 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Pago</th>
                <th className="px-5 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Total</th>
                <th className="px-5 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center w-24">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-20 text-center">
                    <Loader2 className="animate-spin mx-auto text-slate-200" size={32} />
                  </td>
                </tr>
              ) : filteredPurchases.length > 0 ? (
                filteredPurchases.map((purchase) => (
                  <tr key={purchase.id} className="hover:bg-slate-50/30 transition-colors group">
                    <td className="px-5 py-4 font-black text-slate-700 text-xs uppercase">
                      {purchase.numero_documento || 'S/N'}
                    </td>
                    <td className="px-5 py-4 text-[10px] font-bold text-slate-400 uppercase">
                      {purchase.fecha_compra}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-col">
                        <span className="text-xs font-black text-slate-700 uppercase">{purchase.proveedor?.nombre}</span>
                        <span className="text-[9px] font-bold text-slate-400">NIT: {purchase.proveedor?.nit}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={purchase.estado} />
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-[10px] font-black uppercase ${purchase.tipo_pago === 'credito' ? 'text-orange-500' : 'text-slate-400'}`}>
                        {purchase.tipo_pago}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <PaymentBadge status={purchase.estado_pago} />
                    </td>
                    <td className="px-5 py-4 text-right">
                      <p className="text-sm font-black text-zinc-900 tracking-tighter">
                        $ {parseFloat(purchase.total || 0).toLocaleString('es-CO')}
                      </p>
                      {purchase.saldo_pendiente > 0 && (
                        <p className="text-[9px] font-bold text-red-500 uppercase">
                          Saldo: $ {parseFloat(purchase.saldo_pendiente).toLocaleString('es-CO')}
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button 
                          onClick={() => navigate(`/compras/${purchase.id}`)}
                          className="p-2 text-slate-400 hover:text-zinc-900 hover:bg-slate-100 rounded-xl transition-all"
                        >
                          <Eye size={18} />
                        </button>
                        {purchase.estado === 'borrador' && (
                          <button 
                            onClick={() => navigate(`/compras/editar/${purchase.id}`)}
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
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
                  <td colSpan="8" className="py-20 text-center text-slate-400 text-xs font-bold uppercase italic">
                    No se encontraron resultados
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