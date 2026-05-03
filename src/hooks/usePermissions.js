
import { useState } from 'react';
import { roleService } from '../features/admin/services/roleService';

export const usePermissions = () => {

  const [permissions, setPermissions] = useState(() => {
    const cached = localStorage.getItem('permissions');
    return cached ? JSON.parse(cached) : [];
  });
  
  const [loading, setLoading] = useState(permissions.length === 0);

  const refreshPermissions = async () => {
    try {
      const res = await roleService.getMyPermissions();
      const perms = res.data || [];
      setPermissions(perms);
      localStorage.setItem('permissions', JSON.stringify(perms));
    } catch (error) {
      console.error("Error cargando permisos", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading && permissions.length === 0) {
    refreshPermissions();
  }

  const hasPermission = (permissionName) => {
    if (!permissionName) return true;
    return permissions.includes(permissionName);
  };

  return { hasPermission, loading };
};