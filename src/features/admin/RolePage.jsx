import React, { useEffect, useState } from 'react';
import { roleService } from './services/roleService';
import { Shield, Save, CheckCircle2, Lock, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '../../context/ToastContext';

export const RolePage = () => {
  const [roles, setRoles] = useState([]);
  const [groupedPermissions, setGroupedPermissions] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
      // Seleccionar el primer rol por defecto
      if (rolesRes.data.length > 0) handleSelectRole(rolesRes.data[0]);
    } catch (error) {
      console.error("Error inicializando roles", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectRole = (role) => {
    setSelectedRole(role);
    setSelectedPermissions(role.permissions || []);
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
        
        showToast("Permisos actualizados con éxito", "success");
      }
    } catch (error) {
      showToast("No se pudieron guardar los cambios", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-10 text-center text-slate-400 italic">Cargando matriz de permisos...</div>;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight italic">
          ROLES Y <span className="text-yellow-500">PERMISOS</span>
        </h1>
        <p className="text-slate-400 text-sm">Define qué puede hacer cada perfil en el sistema</p>
      </header>

      <div className="grid grid-cols-12 gap-6 items-start">
        {/* Columna Izquierda: Lista de Roles */}
        <div className="col-span-12 md:col-span-4 space-y-3">
          {roles.map((role) => (
            <button
              key={role.id}
              onClick={() => handleSelectRole(role)}
              className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all
                ${selectedRole?.id === role.id 
                  ? 'bg-zinc-900 border-zinc-900 text-white shadow-xl shadow-zinc-200' 
                  : 'bg-white border-slate-200 text-slate-600 hover:border-yellow-500'}`}
            >
              <div className="flex items-center gap-3">
                <Shield size={18} className={selectedRole?.id === role.id ? 'text-yellow-500' : 'text-slate-400'} />
                <span className="font-bold text-sm uppercase tracking-wide">{role.name}</span>
              </div>
              <ChevronRight size={16} />
            </button>
          ))}
        </div>

        {/* Columna Derecha: Matriz de Permisos */}
        <div className="col-span-12 md:col-span-8 bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <div>
              <h2 className="font-bold text-slate-800 text-sm uppercase">Permisos del Rol: {selectedRole?.name}</h2>
              <p className="text-slate-400 text-xs">Marca los módulos a los que este rol tendrá acceso</p>
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-[10px] py-2 px-4 rounded-xl flex items-center gap-2 transition-all uppercase"
            >
              {saving ? "Guardando..." : <><Save size={14} /> Guardar Cambios</>}
            </button>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
            {groupedPermissions.map((group) => (
              <div key={group.module} className="space-y-3">
                <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[2px] flex items-center gap-2">
                  <Lock size={12} /> {group.module}
                </h3>
                <div className="space-y-2">
                  {group.permissions.map((perm) => (
                    <label 
                      key={perm.id} 
                      className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        className="w-4 h-4 accent-yellow-500 rounded border-slate-300"
                        checked={selectedPermissions.includes(perm.name)}
                        onChange={() => handleToggleStatus(perm.name)} // Corregido el nombre abajo
                        onClick={() => handleTogglePermission(perm.name)}
                      />
                      <span className="text-xs font-medium text-slate-600 capitalize">
                        {perm.name.replace(/_/g, ' ')}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};