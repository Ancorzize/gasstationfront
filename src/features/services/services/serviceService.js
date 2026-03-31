const API_URL = import.meta.env.VITE_API_URL;

const getHeaders = () => ({
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'Authorization': `Bearer ${localStorage.getItem('token')}`
});

export const serviceService = {
  getServices: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_URL}/servicios?${query}`, { headers: getHeaders() });
    return res.json();
  },

  createService: async (data) => {
    const res = await fetch(`${API_URL}/servicios`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  updateService: async (id, data) => {
    const res = await fetch(`${API_URL}/servicios/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  toggleStatus: async (id, status) => {
    const res = await fetch(`${API_URL}/servicios/${id}/status`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ is_active: status })
    });
    return res.json();
  },

  deleteService: async (id) => {
    const res = await fetch(`${API_URL}/servicios/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return res.json();
  }
};