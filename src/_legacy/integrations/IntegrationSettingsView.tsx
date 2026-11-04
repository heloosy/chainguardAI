import React, { useState } from 'react';
import { 
  Sliders, 
  Server, 
  PlugZap, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Clock, 
  Key, 
  Lock, 
  Database, 
  ArrowRight, 
  Edit3, 
  Save, 
  Plus, 
  ExternalLink,
  Code,
  ShieldCheck,
  Zap,
  Activity
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ExternalConnectorConfig, ConnectorAuthType, FieldMappingEntry } from '../../types';

export const IntegrationSettingsView: React.FC = () => {
  const { 
    externalConnectors, 
    testConnector, 
    syncConnector, 
    updateConnectorConfig,
    dataMode,
    setDataMode,
    setActiveTab 
  } = useApp();

  const [selectedConnector, setSelectedConnector] = useState<ExternalConnectorConfig>(externalConnectors[0]);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    latencyMs: number;
    statusCode: number;
    statusText: string;
    details: string;
  } | null>(null);

  // Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editEndpointUrl, setEditEndpointUrl] = useState(selectedConnector.endpointUrl);
  const [editAuthMethod, setEditAuthMethod] = useState<ConnectorAuthType>(selectedConnector.authMethod);
  const [editTimeout, setEditTimeout] = useState(selectedConnector.timeoutMs);
  const [editRateLimit, setEditRateLimit] = useState(selectedConnector.rateLimitPerMinute);
  const [editMappings, setEditMappings] = useState<FieldMappingEntry[]>(selectedConnector.fieldMappings);

  const handleSelectConnector = (conn: ExternalConnectorConfig) => {
    setSelectedConnector(conn);
    setEditEndpointUrl(conn.endpointUrl);
    setEditAuthMethod(conn.authMethod);
    setEditTimeout(conn.timeoutMs);
    setEditRateLimit(conn.rateLimitPerMinute);
    setEditMappings(conn.fieldMappings);
    setIsEditing(false);
    setTestResult(null);
  };

  const handleTestConnection = async (connId: string) => {
    setTestingId(connId);
    setTestResult(null);
    try {
      const res = await testConnector(connId);
      setTestResult(res);
    } finally {
      setTestingId(null);
    }
  };

  const handleSyncNow = async (connId: string) => {
    setSyncingId(connId);
    try {
      await syncConnector(connId);
    } finally {
      setSyncingId(null);
    }
  };

  const handleSaveConfig = () => {
    const updated: ExternalConnectorConfig = {
      ...selectedConnector,
      endpointUrl: editEndpointUrl,
      authMethod: editAuthMethod,
      timeoutMs: Number(editTimeout),
      rateLimitPerMinute: Number(editRateLimit),
      fieldMappings: editMappings,
    };
    updateConnectorConfig(updated);
    setSelectedConnector(updated);
    setIsEditing(false);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-lg font-bold text-slate-900">
              Integration-Ready Architecture & REST Connectors
            </h1>
            <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded border border-emerald-200">
              Vendor-Neutral Adapter Layer
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Standard internal data model decouples ChainGuard resilience algorithms from specific ERP, WMS, and TMS platforms.
          </p>
        </div>

        {/* Mode Toggle Controls */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
            <button
              onClick={() => setDataMode('DEMONSTRATION')}
              className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
                dataMode === 'DEMONSTRATION'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Demonstration Mode
            </button>
            <button
              onClick={() => setDataMode('CONNECTED')}
              className={`px-3 py-1.5 rounded-md font-semibold transition-all flex items-center space-x-1.5 ${
                dataMode === 'CONNECTED'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
              <span>Connected Mode</span>
            </button>
          </div>
        </div>
      </div>

      {/* Notice Banner on Security & Credential Hygiene */}
      <div className="p-4 rounded-xl bg-blue-50/80 border border-blue-200 text-xs text-blue-900 flex items-start space-x-3">
        <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-bold">Enterprise Security & Zero-Trust Secrets Policy</div>
          <p className="text-blue-800 text-[11px] leading-relaxed">
            API keys, OAuth client secrets, and bearer tokens are strictly managed in server-side environment variables or Azure Key Vault / HashiCorp Vault. No credentials are ever exposed in frontend bundles, client console output, or browser logs.
          </p>
        </div>
      </div>

      {/* Main Grid: Connectors List (Left) + Connector Configuration Studio (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Configured Connectors */}
        <div className="lg:col-span-4 space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
            Configured Enterprise Connectors
          </div>

          {externalConnectors.map(conn => {
            const isSelected = selectedConnector.id === conn.id;

            return (
              <div
                key={conn.id}
                onClick={() => handleSelectConnector(conn)}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-blue-50/80 border-blue-300 ring-2 ring-blue-500/20 shadow-xs'
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center space-x-2.5">
                    <div className="p-2 rounded-lg bg-slate-100 text-slate-700">
                      <Server className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-xs">{conn.name}</h3>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                        {conn.category} • {conn.authMethod}
                      </div>
                    </div>
                  </div>

                  <span className={`text-[9px] px-2 py-0.5 rounded font-mono font-semibold ${
                    conn.healthStatus === 'CONNECTED'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-amber-100 text-amber-800 border border-amber-300'
                  }`}>
                    {conn.healthStatus}
                  </span>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
                  <span>Latency: <strong className="font-mono text-slate-800">{conn.lastPingMs}ms</strong></span>
                  <span>Indexed: <strong className="font-mono text-slate-800">{conn.recordsIndexed} records</strong></span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column: Connector Detail & Field Mapper */}
        <div className="lg:col-span-8 space-y-5">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-5">
            {/* Header & Quick Action Buttons */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-base font-bold text-slate-900">{selectedConnector.name}</h2>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                    {selectedConnector.systemType}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Last successful sync: {selectedConnector.lastSyncTimestamp}
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleTestConnection(selectedConnector.id)}
                  disabled={testingId === selectedConnector.id}
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 transition-colors"
                >
                  <Activity className="w-3.5 h-3.5 text-blue-600" />
                  <span>{testingId === selectedConnector.id ? 'Pinging...' : 'Test Connection'}</span>
                </button>

                <button
                  onClick={() => handleSyncNow(selectedConnector.id)}
                  disabled={syncingId === selectedConnector.id}
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow-xs transition-all"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${syncingId === selectedConnector.id ? 'animate-spin' : ''}`} />
                  <span>{syncingId === selectedConnector.id ? 'Syncing...' : 'Sync Now'}</span>
                </button>
              </div>
            </div>

            {/* Test Connection Probe Feedback Box */}
            {testResult && (
              <div className={`p-3.5 rounded-lg border text-xs space-y-1 ${
                testResult.success 
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                  : 'bg-red-50 border-red-300 text-red-950'
              }`}>
                <div className="flex items-center space-x-2 font-bold">
                  {testResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <XCircle className="w-4 h-4 text-red-600" />}
                  <span>Connection Test: {testResult.statusText} ({testResult.latencyMs}ms)</span>
                </div>
                <p className="text-[11px] leading-relaxed">{testResult.details}</p>
              </div>
            )}

            {/* Endpoint Configuration Form */}
            <div className="space-y-3.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                  Endpoint & Protocol Configuration
                </span>
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 font-semibold"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit Config</span>
                  </button>
                ) : (
                  <button
                    onClick={handleSaveConfig}
                    className="flex items-center space-x-1 text-emerald-600 hover:text-emerald-700 font-semibold"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Changes</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 font-medium mb-1">
                    API Endpoint URL
                  </label>
                  <input
                    type="text"
                    disabled={!isEditing}
                    value={editEndpointUrl}
                    onChange={e => setEditEndpointUrl(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono text-xs focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:opacity-80"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 font-medium mb-1">
                    Authentication Method
                  </label>
                  <select
                    disabled={!isEditing}
                    value={editAuthMethod}
                    onChange={e => setEditAuthMethod(e.target.value as ConnectorAuthType)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-xs focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:opacity-80"
                  >
                    <option value="OAUTH2">OAuth 2.0 (Client Credentials Grant)</option>
                    <option value="BEARER_TOKEN">Bearer Token (JWT)</option>
                    <option value="API_KEY">API Key (Custom Header)</option>
                    <option value="BASIC_AUTH">Basic Auth (Base64 Encrypted)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-500 font-medium mb-1">
                    Request Timeout (ms)
                  </label>
                  <input
                    type="number"
                    disabled={!isEditing}
                    value={editTimeout}
                    onChange={e => setEditTimeout(Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono text-xs focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:opacity-80"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 font-medium mb-1">
                    Rate Limit (Requests / Min)
                  </label>
                  <input
                    type="number"
                    disabled={!isEditing}
                    value={editRateLimit}
                    onChange={e => setEditRateLimit(Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono text-xs focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:opacity-80"
                  />
                </div>
              </div>
            </div>

            {/* Field Mapping Table */}
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                  Schema Field Mapping (Source JSON ➔ Internal Model)
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {selectedConnector.fieldMappings.length} Fields Mapped
                </span>
              </div>

              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                    <tr>
                      <th className="py-2 px-3">External Source Field</th>
                      <th className="py-2 px-3">Internal Domain Field</th>
                      <th className="py-2 px-3">Type</th>
                      <th className="py-2 px-3">Sample Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                    {selectedConnector.fieldMappings.map((m, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="py-2 px-3 text-blue-700 font-bold">{m.sourceField}</td>
                        <td className="py-2 px-3 text-slate-800 font-bold">{m.targetField}</td>
                        <td className="py-2 px-3 text-slate-500">{m.dataType}</td>
                        <td className="py-2 px-3 text-slate-600 font-sans">{m.sampleValue}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Synchronization Logs */}
            <div className="space-y-2 text-xs">
              <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                Connector Health & Audit Sync Log
              </span>
              <div className="space-y-1.5 font-mono text-[11px] bg-slate-900 text-slate-200 p-3 rounded-lg max-h-40 overflow-y-auto">
                {selectedConnector.syncLogs.map((log, idx) => (
                  <div key={idx} className="flex items-start space-x-2">
                    <span className="text-slate-500 shrink-0">{log.timestamp}</span>
                    <span className={`px-1 py-0.2 rounded text-[9px] shrink-0 ${
                      log.level === 'SUCCESS' ? 'bg-emerald-900/60 text-emerald-300' : 'bg-blue-900/60 text-blue-300'
                    }`}>
                      {log.level}
                    </span>
                    <span className="text-slate-300 leading-tight">{log.message}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
