import React, { useState, useEffect } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { X, FileText, Code2, Calendar, Hash, Key, Server, CheckSquare, Building2, Tag } from 'lucide-react';
import { resolucionesFacturacionService } from '../services/resolucionesFacturacionService';
import { companyService } from '../services/companyService';
import { useToast } from '../../../context/ToastContext';

const TIPOS_DOCUMENTO = [
  { value: 'factura', label: 'Factura Electrónica de Venta' },
  { value: 'nota_credito', label: 'Nota Crédito Electrónica' },
  { value: 'nota_debito', label: 'Nota Débito Electrónica' },
  { value: 'documento_soporte', label: 'Documento Soporte Electrónico' },
  { value: 'pos_electronico', label: 'Tique POS Electrónico' }
];

const PROVEEDORES = [
  { value: 'matias', label: 'MATIAS API' }
];

const AMBIENTES = [
  { value: 'sandbox', label: 'Sandbox (Pruebas)' },
  { value: 'produccion', label: 'Producción' }
];

export const ResolucionFacturacionModal = ({ isOpen, onClose, onSave, resolucionToEdit = null }) => {
  const [formData, setFormData] = useState({
    configuracion_empresa_id: '',
    tipo_documento: 'factura',
    prefijo: '',
    numero_resolucion: '',
    fecha_resolucion: '',
    rango_desde: '',
    rango_hasta: '',
    consecutivo_actual: 1,
    fecha_vencimiento: '',
    clave_tecnica: '',
    proveedor: 'matias',
    ambiente: 'sandbox',
    is_active: true
  });
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    const initForm = async () => {
      let defaultCompanyId = '';
      try {
        const compRes = await companyService.getConfig();
        if (compRes?.data?.id) {
          defaultCompanyId = compRes.data.id;
        }
      } catch {
        // Ignorar si no se obtiene la empresa
      }

      if (resolucionToEdit) {
        setFormData({
          configuracion_empresa_id: resolucionToEdit.configuracion_empresa_id || defaultCompanyId,
          tipo_documento: resolucionToEdit.tipo_documento || 'factura',
          prefijo: resolucionToEdit.prefijo || '',
          numero_resolucion: resolucionToEdit.numero_resolucion || '',
          fecha_resolucion: resolucionToEdit.fecha_resolucion || '',
          rango_desde: resolucionToEdit.rango_desde !== null && resolucionToEdit.rango_desde !== undefined ? resolucionToEdit.rango_desde : '',
          rango_hasta: resolucionToEdit.rango_hasta !== null && resolucionToEdit.rango_hasta !== undefined ? resolucionToEdit.rango_hasta : '',
          consecutivo_actual: resolucionToEdit.consecutivo_actual !== null && resolucionToEdit.consecutivo_actual !== undefined ? resolucionToEdit.consecutivo_actual : 1,
          fecha_vencimiento: resolucionToEdit.fecha_vencimiento || '',
          clave_tecnica: resolucionToEdit.clave_tecnica || '',
          proveedor: resolucionToEdit.proveedor || 'matias',
          ambiente: resolucionToEdit.ambiente || 'sandbox',
          is_active: resolucionToEdit.is_active !== undefined ? !!resolucionToEdit.is_active : true
        });
      } else {
        setFormData({
          configuracion_empresa_id: defaultCompanyId,
          tipo_documento: 'factura',
          prefijo: '',
          numero_resolucion: '',
          fecha_resolucion: '',
          rango_desde: '',
          rango_hasta: '',
          consecutivo_actual: 1,
          fecha_vencimiento: '',
          clave_tecnica: '',
          proveedor: 'matias',
          ambiente: 'sandbox',
          is_active: true
        });
      }
    };

    if (isOpen) {
      initForm();
    }
  }, [isOpen, resolucionToEdit]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        configuracion_empresa_id: formData.configuracion_empresa_id ? parseInt(formData.configuracion_empresa_id, 10) : null,
        tipo_documento: formData.tipo_documento.trim(),
        prefijo: formData.prefijo.trim() || null,
        numero_resolucion: formData.numero_resolucion.trim(),
        fecha_resolucion: formData.fecha_resolucion || null,
        rango_desde: formData.rango_desde !== '' ? parseInt(formData.rango_desde, 10) : null,
        rango_hasta: formData.rango_hasta !== '' ? parseInt(formData.rango_hasta, 10) : null,
        consecutivo_actual: formData.consecutivo_actual !== '' ? parseInt(formData.consecutivo_actual, 10) : 1,
        fecha_vencimiento: formData.fecha_vencimiento || null,
        clave_tecnica: formData.clave_tecnica.trim() || null,
        proveedor: formData.proveedor.trim(),
        ambiente: formData.ambiente.trim(),
        is_active: formData.is_active
      };

      const result = resolucionToEdit
        ? await resolucionesFacturacionService.updateResolucion(resolucionToEdit.id, payload)
        : await resolucionesFacturacionService.createResolucion(payload);

      if (result.status) {
        showToast(result.message || "Resolución guardada correctamente", "success");
        onSave();
        onClose();
      } else {
        let msg = result.message || "Error al procesar la solicitud.";
        if (result.errors && typeof result.errors === 'object') {
          const firstErr = Object.values(result.errors)[0];
          if (Array.isArray(firstErr) && firstErr.length > 0) {
            msg = firstErr[0];
          }
        }
        showToast(msg, "error");
      }
    } catch {
      showToast("Error de conexión con el servidor", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 md:p-4">
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose} className="absolute inset-0 bg-zinc-950/70 backdrop-blur-sm" 
          />

          <motion.div 
            initial={{ y: "100%", opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: "100%", opacity: 0 }}
            className="relative bg-white w-full h-full md:h-auto md:max-w-2xl md:rounded-3xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-5 md:p-6 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-600 font-bold">
                  <FileText size={20} />
                </div>
                <div>
                  <h3 className="font-black text-slate-800 text-xs md:text-sm uppercase tracking-wider">
                    {resolucionToEdit ? 'Editar Resolución de Facturación' : 'Nueva Resolución de Facturación'}
                  </h3>
                  <p className="text-[10px] text-slate-500 italic">Parámetros DIAN / Proveedor de Facturación Electrónica</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400">
                <X size={20} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-5 md:p-6 space-y-4 overflow-y-auto max-h-[80vh] custom-scrollbar">
              
              {/* Tipo de Documento y Proveedor */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">
                    Tipo de Documento <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Tag className="absolute left-3.5 top-3 text-slate-400" size={16} />
                    <select 
                      required 
                      value={formData.tipo_documento}
                      onChange={e => setFormData({ ...formData, tipo_documento: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold focus:border-blue-500 transition-all outline-none appearance-none"
                    >
                      {TIPOS_DOCUMENTO.map(td => (
                        <option key={td.value} value={td.value}>{td.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Proveedor Técnico</label>
                  <div className="relative">
                    <Server className="absolute left-3.5 top-3 text-slate-400" size={16} />
                    <select 
                      value={formData.proveedor}
                      onChange={e => setFormData({ ...formData, proveedor: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold uppercase focus:border-blue-500 transition-all outline-none appearance-none"
                    >
                      {PROVEEDORES.map(p => (
                        <option key={p.value} value={p.value}>{p.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Número de Resolución y Prefijo */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">
                    Número de Resolución DIAN <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Hash className="absolute left-3.5 top-3 text-slate-400" size={16} />
                    <input 
                      type="text" 
                      required 
                      value={formData.numero_resolucion}
                      onChange={e => setFormData({ ...formData, numero_resolucion: e.target.value })}
                      placeholder="Ej: 18764074347312"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold focus:border-blue-500 transition-all outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Prefijo (Opcional)</label>
                  <div className="relative">
                    <Code2 className="absolute left-3.5 top-3 text-slate-400" size={16} />
                    <input 
                      type="text" 
                      value={formData.prefijo}
                      onChange={e => setFormData({ ...formData, prefijo: e.target.value })}
                      placeholder="Ej: SETP, NC, ND"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold uppercase focus:border-blue-500 transition-all outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Rangos y Consecutivo Actual */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Rango Desde</label>
                  <input 
                    type="number" 
                    min="0"
                    value={formData.rango_desde}
                    onChange={e => setFormData({ ...formData, rango_desde: e.target.value })}
                    placeholder="Ej: 1"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold focus:border-blue-500 transition-all outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Rango Hasta</label>
                  <input 
                    type="number" 
                    min="0"
                    value={formData.rango_hasta}
                    onChange={e => setFormData({ ...formData, rango_hasta: e.target.value })}
                    placeholder="Ej: 5000"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold focus:border-blue-500 transition-all outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">
                    Consecutivo Actual <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="number" 
                    required
                    min="0"
                    value={formData.consecutivo_actual}
                    onChange={e => setFormData({ ...formData, consecutivo_actual: e.target.value })}
                    placeholder="Ej: 1"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold focus:border-blue-500 transition-all outline-none"
                  />
                </div>
              </div>

              {/* Fechas: Resolución y Vencimiento */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Fecha de Resolución</label>
                  <div className="relative">
                    <Calendar className="absolute left-3.5 top-3 text-slate-400" size={16} />
                    <input 
                      type="date" 
                      value={formData.fecha_resolucion}
                      onChange={e => setFormData({ ...formData, fecha_resolucion: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold focus:border-blue-500 transition-all outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Fecha de Vencimiento</label>
                  <div className="relative">
                    <Calendar className="absolute left-3.5 top-3 text-slate-400" size={16} />
                    <input 
                      type="date" 
                      value={formData.fecha_vencimiento}
                      onChange={e => setFormData({ ...formData, fecha_vencimiento: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold focus:border-blue-500 transition-all outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Clave Técnica y Ambiente */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Clave Técnica DIAN (Opcional)</label>
                  <div className="relative">
                    <Key className="absolute left-3.5 top-3 text-slate-400" size={16} />
                    <input 
                      type="text" 
                      value={formData.clave_tecnica}
                      onChange={e => setFormData({ ...formData, clave_tecnica: e.target.value })}
                      placeholder="Clave técnica expedida por la DIAN"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold focus:border-blue-500 transition-all outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Ambiente</label>
                  <div className="relative">
                    <Server className="absolute left-3.5 top-3 text-slate-400" size={16} />
                    <select 
                      value={formData.ambiente}
                      onChange={e => setFormData({ ...formData, ambiente: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold focus:border-blue-500 transition-all outline-none appearance-none"
                    >
                      {AMBIENTES.map(a => (
                        <option key={a.value} value={a.value}>{a.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Checkbox Estado */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckSquare size={18} className="text-blue-600" />
                  <div>
                    <p className="text-xs font-bold text-slate-800 uppercase">Resolución Activa</p>
                    <p className="text-[10px] text-slate-500">Habilitada para la emisión de documentos electrónicamente.</p>
                  </div>
                </div>
                <input 
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-5 h-5 accent-zinc-900 cursor-pointer"
                />
              </div>

              {/* Buttons */}
              <div className="pt-3 flex flex-col-reverse md:flex-row gap-3">
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
                  className="flex-1 py-3.5 rounded-2xl bg-zinc-900 text-white font-bold text-xs uppercase hover:bg-black transition-all flex items-center justify-center gap-2 shadow-xl disabled:opacity-50"
                >
                  {loading ? "Guardando..." : (resolucionToEdit ? "Actualizar Resolución" : "Crear Resolución")}
                </button>
              </div>

            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
