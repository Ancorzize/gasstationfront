import React from 'react';
import { StatCard } from '../../components/StatCard';
import { DollarSign, Package, Users, TrendingUp, AlertTriangle } from 'lucide-react';

export const DashboardPage = () => {
  return (
    <div className="space-y-8">

      <div>
        <h1 className="text-2xl font-bold text-slate-800">Resumen de Operaciones</h1>
        <p className="text-slate-500">Bienvenido de nuevo, esto es lo que está pasando hoy.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Ventas del Mes" 
          value="$12.450.000" 
          icon={DollarSign} 
          trend={12} 
          color="bg-blue-500" 
        />
        <StatCard 
          title="Productos en Stock" 
          value="1,240" 
          icon={Package} 
          color="bg-yellow-500" 
        />
        <StatCard 
          title="Clientes Nuevos" 
          value="48" 
          icon={Users} 
          trend={5} 
          color="bg-purple-500" 
        />
        <StatCard 
          title="Servicios Realizados" 
          value="156" 
          icon={TrendingUp} 
          trend={-2} 
          color="bg-green-500" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-bold text-slate-800">Stock Crítico (Lubricantes)</h3>
            <button className="text-yellow-600 text-sm font-bold hover:underline">Ver todo</button>
          </div>
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-400 text-[10px] uppercase tracking-widest">
              <tr>
                <th className="px-6 py-3">Producto</th>
                <th className="px-6 py-3">Existencia</th>
                <th className="px-6 py-3">Estado</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-slate-100">
              <tr>
                <td className="px-6 py-4 font-medium">Aceite Sintético 5W-30</td>
                <td className="px-6 py-4">5 Und</td>
                <td className="px-6 py-4">
                  <span className="text-red-500 flex items-center gap-1 font-bold italic">
                    <AlertTriangle size={14} /> RELLENAR
                  </span>
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 font-medium">Filtro de Aire Premium</td>
                <td className="px-6 py-4">12 Und</td>
                <td className="px-6 py-4 text-orange-500 font-bold">BAJO</td>
              </tr>
            </tbody>
          </table>
        </div>


        <div className="bg-zinc-900 rounded-2xl p-6 text-white relative overflow-hidden group">
          <div className="relative z-10">
            <h3 className="text-xl font-bold italic mb-2">Acceso Rápido</h3>
            <p className="text-zinc-400 text-sm mb-6">Genera una nueva factura de venta en segundos.</p>
            <button className="w-full bg-yellow-500 text-black font-bold py-3 rounded-xl hover:bg-yellow-400 transition-colors">
              NUEVA VENTA
            </button>
          </div>
  
          <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-yellow-500 opacity-10 rounded-full group-hover:scale-125 transition-transform duration-500"></div>
        </div>
      </div>
    </div>
  );
};