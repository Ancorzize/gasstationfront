const API_URL = import.meta.env.VITE_API_URL;

const getHeaders = () => ({
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'Authorization': `Bearer ${localStorage.getItem('token')}`
});

export const warehouseService = {
  getWarehouses: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_URL}/bodegas?${query}`, { headers: getHeaders() });
    return res.json();
  },

  createWarehouse: async (data) => {
    const res = await fetch(`${API_URL}/bodegas`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  updateWarehouse: async (id, data) => {
    const res = await fetch(`${API_URL}/bodegas/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  toggleStatus: async (id, status) => {
    const res = await fetch(`${API_URL}/bodegas/${id}/status`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ is_active: status })
    });
    return res.json();
  },

  deleteWarehouse: async (id) => {
    const res = await fetch(`${API_URL}/bodegas/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return res.json();
  }
};