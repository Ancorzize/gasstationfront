import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Search, Plus, Loader2, Calendar, Edit2, CheckCircle2, XCircle, Lock, Download } from 'lucide-react';
import { payrollService } from '../services/payrollService';
import { useToast } from '../../../context/ToastContext';
import { PayrollPeriodModal } from '../components/PayrollPeriodModal';
import { exportToExcel } from '../../../shared/utils/exportExcel';

export const PayrollPeriodsPage = () => {
  const { showToast } = useToast();

  const [periods, setPeriods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const fetchPeriods = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await payrollService.getPeriods({
        search: searchTerm,
        status: statusFilter,
        page: page,
        per_page: 15,
      });

      if (res?.status) {
        setPeriods(res.data.items || []);
        if (res.data.pagination) {
          setCurrentPage(res.data.pagination.current_page || 1);
          setLastPage(res.data.pagination.last_page || 1);
          setTotalItems(res.data.pagination.total || 0);
        }
      } else {
        showToast(res?.message || 'Error al obtener los períodos de nómina.', 'error');
      }
    } catch {
      showToast('Error de conexión al cargar períodos.', 'error');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, statusFilter, showToast]);

  useEffect(() => {
    fetchPeriods(1);
  }, [fetchPeriods]);

  const handleChangeStatus = async (periodId, newStatus) => {
    try {
      const res = await payrollService.changePeriodStatus(periodId, newStatus);
      if (res?.status) {
        const labels = { open: 'abierto', closed: 'cerrado', cancelled: 'cancelado' };
        showToast(`El período ha sido cambiado a ${labels[newStatus] || newStatus}.`, 'success');
        fetchPeriods(currentPage);
      } else {
        showToast(res?.message || 'No se pudo cambiar el estado del período.', 'error');
      }
    } catch {
      showToast('Error al actualizar el estado del período.', 'error');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'open':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase bg-emerald-50 text-emerald-600 border border-emerald-200/50">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Abierto
          </span>
        );
      case 'closed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase bg-slate-100 text-slate-700 border border-slate-200">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
            Cerrado
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase bg-rose-50 text-rose-600 border border-rose-200/50">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
            Cancelado
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase bg-slate-100 text-slate-600">
            {status}
          </span>
        );
    }
  };

  const filteredExportItems = useMemo(() => {
    return periods.map((p) => ({
      Ciclo: p.payroll_cycle?.name || `Ciclo #${p.payroll_cycle_id}`,
      Nombre_Periodo: p.name,
      Fecha_Inicio: p.start_date,
      Fecha_Fin: p.end_date,
      Fecha_Pago: p.payment_date,
      Estado: p.status,
    }));
  }, [periods]);

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight uppercase">
            Períodos de Nómina
          </h2>
          <p className="text-slate-500 text-xs md:text-sm font-bold tracking-widest uppercase mt-0.5">
            Gestión y control de períodos de liquidación
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 md:gap-3">
          <button
            onClick={() => exportToExcel(filteredExportItems, 'Periodos_Nomina')}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-600 px-4 py-2.5 rounded-2xl font-bold text-[10px] uppercase hover:bg-slate-50 transition-all shadow-sm"
          >
            <Download size={16} /> <span className="hidden sm:inline">Exportar</span>
          </button>

          <div className="relative flex-1 md:flex-none min-w-[180px]">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Buscar período por nombre..."
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs outline-none focus:border-zinc-900 transition-all shadow-sm font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select
            className="bg-white border border-slate-200 text-slate-700 px-3 py-2.5 rounded-2xl font-bold text-xs outline-none focus:border-zinc-900 shadow-sm uppercase"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">Todos los estados</option>
            <option value="open">Abiertos (open)</option>
            <option value="closed">Cerrados (closed)</option>
            <option value="cancelled">Cancelados (cancelled)</option>
          </select>

          <button
            onClick={() => {
              setSelectedPeriod(null);
              setIsModalOpen(true);
            }}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-zinc-900 text-white px-4 py-2.5 rounded-2xl font-bold text-[10px] uppercase hover:bg-black transition-all shadow-md"
          >
            <Plus size={16} /> <span className="hidden sm:inline">Nuevo Período</span>
          </button>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar-light">
          {loading ? (
            <div className="p-20 flex flex-col items-center justify-center text-slate-400 gap-3">
              <Loader2 className="animate-spin" size={40} />
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Cargando períodos de nómina...
              </p>
            </div>
          ) : periods.length === 0 ? (
            <div className="p-16 text-center space-y-3">
              <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
                <Calendar size={24} />
              </div>
              <p className="text-sm font-bold text-slate-600 uppercase">No se encontraron períodos de nómina</p>
              <p className="text-xs text-slate-400">Intenta cambiar los filtros o crea un nuevo período.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-wider">Ciclo</th>
                  <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-wider">Nombre</th>
                  <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-wider">Fecha Inicio</th>
                  <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-wider">Fecha Fin</th>
                  <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-wider">Fecha Pago</th>
                  <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-wider text-center">Estado</th>
                  <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-wider text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                {periods.map((period) => (
                  <tr key={period.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-6">
                      <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 uppercase">
                        {period.payroll_cycle?.name || `Ciclo #${period.payroll_cycle_id}`}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-bold text-slate-900">{period.name}</td>
                    <td className="py-4 px-6 font-medium text-slate-600">{period.start_date}</td>
                    <td className="py-4 px-6 font-medium text-slate-600">{period.end_date}</td>
                    <td className="py-4 px-6 font-semibold text-slate-900">{period.payment_date}</td>
                    <td className="py-4 px-6 text-center">{getStatusBadge(period.status)}</td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setSelectedPeriod(period);
                            setIsModalOpen(true);
                          }}
                          className="p-2 text-slate-500 hover:text-zinc-900 hover:bg-slate-100 rounded-xl transition-all"
                          title="Editar Período"
                        >
                          <Edit2 size={16} />
                        </button>

                        {/* Status change actions */}
                        {period.status !== 'open' && (
                          <button
                            onClick={() => handleChangeStatus(period.id, 'open')}
                            className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                            title="Reabrir Período (open)"
                          >
                            <CheckCircle2 size={16} />
                          </button>
                        )}
                        {period.status !== 'closed' && (
                          <button
                            onClick={() => handleChangeStatus(period.id, 'closed')}
                            className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all"
                            title="Cerrar Período (closed)"
                          >
                            <Lock size={16} />
                          </button>
                        )}
                        {period.status !== 'cancelled' && (
                          <button
                            onClick={() => handleChangeStatus(period.id, 'cancelled')}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                            title="Cancelar Período (cancelled)"
                          >
                            <XCircle size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination Footer */}
        {!loading && periods.length > 0 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 bg-slate-50/50">
            <span>
              Total: <strong>{totalItems}</strong> períodos | Página <strong>{currentPage}</strong> de{' '}
              <strong>{lastPage}</strong>
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={currentPage <= 1}
                onClick={() => fetchPeriods(currentPage - 1)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 font-bold bg-white text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition-all"
              >
                Anterior
              </button>
              <button
                disabled={currentPage >= lastPage}
                onClick={() => fetchPeriods(currentPage + 1)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 font-bold bg-white text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition-all"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Payroll Period Modal */}
      <PayrollPeriodModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedPeriod(null);
        }}
        onSave={() => fetchPeriods(currentPage)}
        periodToEdit={selectedPeriod}
      />
    </div>
  );
};
