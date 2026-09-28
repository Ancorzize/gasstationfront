import React, { useState, useEffect } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Smartphone, MapPin, Contact2, Mail, Globe, Shield, Hash } from 'lucide-react';
import { clientService } from '../services/clientService';
import { companyService } from '../../settings/services/companyService';
import { useToast } from '../../../context/ToastContext';

export const ClientModal = ({ isOpen, onClose, onSave, clientToEdit = null }) => {
  const [formData, setFormData] = useState({ 
    nombre: '', 
    apellidos: '', 
    documento: '', 
    telefono_uno: '',  
    telefono_dos: '', 
    email: '', 
    direccion: '',
    tipo_persona: '',
    tipo_documento_id: '',
    tipo_organization_id: '',
    tax_regime_id: '',
    tax_level_id: '',
    codigo_postal: '',
    pais_id: '',
    departamento_id: '',
    ciudad_id: '',
  });
  const [loading, setLoading] = useState(false);
  const [countries, setCountries] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [cities, setCities] = useState([]);
  const { showToast } = useToast();

  useEffect(() => {
    if (isOpen) {
      if (clientToEdit) {
        const initialForm = {
          nombre: clientToEdit.nombre || '',
          apellidos: clientToEdit.apellidos || '',
          documento: clientToEdit.documento || '',
          telefono_uno: clientToEdit.telefono_uno || '',
          telefono_dos: clientToEdit.telefono_dos || '',
          email: clientToEdit.email || '',
          direccion: clientToEdit.direccion || '',
          tipo_persona: clientToEdit.tipo_persona !== null && clientToEdit.tipo_persona !== undefined ? String(clientToEdit.tipo_persona) : '',
          tipo_documento_id: clientToEdit.tipo_documento_id !== null && clientToEdit.tipo_documento_id !== undefined ? String(clientToEdit.tipo_documento_id) : '',
          tipo_organization_id: clientToEdit.tipo_organization_id !== null && clientToEdit.tipo_organization_id !== undefined ? String(clientToEdit.tipo_organization_id) : '',
          tax_regime_id: clientToEdit.tax_regime_id !== null && clientToEdit.tax_regime_id !== undefined ? String(clientToEdit.tax_regime_id) : '',
          tax_level_id: clientToEdit.tax_level_id !== null && clientToEdit.tax_level_id !== undefined ? String(clientToEdit.tax_level_id) : '',
          codigo_postal: clientToEdit.codigo_postal || '',
          pais_id: clientToEdit.pais_id !== null && clientToEdit.pais_id !== undefined ? String(clientToEdit.pais_id) : '',
          departamento_id: '',
          ciudad_id: clientToEdit.ciudad_id !== null && clientToEdit.ciudad_id !== undefined ? String(clientToEdit.ciudad_id) : '',
        };
        setFormData(initialForm);
        loadLocationsForEdit(initialForm.pais_id, initialForm.ciudad_id);
      } else {
        setFormData({ 
          nombre: '', apellidos: '', documento: '', telefono_uno: '', telefono_dos: '', email: '', direccion: '',
          tipo_persona: '', tipo_documento_id: '', tipo_organization_id: '', tax_regime_id: '', tax_level_id: '',
          codigo_postal: '', pais_id: '', departamento_id: '', ciudad_id: ''
        });
        setDepartments([]);
        setCities([]);
        loadCountries();
      }
    }
  }, [isOpen, clientToEdit]);

  const loadCountries = async () => {
    try {
      const res = await companyService.getCountries();
      setCountries(res.data || []);
    } catch {
      // Ignore
    }
  };

  const loadLocationsForEdit = async (paisId, ciudadId) => {
    try {
      const resPaises = await companyService.getCountries();
      const paisesList = resPaises.data || [];
      setCountries(paisesList);

      if (paisId) {
        const resDepts = await companyService.getDepartments(paisId);
        const deptsList = resDepts.data || [];
        setDepartments(deptsList);

        if (ciudadId) {
          for (const dept of deptsList) {
            const resCities = await companyService.getCities(dept.id);
            const citiesList = resCities.data || [];
            if (citiesList.some(c => String(c.id) === String(ciudadId))) {
              setCities(citiesList);
              setFormData(prev => ({ ...prev, departamento_id: String(dept.id) }));
              break;
            }
          }
        }
      }
    } catch {
      // Ignore
    }
  };

  const handleCountryChange = async (e) => {
    const val = e.target.value;
    setDepartments([]);
    setCities([]);
    setFormData(prev => ({ ...prev, pais_id: val, departamento_id: '', ciudad_id: '' }));
    if (val) {
      try {
        const res = await companyService.getDepartments(val);
        setDepartments(res.data || []);
      } catch {
        showToast("Error al cargar departamentos", "error");
      }
    }
  };

  const handleDepartmentChange = async (e) => {
    const val = e.target.value;
    setCities([]);
    setFormData(prev => ({ ...prev, departamento_id: val, ciudad_id: '' }));
    if (val) {
      try {
        const res = await companyService.getCities(val);
        setCities(res.data || []);
      } catch {
        showToast("Error al cargar ciudades", "error");
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const payload = { ...formData };
    delete payload.departamento_id;

    const nullableFields = [
      'tipo_persona', 'tipo_documento_id', 'tipo_organization_id',
      'tax_regime_id', 'tax_level_id', 'codigo_postal', 'ciudad_id', 'pais_id',
      'telefono_uno', 'telefono_dos', 'email', 'direccion'
    ];

    nullableFields.forEach(field => {
      if (payload[field] === '' || payload[field] === undefined) {
        payload[field] = null;
      }
    });

    try {
      const result = clientToEdit 
        ? await clientService.updateClient(clientToEdit.id, payload)
        : await clientService.createClient(payload);

      if (result.status) {
        showToast(result.message, "success");
        if (onSave) onSave(result.data);
        onClose();
      } else {
        showToast(result.message || "Error al procesar cliente", "error");
      }
    } catch {
      showToast("Error de conexión", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 md:p-4">
          {/* Overlay */}
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose} className="absolute inset-0 bg-zinc-950/70 backdrop-blur-sm" 
          />
          
          {/* Contenedor del Modal */}
          <motion.div 
            initial={{ y: "100%", opacity: 0 }} 
            animate={{ y: 0, opacity: 1 }} 
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="relative bg-white w-full h-full md:h-auto md:max-w-2xl md:max-h-[90vh] md:rounded-3xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header Fijo */}
            <div className="p-5 md:p-6 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-yellow-500/10 flex items-center justify-center text-yellow-600">
                  <Contact2 size={18} />
                </div>
                <h3 className="font-black text-slate-800 text-xs md:text-sm uppercase tracking-wider">
                  {clientToEdit ? 'Editar Cliente' : 'Nuevo Registro'}
                </h3>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
                <X size={20} />
              </button>
            </div>

            {/* Formulario con Scroll */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 md:p-6 space-y-6 custom-scrollbar-light">
              
              {/* BLOQUE 1: DATOS GENERALES */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-1 border-b border-slate-100 text-slate-400">
                  <User size={14} />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Datos Generales</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Nombres</label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-3 text-slate-400" size={16} />
                      <input required className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:border-yellow-500 focus:bg-white transition-all"
                        value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} placeholder="Ej: Luis" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Apellidos</label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-3 text-slate-400" size={16} />
                      <input required className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:border-yellow-500 focus:bg-white transition-all"
                        value={formData.apellidos} onChange={e => setFormData({...formData, apellidos: e.target.value})} placeholder="Ej: Córdoba" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Tipo de Persona</label>
                    <select name="tipo_persona" value={formData.tipo_persona} onChange={e => setFormData({...formData, tipo_persona: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:border-yellow-500 transition-all">
                      <option value="">Seleccione...</option>
                      <option value="1">Persona Jurídica</option>
                      <option value="2">Persona Natural</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Tipo de Documento Fiscal</label>
                    <select name="tipo_documento_id" value={formData.tipo_documento_id} onChange={e => setFormData({...formData, tipo_documento_id: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:border-yellow-500 transition-all">
                      <option value="">Seleccione...</option>
                      <option value="13">13 - Cédula de Ciudadanía</option>
                      <option value="31">31 - NIT (Número Identificación Tributaria)</option>
                      <option value="22">22 - Cédula de Extranjería</option>
                      <option value="42">42 - Documento Identificación Extranjero</option>
                      <option value="50">50 - NIT de otro país</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Documento / NIT</label>
                    <div className="relative">
                      <Contact2 className="absolute left-3.5 top-3 text-slate-400" size={16} />
                      <input required className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:border-yellow-500 focus:bg-white transition-all"
                        value={formData.documento} onChange={e => setFormData({...formData, documento: e.target.value})} placeholder="C.C o NIT" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Correo Electrónico</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-3 text-slate-400" size={16} />
                      <input type="email" className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:border-yellow-500 focus:bg-white transition-all"
                        value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="usuario@correo.com" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Teléfono Principal</label>
                    <div className="relative">
                      <Smartphone className="absolute left-3.5 top-3 text-slate-400" size={16} />
                      <input className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:border-yellow-500 focus:bg-white transition-all"
                        value={formData.telefono_uno} onChange={e => setFormData({...formData, telefono_uno: e.target.value})} placeholder="300..." />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Teléfono Secundario</label>
                    <div className="relative">
                      <Smartphone className="absolute left-3.5 top-3 text-slate-400" size={16} />
                      <input className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:border-yellow-500 focus:bg-white transition-all"
                        value={formData.telefono_dos} onChange={e => setFormData({...formData, telefono_dos: e.target.value})} />
                    </div>
                  </div>
                </div>
              </div>

              {/* BLOQUE 2: DATOS FISCALES */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-1 border-b border-slate-100 text-slate-400">
                  <Shield size={14} />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Datos Fiscales (DIAN)</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Tipo de Organización</label>
                    <select name="tipo_organization_id" value={formData.tipo_organization_id} onChange={e => setFormData({...formData, tipo_organization_id: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:border-yellow-500 transition-all">
                      <option value="">Seleccione...</option>
                      <option value="1">1 - Persona Jurídica</option>
                      <option value="2">2 - Persona Natural</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Régimen Tributario</label>
                    <select name="tax_regime_id" value={formData.tax_regime_id} onChange={e => setFormData({...formData, tax_regime_id: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:border-yellow-500 transition-all">
                      <option value="">Seleccione...</option>
                      <option value="1">1 - Responsable de IVA (48)</option>
                      <option value="2">2 - No Responsable de IVA (49)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Nivel / Responsabilidad Fiscal</label>
                    <select name="tax_level_id" value={formData.tax_level_id} onChange={e => setFormData({...formData, tax_level_id: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:border-yellow-500 transition-all">
                      <option value="">Seleccione...</option>
                      <option value="1">1 - O-13 Gran Contribuyente</option>
                      <option value="2">2 - O-15 Autorretenedor</option>
                      <option value="3">3 - O-23 Agente Retención IVA</option>
                      <option value="4">4 - O-47 Régimen Simple Tributación</option>
                      <option value="5">5 - R-99-PN No Responsable / Persona Natural</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Código Postal</label>
                    <div className="relative">
                      <Hash className="absolute left-3.5 top-3 text-slate-400" size={16} />
                      <input className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:border-yellow-500 focus:bg-white transition-all"
                        value={formData.codigo_postal} onChange={e => setFormData({...formData, codigo_postal: e.target.value})} placeholder="Ej: 661002" maxLength={10} />
                    </div>
                  </div>
                </div>
              </div>

              {/* BLOQUE 3: UBICACIÓN */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-1 border-b border-slate-100 text-slate-400">
                  <Globe size={14} />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Ubicación y Dirección</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">País</label>
                    <select name="pais_id" value={formData.pais_id} onChange={handleCountryChange} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:border-yellow-500 transition-all">
                      <option value="">Seleccione...</option>
                      {countries.map(c => (
                        <option key={c.id} value={c.id}>{c.nombre}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Departamento</label>
                    <select name="departamento_id" value={formData.departamento_id} onChange={handleDepartmentChange} disabled={!formData.pais_id} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:border-yellow-500 transition-all disabled:opacity-50">
                      <option value="">Seleccione...</option>
                      {departments.map(d => (
                        <option key={d.id} value={d.id}>{d.nombre}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Ciudad</label>
                    <select name="ciudad_id" value={formData.ciudad_id} onChange={e => setFormData({...formData, ciudad_id: e.target.value})} disabled={!formData.departamento_id} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:border-yellow-500 transition-all disabled:opacity-50">
                      <option value="">Seleccione...</option>
                      {cities.map(c => (
                        <option key={c.id} value={c.id}>{c.nombre}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Dirección de Residencia/Empresa</label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-3 text-slate-400" size={16} />
                    <input className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:border-yellow-500 focus:bg-white transition-all"
                      value={formData.direccion} onChange={e => setFormData({...formData, direccion: e.target.value})} placeholder="Calle, Barrio..." />
                  </div>
                </div>
              </div>

              {/* Botones de Acción (Fijos al final en móvil) */}
              <div className="pt-6 pb-2 md:pb-0 flex flex-col-reverse md:flex-row gap-3">
                <button type="button" onClick={onClose} className="flex-1 py-3.5 rounded-2xl border border-slate-200 text-slate-600 font-bold text-xs uppercase hover:bg-slate-50 transition-all">
                  Cancelar
                </button>
                <button type="submit" disabled={loading} className="flex-1 py-3.5 rounded-2xl bg-zinc-900 text-white font-bold text-xs hover:bg-black transition-all flex items-center justify-center gap-2 shadow-xl shadow-zinc-200 uppercase">
                  {loading ? "Procesando..." : (clientToEdit ? "Actualizar Datos" : "Registrar Cliente")}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};