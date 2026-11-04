import React from 'react';
import { AlertTriangle, Info, CheckCircle2, X } from 'lucide-react';

interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info' | 'success';
  isLoading?: boolean;
}

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm Action',
  cancelLabel = 'Cancel',
  variant = 'warning',
  isLoading = false,
}) => {
  if (!isOpen) return null;

  const icons = {
    danger: <AlertTriangle className="w-6 h-6 text-rose-600" />,
    warning: <AlertTriangle className="w-6 h-6 text-amber-600" />,
    info: <Info className="w-6 h-6 text-blue-600" />,
    success: <CheckCircle2 className="w-6 h-6 text-emerald-600" />,
  };

  const buttonColors = {
    danger: 'bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white',
    warning: 'bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white',
    info: 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white',
    success: 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white',
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4 text-center">
        {/* Backdrop */}
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity" onClick={onClose} />

        {/* Modal card */}
        <div className="relative transform overflow-hidden rounded-xl bg-white text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-md border border-slate-200">
          <div className="p-6">
            <div className="flex items-start gap-4">
              <div className="shrink-0 p-2 rounded-full bg-slate-100">{icons[variant]}</div>
              <div className="flex-1">
                <h3 className="text-base font-semibold text-slate-900">{title}</h3>
                <p className="mt-2 text-xs text-slate-600 leading-relaxed">{message}</p>
              </div>
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-slate-600 p-1"
                aria-label="Close dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="bg-slate-50 px-6 py-3 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-3.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 active:bg-slate-100 disabled:opacity-50 transition"
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isLoading}
              className={`inline-flex items-center gap-2 px-4 py-1.5 text-xs font-semibold rounded-lg shadow-sm disabled:opacity-50 transition ${buttonColors[variant]}`}
            >
              {isLoading && <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

