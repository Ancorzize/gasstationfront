const API_URL = import.meta.env.VITE_API_URL;

const getHeaders = () => ({
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'Authorization': `Bearer ${localStorage.getItem('token')}`
});

export const purchasePaymentService = {
  getPayments: async (params = {}) => {
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([_, v]) => v !== '' && v !== null && v !== undefined)
    );
    const query = new URLSearchParams(cleanParams).toString();
    const res = await fetch(`${API_URL}/pagos-compra?${query}`, { 
      headers: getHeaders() 
    });
    return res.json();
  },

  getPaymentById: async (id) => {
    const res = await fetch(`${API_URL}/pagos-compra/${id}`, { 
      headers: getHeaders() 
    });
    return res.json();
  }
};