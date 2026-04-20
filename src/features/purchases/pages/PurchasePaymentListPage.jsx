import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, Wallet, Loader2, Download, Eye, 
  Calendar, ChevronLeft, ChevronRight 
} from 'lucide-react';
import { purchasePaymentService } from '../services/purchasePaymentService';
import { useToast } from '../../../context/ToastContext';
import { exportToExcel } from '../../../shared/utils/exportExcel';
import { getTodayStr } from '../../../shared/utils/dateUtils';



export const PurchasePaymentListPage = () => {
  
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState({});
  
  const [startDate, setStartDate] = useState(getTodayStr());
  const [endDate, setEndDate] = useState(getTodayStr())

  const navigate = useNavigate();
  const { showToast } = useToast();

  const fetchPayments = async () => {
    setLoading(true);
    try {
      // La petición solo se dispara cuando cambian las fechas
      const res = await purchasePaymentService.getPayments({ 
        fecha_desde: startDate, 
        fecha_hasta: endDate 
      });
      if (res.status) {
        setPayments(res.data.items || []);
        setPagination(res.data.pagination || {});
      }
    } catch (e) {
      showToast("Error al cargar pagos", "error");
    } finally {
      setLoading(false);
    }
  };

  // Solo recarga cuando cambian las fechas
  useEffect(() => {
    fetchPayments();
  }, [startDate, endDate]);

  // Buscador local (No hace petición, filtra sobre el listado actual)
  const filteredPayments = useMemo(() => {
    return payments.filter(p => 
      p.proveedor?.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.compra?.numero_documento?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.metodo_pago?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, payments]);

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight uppercase flex items-center gap-3">
              Pagos de Compra
          </h2>
          <p className="text-slate-500 text-xs md:text-sm">Historial de abonos realizados a proveedores.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2 md:gap-3">
          <button 
            onClick={() => exportToExcel(filteredPayments, 'Pagos_LasGranjas')}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-2xl font-bold text-[10px] md:text-xs uppercase hover:bg-emerald-700 transition-all shadow-md"
          >
            <Download size={16} /> <span className="hidden sm:inline">Exportar</span>
          </button>

          {/* Filtros de Fecha (Servidor) */}
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

          {/* Buscador Local */}
          <div className="relative flex-1 md:flex-none min-w-[200px]">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
            <input 
              type="text" placeholder="Buscar en este listado..." 
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs outline-none focus:border-blue-500 transition-all shadow-sm"
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-20 flex flex-col items-center justify-center text-slate-400 gap-3">
              <Loader2 className="animate-spin" size={40} />
              <p className="text-[10px] font-bold uppercase tracking-widest">Cargando pagos...</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Fecha</th>
                  <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Proveedor</th>
                  <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Factura</th>
                  <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Método</th>
                  <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Monto</th>
                  <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredPayments.length > 0 ? (
                  filteredPayments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/30 transition-colors group">
                      <td className="p-4 font-bold text-slate-700 text-xs uppercase">{p.fecha_pago}</td>
                      <td className="p-4 font-bold text-slate-800 text-xs uppercase">{p.proveedor?.nombre}</td>
                      <td className="p-4 font-bold text-slate-500 text-xs uppercase">{p.compra?.numero_documento || 'S/N'}</td>
                      <td className="p-4 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                          p.metodo_pago === 'efectivo' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'
                        }`}>
                          {p.metodo_pago}
                        </span>
                      </td>
                      <td className="p-4 text-right font-black text-slate-900 text-xs tracking-tighter">
                          $ {parseFloat(p.monto).toLocaleString('es-CO')}
                      </td>
                      <td className="p-4 text-center">
                        <button 
                          onClick={() => navigate(`/pagos-compra/${p.id}`)}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                        >
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="p-10 text-center text-slate-400 text-xs font-bold uppercase italic">
                      No se encontraron pagos en este rango de fechas
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};