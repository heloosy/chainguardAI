import React, { useState } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  FileText, 
  Lock, 
  UserCheck, 
  ArrowRight,
  Layers,
  Database,
  ExternalLink,
  ChevronRight,
  Send,
  Upload,
  Info
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ValidationOutcome, ValidationRule } from '../../types';
import { ApprovalModal } from '../modals/ApprovalModal';
import { ProvideEvidenceModal } from '../modals/ProvideEvidenceModal';

export const DecisionValidation: React.FC = () => {
  const { 
    selectedResponse, 
    candidateResponses, 
    setSelectedResponse, 
    validationReports, 
    activeValidationReport,
    requestMoreEvidence,
    provideEvidence,
    setActiveTab
  } = useApp();

  const [showApprovalModal, setShowApprovalModal] = useState<boolean>(false);
  const [showEvidenceModal, setShowEvidenceModal] = useState<boolean>(false);
  const [modalMode, setModalMode] = useState<'APPROVE' | 'REJECT'>('APPROVE');
  const [evidenceRequested, setEvidenceRequested] = useState<boolean>(false);

  const activeCandidate = selectedResponse || candidateResponses[0];
  const report = activeValidationReport || validationReports[activeCandidate.id];

  const getOutcomeBadge = (outcome: ValidationOutcome) => {
    switch (outcome) {
      case 'PROCEED':
        return {
          title: 'PROCEED — Automated Staging Permitted',
          subtitle: 'Required evidence is verified and all operational constraints are satisfied.',
          color: 'bg-emerald-50 border-emerald-500 text-emerald-950',
          badge: 'bg-emerald-600 text-white',
          icon: CheckCircle2,
        };
      case 'APPROVAL_REQUIRED':
        return {
          title: 'HUMAN APPROVAL — Executive Sign-Off Needed',
          subtitle: 'All resilience and safety checks passed. Human authorization required for expenditure delegation.',
          color: 'bg-amber-50 border-amber-500 text-amber-950',
          badge: 'bg-amber-600 text-white',
          icon: UserCheck,
        };
      case 'EVIDENCE_REQUIRED':
        return {
          title: 'GATHER EVIDENCE — Critical Information Missing or Unverified',
          subtitle: 'Recommendation cannot proceed until mandatory supplier audits or capacity certifications are verified.',
          color: 'bg-purple-50 border-purple-500 text-purple-950',
          badge: 'bg-purple-600 text-white',
          icon: HelpCircle,
        };
      case 'BLOCKED':
        return {
          title: 'BLOCKED — Mandatory Constraint Violated',
          subtitle: 'Action is strictly blocked to prevent severe secondary consequences or catastrophic line shutdown.',
          color: 'bg-red-50 border-red-500 text-red-950',
          badge: 'bg-red-600 text-white',
          icon: XCircle,
        };
    }
  };

  const currentBadge = report ? getOutcomeBadge(report.outcome) : getOutcomeBadge('APPROVAL_REQUIRED');
  const StatusIcon = currentBadge.icon;

  const handleOpenApprove = () => {
    if (report?.outcome === 'BLOCKED') return;
    setModalMode('APPROVE');
    setShowApprovalModal(true);
  };

  const handleOpenReject = () => {
    setModalMode('REJECT');
    setShowApprovalModal(true);
  };

  const handleRequestEvidence = () => {
    requestMoreEvidence(activeCandidate.id, 'Supplier SLP On-site Audit Form 409-B & AEC-Q100 Test Logs');
    setEvidenceRequested(true);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-lg font-bold text-slate-900">
              Agent Three: Evidence & Intelligent Decision Gate
            </h1>
            <span className="text-[10px] font-semibold bg-purple-100 text-purple-800 px-2 py-0.5 rounded border border-purple-200">
              4 Operational States
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Zero-trust decision gate enforcing evidence verification, business policies, and human authorization before staging actions.
          </p>
        </div>

        {/* Candidate Selector Pills */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1">
          {candidateResponses.map(c => {
            const isSel = c.id === activeCandidate.id;
            return (
              <button
                key={c.id}
                onClick={() => setSelectedResponse(c)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  isSel 
                    ? 'bg-blue-600 text-white shadow-xs' 
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200'
                }`}
              >
                {c.actionType === 'BALANCED_HYBRID' ? '★ Optimal Hybrid' :
                 c.actionType === 'INVENTORY_TRANSFER' ? 'Transfer 450' :
                 c.actionType === 'SUPPLIER_SWITCH' ? 'Switch Sup Y' : 'Baseline'}
              </button>
            );
          })}
        </div>
      </div>

      {/* Primary Decision Gate Outcome Banner */}
      <div className={`p-5 rounded-xl border-2 shadow-xs ${currentBadge.color}`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start space-x-3.5">
            <div className={`p-2.5 rounded-xl text-white shrink-0 mt-0.5 ${currentBadge.badge}`}>
              <StatusIcon className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded text-white ${currentBadge.badge}`}>
                  GATE STATE: {report?.outcome.replace('_', ' ')}
                </span>
                <span className="text-xs font-mono font-bold text-slate-700">
                  Compliance Score: {report?.overallScore || 85}%
                </span>
              </div>
              <h2 className="text-base font-bold text-slate-900 mt-1">
                {currentBadge.title}
              </h2>
              <p className="text-xs text-slate-700 mt-0.5 leading-relaxed">
                {report?.recommendationSummary}
              </p>

              {/* Explicit Reason & Next Required Action (Prompt Section 7 requirement) */}
              <div className="mt-2.5 pt-2 border-t border-slate-200/60 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="font-bold text-slate-900">Decision Gate Reason:</span>{' '}
                  <span className="text-slate-700">{report?.decisionGateReason}</span>
                </div>
                <div>
                  <span className="font-bold text-slate-900">Next Required Action:</span>{' '}
                  <span className="text-slate-700">{report?.nextRequiredAction}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Workflow Action Buttons */}
          <div className="flex items-center space-x-2 shrink-0 self-end md:self-center">
            {report?.outcome === 'EVIDENCE_REQUIRED' && (
              <>
                <button
                  onClick={handleRequestEvidence}
                  disabled={evidenceRequested}
                  className="px-3.5 py-2 bg-purple-700 hover:bg-purple-800 disabled:bg-purple-300 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center space-x-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{evidenceRequested ? 'Audit Dispatched' : 'Request Evidence'}</span>
                </button>

                <button
                  onClick={() => setShowEvidenceModal(true)}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow-xs transition-all flex items-center space-x-1.5"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Provide Evidence</span>
                </button>
              </>
            )}

            {/* Blocked Actions Cannot Be Approved */}
            {report?.outcome === 'BLOCKED' ? (
              <div className="flex items-center space-x-2 p-2 bg-red-100 rounded-lg border border-red-300 text-red-800 text-xs font-bold">
                <Lock className="w-4 h-4 text-red-600" />
                <span>Execution Blocked by Rule SEC-01</span>
              </div>
            ) : (
              report?.outcome !== 'EVIDENCE_REQUIRED' && (
                <>
                  <button
                    onClick={handleOpenReject}
                    className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-semibold rounded-lg transition-colors"
                  >
                    Reject Plan
                  </button>
                  <button
                    onClick={handleOpenApprove}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center space-x-1.5"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Authorize Response (VP Sign-Off)</span>
                  </button>
                </>
              )
            )}
          </div>
        </div>
      </div>

      {/* Feature Four: Supporting Evidence Panel (Prompt Section 6 requirement) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Evidence & Safety Panel: Facts Used, Assumptions & Completeness
            </h3>
            <p className="text-xs text-slate-500">
              Categorized into Confirmed, Estimated, Missing, and Unverified facts per ChainGuard Zero-Hallucination policy
            </p>
          </div>
          <span className="text-xs font-mono text-slate-500 font-semibold">
            {activeCandidate.evidenceItems?.length || 0} Factors Assessed
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          {activeCandidate.evidenceItems?.map((ev) => {
            const isConf = ev.status === 'CONFIRMED';
            const isEst = ev.status === 'ESTIMATED';
            const isMiss = ev.status === 'MISSING';
            const isUnv = ev.status === 'UNVERIFIED';

            return (
              <div 
                key={ev.id}
                className={`p-3 rounded-lg border space-y-1.5 ${
                  isConf ? 'bg-emerald-50/50 border-emerald-200' :
                  isEst ? 'bg-blue-50/50 border-blue-200' :
                  isMiss ? 'bg-red-50/50 border-red-200' :
                  'bg-amber-50/50 border-amber-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">{ev.factor}</span>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${
                    isConf ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                    isEst ? 'bg-blue-100 text-blue-800 border-blue-300' :
                    isMiss ? 'bg-red-100 text-red-800 border-red-300' :
                    'bg-amber-100 text-amber-800 border-amber-300'
                  }`}>
                    {ev.status}
                  </span>
                </div>
                <p className="text-slate-700 text-[11px] leading-relaxed">{ev.details}</p>
                <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono pt-1 border-t border-slate-200/50">
                  <span>Source: {ev.sourceSystem}</span>
                  <span>{ev.lastUpdated}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Rules Validation Breakdown Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Mandatory Constraints & Policy Verification Checks
            </h3>
            <p className="text-xs text-slate-500">
              Evaluated against enterprise limits, safety stock buffers, and supplier compliance standards
            </p>
          </div>
          <span className="text-xs font-mono text-slate-500">
            {report?.rules.filter(r => r.passed).length} of {report?.rules.length} Rules Passed
          </span>
        </div>

        <div className="divide-y divide-slate-100 text-xs">
          {report?.rules.map((rule) => {
            const isPass = rule.passed;
            return (
              <div key={rule.id} className="p-4 hover:bg-slate-50/70 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="space-y-1 max-w-3xl">
                  <div className="flex items-center space-x-2">
                    <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                      isPass ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {rule.code}
                    </span>
                    <span className="font-bold text-slate-900">{rule.name}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-semibold uppercase ${
                      rule.severity === 'BLOCKING' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {rule.severity}
                    </span>
                  </div>

                  <p className="text-slate-600 text-xs pl-7">
                    {rule.explanation}
                  </p>

                  <div className="pl-7 text-[11px] text-slate-500 font-mono flex items-center space-x-3 pt-0.5">
                    <span><strong>Actual:</strong> {rule.actualValue}</span>
                    <span>•</span>
                    <span><strong>Target:</strong> {rule.thresholdValue}</span>
                  </div>
                </div>

                <div className="shrink-0 self-end md:self-center">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center space-x-1 ${
                    isPass 
                      ? 'bg-emerald-100 text-emerald-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {isPass ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                    <span>{isPass ? 'PASSED' : 'VIOLATION'}</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Approval Modal */}
      {showApprovalModal && (
        <ApprovalModal 
          mode={modalMode} 
          candidate={activeCandidate} 
          onClose={() => setShowApprovalModal(false)} 
        />
      )}

      {/* Provide Evidence Modal */}
      {showEvidenceModal && (
        <ProvideEvidenceModal
          actionId={activeCandidate.id}
          actionTitle={activeCandidate.title}
          missingEvidenceList={report?.missingEvidenceList || []}
          onClose={() => setShowEvidenceModal(false)}
          onSubmitEvidence={provideEvidence}
        />
      )}
    </div>
  );
};
