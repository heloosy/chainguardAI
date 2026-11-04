import React, { useState } from 'react';
import { UserCheck, XCircle, AlertTriangle, ShieldCheck, CheckCircle2, Lock, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { CandidateResponse } from '../../types';

interface ApprovalModalProps {
  mode: 'APPROVE' | 'REJECT';
  candidate: CandidateResponse;
  onClose: () => void;
}

export const ApprovalModal: React.FC<ApprovalModalProps> = ({ mode, candidate, onClose }) => {
  const { approveAction, rejectAction, setActiveTab } = useApp();

  const [approverName, setApproverName] = useState('Sylvia Tom');
  const [approverRole, setApproverRole] = useState('VP Global Supply Chain Operations');
  const [rationale, setRationale] = useState(
    mode === 'APPROVE'
      ? 'Approved balanced inter-plant transfer and Supplier Z air freight. Protects Tier-1 customer delivery with zero secondary stockouts.'
      : 'Rejected due to violation of secondary stockout safety limits or unverified supplier risk.'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rationale.trim()) return;

    setIsSubmitting(true);
    if (mode === 'APPROVE') {
      const ok = await approveAction(candidate.id, approverName, approverRole, rationale);
      if (ok) {
        onClose();
        setActiveTab('audit');
      }
    } else {
      const ok = await rejectAction(candidate.id, approverName, approverRole, rationale);
      if (ok) {
        onClose();
        setActiveTab('audit');
      }
    }
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center space-x-2">
            {mode === 'APPROVE' ? (
              <UserCheck className="w-5 h-5 text-emerald-600" />
            ) : (
              <XCircle className="w-5 h-5 text-red-600" />
            )}
            <h3 className="text-base font-bold text-slate-900">
              {mode === 'APPROVE' ? 'Executive Authorization Sign-Off' : 'Formal Action Rejection'}
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-sm font-bold">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action Summary Pill */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
          <div className="font-bold text-slate-900">{candidate.title}</div>
          <div className="flex justify-between text-slate-500 font-mono text-[11px] pt-1">
            <span>Expedite Spend: ${candidate.estimatedCost.toLocaleString()}</span>
            <span>Recovery: {candidate.recoveryTimeDays} days</span>
            <span>Secondary Shortage: {candidate.secondaryShortage.detected ? 'YES (CRITICAL)' : 'NONE'}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block text-slate-700 font-medium mb-1">Authorizing Official</label>
            <input
              type="text"
              value={approverName}
              onChange={e => setApproverName(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
              required
            />
          </div>

          <div>
            <label className="block text-slate-700 font-medium mb-1">Official Executive Role</label>
            <input
              type="text"
              value={approverRole}
              onChange={e => setApproverRole(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
              required
            />
          </div>

          <div>
            <label className="block text-slate-700 font-medium mb-1">
              Audit Rationale & Justification {mode === 'REJECT' && <span className="text-red-500">* (Required)</span>}
            </label>
            <textarea
              rows={3}
              value={rationale}
              onChange={e => setRationale(e.target.value)}
              placeholder="State the operational justification for this decision..."
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
              required
            />
          </div>

          <div className="p-2.5 bg-blue-50/80 rounded-lg border border-blue-200 text-[11px] text-blue-900 leading-tight">
            <strong>SAP Integration Staging:</strong> Upon sign-off, an immutable audit record is recorded and staging movement type <code>301_PLANT_TO_PLANT</code> is formatted for SAP S/4HANA.
          </div>

          <div className="pt-2 flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !rationale.trim()}
              className={`px-4 py-1.5 text-white rounded-lg font-semibold flex items-center space-x-1.5 ${
                mode === 'APPROVE'
                  ? 'bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400'
                  : 'bg-red-600 hover:bg-red-700 disabled:bg-red-400'
              }`}
            >
              {mode === 'APPROVE' ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Staging in SAP...' : 'Confirm Authorization'}</span>
                </>
              ) : (
                <>
                  <XCircle className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Recording...' : 'Record Rejection'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
