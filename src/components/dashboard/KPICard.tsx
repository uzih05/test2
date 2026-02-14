/**
 * KPI Card Component
 */

'use client';

import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: number;
    label?: string;
  };
  icon?: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error';
  className?: string;
}

export function KPICard({
  title,
  value,
  subtitle,
  trend,
  icon,
  variant = 'default',
  className,
}: KPICardProps) {
  const variantStyles = {
    default: '',
    success: 'border-green-500/20 bg-green-500/[0.03]',
    warning: 'border-yellow-500/20 bg-yellow-500/[0.03]',
    error: 'border-red-500/20 bg-red-500/[0.03]',
  };

  const getTrendIcon = () => {
    if (!trend) return null;
    if (trend.value > 0) return <TrendingUp className="h-3 w-3" />;
    if (trend.value < 0) return <TrendingDown className="h-3 w-3" />;
    return <Minus className="h-3 w-3" />;
  };

  const getTrendColor = () => {
    if (!trend) return '';
    if (trend.value > 0) return 'text-green-500';
    if (trend.value < 0) return 'text-red-500';
    return 'text-muted-foreground';
  };

  return (
    <div
      className={cn(
        'rounded-2xl border border-white/[0.06] bg-card p-5 shadow-sm transition-all duration-300 hover:shadow-lg hover:shadow-primary/[0.05]',
        variantStyles[variant],
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold tracking-tight">{value}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
        {icon && (
          <div className="rounded-xl bg-white/[0.06] p-2.5 text-muted-foreground">
            {icon}
          </div>
        )}
      </div>

      {trend && (
        <div className={cn('mt-3 flex items-center gap-1 text-xs', getTrendColor())}>
          {getTrendIcon()}
          <span className="font-medium">
            {trend.value > 0 ? '+' : ''}
            {trend.value}%
          </span>
          {trend.label && (
            <span className="text-muted-foreground">{trend.label}</span>
          )}
        </div>
      )}
    </div>
  );
}
