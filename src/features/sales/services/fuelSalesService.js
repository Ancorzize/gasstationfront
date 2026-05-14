const API_URL = import.meta.env.VITE_API_URL;

const getHeaders = () => ({
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'Authorization': `Bearer ${localStorage.getItem('token')}`
});

export const fuelSalesService = {
  createSale: async (data) => {
    const res = await fetch(`${API_URL}/ventas`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },
  getLubricants: async () => {
    const res = await fetch(`${API_URL}/productos?categoria=lubricantes`, {
      headers: getHeaders()
    });
    return res.json();
  },
  createFuelSale: async (data) => {
    const res = await fetch(`${API_URL}/ventas/combustible`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(data)
    });
    return res.json();
  },
   createGeneralSale: async (data) => {
    const res = await fetch(`${API_URL}/ventas`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  }
};
