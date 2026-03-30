const API_URL = import.meta.env.VITE_API_URL;

export const userService = {
  getUsers: async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_URL}/usuarios`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Error al obtener usuarios');
      return result.data;
    } catch (error) {
      throw error;
    }
  },
  getRoles: async () => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/usuarios/roles`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });
    const result = await response.json();
    return result.data;
  },

  createUser: async (userData) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/usuarios`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userData)
    });
    return await response.json();
  },
  updateUser: async (id, userData) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/usuarios/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userData)
    });
    return await response.json();
  },
  deleteUser: async (id) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/usuarios/${id}`, {
        method: 'DELETE',
        headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
        }
    });
    return await response.json();
    },
   toggleStatus: async (id, newStatus) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/usuarios/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ is_active: newStatus })
    });
    return await response.json();
  }
};