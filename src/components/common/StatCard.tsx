import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  id?: string;
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  colorScheme?: 'indigo' | 'emerald' | 'amber' | 'rose' | 'sky' | 'purple';
}

const colorStyles = {
  indigo: {
    bg: 'bg-indigo-50/70',
    iconBg: 'bg-indigo-600 text-white',
    text: 'text-indigo-900',
    border: 'border-indigo-100'
  },
  emerald: {
    bg: 'bg-emerald-50/70',
    iconBg: 'bg-emerald-600 text-white',
    text: 'text-emerald-900',
    border: 'border-emerald-100'
  },
  amber: {
    bg: 'bg-amber-50/70',
    iconBg: 'bg-amber-600 text-white',
    text: 'text-amber-900',
    border: 'border-amber-100'
  },
  rose: {
    bg: 'bg-rose-50/70',
    iconBg: 'bg-rose-600 text-white',
    text: 'text-rose-900',
    border: 'border-rose-100'
  },
  sky: {
    bg: 'bg-sky-50/70',
    iconBg: 'bg-sky-600 text-white',
    text: 'text-sky-900',
    border: 'border-sky-100'
  },
  purple: {
    bg: 'bg-purple-50/70',
    iconBg: 'bg-purple-600 text-white',
    text: 'text-purple-900',
    border: 'border-purple-100'
  }
};

export const StatCard: React.FC<StatCardProps> = ({
  id,
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  colorScheme = 'indigo'
}) => {
  const scheme = colorStyles[colorScheme] || colorStyles.indigo;

  return (
    <div
      id={id}
      className={`bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
            {title}
          </p>
          <h3 className="text-2xl font-bold text-slate-900 tracking-tight">
            {value}
          </h3>
          {subtitle && (
            <p className="text-xs text-slate-500 mt-1.5 flex items-center gap-1">
              {subtitle}
            </p>
          )}
          {trend && (
            <div className="flex items-center gap-1.5 mt-2">
              <span
                className={`text-xs font-semibold px-1.5 py-0.5 rounded ${
                  trend.isPositive
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-rose-100 text-rose-700'
                }`}
              >
                {trend.value}
              </span>
              <span className="text-xs text-slate-400">vs target</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-lg ${scheme.iconBg} shadow-xs`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
};
