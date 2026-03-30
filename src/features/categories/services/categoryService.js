const API_URL = import.meta.env.VITE_API_URL;

const getHeaders = () => ({
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'Authorization': `Bearer ${localStorage.getItem('token')}`
});

export const categoryService = {
  getCategories: async (search = '', is_active = '') => {
    const params = new URLSearchParams({ search, is_active });
    const res = await fetch(`${API_URL}/categorias-producto?${params}`, { headers: getHeaders() });
    return res.json();
  },

  createCategory: async (data) => {
    const res = await fetch(`${API_URL}/categorias-producto`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  updateCategory: async (id, data) => {
    const res = await fetch(`${API_URL}/categorias-producto/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  toggleStatus: async (id, status) => {
    const res = await fetch(`${API_URL}/categorias-producto/${id}/status`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ is_active: status })
    });
    return res.json();
  },

  deleteCategory: async (id) => {
    const res = await fetch(`${API_URL}/categorias-producto/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return res.json();
  }
};