import React, { useState } from 'react';
import { 
  FileText, 
  Download, 
  Search, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Lock, 
  UserCheck, 
  Database,
  ExternalLink,
  ChevronRight,
  Info
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { AuditRecord, AuditStatus } from '../../types';

export const DecisionAudit: React.FC = () => {
  const { auditRecords, resetDemo } = useApp();

  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedRecord, setSelectedRecord] = useState<AuditRecord | null>(auditRecords[0] || null);

  const filteredRecords = auditRecords.filter(rec => {
    if (statusFilter !== 'ALL' && rec.status !== statusFilter) return false;
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      return (
        rec.actionTitle.toLowerCase().includes(q) ||
        rec.riskTitle.toLowerCase().includes(q) ||
        rec.user.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const exportToJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(auditRecords, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `chainguard_decision_audit_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const getStatusBadge = (status: AuditStatus) => {
    switch (status) {
      case 'APPROVED':
        return { label: 'APPROVED', color: 'bg-emerald-100 text-emerald-800 border-emerald-300', icon: CheckCircle2 };
      case 'REJECTED':
        return { label: 'REJECTED', color: 'bg-slate-100 text-slate-800 border-slate-300', icon: XCircle };
      case 'EXECUTED_SIMULATED':
        return { label: 'SIMULATED POSTING', color: 'bg-blue-100 text-blue-800 border-blue-300', icon: UserCheck };
      default:
        return { label: status, color: 'bg-amber-100 text-amber-800 border-amber-300', icon: AlertTriangle };
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-lg font-bold text-slate-900">
              Governance & Decision Audit Trail
            </h1>
            <span className="text-[10px] font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
              Tamper-Evident History
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Complete operational ledger of detected risks, verified mitigation strategies, human approvals, and staged SAP material documents.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={exportToJson}
            className="flex items-center space-x-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Audit JSON</span>
          </button>
        </div>
      </div>

      {/* Main Audit Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Filterable Audit Log List */}
        <div className="lg:col-span-7 space-y-4">
          {/* Filters */}
          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search audit records..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div className="flex items-center space-x-1 text-xs">
              {['ALL', 'APPROVED', 'REJECTED'].map(st => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                    statusFilter === st
                      ? 'bg-blue-600 text-white font-semibold'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Record Items */}
          <div className="space-y-3">
            {filteredRecords.map(rec => {
              const isSelected = selectedRecord?.id === rec.id;
              const badge = getStatusBadge(rec.status);
              const BadgeIcon = badge.icon;

              return (
                <div
                  key={rec.id}
                  onClick={() => setSelectedRecord(rec)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-blue-50/80 border-blue-400 shadow-xs ring-1 ring-blue-400'
                      : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border flex items-center space-x-1 ${badge.color}`}>
                      <BadgeIcon className="w-3 h-3" />
                      <span>{badge.label}</span>
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      {rec.timestamp}
                    </span>
                  </div>

                  <h3 className="text-xs font-bold text-slate-900 leading-snug">
                    {rec.actionTitle}
                  </h3>

                  <div className="text-[11px] text-slate-500 mt-1 line-clamp-1">
                    Risk Context: {rec.riskTitle}
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <span>
                      Sign-off: <strong>{rec.user}</strong> ({rec.userRole})
                    </span>
                    <span className="text-blue-600 font-semibold flex items-center">
                      Inspect details <ChevronRight className="w-3 h-3 ml-0.5" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Detailed Record View Drawer */}
        <div className="lg:col-span-5">
          {selectedRecord ? (
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">
                  Audit Transaction: {selectedRecord.id}
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">
                  {selectedRecord.actionTitle}
                </h3>
                <div className="text-xs text-slate-500 mt-0.5">
                  Logged at {selectedRecord.timestamp}
                </div>
              </div>

              {/* Rationale Callout */}
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                <div className="text-[10px] font-bold uppercase text-slate-400">
                  Decision Rationale & Executive Justification:
                </div>
                <div className="text-xs text-slate-800 leading-relaxed font-sans">
                  "{selectedRecord.rationale}"
                </div>
              </div>

              {/* Attributes Table */}
              <div className="space-y-2 text-xs">
                <div className="text-[10px] font-bold uppercase text-slate-400">
                  Execution Telemetry
                </div>
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden bg-white">
                  <div className="p-2 flex justify-between">
                    <span className="text-slate-500">Authorized By:</span>
                    <span className="font-semibold text-slate-800">{selectedRecord.user}</span>
                  </div>
                  <div className="p-2 flex justify-between">
                    <span className="text-slate-500">Role:</span>
                    <span className="font-semibold text-slate-800">{selectedRecord.userRole}</span>
                  </div>
                  <div className="p-2 flex justify-between">
                    <span className="text-slate-500">Financial Impact:</span>
                    <span className="font-semibold font-mono text-slate-800">
                      ${selectedRecord.financialCost.toLocaleString()}
                    </span>
                  </div>
                  <div className="p-2 flex justify-between">
                    <span className="text-slate-500">Secondary Shortage:</span>
                    <span className={`font-semibold ${selectedRecord.secondaryShortagePrevented ? 'text-emerald-600' : 'text-slate-600'}`}>
                      {selectedRecord.secondaryShortagePrevented ? 'Prevented (Rule SEC-01)' : 'Not Triggered'}
                    </span>
                  </div>
                  <div className="p-2 flex justify-between">
                    <span className="text-slate-500">SAP Staging Document:</span>
                    <span className="font-semibold font-mono text-blue-600">
                      {selectedRecord.sapDocumentReference || 'MATDOC-SIM-781920'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Post-execution state preview */}
              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-lg text-xs space-y-1">
                <div className="font-bold text-blue-900">Post-Action Physical Reserves:</div>
                <div className="flex justify-between text-blue-800 font-mono text-[11px]">
                  <span>Austin Stock: {selectedRecord.details.factoryAStockAfter} units</span>
                  <span>Munich Stock: {selectedRecord.details.factoryBStockAfter} units</span>
                </div>
              </div>

              <div className="text-[10px] text-slate-400 bg-slate-50 p-2 rounded border border-slate-200">
                <strong>Audit Compliance:</strong> Log entries are cryptographically stamped and synchronized with SAP S/4HANA Change Document Object (BANF / EKKO).
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400 text-xs">
              Select an audit record to inspect details.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
