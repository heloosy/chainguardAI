import React, { useState, useEffect } from 'react';
import { Boxes, RefreshCw } from 'lucide-react';
import { apiClient, InventoryRecord, SupplierRecord } from '../../services/apiClient';
import { useApp } from '../../context/AppContext';
import { PageHeader } from '../common/PageHeader';
import { DataTable, Column } from '../common/DataTable';
import { StatusBadge } from '../common/StatusBadge';
import { RecordDrawer } from '../common/RecordDrawer';

export const InventoryPage: React.FC = () => {
  const { seedFixtures, selectedRecordId, setSelectedRecordId, navigateToRecord } = useApp();
  const [items, setItems] = useState<InventoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [riskFilter, setRiskFilter] = useState<string>('');
  const [selectedItem, setSelectedItem] = useState<InventoryRecord | null>(null);
  const [supplierDetail, setSupplierDetail] = useState<SupplierRecord | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (riskFilter) params.risk_status = riskFilter;
      const res = await apiClient.getInventory(params);
      setItems(res);

      if (selectedRecordId) {
        const found = res.find((i) => i.id === selectedRecordId);
        if (found) handleSelectItem(found);
      }
    } catch (err) {
      console.error('Failed to load inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [riskFilter]);

  const handleSelectItem = async (item: InventoryRecord) => {
    setSelectedItem(item);
    setSelectedRecordId(item.id);
    try {
      setLoadingDetail(true);
      const res = await apiClient.getInventoryDetail(item.id);
      setSupplierDetail(res.supplier);
    } catch (err) {
      console.error('Failed to fetch inventory detail:', err);
    } finally {
      setLoadingDetail(false);
    }
  };

  const columns: Column<InventoryRecord>[] = [
    {
      key: 'sku',
      header: 'SKU / Part Number',
      accessor: (row) => row.product_sku || row.sku || `SKU-${row.product_id}`,
      render: (row) => <span className="font-mono font-medium text-slate-800">{row.product_sku || row.sku || `SKU-${row.product_id}`}</span>,
    },
    {
      key: 'name',
      header: 'Component Name',
      accessor: (row) => row.product_name || row.name || 'Component Item',
      render: (row) => (
        <div>
          <div className="font-semibold text-slate-900">{row.product_name || row.name || 'Component Item'}</div>
          <div className="text-[11px] text-slate-500">{row.facility_name || row.warehouse_location || 'Main Storage'}</div>
        </div>
      ),
    },
    {
      key: 'quantity_on_hand',
      header: 'Stock On Hand',
      accessor: (row) => row.quantity_on_hand,
      render: (row) => (
        <span className="font-mono font-semibold text-slate-900">
          {row.quantity_on_hand.toLocaleString()} <span className="text-slate-400 font-normal">{row.unit || 'units'}</span>
        </span>
      ),
    },
    {
      key: 'safety_stock',
      header: 'Safety Threshold',
      accessor: (row) => row.safety_stock,
      render: (row) => (
        <span className="font-mono text-slate-500">
          {row.safety_stock.toLocaleString()} {row.unit || 'units'}
        </span>
      ),
    },
    {
      key: 'unit_cost',
      header: 'Unit Cost',
      accessor: (row) => row.unit_cost,
      render: (row) => <span className="font-mono">${(row.unit_cost || 0).toFixed(2)}</span>,
    },
    {
      key: 'provenance_status',
      header: 'Provenance',
      render: (row) => (
        <StatusBadge
          status={row.provenance_status}
          size="sm"
          provenanceStatus={row.provenance_status}
          sourceConnector={row.source_connector}
        />
      ),
    },
    {
      key: 'risk_status',
      header: 'Risk Level',
      accessor: (row) => row.risk_status,
      render: (row) => <StatusBadge status={row.risk_status} size="sm" isFixture={row.is_fixture} />,
    },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 animate-fade-in">
      <PageHeader
        title="Inventory Resilience Telemetry"
        description="Real-time warehouse stock balances, safety threshold monitoring, burn-rate projections, and component stockout vulnerability."
        breadcrumbs={[{ label: 'Inventory' }]}
        actions={
          <button
            onClick={fetchInventory}
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
        data={items}
        isLoading={loading}
        onRowClick={handleSelectItem}
        searchPlaceholder="Search by SKU, component name, or warehouse hub..."
        emptyTitle="No Connected Inventory Data"
        emptyDescription="No component telemetry found. Connect Manhattan WMS or SAP MM stock feeds, or load development fixtures to review stock levels."
        onSeedFixtures={seedFixtures}
        filterComponent={
          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">All Risk Levels</option>
            <option value="CRITICAL">Critical</option>
            <option value="AT_RISK">At Risk</option>
            <option value="HEALTHY">Healthy</option>
          </select>
        }
      />

      {/* Record Deep-Dive Drawer */}
      <RecordDrawer
        isOpen={!!selectedItem}
        onClose={() => {
          setSelectedItem(null);
          setSelectedRecordId(null);
        }}
        title={selectedItem?.product_name || selectedItem?.name || ''}
        subtitle={`${selectedItem?.facility_name || selectedItem?.warehouse_location || 'Warehouse Hub'}`}
        code={selectedItem?.product_sku || selectedItem?.sku}
        status={selectedItem?.risk_status}
        isFixture={selectedItem?.is_fixture}
        fields={[
          { label: 'Part SKU', value: selectedItem?.product_sku || selectedItem?.sku },
          { label: 'Storage Facility', value: selectedItem?.facility_name || selectedItem?.warehouse_location },
          {
            label: 'Stock On Hand',
            value: `${selectedItem?.quantity_on_hand.toLocaleString()} ${selectedItem?.unit || 'units'}`,
          },
          {
            label: 'Safety Stock Limit',
            value: `${selectedItem?.safety_stock.toLocaleString()} ${selectedItem?.unit || 'units'}`,
          },
          {
            label: 'Reorder Point',
            value: `${selectedItem?.reorder_point.toLocaleString()} ${selectedItem?.unit || 'units'}`,
          },
          { label: 'Unit Cost', value: `$${(selectedItem?.unit_cost || 0).toFixed(2)}` },
          {
            label: 'Total Asset Valuation',
            value: `$${((selectedItem?.quantity_on_hand || 0) * (selectedItem?.unit_cost || 0)).toLocaleString()}`,
          },
          { label: 'Data Provenance', value: `${selectedItem?.provenance_status} via ${selectedItem?.source_connector}` },
        ]}
        relatedSections={[
          {
            title: 'Primary Supplier',
            items: supplierDetail
              ? [
                  {
                    id: supplierDetail.id,
                    title: supplierDetail.name,
                    subtitle: `${supplierDetail.country} • Lead Time: ${supplierDetail.lead_time_days}d`,
                    badge: supplierDetail.status,
                    onClick: () => {
                      setSelectedItem(null);
                      navigateToRecord('suppliers', supplierDetail.id);
                    },
                  },
                ]
              : [],
            emptyText: 'No primary supplier linked to this component',
          },
        ]}
      />
    </div>
  );
};
