const API_URL = import.meta.env.VITE_API_URL;

const getHeaders = () => ({
  'Accept': 'application/json',
  'Authorization': `Bearer ${localStorage.getItem('token')}`
});

export const companyService = {
  getConfig: async () => {
    const res = await fetch(`${API_URL}/configuracion-empresa`, { 
      headers: { ...getHeaders(), 'Content-Type': 'application/json' } 
    });
    return res.json();
  },

  updateConfig: async (formData) => {
    const res = await fetch(`${API_URL}/configuracion-empresa`, {
      method: 'POST', 
      headers: getHeaders(), 
      body: formData
    });
    return res.json();
  },

  getCountries: async () => {
    const res = await fetch(`${API_URL}/ubicaciones/paises`, { 
      headers: { ...getHeaders(), 'Content-Type': 'application/json' } 
    });
    return res.json();
  },
  getDepartments: async (id) => {
    const res = await fetch(`${API_URL}/ubicaciones/paises/${id}/departamentos`, { 
      headers: { ...getHeaders(), 'Content-Type': 'application/json' } 
    });
    return res.json();
  },
  getCities: async (id) => {
    const res = await fetch(`${API_URL}/ubicaciones/departamentos/${id}/ciudades`, { 
      headers: { ...getHeaders(), 'Content-Type': 'application/json' } 
    });
    return res.json();
  }
};