import React, { useState } from 'react';
import { 
  Cpu, 
  AlertTriangle, 
  ShieldAlert, 
  CheckCircle2, 
  ArrowRight, 
  TrendingDown, 
  HelpCircle, 
  RefreshCw, 
  DollarSign, 
  Clock, 
  Truck, 
  Layers, 
  Info,
  Calendar,
  AlertOctagon,
  FileCheck,
  Award,
  XCircle,
  PackageX,
  Sliders
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  ReferenceLine 
} from 'recharts';
import { useApp } from '../../context/AppContext';
import { CandidateResponse, ResponseActionType } from '../../types';

export const ConsequenceSimulator: React.FC = () => {
  const { 
    candidateResponses, 
    selectedResponse, 
    setSelectedResponse, 
    runSimulationAgain, 
    setActiveTab 
  } = useApp();

  const [showFormulaModal, setShowFormulaModal] = useState<boolean>(false);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);

  const activeCandidate = selectedResponse || candidateResponses[0];

  const handleRunSimulation = () => {
    setIsSimulating(true);
    setTimeout(() => {
      runSimulationAgain();
      setIsSimulating(false);
    }, 450);
  };

  const getActionBadge = (type: ResponseActionType) => {
    switch (type) {
      case 'DO_NOTHING':
        return { label: 'Baseline (No Action)', color: 'bg-slate-100 text-slate-700 border-slate-300' };
      case 'INVENTORY_TRANSFER':
        return { label: 'Inter-Plant Reallocation', color: 'bg-red-100 text-red-800 border-red-300' };
      case 'SUPPLIER_SWITCH':
        return { label: 'Alternate Sourcing', color: 'bg-amber-100 text-amber-800 border-amber-300' };
      case 'BALANCED_HYBRID':
        return { label: 'ChainGuard Optimal Hybrid', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
      default:
        return { label: 'Candidate', color: 'bg-blue-100 text-blue-800 border-blue-300' };
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Offline Sandbox Quarantine Notice Banner */}
      <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-4 text-amber-900 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-amber-200/80 rounded-lg text-amber-900 border border-amber-300">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-xs uppercase tracking-wider px-2 py-0.5 rounded bg-amber-200 text-amber-900 border border-amber-400">
                OFFLINE SANDBOX (ISOLATED)
              </span>
              <span className="font-bold text-sm text-slate-900">
                What-If Synthetic Scenario Simulation Lab
              </span>
            </div>
            <p className="text-xs text-amber-800 mt-0.5">
              This sandbox is strictly isolated from live real-data feeds and enterprise execution ledgers. Use it to stress-test hypothetical black swan scenarios and explore variable inventory curve shocks.
            </p>
          </div>
        </div>

        <button
          onClick={() => setActiveTab('recovery')}
          className="shrink-0 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors"
        >
          <span>Return to Live Agent Recovery</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Simulation Header & Trigger */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-lg font-bold text-slate-900">
              Agent Two: Consequence Simulation Engine
            </h1>
            <span className="text-[10px] font-semibold bg-amber-100 text-amber-900 px-2 py-0.5 rounded border border-amber-300">
              Deterministic Trajectory Simulator
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Simulates cascading impacts across interconnected plants, inventory reserves, customer SLAs, and detects secondary shortages.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={() => setShowFormulaModal(true)}
            className="flex items-center space-x-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 transition-colors"
          >
            <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
            <span>Inspect Math & Formulas</span>
          </button>

          <button
            onClick={handleRunSimulation}
            disabled={isSimulating}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSimulating ? 'animate-spin' : ''}`} />
            <span>{isSimulating ? 'Simulating Trajectory...' : 'Re-Run Simulation'}</span>
          </button>
        </div>
      </div>

      {/* Candidate Responses Grid (4 Options compared against Baseline) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {candidateResponses.map((cand) => {
          const isSelected = activeCandidate.id === cand.id;
          const badge = getActionBadge(cand.actionType);
          const hasSecondary = cand.secondaryShortage.detected;

          return (
            <div
              key={cand.id}
              onClick={() => setSelectedResponse(cand)}
              className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                isSelected
                  ? 'bg-blue-50/90 border-blue-500 shadow-md ring-2 ring-blue-500/20'
                  : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${badge.color}`}>
                    {badge.label}
                  </span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    cand.validationOutcome === 'BLOCKED' ? 'bg-red-100 text-red-700' :
                    cand.validationOutcome === 'APPROVAL_REQUIRED' ? 'bg-amber-100 text-amber-800' :
                    cand.validationOutcome === 'EVIDENCE_REQUIRED' ? 'bg-purple-100 text-purple-800' :
                    'bg-emerald-100 text-emerald-800'
                  }`}>
                    {cand.validationOutcome.replace('_', ' ')}
                  </span>
                </div>

                <div className="flex items-center space-x-1.5 mb-1">
                  <span className="text-[10px] font-mono font-bold text-slate-500">Rank #{cand.rankingRank}</span>
                  {cand.rankingRank === 1 && (
                    <span className="text-[9px] font-bold bg-emerald-600 text-white px-1.5 py-0.2 rounded">
                      TOP RECOMMENDED
                    </span>
                  )}
                </div>

                <h3 className="text-xs font-bold text-slate-900 leading-snug line-clamp-2">
                  {cand.title}
                </h3>

                <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                  {cand.description}
                </p>

                {/* Key Metrics */}
                <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5 text-xs font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-500 text-[11px]">Recovery Spend:</span>
                    <span className="font-bold text-slate-800">${cand.estimatedCost.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 text-[11px]">Downtime:</span>
                    <span className={`font-bold ${cand.recoveryTimeDays === 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {cand.recoveryTimeDays} days
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 text-[11px]">Unmet Demand:</span>
                    <span className={`font-bold ${cand.unmetDemandQuantity === 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {cand.unmetDemandQuantity} units
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 text-[11px]">Customer Delay:</span>
                    <span className={`font-bold ${cand.customerDeliveryDelayDays === 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {cand.customerDeliveryDelayDays} days
                    </span>
                  </div>
                </div>
              </div>

              {/* Secondary Shortage Indicator on Card */}
              <div className="mt-3 pt-2 border-t border-slate-100">
                {hasSecondary ? (
                  <div className="text-[10px] font-bold text-red-700 bg-red-100 px-2 py-1 rounded text-center">
                    ⚠️ Induces Munich Shortage
                  </div>
                ) : cand.actionType === 'BALANCED_HYBRID' ? (
                  <div className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-1 rounded text-center">
                    ✓ Both Plants Protected
                  </div>
                ) : (
                  <div className="text-[10px] text-slate-400 text-center">
                    No secondary transfer
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Candidate Deep Dive & Ranking Explanation */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                Rank #{activeCandidate.rankingRank}
              </span>
              <h2 className="text-base font-bold text-slate-900">{activeCandidate.title}</h2>
            </div>
            <p className="text-xs text-slate-600 mt-1">
              <strong>Ranking Explanation:</strong> {activeCandidate.rankingReason}
            </p>
          </div>

          <div className="flex items-center space-x-3 text-xs shrink-0">
            <div className="text-right">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Feasibility Score</span>
              <div className={`font-mono font-bold text-sm ${activeCandidate.isFeasible ? 'text-emerald-600' : 'text-red-600'}`}>
                {activeCandidate.feasibilityScore}% {activeCandidate.isFeasible ? '(Feasible)' : '(Rejected / Infeasible)'}
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Cost Breakdown (Estimates vs Verified operational figures) */}
        <div>
          <div className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
            Cost Breakdown & Expenditure Reliability (Verified vs Estimates)
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            {activeCandidate.costBreakdown?.map((item, idx) => (
              <div key={idx} className="p-3 rounded-lg border border-slate-200 bg-slate-50/70 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-slate-700 font-medium">{item.item}</span>
                  <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                    item.isEstimate ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {item.isEstimate ? 'Estimated' : 'Verified'}
                  </span>
                </div>
                <div className="text-base font-bold font-mono text-slate-900 mt-1">
                  ${item.amount.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Core Consequence Callout: Secondary Shortage Alert */}
        {activeCandidate.secondaryShortage.detected && (
          <div className="p-4 rounded-xl bg-red-50 border-2 border-red-300 text-xs text-red-950 space-y-1.5 animate-pulse">
            <div className="flex items-center space-x-2 font-bold text-red-900 text-sm">
              <ShieldAlert className="w-5 h-5 text-red-600" />
              <span>CRITICAL SECONDARY SHORTAGE DETECTED (Rule SEC-01 Violation)</span>
            </div>
            <p className="text-red-800 text-[11px] leading-relaxed">
              {activeCandidate.secondaryShortage.explanation}
            </p>
            <div className="flex items-center space-x-4 pt-1 font-mono text-[11px] text-red-900 font-bold">
              <span>Facility Starved: {activeCandidate.secondaryShortage.facilityName}</span>
              <span>•</span>
              <span>Depletion in: {activeCandidate.secondaryShortage.daysUntilStockout.toFixed(1)} Days</span>
              <span>•</span>
              <span>Secondary Loss: ${activeCandidate.secondaryShortage.secondaryFinancialLoss.toLocaleString()}</span>
            </div>
          </div>
        )}

        {/* 14-Day Physical Inventory Trajectory Projection Graph */}
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              14-Day Physical Inventory Trajectory: Factory A vs Factory B
            </div>
            <div className="flex items-center space-x-3 text-xs">
              <span className="flex items-center text-blue-600 font-semibold">
                <span className="h-2.5 w-2.5 rounded-full bg-blue-600 inline-block mr-1.5"></span>
                Factory A (Austin)
              </span>
              <span className="flex items-center text-indigo-600 font-semibold">
                <span className="h-2.5 w-2.5 rounded-full bg-indigo-600 inline-block mr-1.5"></span>
                Factory B (Munich)
              </span>
              <span className="flex items-center text-red-500 font-semibold">
                <span className="h-0.5 w-3 bg-red-500 inline-block mr-1.5"></span>
                Emergency Threshold
              </span>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={activeCandidate.inventoryProjection} margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} domain={[0, 'auto']} label={{ value: 'Units On Hand', angle: -90, position: 'insideLeft', fontSize: 11, fill: '#94a3b8' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                  formatter={(val: any, name: any) => [
                    `${val} Units`, 
                    name === 'factoryAStock' ? 'Austin Gigafactory' : 'Munich Assembly'
                  ]}
                />
                <Legend verticalAlign="top" height={36} />

                {/* Threshold Reference Lines */}
                <ReferenceLine y={100} stroke="#ef4444" strokeDasharray="4 4" label={{ value: 'Austin Min (100)', fill: '#ef4444', fontSize: 10, position: 'right' }} />
                <ReferenceLine y={180} stroke="#f97316" strokeDasharray="4 4" label={{ value: 'Munich Min (180)', fill: '#f97316', fontSize: 10, position: 'right' }} />

                <Line 
                  type="monotone" 
                  dataKey="factoryAStock" 
                  name="Factory A (Austin)" 
                  stroke="#2563eb" 
                  strokeWidth={3} 
                  dot={{ r: 3 }} 
                  activeDot={{ r: 6 }} 
                />
                <Line 
                  type="monotone" 
                  dataKey="factoryBStock" 
                  name="Factory B (Munich)" 
                  stroke="#6366f1" 
                  strokeWidth={3} 
                  dot={{ r: 3 }} 
                  activeDot={{ r: 6 }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Mathematical Logic & Next Steps Footer */}
        <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="text-slate-600 font-mono text-[11px]">
            <strong>Formula:</strong> {activeCandidate.calculationFormula}
          </div>

          <button
            onClick={() => setActiveTab('validation')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold flex items-center space-x-1.5 transition-all self-end sm:self-auto shrink-0"
          >
            <span>Proceed to Decision Validation</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Math & Formulas Inspection Modal */}
      {showFormulaModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center space-x-2">
                <Cpu className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Deterministic Consequence Equations & Assumptions
                </h3>
              </div>
              <button 
                onClick={() => setShowFormulaModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold px-2 py-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-700">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 font-mono">
                <div className="text-[11px] font-bold text-slate-500 uppercase mb-1">
                  1. Inventory Balance Dynamic Formulation:
                </div>
                <div className="text-blue-900 font-semibold">
                  {'I_A(t) = max(0, I_A0 + Q_transfer · 𝟙(t ≥ 2) + Q_expedite · 𝟙(t ≥ 4) - Burn_A · t)'}
                </div>
                <div className="text-indigo-900 font-semibold mt-1">
                  {'I_B(t) = max(0, I_B0 - Q_transfer · 𝟙(t ≥ 1) - Burn_B · t)'}
                </div>
              </div>

              <div className="p-3 bg-red-50 rounded-lg border border-red-200 font-mono">
                <div className="text-[11px] font-bold text-red-600 uppercase mb-1">
                  2. Secondary Shortage Time-to-Failure Equation:
                </div>
                <div className="text-red-900 font-bold">
                  {'t_stockout_B = (I_B0 - Q_transfer) / Burn_B'}
                </div>
                <div className="text-red-800 mt-1">
                  {'For Q_transfer = 450: t_stockout = (520 - 450) / 60 = 70 / 60 = 1.16 days.'}
                  <br />
                  Breaches minimum buffer on Day 1.5; hits absolute zero on Day 2.2!
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 mb-1">Mathematical Assumptions:</h4>
                <ul className="list-disc pl-5 space-y-1 text-slate-600">
                  {activeCandidate.assumptions.map((assump, i) => (
                    <li key={i}>{assump}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setShowFormulaModal(false)}
                className="px-4 py-2 bg-slate-800 text-white rounded-lg text-xs font-semibold hover:bg-slate-700"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
