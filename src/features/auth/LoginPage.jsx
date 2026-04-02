import React, { useState, useEffect } from 'react';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { authService } from './services/authService';
import { companyService } from '../settings/services/companyService';
import fondoImage from '../../images/fondo1.jpg';
import logoDefault from '../../images/logoGranjas.png';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

export const LoginPage = () => {
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Estado para toda la configuración de la empresa
  const [companyConfig, setCompanyConfig] = useState({
    logo_url: null,
    nombre_empresa: 'Sistema de Gestión' // Valor por defecto inicial
  });

  const navigate = useNavigate();

  useEffect(() => {
    const fetchCompanyData = async () => {
      try {
        const response = await companyService.getConfig();
        if (response.status && response.data) {
          setCompanyConfig({
            logo_url: response.data.logo_url,
            nombre_empresa: response.data.nombre_empresa
          });
        }
      } catch (err) {
        console.error("Error cargando configuración inicial:", err);
      }
    };
    fetchCompanyData();
  }, []);

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
      setError(err.message || "Error de autenticación");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
     className="min-h-screen flex items-center justify-center p-4 bg-cover bg-center bg-no-repeat"
      style={{ 
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url(${fondoImage})`,
        filter: 'brightness(1.1)' 
      }}
    >
      <div className="max-w-md w-full bg-zinc-900/40 backdrop-blur-xl p-10 rounded-[3rem] border border-white/5 shadow-2xl">
        
        <div className="flex flex-col items-center mb-10">
          <div className="w-64 h-32 flex items-center justify-center overflow-hidden">
            <img 
              src={companyConfig.logo_url || logoDefault} 
              alt={companyConfig.nombre_empresa} 
              className="max-w-full max-h-full object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.1)] transition-all duration-700"
            />
          </div>
          
          <div className="h-1 w-12 bg-yellow-500 rounded-full mt-6 opacity-40"></div>
          
          <p className="text-zinc-400 text-[9px] uppercase tracking-[0.3em] mt-4 font-black">
            Portal Administrativo
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-2xl text-xs text-center font-bold uppercase tracking-wider">
              {error}
            </div>
          )}

          <Input 
            label="Usuario / Email"
            name="email"
            type="email"
            value={credentials.email}
            onChange={handleChange}
            required
            className="bg-white/5 border-white/10 text-white rounded-2xl"
          />

          <Input 
            label="Contraseña"
            name="password"
            type="password"
            value={credentials.password}
            onChange={handleChange}
            required
            className="bg-white/5 border-white/10 text-white rounded-2xl"
          />

          <div className="pt-4">
            <Button 
              type="submit" 
              disabled={loading}
              className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-black py-4 rounded-2xl shadow-xl transition-all"
            >
              {loading ? <Loader2 className="animate-spin mx-auto" size={20} /> : "INICIAR SESIÓN"}
            </Button>
          </div>
        </form>

        {/* Footer Dinámico */}
        <p className="text-center mt-10 text-zinc-500 text-[10px] font-medium uppercase tracking-widest">
          © {new Date().getFullYear()} {companyConfig.nombre_empresa}
        </p>
      </div>
    </div>
  );
};