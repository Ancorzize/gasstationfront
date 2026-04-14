const API_URL = import.meta.env.VITE_API_URL;

const getHeaders = () => ({
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'Authorization': `Bearer ${localStorage.getItem('token')}`
});

export const supplierService = {
  getSuppliers: async (params = {}) => {
    const cleanParams = {};
    Object.keys(params).forEach(key => {
      if (params[key] !== null && params[key] !== undefined) {
        cleanParams[key] = typeof params[key] === 'object' ? '' : params[key];
      }
    });

    const query = new URLSearchParams(cleanParams).toString();
    const res = await fetch(`${API_URL}/proveedores?${query}`, { 
      method: 'GET',
      headers: getHeaders() 
    });
    return res.json();
  },

  createSupplier: async (data) => {
    const res = await fetch(`${API_URL}/proveedores`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  updateSupplier: async (id, data) => {
    const res = await fetch(`${API_URL}/proveedores/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  toggleStatus: async (id, status) => {
    const res = await fetch(`${API_URL}/proveedores/${id}/status`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ is_active: status })
    });
    return res.json();
  }
};