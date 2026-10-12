import React, { useEffect, useState } from 'react';
import { 
  Receipt, Server, RefreshCw, Save, Loader2, CheckCircle2, 
  AlertCircle, Zap, Building2, Layers, FileText, Settings2
} from 'lucide-react';
import { invoicingSettingsService } from '../services/invoicingSettingsService';
import { ResolucionesFacturacionPage } from './ResolucionesFacturacionPage';
import { CatalogMappingsPage } from './CatalogMappingsPage';
import { ElectronicInvoicesTab } from '../components/ElectronicInvoicesTab';
import { useToast } from '../../../context/ToastContext';
import { usePermissions } from '../../../hooks/usePermissions';
import { useNavigate, useSearchParams } from 'react-router-dom';

export const InvoicingSettingsPage = ({ initialTab = 'general' }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();
  const { hasPermission } = usePermissions();
  const navigate = useNavigate();

  // Determinar pestaña activa desde URL (?tab=) o prop initialTab
  const currentTabParam = searchParams.get('tab') || initialTab;
  const [activeTab, setActiveTab] = useState(currentTabParam);

  const [showToken, setShowToken] = useState(false);

  const [formData, setFormData] = useState({
    proveedor_activo: 'matias',
    ambiente: 'sandbox',
    facturacion_electronica_activa: false,
    facturar_ventas_pos: true,
    facturar_ventas_combustible: true,
    permitir_ventas_sin_datos_fiscales: true,
    reintentos_automaticos: true,
    max_reintentos: 3,
    matias_api_token: '',
    matias_sandbox_url: 'https://sandbox-api.maticerts.com',
    matias_ds_real_transmission: false
  });

  useEffect(() => {
    loadConfig();
  }, []);

  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    if (tabFromUrl && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    } else if (!tabFromUrl && initialTab && initialTab !== activeTab) {
      setActiveTab(initialTab);
    }
  }, [searchParams, initialTab]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setSearchParams({ tab: tabId });
  };

  const loadConfig = async () => {
    try {
      setLoading(true);
      const res = await invoicingSettingsService.getConfig();
      if (res && res.data) {
        setFormData({
          proveedor_activo: res.data.proveedor_activo || 'matias',
          ambiente: res.data.ambiente || 'sandbox',
          facturacion_electronica_activa: !!res.data.facturacion_electronica_activa,
          facturar_ventas_pos: res.data.facturar_ventas_pos !== undefined ? !!res.data.facturar_ventas_pos : true,
          facturar_ventas_combustible: res.data.facturar_ventas_combustible !== undefined ? !!res.data.facturar_ventas_combustible : true,
          permitir_ventas_sin_datos_fiscales: res.data.permitir_ventas_sin_datos_fiscales !== undefined ? !!res.data.permitir_ventas_sin_datos_fiscales : true,
          reintentos_automaticos: !!res.data.reintentos_automaticos,
          max_reintentos: res.data.max_reintentos ? parseInt(res.data.max_reintentos, 10) : 3,
          matias_api_token: res.data.matias_api_token || '',
          matias_sandbox_url: res.data.matias_sandbox_url || 'https://sandbox-api.maticerts.com',
          matias_ds_real_transmission: !!res.data.matias_ds_real_transmission
        });
      }
    } catch {
      showToast("Error al cargar la configuración de facturación", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    let val = type === 'checkbox' ? checked : value;
    
    if (name === 'max_reintentos') {
      const num = parseInt(value, 10);
      val = isNaN(num) ? 1 : Math.max(1, Math.min(10, num));
    }

    setFormData(prev => ({ ...prev, [name]: val }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        proveedor_activo: formData.proveedor_activo,
        ambiente: formData.ambiente,
        facturacion_electronica_activa: formData.facturacion_electronica_activa,
        facturar_ventas_pos: formData.facturar_ventas_pos,
        facturar_ventas_combustible: formData.facturar_ventas_combustible,
        permitir_ventas_sin_datos_fiscales: formData.permitir_ventas_sin_datos_fiscales,
        reintentos_automaticos: formData.reintentos_automaticos,
        max_reintentos: parseInt(formData.max_reintentos, 10),
        matias_api_token: formData.matias_api_token,
        matias_sandbox_url: formData.matias_sandbox_url,
        matias_ds_real_transmission: formData.matias_ds_real_transmission
      };

      const res = await invoicingSettingsService.updateConfig(payload);
      if (res.status) {
        showToast(res.message || "Configuración actualizada correctamente", "success");
        if (res.data) {
          setFormData(prev => ({
            ...prev,
            ...res.data,
            facturacion_electronica_activa: !!res.data.facturacion_electronica_activa,
            reintentos_automaticos: !!res.data.reintentos_automaticos,
            matias_ds_real_transmission: !!res.data.matias_ds_real_transmission
          }));
        }
      } else {
        showToast(res.message || "Error al guardar la configuración", "error");
      }
    } catch {
      showToast("Error de conexión al guardar", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-20 flex flex-col items-center justify-center text-slate-400 gap-3">
        <Loader2 className="animate-spin text-yellow-500" size={40} />
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">Cargando Facturación Electrónica...</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
      
      {/* Header General del Módulo */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-yellow-500/10 text-yellow-600 rounded-2xl">
              <Receipt size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase">Facturación Electrónica</h2>
              <p className="text-slate-500 text-sm italic">Gestión de parámetros, proveedor, resoluciones y catálogos fiscales DIAN</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/configuracion')}
            className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-bold text-xs uppercase transition-all flex items-center gap-2"
          >
            <Building2 size={16} />
            Datos Empresa
          </button>
          
          {(activeTab === 'general' || activeTab === 'proveedor') && (
            <button 
              form="invoicing-config-form" 
              disabled={saving}
              className="bg-zinc-900 text-white px-8 py-3 rounded-2xl font-bold text-xs uppercase hover:bg-black transition-all flex items-center gap-2 shadow-xl disabled:opacity-50"
            >
              {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
              Guardar Configuración
            </button>
          )}
        </div>
      </header>

      {/* Barra de Pestañas Internas */}
      <div className="flex gap-1.5 p-1.5 bg-slate-100 rounded-2xl w-fit overflow-x-auto max-w-full">
        {[
          { id: 'general', label: 'General', icon: Zap, show: true },
          { id: 'proveedor', label: 'Proveedor', icon: Server, show: true },
          { id: 'resoluciones', label: 'Resoluciones', icon: FileText, show: hasPermission('ver_resoluciones_facturacion') },
          { id: 'catalogos', label: 'Catálogos', icon: Layers, show: hasPermission('ver_mapeos_catalogos') },
          { id: 'documentos', label: 'Documentos Electrónicos', icon: FileText, show: hasPermission('ver_documentos_electronicos') },
        ].filter(tab => tab.show).map(tab => (
          <button 
            key={tab.id} 
            type="button" 
            onClick={() => handleTabChange(tab.id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase transition-all whitespace-nowrap ${
              activeTab === tab.id ? 'bg-white text-zinc-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <tab.icon size={15} />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Pestaña: General */}
      {activeTab === 'general' && (
        <form id="invoicing-config-form" onSubmit={handleSubmit} className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
          
          {/* Banner de Estado General */}
          <div className={`p-6 rounded-[2.5rem] border transition-all ${
            formData.facturacion_electronica_activa 
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-900' 
              : 'bg-slate-100 border-slate-200 text-slate-700'
          }`}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-2xl ${
                  formData.facturacion_electronica_activa ? 'bg-emerald-500 text-white' : 'bg-slate-300 text-slate-600'
                }`}>
                  {formData.facturacion_electronica_activa ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
                </div>
                <div>
                  <h3 className="font-black text-base uppercase tracking-tight">
                    Emisión Electrónica: {formData.facturacion_electronica_activa ? 'ACTIVADA' : 'DESACTIVADA'}
                  </h3>
                  <p className="text-xs opacity-80">
                    {formData.facturacion_electronica_activa 
                      ? 'Toda venta facturable se transmitirá electrónicamente a MATIAS / DIAN.' 
                      : 'Las ventas se registrarán solo en el ERP sin enviar documentos electrónicos.'}
                  </p>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  name="facturacion_electronica_activa" 
                  checked={formData.facturacion_electronica_activa} 
                  onChange={handleChange}
                  className="sr-only peer"
                />
                <div className="w-14 h-7 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>
          </div>

          {/* Sección: Reglas Comercial de Emisión */}
          <div className="bg-white border border-slate-100 rounded-[2.5rem] p-6 md:p-8 shadow-sm space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <Zap className="text-yellow-600" size={20} />
              <h3 className="font-black text-slate-800 text-sm uppercase tracking-wider">Reglas Comerciales de Facturación</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-5 bg-slate-50 rounded-3xl border border-slate-100 flex items-center justify-between">
                <div>
                  <p className="text-xs font-black text-slate-800 uppercase">Facturar Ventas POS / Lubricantes</p>
                  <p className="text-[10px] text-slate-500">Emisión automática al completar ventas de mostrador.</p>
                </div>
                <input 
                  type="checkbox" 
                  name="facturar_ventas_pos" 
                  checked={formData.facturar_ventas_pos} 
                  onChange={handleChange} 
                  className="w-5 h-5 accent-zinc-900 cursor-pointer" 
                />
              </div>

              <div className="p-5 bg-slate-50 rounded-3xl border border-slate-100 flex items-center justify-between">
                <div>
                  <p className="text-xs font-black text-slate-800 uppercase">Facturar Ventas Combustible</p>
                  <p className="text-[10px] text-slate-500">Emisión automática para despachos de isla.</p>
                </div>
                <input 
                  type="checkbox" 
                  name="facturar_ventas_combustible" 
                  checked={formData.facturar_ventas_combustible} 
                  onChange={handleChange} 
                  className="w-5 h-5 accent-zinc-900 cursor-pointer" 
                />
              </div>
            </div>

            <div className="p-5 bg-amber-50/60 rounded-3xl border border-amber-200/60 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-black text-amber-900 uppercase">Permitir Ventas sin Datos Fiscales Completos</p>
                <p className="text-[10px] text-amber-800">
                  La venta comercial finaliza siempre con éxito. Si el cliente no posee NIT o datos fiscales completos, se asigna Consumidor Final y la factura queda registrada en el sistema.
                </p>
              </div>
              <input 
                type="checkbox" 
                name="permitir_ventas_sin_datos_fiscales" 
                checked={formData.permitir_ventas_sin_datos_fiscales} 
                onChange={handleChange} 
                className="w-5 h-5 accent-amber-600 cursor-pointer flex-shrink-0" 
              />
            </div>
          </div>

          {/* Sección: Reintentos y Resiliencia */}
          <div className="bg-white border border-slate-100 rounded-[2.5rem] p-6 md:p-8 shadow-sm space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <RefreshCw className="text-yellow-600" size={20} />
              <h3 className="font-black text-slate-800 text-sm uppercase tracking-wider">Reintentos Automáticos y Tolerancia a Fallos</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-5 bg-slate-50 rounded-3xl border border-slate-100 flex items-center justify-between">
                <div>
                  <p className="text-xs font-black text-slate-800 uppercase">Reintentos Automáticos</p>
                  <p className="text-[10px] text-slate-500">Reintentar envíos automáticamente ante problemas de conectividad.</p>
                </div>
                <input 
                  type="checkbox" 
                  name="reintentos_automaticos" 
                  checked={formData.reintentos_automaticos} 
                  onChange={handleChange} 
                  className="w-5 h-5 accent-zinc-900 cursor-pointer" 
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Máximo de Reintentos (1 a 10)</label>
                <input 
                  type="number" 
                  name="max_reintentos" 
                  min={1} 
                  max={10} 
                  value={formData.max_reintentos} 
                  onChange={handleChange} 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:border-yellow-500 outline-none" 
                />
              </div>
            </div>
          </div>

        </form>
      )}

      {/* Pestaña: Proveedor */}
      {activeTab === 'proveedor' && (
        <form id="invoicing-config-form" onSubmit={handleSubmit} className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="bg-white border border-slate-100 rounded-[2.5rem] p-6 md:p-8 shadow-sm space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <Server className="text-yellow-600" size={20} />
              <h3 className="font-black text-slate-800 text-sm uppercase tracking-wider">Proveedor Técnico y Ambiente de Operación</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Proveedor Técnico Activo</label>
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="font-black text-slate-800 text-sm uppercase tracking-wide block">MATIAS API</span>
                    <span className="text-[10px] text-slate-500">Proveedor tecnológico homologado DIAN</span>
                  </div>
                  <span className="bg-yellow-500/20 text-yellow-800 text-[10px] font-black px-2.5 py-1 rounded-lg uppercase">Oficial</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Ambiente de Operación</label>
                <div className="grid grid-cols-2 gap-3">
                  <label className={`p-4 rounded-2xl border cursor-pointer flex items-center justify-center gap-2 font-bold text-xs uppercase transition-all ${
                    formData.ambiente === 'sandbox' ? 'bg-zinc-900 text-white border-zinc-900 shadow-md' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}>
                    <input 
                      type="radio" 
                      name="ambiente" 
                      value="sandbox" 
                      checked={formData.ambiente === 'sandbox'} 
                      onChange={handleChange} 
                      className="hidden" 
                    />
                    <span>Sandbox (Pruebas)</span>
                  </label>

                  <label className={`p-4 rounded-2xl border cursor-pointer flex items-center justify-center gap-2 font-bold text-xs uppercase transition-all ${
                    formData.ambiente === 'produccion' ? 'bg-emerald-600 text-white border-emerald-600 shadow-md' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}>
                    <input 
                      type="radio" 
                      name="ambiente" 
                      value="produccion" 
                      checked={formData.ambiente === 'produccion'} 
                      onChange={handleChange} 
                      className="hidden" 
                    />
                    <span>Producción (Real)</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Sección: Configuración de Credenciales MATIAS API */}
          <div className="bg-white border border-slate-100 rounded-[2.5rem] p-6 md:p-8 shadow-sm space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <Settings2 className="text-yellow-600" size={20} />
              <h3 className="font-black text-slate-800 text-sm uppercase tracking-wider">Configuración de MATIAS API</h3>
            </div>

            <div className="space-y-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Token Bearer de MATIAS API</label>
                <div className="relative">
                  <input 
                    type={showToken ? "text" : "password"} 
                    name="matias_api_token" 
                    value={formData.matias_api_token} 
                    onChange={handleChange} 
                    placeholder="Token Bearer asignado por MATIAS"
                    className="w-full pl-4 pr-24 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:border-yellow-500 outline-none" 
                  />
                  <button
                    type="button"
                    onClick={() => setShowToken(!showToken)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500 hover:text-slate-800 bg-slate-200/80 px-3 py-1.5 rounded-xl transition-all"
                  >
                    {showToken ? "Ocultar" : "Mostrar"}
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 ml-1">
                  El token se guarda cifrado en base de datos. Para mantener el token actual, deje '********'.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">URL de Sandbox (Pruebas)</label>
                <input 
                  type="text" 
                  name="matias_sandbox_url" 
                  value={formData.matias_sandbox_url} 
                  onChange={handleChange} 
                  placeholder="https://sandbox-api.maticerts.com"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:border-yellow-500 outline-none" 
                />
              </div>

              <div className="p-5 bg-slate-50 rounded-3xl border border-slate-100 flex items-center justify-between">
                <div>
                  <p className="text-xs font-black text-slate-800 uppercase">Transmisión Real de Documento Soporte (Sandbox)</p>
                  <p className="text-[10px] text-slate-500">Habilita el envío HTTP real a MATIAS API para Documentos Soporte en el ambiente Sandbox.</p>
                </div>
                <input 
                  type="checkbox" 
                  name="matias_ds_real_transmission" 
                  checked={formData.matias_ds_real_transmission} 
                  onChange={handleChange} 
                  className="w-5 h-5 accent-zinc-900 cursor-pointer" 
                />
              </div>
            </div>
          </div>
        </form>
      )}

      {/* Pestaña: Resoluciones */}
      {activeTab === 'resoluciones' && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <ResolucionesFacturacionPage embedded={true} />
        </div>
      )}

      {/* Pestaña: Catálogos */}
      {activeTab === 'catalogos' && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <CatalogMappingsPage embedded={true} />
        </div>
      )}

      {/* Pestaña: Documentos Electrónicos */}
      {activeTab === 'documentos' && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <ElectronicInvoicesTab embedded={true} />
        </div>
      )}

    </div>
  );
};
