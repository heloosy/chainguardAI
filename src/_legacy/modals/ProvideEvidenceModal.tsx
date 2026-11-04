import React, { useState } from 'react';
import { 
  X, 
  Upload, 
  CheckCircle2, 
  FileCheck, 
  ShieldCheck, 
  AlertCircle,
  Clock,
  Send
} from 'lucide-react';

interface ProvideEvidenceModalProps {
  actionId: string;
  actionTitle: string;
  missingEvidenceList: string[];
  onClose: () => void;
  onSubmitEvidence: (actionId: string, evidenceDoc: string, verifiedSupplierId?: string) => Promise<boolean>;
}

export const ProvideEvidenceModal: React.FC<ProvideEvidenceModalProps> = ({
  actionId,
  actionTitle,
  missingEvidenceList,
  onClose,
  onSubmitEvidence
}) => {
  const [selectedDoc, setSelectedDoc] = useState<string>(
    missingEvidenceList[0] || 'ISO-26262 Part 5 Semiconductor Functional Safety Audit Report'
  );
  const [docRefNumber, setDocRefNumber] = useState<string>('TUV-SUD-ISO26262-VN-9942');
  const [verifiedBy, setVerifiedBy] = useState<string>('Dr. Marcus Vance (Chief Quality Auditor)');
  const [evidenceNotes, setEvidenceNotes] = useState<string>(
    'On-site cleanroom inspection completed at NexaCore Ho Chi Minh Fab. AEC-Q100 Grade 1 thermal qualification passed 1,000h burn-in.'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    await onSubmitEvidence(
      actionId,
      `${selectedDoc} (Ref: ${docRefNumber})`,
      'SUP-Y' // Supplier Y
    );

    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-900 via-indigo-950 to-slate-900 text-white p-5 flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-5 h-5 text-purple-300" />
              <h2 className="text-base font-bold">Provide Supporting Evidence & Audit Verification</h2>
            </div>
            <p className="text-xs text-purple-200 mt-0.5">
              Submit verified compliance documentation to clear pending evidence gates.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* Target Action Card */}
          <div className="p-3 bg-purple-50/60 border border-purple-200 rounded-lg">
            <div className="text-[11px] font-bold text-purple-900 uppercase tracking-wider">
              Evaluating Response Candidate
            </div>
            <div className="font-semibold text-slate-900 text-sm mt-0.5">{actionTitle}</div>
          </div>

          {/* Missing Evidence List */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">
              Select Evidence Item to Verify & Upload
            </label>
            <div className="space-y-2">
              {missingEvidenceList.map((item, idx) => (
                <label 
                  key={idx}
                  className={`flex items-start space-x-2.5 p-2.5 rounded-lg border cursor-pointer transition-all ${
                    selectedDoc === item
                      ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-500/20'
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="evidenceDocSelect"
                    checked={selectedDoc === item}
                    onChange={() => setSelectedDoc(item)}
                    className="mt-0.5 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <div className="font-semibold text-slate-800">{item}</div>
                    <div className="text-[10px] text-slate-500">Required by Policy Rule SUP-04</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Document Reference Number */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Certificate / Audit Document ID
              </label>
              <input
                type="text"
                value={docRefNumber}
                onChange={e => setDocRefNumber(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono focus:bg-white focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Certifying Lead / Quality Inspector
              </label>
              <input
                type="text"
                value={verifiedBy}
                onChange={e => setVerifiedBy(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                required
              />
            </div>
          </div>

          {/* Verification Notes */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Audit Findings & Quality Attestation
            </label>
            <textarea
              rows={3}
              value={evidenceNotes}
              onChange={e => setEvidenceNotes(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 font-sans"
              required
            />
          </div>

          {/* Notice of Dynamic Gate Upgrade */}
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start space-x-2 text-[11px] text-emerald-900">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <strong>Reactive Validation Gate:</strong> Upon submission, ChainGuard AI will immediately update Supplier Y compliance standing to <strong>VERIFIED</strong> and transition this action from <strong>EVIDENCE REQUIRED</strong> to <strong>APPROVAL REQUIRED</strong>.
            </div>
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
              disabled={isSubmitting}
              className="flex items-center space-x-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-lg shadow-sm transition-all"
            >
              <Send className="w-4 h-4" />
              <span>{isSubmitting ? 'Verifying...' : 'Submit & Clear Evidence Gate'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
