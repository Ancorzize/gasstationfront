import React from 'react';
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, 
  ResponsiveContainer, CartesianGrid, Legend 
} from 'recharts';

export const DashboardCharts = ({ tipo, data }) => {

  if (!data.items || data.items.length === 0) {
    return <div className="h-48 flex items-center justify-center text-slate-400 text-xs">Sin datos disponibles</div>;
  }

  const keys = Object.keys(data.items[0]);
  const barColor = "#3b82f6";
  const lineColor = "#10b981";

  if (tipo === 'bar' || (data.labels && !data.series?.some(s => typeof s === 'object'))) {
    return (
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data.items}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey={Object.keys(data.items[0])[0]} fontSize={10} />
          <YAxis fontSize={10} />
          <Tooltip />
          <Bar dataKey={Object.keys(data.items[0])[1]} fill={barColor} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data.items}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="fecha" fontSize={10} />
        <YAxis fontSize={10} />
        <Tooltip />
        <Legend fontSize={10} />
        {data.series?.map((s, i) => (
          <Line key={i} type="monotone" dataKey="total" data={s.data} stroke={lineColor} />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
};