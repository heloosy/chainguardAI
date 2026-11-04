import React, { useState } from 'react';
import { 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  ArrowRight, 
  Clock, 
  DollarSign, 
  Lock, 
  UserCheck, 
  FileText, 
  Layers, 
  ExternalLink,
  Bot,
  Zap,
  Cpu,
  Info,
  ChevronRight
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { CandidateResponse, ValidationReport, ResponseActionType } from '../../types';
import { ProvideEvidenceModal } from '../modals/ProvideEvidenceModal';

export const StrategicRecoveryView: React.FC = () => {
  const { 
    candidateResponses, 
    selectedResponse, 
    setSelectedResponse, 
    validationReports,
    approveAction,
    rejectAction,
    requestMoreEvidence,
    provideEvidence,
    setActiveTab
  } = useApp();

  const [activePlan, setActivePlan] = useState<CandidateResponse>(() => {
    return selectedResponse || candidateResponses.find(c => c.actionType === 'BALANCED_HYBRID') || candidateResponses[0];
  });

  const [approverName, setApproverName] = useState('Director of Global Supply Chain');
  const [approverRole, setApproverRole] = useState('VP Operations / Tier 1 Strategic Procurement');
  const [rationale, setRationale] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showEvidenceModal, setShowEvidenceModal] = useState(false);
  const [evidenceActionId, setEvidenceActionId] = useState<string | null>(null);

  const report = validationReports[activePlan.id];

  const handleSelectPlan = (plan: CandidateResponse) => {
    setActivePlan(plan);
    setSelectedResponse(plan);
  };

  const handleApprove = async () => {
    if (!report || report.outcome !== 'APPROVAL_REQUIRED' && report.outcome !== 'PROCEED') return;
    setIsProcessing(true);
    const rat = rationale.trim() || `Approved by ${approverName} based on Strategist Agent recommendation and Zero-Trust validation clearance.`;
    await approveAction(activePlan.id, approverName, approverRole, rat);
    setIsProcessing(false);
    setRationale('');
  };

  const handleReject = async () => {
    setIsProcessing(true);
    const rat = rationale.trim() || `Rejected by ${approverName}.`;
    await rejectAction(activePlan.id, approverName, approverRole, rat);
    setIsProcessing(false);
    setRationale('');
  };

  const getGateBadge = (outcome?: string) => {
    switch (outcome) {
      case 'PROCEED':
        return { bg: 'bg-emerald-100 text-emerald-800 border-emerald-300', icon: CheckCircle2, text: 'STATE 1: PROCEED' };
      case 'APPROVAL_REQUIRED':
        return { bg: 'bg-blue-100 text-blue-800 border-blue-300', icon: UserCheck, text: 'STATE 2: HUMAN APPROVAL REQUIRED' };
      case 'EVIDENCE_REQUIRED':
        return { bg: 'bg-purple-100 text-purple-800 border-purple-300', icon: AlertTriangle, text: 'STATE 3: GATHER EVIDENCE' };
      case 'BLOCKED':
      default:
        return { bg: 'bg-red-100 text-red-800 border-red-300', icon: XCircle, text: 'STATE 4: BLOCKED BY RULE SEC-01' };
    }
  };

  const gate = getGateBadge(report?.outcome);
  const GateIcon = gate.icon;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-slate-900">
              Strategic Recovery Formulation & Decision Gate
            </h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200 font-semibold">
              Agents: Strategist & Verifier
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Multi-tier recovery strategies formulated by the Strategic Recovery Agent, verified by the Zero-Trust Evidence Auditor, and gated for authorized human sign-off.
          </p>
        </div>

        <button
          onClick={() => setActiveTab('agent-swarm')}
          className="flex items-center space-x-1.5 px-3 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 rounded-lg text-xs font-semibold transition-colors shrink-0"
        >
          <Bot className="w-3.5 h-3.5" />
          <span>Inspect Multi-Agent Dialogue</span>
        </button>
      </div>

      {/* 4 Strategy Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {candidateResponses.map((plan) => {
          const planReport = validationReports[plan.id];
          const isSelected = activePlan.id === plan.id;
          const planGate = getGateBadge(planReport?.outcome);
          const hasSecondary = plan.secondaryShortage?.detected;

          return (
            <div
              key={plan.id}
              onClick={() => handleSelectPlan(plan)}
              className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                isSelected 
                  ? 'bg-blue-50/60 border-blue-500 shadow-sm ring-1 ring-blue-500' 
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                    {plan.actionType.replace('_', ' ')}
                  </span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${planGate.bg}`}>
                    {planGate.text.split(':')[1]}
                  </span>
                </div>

                <h3 className="font-bold text-xs text-slate-900 line-clamp-1 mb-1">
                  {plan.title}
                </h3>
                <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed mb-3">
                  {plan.description}
                </p>

                {/* Metrics */}
                <div className="space-y-1 text-[11px] font-mono bg-slate-50 p-2.5 rounded-lg border border-slate-200/80 mb-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Expedite Spend:</span>
                    <strong className="text-slate-900">${plan.estimatedCost.toLocaleString()}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Line Downtime:</span>
                    <strong className={plan.recoveryTimeDays > 0 ? 'text-amber-700' : 'text-emerald-700'}>
                      {plan.recoveryTimeDays} days
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Secondary Risk:</span>
                    <strong className={hasSecondary ? 'text-red-700' : 'text-emerald-700'}>
                      {hasSecondary ? 'DETECTED' : 'Zero'}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                <span className="text-blue-600 font-semibold">
                  {isSelected ? 'Currently Selected' : 'Select Strategy'}
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Strategy Deep-Dive & Decision Gate */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Plan Breakdown & Evidence Verification */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <span className="text-[10px] font-mono text-slate-400 uppercase">Selected Mitigation Strategy</span>
              <h2 className="text-base font-bold text-slate-900 mt-0.5">
                {activePlan.title}
              </h2>
            </div>
            <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border flex items-center space-x-1.5 ${gate.bg}`}>
              <GateIcon className="w-3.5 h-3.5" />
              <span>{gate.text}</span>
            </span>
          </div>

          <p className="text-xs text-slate-700 leading-relaxed">
            {activePlan.description}
          </p>

          {/* Cost Breakdown (Verified vs Estimates) */}
          <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
            <span className="text-[10px] font-mono uppercase font-bold text-slate-500 block">
              Financial Breakdown (Verified Quotes vs Estimated Overheads)
            </span>
            <div className="space-y-1.5 text-xs">
              {activePlan.costBreakdown.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <span className="text-slate-600 flex items-center space-x-1.5">
                    <span>{item.item}</span>
                    <span className={`text-[9px] px-1 rounded font-mono ${
                      item.isEstimate ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {item.isEstimate ? 'ESTIMATED' : 'VERIFIED QUOTE'}
                    </span>
                  </span>
                  <span className="font-mono font-bold text-slate-900">
                    ${item.amount.toLocaleString()}
                  </span>
                </div>
              ))}
              <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-xs">
                <span>Total Recovery Investment:</span>
                <span className="text-blue-700 font-mono">${activePlan.estimatedCost.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Zero-Trust Evidence Audit Results */}
          <div className="space-y-2">
            <span className="text-[10px] font-mono uppercase font-bold text-slate-500 block">
              Zero-Trust Evidence Auditor Checklist
            </span>
            <div className="space-y-2">
              {activePlan.evidenceItems?.map((check) => (
                <div 
                  key={check.id}
                  className="p-2.5 rounded-lg border border-slate-200 text-xs flex items-start justify-between gap-3 bg-white"
                >
                  <div>
                    <div className="font-semibold text-slate-800 flex items-center space-x-1.5">
                      <span>{check.factor}</span>
                      <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded border ${
                        check.status === 'CONFIRMED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-purple-50 text-purple-700 border-purple-200'
                      }`}>
                        {check.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-0.5">{check.details}</p>
                    <span className="text-[10px] font-mono text-slate-400 mt-1 block">
                      Source: {check.sourceSystem} • Freshness: {check.lastUpdated}
                    </span>
                  </div>

                  {check.status === 'UNVERIFIED' && (
                    <button
                      onClick={() => {
                        setEvidenceActionId(activePlan.id);
                        setShowEvidenceModal(true);
                      }}
                      className="px-2 py-1 text-[11px] bg-purple-50 text-purple-700 hover:bg-purple-100 rounded border border-purple-200 font-medium whitespace-nowrap"
                    >
                      Provide Proof
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Intelligent Decision Gate Action Console */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <Lock className="w-4 h-4 text-emerald-600" />
              <span>Intelligent Decision Gate Console</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Strict governance boundary: Prevents unverified spend from touching ERP production ledgers.
            </p>
          </div>

          {/* Reason & Action Guidelines */}
          <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
            <span className="text-[10px] font-mono uppercase font-bold text-slate-500 block">
              Gate Reason & Next Required Action
            </span>
            <p className="text-xs text-slate-800 leading-relaxed">
              {report?.decisionGateReason || 'Awaiting validation report...'}
            </p>
            <div className="pt-2 border-t border-slate-200 text-[11px] text-blue-800 font-medium">
              👉 {report?.nextRequiredAction}
            </div>
          </div>

          {/* Human-in-the-Loop Sign-off Form */}
          {(report?.outcome === 'APPROVAL_REQUIRED' || report?.outcome === 'PROCEED') && (
            <div className="space-y-3 pt-1">
              <span className="text-[10px] font-mono uppercase font-bold text-slate-500 block">
                Authorized Executive Authorization
              </span>

              <div className="space-y-2 text-xs">
                <div>
                  <label className="text-[11px] text-slate-500 block mb-0.5">Approver Identity</label>
                  <input
                    type="text"
                    value={approverName}
                    onChange={(e) => setApproverName(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-500 block mb-0.5">Authorization Role</label>
                  <input
                    type="text"
                    value={approverRole}
                    onChange={(e) => setApproverRole(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-500 block mb-0.5">Decision Rationale</label>
                  <textarea
                    rows={2}
                    placeholder="Enter formal justification for audit trail..."
                    value={rationale}
                    onChange={(e) => setRationale(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <button
                  onClick={handleApprove}
                  disabled={isProcessing}
                  className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs transition-colors flex items-center justify-center space-x-1.5 shadow-xs disabled:opacity-50"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Authorize & Dispatch to Staging</span>
                </button>

                <button
                  onClick={handleReject}
                  disabled={isProcessing}
                  className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs transition-colors disabled:opacity-50"
                >
                  Reject
                </button>
              </div>
            </div>
          )}

          {/* Blocked or Evidence Required notice */}
          {report?.outcome === 'BLOCKED' && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800 space-y-1">
              <strong>Execution Blocked by Rule SEC-01</strong>
              <p className="text-[11px]">
                This strategy would cannibalize Factory B (Munich), triggering a secondary line shutdown. To proceed safely, select the <strong>Balanced Hybrid Plan</strong> or cap the transfer quantity.
              </p>
            </div>
          )}

          {report?.outcome === 'EVIDENCE_REQUIRED' && (
            <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg text-xs text-purple-900 space-y-2">
              <strong>Zero-Trust Guard: Missing Engineering Proof</strong>
              <p className="text-[11px]">
                NexaCore has not passed physical capacity audit or renewed ISO-26262 automotive safety certification. Supply chain policy prohibits issuing automated purchase orders.
              </p>
              <button
                onClick={() => {
                  setEvidenceActionId(activePlan.id);
                  setShowEvidenceModal(true);
                }}
                className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold"
              >
                Upload Audit Document & Override
              </button>
            </div>
          )}
        </div>
      </div>

      {showEvidenceModal && evidenceActionId && (
        <ProvideEvidenceModal
          actionId={evidenceActionId}
          actionTitle={activePlan.title}
          missingEvidenceList={report?.missingEvidenceList || ['ISO-26262 Automotive Safety Certificate', 'Production Capacity Engineering Audit']}
          onClose={() => {
            setShowEvidenceModal(false);
            setEvidenceActionId(null);
          }}
          onSubmitEvidence={provideEvidence}
        />
      )}
    </div>
  );
};