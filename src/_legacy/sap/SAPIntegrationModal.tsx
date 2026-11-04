import React, { useState } from 'react';
import { 
  Database, 
  Server, 
  ExternalLink, 
  Key, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  Layers,
  HelpCircle,
  Code2
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const SAPIntegrationModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { sapHealth, connectionMode, setConnectionMode } = useApp();
  const [activeTab, setActiveTab] = useState<'TELEMETRY' | 'ENDPOINTS' | 'CONFIG'>('TELEMETRY');

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-blue-600 text-white">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                SAP Integration Architecture & BTP Connectivity
              </h2>
              <p className="text-xs text-slate-500">
                OData v4 REST services, SAP Business Technology Platform (BTP), and S/4HANA adapters
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-sm font-bold px-2 py-1"
          >
            ✕
          </button>
        </div>

        {/* Mode Selector Pill */}
        <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200">
          <div className="text-xs">
            <span className="font-bold text-slate-800">Current Provider Mode: </span>
            <span className="font-mono text-blue-600 font-semibold">
              {connectionMode === 'MOCK_SAP_ODATA' ? 'Deterministic SAP OData Mock Sandbox' : 'Live SAP BTP Destination'}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setConnectionMode('MOCK_SAP_ODATA')}
              className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                connectionMode === 'MOCK_SAP_ODATA'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
              }`}
            >
              Mock Sandbox
            </button>
            <button
              onClick={() => setConnectionMode('SAP_BTP_LIVE')}
              className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                connectionMode === 'SAP_BTP_LIVE'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
              }`}
            >
              Live SAP BTP
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 text-xs">
          <button
            onClick={() => setActiveTab('TELEMETRY')}
            className={`pb-2 px-3 font-semibold transition-colors border-b-2 ${
              activeTab === 'TELEMETRY'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Service Telemetry & Status
          </button>
          <button
            onClick={() => setActiveTab('ENDPOINTS')}
            className={`pb-2 px-3 font-semibold transition-colors border-b-2 ${
              activeTab === 'ENDPOINTS'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            OData Endpoints & Entities
          </button>
          <button
            onClick={() => setActiveTab('CONFIG')}
            className={`pb-2 px-3 font-semibold transition-colors border-b-2 ${
              activeTab === 'CONFIG'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            BTP Credentials Setup
          </button>
        </div>

        {/* Content */}
        {activeTab === 'TELEMETRY' && (
          <div className="space-y-3">
            {sapHealth.map((sh, idx) => (
              <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-slate-900">{sh.serviceName}</div>
                  <div className="text-[11px] font-mono text-slate-400 truncate max-w-md">{sh.endpointUrl}</div>
                  <div className="text-[10px] text-slate-500 mt-1">
                    Records indexed: <strong>{sh.recordsIndexed}</strong> • Last sync: {sh.lastSyncTime}
                  </div>
                </div>
                <div className="text-right">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5"></span>
                    {connectionMode === 'SAP_BTP_LIVE' ? 'LIVE OK' : 'MOCK ACTIVE'}
                  </span>
                  <div className="text-[11px] font-mono text-slate-400 mt-1">{sh.latencyMs}ms</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'ENDPOINTS' && (
          <div className="space-y-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="font-bold text-slate-900 flex items-center space-x-1.5">
                <Code2 className="w-4 h-4 text-blue-600" />
                <span>SAP S/4HANA OData v4 Integration Mappings:</span>
              </div>
              <ul className="space-y-2 font-mono text-[11px] text-slate-700 pl-2">
                <li>
                  <strong className="text-blue-700">API_PURCHASEORDER_PROCESS_SRV/A_PurchaseOrder</strong>:
                  <div className="text-slate-500 pl-4 font-sans text-[11px]">Used for tracking inbound PO line delays & vendor commitments.</div>
                </li>
                <li>
                  <strong className="text-blue-700">API_MATERIAL_DOCUMENT_SRV/A_MaterialDocumentHeader</strong>:
                  <div className="text-slate-500 pl-4 font-sans text-[11px]">Invoked by ChainGuard to stage 301/351 inter-plant stock transport orders.</div>
                </li>
                <li>
                  <strong className="text-blue-700">SAP IBP KeyFigureQuery/SupplyPlanningKeyFigures</strong>:
                  <div className="text-slate-500 pl-4 font-sans text-[11px]">Provides safety stock thresholds & multi-echelon demand forecasts.</div>
                </li>
                <li>
                  <strong className="text-blue-700">SAP Ariba SupplierRisk API /scores</strong>:
                  <div className="text-slate-500 pl-4 font-sans text-[11px]">Evaluates vendor qualification audits and ISO compliance status.</div>
                </li>
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'CONFIG' && (
          <div className="space-y-3 text-xs">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl space-y-2">
              <div className="font-bold text-blue-900 flex items-center space-x-1.5">
                <Key className="w-4 h-4 text-blue-600" />
                <span>Connecting to a Live SAP BTP Tenant:</span>
              </div>
              <p className="text-blue-800 leading-relaxed text-[11px]">
                To bind live SAP credentials, configure the following environment variables in your deployment environment or <code>.env</code> file:
              </p>
              <pre className="bg-slate-900 text-slate-200 p-2.5 rounded text-[11px] font-mono overflow-x-auto">
{`VITE_SAP_S4HANA_URL=https://my-s4hana.s4hana.ondemand.com
VITE_SAP_BTP_DESTINATION=S4HANA_PRD_DEST
VITE_SAP_CLIENT_ID=sb-clone-service-instance!b12345
VITE_SAP_CLIENT_SECRET=********
VITE_SAP_TOKEN_URL=https://my-tenant.authentication.eu10.hana.ondemand.com/oauth/token`}
              </pre>
              <div className="text-[11px] text-blue-900 font-medium">
                Note: In accordance with hackfest rules, when live credentials are absent, ChainGuard transparently uses the deterministic mock provider.
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Enterprise Read/Stage Boundary Active</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
