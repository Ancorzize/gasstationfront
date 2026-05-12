const API_URL = import.meta.env.VITE_API_URL;

const getHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${localStorage.getItem('token')}`
});

export const fuelPriceService = {
  getPrices: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_URL}/precios-combustible?${query}`, { headers: getHeaders() });
    return res.json();
  },

  createPrice: async (data) => {
    const res = await fetch(`${API_URL}/precios-combustible`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  toggleStatus: async (id, status) => {
    const res = await fetch(`${API_URL}/precios-combustible/${id}/status`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ is_active: status })
    });
    return res.json();
  }
};