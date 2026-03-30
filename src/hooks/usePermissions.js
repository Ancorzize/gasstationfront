import { useState, useEffect } from 'react';
import { roleService } from '../features/admin/services/roleService';

export const usePermissions = () => {
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMyPermissions = async () => {
      try {
        const res = await roleService.getMyPermissions();
        setPermissions(res.data || []);
      } catch (error) {
        console.error("Error cargando permisos", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMyPermissions();
  }, []);

  const hasPermission = (permissionName) => {
    if (!permissionName) return true;
    return permissions.includes(permissionName);
  };

  return { hasPermission, loading };
};