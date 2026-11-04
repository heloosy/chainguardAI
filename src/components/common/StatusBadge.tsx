import React from 'react';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
  isFixture?: boolean;
  provenanceStatus?: 'VERIFIED' | 'ESTIMATED' | 'STALE' | 'UNVERIFIED';
  sourceConnector?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'sm',
  isFixture = false,
  provenanceStatus,
  sourceConnector,
}) => {
  const norm = status.toUpperCase().replace(/\s+/g, '_');

  let style = 'bg-slate-100 text-slate-700 border-slate-200';
  let dotColor = 'bg-slate-400';

  // Critical / High Risk / Delayed / Rejected
  if (['CRITICAL', 'HIGH', 'DELAYED', 'REJECTED', 'DISCONNECTED', 'ERROR'].includes(norm)) {
    style = 'bg-rose-50 text-rose-700 border-rose-200';
    dotColor = 'bg-rose-500';
  }
  // Medium / At Risk / Pending / Syncing / Warning
  else if (['AT_RISK', 'MEDIUM', 'PENDING', 'PENDING_APPROVAL', 'SYNCING', 'DEGRADED', 'CUSTOMS_HOLD'].includes(norm)) {
    style = 'bg-amber-50 text-amber-700 border-amber-200';
    dotColor = 'bg-amber-500';
  }
  // Healthy / Active / Approved / Delivered / Connected
  else if (['HEALTHY', 'ACTIVE', 'APPROVED', 'DELIVERED', 'CONNECTED', 'CONFIRMED', 'SUCCESS'].includes(norm)) {
    style = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    dotColor = 'bg-emerald-500';
  }
  // Informational / In Transit / Shipped / Monitoring / Simulating
  else if (['IN_TRANSIT', 'SHIPPED', 'MONITORING', 'SIMULATING', 'REROUTE', 'EXPEDITE'].includes(norm)) {
    style = 'bg-blue-50 text-blue-700 border-blue-200';
    dotColor = 'bg-blue-500';
  }

  const padding = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  return (
    <div className="inline-flex items-center gap-1.5 flex-wrap">
      <span className={`inline-flex items-center font-medium border rounded-full ${style} ${padding}`}>
        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${dotColor}`} />
        {status.replace(/_/g, ' ')}
      </span>

      {provenanceStatus && (
        <span
          className={`inline-flex items-center px-1.5 py-0.2 border text-[10px] font-mono rounded tracking-tight ${
            provenanceStatus === 'VERIFIED'
              ? 'bg-blue-50 text-blue-700 border-blue-200'
              : provenanceStatus === 'ESTIMATED'
              ? 'bg-purple-50 text-purple-700 border-purple-200'
              : provenanceStatus === 'STALE'
              ? 'bg-amber-50 text-amber-700 border-amber-200'
              : 'bg-slate-100 text-slate-500 border-slate-200'
          }`}
          title={`Data Provenance: ${provenanceStatus}`}
        >
          {provenanceStatus}
        </span>
      )}

      {sourceConnector && (
        <span className="text-[10px] font-mono text-slate-400">
          [{sourceConnector.replace(/_/g, ' ')}]
        </span>
      )}

      {isFixture && (
        <span className="inline-flex items-center px-1.5 py-0.2 bg-slate-100 text-slate-500 border border-slate-300 text-[10px] font-mono rounded tracking-tight">
          FIXTURE
        </span>
      )}
    </div>
  );
};
