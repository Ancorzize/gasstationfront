import React, { useEffect, useState } from 'react';
import { 
  Building2, MapPin, Receipt, Globe, 
  Save, Loader2, Image as ImageIcon, Percent 
} from 'lucide-react';
import { companyService } from '../services/companyService';
import { useToast } from '../../../context/ToastContext';

export const CompanySettingsPage = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const { showToast } = useToast();

  // Estados para datos y catálogos
  const [formData, setFormData] = useState({
    nombre_empresa: '', nombre_comercial: '', nit: '', dv: '',
    email: '', telefono: '', direccion: '', logo_url: '',
    pais_id: '', departamento_id: '', ciudad_id: '',
    responsable_iva: false, regimen: '', porcentaje_iva: 0, maneja_iva_incluido: false,
    prefijo_factura: '', numero_resolucion: '', fecha_resolucion: '',
    rango_desde: 1, rango_hasta: 1000, fecha_vencimiento: '',
    moneda: 'COP', simbolo_moneda: '$', decimales: 0
  });

  const [countries, setCountries] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [cities, setCities] = useState([]);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [configRes, countriesRes] = await Promise.all([
        companyService.getConfig(),
        companyService.getCountries()
      ]);

      setCountries(countriesRes.data || []);

      if (configRes.data) {
        const config = configRes.data;
        setFormData(prev => ({ ...prev, ...config }));
        
        // Cargar cascada de ubicaciones si existen
        if (config.pais_id) loadDepartments(config.pais_id);
        if (config.departamento_id) loadCities(config.departamento_id);
      }
    } catch (error) {
      showToast("Error al cargar configuración", "error");
    } finally {
      setLoading(false);
    }
  };

  const loadDepartments = async (id) => {
    const res = await companyService.getDepartments(id);
    setDepartments(res.data || []);
  };

  const loadCities = async (id) => {
    const res = await companyService.getCities(id);
    setCities(res.data || []);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const val = type === 'checkbox' ? checked : value;
    
    setFormData(prev => ({ ...prev, [name]: val }));

    // Lógica de cascada
    if (name === 'pais_id') {
      setDepartments([]); setCities([]);
      setFormData(prev => ({ ...prev, pais_id: value, departamento_id: '', ciudad_id: '' }));
      if (value) loadDepartments(value);
    }
    if (name === 'departamento_id') {
      setCities([]);
      setFormData(prev => ({ ...prev, departamento_id: value, ciudad_id: '' }));
      if (value) loadCities(value);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (parseInt(formData.rango_hasta) < parseInt(formData.rango_desde)) {
      return showToast("El rango hasta no puede ser menor al rango desde", "error");
    }

    setSaving(true);
    try {
      const res = await companyService.updateConfig(formData);
      if (res.status) {
        showToast(res.message, "success");
      } else {
        showToast(res.message, "error");
      }
    } catch (error) {
      showToast("Error de conexión", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="p-20 flex flex-col items-center justify-center text-slate-400 gap-3">
      <Loader2 className="animate-spin" size={40} />
      <p className="text-xs font-black uppercase tracking-widest">Cargando parámetros del sistema...</p>
    </div>
  );

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase">Configuración de Empresa</h2>
          <p className="text-slate-500 text-sm">Define la identidad y parámetros legales de tu estación.</p>
        </div>
        <button 
          form="config-form"
          disabled={saving}
          className="bg-zinc-900 text-white px-8 py-3 rounded-2xl font-bold text-xs uppercase hover:bg-black transition-all flex items-center gap-2 shadow-xl disabled:opacity-50"
        >
          {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
          Guardar Cambios
        </button>
      </header>

      {/* Tabs de Navegación */}
      <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl w-fit">
        {[
          { id: 'general', label: 'General', icon: Building2 },
          { id: 'ubicacion', label: 'Ubicación', icon: MapPin },
          { id: 'impuestos', label: 'Impuestos', icon: Percent },
          { id: 'facturacion', label: 'Facturación DIAN', icon: Receipt },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all ${
              activeTab === tab.id ? 'bg-white text-zinc-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <tab.icon size={14} />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      <form id="config-form" onSubmit={handleSubmit} className="bg-white border border-slate-100 rounded-[2.5rem] shadow-sm overflow-hidden">
        <div className="p-6 md:p-10">
          
          {/* SECCIÓN GENERAL */}
          {activeTab === 'general' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Razón Social</label>
                  <input required name="nombre_empresa" value={formData.nombre_empresa} onChange={handleChange}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:border-yellow-500 outline-none transition-all" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Nombre Comercial</label>
                  <input name="nombre_comercial" value={formData.nombre_comercial} onChange={handleChange}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:border-yellow-500 outline-none transition-all" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">NIT / Identificación</label>
                  <div className="flex gap-2">
                    <input required name="nit" value={formData.nit} onChange={handleChange}
                      className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:border-yellow-500 outline-none transition-all" />
                    <input name="dv" value={formData.dv} onChange={handleChange} placeholder="DV"
                      className="w-16 px-2 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-center focus:border-yellow-500 outline-none transition-all" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Teléfono</label>
                  <input name="telefono" value={formData.telefono} onChange={handleChange}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:border-yellow-500 outline-none transition-all" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Email Corporativo</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:border-yellow-500 outline-none transition-all" />
              </div>
            </div>
          )}

          {/* SECCIÓN UBICACIÓN */}
          {activeTab === 'ubicacion' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">País</label>
                  <select name="pais_id" value={formData.pais_id} onChange={handleChange}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:border-yellow-500 outline-none transition-all">
                    <option value="">Seleccione...</option>
                    {countries.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Departamento</label>
                  <select name="departamento_id" value={formData.departamento_id} onChange={handleChange} disabled={!formData.pais_id}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:border-yellow-500 outline-none transition-all disabled:opacity-50">
                    <option value="">Seleccione...</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.nombre}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Ciudad</label>
                  <select name="ciudad_id" value={formData.ciudad_id} onChange={handleChange} disabled={!formData.departamento_id}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:border-yellow-500 outline-none transition-all disabled:opacity-50">
                    <option value="">Seleccione...</option>
                    {cities.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                  </select>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Dirección Física</label>
                <input name="direccion" value={formData.direccion} onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:border-yellow-500 outline-none transition-all" />
              </div>
            </div>
          )}

          {/* SECCIÓN IMPUESTOS */}
          {activeTab === 'impuestos' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 space-y-6">
              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <input type="checkbox" name="responsable_iva" id="iva_check" checked={formData.responsable_iva} onChange={handleChange}
                  className="w-5 h-5 accent-zinc-900" />
                <label htmlFor="iva_check" className="text-sm font-bold text-slate-700 uppercase">¿Es responsable de IVA?</label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Porcentaje IVA (%)</label>
                  <input type="number" name="porcentaje_iva" value={formData.porcentaje_iva} onChange={handleChange}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:border-yellow-500 outline-none transition-all" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Régimen</label>
                  <input name="regimen" value={formData.regimen} onChange={handleChange} placeholder="Ej: Común, Simplificado"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:border-yellow-500 outline-none transition-all" />
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <input type="checkbox" name="maneja_iva_incluido" id="iva_inc" checked={formData.maneja_iva_incluido} onChange={handleChange}
                  className="w-5 h-5 accent-zinc-900" />
                <label htmlFor="iva_inc" className="text-sm font-bold text-slate-700 uppercase">¿Los precios de venta incluyen IVA?</label>
              </div>
            </div>
          )}

          {/* SECCIÓN FACTURACIÓN DIAN */}
          {activeTab === 'facturacion' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Prefijo de Factura</label>
                  <input name="prefijo_factura" value={formData.prefijo_factura} onChange={handleChange} placeholder="Ej: FE"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:border-yellow-500 outline-none transition-all" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Número de Resolución</label>
                  <input name="numero_resolucion" value={formData.numero_resolucion} onChange={handleChange}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:border-yellow-500 outline-none transition-all" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Rango Desde</label>
                  <input type="number" name="rango_desde" value={formData.rango_desde} onChange={handleChange}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:border-yellow-500 outline-none transition-all" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Rango Hasta</label>
                  <input type="number" name="rango_hasta" value={formData.rango_hasta} onChange={handleChange}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:border-yellow-500 outline-none transition-all" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Fecha Resolución</label>
                  <input type="date" name="fecha_resolucion" value={formData.fecha_resolucion} onChange={handleChange}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:border-yellow-500 outline-none transition-all" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Fecha Vencimiento</label>
                  <input type="date" name="fecha_vencimiento" value={formData.fecha_vencimiento} onChange={handleChange}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:border-yellow-500 outline-none transition-all" />
                </div>
              </div>
            </div>
          )}

        </div>
      </form>
    </div>
  );
};