const API_URL = import.meta.env.VITE_API_URL;

export const authService = {
  login: async (email, password) => {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();

      if (result.status === true) {
        localStorage.setItem('token', result.data.token);
        localStorage.setItem('user', JSON.stringify(result.data.user));
        
        localStorage.setItem('permissions', JSON.stringify(result.data.permissions || []));
        
        return result; 
      } else {
        throw new Error(result.message || 'Error en la autenticación');
      }
    } catch (error) {
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('permissions');
    window.location.href = '/login';
  },

  getToken: () => {
    return localStorage.getItem('token');
  }
};