/**
 * Execution Timeline Chart
 */

'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { TimelineDataPoint } from '@/lib/types/api';

interface ExecutionTimelineProps {
  data: TimelineDataPoint[];
}

export function ExecutionTimeline({ data }: ExecutionTimelineProps) {
  const chartData = data.map((point) => ({
    ...point,
    time: new Date(point.timestamp).toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
    }),
  }));

  if (data.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center text-muted-foreground">
        No data available
      </div>
    );
  }

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorSuccess" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorError" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorCache" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" opacity={0.3} />
          <XAxis
            dataKey="time"
            tick={{ fill: '#9ca3af', fontSize: 12 }}
            axisLine={{ stroke: 'rgba(255,255,255,0.04)' }}
            tickLine={{ stroke: 'rgba(255,255,255,0.04)' }}
          />
          <YAxis
            tick={{ fill: '#9ca3af', fontSize: 12 }}
            axisLine={{ stroke: 'rgba(255,255,255,0.04)' }}
            tickLine={{ stroke: 'rgba(255,255,255,0.04)' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#171719',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              borderRadius: '12px',
            }}
            labelStyle={{ color: '#fff' }}
          />
          <Legend />
          <Area
            type="monotone"
            dataKey="success"
            name="Success"
            stroke="#22c55e"
            fillOpacity={1}
            fill="url(#colorSuccess)"
            stackId="1"
          />
          <Area
            type="monotone"
            dataKey="cache_hit"
            name="Cache Hit"
            stroke="#3b82f6"
            fillOpacity={1}
            fill="url(#colorCache)"
            stackId="1"
          />
          <Area
            type="monotone"
            dataKey="error"
            name="Error"
            stroke="#ef4444"
            fillOpacity={1}
            fill="url(#colorError)"
            stackId="1"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
