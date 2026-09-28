const API_URL = import.meta.env.VITE_API_URL;

const getHeaders = () => ({
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'Authorization': `Bearer ${localStorage.getItem('token')}`
});

export const resolucionesFacturacionService = {
  getResoluciones: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.search) params.append('search', filters.search);
    if (filters.tipo_documento) params.append('tipo_documento', filters.tipo_documento);
    if (filters.proveedor) params.append('proveedor', filters.proveedor);
    if (filters.ambiente) params.append('ambiente', filters.ambiente);
    if (filters.is_active !== undefined && filters.is_active !== null && filters.is_active !== '') {
      params.append('is_active', filters.is_active);
    }
    const res = await fetch(`${API_URL}/resoluciones-facturacion?${params.toString()}`, {
      headers: getHeaders()
    });
    return res.json();
  },

  getResolucionById: async (id) => {
    const res = await fetch(`${API_URL}/resoluciones-facturacion/${id}`, {
      headers: getHeaders()
    });
    return res.json();
  },

  createResolucion: async (data) => {
    const res = await fetch(`${API_URL}/resoluciones-facturacion`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  updateResolucion: async (id, data) => {
    const res = await fetch(`${API_URL}/resoluciones-facturacion/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  deleteResolucion: async (id) => {
    const res = await fetch(`${API_URL}/resoluciones-facturacion/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return res.json();
  }
};
