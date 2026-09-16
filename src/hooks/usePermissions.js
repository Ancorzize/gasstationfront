
import { useState, useEffect } from 'react';
import { roleService } from '../features/admin/services/roleService';

export const usePermissions = () => {
  const [permissions, setPermissions] = useState(() => {
    const cached = localStorage.getItem('permissions');
    return cached ? JSON.parse(cached) : [];
  });
  
  const [loading, setLoading] = useState(() => {
    const cached = localStorage.getItem('permissions');
    return !cached;
  });

  useEffect(() => {
    let isMounted = true;

    const fetchPermissions = async () => {
      try {
        const res = await roleService.getMyPermissions();
        if (res && res.status && Array.isArray(res.data)) {
          const perms = res.data;
          if (isMounted) {
            setPermissions(perms);
            localStorage.setItem('permissions', JSON.stringify(perms));
          }
        }
      } catch (error) {
        console.error("Error cargando permisos", error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchPermissions();

    return () => {
      isMounted = false;
    };
  }, []);

  const hasPermission = (permissionName) => {
    if (!permissionName) return true;
    if (Array.isArray(permissionName)) {
      return permissionName.some(p => permissions.includes(p));
    }
    return permissions.includes(permissionName);
  };

  return { permissions, hasPermission, loading };
};