import React from 'react';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbsProps {
  items: { label: string; onClick?: () => void }[];
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items }) => {
  return (
    <nav className="flex items-center text-xs text-slate-500 mb-2">
      <div className="flex items-center gap-1.5">
        <Home className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-slate-400">ChainGuard</span>
      </div>
      {items.map((item, idx) => (
        <React.Fragment key={idx}>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300 mx-1" />
          {item.onClick ? (
            <button
              onClick={item.onClick}
              className="text-slate-500 hover:text-slate-900 transition font-medium"
            >
              {item.label}
            </button>
          ) : (
            <span className="text-slate-900 font-semibold">{item.label}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};

