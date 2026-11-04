import React, { useState, useEffect } from 'react';
import { History, RefreshCw, BookOpen } from 'lucide-react';
import { apiClient, IncidentRecord } from '../../services/apiClient';
import { useApp } from '../../context/AppContext';
import { PageHeader } from '../common/PageHeader';
import { DataTable, Column } from '../common/DataTable';
import { StatusBadge } from '../common/StatusBadge';
import { RecordDrawer } from '../common/RecordDrawer';

export const IncidentHistoryPage: React.FC = () => {
  const { seedFixtures } = useApp();
  const [incidents, setIncidents] = useState<IncidentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIncident, setSelectedIncident] = useState<IncidentRecord | null>(null);

  const fetchIncidents = async () => {
    try {
      setLoading(true);
      const res = await apiClient.getIncidents();
      setIncidents(res);
    } catch (err) {
      console.error('Failed to load incident history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, []);

  const columns: Column<IncidentRecord>[] = [
    {
      key: 'incident_code',
      header: 'Incident Code',
      accessor: (row) => row.incident_code,
      render: (row) => <span className="font-mono font-medium text-slate-800">{row.incident_code}</span>,
    },
    {
      key: 'description',
      header: 'Incident Retrospective',
      accessor: (row) => row.description,
      render: (row) => (
        <div>
          <div className="font-semibold text-slate-900 line-clamp-1">{row.description}</div>
          <div className="text-[11px] text-slate-500 line-clamp-1">{row.root_cause || 'Root cause analyzed'}</div>
        </div>
      ),
    },
    {
      key: 'disruption_type',
      header: 'Disruption Class',
      accessor: (row) => row.disruption_type,
      render: (row) => (
        <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700">
          {row.disruption_type}
        </span>
      ),
    },
    {
      key: 'duration_days',
      header: 'Dwell Time',
      accessor: (row) => row.duration_days,
      render: (row) => <span className="font-mono text-xs">{row.duration_days} days to resolve</span>,
    },
    {
      key: 'financial_impact',
      header: 'Total Impact',
      accessor: (row) => row.financial_impact,
      render: (row) => (
        <span className="font-mono font-medium text-slate-900">
          ${row.financial_impact.toLocaleString()}
        </span>
      ),
    },
    {
      key: 'resolved_at',
      header: 'Resolved Date',
      accessor: (row) => row.resolved_at,
      render: (row) => (
        <span className="text-slate-500">
          {row.resolved_at ? new Date(row.resolved_at).toLocaleDateString() : '—'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusBadge status="RESOLVED" size="sm" isFixture={row.is_fixture} />,
    },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 animate-fade-in">
      <PageHeader
        title="Incident Memory & Retrospective"
        description="Case-based historical memory capturing post-mortem learnings, root causes, recovery lead-times, and playbook efficacy from past disruptions."
        breadcrumbs={[{ label: 'Incident History' }]}
        actions={
          <button
            onClick={fetchIncidents}
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
        data={incidents}
        isLoading={loading}
        onRowClick={(row) => setSelectedIncident(row)}
        searchPlaceholder="Search retrospective cases by code, root cause, or type..."
        emptyTitle="No Historical Incidents Recorded"
        emptyDescription="No closed incident records found. When past disruptions are resolved and post-mortems conducted, case memory records appear here."
        onSeedFixtures={seedFixtures}
      />

      {/* Record Deep-Dive Drawer */}
      <RecordDrawer
        isOpen={!!selectedIncident}
        onClose={() => setSelectedIncident(null)}
        title={selectedIncident?.description || ''}
        subtitle={`Class: ${selectedIncident?.disruption_type} • Duration: ${selectedIncident?.duration_days} days`}
        code={selectedIncident?.incident_code}
        status="RESOLVED"
        isFixture={selectedIncident?.is_fixture}
        fields={[
          { label: 'Incident Case Code', value: selectedIncident?.incident_code },
          { label: 'Disruption Class', value: selectedIncident?.disruption_type },
          { label: 'Incident Duration', value: `${selectedIncident?.duration_days} days to full resolution` },
          {
            label: 'Total Financial Impact',
            value: `$${(selectedIncident?.financial_impact || 0).toLocaleString()} USD`,
          },
          {
            label: 'Resolution Timestamp',
            value: selectedIncident?.resolved_at ? new Date(selectedIncident.resolved_at).toLocaleDateString() : '—',
          },
          { label: 'Root Cause Investigation', value: selectedIncident?.root_cause },
          { label: 'Effective Mitigation Strategy', value: selectedIncident?.effective_strategy },
          { label: 'Lessons Learned & Institutional Memory', value: selectedIncident?.lessons_learned },
        ]}
      />
    </div>
  );
};

