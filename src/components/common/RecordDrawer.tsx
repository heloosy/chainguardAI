import React, { useEffect } from 'react';
import { X, ExternalLink } from 'lucide-react';
import { StatusBadge } from './StatusBadge';

export interface DetailField {
  label: string;
  value: React.ReactNode;
}

export interface RelatedItem {
  id: any;
  title: string;
  subtitle?: string;
  badge?: string;
  onClick?: () => void;
}

interface RecordDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  code?: string;
  status?: string;
  isFixture?: boolean;
  fields: DetailField[];
  relatedSections?: {
    title: string;
    items: RelatedItem[];
    emptyText?: string;
  }[];
  actions?: React.ReactNode;
}

export const RecordDrawer: React.FC<RecordDrawerProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  code,
  status,
  isFixture = false,
  fields,
  relatedSections = [],
  actions,
}) => {
  // ESC key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/30 backdrop-blur-xs transition-opacity animate-fade-in"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 pl-10 max-w-full flex">
        <div className="w-screen max-w-xl bg-white shadow-2xl flex flex-col border-l border-slate-200">
          {/* Header */}
          <div className="p-6 border-b border-slate-200 bg-slate-50/70 flex items-start justify-between">
            <div className="flex-1 pr-4">
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                {code && (
                  <span className="font-mono text-xs font-semibold px-2 py-0.5 bg-slate-200 text-slate-800 rounded">
                    {code}
                  </span>
                )}
                {status && <StatusBadge status={status} size="sm" isFixture={isFixture} />}
              </div>
              <h2 className="text-lg font-bold text-slate-900 leading-snug">{title}</h2>
              {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition"
              aria-label="Close panel"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Metadata Fields Grid */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Record Details</h3>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
                {fields.map((field, idx) => (
                  <div key={idx} className="flex flex-col">
                    <dt className="text-[11px] font-medium text-slate-400 uppercase tracking-tight">{field.label}</dt>
                    <dd className="text-xs font-medium text-slate-800 mt-0.5">{field.value || '—'}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* Related Records Sections */}
            {relatedSections.map((sec, secIdx) => (
              <div key={secIdx} className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">{sec.title}</h3>
                  <span className="text-xs font-semibold text-slate-400 font-mono">({sec.items.length})</span>
                </div>

                {sec.items.length === 0 ? (
                  <div className="p-4 bg-slate-50 border border-dashed border-slate-200 rounded-lg text-center text-xs text-slate-400">
                    {sec.emptyText || 'No related records found'}
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden bg-white">
                    {sec.items.map((item, itemIdx) => (
                      <div
                        key={item.id || itemIdx}
                        onClick={item.onClick}
                        className={`p-3 flex items-center justify-between transition ${item.onClick ? 'cursor-pointer hover:bg-blue-50/50' : ''}`}
                      >
                        <div>
                          <div className="text-xs font-medium text-slate-800 flex items-center gap-1.5">
                            {item.title}
                            {item.onClick && <ExternalLink className="w-3 h-3 text-slate-400" />}
                          </div>
                          {item.subtitle && <p className="text-[11px] text-slate-500 mt-0.5">{item.subtitle}</p>}
                        </div>
                        {item.badge && <StatusBadge status={item.badge} size="sm" />}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Footer Actions */}
          {actions && (
            <div className="p-4 border-t border-slate-200 bg-slate-50/80 flex items-center justify-end gap-3">
              {actions}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

