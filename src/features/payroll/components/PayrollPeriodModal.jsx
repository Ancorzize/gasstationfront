import React, { useState, useEffect, useCallback } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Clock, CheckCircle2, RefreshCw, FileText } from 'lucide-react';
import { payrollService } from '../services/payrollService';
import { useToast } from '../../../context/ToastContext';

export const PayrollPeriodModal = ({ isOpen, onClose, onSave, periodToEdit = null }) => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [cycles, setCycles] = useState([]);

  const [formData, setFormData] = useState({
    payroll_cycle_id: '',
    name: '',
    start_date: '',
    end_date: '',
    payment_date: '',
    status: 'open',
  });

  const loadCycles = useCallback(async () => {
    try {
      const res = await payrollService.getCycles({ is_active: '1' });
      if (res?.status) {
        const list = Array.isArray(res.data) ? res.data : res.data?.items || [];
        setCycles(list);
        if (!periodToEdit && list.length > 0) {
          setFormData((prev) => ({ ...prev, payroll_cycle_id: String(list[0].id) }));
        }
      }
    } catch {
      showToast('Error al cargar ciclos de nómina.', 'error');
    }
  }, [periodToEdit, showToast]);

  useEffect(() => {
    if (isOpen) {
      loadCycles();

      if (periodToEdit) {
        setFormData({
          payroll_cycle_id: periodToEdit.payroll_cycle_id ? String(periodToEdit.payroll_cycle_id) : '',
          name: periodToEdit.name || '',
          start_date: periodToEdit.start_date || '',
          end_date: periodToEdit.end_date || '',
          payment_date: periodToEdit.payment_date || '',
          status: periodToEdit.status || 'open',
        });
      } else {
        const today = new Date().toISOString().split('T')[0];
        setFormData({
          payroll_cycle_id: '',
          name: '',
          start_date: today,
          end_date: today,
          payment_date: today,
          status: 'open',
        });
      }
    }
  }, [isOpen, periodToEdit, loadCycles]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Frontend Validations
    if (!formData.payroll_cycle_id) {
      showToast('El ciclo de nómina es obligatorio.', 'error');
      return;
    }
    if (!formData.name.trim()) {
      showToast('El nombre del período es obligatorio.', 'error');
      return;
    }
    if (!formData.start_date) {
      showToast('La fecha de inicio es obligatoria.', 'error');
      return;
    }
    if (!formData.end_date) {
      showToast('La fecha de fin es obligatoria.', 'error');
      return;
    }
    if (!formData.payment_date) {
      showToast('La fecha de pago es obligatoria.', 'error');
      return;
    }
    if (formData.end_date < formData.start_date) {
      showToast('La fecha de fin no puede ser anterior a la fecha de inicio.', 'error');
      return;
    }
    if (formData.payment_date < formData.end_date) {
      showToast('La fecha de pago no puede ser anterior a la fecha de fin.', 'error');
      return;
    }

    setLoading(true);

    try {
      let res;
      if (periodToEdit) {
        const payload = {
          name: formData.name.trim(),
          start_date: formData.start_date,
          end_date: formData.end_date,
          payment_date: formData.payment_date,
          status: formData.status,
        };
        res = await payrollService.updatePeriod(periodToEdit.id, payload);
      } else {
        const payload = {
          name: formData.name.trim(),
          start_date: formData.start_date,
          end_date: formData.end_date,
          payment_date: formData.payment_date,
          status: formData.status,
        };
        res = await payrollService.createPeriod(formData.payroll_cycle_id, payload);
      }

      if (res?.status) {
        showToast(
          periodToEdit
            ? 'Período de nómina actualizado correctamente.'
            : 'Período de nómina creado correctamente.',
          'success'
        );
        onSave();
        onClose();
      } else {
        showToast(res?.message || 'Error al procesar el período de nómina.', 'error');
      }
    } catch {
      showToast('Error de conexión al guardar el período.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-slate-100 my-8 flex flex-col"
          >
            {/* Header */}
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-yellow-500/20 text-yellow-400 rounded-2xl border border-yellow-500/30">
                  <Calendar size={22} />
                </div>
                <div>
                  <h3 className="text-base md:text-lg font-bold tracking-wide uppercase">
                    {periodToEdit ? 'Editar Período' : 'Nuevo Período'}
                  </h3>
                  <p className="text-xs text-slate-400 font-medium">
                    {periodToEdit
                      ? `Modificar fechas o datos de ${periodToEdit.name}`
                      : 'Registrar un nuevo período de liquidación'}
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

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Ciclo de Nómina */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">
                  Ciclo de Nómina *
                </label>
                <div className="relative">
                  <RefreshCw className="absolute left-3.5 top-3 text-slate-400" size={16} />
                  <select
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium outline-none focus:border-yellow-500 focus:bg-white transition-all"
                    value={formData.payroll_cycle_id}
                    onChange={(e) => setFormData({ ...formData, payroll_cycle_id: e.target.value })}
                    disabled={Boolean(periodToEdit)}
                    required
                  >
                    <option value="">Seleccione un ciclo de nómina</option>
                    {cycles.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name || c.nombre} ({c.type || c.periodicity || 'Ciclo'})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Nombre del Período */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">
                  Nombre del Período *
                </label>
                <div className="relative">
                  <FileText className="absolute left-3.5 top-3 text-slate-400" size={16} />
                  <input
                    type="text"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium outline-none focus:border-yellow-500 focus:bg-white transition-all"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ej: Quincena 1 - Octubre 2026"
                    required
                  />
                </div>
              </div>

              {/* Fechas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">
                    Fecha Inicio *
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3.5 top-3 text-slate-400" size={16} />
                    <input
                      type="date"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium outline-none focus:border-yellow-500 focus:bg-white transition-all"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">
                    Fecha Fin *
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3.5 top-3 text-slate-400" size={16} />
                    <input
                      type="date"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium outline-none focus:border-yellow-500 focus:bg-white transition-all"
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">
                    Fecha de Pago *
                  </label>
                  <div className="relative">
                    <Clock className="absolute left-3.5 top-3 text-slate-400" size={16} />
                    <input
                      type="date"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium outline-none focus:border-yellow-500 focus:bg-white transition-all"
                      value={formData.payment_date}
                      onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">
                    Estado del Período
                  </label>
                  <select
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:border-yellow-500 focus:bg-white transition-all uppercase"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="open">Abierto (open)</option>
                    <option value="closed">Cerrado (closed)</option>
                    <option value="cancelled">Cancelado (cancelled)</option>
                  </select>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-4 flex flex-col-reverse sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3.5 rounded-2xl border border-slate-200 text-slate-600 font-bold text-xs uppercase hover:bg-slate-50 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3.5 rounded-2xl bg-zinc-900 text-white font-bold text-xs hover:bg-black transition-all flex items-center justify-center gap-2 shadow-xl shadow-zinc-200 uppercase"
                >
                  {loading ? (
                    'Procesando...'
                  ) : (
                    <>
                      <CheckCircle2 size={16} />
                      <span>{periodToEdit ? 'Actualizar' : 'Crear Período'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
