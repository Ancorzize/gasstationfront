const API_URL = import.meta.env.VITE_API_URL;

const getHeaders = () => ({
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'Authorization': `Bearer ${localStorage.getItem('token')}`
});

export const expenseService = {
  // Categorías
  getCategories: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_URL}/categorias-gasto?${query}`, { headers: getHeaders() });
    return res.json();
  },
  createCategory: async (data) => {
    const res = await fetch(`${API_URL}/categorias-gasto`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },
  updateCategoryStatus: async (id, isActive) => {
    const res = await fetch(`${API_URL}/categorias-gasto/${id}/status`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ is_active: isActive })
    });
    return res.json();
  },

  // Gastos
  getExpenses: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_URL}/gastos?${query}`, { headers: getHeaders() });
    return res.json();
  },
  createExpense: async (data) => {
    const res = await fetch(`${API_URL}/gastos`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  }
};