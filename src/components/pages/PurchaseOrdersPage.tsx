import React, { useState, useEffect } from 'react';
import { ClipboardList, RefreshCw } from 'lucide-react';
import { apiClient, PurchaseOrderRecord, SupplierRecord, ShipmentRecord } from '../../services/apiClient';
import { useApp } from '../../context/AppContext';
import { PageHeader } from '../common/PageHeader';
import { DataTable, Column } from '../common/DataTable';
import { StatusBadge } from '../common/StatusBadge';
import { RecordDrawer } from '../common/RecordDrawer';

export const PurchaseOrdersPage: React.FC = () => {
  const { seedFixtures, selectedRecordId, setSelectedRecordId, navigateToRecord } = useApp();
  const [orders, setOrders] = useState<PurchaseOrderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrderRecord | null>(null);
  const [supplierDetail, setSupplierDetail] = useState<SupplierRecord | null>(null);
  const [shipmentsDetail, setShipmentsDetail] = useState<ShipmentRecord[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (statusFilter) params.status = statusFilter;
      const res = await apiClient.getPurchaseOrders(params);
      setOrders(res);

      if (selectedRecordId) {
        const found = res.find((o) => o.id === selectedRecordId);
        if (found) handleSelectOrder(found);
      }
    } catch (err) {
      console.error('Failed to load purchase orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const handleSelectOrder = async (order: PurchaseOrderRecord) => {
    setSelectedOrder(order);
    setSelectedRecordId(order.id);
    try {
      setLoadingDetail(true);
      const res = await apiClient.getPurchaseOrderDetail(order.id);
      setSupplierDetail(res.supplier);
      setShipmentsDetail(res.shipments);
    } catch (err) {
      console.error('Failed to load purchase order detail:', err);
    } finally {
      setLoadingDetail(false);
    }
  };

  const columns: Column<PurchaseOrderRecord>[] = [
    {
      key: 'po_number',
      header: 'PO Number',
      accessor: (row) => row.po_number,
      render: (row) => <span className="font-mono font-medium text-slate-800">{row.po_number}</span>,
    },
    {
      key: 'supplier_name',
      header: 'Supplier',
      accessor: (row) => row.supplier_name,
      render: (row) => <span className="font-semibold text-slate-900">{row.supplier_name || 'Unassigned'}</span>,
    },
    {
      key: 'total_amount',
      header: 'Order Value',
      accessor: (row) => row.total_amount,
      render: (row) => (
        <span className="font-mono font-medium text-slate-900">
          ${row.total_amount.toLocaleString()} <span className="text-slate-400 font-normal">{row.currency}</span>
        </span>
      ),
    },
    {
      key: 'line_items_count',
      header: 'Line Items',
      accessor: (row) => row.line_items_count,
      render: (row) => <span className="font-mono text-xs">{row.line_items_count} items</span>,
    },
    {
      key: 'order_date',
      header: 'Order Date',
      accessor: (row) => row.order_date,
      render: (row) => (
        <span className="text-slate-500">
          {row.order_date ? new Date(row.order_date).toLocaleDateString() : '—'}
        </span>
      ),
    },
    {
      key: 'expected_delivery_date',
      header: 'Expected Delivery',
      accessor: (row) => row.expected_delivery_date,
      render: (row) => (
        <span className="text-slate-500">
          {row.expected_delivery_date ? new Date(row.expected_delivery_date).toLocaleDateString() : '—'}
        </span>
      ),
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
        title="Purchase Orders"
        description="Tracking active replenishment commitments, supplier fulfillment status, contractual lead-times, and delivery date variances."
        breadcrumbs={[{ label: 'Purchase Orders' }]}
        actions={
          <button
            onClick={fetchOrders}
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
        data={orders}
        isLoading={loading}
        onRowClick={handleSelectOrder}
        searchPlaceholder="Search by PO number, notes, or supplier..."
        emptyTitle="No Connected Purchase Orders"
        emptyDescription="No purchase order records found. Connect SAP S/4HANA or Coupa procurement feeds, or load development fixtures to review active orders."
        onSeedFixtures={seedFixtures}
        filterComponent={
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">All Statuses</option>
            <option value="DELAYED">Delayed</option>
            <option value="SHIPPED">Shipped</option>
            <option value="PENDING">Pending</option>
            <option value="DELIVERED">Delivered</option>
          </select>
        }
      />

      {/* Record Deep-Dive Drawer */}
      <RecordDrawer
        isOpen={!!selectedOrder}
        onClose={() => {
          setSelectedOrder(null);
          setSelectedRecordId(null);
        }}
        title={`Purchase Order ${selectedOrder?.po_number}`}
        subtitle={`Total Commitment: $${(selectedOrder?.total_amount || 0).toLocaleString()} ${selectedOrder?.currency}`}
        code={selectedOrder?.po_number}
        status={selectedOrder?.status}
        isFixture={selectedOrder?.is_fixture}
        fields={[
          { label: 'PO Identifier', value: selectedOrder?.po_number },
          { label: 'Vendor Name', value: selectedOrder?.supplier_name || 'Unassigned' },
          {
            label: 'Order Value',
            value: `$${(selectedOrder?.total_amount || 0).toLocaleString()} ${selectedOrder?.currency}`,
          },
          { label: 'Line Item Count', value: `${selectedOrder?.line_items_count} line items` },
          {
            label: 'Order Placement Date',
            value: selectedOrder?.order_date ? new Date(selectedOrder.order_date).toLocaleDateString() : '—',
          },
          {
            label: 'Committed Delivery',
            value: selectedOrder?.expected_delivery_date
              ? new Date(selectedOrder.expected_delivery_date).toLocaleDateString()
              : '—',
          },
          { label: 'Operational Notes', value: selectedOrder?.notes || 'No special handling instructions recorded.' },
        ]}
        relatedSections={[
          {
            title: 'Originating Supplier',
            items: supplierDetail
              ? [
                  {
                    id: supplierDetail.id,
                    title: supplierDetail.name,
                    subtitle: `${supplierDetail.country} • Tier ${supplierDetail.tier}`,
                    badge: supplierDetail.status,
                    onClick: () => {
                      setSelectedOrder(null);
                      navigateToRecord('suppliers', supplierDetail.id);
                    },
                  },
                ]
              : [],
            emptyText: 'No supplier mapped to this PO',
          },
          {
            title: 'Associated In-Transit Shipments',
            items: shipmentsDetail.map((shp) => ({
              id: shp.id,
              title: `Tracking: ${shp.tracking_number}`,
              subtitle: `Carrier: ${shp.carrier} • ${shp.origin} → ${shp.destination}`,
              badge: shp.status,
              onClick: () => {
                setSelectedOrder(null);
                navigateToRecord('shipments', shp.id);
              },
            })),
            emptyText: 'No active shipments currently bound to this order',
          },
        ]}
      />
    </div>
  );
};

