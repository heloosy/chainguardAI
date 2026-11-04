import React, { useState, useEffect } from 'react';
import { CheckSquare, CheckCircle2, XCircle, RefreshCw, ArrowRight } from 'lucide-react';
import { apiClient, ApprovalRecord } from '../../services/apiClient';
import { useApp } from '../../context/AppContext';
import { PageHeader } from '../common/PageHeader';
import { DataTable, Column } from '../common/DataTable';
import { StatusBadge } from '../common/StatusBadge';
import { ConfirmationDialog } from '../common/ConfirmationDialog';
import { useToast } from '../common/Toast';

export const ApprovalsPage: React.FC = () => {
  const { seedFixtures, selectedRecordId, setSelectedRecordId, navigateToRecord, refreshData } = useApp();
  const { showToast } = useToast();
  const [approvals, setApprovals] = useState<ApprovalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');

  // Action dialog states
  const [activeAction, setActiveAction] = useState<{
    id: number;
    action: 'APPROVE' | 'REJECT';
    title: string;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionNotes, setActionNotes] = useState('');

  const fetchApprovals = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (statusFilter) params.status = statusFilter;
      const res = await apiClient.getApprovals(params);
      setApprovals(res);
    } catch (err) {
      console.error('Failed to load approvals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovals();
  }, [statusFilter]);

  const handleExecuteAction = async () => {
    if (!activeAction) return;
    try {
      setIsSubmitting(true);
      const res = await apiClient.actOnApproval(activeAction.id, {
        action: activeAction.action,
        approver: 'Executive Approver (VP Operations)',
        action_notes: actionNotes || `Authorized via ChainGuard Governance Gateway.`,
      });

      showToast(
        activeAction.action === 'APPROVE' ? 'success' : 'warning',
        `Approval ${activeAction.action}D`,
        res.message
      );
      setActiveAction(null);
      setActionNotes('');
      await fetchApprovals();
      await refreshData();
    } catch (err: any) {
      showToast('error', 'Action Execution Failed', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns: Column<ApprovalRecord>[] = [
    {
      key: 'approval_code',
      header: 'Approval Code',
      accessor: (row) => row.approval_code,
      render: (row) => <span className="font-mono font-medium text-slate-800">{row.approval_code}</span>,
    },
    {
      key: 'title',
      header: 'Authorization Item',
      accessor: (row) => row.title,
      render: (row) => (
        <div>
          <div className="font-semibold text-slate-900 line-clamp-1">{row.title}</div>
          <div className="text-[11px] text-slate-500">Requested by: {row.requested_by}</div>
        </div>
      ),
    },
    {
      key: 'risk_level',
      header: 'Risk Level',
      accessor: (row) => row.risk_level,
      render: (row) => <StatusBadge status={row.risk_level} size="sm" isFixture={row.is_fixture} />,
    },
    {
      key: 'financial_threshold',
      header: 'Exposure Threshold',
      accessor: (row) => row.financial_threshold,
      render: (row) => (
        <span className="font-mono text-xs text-slate-700">
          ${row.financial_threshold.toLocaleString()} USD
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Governance State',
      accessor: (row) => row.status,
      render: (row) => <StatusBadge status={row.status} size="sm" />,
    },
    {
      key: 'actions',
      header: 'Review & Sign-Off',
      render: (row) => {
        if (row.status !== 'PENDING') {
          return (
            <span className="text-xs text-slate-500 font-mono">
              {row.status} by {row.approver || 'System'}
            </span>
          );
        }
        return (
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setActiveAction({ id: row.id, action: 'APPROVE', title: row.title });
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-white bg-emerald-600 rounded-md hover:bg-emerald-700 transition"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Approve
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setActiveAction({ id: row.id, action: 'REJECT', title: row.title });
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 hover:text-rose-600 transition"
            >
              <XCircle className="w-3.5 h-3.5" />
              Reject
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 animate-fade-in">
      <PageHeader
        title="Human Governance & Approvals"
        description="Strict deterministic gatekeeper preventing autonomous financial commitments or production reroutes without authenticated management sign-off."
        breadcrumbs={[{ label: 'Approvals' }]}
        actions={
          <button
            onClick={fetchApprovals}
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
        data={approvals}
        isLoading={loading}
        searchPlaceholder="Search approvals by code, title, or requester..."
        emptyTitle="No Pending Approvals"
        emptyDescription="All staged recovery decisions and budget authorizations have been reviewed. Load development fixtures to verify sign-off workflows."
        onSeedFixtures={seedFixtures}
        filterComponent={
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">All Statuses</option>
            <option value="PENDING">Pending Only</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
        }
      />

      {/* Confirmation Dialog for Approving / Rejecting */}
      <ConfirmationDialog
        isOpen={!!activeAction}
        onClose={() => setActiveAction(null)}
        onConfirm={handleExecuteAction}
        isLoading={isSubmitting}
        title={activeAction?.action === 'APPROVE' ? 'Authorize Recovery Expenditure' : 'Reject Recovery Plan'}
        message={`Are you sure you want to ${activeAction?.action.toLowerCase()} "${activeAction?.title}"? This decision will be logged to the immutable governance audit ledger.`}
        confirmLabel={activeAction?.action === 'APPROVE' ? 'Confirm Approval' : 'Confirm Rejection'}
        variant={activeAction?.action === 'APPROVE' ? 'success' : 'danger'}
      />
    </div>
  );
};

