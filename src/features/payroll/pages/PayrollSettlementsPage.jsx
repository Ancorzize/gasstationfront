import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Search, Loader2, Eye, Download, Calculator, Calendar, Plus } from 'lucide-react';
import { payrollService } from '../services/payrollService';
import { useToast } from '../../../context/ToastContext';
import { PayrollSettlementDetailModal } from '../components/PayrollSettlementDetailModal';
import { PayrollSettlementModal } from '../components/PayrollSettlementModal';
import { exportToExcel } from '../../../shared/utils/exportExcel';

export const PayrollSettlementsPage = () => {
  const { showToast } = useToast();

  const [periods, setPeriods] = useState([]);
  const [selectedPeriodId, setSelectedPeriodId] = useState('');
  const [settlements, setSettlements] = useState([]);
  const [loadingPeriods, setLoadingPeriods] = useState(true);
  const [loadingSettlements, setLoadingSettlements] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modal Detail State
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedSettlementId, setSelectedSettlementId] = useState(null);

  // Modal Create State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Load Periods on Mount
  useEffect(() => {
    const fetchPeriods = async () => {
      setLoadingPeriods(true);
      try {
        const res = await payrollService.getPeriods({ per_page: 100 });
        if (res?.status) {
          const items = res.data?.items || (Array.isArray(res.data) ? res.data : []);
          setPeriods(items);
          if (items.length > 0) {
            setSelectedPeriodId(String(items[0].id));
          }
        } else {
          showToast(res?.message || 'Error al cargar períodos de nómina.', 'error');
        }
      } catch {
        showToast('Error de conexión al cargar períodos.', 'error');
      } finally {
        setLoadingPeriods(false);
      }
    };
    fetchPeriods();
  }, [showToast]);

  // Load Settlements when selected period changes
  const fetchSettlements = useCallback(async () => {
    if (!selectedPeriodId) {
      setSettlements([]);
      return;
    }

    setLoadingSettlements(true);
    try {
      const res = await payrollService.getSettlementsByPeriod(selectedPeriodId);
      if (res?.status) {
        const list = Array.isArray(res.data) ? res.data : res.data?.items || [];
        setSettlements(list);
      } else {
        // Fallback to getSettlements filter
        const fallbackRes = await payrollService.getSettlements({
          payroll_period_id: selectedPeriodId,
          per_page: 100,
        });
        if (fallbackRes?.status) {
          setSettlements(fallbackRes.data?.items || []);
        } else {
          showToast(res?.message || 'Error al obtener liquidaciones.', 'error');
        }
      }
    } catch {
      showToast('Error de conexión al obtener liquidaciones.', 'error');
    } finally {
      setLoadingSettlements(false);
    }
  }, [selectedPeriodId, showToast]);

  useEffect(() => {
    fetchSettlements();
  }, [fetchSettlements]);

  // Currency Formatter
  const formatCurrency = (val) => {
    if (val === null || val === undefined) return '$ 0';
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(Number(val));
  };

  // Helper to extract Transport Assistance
  const getTransportAssistance = (settlement) => {
    if (settlement?.earnings && Array.isArray(settlement.earnings)) {
      const transport = settlement.earnings.find(
        (e) => e.type_code === 'TRANSPORT_ASSISTANCE' || (e.name && e.name.toLowerCase().includes('transporte'))
      );
      if (transport) return Number(transport.amount || 0);
    }
    return 0;
  };

  // Filtered settlements in memory
  const filteredSettlements = useMemo(() => {
    return settlements.filter((s) => {
      const snapshot = s.snapshot || {};
      const target = searchTerm.toLowerCase().trim();

      const matchesSearch =
        !target ||
        (snapshot.full_name && snapshot.full_name.toLowerCase().includes(target)) ||
        (snapshot.first_name && snapshot.first_name.toLowerCase().includes(target)) ||
        (snapshot.first_surname && snapshot.first_surname.toLowerCase().includes(target)) ||
        (snapshot.document_number && snapshot.document_number.toLowerCase().includes(target)) ||
        (snapshot.worker_code && snapshot.worker_code.toLowerCase().includes(target));

      const matchesStatus = !statusFilter || s.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [settlements, searchTerm, statusFilter]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'draft':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-50 text-amber-700 border border-amber-200">
            Borrador
          </span>
        );
      case 'calculated':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-blue-50 text-blue-700 border border-blue-200">
            Calculada
          </span>
        );
      case 'closed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
            Cerrada
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-rose-50 text-rose-700 border border-rose-200">
            Cancelada
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-slate-100 text-slate-700">
            {status}
          </span>
        );
    }
  };

  const exportData = useMemo(() => {
    return filteredSettlements.map((s) => {
      const snap = s.snapshot || {};
      return {
        Empleado: snap.full_name || `${snap.first_name} ${snap.first_surname}`,
        Documento: snap.document_number,
        Código: snap.worker_code,
        Días_Trabajados: s.days_worked,
        Salario_Básico: s.basic_salary,
        Auxilio_Transporte: getTransportAssistance(s),
        Total_Devengado: s.total_earned,
        Total_Deducciones: s.deductions_total,
        Neto_a_Pagar: s.total_voucher,
        Estado: s.status,
      };
    });
  }, [filteredSettlements]);

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight uppercase">
            Liquidaciones de Nómina
          </h2>
          <p className="text-slate-500 text-xs md:text-sm font-bold tracking-widest uppercase mt-0.5">
            Consulta y desglose de liquidaciones por período
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 md:gap-3">
          <button
            onClick={() => exportToExcel(exportData, 'Liquidaciones_Nomina')}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-600 px-4 py-2.5 rounded-2xl font-bold text-[10px] uppercase hover:bg-slate-50 transition-all shadow-sm"
          >
            <Download size={16} /> <span className="hidden sm:inline">Exportar</span>
          </button>

          {/* Period Selector */}
          <div className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-1.5 rounded-2xl shadow-sm min-w-[200px]">
            <Calendar size={16} className="text-yellow-500 flex-shrink-0" />
            <select
              className="w-full bg-transparent text-xs font-bold text-slate-800 outline-none cursor-pointer"
              value={selectedPeriodId}
              onChange={(e) => setSelectedPeriodId(e.target.value)}
              disabled={loadingPeriods}
            >
              {loadingPeriods ? (
                <option>Cargando períodos...</option>
              ) : periods.length === 0 ? (
                <option>Sin períodos creados</option>
              ) : (
                periods.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.status})
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Search Bar */}
          <div className="relative flex-1 md:flex-none min-w-[160px]">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Buscar empleado o doc..."
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs outline-none focus:border-zinc-900 transition-all shadow-sm font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Status Filter */}
          <select
            className="bg-white border border-slate-200 text-slate-700 px-3 py-2.5 rounded-2xl font-bold text-xs outline-none focus:border-zinc-900 shadow-sm uppercase"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">Todos los estados</option>
            <option value="draft">Borrador (draft)</option>
            <option value="calculated">Calculada (calculated)</option>
            <option value="closed">Cerrada (closed)</option>
            <option value="cancelled">Cancelada (cancelled)</option>
          </select>

          {/* New Settlement Button */}
          {selectedPeriodId && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-zinc-900 text-white px-4 py-2.5 rounded-2xl font-bold text-[10px] uppercase hover:bg-black transition-all shadow-md"
            >
              <Plus size={16} /> <span className="hidden sm:inline">Nueva Liquidación</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar-light">
          {loadingSettlements ? (
            <div className="p-20 flex flex-col items-center justify-center text-slate-400 gap-3">
              <Loader2 className="animate-spin" size={40} />
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Cargando liquidaciones del período...
              </p>
            </div>
          ) : filteredSettlements.length === 0 ? (
            <div className="p-16 text-center space-y-3">
              <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
                <Calculator size={24} />
              </div>
              <p className="text-sm font-bold text-slate-600 uppercase">No hay liquidaciones para mostrar</p>
              <p className="text-xs text-slate-400">
                {selectedPeriodId
                  ? 'No se encontraron liquidaciones para el período o filtro seleccionado.'
                  : 'Selecciona un período de nómina para consultar sus liquidaciones.'}
              </p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-wider">Empleado</th>
                  <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-wider">Documento</th>
                  <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-wider text-center">Días</th>
                  <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-wider text-right">Salario Base</th>
                  <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-wider text-right">Aux. Transporte</th>
                  <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-wider text-right">Total Devengado</th>
                  <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-wider text-right">Total Deducciones</th>
                  <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-wider text-right">Neto a Pagar</th>
                  <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-wider text-center">Estado</th>
                  <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-wider text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                {filteredSettlements.map((settlement) => {
                  const snap = settlement.snapshot || {};
                  const auxTransport = getTransportAssistance(settlement);

                  return (
                    <tr key={settlement.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 px-6">
                        <div className="font-bold text-slate-900">
                          {snap.full_name || `${snap.first_name || ''} ${snap.first_surname || ''}`}
                        </div>
                        <div className="text-[10px] text-slate-400 uppercase font-mono">{snap.worker_code}</div>
                      </td>
                      <td className="py-4 px-6 font-semibold text-slate-800">{snap.document_number}</td>
                      <td className="py-4 px-6 text-center font-bold text-slate-800">{settlement.days_worked}</td>
                      <td className="py-4 px-6 text-right font-medium text-slate-700">
                        {formatCurrency(settlement.basic_salary)}
                      </td>
                      <td className="py-4 px-6 text-right font-medium text-slate-700 font-mono">
                        {formatCurrency(auxTransport)}
                      </td>
                      <td className="py-4 px-6 text-right font-bold text-emerald-600">
                        {formatCurrency(settlement.total_earned)}
                      </td>
                      <td className="py-4 px-6 text-right font-bold text-rose-600">
                        {formatCurrency(settlement.deductions_total)}
                      </td>
                      <td className="py-4 px-6 text-right font-black text-slate-900 bg-slate-50/50">
                        {formatCurrency(settlement.total_voucher)}
                      </td>
                      <td className="py-4 px-6 text-center">{getStatusBadge(settlement.status)}</td>
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => {
                            setSelectedSettlementId(settlement.id);
                            setIsDetailModalOpen(true);
                          }}
                          className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 text-white font-bold text-[10px] uppercase hover:bg-black transition-all shadow-sm ml-auto"
                        >
                          <Eye size={14} /> <span>Ver detalle</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      <PayrollSettlementDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedSettlementId(null);
        }}
        settlementId={selectedSettlementId}
        onStatusChange={fetchSettlements}
      />

      {/* Create Settlement Modal */}
      <PayrollSettlementModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSave={fetchSettlements}
        periodId={selectedPeriodId}
        periodName={periods.find((p) => String(p.id) === String(selectedPeriodId))?.name}
      />
    </div>
  );
};
