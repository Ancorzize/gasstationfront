
const API_URL = import.meta.env.VITE_API_URL;

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

export const financialService = {
  getCapitalTrabajo: async (params = {}) => {

    const queryParams = new URLSearchParams({ indicador: 'capital-trabajo', ...params }).toString();
    const res = await fetch(`${API_URL}/indicadores-financieros?${queryParams}`, {
      headers: getHeaders()
    });
    return res.json();
  }
};