import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number | null | undefined;
  secondaryText?: string;
  icon: LucideIcon;
  badge?: {
    text: string;
    variant: 'danger' | 'warning' | 'success' | 'neutral' | 'info';
  };
  hasData?: boolean;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  secondaryText,
  icon: Icon,
  badge,
  hasData = true,
}) => {
  const badgeColors = {
    danger: 'bg-rose-50 text-rose-700 border-rose-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    info: 'bg-blue-50 text-blue-700 border-blue-200',
    neutral: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  const isAwaiting = !hasData || value === null || value === undefined;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col justify-between transition hover:border-slate-300">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium uppercase tracking-wider text-slate-500">{title}</span>
        <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-600">
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div className="mt-1">
        {isAwaiting ? (
          <div>
            <div className="text-lg font-semibold text-slate-400">Awaiting data</div>
            <p className="text-xs text-slate-400 mt-1">No operational data connected</p>
          </div>
        ) : (
          <div>
            <div className="text-2xl font-bold tracking-tight text-slate-900">{value}</div>
            {secondaryText && <p className="text-xs text-slate-500 mt-1">{secondaryText}</p>}
          </div>
        )}
      </div>

      {badge && !isAwaiting && (
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${badgeColors[badge.variant]}`}>
            {badge.text}
          </span>
        </div>
      )}
    </div>
  );
};

