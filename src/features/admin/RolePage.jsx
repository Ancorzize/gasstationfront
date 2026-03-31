import React, { useEffect, useState, useMemo } from 'react';
import { roleService } from './services/roleService';
import { Shield, Save, Lock, ChevronRight, ChevronDown, Search, FilterX } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '../../context/ToastContext';

export const RolePage = () => {
  const [roles, setRoles] = useState([]);
  const [groupedPermissions, setGroupedPermissions] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Estados nuevos: Buscador y Acordeones
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedModules, setExpandedModules] = useState({});

  const { showToast } = useToast();

  useEffect(() => {
    initData();
  }, []);

  const initData = async () => {
    try {
      const [rolesRes, permRes] = await Promise.all([
        roleService.getRoles(),
        roleService.getGroupedPermissions()
      ]);
      setRoles(rolesRes.data);
      setGroupedPermissions(permRes.data);
      
      // Inicializar todos los módulos como expandidos por defecto
      const initialExpanded = {};
      permRes.data.forEach(g => initialExpanded[g.module] = true);
      setExpandedModules(initialExpanded);

      if (rolesRes.data.length > 0) handleSelectRole(rolesRes.data[0]);
    } catch (error) {
      showToast("Error al cargar datos", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectRole = (role) => {
    setSelectedRole(role);
    setSelectedPermissions(role.permissions || []);
  };

  // Filtrado de permisos inteligente
  const filteredGroups = useMemo(() => {
    if (!searchTerm.trim()) return groupedPermissions;

    const term = searchTerm.toLowerCase();
    return groupedPermissions.map(group => ({
      ...group,
      permissions: group.permissions.filter(p => 
        p.name.toLowerCase().includes(term) || 
        group.module.toLowerCase().includes(term)
      )
    })).filter(group => group.permissions.length > 0);
  }, [searchTerm, groupedPermissions]);

  const toggleModule = (moduleName) => {
    setExpandedModules(prev => ({
      ...prev,
      [moduleName]: !prev[moduleName]
    }));
  };

  const handleTogglePermission = (permName) => {
    setSelectedPermissions(prev => 
      prev.includes(permName) 
        ? prev.filter(p => p !== permName) 
        : [...prev, permName]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await roleService.updateRolePermissions(selectedRole.id, selectedPermissions);
      if (res.status) {
        setRoles(roles.map(r => r.id === selectedRole.id ? res.data : r));
        showToast("Matriz de permisos actualizada", "success");
      }
    } catch (error) {
      showToast("Error al guardar cambios", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="p-20 text-center text-slate-400 animate-pulse uppercase font-black text-xs tracking-widest">
      Sincronizando Matriz de Permisos...
    </div>
  );

  return (
    <div className="p-4 md:p-8 space-y-6">
      <header>
        <h1 className="text-2xl font-black text-slate-800 tracking-tight uppercase">
          Roles y <span className="text-yellow-500">Permisos</span>
        </h1>
        <p className="text-slate-500 text-sm font-medium">Configuración de niveles de seguridad por perfil.</p>
      </header>

      <div className="grid grid-cols-12 gap-6">
        {/* Columna Izquierda: Roles */}
        <div className="col-span-12 lg:col-span-4 space-y-3">
          {roles.map((role) => (
            <button
              key={role.id}
              onClick={() => handleSelectRole(role)}
              className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all duration-300
                ${selectedRole?.id === role.id 
                  ? 'bg-zinc-900 border-zinc-900 text-white shadow-xl translate-x-2' 
                  : 'bg-white border-slate-100 text-slate-500 hover:border-yellow-500 hover:bg-slate-50'}`}
            >
              <div className="flex items-center gap-3">
                <Shield size={18} className={selectedRole?.id === role.id ? 'text-yellow-500' : 'text-slate-300'} />
                <span className="font-bold text-xs uppercase tracking-wider">{role.name}</span>
              </div>
              <ChevronRight size={16} className={selectedRole?.id === role.id ? 'opacity-100' : 'opacity-0'} />
            </button>
          ))}
        </div>

        {/* Columna Derecha: Matriz de Permisos */}
        <div className="col-span-12 lg:col-span-8 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm flex flex-col overflow-hidden">
          {/* Header de Matriz */}
          <div className="p-6 border-b border-slate-50 bg-slate-50/30">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h2 className="font-black text-slate-800 text-sm uppercase">Permisos: {selectedRole?.name}</h2>
                <p className="text-slate-400 text-[10px] uppercase font-bold tracking-tighter">Gestiona el acceso modular</p>
              </div>
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full sm:w-auto bg-yellow-500 hover:bg-black hover:text-white text-black font-black text-[10px] py-3 px-6 rounded-2xl flex items-center justify-center gap-2 transition-all uppercase shadow-lg shadow-yellow-100 disabled:opacity-50"
              >
                {saving ? "Guardando..." : <><Save size={14} /> Guardar Cambios</>}
              </button>
            </div>

            {/* Buscador de Permisos */}
            <div className="relative">
              <Search className="absolute left-4 top-3 text-slate-400" size={16} />
              <input 
                type="text"
                placeholder="Filtrar por nombre de permiso o módulo..."
                className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs outline-none focus:border-yellow-500 transition-all shadow-inner"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Listado con Acordeones */}
          <div className="flex-1 overflow-y-auto p-6 max-h-[600px] custom-scrollbar-light">
            {filteredGroups.length > 0 ? (
              <div className="space-y-4">
                {filteredGroups.map((group) => (
                  <div key={group.module} className="border border-slate-100 rounded-3xl overflow-hidden">
                    <button 
                      onClick={() => toggleModule(group.module)}
                      className="w-full flex items-center justify-between p-4 bg-slate-50/50 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center shadow-sm border border-slate-100 text-slate-400">
                          <Lock size={14} />
                        </div>
                        <span className="text-[11px] font-black text-slate-600 uppercase tracking-widest">{group.module}</span>
                        <span className="bg-slate-200 text-slate-500 text-[9px] px-2 py-0.5 rounded-full font-bold">
                          {group.permissions.length}
                        </span>
                      </div>
                      {expandedModules[group.module] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </button>

                    <AnimatePresence>
                      {expandedModules[group.module] && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden bg-white"
                        >
                          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {group.permissions.map((perm) => (
                              <label 
                                key={perm.id} 
                                className={`flex items-center gap-3 p-3 rounded-2xl border transition-all cursor-pointer
                                  ${selectedPermissions.includes(perm.name) 
                                    ? 'border-yellow-500 bg-yellow-50/30' 
                                    : 'border-slate-50 hover:bg-slate-50'}`}
                              >
                                <div className="relative flex items-center justify-center">
                                  <input
                                    type="checkbox"
                                    className="peer appearance-none w-5 h-5 border-2 border-slate-200 rounded-lg checked:bg-yellow-500 checked:border-yellow-500 transition-all cursor-pointer"
                                    checked={selectedPermissions.includes(perm.name)}
                                    onChange={() => handleTogglePermission(perm.name)}
                                  />
                                  <Lock size={10} className="absolute text-white opacity-0 peer-checked:opacity-100 pointer-events-none" />
                                </div>
                                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-tighter">
                                  {perm.name.split('_').slice(0, -1).join(' ')} <span className="text-yellow-600 italic">{perm.name.split('_').pop()}</span>
                                </span>
                              </label>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-4">
                <FilterX size={48} strokeWidth={1} />
                <p className="text-xs font-bold uppercase tracking-widest text-center">
                  No se encontraron permisos <br /> con "{searchTerm}"
                </p>
                <button onClick={() => setSearchTerm('')} className="text-yellow-600 text-[10px] font-black uppercase underline">Limpiar búsqueda</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};