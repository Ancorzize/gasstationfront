import React, { useState } from 'react';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { authService } from './services/authService';
import fondoImage from '../../images/fondo1.jpg';
import logoEmpresa from '../../images/logoGranjas.png';
import { useNavigate } from 'react-router-dom';

export const LoginPage = () => {
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {

      const response = await authService.login(credentials.email, credentials.password);
      
      if (response.status) {

        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 bg-cover bg-center bg-no-repeat"
      style={{ 
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)), url(${fondoImage})` 
      }}
    >

      <div className="max-w-md w-full bg-zinc-900/30 backdrop-blur-md p-10 rounded-3xl border border-white/10 shadow-2xl">
        
        <div className="flex flex-col items-center mb-10">
          <img 
            src={logoEmpresa} 
            alt="Logo Granjas" 
            className="w-64 h-auto object-contain drop-shadow-[0_0_10px_rgba(250,204,21,0.2)]"
          />
          <div className="h-1 w-20 bg-yellow-500 rounded-full mt-4 opacity-50"></div>
          <p className="text-zinc-500 text-[10px] uppercase tracking-[0.2em] mt-3 font-bold">
            Portal Administrativo
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500 text-red-500 p-3 rounded-lg text-sm text-center">
              {error}
            </div>
          )}

          <Input 
            label="Usuario / Email"
            name="email"
            type="email"
            placeholder="ejemplo@correo.com"
            value={credentials.email}
            onChange={handleChange}
            required
          />

          <Input 
            label="Contraseña"
            name="password"
            type="password"
            placeholder="••••••••"
            value={credentials.password}
            onChange={handleChange}
            required
          />

          <div className="pt-4">
            <Button type="submit" disabled={loading}>
              {loading ? "Cargando..." : "Iniciar Sesión"}
            </Button>
          </div>
        </form>

        <p className="text-center mt-8 text-zinc-600 text-xs">
          © 2026 Sistema de Gestión de Inventarios
        </p>
      </div>
    </div>
  );
};