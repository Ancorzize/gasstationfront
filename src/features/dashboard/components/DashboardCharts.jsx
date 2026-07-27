import React from 'react';
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, 
  ResponsiveContainer, CartesianGrid, Legend 
} from 'recharts';

export const DashboardCharts = ({ tipo, data }) => {

  if (!data.items && data.actual !== undefined) {
    return (
      <div className="flex flex-col items-center justify-center h-48">
        <span className="text-2xl font-black text-zinc-900">$ {data.actual?.toLocaleString('es-CO')}</span>
        <span className="text-[10px] font-bold text-slate-400 uppercase mt-1">
          Anterior: $ {data.anterior?.toLocaleString('es-CO')} ({data.porcentaje}%)
        </span>
      </div>
    );
  }

  if (!data.items || data.items.length === 0) {
    return <div className="h-48 flex items-center justify-center text-slate-400 text-xs">Sin datos disponibles</div>;
  }

  if (tipo === 'line') {
    return (
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data.items} margin={{ bottom: 25, right: 10 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis 
            dataKey="label" 
            fontSize={10} 
            angle={-35} 
            textAnchor="end" 
            height={45} 
          />
          <YAxis fontSize={10} />
          <Tooltip />
          <Legend wrapperStyle={{ fontSize: '10px' }} />
          <Line type="monotone" dataKey="ingresos" name="Ingresos" stroke="#10b981" strokeWidth={2} />
          <Line type="monotone" dataKey="egresos" name="Egresos" stroke="#ef4444" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data.items} margin={{ bottom: 25, right: 10 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis 
          dataKey="label" 
          fontSize={10} 
          interval={0} 
          angle={-35} 
          textAnchor="end" 
          height={50} 
        />
        <YAxis fontSize={10} />
        <Tooltip formatter={(value) => [`$ ${Number(value).toLocaleString('es-CO')}`, 'Valor']} />
        <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
};