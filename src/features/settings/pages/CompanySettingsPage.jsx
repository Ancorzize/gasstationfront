import React, { useEffect, useState, useRef } from 'react';
import { 
  Building2, MapPin, Receipt, Globe, 
  Save, Loader2, Image as ImageIcon, Percent, UploadCloud, X, Mail, Phone
} from 'lucide-react';
import { companyService } from '../services/companyService';
import { useToast } from '../../../context/ToastContext';

export const CompanySettingsPage = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const { showToast } = useToast();
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    nombre_empresa: '', nombre_comercial: '', nit: '', dv: '',
    email: '', telefono: '', direccion: '', logo_url: '',
    pais_id: '', departamento_id: '', ciudad_id: '',
    responsable_iva: false, regimen: '', porcentaje_iva: 0, maneja_iva_incluido: false,
    prefijo_factura: '', numero_resolucion: '', fecha_resolucion: '',
    rango_desde: 1, rango_hasta: 1000, fecha_vencimiento: '',
    moneda: 'COP', simbolo_moneda: '$', decimales: 0
  });

  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [countries, setCountries] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [cities, setCities] = useState([]);

  useEffect(() => { loadInitialData(); }, []);

  const loadInitialData = async () => {
    try {
      const [configRes, countriesRes] = await Promise.all([
        companyService.getConfig(),
        companyService.getCountries()
      ]);
      setCountries(countriesRes.data || []);
      if (configRes.data) {
        setFormData(prev => ({ ...prev, ...configRes.data }));
        if (configRes.data.logo_url) setPreviewUrl(configRes.data.logo_url);
        if (configRes.data.pais_id) loadDepartments(configRes.data.pais_id);
        if (configRes.data.departamento_id) loadCities(configRes.data.departamento_id);
      }
    } catch (error) { showToast("Error al cargar datos", "error"); }
    finally { setLoading(false); }
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

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setPreviewUrl(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      let currentLogoUrl = formData.logo_url;

      // PASO 1 y 2: Si hay un archivo nuevo, subirlo primero
      if (selectedFile) {
        const uploadRes = await companyService.uploadLogo(selectedFile);
        if (uploadRes.status) {
          currentLogoUrl = uploadRes.data.url;
        } else {
          showToast("Error al subir el logo", "error");
          setSaving(false);
          return;
        }
      }

      // PASO 3: Guardar toda la configuración mediante JSON
      const finalData = { ...formData, logo_url: currentLogoUrl };
      const res = await companyService.updateConfig(finalData);
      
      if (res.status) {
        showToast(res.message, "success");
        setFormData(finalData);
        setSelectedFile(null);
      } else {
        showToast(res.message, "error");
      }
    } catch (error) {
      showToast("Error al procesar la solicitud", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="p-20 flex flex-col items-center justify-center text-slate-400 gap-3">
      <Loader2 className="animate-spin" size={40} />
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">Configurando parámetros...</p>
    </div>
  );

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
      {/* Header, Tabs y Form igual que el código anterior... */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase">Configuración de Empresa</h2>
          <p className="text-slate-500 text-sm italic">Parámetros corporativos Las Granjas S.A.S.</p>
        </div>
        <button 
          form="config-form" disabled={saving}
          className="bg-zinc-900 text-white px-8 py-3 rounded-2xl font-bold text-xs uppercase hover:bg-black transition-all flex items-center gap-2 shadow-xl disabled:opacity-50"
        >
          {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
          {selectedFile ? "Subir y Guardar Todo" : "Guardar Cambios"}
        </button>
      </header>

      <div className="flex gap-1.5 p-1.5 bg-slate-100 rounded-2xl w-fit overflow-x-auto max-w-full">
        {[
          { id: 'general', label: 'General', icon: Building2 },
          { id: 'logo', label: 'Logo', icon: ImageIcon },
          { id: 'ubicacion', label: 'Ubicación', icon: Globe },
          { id: 'impuestos', label: 'Impuestos', icon: Percent },
          { id: 'facturacion', label: 'Facturación DIAN', icon: Receipt },
        ].map(tab => (
          <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all whitespace-nowrap ${
              activeTab === tab.id ? 'bg-white text-zinc-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <tab.icon size={14} />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      <form id="config-form" onSubmit={handleSubmit} className="bg-white border border-slate-100 rounded-[2.5rem] shadow-sm overflow-hidden min-h-[400px]">
        <div className="p-6 md:p-10">
          {activeTab === 'general' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Razón Social</label>
                  <input required name="nombre_empresa" value={formData.nombre_empresa} onChange={handleChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:border-yellow-500 outline-none" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Nombre Comercial</label>
                  <input name="nombre_comercial" value={formData.nombre_comercial} onChange={handleChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:border-yellow-500 outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">NIT / Identificación</label>
                  <div className="flex gap-2">
                    <input required name="nit" value={formData.nit} onChange={handleChange} className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:border-yellow-500 outline-none" />
                    <input name="dv" value={formData.dv} onChange={handleChange} placeholder="DV" className="w-16 px-2 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-center focus:border-yellow-500 outline-none" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Teléfono</label>
                  <input name="telefono" value={formData.telefono} onChange={handleChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:border-yellow-500 outline-none" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Email</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:border-yellow-500 outline-none" />
              </div>
            </div>
          )}

          {activeTab === 'logo' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 space-y-8 flex flex-col items-center">
              <div className="w-48 h-48 rounded-3xl border-2 border-dashed border-slate-200 p-2 bg-white flex items-center justify-center overflow-hidden">
                {previewUrl ? <img src={previewUrl} alt="Logo" className="max-w-full max-h-full object-contain" /> : <ImageIcon size={48} className="text-slate-300" />}
              </div>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
              <button type="button" onClick={() => fileInputRef.current.click()} className="flex items-center gap-2 bg-slate-100 px-6 py-3 rounded-2xl font-bold text-xs uppercase hover:bg-slate-200 transition-all border border-slate-200">
                <UploadCloud size={18} /> {previewUrl ? "Cambiar Imagen" : "Subir Imagen"}
              </button>
            </div>
          )}

          {activeTab === 'ubicacion' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">País</label>
                  <select name="pais_id" value={formData.pais_id} onChange={handleChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none">
                    <option value="">Seleccione...</option>
                    {countries.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Departamento</label>
                  <select name="departamento_id" value={formData.departamento_id} onChange={handleChange} disabled={!formData.pais_id} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none disabled:opacity-50">
                    <option value="">Seleccione...</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.nombre}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Ciudad</label>
                  <select name="ciudad_id" value={formData.ciudad_id} onChange={handleChange} disabled={!formData.departamento_id} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none disabled:opacity-50">
                    <option value="">Seleccione...</option>
                    {cities.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                  </select>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Dirección</label>
                <input name="direccion" value={formData.direccion} onChange={handleChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:border-yellow-500 outline-none" />
              </div>
            </div>
          )}

          {activeTab === 'impuestos' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 space-y-6">
              <div className="flex items-center gap-4 p-5 bg-slate-50 rounded-3xl border border-slate-100">
                <input type="checkbox" name="responsable_iva" id="iva_check" checked={formData.responsable_iva} onChange={handleChange} className="w-5 h-5 accent-zinc-900" />
                <label htmlFor="iva_check" className="text-xs font-black text-slate-700 uppercase cursor-pointer">¿Responsable de IVA?</label>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Porcentaje IVA (%)</label>
                  <input type="number" name="porcentaje_iva" value={formData.porcentaje_iva} onChange={handleChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:border-yellow-500 outline-none" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Régimen</label>
                  <input name="regimen" value={formData.regimen} onChange={handleChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:border-yellow-500 outline-none" />
                </div>
              </div>
              <div className="flex items-center gap-4 p-5 bg-blue-50/50 rounded-3xl border border-blue-100">
                <input type="checkbox" name="maneja_iva_incluido" id="iva_inc" checked={formData.maneja_iva_incluido} onChange={handleChange} className="w-5 h-5 accent-blue-600" />
                <label htmlFor="iva_inc" className="text-xs font-black text-blue-800 uppercase cursor-pointer">¿Precios incluyen IVA?</label>
              </div>
            </div>
          )}

          {activeTab === 'facturacion' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Prefijo</label>
                  <input name="prefijo_factura" value={formData.prefijo_factura} onChange={handleChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:border-yellow-500 outline-none" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Resolución DIAN</label>
                  <input name="numero_resolucion" value={formData.numero_resolucion} onChange={handleChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:border-yellow-500 outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Rango Desde</label>
                  <input type="number" name="rango_desde" value={formData.rango_desde} onChange={handleChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:border-yellow-500 outline-none" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Rango Hasta</label>
                  <input type="number" name="rango_hasta" value={formData.rango_hasta} onChange={handleChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:border-yellow-500 outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Fecha Resolución</label>
                  <input type="date" name="fecha_resolucion" value={formData.fecha_resolucion} onChange={handleChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:border-yellow-500 outline-none" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Fecha Vencimiento</label>
                  <input type="date" name="fecha_vencimiento" value={formData.fecha_vencimiento} onChange={handleChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:border-yellow-500 outline-none" />
                </div>
              </div>
            </div>
          )}
        </div>
      </form>
    </div>
  );
};