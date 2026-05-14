const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const getHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${localStorage.getItem('token')}`
});

export const clientService = {
  getClients: async ({ search = '', page = 1, is_active = '', per_page = 10 } = {}) => {
    const params = new URLSearchParams();
    
    if (search) params.append('search', search);
    if (page) params.append('page', page);
    if (per_page) params.append('per_page', per_page);
    if (is_active !== '') params.append('is_active', is_active);

    const res = await fetch(`${API_URL}/clientes?${params.toString()}`, { 
      headers: getHeaders() 
    });
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
  },

  configureCredit: async (id, data) => {
    const res = await fetch(`${API_URL}/clientes/${id}/credito`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({
        maneja_credito: data.maneja_credito,
        cupo_credito: data.cupo_credito,
        dias_credito: data.dias_credito
      })
    });
    return res.json();
  },

  getStatement: async (id) => {
    const res = await fetch(`${API_URL}/clientes/${id}/estado-cuenta`, { 
      headers: getHeaders() 
    });
    return res.json();
  }

};