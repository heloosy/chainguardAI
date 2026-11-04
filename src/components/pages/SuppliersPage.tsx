import React, { useState, useEffect } from 'react';
import { Building2, Plus, Filter, ExternalLink, RefreshCw } from 'lucide-react';
import { apiClient, SupplierRecord, InventoryRecord, PurchaseOrderRecord } from '../../services/apiClient';
import { useApp } from '../../context/AppContext';
import { PageHeader } from '../common/PageHeader';
import { DataTable, Column } from '../common/DataTable';
import { StatusBadge } from '../common/StatusBadge';
import { RecordDrawer } from '../common/RecordDrawer';

export const SuppliersPage: React.FC = () => {
  const { seedFixtures, selectedRecordId, setSelectedRecordId, navigateToRecord } = useApp();
  const [suppliers, setSuppliers] = useState<SupplierRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [tierFilter, setTierFilter] = useState<string>('');
  const [selectedSupplier, setSelectedSupplier] = useState<SupplierRecord | null>(null);
  const [detailData, setDetailData] = useState<{
    linked_inventory: InventoryRecord[];
    linked_purchase_orders: PurchaseOrderRecord[];
  } | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (statusFilter) params.status = statusFilter;
      if (tierFilter) params.tier = parseInt(tierFilter);
      const res = await apiClient.getSuppliers(params);
      setSuppliers(res);

      if (selectedRecordId) {
        const found = res.find((s) => s.id === selectedRecordId);
        if (found) handleSelectSupplier(found);
      }
    } catch (err) {
      console.error('Failed to load suppliers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, [statusFilter, tierFilter]);

  const handleSelectSupplier = async (supplier: SupplierRecord) => {
    setSelectedSupplier(supplier);
    setSelectedRecordId(supplier.id);
    try {
      setLoadingDetail(true);
      const res = await apiClient.getSupplierDetail(supplier.id);
      setDetailData({
        linked_inventory: res.linked_inventory,
        linked_purchase_orders: res.linked_purchase_orders,
      });
    } catch (err) {
      console.error('Failed to load supplier detail:', err);
    } finally {
      setLoadingDetail(false);
    }
  };

  const columns: Column<SupplierRecord>[] = [
    {
      key: 'supplier_code',
      header: 'Supplier Code',
      accessor: (row) => row.supplier_code,
      render: (row) => <span className="font-mono font-medium text-slate-700">{row.supplier_code}</span>,
    },
    {
      key: 'name',
      header: 'Company Name',
      accessor: (row) => row.name,
      render: (row) => (
        <div>
          <div className="font-semibold text-slate-900">{row.name}</div>
          <div className="text-[11px] text-slate-500">{row.critical_components || 'Standard supply'}</div>
        </div>
      ),
    },
    {
      key: 'tier',
      header: 'Tier',
      accessor: (row) => row.tier,
      render: (row) => (
        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[11px]">
          Tier {row.tier}
        </span>
      ),
    },
    {
      key: 'country',
      header: 'Country',
      accessor: (row) => row.country,
    },
    {
      key: 'risk_score',
      header: 'Risk Score',
      accessor: (row) => row.risk_score,
      render: (row) => (
        <div className="flex items-center gap-2">
          <div className="w-16 h-1.5 rounded-full bg-slate-100 overflow-hidden">
            <div
              className={`h-full ${row.risk_score > 60 ? 'bg-rose-500' : row.risk_score > 30 ? 'bg-amber-500' : 'bg-emerald-500'}`}
              style={{ width: `${Math.min(row.risk_score, 100)}%` }}
            />
          </div>
          <span className="font-mono text-xs text-slate-700">{row.risk_score.toFixed(1)}</span>
        </div>
      ),
    },
    {
      key: 'on_time_delivery_rate',
      header: 'OTIF %',
      accessor: (row) => row.on_time_delivery_rate,
      render: (row) => <span className="font-mono text-xs">{row.on_time_delivery_rate.toFixed(1)}%</span>,
    },
    {
      key: 'status',
      header: 'Status',
      accessor: (row) => row.status,
      render: (row) => <StatusBadge status={row.status} size="sm" isFixture={row.is_fixture} />,
    },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 animate-fade-in">
      <PageHeader
        title="Suppliers Directory"
        description="Comprehensive view of Tier-1 and Tier-2 component vendors, operational risk scores, on-time delivery rates, and single-source dependency flags."
        breadcrumbs={[{ label: 'Suppliers' }]}
        actions={
          <button
            onClick={fetchSuppliers}
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
        data={suppliers}
        isLoading={loading}
        onRowClick={handleSelectSupplier}
        searchPlaceholder="Search suppliers by name, code, component, or country..."
        emptyTitle="No Connected Suppliers"
        emptyDescription="No vendor master records found. Connect SAP S/4HANA or Coupa procurement feeds, or load development fixtures to explore multi-tier suppliers."
        onSeedFixtures={seedFixtures}
        filterComponent={
          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="AT_RISK">At Risk</option>
              <option value="INACTIVE">Inactive</option>
            </select>

            <select
              value={tierFilter}
              onChange={(e) => setTierFilter(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">All Tiers</option>
              <option value="1">Tier 1</option>
              <option value="2">Tier 2</option>
            </select>
          </div>
        }
      />

      {/* Record Deep-Dive Drawer */}
      <RecordDrawer
        isOpen={!!selectedSupplier}
        onClose={() => {
          setSelectedSupplier(null);
          setSelectedRecordId(null);
        }}
        title={selectedSupplier?.name || ''}
        subtitle={`Tier ${selectedSupplier?.tier} Strategic Vendor • ${selectedSupplier?.country}`}
        code={selectedSupplier?.supplier_code}
        status={selectedSupplier?.status}
        isFixture={selectedSupplier?.is_fixture}
        fields={[
          { label: 'Supplier Code', value: selectedSupplier?.supplier_code },
          { label: 'Tier Level', value: `Tier ${selectedSupplier?.tier}` },
          { label: 'Operating Country', value: selectedSupplier?.country },
          { label: 'Risk Score', value: `${selectedSupplier?.risk_score.toFixed(1)} / 100` },
          { label: 'Nominal Lead Time', value: `${selectedSupplier?.lead_time_days} days` },
          { label: 'On-Time OTIF Rate', value: `${selectedSupplier?.on_time_delivery_rate.toFixed(1)}%` },
          { label: 'B2B Contact', value: selectedSupplier?.contact_email || 'Unlisted' },
          { label: 'Critical Materials', value: selectedSupplier?.critical_components || 'General passives' },
        ]}
        relatedSections={[
          {
            title: 'Supplied Inventory SKUs',
            items: (detailData?.linked_inventory || []).map((inv) => ({
              id: inv.id,
              title: inv.product_name || inv.name || 'Component Item',
              subtitle: `SKU: ${inv.product_sku || inv.sku} • Stock: ${inv.quantity_on_hand.toLocaleString()} ${inv.unit || 'units'}`,
              badge: inv.risk_status,
              onClick: () => {
                setSelectedSupplier(null);
                navigateToRecord('inventory', inv.id);
              },
            })),
            emptyText: 'No inventory parts mapped to this supplier',
          },
          {
            title: 'Linked Purchase Orders',
            items: (detailData?.linked_purchase_orders || []).map((po) => ({
              id: po.id,
              title: po.po_number,
              subtitle: `Total: $${po.total_amount.toLocaleString()} ${po.currency} • ${po.line_items_count} line items`,
              badge: po.status,
              onClick: () => {
                setSelectedSupplier(null);
                navigateToRecord('purchase-orders', po.id);
              },
            })),
            emptyText: 'No purchase orders recorded for this supplier',
          },
        ]}
      />
    </div>
  );
};

