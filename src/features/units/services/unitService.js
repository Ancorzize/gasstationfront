const API_URL = import.meta.env.VITE_API_URL;

const getHeaders = () => ({
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'Authorization': `Bearer ${localStorage.getItem('token')}`
});

export const unitService = {
  getUnits: async (search = '', is_active = '') => {
    const params = new URLSearchParams({ search, is_active });
    const res = await fetch(`${API_URL}/unidades-medida?${params}`, { headers: getHeaders() });
    return res.json();
  },

  createUnit: async (data) => {
    const res = await fetch(`${API_URL}/unidades-medida`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  updateUnit: async (id, data) => {
    const res = await fetch(`${API_URL}/unidades-medida/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  toggleStatus: async (id, status) => {
    const res = await fetch(`${API_URL}/unidades-medida/${id}/status`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ is_active: status })
    });
    return res.json();
  },

  deleteUnit: async (id) => {
    const res = await fetch(`${API_URL}/unidades-medida/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return res.json();
  }
};