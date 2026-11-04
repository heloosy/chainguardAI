import React, { useState } from 'react';
import { 
  X, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Save, 
  HelpCircle,
  Clock,
  DollarSign
} from 'lucide-react';
import { HistoricalIncident } from '../../types';

interface RecordOutcomeModalProps {
  incident: HistoricalIncident;
  onClose: () => void;
  onSave: (outcomeData: {
    actualCost: number;
    actualDowntimeDays: number;
    actualCustomerDelayDays: number;
    outcomeStatus: 'RESOLVED_OPTIMAL' | 'RESOLVED_SUBOPTIMAL' | 'FAILED';
    secondaryShortageEncountered: boolean;
    lessonsLearned: string[];
    unsuccessfulAttempts: string[];
    recordedBy: string;
  }) => Promise<boolean>;
}

export const RecordOutcomeModal: React.FC<RecordOutcomeModalProps> = ({
  incident,
  onClose,
  onSave
}) => {
  const existing = incident.actualOutcome;

  const [actualCost, setActualCost] = useState<number>(existing?.actualCost || incident.predictedMetrics.cost);
  const [actualDowntime, setActualDowntime] = useState<number>(existing?.actualDowntimeDays || 0);
  const [actualCustomerDelay, setActualCustomerDelay] = useState<number>(existing?.actualCustomerDelayDays || 0);
  const [outcomeStatus, setOutcomeStatus] = useState<'RESOLVED_OPTIMAL' | 'RESOLVED_SUBOPTIMAL' | 'FAILED'>(
    existing?.outcomeStatus || 'RESOLVED_OPTIMAL'
  );
  const [secondaryShortage, setSecondaryShortage] = useState<boolean>(existing?.secondaryShortageEncountered || false);
  const [lessonsText, setLessonsText] = useState<string>(
    existing?.lessonsLearned.join('\n') || 
    '• Executing pre-cleared air charter prevented line shutdown.\n• Lending facility retained required buffer margin (Rule SEC-01).'
  );
  const [unsuccessfulText, setUnsuccessfulText] = useState<string>(
    existing?.unsuccessfulAttempts.join('\n') || ''
  );
  const [recordedBy, setRecordedBy] = useState<string>(existing?.recordedBy || 'Sylvia Tom (VP Global Operations)');
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const lessons = lessonsText.split('\n').map(l => l.replace(/^[•\-\*]\s*/, '').trim()).filter(Boolean);
    const unsuccessful = unsuccessfulText.split('\n').map(l => l.replace(/^[•\-\*]\s*/, '').trim()).filter(Boolean);

    await onSave({
      actualCost: Number(actualCost),
      actualDowntimeDays: Number(actualDowntime),
      actualCustomerDelayDays: Number(actualCustomerDelay),
      outcomeStatus,
      secondaryShortageEncountered: secondaryShortage,
      lessonsLearned: lessons,
      unsuccessfulAttempts: unsuccessful,
      recordedBy,
    });

    setIsSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-5 flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-400/30">
                {incident.incidentCode}
              </span>
              <h2 className="text-base font-bold">Record Actual Disruption Recovery Outcome</h2>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              Store post-mortem recovery results into persistent incident memory to inform future automated recommendations.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* Incident Summary Card */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <div className="font-semibold text-slate-900">{incident.title}</div>
            <div className="text-slate-500 mt-1 flex flex-wrap gap-x-4 gap-y-1">
              <span>Date: <strong>{incident.date}</strong></span>
              <span>Action Taken: <strong>{incident.selectedAction.description}</strong></span>
              <span>Predicted Spend: <strong>${incident.predictedMetrics.cost.toLocaleString()}</strong></span>
            </div>
          </div>

          {/* Outcome Status Picker */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">
              Recovery Outcome Status
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => setOutcomeStatus('RESOLVED_OPTIMAL')}
                className={`p-2.5 rounded-lg border text-left flex items-center space-x-2 transition-all ${
                  outcomeStatus === 'RESOLVED_OPTIMAL'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-900 ring-2 ring-emerald-500/20'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <div>
                  <div className="font-bold text-[11px]">Optimal Recovery</div>
                  <div className="text-[10px] text-slate-500">Zero downtime achieved</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setOutcomeStatus('RESOLVED_SUBOPTIMAL')}
                className={`p-2.5 rounded-lg border text-left flex items-center space-x-2 transition-all ${
                  outcomeStatus === 'RESOLVED_SUBOPTIMAL'
                    ? 'bg-amber-50 border-amber-500 text-amber-900 ring-2 ring-amber-500/20'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <div>
                  <div className="font-bold text-[11px]">Suboptimal</div>
                  <div className="text-[10px] text-slate-500">Minor delay / cost variance</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setOutcomeStatus('FAILED')}
                className={`p-2.5 rounded-lg border text-left flex items-center space-x-2 transition-all ${
                  outcomeStatus === 'FAILED'
                    ? 'bg-red-50 border-red-500 text-red-900 ring-2 ring-red-500/20'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <XCircle className="w-4 h-4 text-red-600 shrink-0" />
                <div>
                  <div className="font-bold text-[11px]">Failed Recovery</div>
                  <div className="text-[10px] text-slate-500">Secondary outage occurred</div>
                </div>
              </button>
            </div>
          </div>

          {/* Actual Metrics Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Actual Financial Cost ($)
              </label>
              <div className="relative">
                <span className="absolute left-2.5 top-2 text-slate-400 font-mono">$</span>
                <input
                  type="number"
                  value={actualCost}
                  onChange={e => setActualCost(Number(e.target.value))}
                  className="w-full pl-7 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Actual Line Downtime (Days)
              </label>
              <input
                type="number"
                step="0.1"
                value={actualDowntime}
                onChange={e => setActualDowntime(Number(e.target.value))}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Customer Delay (Days)
              </label>
              <input
                type="number"
                value={actualCustomerDelay}
                onChange={e => setActualCustomerDelay(Number(e.target.value))}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                required
              />
            </div>
          </div>

          {/* Secondary Shortage Checkbox */}
          <div className="p-3 rounded-lg bg-amber-50/60 border border-amber-200 flex items-center space-x-2">
            <input
              type="checkbox"
              id="secShortageCheck"
              checked={secondaryShortage}
              onChange={e => setSecondaryShortage(e.target.checked)}
              className="h-4 w-4 rounded border-amber-300 text-amber-600 focus:ring-amber-500"
            />
            <label htmlFor="secShortageCheck" className="text-amber-900 font-medium cursor-pointer">
              Did this action induce a secondary shortage at an interconnected lending facility?
            </label>
          </div>

          {/* Lessons Learned */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Retrospective Lessons Learned (One per line)
            </label>
            <textarea
              rows={3}
              value={lessonsText}
              onChange={e => setLessonsText(e.target.value)}
              placeholder="e.g. Always verify supplier safety audit before approving alternate PO..."
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-sans"
              required
            />
          </div>

          {/* Unsuccessful Attempts */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Unsuccessful Recovery Attempts / Failed Interventions (Optional)
            </label>
            <textarea
              rows={2}
              value={unsuccessfulText}
              onChange={e => setUnsuccessfulText(e.target.value)}
              placeholder="e.g. Attempted ocean carrier diversion mid-transit (denied by shipping line)..."
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-sans"
            />
          </div>

          {/* Recorder Identity */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Recorded By (Authorized Post-Mortem Reviewer)
            </label>
            <input
              type="text"
              value={recordedBy}
              onChange={e => setRecordedBy(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              required
            />
          </div>

          {/* Footer Controls */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end space-x-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg shadow-sm transition-all"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : 'Save Actual Outcome'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
