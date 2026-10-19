// ChartWrapper — thin wrapper around recharts to keep imports centralized
import React from 'react';
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, Area, AreaChart,
} from 'recharts';

interface ChartWrapperProps {
  type: 'area' | 'bar' | 'pie' | 'line';
  data: Record<string, string | number>[];
  height?: number;
  dataKey?: string;
  xKey?: string;
  colors?: string[];
  keys?: string[];
  labels?: string[];
  showGrid?: boolean;
  showLegend?: boolean;
}

const DEFAULT_COLORS = [
  '#C6FF00', '#38BDF8', '#22C55E', '#F59E0B', '#FB7185', '#A78BFA',
];

const tooltipStyle = {
  backgroundColor: '#1B1F27',
  border: '1px solid rgba(255, 255, 255, 0.15)',
  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.6)',
  borderRadius: 6,
  fontSize: 12,
  fontWeight: 600,
  color: '#F4F6F8',
};

export default function ChartWrapper({
  type, data, height = 220, dataKey, xKey = 'name', colors = DEFAULT_COLORS,
  keys = [], labels = [], showGrid = true, showLegend = false,
}: ChartWrapperProps) {
  if (!data || data.length === 0) {
    return (
      <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)', fontSize: 13, fontWeight: 500 }}>
        No data available
      </div>
    );
  }

  const axisStyle = { fill: '#64748B', fontSize: 11, fontWeight: 500 };

  if (type === 'area') {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
          {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" vertical={false} />}
          <XAxis dataKey={xKey} tick={axisStyle} axisLine={false} tickLine={false} />
          <YAxis tick={axisStyle} axisLine={false} tickLine={false} width={45} tickFormatter={(v) => `₹${v >= 1000 ? (v/1000).toFixed(0)+'k' : v}`} />
          <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => [`₹${Number(v ?? 0).toLocaleString('en-IN')}`, dataKey ?? 'Revenue']} />
          {showLegend && <Legend wrapperStyle={{ fontSize: 11, color: '#94A3B8' }} />}
          {(keys.length > 0 ? keys : [dataKey ?? 'value']).map((k, i) => (
            <Area key={k} type="monotone" dataKey={k} stroke={colors[i % colors.length]} fill={`${colors[i % colors.length]}18`} strokeWidth={2} dot={false} name={labels[i] ?? k} />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    );
  }

  if (type === 'bar') {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 4, right: 12, left: 0, bottom: 0 }} barSize={18}>
          {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" vertical={false} />}
          <XAxis dataKey={xKey} tick={axisStyle} axisLine={false} tickLine={false} />
          <YAxis tick={axisStyle} axisLine={false} tickLine={false} width={45} />
          <Tooltip contentStyle={tooltipStyle} />
          {showLegend && <Legend wrapperStyle={{ fontSize: 11, color: '#94A3B8' }} />}
          {(keys.length > 0 ? keys : [dataKey ?? 'value']).map((k, i) => (
            <Bar key={k} dataKey={k} fill={colors[i % colors.length]} radius={[4, 4, 0, 0]} name={labels[i] ?? k} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    );
  }

  if (type === 'line') {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
          {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" vertical={false} />}
          <XAxis dataKey={xKey} tick={axisStyle} axisLine={false} tickLine={false} />
          <YAxis tick={axisStyle} axisLine={false} tickLine={false} width={45} />
          <Tooltip contentStyle={tooltipStyle} />
          {showLegend && <Legend wrapperStyle={{ fontSize: 11, color: '#94A3B8' }} />}
          {(keys.length > 0 ? keys : [dataKey ?? 'value']).map((k, i) => (
            <Line key={k} type="monotone" dataKey={k} stroke={colors[i % colors.length]} strokeWidth={2} dot={{ fill: colors[i % colors.length], r: 3 }} name={labels[i] ?? k} />
          ))}
        </LineChart>
      </ResponsiveContainer>
    );
  }

  if (type === 'pie') {
    const pieData = data.map((d, i) => ({ ...d, fill: colors[i % colors.length] }));
    return (
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={pieData}
            cx="50%" cy="50%"
            outerRadius={Math.min(height / 2 - 20, 80)}
            dataKey={dataKey ?? 'value'}
            nameKey={xKey}
            paddingAngle={2}
          >
            {pieData.map((entry, i) => (
              <Cell key={i} fill={entry.fill as string} />
            ))}
          </Pie>
          <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => [`₹${Number(v ?? 0).toLocaleString('en-IN')}`, '']} />
          {showLegend && <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, color: '#8892aa' }} />}
        </PieChart>
      </ResponsiveContainer>
    );
  }

  return null;
}
