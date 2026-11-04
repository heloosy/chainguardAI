import React from 'react';
import { Breadcrumbs } from './Breadcrumbs';

interface PageHeaderProps {
  title: string;
  description: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  breadcrumbs?: { label: string; onClick?: () => void }[];
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  badge,
  actions,
  breadcrumbs = [],
}) => {
  return (
    <div className="pb-5 mb-6 border-b border-slate-200">
      {breadcrumbs.length > 0 && <Breadcrumbs items={breadcrumbs} />}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">{title}</h1>
            {badge}
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-3xl leading-relaxed">{description}</p>
        </div>
        {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </div>
    </div>
  );
};

