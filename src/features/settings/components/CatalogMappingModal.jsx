import React, { useState, useEffect } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { X, Layers, Code2, Tag, AlignLeft, CheckSquare, Server } from 'lucide-react';
import { catalogMappingsService } from '../services/catalogMappingsService';
import { useToast } from '../../../context/ToastContext';

const CATEGORIAS_PERMITIDAS = [
  { value: 'tipo_documento', label: 'Tipo de Documento (Identificación)' },
  { value: 'medio_pago', label: 'Medio de Pago' },
  { value: 'unidad_medida', label: 'Unidad de Medida' },
  { value: 'impuesto', label: 'Impuesto / Retención' }
];

export const CatalogMappingModal = ({ isOpen, onClose, onSave, mapeoToEdit = null }) => {
  const [formData, setFormData] = useState({
    proveedor: 'MATIAS',
    categoria: 'tipo_documento',
    codigo_interno: '',
    codigo_externo: '',
    codigo_externo_secundario: '',
    descripcion: '',
    is_active: true
  });
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (isOpen) {
      if (mapeoToEdit) {
        setFormData({
          proveedor: mapeoToEdit.proveedor || 'MATIAS',
          categoria: mapeoToEdit.categoria || 'tipo_documento',
          codigo_interno: mapeoToEdit.codigo_interno || '',
          codigo_externo: mapeoToEdit.codigo_externo || '',
          codigo_externo_secundario: mapeoToEdit.codigo_externo_secundario || '',
          descripcion: mapeoToEdit.descripcion || '',
          is_active: mapeoToEdit.is_active !== undefined ? !!mapeoToEdit.is_active : true
        });
      } else {
        setFormData({
          proveedor: 'MATIAS',
          categoria: 'tipo_documento',
          codigo_interno: '',
          codigo_externo: '',
          codigo_externo_secundario: '',
          descripcion: '',
          is_active: true
        });
      }
    }
  }, [isOpen, mapeoToEdit]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        proveedor: formData.proveedor.trim().toUpperCase(),
        categoria: formData.categoria,
        codigo_interno: formData.codigo_interno.trim(),
        codigo_externo: formData.codigo_externo.trim(),
        codigo_externo_secundario: formData.codigo_externo_secundario.trim() || null,
        descripcion: formData.descripcion.trim() || null,
        is_active: formData.is_active
      };

      const result = mapeoToEdit
        ? await catalogMappingsService.updateMapeo(mapeoToEdit.id, payload)
        : await catalogMappingsService.createMapeo(payload);

      if (result.status) {
        showToast(result.message || "Mapeo guardado correctamente", "success");
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
            className="relative bg-white w-full h-full md:h-auto md:max-w-lg md:rounded-3xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-5 md:p-6 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-yellow-500/10 flex items-center justify-center text-yellow-600 font-bold">
                  <Layers size={20} />
                </div>
                <div>
                  <h3 className="font-black text-slate-800 text-xs md:text-sm uppercase tracking-wider">
                    {mapeoToEdit ? 'Editar Mapeo de Catálogo' : 'Nuevo Mapeo de Catálogo'}
                  </h3>
                  <p className="text-[10px] text-slate-500 italic">Equivalencia entre ERP y Proveedor Fiscal</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400">
                <X size={20} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-5 md:p-6 space-y-4 overflow-y-auto max-h-[80vh] custom-scrollbar">
              
              {/* Grid Proveedor y Categoría */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Proveedor Técnico</label>
                  <div className="relative">
                    <Server className="absolute left-3.5 top-3 text-slate-400" size={16} />
                    <input 
                      type="text" 
                      required
                      value={formData.proveedor} 
                      onChange={e => setFormData({ ...formData, proveedor: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold uppercase focus:border-yellow-500 transition-all outline-none"
                      placeholder="MATIAS"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Categoría Fiscal</label>
                  <div className="relative">
                    <Tag className="absolute left-3.5 top-3 text-slate-400" size={16} />
                    <select 
                      required 
                      value={formData.categoria}
                      onChange={e => setFormData({ ...formData, categoria: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold focus:border-yellow-500 transition-all outline-none appearance-none"
                    >
                      {CATEGORIAS_PERMITIDAS.map(cat => (
                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Grid Código Interno y Externo */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">
                    Código Interno (ERP) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Code2 className="absolute left-3.5 top-3 text-slate-400" size={16} />
                    <input 
                      type="text" 
                      required 
                      value={formData.codigo_interno}
                      onChange={e => setFormData({ ...formData, codigo_interno: e.target.value })}
                      placeholder="Ej: CC, 01, UND, IVA"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold focus:border-yellow-500 transition-all outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">
                    Código Externo (DIAN / PAC) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Code2 className="absolute left-3.5 top-3 text-yellow-600" size={16} />
                    <input 
                      type="text" 
                      required 
                      value={formData.codigo_externo}
                      onChange={e => setFormData({ ...formData, codigo_externo: e.target.value })}
                      placeholder="Ej: 13, 10, 94, 01"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold focus:border-yellow-500 transition-all outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Código Externo Secundario */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">
                  Código Externo Secundario (Opcional)
                </label>
                <div className="relative">
                  <Code2 className="absolute left-3.5 top-3 text-slate-400" size={16} />
                  <input 
                    type="text" 
                    value={formData.codigo_externo_secundario}
                    onChange={e => setFormData({ ...formData, codigo_externo_secundario: e.target.value })}
                    placeholder="Código secundario o complementario"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold focus:border-yellow-500 transition-all outline-none"
                  />
                </div>
              </div>

              {/* Descripción */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Descripción</label>
                <div className="relative">
                  <AlignLeft className="absolute left-3.5 top-3 text-slate-400" size={16} />
                  <textarea 
                    value={formData.descripcion}
                    onChange={e => setFormData({ ...formData, descripcion: e.target.value })}
                    placeholder="Detalle o uso de este mapeo de catálogo..."
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs focus:border-yellow-500 transition-all outline-none min-h-[80px] resize-none"
                  />
                </div>
              </div>

              {/* Checkbox Estado */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckSquare size={18} className="text-yellow-600" />
                  <div>
                    <p className="text-xs font-bold text-slate-800 uppercase">Mapeo Activo</p>
                    <p className="text-[10px] text-slate-500">Disponible para ser utilizado en mappers de facturación.</p>
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
                  {loading ? "Guardando..." : (mapeoToEdit ? "Actualizar Mapeo" : "Crear Mapeo")}
                </button>
              </div>

            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
