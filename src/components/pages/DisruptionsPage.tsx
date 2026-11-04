import React, { useState, useEffect } from 'react';
import { AlertTriangle, RefreshCw, Zap } from 'lucide-react';
import { apiClient, DisruptionRecord, RecoveryPlanRecord } from '../../services/apiClient';
import { useApp } from '../../context/AppContext';
import { PageHeader } from '../common/PageHeader';
import { DataTable, Column } from '../common/DataTable';
import { StatusBadge } from '../common/StatusBadge';
import { RecordDrawer } from '../common/RecordDrawer';

export const DisruptionsPage: React.FC = () => {
  const { seedFixtures, selectedRecordId, setSelectedRecordId, navigateToRecord } = useApp();
  const [disruptions, setDisruptions] = useState<DisruptionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [selectedDisruption, setSelectedDisruption] = useState<DisruptionRecord | null>(null);
  const [recoveryPlans, setRecoveryPlans] = useState<RecoveryPlanRecord[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const fetchDisruptions = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (severityFilter) params.severity = severityFilter;
      if (statusFilter) params.status = statusFilter;
      const res = await apiClient.getDisruptions(params);
      setDisruptions(res);

      if (selectedRecordId) {
        const found = res.find((d) => d.id === selectedRecordId);
        if (found) handleSelectDisruption(found);
      }
    } catch (err) {
      console.error('Failed to load disruptions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDisruptions();
  }, [severityFilter, statusFilter]);

  const handleSelectDisruption = async (disruption: DisruptionRecord) => {
    setSelectedDisruption(disruption);
    setSelectedRecordId(disruption.id);
    try {
      setLoadingDetail(true);
      const res = await apiClient.getDisruptionDetail(disruption.id);
      setRecoveryPlans(res.recovery_plans);
    } catch (err) {
      console.error('Failed to load disruption detail:', err);
    } finally {
      setLoadingDetail(false);
    }
  };

  const columns: Column<DisruptionRecord>[] = [
    {
      key: 'disruption_code',
      header: 'Code',
      accessor: (row) => row.disruption_code,
      render: (row) => <span className="font-mono font-medium text-slate-800">{row.disruption_code}</span>,
    },
    {
      key: 'title',
      header: 'Incident / Hazard',
      accessor: (row) => row.title,
      render: (row) => (
        <div>
          <div className="font-semibold text-slate-900 line-clamp-1">{row.title}</div>
          <div className="text-[11px] text-slate-500">{row.affected_region}</div>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      accessor: (row) => row.category,
      render: (row) => (
        <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700">
          {row.category}
        </span>
      ),
    },
    {
      key: 'severity',
      header: 'Severity',
      accessor: (row) => row.severity,
      render: (row) => <StatusBadge status={row.severity} size="sm" isFixture={row.is_fixture} />,
    },
    {
      key: 'affected_inventory_value',
      header: 'Exposed Value',
      accessor: (row) => row.affected_inventory_value || row.estimated_loss || 0,
      render: (row) => (
        <span className="font-mono font-medium text-slate-900">
          ${(row.affected_inventory_value || row.estimated_loss || 0).toLocaleString()}
        </span>
      ),
    },
    {
      key: 'recovery_plans_count',
      header: 'Recovery Options',
      accessor: (row) => row.recovery_plans_count,
      render: (row) => (
        <span className="text-xs text-blue-600 font-semibold">{row.recovery_plans_count || 0} plans</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      accessor: (row) => row.status,
      render: (row) => <StatusBadge status={row.status} size="sm" />,
    },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 animate-fade-in">
      <PageHeader
        title="Supply Chain Disruptions"
        description="Real-time disruption events synthesized from global geopolitical intelligence, weather alerts, carrier AIS transponders, and port dwell times."
        breadcrumbs={[{ label: 'Disruptions' }]}
        actions={
          <button
            onClick={fetchDisruptions}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        }
      />

      <DataTable
        columns={columns}
        data={disruptions}
        isLoading={loading}
        onRowClick={handleSelectDisruption}
        searchPlaceholder="Search disruptions by code, title, region..."
        emptyTitle="No Active Disruptions Detected"
        emptyDescription="All monitored corridors and suppliers are operating within normal tolerances. Load development fixtures to test early warning simulations."
        onSeedFixtures={seedFixtures}
        filterComponent={
          <div className="flex items-center gap-2">
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">All Severities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="DETECTED">Detected</option>
              <option value="MITIGATING">Mitigating</option>
              <option value="RESOLVED">Resolved</option>
            </select>
          </div>
        }
      />

      {/* Record Deep-Dive Drawer */}
      <RecordDrawer
        isOpen={!!selectedDisruption}
        onClose={() => {
          setSelectedDisruption(null);
          setSelectedRecordId(null);
        }}
        title={selectedDisruption?.title || ''}
        subtitle={`${selectedDisruption?.category} Disruption • Region: ${selectedDisruption?.affected_region}`}
        code={selectedDisruption?.disruption_code}
        status={selectedDisruption?.severity}
        isFixture={selectedDisruption?.is_fixture}
        fields={[
          { label: 'Event Identifier', value: selectedDisruption?.disruption_code },
          { label: 'Disruption Class', value: selectedDisruption?.category },
          { label: 'Geographic Region', value: selectedDisruption?.affected_region },
          {
            label: 'Estimated Exposed Value',
            value: `$${(selectedDisruption?.affected_inventory_value || selectedDisruption?.estimated_loss || 0).toLocaleString()}`,
          },
          { label: 'Impacted Suppliers Count', value: `${selectedDisruption?.affected_suppliers_count || 1} supplier(s)` },
          {
            label: 'Detection Timestamp',
            value: selectedDisruption?.detected_at
              ? new Date(selectedDisruption.detected_at).toLocaleString()
              : 'Real-time telemetry scan',
          },
          { label: 'Disruption Summary', value: selectedDisruption?.summary },
          { label: 'Recommended Mitigation', value: selectedDisruption?.recommended_action },
        ]}
        relatedSections={[
          {
            title: 'Generated Recovery Action Plans',
            items: recoveryPlans.map((plan) => ({
              id: plan.id,
              title: plan.title,
              subtitle: `Strategy: ${plan.strategy_type} • Est Cost: $${plan.estimated_cost.toLocaleString()} • ${plan.time_to_recovery_days} days to recover`,
              badge: plan.status,
              onClick: () => {
                setSelectedDisruption(null);
                navigateToRecord('recovery-plans', plan.id);
              },
            })),
            emptyText: 'No recovery plans generated for this disruption yet',
          },
        ]}
      />
    </div>
  );
};

