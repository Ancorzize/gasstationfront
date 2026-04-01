const API_URL = import.meta.env.VITE_API_URL;

const getHeaders = () => ({
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'Authorization': `Bearer ${localStorage.getItem('token')}`
});

export const companyService = {
  // Obtener configuración única
  getConfig: async () => {
    const res = await fetch(`${API_URL}/configuracion-empresa`, { headers: getHeaders() });
    return res.json();
  },

  // Crear o Actualizar (PUT según tu doc)
  updateConfig: async (data) => {
    const res = await fetch(`${API_URL}/configuracion-empresa`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  // Catálogos de ubicación
  getCountries: async () => {
    const res = await fetch(`${API_URL}/ubicaciones/paises`, { headers: getHeaders() });
    return res.json();
  },
  getDepartments: async (countryId) => {
    const res = await fetch(`${API_URL}/ubicaciones/paises/${countryId}/departamentos`, { headers: getHeaders() });
    return res.json();
  },
  getCities: async (deptId) => {
    const res = await fetch(`${API_URL}/ubicaciones/departamentos/${deptId}/ciudades`, { headers: getHeaders() });
    return res.json();
  }
};