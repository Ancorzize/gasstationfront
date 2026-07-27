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
  }
};