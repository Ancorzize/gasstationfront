import React, { useEffect, useState, useCallback, useMemo } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Send,
  RefreshCw,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  Calendar,
  ShieldCheck,
  FileCheck,
  Download,
  Info,
} from 'lucide-react';
import { payrollService } from '../services/payrollService';
import { useToast } from '../../../context/ToastContext';
import { exportToExcel } from '../../../shared/utils/exportExcel';

export const ElectronicPayrollPage = () => {
  const { showToast } = useToast();

  const [periods, setPeriods] = useState([]);
  const [selectedPeriodId, setSelectedPeriodId] = useState('');
  const [settlements, setSettlements] = useState([]);
  const [loadingPeriods, setLoadingPeriods] = useState(true);
  const [loadingSettlements, setLoadingSettlements] = useState(false);

  // Transmission local state dictionary keyed by settlementId
  const [transmissionMap, setTransmissionMap] = useState({});

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [settlementStatusFilter, setSettlementStatusFilter] = useState('');
  const [transmissionStatusFilter, setTransmissionStatusFilter] = useState('');

  // Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    type: null, // 'transmit' | 'replace' | 'delete'
    settlement: null,
    loading: false,
  });

  // Load Periods
  useEffect(() => {
    const fetchPeriods = async () => {
      setLoadingPeriods(true);
      try {
        const res = await payrollService.getPeriods({ per_page: 100 });
        if (res?.status) {
          const list = res.data?.items || (Array.isArray(res.data) ? res.data : []);
          setPeriods(list);
          if (list.length > 0) {
            setSelectedPeriodId(String(list[0].id));
          }
        } else {
          showToast(res?.message || 'Error al obtener los períodos de nómina.', 'error');
        }
      } catch {
        showToast('Error de conexión al cargar períodos.', 'error');
      } finally {
        setLoadingPeriods(false);
      }
    };
    fetchPeriods();
  }, [showToast]);

  // Load Settlements for Selected Period
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
        const fallbackRes = await payrollService.getSettlements({
          payroll_period_id: selectedPeriodId,
          per_page: 100,
        });
        if (fallbackRes?.status) {
          setSettlements(fallbackRes.data?.items || []);
        } else {
          showToast(res?.message || 'Error al consultar las liquidaciones del período.', 'error');
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

  // Formatting helpers
  const formatCurrency = (val) => {
    if (val === null || val === undefined) return '$ 0';
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(Number(val));
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      return new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short', year: 'numeric' }).format(d);
    } catch {
      return dateStr;
    }
  };

  // Execute transmission action (Transmit, Replace, Delete)
  const handleExecuteAction = async () => {
    const { type, settlement } = confirmModal;
    if (!settlement || !type) return;

    setConfirmModal((prev) => ({ ...prev, loading: true }));

    try {
      let res;
      if (type === 'transmit') {
        res = await payrollService.transmitPayroll(settlement.id);
      } else if (type === 'replace') {
        res = await payrollService.replacePayroll(settlement.id);
      } else if (type === 'delete') {
        res = await payrollService.deletePayroll(settlement.id);
      }

      if (res?.status && res.data?.exitoso !== false) {
        const payloadData = res.data || {};
        const successMsg =
          type === 'transmit'
            ? 'Nómina electrónica transmitida exitosamente a MATIAS API.'
            : type === 'replace'
            ? 'Nómina electrónica reemplazada exitosamente en MATIAS API.'
            : 'Nómina electrónica eliminada/anulada exitosamente en MATIAS API.';

        showToast(res.message || successMsg, 'success');

        // Store transmission result in local state
        setTransmissionMap((prev) => ({
          ...prev,
          [settlement.id]: {
            transmitted: type !== 'delete',
            type: type,
            status: payloadData.estado || (type === 'delete' ? 'eliminado' : 'transmitido'),
            documentNumber: payloadData.numero_documento || payloadData.document_number || 'Transmitido',
            cune: payloadData.cune || payloadData.cufe || 'Generado',
            trackId: payloadData.track_id || 'N/A',
            message: payloadData.mensaje || successMsg,
            lastUpdate: new Date().toLocaleTimeString(),
          },
        }));

        fetchSettlements();
      } else {
        const errorMsg =
          res?.message ||
          res?.data?.mensaje ||
          'La operación fue rechazada por la API de MATIAS.';
        showToast(`MATIAS API Error: ${errorMsg}`, 'error');

        // Store failed status
        setTransmissionMap((prev) => ({
          ...prev,
          [settlement.id]: {
            ...prev[settlement.id],
            transmitted: false,
            status: 'rechazado',
            message: errorMsg,
          },
        }));
      }
    } catch {
      showToast('Error de comunicación con el servicio de transmisión MATIAS.', 'error');
    } finally {
      setConfirmModal({ isOpen: false, type: null, settlement: null, loading: false });
    }
  };

  // Open confirmation modal
  const openConfirm = (type, settlement) => {
    setConfirmModal({
      isOpen: true,
      type,
      settlement,
      loading: false,
    });
  };

  // Filtered settlements list
  const filteredSettlements = useMemo(() => {
    return settlements.filter((s) => {
      const snap = s.snapshot || {};
      const tx = transmissionMap[s.id] || {};
      const target = searchTerm.toLowerCase().trim();

      const matchesSearch =
        !target ||
        (snap.full_name && snap.full_name.toLowerCase().includes(target)) ||
        (snap.first_name && snap.first_name.toLowerCase().includes(target)) ||
        (snap.first_surname && snap.first_surname.toLowerCase().includes(target)) ||
        (snap.document_number && snap.document_number.toLowerCase().includes(target)) ||
        (snap.worker_code && snap.worker_code.toLowerCase().includes(target)) ||
        (tx.documentNumber && tx.documentNumber.toLowerCase().includes(target)) ||
        (tx.cune && tx.cune.toLowerCase().includes(target));

      const matchesSettlementStatus = !settlementStatusFilter || s.status === settlementStatusFilter;

      let matchesTransmissionStatus = true;
      if (transmissionStatusFilter === 'transmitted') {
        matchesTransmissionStatus = Boolean(tx.transmitted);
      } else if (transmissionStatusFilter === 'not_transmitted') {
        matchesTransmissionStatus = !tx.transmitted;
      } else if (transmissionStatusFilter === 'rejected') {
        matchesTransmissionStatus = tx.status === 'rechazado';
      }

      return matchesSearch && matchesSettlementStatus && matchesTransmissionStatus;
    });
  }, [settlements, transmissionMap, searchTerm, settlementStatusFilter, transmissionStatusFilter]);

  const exportData = useMemo(() => {
    return filteredSettlements.map((s) => {
      const snap = s.snapshot || {};
      const tx = transmissionMap[s.id] || {};
      return {
        Empleado: snap.full_name || `${snap.first_name} ${snap.first_surname}`,
        Documento: snap.document_number,
        Código: snap.worker_code,
        Período: s.payroll_period?.name || `Período #${s.payroll_period_id}`,
        Total_Devengado: s.total_earned,
        Total_Deducciones: s.deductions_total,
        Neto_a_Pagar: s.total_voucher,
        Estado_Liquidación: s.status,
        Estado_Transmisión: tx.transmitted ? 'Transmitido' : 'Sin Transmitir',
        Número_Documento: tx.documentNumber || 'N/A',
        CUNE: tx.cune || 'N/A',
        Track_ID: tx.trackId || 'N/A',
      };
    });
  }, [filteredSettlements, transmissionMap]);

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight uppercase">
            Nómina — Nómina Electrónica
          </h2>
          <p className="text-slate-500 text-xs md:text-sm font-bold tracking-widest uppercase mt-0.5">
            Transmisión, reemplazo y eliminación de documentos en MATIAS API
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 md:gap-3">
          <button
            onClick={() => exportToExcel(exportData, 'Nomina_Electronica_MATIAS')}
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
              placeholder="Buscar empleado, doc o CUNE..."
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs outline-none focus:border-zinc-900 transition-all shadow-sm font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Settlement Status Filter */}
          <select
            className="bg-white border border-slate-200 text-slate-700 px-3 py-2.5 rounded-2xl font-bold text-xs outline-none focus:border-zinc-900 shadow-sm uppercase"
            value={settlementStatusFilter}
            onChange={(e) => setSettlementStatusFilter(e.target.value)}
          >
            <option value="">Todas las liquidaciones</option>
            <option value="draft">Borrador (draft)</option>
            <option value="calculated">Calculada (calculated)</option>
            <option value="closed">Cerrada (closed)</option>
            <option value="cancelled">Cancelada (cancelled)</option>
          </select>

          {/* Transmission Status Filter */}
          <select
            className="bg-white border border-slate-200 text-slate-700 px-3 py-2.5 rounded-2xl font-bold text-xs outline-none focus:border-zinc-900 shadow-sm uppercase"
            value={transmissionStatusFilter}
            onChange={(e) => setTransmissionStatusFilter(e.target.value)}
          >
            <option value="">Todas las transmisiones</option>
            <option value="not_transmitted">Sin Transmitir</option>
            <option value="transmitted">Transmitidas</option>
            <option value="rejected">Rechazadas</option>
          </select>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar-light">
          {loadingSettlements ? (
            <div className="p-20 flex flex-col items-center justify-center text-slate-400 gap-3">
              <Loader2 className="animate-spin" size={40} />
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Consultando nóminas electrónicas...
              </p>
            </div>
          ) : filteredSettlements.length === 0 ? (
            <div className="p-16 text-center space-y-3">
              <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
                <FileCheck size={24} />
              </div>
              <p className="text-sm font-bold text-slate-600 uppercase">
                No hay nóminas electrónicas para mostrar
              </p>
              <p className="text-xs text-slate-400">
                Selecciona otro período de nómina o cambia los criterios de búsqueda.
              </p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                    Empleado
                  </th>
                  <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                    Documento
                  </th>
                  <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                    Período
                  </th>
                  <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-wider text-right">
                    Devengado
                  </th>
                  <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-wider text-right">
                    Deducciones
                  </th>
                  <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-wider text-right">
                    Neto a Pagar
                  </th>
                  <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-wider text-center">
                    Estado Liquidación
                  </th>
                  <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-wider text-center">
                    Estado MATIAS
                  </th>
                  <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                    Datos DIAN / CUNE
                  </th>
                  <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-wider text-right">
                    Acciones MATIAS
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                {filteredSettlements.map((settlement) => {
                  const snap = settlement.snapshot || {};
                  const tx = transmissionMap[settlement.id] || {};

                  return (
                    <tr key={settlement.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 px-6">
                        <div className="font-bold text-slate-900">
                          {snap.full_name || `${snap.first_name || ''} ${snap.first_surname || ''}`}
                        </div>
                        <div className="text-[10px] text-slate-400 uppercase font-mono">{snap.worker_code}</div>
                      </td>
                      <td className="py-4 px-6 font-semibold text-slate-800">{snap.document_number}</td>
                      <td className="py-4 px-6">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                          {settlement.payroll_period?.name || `Período #${settlement.payroll_period_id}`}
                        </span>
                        <div className="text-[9px] text-slate-400 mt-0.5">
                          {formatDate(settlement.created_at)}
                        </div>
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
                      <td className="py-4 px-6 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                            settlement.status === 'closed'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : settlement.status === 'calculated'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : settlement.status === 'cancelled'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {settlement.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-center">
                        {tx.transmitted ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 size={12} /> {tx.status || 'Transmitido'}
                          </span>
                        ) : tx.status === 'rechazado' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-rose-50 text-rose-700 border border-rose-200">
                            <XCircle size={12} /> Rechazado
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-slate-100 text-slate-500 border border-slate-200">
                            Sin Transmitir
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 max-w-[200px]">
                        {tx.transmitted ? (
                          <div className="space-y-0.5 text-[10px]">
                            <div className="font-bold text-slate-900 truncate">
                              Doc: {tx.documentNumber}
                            </div>
                            <div className="font-mono text-slate-500 truncate" title={tx.cune}>
                              CUNE: {tx.cune}
                            </div>
                            <div className="text-slate-400 truncate">Track: {tx.trackId}</div>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">Pendiente por enviar</span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* TRANSMITIR */}
                          {!tx.transmitted && (
                            <button
                              onClick={() => openConfirm('transmit', settlement)}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-zinc-900 text-white font-bold text-[10px] uppercase hover:bg-black transition-all shadow-sm"
                              title="Transmitir nómina a MATIAS"
                            >
                              <Send size={12} /> Transmitir
                            </button>
                          )}

                          {/* REEMPLAZAR */}
                          {tx.transmitted && (
                            <button
                              onClick={() => openConfirm('replace', settlement)}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-500 text-white font-bold text-[10px] uppercase hover:bg-amber-600 transition-all shadow-sm"
                              title="Enviar nómina de reemplazo a MATIAS"
                            >
                              <RefreshCw size={12} /> Reemplazar
                            </button>
                          )}

                          {/* ELIMINAR */}
                          {tx.transmitted && (
                            <button
                              onClick={() => openConfirm('delete', settlement)}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-600 text-white font-bold text-[10px] uppercase hover:bg-rose-700 transition-all shadow-sm"
                              title="Anular/Eliminar nómina transmitida en MATIAS"
                            >
                              <Trash2 size={12} /> Eliminar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {confirmModal.isOpen && confirmModal.settlement && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-slate-100 p-6 text-center space-y-4"
            >
              <div
                className={`mx-auto w-14 h-14 rounded-full flex items-center justify-center ${
                  confirmModal.type === 'delete'
                    ? 'bg-rose-100 text-rose-600'
                    : confirmModal.type === 'replace'
                    ? 'bg-amber-100 text-amber-600'
                    : 'bg-zinc-100 text-zinc-900'
                }`}
              >
                {confirmModal.type === 'delete' ? (
                  <Trash2 size={28} />
                ) : confirmModal.type === 'replace' ? (
                  <RefreshCw size={28} />
                ) : (
                  <Send size={28} />
                )}
              </div>

              <div>
                <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">
                  {confirmModal.type === 'transmit'
                    ? 'Transmitir Nómina Electrónica'
                    : confirmModal.type === 'replace'
                    ? 'Reemplazar Nómina Electrónica'
                    : 'Eliminar / Anular Nómina Electrónica'}
                </h3>
                <p className="text-xs text-slate-500 mt-2">
                  {confirmModal.type === 'transmit' ? (
                    <>
                      Se enviará el documento de nómina electrónica del empleado{' '}
                      <strong>{confirmModal.settlement.snapshot?.full_name || confirmModal.settlement.snapshot?.first_name}</strong> a la
                      API de MATIAS para su transmisión ante la DIAN.
                    </>
                  ) : confirmModal.type === 'replace' ? (
                    <>
                      Se enviará un documento electrónico de <strong>reemplazo</strong> para corregir la nómina de{' '}
                      <strong>{confirmModal.settlement.snapshot?.full_name || confirmModal.settlement.snapshot?.first_name}</strong> en
                      MATIAS.
                    </>
                  ) : (
                    <>
                      Se enviará una solicitud de <strong>eliminación/anulación</strong> para la nómina electrónica transmitida de{' '}
                      <strong>{confirmModal.settlement.snapshot?.full_name || confirmModal.settlement.snapshot?.first_name}</strong> en
                      MATIAS. Esta es una operación oficial en la DIAN.
                    </>
                  )}
                </p>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setConfirmModal({ isOpen: false, type: null, settlement: null, loading: false })
                  }
                  className="flex-1 py-3 rounded-2xl border border-slate-200 text-slate-600 font-bold text-xs uppercase hover:bg-slate-50 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={confirmModal.loading}
                  onClick={handleExecuteAction}
                  className={`flex-1 py-3 rounded-2xl text-white font-bold text-xs uppercase transition-all flex items-center justify-center gap-2 shadow-lg ${
                    confirmModal.type === 'delete'
                      ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-200'
                      : confirmModal.type === 'replace'
                      ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-200'
                      : 'bg-zinc-900 hover:bg-black shadow-zinc-200'
                  }`}
                >
                  {confirmModal.loading ? (
                    'Procesando...'
                  ) : (
                    <span>
                      {confirmModal.type === 'transmit'
                        ? 'Transmitir'
                        : confirmModal.type === 'replace'
                        ? 'Reemplazar'
                        : 'Eliminar'}
                    </span>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
