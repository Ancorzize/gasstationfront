import React, { useState, useEffect, useCallback } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, DollarSign, Calendar, FileText, Loader2, CheckCircle2, Lock, XCircle, Clock } from 'lucide-react';
import { payrollService } from '../services/payrollService';
import { useToast } from '../../../context/ToastContext';

export const PayrollSettlementDetailModal = ({ isOpen, onClose, settlementId, onStatusChange }) => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [settlement, setSettlement] = useState(null);
  const [earnings, setEarnings] = useState([]);
  const [deductions, setDeductions] = useState([]);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const fetchDetail = useCallback(async () => {
    if (!settlementId) return;
    setLoading(true);
    try {
      const [resSettlement, resEarnings, resDeductions] = await Promise.all([
        payrollService.getSettlement(settlementId),
        payrollService.getEarnings(settlementId),
        payrollService.getDeductions(settlementId),
      ]);

      if (resSettlement?.status) {
        setSettlement(resSettlement.data);
      } else {
        showToast(resSettlement?.message || 'Error al obtener la liquidación.', 'error');
      }

      if (resEarnings?.status) {
        setEarnings(Array.isArray(resEarnings.data) ? resEarnings.data : []);
      } else if (resSettlement?.data?.earnings) {
        setEarnings(resSettlement.data.earnings);
      }

      if (resDeductions?.status) {
        setDeductions(Array.isArray(resDeductions.data) ? resDeductions.data : []);
      } else if (resSettlement?.data?.deductions) {
        setDeductions(resSettlement.data.deductions);
      }
    } catch {
      showToast('Error al cargar detalle de la liquidación.', 'error');
    } finally {
      setLoading(false);
    }
  }, [settlementId, showToast]);

  useEffect(() => {
    if (isOpen && settlementId) {
      fetchDetail();
    }
  }, [isOpen, settlementId, fetchDetail]);

  const handleChangeStatus = async (newStatus) => {
    if (!settlementId) return;
    setUpdatingStatus(true);
    try {
      const res = await payrollService.changeSettlementStatus(settlementId, newStatus);
      if (res?.status) {
        const labels = {
          draft: 'borrador',
          calculated: 'calculada',
          closed: 'cerrada',
          cancelled: 'cancelada',
        };
        showToast(`Estado actualizado a ${labels[newStatus] || newStatus}.`, 'success');
        setSettlement(res.data);
        if (onStatusChange) onStatusChange();
      } else {
        showToast(res?.message || 'No se pudo cambiar el estado de la liquidación.', 'error');
      }
    } catch {
      showToast('Error al cambiar el estado de la liquidación.', 'error');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return '$ 0';
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(Number(amount));
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'draft':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase bg-amber-50 text-amber-700 border border-amber-200">
            <Clock size={12} /> Borrador (draft)
          </span>
        );
      case 'calculated':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase bg-blue-50 text-blue-700 border border-blue-200">
            <CheckCircle2 size={12} /> Calculada (calculated)
          </span>
        );
      case 'closed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Lock size={12} /> Cerrada (closed)
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle size={12} /> Cancelada (cancelled)
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase bg-slate-100 text-slate-700">
            {status}
          </span>
        );
    }
  };

  const snapshot = settlement?.snapshot || {};

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden border border-slate-100 my-8 flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-yellow-500/20 text-yellow-400 rounded-2xl border border-yellow-500/30">
                  <FileText size={22} />
                </div>
                <div>
                  <h3 className="text-base md:text-lg font-bold tracking-wide uppercase">
                    Detalle de Liquidación
                  </h3>
                  <p className="text-xs text-slate-400 font-medium">
                    {settlement
                      ? `Liquidación #${settlement.id} — ${snapshot.full_name || snapshot.first_name || 'Empleado'}`
                      : 'Cargando información de liquidación...'}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-all"
              >
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            {loading ? (
              <div className="p-20 flex flex-col items-center justify-center text-slate-400 gap-3 flex-1">
                <Loader2 className="animate-spin" size={40} />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Cargando desglose de la liquidación...
                </p>
              </div>
            ) : !settlement ? (
              <div className="p-16 text-center text-slate-500 flex-1">
                <p>No se pudo cargar la liquidación solicitada.</p>
              </div>
            ) : (
              <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar-light flex-1">
                {/* Employee Info Header Card */}
                <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200/80 space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-200/60">
                    <div>
                      <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">
                        {snapshot.full_name || `${snapshot.first_name} ${snapshot.first_surname}`}
                      </h4>
                      <p className="text-xs text-slate-500">
                        Código: <strong className="text-slate-800 uppercase">{snapshot.worker_code}</strong> | Doc:{' '}
                        <strong className="text-slate-800">{snapshot.document_number}</strong>
                      </p>
                    </div>
                    <div>{getStatusBadge(settlement.status)}</div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Salario Base</span>
                      <span className="font-extrabold text-slate-800">{formatCurrency(snapshot.salary)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Días Trabajados</span>
                      <span className="font-extrabold text-slate-800">{settlement.days_worked} días</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Fecha Ingreso</span>
                      <span className="font-semibold text-slate-700">{snapshot.date_entry || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Fecha Retiro</span>
                      <span className="font-semibold text-slate-700">{snapshot.departure_date || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                {/* Earnings and Deductions Side-by-Side / Stacked */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Devengados */}
                  <div className="space-y-3">
                    <h5 className="text-xs font-black uppercase tracking-widest text-emerald-700 flex items-center justify-between">
                      <span>Devengados</span>
                      <span className="text-[10px] font-extrabold bg-emerald-100 px-2 py-0.5 rounded-full text-emerald-800">
                        {earnings.length} conceptos
                      </span>
                    </h5>
                    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase">
                          <tr>
                            <th className="py-2.5 px-4">Concepto</th>
                            <th className="py-2.5 px-4 text-right">Valor</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium">
                          {earnings.length === 0 ? (
                            <tr>
                              <td colSpan="2" className="py-4 px-4 text-center text-slate-400 text-xs">
                                No hay devengados registrados.
                              </td>
                            </tr>
                          ) : (
                            earnings.map((earning) => (
                              <tr key={earning.id} className="hover:bg-slate-50">
                                <td className="py-3 px-4">
                                  <div className="font-bold text-slate-800">{earning.name}</div>
                                  {earning.type_code && (
                                    <span className="text-[9px] text-slate-400 font-mono">{earning.type_code}</span>
                                  )}
                                </td>
                                <td className="py-3 px-4 text-right font-bold text-emerald-600">
                                  {formatCurrency(earning.amount)}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Deducciones */}
                  <div className="space-y-3">
                    <h5 className="text-xs font-black uppercase tracking-widest text-rose-700 flex items-center justify-between">
                      <span>Deducciones</span>
                      <span className="text-[10px] font-extrabold bg-rose-100 px-2 py-0.5 rounded-full text-rose-800">
                        {deductions.length} conceptos
                      </span>
                    </h5>
                    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase">
                          <tr>
                            <th className="py-2.5 px-4">Concepto</th>
                            <th className="py-2.5 px-4 text-right">Valor</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium">
                          {deductions.length === 0 ? (
                            <tr>
                              <td colSpan="2" className="py-4 px-4 text-center text-slate-400 text-xs">
                                No hay deducciones registradas.
                              </td>
                            </tr>
                          ) : (
                            deductions.map((deduction) => (
                              <tr key={deduction.id} className="hover:bg-slate-50">
                                <td className="py-3 px-4">
                                  <div className="font-bold text-slate-800">{deduction.name}</div>
                                  <div className="text-[9px] text-slate-400">
                                    {deduction.percentage !== null && deduction.percentage !== undefined
                                      ? `${deduction.percentage}%`
                                      : ''}{' '}
                                    {deduction.base_amount !== null && deduction.base_amount !== undefined
                                      ? `(Base: ${formatCurrency(deduction.base_amount)})`
                                      : ''}
                                  </div>
                                </td>
                                <td className="py-3 px-4 text-right font-bold text-rose-600">
                                  {formatCurrency(deduction.amount)}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Resumen Totales Card */}
                <div className="bg-zinc-900 text-white rounded-2xl p-5 shadow-xl space-y-3">
                  <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Resumen de Liquidación
                  </h5>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1 border-t border-slate-800">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Total Devengado</span>
                      <span className="text-sm font-black text-emerald-400">
                        {formatCurrency(settlement.total_earned)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Total Deducciones</span>
                      <span className="text-sm font-black text-rose-400">
                        {formatCurrency(settlement.deductions_total)}
                      </span>
                    </div>
                    <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
                      <span className="text-[10px] font-bold text-yellow-400 uppercase block">Neto a Pagar</span>
                      <span className="text-base font-black text-white">
                        {formatCurrency(settlement.total_voucher)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Footer / Status Actions */}
            {settlement && !loading && (
              <div className="p-6 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 flex-shrink-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-slate-500 uppercase mr-1">Cambiar Estado:</span>
                  {settlement.status !== 'draft' && (
                    <button
                      disabled={updatingStatus}
                      onClick={() => handleChangeStatus('draft')}
                      className="px-3 py-1.5 rounded-xl border border-amber-300 bg-amber-50 text-amber-700 text-xs font-bold hover:bg-amber-100 transition-all disabled:opacity-50"
                    >
                      Borrador
                    </button>
                  )}
                  {settlement.status !== 'calculated' && (
                    <button
                      disabled={updatingStatus}
                      onClick={() => handleChangeStatus('calculated')}
                      className="px-3 py-1.5 rounded-xl border border-blue-300 bg-blue-50 text-blue-700 text-xs font-bold hover:bg-blue-100 transition-all disabled:opacity-50"
                    >
                      Calculada
                    </button>
                  )}
                  {settlement.status !== 'closed' && (
                    <button
                      disabled={updatingStatus}
                      onClick={() => handleChangeStatus('closed')}
                      className="px-3 py-1.5 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-700 text-xs font-bold hover:bg-emerald-100 transition-all disabled:opacity-50"
                    >
                      Cerrar
                    </button>
                  )}
                  {settlement.status !== 'cancelled' && (
                    <button
                      disabled={updatingStatus}
                      onClick={() => handleChangeStatus('cancelled')}
                      className="px-3 py-1.5 rounded-xl border border-rose-300 bg-rose-50 text-rose-700 text-xs font-bold hover:bg-rose-100 transition-all disabled:opacity-50"
                    >
                      Cancelar
                    </button>
                  )}
                </div>

                <button
                  onClick={onClose}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-2xl bg-slate-900 text-white font-bold text-xs hover:bg-black transition-all uppercase"
                >
                  Cerrar Ventana
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
