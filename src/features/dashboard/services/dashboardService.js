const API_URL = import.meta.env.VITE_API_URL;

const getHeaders = () => ({
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'Authorization': `Bearer ${localStorage.getItem('token')}`
});

export const dashboardService = {
  getDashboardData: async (fecha_desde = '', fecha_hasta = '') => {
    const params = new URLSearchParams();
    if (fecha_desde) params.append('fecha_desde', fecha_desde);
    if (fecha_hasta) params.append('fecha_hasta', fecha_hasta);

    const queryString = params.toString() ? `?${params.toString()}` : '';
    
    const response = await fetch(`${API_URL}/dashboard/dashboard${queryString}`, {
      method: 'GET',
      headers: getHeaders()
    });

    if (!response.ok) {
      throw new Error('Error al obtener datos del dashboard');
    }

    return await response.json();
  },
  getRoles: async () => {
    const res = await fetch(`${API_URL}/dashboard/roles`, { headers: getHeaders() });
    return res.json();
  },
  getConfig: async (roleId) => {
    const res = await fetch(`${API_URL}/dashboard/configuracion/${roleId}`, { headers: getHeaders() });
    return res.json();
  },
  saveConfig: async (roleId, widgets) => {
    const res = await fetch(`${API_URL}/dashboard/configuracion/${roleId}`, { 
      method: 'PUT', 
      headers: getHeaders(),
      body: JSON.stringify({ widgets }) 
    });
    return res.json();
  }
};