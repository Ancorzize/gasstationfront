import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Layers, DollarSign, Loader2, Calendar, FileText, AlertCircle } from 'lucide-react';
import { purchaseService } from '../services/purchaseService';
import { supplierService } from '../../suppliers/services/supplierService';
import { useToast } from '../../../context/ToastContext';
import { usePermissions } from '../../../hooks/usePermissions';

export const InitialBalanceModal = ({ isOpen, onClose, onSave, preselectedSupplierId = null }) => {
  const { showToast } = useToast();
  const { hasPermission } = usePermissions();
  const canCreateBalance = hasPermission('crear_saldos_iniciales_cartera');
  const [loading, setLoading] = useState(false);
  const [loadingProveedores, setLoadingProveedores] = useState(false);
  const [proveedores, setProveedores] = useState([]);

  const [formData, setFormData] = useState({
    proveedor_id: preselectedSupplierId ? String(preselectedSupplierId) : '',
    numero_documento: '',
    fecha_documento: new Date().toISOString().split('T')[0],
    valor: '',
    observacion: '',
  });

  const [valorDisplay, setValorDisplay] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadProveedores();
      setFormData({
        proveedor_id: preselectedSupplierId ? String(preselectedSupplierId) : '',
        numero_documento: '',
        fecha_documento: new Date().toISOString().split('T')[0],
        valor: '',
        observacion: '',
      });
      setValorDisplay('');
    }
  }, [isOpen, preselectedSupplierId]);

  const loadProveedores = async () => {
    setLoadingProveedores(true);
    try {
      const res = await supplierService.getSuppliers({ per_page: 1000 });
      if (res.status && res.data && Array.isArray(res.data.items)) {
        setProveedores(res.data.items);
      } else if (Array.isArray(res)) {
        setProveedores(res);
      }
    } catch (e) {
      showToast('Error al cargar proveedores', 'error');
    } finally {
      setLoadingProveedores(false);
    }
  };

  const handleValorChange = (e) => {
    let value = e.target.value;
    value = value.replace(/[^0-9.,]/g, '');

    const parts = value.split(',');
    if (parts.length > 2) {
      value = parts[0] + ',' + parts.slice(1).join('');
    }

    let cleanVal = value.replace(/\./g, '');

    if (cleanVal.includes(',')) {
      const [integerPart, decimalPart] = cleanVal.split(',');
      const formattedInteger = integerPart ? Number(integerPart).toLocaleString('es-CO') : '';
      value = formattedInteger !== '' ? `${formattedInteger},${decimalPart}` : `,${decimalPart}`;

      const numericVal = parseFloat(`${integerPart || 0}.${decimalPart}`);
      setFormData((prev) => ({ ...prev, valor: isNaN(numericVal) ? '' : numericVal }));
    } else {
      const formattedInteger = cleanVal ? Number(cleanVal).toLocaleString('es-CO') : '';
      value = formattedInteger;

      const numericVal = parseFloat(cleanVal);
      setFormData((prev) => ({ ...prev, valor: isNaN(numericVal) ? '' : numericVal }));
    }

    setValorDisplay(value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!canCreateBalance) {
      return showToast('No tienes permisos para registrar saldos iniciales de cartera', 'error');
    }

    if (!formData.proveedor_id) {
      return showToast('Debe seleccionar un proveedor', 'error');
    }

    if (!formData.fecha_documento) {
      return showToast('Debe ingresar la fecha del documento', 'error');
    }

    if (!formData.valor || parseFloat(formData.valor) <= 0) {
      return showToast('Debe ingresar un valor mayor a cero', 'error');
    }

    setLoading(true);
    try {
      const res = await purchaseService.createInitialBalance(formData);
      if (res && res.status) {
        showToast('Saldo inicial registrado correctamente', 'success');
        if (onSave) onSave();
        onClose();
      } else {
        showToast(res.message || 'Error al registrar el saldo inicial', 'error');
      }
    } catch (e) {
      showToast('Error de conexión al registrar el saldo inicial', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm"
          />

          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Layers size={20} />
                </div>
                <div>
                  <h3 className="font-black text-slate-800 text-sm uppercase">Saldo Inicial de Proveedor</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Deuda histórica de apertura</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Form */}
            <div className="p-6 overflow-y-auto flex-1">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="p-3 bg-amber-50 rounded-2xl border border-amber-100 flex items-start gap-2.5">
                  <AlertCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-[10px] font-bold text-amber-800 leading-tight">
                    Este registro representa una deuda previa a la operación en el sistema. <strong>No genera egresos ni afecta la caja.</strong>
                  </p>
                </div>

                {/* Proveedor */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Proveedor</label>
                  <select
                    required
                    className="w-full px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold uppercase outline-none focus:border-zinc-900"
                    value={formData.proveedor_id}
                    onChange={(e) => setFormData({ ...formData, proveedor_id: e.target.value })}
                    disabled={loadingProveedores || Boolean(preselectedSupplierId)}
                  >
                    <option value="">Seleccione un proveedor...</option>
                    {proveedores.map((prov) => (
                      <option key={prov.id} value={prov.id}>
                        {prov.nombre} {prov.nit ? `- NIT: ${prov.nit}` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Número de documento / Consecutivo */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">
                    Número de Documento / Factura <span className="text-slate-400 font-normal lowercase">(opcional)</span>
                  </label>
                  <div className="relative">
                    <FileText className="absolute left-4 top-3.5 text-slate-300" size={16} />
                    <input
                      type="text"
                      className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold uppercase outline-none focus:border-zinc-900 placeholder:normal-case placeholder:font-normal"
                      value={formData.numero_documento}
                      onChange={(e) => setFormData({ ...formData, numero_documento: e.target.value })}
                      placeholder="Ej: FAC-10294 (si se omite se generará SIP-XXXXXX)"
                    />
                  </div>
                </div>

                {/* Valor y Fecha */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Valor de la Deuda</label>
                    <div className="relative">
                      <DollarSign className="absolute left-4 top-3.5 text-slate-300" size={16} />
                      <input
                        required
                        type="text"
                        inputMode="decimal"
                        className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-black outline-none focus:border-zinc-900"
                        value={valorDisplay}
                        onChange={handleValorChange}
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Fecha del Documento</label>
                    <div className="relative">
                      <input
                        type="date"
                        required
                        className="w-full px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold outline-none focus:border-zinc-900"
                        value={formData.fecha_documento}
                        onChange={(e) => setFormData({ ...formData, fecha_documento: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* Observación */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Observación (Opcional)</label>
                  <textarea
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs outline-none focus:border-zinc-900 h-20 resize-none"
                    value={formData.observacion}
                    onChange={(e) => setFormData({ ...formData, observacion: e.target.value })}
                    placeholder="Detalles sobre el origen del saldo inicial..."
                  />
                </div>

                {canCreateBalance && (
                  <button
                    type="submit"
                    disabled={loading || loadingProveedores}
                    className="w-full py-4 bg-zinc-900 text-white rounded-2xl font-black text-xs uppercase hover:bg-black transition-all flex items-center justify-center gap-2 mt-2 shadow-lg disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="animate-spin" size={18} /> : 'Registrar Saldo Inicial'}
                  </button>
                )}
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
