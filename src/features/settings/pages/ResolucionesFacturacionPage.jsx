import React, { useEffect, useState, useMemo } from 'react';
import { 
  Search, Edit2, Power, Loader2, Download, Plus, Trash2, 
  FileText, ArrowLeft, ShieldAlert, RefreshCw, Filter
} from 'lucide-react';
import { resolucionesFacturacionService } from '../services/resolucionesFacturacionService';
import { ResolucionFacturacionModal } from '../components/ResolucionFacturacionModal';
import { ConfirmModal } from '../../../shared/components/ConfirmModal';
import { useToast } from '../../../context/ToastContext';
import { usePermissions } from '../../../hooks/usePermissions';
import { exportToExcel } from '../../../shared/utils/exportExcel';
import { useNavigate } from 'react-router-dom';

const TIPOS_LABELS = {
  factura: 'Factura Electrónica',
  nota_credito: 'Nota Crédito',
  nota_debito: 'Nota Débito',
  documento_soporte: 'Documento Soporte',
  pos_electronico: 'Tique POS'
};

export const ResolucionesFacturacionPage = ({ embedded = false }) => {
  const [resoluciones, setResoluciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTipoDoc, setSelectedTipoDoc] = useState('');
  const [selectedProveedor, setSelectedProveedor] = useState('');
  const [selectedAmbiente, setSelectedAmbiente] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedResolucion, setSelectedResolucion] = useState(null);

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [resolucionToDelete, setResolucionToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const { showToast } = useToast();
  const { hasPermission } = usePermissions();
  const navigate = useNavigate();

  const fetchResoluciones = async () => {
    setLoading(true);
    try {
      const filters = {};
      if (selectedTipoDoc) filters.tipo_documento = selectedTipoDoc;
      if (selectedProveedor) filters.proveedor = selectedProveedor;
      if (selectedAmbiente) filters.ambiente = selectedAmbiente;
      if (selectedStatus !== '') filters.is_active = selectedStatus;

      const result = await resolucionesFacturacionService.getResoluciones(filters);
      if (result.status) {
        const items = result.data?.items || result.data || [];
        setResoluciones(items);
      } else {
        showToast(result.message || "Error al cargar las resoluciones de facturación", "error");
      }
    } catch {
      showToast("Error de conexión al cargar resoluciones", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hasPermission('ver_resoluciones_facturacion')) {
      fetchResoluciones();
    }
  }, [selectedTipoDoc, selectedProveedor, selectedAmbiente, selectedStatus]);

  const filteredResoluciones = useMemo(() => {
    return resoluciones.filter(item => {
      const term = searchTerm.toLowerCase();
      const matchSearch = 
        !term ||
        item.numero_resolucion?.toLowerCase().includes(term) ||
        item.prefijo?.toLowerCase().includes(term) ||
        item.tipo_documento?.toLowerCase().includes(term) ||
        item.proveedor?.toLowerCase().includes(term);

      return matchSearch;
    });
  }, [resoluciones, searchTerm]);

  const handleToggleStatus = async (item) => {
    if (!hasPermission('editar_resoluciones_facturacion')) {
      showToast("No tienes permiso para editar resoluciones.", "error");
      return;
    }

    try {
      const payload = {
        configuracion_empresa_id: item.configuracion_empresa_id,
        tipo_documento: item.tipo_documento,
        prefijo: item.prefijo,
        numero_resolucion: item.numero_resolucion,
        fecha_resolucion: item.fecha_resolucion,
        rango_desde: item.rango_desde,
        rango_hasta: item.rango_hasta,
        consecutivo_actual: item.consecutivo_actual,
        fecha_vencimiento: item.fecha_vencimiento,
        clave_tecnica: item.clave_tecnica,
        proveedor: item.proveedor,
        ambiente: item.ambiente,
        is_active: !item.is_active
      };

      const result = await resolucionesFacturacionService.updateResolucion(item.id, payload);
      if (result.status) {
        showToast(result.message || "Estado actualizado correctamente", "success");
        fetchResoluciones();
      } else {
        showToast(result.message || "Error al actualizar estado", "error");
      }
    } catch {
      showToast("Error de conexión al cambiar el estado", "error");
    }
  };

  const handleDeleteClick = (item) => {
    if (!hasPermission('eliminar_resoluciones_facturacion')) {
      showToast("No tienes permiso para eliminar resoluciones.", "error");
      return;
    }
    setResolucionToDelete(item);
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!resolucionToDelete) return;
    setDeleting(true);
    try {
      const result = await resolucionesFacturacionService.deleteResolucion(resolucionToDelete.id);
      if (result.status) {
        showToast(result.message || "Resolución eliminada correctamente", "success");
        fetchResoluciones();
        setIsConfirmOpen(false);
      } else {
        showToast(result.message || "Error al eliminar resolución", "error");
      }
    } catch {
      showToast("Error de conexión al eliminar resolución", "error");
    } finally {
      setDeleting(false);
      setResolucionToDelete(null);
    }
  };

  if (!hasPermission('ver_resoluciones_facturacion')) {
    return (
      <div className="p-8 max-w-4xl mx-auto text-center space-y-4">
        <div className="p-6 bg-red-500/10 text-red-600 rounded-3xl border border-red-500/20 inline-block">
          <ShieldAlert size={48} className="mx-auto mb-2" />
          <h3 className="font-black text-lg uppercase tracking-tight">Acceso Restringido</h3>
          <p className="text-xs text-red-700">No posees el permiso <code className="font-mono bg-red-100 px-1 py-0.5 rounded">ver_resoluciones_facturacion</code> para visualizar esta sección.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={embedded ? "space-y-6" : "p-4 md:p-8 space-y-6"}>
      
      {/* Header */}
      {!embedded ? (
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate('/facturacion')}
              className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl transition-all"
              title="Volver a Facturación Electrónica"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight uppercase">Resoluciones de Facturación</h2>
                <span className="bg-blue-500/10 text-blue-800 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase">DIAN / MATIAS</span>
              </div>
              <p className="text-slate-500 text-xs md:text-sm">Administra las resoluciones DIAN y consecutivo por tipo de documento.</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 md:gap-3">
            <button 
              onClick={fetchResoluciones}
              className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl transition-all"
              title="Recargar Resoluciones"
            >
              <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
            </button>

            <button 
              onClick={() => exportToExcel(filteredResoluciones, 'Resoluciones_Facturacion')}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-2xl font-bold text-[10px] md:text-xs uppercase hover:bg-emerald-700 transition-all shadow-md"
            >
              <Download size={16} /> <span className="hidden sm:inline">Exportar</span>
            </button>

            {hasPermission('crear_resoluciones_facturacion') && (
              <button 
                onClick={() => { setSelectedResolucion(null); setIsModalOpen(true); }}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-zinc-900 text-white px-4 py-2.5 rounded-2xl font-bold text-[10px] md:text-xs uppercase hover:bg-black transition-all shadow-md"
              >
                <Plus size={16} /> <span>Nueva Resolución</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Resoluciones y Consecutivos DIAN</h3>
            <p className="text-xs text-slate-500">Administración de numeración oficial y prefijos autorizados por tipo de documento.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button 
              onClick={fetchResoluciones}
              className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl transition-all"
              title="Recargar Resoluciones"
            >
              <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
            </button>

            <button 
              onClick={() => exportToExcel(filteredResoluciones, 'Resoluciones_Facturacion')}
              className="flex items-center justify-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-2xl font-bold text-[10px] md:text-xs uppercase hover:bg-emerald-700 transition-all shadow-md"
            >
              <Download size={16} /> <span className="hidden sm:inline">Exportar</span>
            </button>

            {hasPermission('crear_resoluciones_facturacion') && (
              <button 
                onClick={() => { setSelectedResolucion(null); setIsModalOpen(true); }}
                className="flex items-center justify-center gap-2 bg-zinc-900 text-white px-4 py-2.5 rounded-2xl font-bold text-[10px] md:text-xs uppercase hover:bg-black transition-all shadow-md"
              >
                <Plus size={16} /> <span>Nueva Resolución</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Bar de Filtros */}
      <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-3 text-slate-400" size={16} />
          <input 
            type="text" 
            placeholder="Buscar por resolución, prefijo, tipo..." 
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs outline-none focus:border-blue-500 transition-all"
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter size={16} className="text-slate-400 hidden sm:block" />
            <select
              value={selectedTipoDoc}
              onChange={(e) => setSelectedTipoDoc(e.target.value)}
              className="w-full sm:w-auto px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 outline-none focus:border-blue-500 transition-all"
            >
              <option value="">Todos los Tipos</option>
              <option value="factura">Factura Electrónica</option>
              <option value="nota_credito">Nota Crédito</option>
              <option value="nota_debito">Nota Débito</option>
              <option value="documento_soporte">Documento Soporte</option>
              <option value="pos_electronico">Tique POS</option>
            </select>
          </div>

          <select
            value={selectedProveedor}
            onChange={(e) => setSelectedProveedor(e.target.value)}
            className="w-full sm:w-auto px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 outline-none focus:border-blue-500 transition-all"
          >
            <option value="">Todos los Proveedores</option>
            <option value="matias">MATIAS</option>
          </select>

          <select
            value={selectedAmbiente}
            onChange={(e) => setSelectedAmbiente(e.target.value)}
            className="w-full sm:w-auto px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 outline-none focus:border-blue-500 transition-all"
          >
            <option value="">Todos los Ambientes</option>
            <option value="sandbox">Sandbox</option>
            <option value="produccion">Producción</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full sm:w-auto px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 outline-none focus:border-blue-500 transition-all"
          >
            <option value="">Todos los Estados</option>
            <option value="1">Activos</option>
            <option value="0">Inactivos</option>
          </select>
        </div>
      </div>

      {/* Tabla de Resoluciones */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-20 flex flex-col items-center justify-center text-slate-400 gap-3">
              <Loader2 className="animate-spin text-blue-500" size={40} />
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Cargando resoluciones de facturación...</p>
            </div>
          ) : filteredResoluciones.length === 0 ? (
            <div className="p-16 text-center text-slate-400 space-y-2">
              <FileText size={40} className="mx-auto text-slate-300" />
              <p className="font-bold text-sm text-slate-600 uppercase">No se encontraron resoluciones</p>
              <p className="text-xs text-slate-400">Prueba ajustando los filtros o registra una nueva resolución.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse min-w-[800px] md:min-w-full">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tipo Documento</th>
                  <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Proveedor</th>
                  <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ambiente</th>
                  <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Prefijo</th>
                  <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Resolución DIAN</th>
                  <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Rango</th>
                  <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Consecutivo</th>
                  <th className="hidden md:table-cell p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Fechas</th>
                  <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Estado</th>
                  <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredResoluciones.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/30 transition-colors group">
                    
                    <td className="p-4">
                      <span className="font-bold text-slate-800 text-xs">
                        {TIPOS_LABELS[item.tipo_documento] || item.tipo_documento}
                      </span>
                    </td>

                    <td className="p-4">
                      <span className="font-black text-slate-700 text-xs uppercase px-2.5 py-1 bg-slate-100 rounded-lg">
                        {item.proveedor || 'MATIAS'}
                      </span>
                    </td>

                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase ${
                        item.ambiente === 'produccion' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {item.ambiente || 'sandbox'}
                      </span>
                    </td>

                    <td className="p-4">
                      <span className="font-mono font-bold text-blue-600 text-xs bg-blue-50 px-2 py-0.5 rounded">
                        {item.prefijo || '---'}
                      </span>
                    </td>

                    <td className="p-4">
                      <span className="font-mono font-bold text-slate-700 text-xs">
                        {item.numero_resolucion}
                      </span>
                    </td>

                    <td className="p-4 text-xs font-mono text-slate-500">
                      {item.rango_desde !== null && item.rango_hasta !== null 
                        ? `${item.rango_desde} - ${item.rango_hasta}`
                        : '---'}
                    </td>

                    <td className="p-4">
                      <span className="font-mono font-bold text-emerald-600 text-xs bg-emerald-50 px-2.5 py-1 rounded-lg">
                        {item.consecutivo_actual}
                      </span>
                    </td>

                    <td className="hidden md:table-cell p-4 text-[11px] text-slate-500">
                      <div>Res: {item.fecha_resolucion || '---'}</div>
                      <div>Venc: {item.fecha_vencimiento || '---'}</div>
                    </td>

                    <td className="p-4 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase ${
                        item.is_active ? 'bg-emerald-50 text-emerald-600 border border-emerald-200/50' : 'bg-red-50 text-red-600 border border-red-200/50'
                      }`}>
                        {item.is_active ? 'Activa' : 'Inactiva'}
                      </span>
                    </td>

                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-1 md:gap-2">
                        
                        {hasPermission('editar_resoluciones_facturacion') && (
                          <button 
                            onClick={() => { setSelectedResolucion(item); setIsModalOpen(true); }}
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                            title="Editar Resolución"
                          >
                            <Edit2 size={15} />
                          </button>
                        )}

                        {hasPermission('editar_resoluciones_facturacion') && (
                          <button 
                            onClick={() => handleToggleStatus(item)}
                            className={`p-2 rounded-xl transition-all ${
                              item.is_active 
                                ? 'text-slate-400 hover:text-red-600 hover:bg-red-50' 
                                : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                            }`}
                            title={item.is_active ? "Desactivar Resolución" : "Activar Resolución"}
                          >
                            <Power size={15} />
                          </button>
                        )}

                        {hasPermission('eliminar_resoluciones_facturacion') && (
                          <button 
                            onClick={() => handleDeleteClick(item)}
                            className="p-2 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-xl transition-all"
                            title="Eliminar Resolución"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}

                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal Creación / Edición */}
      <ResolucionFacturacionModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={fetchResoluciones} 
        resolucionToEdit={selectedResolucion} 
      />

      {/* Modal Confirmación de Eliminación */}
      <ConfirmModal 
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Eliminar Resolución de Facturación"
        message={`¿Estás seguro de eliminar la resolución "${resolucionToDelete?.numero_resolucion}" (${resolucionToDelete?.tipo_documento})? Esta acción no se puede deshacer.`}
        loading={deleting}
      />

    </div>
  );
};
