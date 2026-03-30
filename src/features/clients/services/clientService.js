const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const getHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${localStorage.getItem('token')}`
});

export const clientService = {
  // Listar con filtros y paginación
  getClients: async (search = '', page = 1, is_active = '') => {
    const params = new URLSearchParams({
      search,
      page,
      per_page: 10,
      ...(is_active !== '' && { is_active })
    });
    const res = await fetch(`${API_URL}/clientes?${params}`, { headers: getHeaders() });
    return res.json();
  },

  createClient: async (data) => {
    const res = await fetch(`${API_URL}/clientes`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  updateClient: async (id, data) => {
    const res = await fetch(`${API_URL}/clientes/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  toggleStatus: async (id, status) => {
    const res = await fetch(`${API_URL}/clientes/${id}/status`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ is_active: status })
    });
    return res.json();
  }
};