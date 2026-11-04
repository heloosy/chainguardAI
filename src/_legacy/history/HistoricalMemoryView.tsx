import React, { useState } from 'react';
import { 
  History, 
  Search, 
  Filter, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Calendar, 
  DollarSign, 
  Clock, 
  ArrowRight, 
  ExternalLink,
  BookOpen,
  PlusCircle,
  HelpCircle,
  Layers,
  ChevronRight,
  TrendingDown,
  RotateCcw
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { HistoricalIncident } from '../../types';
import { RecordOutcomeModal } from '../modals/RecordOutcomeModal';

export const HistoricalMemoryView: React.FC = () => {
  const { 
    historicalIncidents, 
    similarIncidents, 
    selectedRisk, 
    recordActualOutcome,
    setActiveTab 
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [filterOutcome, setFilterOutcome] = useState('ALL');
  const [selectedIncident, setSelectedIncident] = useState<HistoricalIncident>(
    similarIncidents[0] || historicalIncidents[0]
  );
  const [showOutcomeModal, setShowOutcomeModal] = useState(false);
  const [incidentToRecord, setIncidentToRecord] = useState<HistoricalIncident | null>(null);

  // Top similar incident matching the active risk alert
  const topMatch = similarIncidents[0];

  const filteredIncidents = historicalIncidents.filter(inc => {
    if (filterType !== 'ALL' && inc.incidentType !== filterType) return false;
    if (filterOutcome !== 'ALL') {
      const status = inc.actualOutcome?.outcomeStatus || 'PENDING';
      if (status !== filterOutcome) return false;
    }
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      return (
        inc.title.toLowerCase().includes(q) ||
        inc.incidentCode.toLowerCase().includes(q) ||
        inc.selectedAction.description.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const getStatusBadge = (inc: HistoricalIncident) => {
    if (!inc.actualOutcome) {
      return {
        label: 'PENDING OUTCOME',
        color: 'bg-amber-100 text-amber-800 border-amber-300',
        icon: Clock,
      };
    }
    switch (inc.actualOutcome.outcomeStatus) {
      case 'RESOLVED_OPTIMAL':
        return {
          label: 'OPTIMAL RECOVERY',
          color: 'bg-emerald-100 text-emerald-800 border-emerald-300',
          icon: CheckCircle2,
        };
      case 'RESOLVED_SUBOPTIMAL':
        return {
          label: 'SUBOPTIMAL',
          color: 'bg-blue-100 text-blue-800 border-blue-300',
          icon: AlertTriangle,
        };
      case 'FAILED':
        return {
          label: 'RECOVERY FAILED',
          color: 'bg-red-100 text-red-800 border-red-300',
          icon: XCircle,
        };
    }
  };

  const handleOpenRecordOutcome = (inc: HistoricalIncident, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setIncidentToRecord(inc);
    setShowOutcomeModal(true);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-lg font-bold text-slate-900">
              Feature Six: Historical Recovery Memory
            </h1>
            <span className="text-[10px] font-semibold bg-indigo-100 text-indigo-900 px-2 py-0.5 rounded border border-indigo-200">
              Persistent Case-Based Reasoning
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Retrieves past supply chain disruptions, evaluates what succeeded versus what failed, and prevents repeating costly secondary failures.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveTab('recovery')}
            className="flex items-center space-x-1.5 px-3 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-semibold rounded-lg border border-blue-200 transition-colors"
          >
            <span>Compare Strategic Recovery Options</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Top Similarity Match Card: Current Incident vs Top Past Case */}
      {topMatch && selectedRisk && (
        <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-blue-950 text-white rounded-xl p-5 border border-indigo-800/40 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-indigo-800/40 pb-3">
            <div className="flex items-center space-x-2.5">
              <div className="h-8 w-8 rounded-lg bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
                <History className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                  Automated Historical Similarity Search
                </div>
                <div className="text-sm font-semibold text-white">
                  Closest Case Match: {topMatch.title}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-300">Similarity Confidence:</span>
              <span className="text-sm font-bold font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                {topMatch.similarityScore}% Match
              </span>
            </div>
          </div>

          {/* Side-by-side condition comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Current Incident */}
            <div className="bg-white/5 border border-white/10 rounded-lg p-3.5 space-y-2">
              <div className="text-[11px] font-bold text-blue-300 uppercase tracking-wider">
                Current Active Disruption (2026)
              </div>
              <div className="font-semibold text-white">{selectedRisk.title}</div>
              <div className="space-y-1 text-slate-300 text-[11px]">
                <div>• Component: <span className="font-mono text-white">COMP-MCU-8849</span> (Austin stockout in 19h)</div>
                <div>• Cause: Super Typhoon Gaemi port embargo (+18d delay)</div>
                <div>• Shared Topology: Austin (FAC-A) and Munich (FAC-B) share inventory</div>
              </div>
            </div>

            {/* Historical Matching Incident */}
            <div className="bg-white/5 border border-white/10 rounded-lg p-3.5 space-y-2">
              <div className="text-[11px] font-bold text-amber-300 uppercase tracking-wider">
                Historical Incident ({topMatch.date})
              </div>
              <div className="font-semibold text-white">{topMatch.title}</div>
              <div className="space-y-1 text-slate-300 text-[11px]">
                <div>• Action Attempted in 2024: <span className="text-amber-200">Aggressive 400-unit transfer from Munich to Austin</span></div>
                <div>• Actual Result: <span className="text-red-300 font-bold">Munich ran out on Day 3.2 ($942k secondary emergency spend)</span></div>
                <div>• Crucial Lesson: <span className="text-emerald-300 font-medium">Never drain Munich below 180 units. Use balanced split!</span></div>
              </div>
            </div>
          </div>

          {/* Key Differences & Recommendation Note */}
          <div className="p-3 bg-blue-500/10 border border-blue-400/20 rounded-lg flex items-start space-x-2 text-xs text-blue-200">
            <CheckCircle2 className="w-4 h-4 text-blue-300 shrink-0 mt-0.5" />
            <div>
              <strong>Historical Memory Recommendation:</strong> ChainGuard AI evaluated the 2024 failure and mathematically configured Option 3 (Balanced Hybrid) to cap the Munich transfer at 180 units while securing 200 units from Certified Supplier Z, permanently preventing the secondary stockout that failed in 2024.
            </div>
          </div>
        </div>
      )}

      {/* Main Grid: Incident List (Left) + Detail Retrospective Drawer (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Filterable Incident Repository */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search historical incidents, codes, lessons..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center space-x-1.5 overflow-x-auto text-xs">
              {['ALL', 'WEATHER', 'LOGISTICS', 'QUALITY'].map(t => (
                <button
                  key={t}
                  onClick={() => setFilterType(t)}
                  className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                    filterType === t
                      ? 'bg-indigo-600 text-white font-semibold'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* List of Incidents */}
          <div className="space-y-3">
            {filteredIncidents.map(inc => {
              const badge = getStatusBadge(inc);
              const BadgeIcon = badge.icon;
              const isSelected = selectedIncident.id === inc.id;

              return (
                <div
                  key={inc.id}
                  onClick={() => setSelectedIncident(inc)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-50/70 border-indigo-300 ring-2 ring-indigo-500/20 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                          {inc.incidentCode}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {inc.date}
                        </span>
                      </div>
                      <h3 className="font-bold text-slate-900 text-xs mt-1.5 line-clamp-1">
                        {inc.title}
                      </h3>
                    </div>

                    <span className={`text-[10px] px-2 py-0.5 rounded border font-semibold flex items-center space-x-1 shrink-0 ${badge.color}`}>
                      <BadgeIcon className="w-3 h-3" />
                      <span>{badge.label}</span>
                    </span>
                  </div>

                  <p className="text-slate-600 text-[11px] mt-1.5 line-clamp-2">
                    {inc.selectedAction.description}
                  </p>

                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <div>
                      Spend: <strong>${(inc.actualOutcome?.actualCost || inc.predictedMetrics.cost).toLocaleString()}</strong>
                    </div>
                    {inc.similarityScore && (
                      <span className="text-indigo-600 font-semibold">
                        {inc.similarityScore}% Match
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Deep Incident Retrospective & Lessons Learned */}
        <div className="lg:col-span-7">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-5 sticky top-20">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded border border-indigo-200">
                    {selectedIncident.incidentCode}
                  </span>
                  <span className="text-xs text-slate-500 font-mono">
                    Incident Date: {selectedIncident.date}
                  </span>
                </div>
                <h2 className="text-base font-bold text-slate-900 mt-1">
                  {selectedIncident.title}
                </h2>
              </div>

              <button
                onClick={() => handleOpenRecordOutcome(selectedIncident)}
                className="shrink-0 flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-all"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>{selectedIncident.actualOutcome ? 'Update Outcome' : 'Record Actual Outcome'}</span>
              </button>
            </div>

            {/* Conditions Observed */}
            <div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                Initial Conditions Observed
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 block text-[10px]">Initial Delay</span>
                  <span className="font-bold text-slate-900">{selectedIncident.conditionsObserved.initialLeadTimeDelayDays} Days</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 block text-[10px]">Stock at Detection</span>
                  <span className="font-bold text-slate-900">{selectedIncident.conditionsObserved.stockOnHandAtDetection} Units</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 block text-[10px]">Daily Burn Rate</span>
                  <span className="font-bold text-slate-900">{selectedIncident.conditionsObserved.dailyBurnRate}/day</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 block text-[10px]">Criticality</span>
                  <span className="font-bold text-red-600">{selectedIncident.conditionsObserved.criticality}</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-600 mt-2 p-2 bg-slate-50 rounded border border-slate-200">
                <strong>Context:</strong> {selectedIncident.conditionsObserved.externalContext}
              </p>
            </div>

            {/* Selected Action Taken */}
            <div className="p-3.5 rounded-lg bg-indigo-50/50 border border-indigo-200 space-y-1.5 text-xs">
              <div className="font-bold text-indigo-950 flex items-center justify-between">
                <span>Selected Recovery Action</span>
                <span className="text-[10px] font-mono font-normal text-indigo-700">
                  Approved by: {selectedIncident.selectedAction.approvedBy}
                </span>
              </div>
              <p className="text-slate-800 font-medium">{selectedIncident.selectedAction.description}</p>
              <p className="text-[11px] text-slate-600">
                <strong>Rationale:</strong> {selectedIncident.selectedAction.rationale}
              </p>
            </div>

            {/* Predicted vs Actual Outcome Comparison */}
            <div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                Predicted vs Actual Outcomes
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                {/* Cost */}
                <div className="p-3 rounded-lg border border-slate-200 bg-white">
                  <span className="text-slate-500 text-[10px] block">Recovery Spend</span>
                  <div className="flex items-baseline justify-between mt-1">
                    <span className="text-xs text-slate-500">Pred: ${selectedIncident.predictedMetrics.cost.toLocaleString()}</span>
                    <span className="font-bold text-sm text-slate-900 font-mono">
                      ${(selectedIncident.actualOutcome?.actualCost || selectedIncident.predictedMetrics.cost).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Downtime */}
                <div className="p-3 rounded-lg border border-slate-200 bg-white">
                  <span className="text-slate-500 text-[10px] block">Line Downtime</span>
                  <div className="flex items-baseline justify-between mt-1">
                    <span className="text-xs text-slate-500">Pred: {selectedIncident.predictedMetrics.downtimeDays}d</span>
                    <span className={`font-bold text-sm font-mono ${
                      (selectedIncident.actualOutcome?.actualDowntimeDays || 0) > 0 ? 'text-red-600' : 'text-emerald-600'
                    }`}>
                      {selectedIncident.actualOutcome ? `${selectedIncident.actualOutcome.actualDowntimeDays} Days` : 'Pending'}
                    </span>
                  </div>
                </div>

                {/* Customer Delay */}
                <div className="p-3 rounded-lg border border-slate-200 bg-white">
                  <span className="text-slate-500 text-[10px] block">Customer Delay</span>
                  <div className="flex items-baseline justify-between mt-1">
                    <span className="text-xs text-slate-500">Pred: {selectedIncident.predictedMetrics.customerDelayDays}d</span>
                    <span className={`font-bold text-sm font-mono ${
                      (selectedIncident.actualOutcome?.actualCustomerDelayDays || 0) > 0 ? 'text-orange-600' : 'text-emerald-600'
                    }`}>
                      {selectedIncident.actualOutcome ? `${selectedIncident.actualOutcome.actualCustomerDelayDays} Days` : 'Pending'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Lessons Learned */}
            {selectedIncident.actualOutcome?.lessonsLearned && selectedIncident.actualOutcome.lessonsLearned.length > 0 && (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                <div className="flex items-center space-x-2 font-bold text-slate-900">
                  <BookOpen className="w-4 h-4 text-indigo-600" />
                  <span>Retrospective Lessons Learned (Historical Policy Drivers)</span>
                </div>
                <ul className="space-y-1.5 text-slate-700 pl-4 list-disc">
                  {selectedIncident.actualOutcome.lessonsLearned.map((lesson, idx) => (
                    <li key={idx} className="leading-relaxed">
                      {lesson}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Unsuccessful attempts */}
            {selectedIncident.actualOutcome?.unsuccessfulAttempts && selectedIncident.actualOutcome.unsuccessfulAttempts.length > 0 && (
              <div className="p-3.5 rounded-xl bg-red-50/60 border border-red-200 space-y-1.5 text-xs">
                <div className="font-bold text-red-900 flex items-center space-x-1.5">
                  <XCircle className="w-3.5 h-3.5 text-red-600" />
                  <span>Unsuccessful Recovery Attempts Observed</span>
                </div>
                <ul className="space-y-1 text-red-800 pl-4 list-disc text-[11px]">
                  {selectedIncident.actualOutcome.unsuccessfulAttempts.map((attempt, idx) => (
                    <li key={idx}>{attempt}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Record Outcome Modal */}
      {showOutcomeModal && incidentToRecord && (
        <RecordOutcomeModal
          incident={incidentToRecord}
          onClose={() => {
            setShowOutcomeModal(false);
            setIncidentToRecord(null);
          }}
          onSave={async (data) => {
            return await recordActualOutcome(incidentToRecord.id, data);
          }}
        />
      )}
    </div>
  );
};
