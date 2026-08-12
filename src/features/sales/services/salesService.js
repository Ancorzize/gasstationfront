const API_URL = import.meta.env.VITE_API_URL;

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

export const salesService = {
  getSales: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams(params).toString();
      const response = await fetch(`${API_URL}/ventas?${queryParams}`, {
        method: 'GET',
        headers: getHeaders()
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching sales:", error);
      throw error;
    }
  },
  getSaleById: async (id) => {
    try {
      const response = await fetch(`${API_URL}/ventas/${id}`, {
        method: 'GET',
        headers: getHeaders()
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`Error fetching sale ${id}:`, error);
      throw error;
    }
  },
  anularSale: async (id, motivo) => {
    try {
      const response = await fetch(`${API_URL}/ventas/${id}/anular`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ motivo_anulacion: motivo })
      });
      const data = await response.json();
      
      if (response.status === 403) {
        throw new Error("No tienes permisos para anular ventas.");
      }
      
      return data;
    } catch (error) {
      console.error(`Error al anular venta ${id}:`, error);
      throw error;
    }
  }
};