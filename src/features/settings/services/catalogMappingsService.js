const API_URL = import.meta.env.VITE_API_URL;

const getHeaders = () => ({
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'Authorization': `Bearer ${localStorage.getItem('token')}`
});

export const catalogMappingsService = {
  getMapeos: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.search) params.append('search', filters.search);
    if (filters.proveedor) params.append('proveedor', filters.proveedor);
    if (filters.categoria) params.append('categoria', filters.categoria);
    if (filters.codigo_interno) params.append('codigo_interno', filters.codigo_interno);
    if (filters.is_active !== undefined && filters.is_active !== null && filters.is_active !== '') {
      params.append('is_active', filters.is_active);
    }
    const res = await fetch(`${API_URL}/mapeos-catalogos?${params.toString()}`, {
      headers: getHeaders()
    });
    return res.json();
  },

  getMapeoById: async (id) => {
    const res = await fetch(`${API_URL}/mapeos-catalogos/${id}`, {
      headers: getHeaders()
    });
    return res.json();
  },

  createMapeo: async (data) => {
    const res = await fetch(`${API_URL}/mapeos-catalogos`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  updateMapeo: async (id, data) => {
    const res = await fetch(`${API_URL}/mapeos-catalogos/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  deleteMapeo: async (id) => {
    const res = await fetch(`${API_URL}/mapeos-catalogos/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return res.json();
  }
};
