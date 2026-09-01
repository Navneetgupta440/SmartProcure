import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  color?: 'blue' | 'emerald' | 'amber' | 'purple' | 'rose' | 'slate' | 'indigo';
  trend?: {
    value: string;
    isPositive: boolean;
  };
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  color = 'indigo',
  trend,
  onClick,
}) => {
  const iconColorMap = {
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
    rose: 'bg-rose-50 text-rose-600 border-rose-100',
    slate: 'bg-slate-50 text-slate-700 border-slate-200',
  };

  const scheme = iconColorMap[color] || iconColorMap.indigo;

  return (
    <div
      onClick={onClick}
      className={`bg-white p-5 border border-slate-200 rounded-xl shadow-xs hover:shadow-md transition-all duration-200 ${
        onClick ? 'cursor-pointer hover:border-slate-300' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <span className="text-xs text-slate-500 font-medium uppercase tracking-tight">{title}</span>
          <div className="text-3xl font-bold mt-1 text-slate-900 tracking-tight">{value}</div>
          {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
          {trend && (
            <div className="flex items-center gap-1 mt-2 text-[10px] font-bold">
              <span className={trend.isPositive ? 'text-emerald-600' : 'text-rose-600'}>
                {trend.isPositive ? '↑' : '↓'} {trend.value}
              </span>
              <span className="text-slate-400 font-normal">vs previous cycle</span>
            </div>
          )}
        </div>
        <div className={`p-2.5 rounded-lg border ${scheme} shrink-0`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
};

