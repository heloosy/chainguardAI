import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Building2,
  Boxes,
  Truck,
  CheckSquare,
  Activity,
  ArrowRight,
  ShieldCheck,
  Server,
  Bot,
  RefreshCw,
  Plus
} from 'lucide-react';
import { apiClient, OverviewData } from '../../services/apiClient';
import { useApp } from '../../context/AppContext';
import { MetricCard } from '../common/MetricCard';
import { StatusBadge } from '../common/StatusBadge';
import { PageHeader } from '../common/PageHeader';
import { EmptyState } from '../common/EmptyState';

export const OverviewPage: React.FC = () => {
  const { setActiveTab, seedFixtures, isLoadingStatus } = useApp();
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchOverview = async () => {
    try {
      setLoading(true);
      const res = await apiClient.getOverview();
      setData(res);
    } catch (err) {
      console.error('Failed to fetch overview data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, [isLoadingStatus]);

  const hasData = data?.metrics.has_connected_data ?? false;
  const metrics = data?.metrics;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
      <PageHeader
        title="Supply Chain Resilience Overview"
        description="Continuous operational monitoring, early disruption detection, and consequence mitigation across suppliers, inventory, and logistics nodes."
        breadcrumbs={[{ label: 'Overview' }]}
        badge={
          metrics?.data_mode === 'FIXTURES_LOADED' ? (
            <span className="px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">
              Demo Fixtures Active
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
              Live Control Tower
            </span>
          )
        }
        actions={
          <button
            onClick={fetchOverview}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Telemetry
          </button>
        }
      />

      {/* 6 Mandatory Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* 1. Active Disruptions */}
        <MetricCard
          title="Active Disruptions"
          value={hasData && metrics?.active_disruptions !== null ? metrics?.active_disruptions : null}
          secondaryText="Require proactive triage"
          icon={AlertTriangle}
          hasData={hasData}
          badge={
            hasData && metrics?.active_disruptions ? { text: `${metrics.active_disruptions} Active`, variant: 'danger' } : undefined
          }
        />

        {/* 2. At-Risk Suppliers */}
        <MetricCard
          title="At-Risk Suppliers"
          value={hasData && metrics?.at_risk_suppliers !== null ? metrics?.at_risk_suppliers : null}
          secondaryText="Tier-1 & Tier-2 exposure"
          icon={Building2}
          hasData={hasData}
          badge={
            hasData && metrics?.at_risk_suppliers ? { text: `${metrics.at_risk_suppliers} At Risk`, variant: 'warning' } : undefined
          }
        />

        {/* 3. Inventory at Risk */}
        <MetricCard
          title="Inventory at Risk"
          value={
            hasData && metrics?.inventory_at_risk_count !== null
              ? `${metrics?.inventory_at_risk_count} SKUs`
              : null
          }
          secondaryText={
            hasData && metrics?.inventory_at_risk_value !== null
              ? `$${(metrics?.inventory_at_risk_value || 0).toLocaleString()} exposed`
              : 'Awaiting stock sync'
          }
          icon={Boxes}
          hasData={hasData}
          badge={hasData ? { text: 'Stock Critical', variant: 'warning' } : undefined}
        />

        {/* 4. Delayed Shipments */}
        <MetricCard
          title="Delayed Shipments"
          value={hasData && metrics?.delayed_shipments !== null ? metrics?.delayed_shipments : null}
          secondaryText="Ocean & Air Freight"
          icon={Truck}
          hasData={hasData}
          badge={
            hasData && metrics?.delayed_shipments ? { text: `${metrics.delayed_shipments} Delayed`, variant: 'danger' } : undefined
          }
        />

        {/* 5. Pending Approvals */}
        <MetricCard
          title="Pending Approvals"
          value={hasData && metrics?.pending_approvals !== null ? metrics?.pending_approvals : null}
          secondaryText="Governance Gatekeeper"
          icon={CheckSquare}
          hasData={hasData}
          badge={
            hasData && metrics?.pending_approvals ? { text: `${metrics.pending_approvals} Required`, variant: 'warning' } : undefined
          }
        />

        {/* 6. Data Connection Health */}
        <MetricCard
          title="Connection Health"
          value={
            hasData
              ? metrics?.data_connection_health === 'HEALTHY'
                ? 'Healthy'
                : metrics?.data_connection_health === 'DEGRADED'
                ? 'Degraded'
                : 'Disconnected'
              : null
          }
          secondaryText={hasData ? 'ERP / WMS / TMS Feeds' : 'Awaiting connector setup'}
          icon={Activity}
          hasData={hasData}
          badge={
            hasData
              ? {
                  text: metrics?.data_connection_health || 'DISCONNECTED',
                  variant:
                    metrics?.data_connection_health === 'HEALTHY'
                      ? 'success'
                      : metrics?.data_connection_health === 'DEGRADED'
                      ? 'warning'
                      : 'danger',
                }
              : undefined
          }
        />
      </div>

      {/* If Zero Data Connected, Show Central Empty State Prompt */}
      {!hasData && (
        <EmptyState
          title="No Connected Supply Chain Data"
          description="The resilience control tower is ready. Connect live ERP, WMS, and carrier EDI feeds, or seed isolated development fixtures to preview multi-tier disruptions, risk simulations, and governance workflows."
          actionLabel="Load Development Fixtures"
          onAction={seedFixtures}
          secondaryActionLabel="Configure Integrations"
          onSecondaryAction={() => setActiveTab('integrations')}
        />
      )}

      {/* Sections: Recent Alerts & Supply Chain Risk Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section 1: Recent Alerts */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Recent Disruption Alerts</h2>
              <p className="text-xs text-slate-500">Early warning telemetry from weather, AIS, and carrier feeds</p>
            </div>
            <button
              onClick={() => setActiveTab('disruptions')}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium inline-flex items-center gap-1"
            >
              View all
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {!hasData || data?.recent_alerts.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400 bg-slate-50 border border-dashed border-slate-200 rounded-lg">
              Awaiting data — no active alerts triggered
            </div>
          ) : (
            <div className="space-y-3">
              {data?.recent_alerts.map((alert) => (
                <div
                  key={alert.id}
                  onClick={() => setActiveTab('disruptions')}
                  className="p-3 bg-slate-50/70 border border-slate-200 rounded-lg hover:border-slate-300 transition cursor-pointer flex items-start justify-between gap-3"
                >
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle className={`w-4 h-4 shrink-0 mt-0.5 ${alert.severity === 'CRITICAL' ? 'text-rose-600' : 'text-amber-600'}`} />
                    <div>
                      <div className="text-xs font-semibold text-slate-800">{alert.title}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
                        <span>Source: {alert.source}</span>
                        <span>•</span>
                        <span>{alert.time}</span>
                      </div>
                    </div>
                  </div>
                  <StatusBadge status={alert.severity} size="sm" isFixture={alert.is_fixture} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section 2: Supply-Chain Risk Overview */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Supply-Chain Risk Overview</h2>
              <p className="text-xs text-slate-500">Multi-tier dependency stress levels across categories</p>
            </div>
          </div>

          {!hasData || data?.supply_chain_risk_overview.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400 bg-slate-50 border border-dashed border-slate-200 rounded-lg">
              Awaiting data — no risk models active
            </div>
          ) : (
            <div className="space-y-3">
              {data?.supply_chain_risk_overview.map((cat, idx) => (
                <div key={idx} className="p-3.5 border border-slate-200 rounded-lg bg-white">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold text-slate-800">{cat.category}</span>
                    <StatusBadge status={cat.risk_level} size="sm" />
                  </div>
                  <p className="text-xs text-slate-500">{cat.description}</p>
                  <div className="mt-2 text-[11px] font-mono text-slate-400">
                    Affected records in category: <span className="font-semibold text-slate-700">{cat.count}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Sections: Recent Recovery Decisions, Data-Source Status, Agent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Section 3: Recent Recovery Decisions */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Recent Recovery Decisions</h2>
              <p className="text-xs text-slate-500">Approved responses & mitigating actions</p>
            </div>
            <button
              onClick={() => setActiveTab('recovery-plans')}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium inline-flex items-center gap-1"
            >
              All
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {!hasData || data?.recent_recovery_decisions.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400 bg-slate-50 border border-dashed border-slate-200 rounded-lg">
              No recovery actions logged yet
            </div>
          ) : (
            <div className="space-y-2.5">
              {data?.recent_recovery_decisions.map((dec) => (
                <div
                  key={dec.id}
                  onClick={() => setActiveTab('recovery-plans')}
                  className="p-3 border border-slate-200 rounded-lg hover:border-slate-300 transition cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-[11px] font-semibold text-slate-700">{dec.code}</span>
                    <StatusBadge status={dec.status} size="sm" />
                  </div>
                  <p className="text-xs font-medium text-slate-800 line-clamp-1">{dec.title}</p>
                  <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
                    <span>Est: ${dec.cost.toLocaleString()}</span>
                    <span>{dec.time_impact}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section 4: Data-Source Connection Status */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Data-Source Connections</h2>
              <p className="text-xs text-slate-500">Live connectors status</p>
            </div>
            <button
              onClick={() => setActiveTab('integrations')}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium inline-flex items-center gap-1"
            >
              Configure
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {data?.data_source_status.slice(0, 4).map((conn) => (
              <div key={conn.id} className="p-3 border border-slate-200 rounded-lg flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-slate-800">{conn.name}</div>
                  <div className="text-[11px] text-slate-500">{conn.system_type}</div>
                </div>
                <StatusBadge status={conn.status} size="sm" />
              </div>
            ))}
          </div>
        </div>

        {/* Section 5: Agent Activity */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">AI Agent Activity</h2>
              <p className="text-xs text-slate-500">Autonomous surveillance & analysis</p>
            </div>
            <button
              onClick={() => setActiveTab('ai-agents')}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium inline-flex items-center gap-1"
            >
              Control
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {!hasData || data?.agent_activity.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400 bg-slate-50 border border-dashed border-slate-200 rounded-lg">
              Agents idling — awaiting data telemetry
            </div>
          ) : (
            <div className="space-y-3">
              {data?.agent_activity.map((agent) => (
                <div key={agent.agent_id} className="p-3 border border-slate-200 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                      <Bot className="w-3.5 h-3.5 text-blue-600" />
                      {agent.agent_name}
                    </span>
                    <StatusBadge status={agent.status} size="sm" />
                  </div>
                  <p className="text-[11px] text-slate-600 line-clamp-1">{agent.current_action}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

