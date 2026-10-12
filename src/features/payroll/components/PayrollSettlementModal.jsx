import React, { useState, useEffect, useCallback } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Calendar, CheckCircle2, Calculator } from 'lucide-react';
import { payrollService } from '../services/payrollService';
import { useToast } from '../../../context/ToastContext';

export const PayrollSettlementModal = ({ isOpen, onClose, onSave, periodId, periodName }) => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);

  const [formData, setFormData] = useState({
    employee_id: '',
    days_worked: 15,
  });

  const loadActiveEmployees = useCallback(async () => {
    setLoadingEmployees(true);
    try {
      const res = await payrollService.getEmployees({ is_active: '1', per_page: 100 });
      if (res?.status) {
        const list = res.data?.items || (Array.isArray(res.data) ? res.data : []);
        setEmployees(list);
        if (list.length > 0) {
          setFormData((prev) => ({ ...prev, employee_id: String(list[0].id) }));
        }
      } else {
        showToast('Error al cargar la lista de empleados activos.', 'error');
      }
    } catch {
      showToast('Error de conexión al cargar empleados.', 'error');
    } finally {
      setLoadingEmployees(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        employee_id: '',
        days_worked: 15,
      });
      loadActiveEmployees();
    }
  }, [isOpen, loadActiveEmployees]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!periodId) {
      showToast('Debe seleccionar un período de nómina válido.', 'error');
      return;
    }
    if (!formData.employee_id) {
      showToast('Debe seleccionar un empleado.', 'error');
      return;
    }
    const days = Number(formData.days_worked);
    if (isNaN(days) || !Number.isInteger(days) || days < 1) {
      showToast('Los días trabajados deben ser un número entero mayor o igual a 1.', 'error');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        employee_id: Number(formData.employee_id),
        days_worked: days,
      };

      const res = await payrollService.createSettlement(periodId, payload);

      if (res?.status) {
        showToast('Liquidación de nómina creada correctamente.', 'success');
        onSave();
        onClose();
      } else {
        showToast(res?.message || 'Error al generar la liquidación.', 'error');
      }
    } catch {
      showToast('Ocurrió un error inesperado al procesar la liquidación.', 'error');
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
                  <Calculator size={22} />
                </div>
                <div>
                  <h3 className="text-base md:text-lg font-bold tracking-wide uppercase">
                    Nueva Liquidación
                  </h3>
                  <p className="text-xs text-slate-400 font-medium">
                    {periodName ? `Período: ${periodName}` : 'Generar liquidación para un empleado'}
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
              {/* Empleado Selector */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">
                  Empleado *
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3 text-slate-400" size={16} />
                  <select
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium outline-none focus:border-yellow-500 focus:bg-white transition-all"
                    value={formData.employee_id}
                    onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                    disabled={loadingEmployees}
                    required
                  >
                    <option value="">
                      {loadingEmployees ? 'Cargando empleados...' : 'Seleccione un empleado activo'}
                    </option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.full_name || `${emp.first_name} ${emp.first_surname}`} — Cod: {emp.worker_code} (Doc: {emp.document_number})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Días Trabajados */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">
                  Días Trabajados *
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3.5 top-3 text-slate-400" size={16} />
                  <input
                    type="number"
                    min="1"
                    step="1"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:border-yellow-500 focus:bg-white transition-all"
                    value={formData.days_worked}
                    onChange={(e) => setFormData({ ...formData, days_worked: e.target.value })}
                    placeholder="Ej: 15 o 30"
                    required
                  />
                </div>
                <p className="text-[10px] text-slate-400 ml-1">
                  Ingrese el número total de días trabajados en el período (mínimo 1).
                </p>
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
                      <span>Generar Liquidación</span>
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
