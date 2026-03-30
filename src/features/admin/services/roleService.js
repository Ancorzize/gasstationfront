const API_URL = import.meta.env.VITE_API_URL;

const getHeaders = () => ({
  'Authorization': `Bearer ${localStorage.getItem('token')}`,
  'Accept': 'application/json',
  'Content-Type': 'application/json'
});

export const roleService = {
  
  getRoles: async () => {
    const response = await fetch(`${API_URL}/roles`, { headers: getHeaders() });
    return await response.json();
  },

 
  getRoleById: async (id) => {
    const response = await fetch(`${API_URL}/roles/${id}`, { headers: getHeaders() });
    return await response.json();
  },

 
  updateRolePermissions: async (roleId, permissions) => {
    const response = await fetch(`${API_URL}/roles/${roleId}/permissions`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ permissions })
    });
    return await response.json();
  },


  getGroupedPermissions: async () => {
    const response = await fetch(`${API_URL}/permisos/grouped`, { headers: getHeaders() });
    return await response.json();
  },


  getMyPermissions: async () => {
    const response = await fetch(`${API_URL}/auth/me/permissions`, { headers: getHeaders() });
    return await response.json();
  }
};