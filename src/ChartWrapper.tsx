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
  '#1683FF', '#2DD4BF', '#FBBF24', '#A1A1AA', '#F87171', '#3898FF',
];

const tooltipStyle = {
  backgroundColor: 'var(--bg-secondary)',
  border: '1px solid var(--border-primary)',
  boxShadow: 'var(--shadow-md)',
  borderRadius: 8,
  fontSize: 12,
  fontWeight: 500,
  color: 'var(--text-primary)',
};

export default function ChartWrapper({
  type, data, height = 220, dataKey, xKey = 'name', colors = DEFAULT_COLORS,
  keys = [], labels = [], showGrid = true, showLegend = false,
}: ChartWrapperProps) {
  if (!data || data.length === 0) {
    return (
      <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 13, fontWeight: 500 }}>
        No data available
      </div>
    );
  }

  const axisStyle = { fill: 'var(--text-muted)', fontSize: 11, fontWeight: 500 };

  if (type === 'area') {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
          {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />}
          <XAxis dataKey={xKey} tick={axisStyle} axisLine={false} tickLine={false} />
          <YAxis tick={axisStyle} axisLine={false} tickLine={false} width={45} tickFormatter={(v) => `₹${v >= 1000 ? (v/1000).toFixed(0)+'k' : v}`} />
          <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => [`₹${Number(v ?? 0).toLocaleString('en-IN')}`, dataKey ?? 'Revenue']} />
          {showLegend && <Legend wrapperStyle={{ fontSize: 11, color: 'var(--text-secondary)' }} />}
          {(keys.length > 0 ? keys : [dataKey ?? 'value']).map((k, i) => (
            <Area key={k} type="monotone" dataKey={k} stroke={colors[i % colors.length]} fill={`${colors[i % colors.length]}20`} strokeWidth={2} dot={false} name={labels[i] ?? k} />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    );
  }

  if (type === 'bar') {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 4, right: 12, left: 0, bottom: 0 }} barSize={18}>
          {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />}
          <XAxis dataKey={xKey} tick={axisStyle} axisLine={false} tickLine={false} />
          <YAxis tick={axisStyle} axisLine={false} tickLine={false} width={45} />
          <Tooltip contentStyle={tooltipStyle} />
          {showLegend && <Legend wrapperStyle={{ fontSize: 11, color: 'var(--text-secondary)' }} />}
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
          {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />}
          <XAxis dataKey={xKey} tick={axisStyle} axisLine={false} tickLine={false} />
          <YAxis tick={axisStyle} axisLine={false} tickLine={false} width={45} />
          <Tooltip contentStyle={tooltipStyle} />
          {showLegend && <Legend wrapperStyle={{ fontSize: 11, color: 'var(--text-secondary)' }} />}
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
          {showLegend && <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, color: 'var(--text-secondary)' }} />}
        </PieChart>
      </ResponsiveContainer>
    );
  }

  return null;
}
