import React from 'react';
import { Sidebar } from '../components/Sidebar';

export const MainLayout = ({ children }) => {
  return (
    <div className="flex h-screen w-full bg-white overflow-hidden">
      {/* El Sidebar ya maneja su propia posición fixed/relative internamente */}
      <Sidebar />

      <main className="flex-1 relative flex flex-col min-w-0 bg-[#f8fafc] overflow-hidden">
        
        {/* HEADER: Ajustado para móvil */}
        <header className="h-16 border-b border-slate-200 bg-white/80 backdrop-blur-md px-4 md:px-8 flex items-center justify-between z-10">
          <div className="flex items-center gap-4">
            {/* Espacio reservado para el botón del sidebar en móvil (pl-10 o pl-12) */}
            <h2 className="text-slate-800 font-bold text-[10px] md:text-sm tracking-tight uppercase ml-12 md:ml-0">
              Panel Administrativo
            </h2>
          </div>
          
          <div className="hidden sm:flex items-center gap-4 text-slate-400">
            <div className="w-px h-4 bg-slate-200" />
            <span className="text-[10px] md:text-xs font-medium uppercase tracking-wider">
              {new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
            </span>
          </div>
        </header>

        {/* CONTENIDO PRINCIPAL: Reducimos el padding en móvil */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar-light">
          <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-2 duration-700">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};