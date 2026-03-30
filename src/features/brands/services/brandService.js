const API_URL = import.meta.env.VITE_API_URL;

const getHeaders = () => ({
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'Authorization': `Bearer ${localStorage.getItem('token')}`
});

export const brandService = {
  getBrands: async (search = '', is_active = '') => {
    const params = new URLSearchParams({ search, is_active });
    const res = await fetch(`${API_URL}/marcas?${params}`, { headers: getHeaders() });
    return res.json();
  },

  createBrand: async (data) => {
    const res = await fetch(`${API_URL}/marcas`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  updateBrand: async (id, data) => {
    const res = await fetch(`${API_URL}/marcas/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  toggleStatus: async (id, status) => {
    const res = await fetch(`${API_URL}/marcas/${id}/status`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ is_active: status })
    });
    return res.json();
  },

  deleteBrand: async (id) => {
    const res = await fetch(`${API_URL}/marcas/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return res.json();
  }
};