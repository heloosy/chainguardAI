import React, { useState, useEffect } from 'react';
import { ShieldCheck, RefreshCw, Filter, FileText } from 'lucide-react';
import { apiClient, AuditLogRecord } from '../../services/apiClient';
import { PageHeader } from '../common/PageHeader';
import { DataTable, Column } from '../common/DataTable';
import { StatusBadge } from '../common/StatusBadge';
import { RecordDrawer } from '../common/RecordDrawer';

export const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [eventTypeFilter, setEventTypeFilter] = useState('');
  const [selectedLog, setSelectedLog] = useState<AuditLogRecord | null>(null);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params: any = { limit: 100 };
      if (eventTypeFilter) params.event_type = eventTypeFilter;
      const res = await apiClient.getAuditLogs(params);
      setLogs(res);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [eventTypeFilter]);

  const columns: Column<AuditLogRecord>[] = [
    {
      key: 'timestamp',
      header: 'Timestamp',
      accessor: (row) => row.timestamp,
      render: (row) => (
        <span className="font-mono text-xs text-slate-500">
          {new Date(row.timestamp).toLocaleString()}
        </span>
      ),
    },
    {
      key: 'event_type',
      header: 'Event Action',
      accessor: (row) => row.event_type,
      render: (row) => <StatusBadge status={row.event_type} size="sm" />,
    },
    {
      key: 'entity',
      header: 'Entity Ref',
      render: (row) => (
        <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
          {row.entity_type} {row.entity_id ? `#${row.entity_id}` : ''}
        </span>
      ),
    },
    {
      key: 'description',
      header: 'Audit Description',
      accessor: (row) => row.description,
      render: (row) => <div className="text-xs text-slate-800 font-medium">{row.description}</div>,
    },
    {
      key: 'user',
      header: 'Actor / User',
      render: (row) => (
        <div>
          <div className="text-xs font-semibold text-slate-800">{row.user_name || 'System Process'}</div>
          <div className="text-[10px] text-slate-400 font-mono">{row.user_email || 'internal-daemon'}</div>
        </div>
      ),
    },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 animate-fade-in">
      <PageHeader
        title="Immutable Governance Audit Logs"
        description="Persistent compliance ledger tracking all administrative actions, data model mutations, supplier deletions, and human authorization decisions."
        breadcrumbs={[{ label: 'Audit Logs' }]}
        actions={
          <button
            onClick={fetchLogs}
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
        data={logs}
        isLoading={loading}
        onRowClick={(row) => setSelectedLog(row)}
        searchPlaceholder="Search audit trails by actor, description, entity..."
        emptyTitle="No Audit Events Recorded"
        emptyDescription="Audit records will automatically accumulate as data operations and executive approvals occur."
        filterComponent={
          <select
            value={eventTypeFilter}
            onChange={(e) => setEventTypeFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">All Event Types</option>
            <option value="CREATE">Create</option>
            <option value="UPDATE">Update</option>
            <option value="DELETE">Delete</option>
            <option value="APPROVE">Approve</option>
            <option value="REJECT">Reject</option>
            <option value="SYNC">Sync</option>
            <option value="LOGIN">Login</option>
            <option value="BOOTSTRAP">Bootstrap</option>
          </select>
        }
      />

      {/* Record Deep-Dive Drawer */}
      <RecordDrawer
        isOpen={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        title={selectedLog?.description || ''}
        subtitle={`Audit ID: #${selectedLog?.id} • Action: ${selectedLog?.event_type}`}
        code={`AUDIT-${selectedLog?.id}`}
        status={selectedLog?.event_type}
        fields={[
          { label: 'Event Action', value: selectedLog?.event_type },
          { label: 'Entity Target', value: `${selectedLog?.entity_type} ID: ${selectedLog?.entity_id || 'N/A'}` },
          { label: 'Executing User', value: `${selectedLog?.user_name} (${selectedLog?.user_email})` },
          { label: 'Timestamp', value: selectedLog?.timestamp ? new Date(selectedLog.timestamp).toLocaleString() : '—' },
          { label: 'Client Address', value: selectedLog?.ip_address || 'Server Localhost' },
          {
            label: 'Mutated Values',
            value: selectedLog?.new_values ? JSON.stringify(selectedLog.new_values, null, 2) : 'No payload',
          },
        ]}
      />
    </div>
  );
};
