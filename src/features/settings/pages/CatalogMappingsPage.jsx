import React, { useEffect, useState, useMemo } from 'react';
import { 
  Search, Edit2, Power, Layers, Loader2, Download, Plus, Trash2, 
  Receipt, ArrowLeft, ShieldAlert, RefreshCw, Filter
} from 'lucide-react';
import { catalogMappingsService } from '../services/catalogMappingsService';
import { CatalogMappingModal } from '../components/CatalogMappingModal';
import { ConfirmModal } from '../../../shared/components/ConfirmModal';
import { useToast } from '../../../context/ToastContext';
import { usePermissions } from '../../../hooks/usePermissions';
import { exportToExcel } from '../../../shared/utils/exportExcel';
import { useNavigate } from 'react-router-dom';

const CATEGORIAS_LABELS = {
  tipo_documento: 'Tipo de Documento',
  medio_pago: 'Medio de Pago',
  unidad_medida: 'Unidad de Medida',
  impuesto: 'Impuesto / Retención'
};

export const CatalogMappingsPage = ({ embedded = false }) => {
  const [mapeos, setMapeos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoria, setSelectedCategoria] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMapeo, setSelectedMapeo] = useState(null);

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [mapeoToDelete, setMapeoToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const { showToast } = useToast();
  const { hasPermission } = usePermissions();
  const navigate = useNavigate();

  const fetchMapeos = async () => {
    setLoading(true);
    try {
      const filters = {};
      if (selectedCategoria) filters.categoria = selectedCategoria;
      if (selectedStatus !== '') filters.is_active = selectedStatus;

      const result = await catalogMappingsService.getMapeos(filters);
      if (result.status) {
        const items = result.data?.items || result.data || [];
        setMapeos(items);
      } else {
        showToast(result.message || "Error al cargar los mapeos de catálogos", "error");
      }
    } catch {
      showToast("Error de conexión al cargar mapeos de catálogos", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hasPermission('ver_mapeos_catalogos')) {
      fetchMapeos();
    }
  }, [selectedCategoria, selectedStatus]);

  const filteredMapeos = useMemo(() => {
    return mapeos.filter(item => {
      const term = searchTerm.toLowerCase();
      const matchSearch = 
        !term ||
        item.codigo_interno?.toLowerCase().includes(term) ||
        item.codigo_externo?.toLowerCase().includes(term) ||
        item.proveedor?.toLowerCase().includes(term) ||
        item.descripcion?.toLowerCase().includes(term);

      return matchSearch;
    });
  }, [mapeos, searchTerm]);

  const handleToggleStatus = async (item) => {
    if (!hasPermission('editar_mapeos_catalogos')) {
      showToast("No tienes permiso para editar mapeos.", "error");
      return;
    }

    try {
      const payload = {
        proveedor: item.proveedor,
        categoria: item.categoria,
        codigo_interno: item.codigo_interno,
        codigo_externo: item.codigo_externo,
        codigo_externo_secundario: item.codigo_externo_secundario,
        descripcion: item.descripcion,
        is_active: !item.is_active
      };

      const result = await catalogMappingsService.updateMapeo(item.id, payload);
      if (result.status) {
        showToast(result.message || "Estado actualizado correctamente", "success");
        fetchMapeos();
      } else {
        showToast(result.message || "Error al actualizar estado", "error");
      }
    } catch {
      showToast("Error de conexión al cambiar el estado", "error");
    }
  };

  const handleDeleteClick = (item) => {
    if (!hasPermission('eliminar_mapeos_catalogos')) {
      showToast("No tienes permiso para eliminar mapeos.", "error");
      return;
    }
    setMapeoToDelete(item);
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!mapeoToDelete) return;
    setDeleting(true);
    try {
      const result = await catalogMappingsService.deleteMapeo(mapeoToDelete.id);
      if (result.status) {
        showToast(result.message || "Mapeo eliminado correctamente", "success");
        fetchMapeos();
        setIsConfirmOpen(false);
      } else {
        showToast(result.message || "Error al eliminar mapeo", "error");
      }
    } catch {
      showToast("Error de conexión al eliminar mapeo", "error");
    } finally {
      setDeleting(false);
      setMapeoToDelete(null);
    }
  };

  if (!hasPermission('ver_mapeos_catalogos')) {
    return (
      <div className="p-8 max-w-4xl mx-auto text-center space-y-4">
        <div className="p-6 bg-red-500/10 text-red-600 rounded-3xl border border-red-500/20 inline-block">
          <ShieldAlert size={48} className="mx-auto mb-2" />
          <h3 className="font-black text-lg uppercase tracking-tight">Acceso Restringido</h3>
          <p className="text-xs text-red-700">No posees el permiso <code className="font-mono bg-red-100 px-1 py-0.5 rounded">ver_mapeos_catalogos</code> para visualizar esta sección.</p>
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
                <h2 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight uppercase">Mapeos de Catálogos</h2>
                <span className="bg-yellow-500/10 text-yellow-800 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase">DIAN / MATIAS</span>
              </div>
              <p className="text-slate-500 text-xs md:text-sm">Configura la equivalencia entre los códigos internos del ERP y el proveedor fiscal.</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 md:gap-3">
            <button 
              onClick={fetchMapeos}
              className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl transition-all"
              title="Recargar Mapeos"
            >
              <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
            </button>

            <button 
              onClick={() => exportToExcel(filteredMapeos, 'Mapeos_Catalogos_Facturacion')}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-2xl font-bold text-[10px] md:text-xs uppercase hover:bg-emerald-700 transition-all shadow-md"
            >
              <Download size={16} /> <span className="hidden sm:inline">Exportar</span>
            </button>

            {hasPermission('crear_mapeos_catalogos') && (
              <button 
                onClick={() => { setSelectedMapeo(null); setIsModalOpen(true); }}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-zinc-900 text-white px-4 py-2.5 rounded-2xl font-bold text-[10px] md:text-xs uppercase hover:bg-black transition-all shadow-md"
              >
                <Plus size={16} /> <span>Nuevo Mapeo</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Equivalencias de Catálogos Fiscales</h3>
            <p className="text-xs text-slate-500">Mapeo de códigos internos del ERP hacia el proveedor fiscal (MATIAS / DIAN).</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button 
              onClick={fetchMapeos}
              className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl transition-all"
              title="Recargar Mapeos"
            >
              <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
            </button>

            <button 
              onClick={() => exportToExcel(filteredMapeos, 'Mapeos_Catalogos_Facturacion')}
              className="flex items-center justify-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-2xl font-bold text-[10px] md:text-xs uppercase hover:bg-emerald-700 transition-all shadow-md"
            >
              <Download size={16} /> <span className="hidden sm:inline">Exportar</span>
            </button>

            {hasPermission('crear_mapeos_catalogos') && (
              <button 
                onClick={() => { setSelectedMapeo(null); setIsModalOpen(true); }}
                className="flex items-center justify-center gap-2 bg-zinc-900 text-white px-4 py-2.5 rounded-2xl font-bold text-[10px] md:text-xs uppercase hover:bg-black transition-all shadow-md"
              >
                <Plus size={16} /> <span>Nuevo Mapeo</span>
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
            placeholder="Buscar por código, proveedor o descripción..." 
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs outline-none focus:border-yellow-500 transition-all"
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter size={16} className="text-slate-400 hidden sm:block" />
            <select
              value={selectedCategoria}
              onChange={(e) => setSelectedCategoria(e.target.value)}
              className="w-full sm:w-auto px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 outline-none focus:border-yellow-500 transition-all"
            >
              <option value="">Todas las Categorías</option>
              <option value="tipo_documento">Tipo de Documento</option>
              <option value="medio_pago">Medio de Pago</option>
              <option value="unidad_medida">Unidad de Medida</option>
              <option value="impuesto">Impuesto / Retención</option>
            </select>
          </div>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full sm:w-auto px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 outline-none focus:border-yellow-500 transition-all"
          >
            <option value="">Todos los Estados</option>
            <option value="1">Activos</option>
            <option value="0">Inactivos</option>
          </select>
        </div>
      </div>

      {/* Tabla de Mapeos */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-20 flex flex-col items-center justify-center text-slate-400 gap-3">
              <Loader2 className="animate-spin text-yellow-500" size={40} />
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Cargando mapeos de catálogos...</p>
            </div>
          ) : filteredMapeos.length === 0 ? (
            <div className="p-16 text-center text-slate-400 space-y-2">
              <Layers size={40} className="mx-auto text-slate-300" />
              <p className="font-bold text-sm text-slate-600 uppercase">No se encontraron mapeos</p>
              <p className="text-xs text-slate-400">Prueba ajustando los filtros o registra una nueva equivalencia de catálogo.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse min-w-[700px] md:min-w-full">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Proveedor</th>
                  <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Categoría</th>
                  <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Código ERP</th>
                  <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Código Proveedor / DIAN</th>
                  <th className="hidden lg:table-cell p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cód. Secundario</th>
                  <th className="hidden md:table-cell p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Descripción</th>
                  <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Estado</th>
                  <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredMapeos.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/30 transition-colors group">
                    
                    <td className="p-4">
                      <span className="font-black text-slate-800 text-xs uppercase px-2.5 py-1 bg-slate-100 rounded-lg">
                        {item.proveedor}
                      </span>
                    </td>

                    <td className="p-4">
                      <span className="font-bold text-slate-700 text-xs">
                        {CATEGORIAS_LABELS[item.categoria] || item.categoria}
                      </span>
                    </td>

                    <td className="p-4">
                      <span className="font-mono font-bold text-blue-600 text-xs bg-blue-50 px-2 py-0.5 rounded">
                        {item.codigo_interno}
                      </span>
                    </td>

                    <td className="p-4">
                      <span className="font-mono font-bold text-emerald-600 text-xs bg-emerald-50 px-2 py-0.5 rounded">
                        {item.codigo_externo}
                      </span>
                    </td>

                    <td className="hidden lg:table-cell p-4 text-xs font-mono text-slate-500">
                      {item.codigo_externo_secundario || '---'}
                    </td>

                    <td className="hidden md:table-cell p-4 text-xs text-slate-500 max-w-xs truncate">
                      {item.descripcion || '---'}
                    </td>

                    <td className="p-4 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase ${
                        item.is_active ? 'bg-emerald-50 text-emerald-600 border border-emerald-200/50' : 'bg-red-50 text-red-600 border border-red-200/50'
                      }`}>
                        {item.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>

                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-1 md:gap-2">
                        
                        {hasPermission('editar_mapeos_catalogos') && (
                          <button 
                            onClick={() => { setSelectedMapeo(item); setIsModalOpen(true); }}
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                            title="Editar Mapeo"
                          >
                            <Edit2 size={15} />
                          </button>
                        )}

                        {hasPermission('editar_mapeos_catalogos') && (
                          <button 
                            onClick={() => handleToggleStatus(item)}
                            className={`p-2 rounded-xl transition-all ${
                              item.is_active 
                                ? 'text-slate-400 hover:text-red-600 hover:bg-red-50' 
                                : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                            }`}
                            title={item.is_active ? "Desactivar Mapeo" : "Activar Mapeo"}
                          >
                            <Power size={15} />
                          </button>
                        )}

                        {hasPermission('eliminar_mapeos_catalogos') && (
                          <button 
                            onClick={() => handleDeleteClick(item)}
                            className="p-2 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-xl transition-all"
                            title="Eliminar Mapeo"
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
      <CatalogMappingModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={fetchMapeos} 
        mapeoToEdit={selectedMapeo} 
      />

      {/* Modal Confirmación de Eliminación */}
      <ConfirmModal 
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Eliminar Mapeo de Catálogo"
        message={`¿Estás seguro de eliminar la equivalencia "${mapeoToDelete?.proveedor} - ${mapeoToDelete?.categoria}: [${mapeoToDelete?.codigo_interno}] ➔ [${mapeoToDelete?.codigo_externo}]"? Esta acción no se puede deshacer.`}
        loading={deleting}
      />

    </div>
  );
};
