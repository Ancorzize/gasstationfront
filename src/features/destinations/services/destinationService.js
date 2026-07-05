
export const destinationService = {
  getDestinos: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${import.meta.env.VITE_API_URL}/destinos-recaudo?${query}`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    return res.json();
  },

  createDestino: async (data) => {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/destinos-recaudo`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}` 
      },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  updateDestino: async (id, data) => {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/destinos-recaudo/${id}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}` 
      },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  toggleStatus: async (id, status) => {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/destinos-recaudo/${id}/status`, {
      method: 'PATCH',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}` 
      },
      body: JSON.stringify({ is_active: status })
    });
    return res.json();
  },

  deleteDestino: async (id) => {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/destinos-recaudo/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    return res.json();
  }
};