import React, { useState, useEffect } from 'react';
import { PlugZap, CheckCircle2, XCircle, RefreshCw, Server, AlertCircle, ShieldAlert, Wifi } from 'lucide-react';
import { apiClient, IntegrationConnector } from '../../services/apiClient';
import { PageHeader } from '../common/PageHeader';
import { StatusBadge } from '../common/StatusBadge';
import { useToast } from '../common/Toast';

export const IntegrationsPage: React.FC = () => {
  const [connectors, setConnectors] = useState<IntegrationConnector[]>([]);
  const [loading, setLoading] = useState(true);
  const [testingId, setTestingId] = useState<string | null>(null);
  const { showToast } = useToast();

  const fetchIntegrations = async () => {
    try {
      setLoading(true);
      const res = await apiClient.getIntegrations();
      setConnectors(res);
    } catch (err) {
      console.error('Failed to load integrations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const handleTestConnection = async (connector: IntegrationConnector) => {
    try {
      setTestingId(connector.connector_id);
      const res = await apiClient.testConnector(connector.connector_id);
      if (res.success) {
        showToast('success', `${connector.name} Connected`, res.message);
      } else {
        showToast('warning', `Handshake Incomplete: ${connector.name}`, res.message);
      }
      await fetchIntegrations();
    } catch (err: any) {
      showToast('error', 'Connection Test Failed', err.message);
    } finally {
      setTestingId(null);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 animate-fade-in">
      <PageHeader
        title="Enterprise Data Integrations"
        description="Vendor-neutral integration layer connecting ERP systems, warehouse stock telemetry, carrier transponders, and procurement systems with honest reachability testing."
        breadcrumbs={[{ label: 'Integrations' }]}
        actions={
          <button
            onClick={fetchIntegrations}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        }
      />

      {/* Honest Data Banner */}
      <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
        <Server className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="text-xs text-blue-900 leading-relaxed">
          <p className="font-semibold text-blue-950 mb-0.5">Strict Data Provenance Standard</p>
          In accordance with Phase 1 data integrity guidelines, integration cards reflect true endpoint connectivity. If endpoints are unconfigured or template placeholders, they are accurately marked as <strong>DISCONNECTED</strong> until a live cryptographic or API handshake verifies connectivity.
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-500">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-xs font-medium">Checking external connector endpoints...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {connectors.map((connector) => (
            <div
              key={connector.id}
              className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col justify-between hover:border-slate-300 transition"
            >
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{connector.name}</h3>
                    <span className="font-mono text-[11px] text-slate-500">{connector.system_type}</span>
                  </div>
                  <StatusBadge status={connector.status} size="sm" isFixture={connector.is_fixture} />
                </div>

                <div className="space-y-2 bg-slate-50 border border-slate-200/80 rounded-lg p-3 text-xs mb-4">
                  <div className="flex items-center justify-between text-slate-500">
                    <span>Protocol / Auth</span>
                    <span className="font-mono text-slate-800">{connector.auth_type}</span>
                  </div>
                  <div className="flex items-start justify-between text-slate-500 gap-2">
                    <span className="shrink-0">Endpoint URL</span>
                    <span className="font-mono text-[11px] text-slate-700 truncate max-w-xs text-right">
                      {connector.endpoint_url || 'Unconfigured'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-500">
                    <span>Latency Response</span>
                    <span className="font-mono text-slate-800">
                      {connector.last_ping_latency_ms ? `${connector.last_ping_latency_ms} ms` : '—'}
                    </span>
                  </div>
                </div>

                <div className="text-xs text-slate-600 flex items-start gap-2 mb-4 bg-white p-2.5 rounded border border-slate-100">
                  <AlertCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <span className="text-[11px] leading-relaxed text-slate-600">{connector.health_message}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  {connector.records_synced > 0 ? `${connector.records_synced.toLocaleString()} records ingested` : 'No telemetry synced'}
                </span>
                <button
                  onClick={() => handleTestConnection(connector)}
                  disabled={testingId === connector.connector_id}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg shadow-2xs transition"
                >
                  {testingId === connector.connector_id ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Wifi className="w-3.5 h-3.5" />
                  )}
                  Test Handshake
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

