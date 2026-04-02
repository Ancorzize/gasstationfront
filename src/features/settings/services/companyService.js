const API_URL = import.meta.env.VITE_API_URL;

const getHeaders = () => ({
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'Authorization': `Bearer ${localStorage.getItem('token')}`
});

export const companyService = {
  getConfig: async () => {
    const res = await fetch(`${API_URL}/configuracion-empresa`, { headers: getHeaders() });
    return res.json();
  },

  uploadLogo: async (file) => {
    const formData = new FormData();
    formData.append('logo', file);

    const res = await fetch(`${API_URL}/uploads/logo`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: formData
    });
    return res.json();
  },

  updateConfig: async (data) => {
    const res = await fetch(`${API_URL}/configuracion-empresa`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  getCountries: async () => {
    const res = await fetch(`${API_URL}/ubicaciones/paises`, { headers: getHeaders() });
    return res.json();
  },
  getDepartments: async (id) => {
    const res = await fetch(`${API_URL}/ubicaciones/paises/${id}/departamentos`, { headers: getHeaders() });
    return res.json();
  },
  getCities: async (id) => {
    const res = await fetch(`${API_URL}/ubicaciones/departamentos/${id}/ciudades`, { headers: getHeaders() });
    return res.json();
  }
};