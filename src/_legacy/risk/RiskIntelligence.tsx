import React, { useState } from 'react';
import { 
  AlertTriangle, 
  Radio, 
  Search, 
  Filter, 
  Calendar, 
  ShieldCheck, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  ExternalLink,
  Layers,
  Database,
  ChevronRight,
  PlusCircle,
  FileText,
  Globe
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { DisruptionModal } from '../modals/DisruptionModal';
import { RiskAlert, RiskSeverity } from '../../types';

export const RiskIntelligence: React.FC = () => {
  const { 
    risks, 
    selectedRisk, 
    setSelectedRisk, 
    setActiveTab, 
    suppliers, 
    components, 
    factories 
  } = useApp();

  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showInjectModal, setShowInjectModal] = useState<boolean>(false);

  // Active risk to inspect in detail drawer
  const activeAlert = selectedRisk || risks[0];

  const filteredRisks = risks.filter(r => {
    if (severityFilter !== 'ALL' && r.severity !== severityFilter) return false;
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      return r.title.toLowerCase().includes(q) || r.rootCause.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner & Disruption Simulator Trigger */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-lg font-bold text-slate-900">
              Agent One: Early Warning Intelligence
            </h1>
            <span className="text-[10px] font-semibold bg-blue-100 text-blue-800 px-2 py-0.5 rounded border border-blue-200">
              Deterministic Rules Engine
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Aggregates SAP S/4HANA stock telemetry, EDI 856 Advanced Shipping Notices, and external disruption signals.
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={() => setActiveTab('map')}
            className="flex items-center space-x-2 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold border border-slate-200 transition-colors shadow-2xs"
          >
            <Globe className="w-4 h-4 text-blue-600" />
            <span>View Sources on Map</span>
          </button>

          <button
            onClick={() => setActiveTab('real-data')}
            className="flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
          >
            <Database className="w-4 h-4" />
            <span>Ingest Real Data Payload</span>
          </button>
        </div>
      </div>

      {/* Grid: Alert List (Left) + Deep Signal Inspection Drawer (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Filterable Alerts List */}
        <div className="lg:col-span-5 space-y-4">
          {/* Filters & Search */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search alerts, components, plants..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div className="flex items-center space-x-1.5 overflow-x-auto text-xs">
              {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM'].map(sev => (
                <button
                  key={sev}
                  onClick={() => setSeverityFilter(sev)}
                  className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                    severityFilter === sev
                      ? 'bg-blue-600 text-white font-semibold'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {sev}
                </button>
              ))}
            </div>
          </div>

          {/* Alerts Cards List */}
          <div className="space-y-3">
            {filteredRisks.map(r => {
              const isSelected = activeAlert?.id === r.id;
              const isCrit = r.severity === 'CRITICAL';
              return (
                <div
                  key={r.id}
                  onClick={() => setSelectedRisk(r)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-blue-50/80 border-blue-400 shadow-xs ring-1 ring-blue-400'
                      : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                      isCrit ? 'bg-red-50 text-red-700 border-red-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      {r.severity}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      Impact in {r.daysUntilImpact}d
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 leading-snug">
                    {r.title}
                  </h3>

                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                    {r.rootCause}
                  </p>

                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <span className="font-medium text-slate-700 font-mono">
                      Exposure: ${(r.estimatedFinancialExposure / 1000).toFixed(0)}k
                    </span>
                    <span className="text-blue-600 font-semibold flex items-center">
                      Inspect signals <ChevronRight className="w-3 h-3 ml-0.5" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Deep Inspection Panel */}
        <div className="lg:col-span-7">
          {activeAlert ? (
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-6">
              {/* Alert Header */}
              <div className="border-b border-slate-100 pb-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-red-100 text-red-800 border border-red-200 px-2 py-0.5 rounded">
                      {activeAlert.severity} SEVERITY
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      Detected: {activeAlert.detectedAt}
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    Active Threat
                  </span>
                </div>

                <h2 className="text-lg font-bold text-slate-900 leading-snug">
                  {activeAlert.title}
                </h2>
                <p className="text-xs text-slate-600 mt-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <strong>Root Cause Analysis:</strong> {activeAlert.rootCause}
                </p>
              </div>

              {/* Business Impact & Uncertainty Explanation */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3.5 rounded-lg bg-red-50/60 border border-red-100">
                  <div className="text-xs font-semibold text-red-900 mb-1">
                    Potential Business Impact
                  </div>
                  <div className="text-lg font-bold text-red-700 font-mono">
                    ${activeAlert.estimatedFinancialExposure.toLocaleString()}
                  </div>
                  <p className="text-[11px] text-red-600 mt-1">
                    Time to Plant Starvation: <strong>{activeAlert.daysUntilImpact} Days (19 Hours)</strong>
                  </p>
                </div>

                <div className="p-3.5 rounded-lg bg-blue-50/60 border border-blue-100">
                  <div className="text-xs font-semibold text-blue-900 mb-1">
                    Telemetry & Uncertainty Verification
                  </div>
                  <p className="text-[11px] text-blue-800 leading-relaxed">
                    {activeAlert.uncertaintyExplanation}
                  </p>
                </div>
              </div>

              {/* Supporting Signals Feeds */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5 flex items-center justify-between">
                  <span>Supporting Operational Signals ({activeAlert.supportingSignals.length})</span>
                  <span className="text-[10px] text-slate-400 font-normal">Real-Time Correlated</span>
                </h3>

                <div className="space-y-2">
                  {activeAlert.supportingSignals.map((sig, idx) => (
                    <div 
                      key={idx} 
                      className="p-3 rounded-lg border border-slate-200 bg-slate-50 flex items-start justify-between text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className={`h-2 w-2 rounded-full ${
                            sig.status === 'CRITICAL' ? 'bg-red-500' : 'bg-amber-500'
                          }`}></span>
                          <span className="font-semibold text-slate-800">{sig.name}</span>
                          <span className="text-[10px] font-mono text-slate-400 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                            {sig.sourceSystem}
                          </span>
                        </div>
                        <div className="text-slate-600 pl-4 font-mono text-[11px]">
                          {sig.value}
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono shrink-0 ml-2">
                        {sig.timestamp.split(' ')[1] || '06:18 UTC'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Evidence Sources */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5">
                  ERP & Network Audit Sources
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {activeAlert.evidenceSources.map((ev, i) => (
                    <div key={i} className="p-2.5 rounded-lg border border-slate-200 bg-white flex items-center justify-between">
                      <div>
                        <div className="font-medium text-slate-800 truncate">{ev.system}</div>
                        <div className="text-[11px] font-mono text-slate-400">{ev.recordId}</div>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                        ev.verified ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {ev.verified ? 'Verified' : 'Unverified'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Button: Jump to Consequence Simulator */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <div className="text-xs text-slate-500">
                  Recommended Strategy: <strong>ChainGuard Balanced Hybrid (ACT-BALANCED-03)</strong>
                </div>

                <button
                  onClick={() => setActiveTab('recovery')}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-2 shadow-xs transition-colors"
                >
                  <span>Strategic Recovery Plans (Strategist Agent)</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">
              Select an alert from the left to inspect telemetry signals.
            </div>
          )}
        </div>
      </div>

      {showInjectModal && <DisruptionModal onClose={() => setShowInjectModal(false)} />}
    </div>
  );
};
