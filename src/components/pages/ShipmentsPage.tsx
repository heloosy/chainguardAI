import React, { useState, useEffect } from 'react';
import { Truck, RefreshCw, Plane, Anchor, Container } from 'lucide-react';
import { apiClient, ShipmentRecord, PurchaseOrderRecord } from '../../services/apiClient';
import { useApp } from '../../context/AppContext';
import { PageHeader } from '../common/PageHeader';
import { DataTable, Column } from '../common/DataTable';
import { StatusBadge } from '../common/StatusBadge';
import { RecordDrawer } from '../common/RecordDrawer';

export const ShipmentsPage: React.FC = () => {
  const { seedFixtures, selectedRecordId, setSelectedRecordId, navigateToRecord } = useApp();
  const [shipments, setShipments] = useState<ShipmentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [modeFilter, setModeFilter] = useState<string>('');
  const [selectedShipment, setSelectedShipment] = useState<ShipmentRecord | null>(null);
  const [poDetail, setPoDetail] = useState<PurchaseOrderRecord | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const fetchShipments = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (statusFilter) params.status = statusFilter;
      if (modeFilter) params.mode = modeFilter;
      const res = await apiClient.getShipments(params);
      setShipments(res);

      if (selectedRecordId) {
        const found = res.find((s) => s.id === selectedRecordId);
        if (found) handleSelectShipment(found);
      }
    } catch (err) {
      console.error('Failed to load shipments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShipments();
  }, [statusFilter, modeFilter]);

  const handleSelectShipment = async (shipment: ShipmentRecord) => {
    setSelectedShipment(shipment);
    setSelectedRecordId(shipment.id);
    try {
      setLoadingDetail(true);
      const res = await apiClient.getShipmentDetail(shipment.id);
      setPoDetail(res.purchase_order);
    } catch (err) {
      console.error('Failed to load shipment detail:', err);
    } finally {
      setLoadingDetail(false);
    }
  };

  const columns: Column<ShipmentRecord>[] = [
    {
      key: 'tracking_number',
      header: 'Tracking Number',
      accessor: (row) => row.tracking_number,
      render: (row) => <span className="font-mono font-medium text-slate-800">{row.tracking_number}</span>,
    },
    {
      key: 'mode',
      header: 'Mode',
      accessor: (row) => row.mode,
      render: (row) => (
        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600">
          {row.mode === 'OCEAN' && <Anchor className="w-3.5 h-3.5 text-blue-500" />}
          {row.mode === 'AIR' && <Plane className="w-3.5 h-3.5 text-indigo-500" />}
          {row.mode === 'TRUCK' && <Truck className="w-3.5 h-3.5 text-emerald-500" />}
          {row.mode === 'RAIL' && <Container className="w-3.5 h-3.5 text-amber-500" />}
          {row.mode}
        </span>
      ),
    },
    {
      key: 'carrier',
      header: 'Carrier',
      accessor: (row) => row.carrier,
      render: (row) => <span className="font-semibold text-slate-800">{row.carrier}</span>,
    },
    {
      key: 'route',
      header: 'Transit Route',
      render: (row) => (
        <div className="text-xs">
          <span className="text-slate-800 font-medium">{row.origin}</span>
          <span className="text-slate-400 mx-1.5">→</span>
          <span className="text-slate-800 font-medium">{row.destination}</span>
        </div>
      ),
    },
    {
      key: 'delay_hours',
      header: 'Delay',
      accessor: (row) => row.delay_hours,
      render: (row) => (
        <span
          className={`font-mono text-xs font-semibold ${row.delay_hours > 0 ? 'text-rose-600' : 'text-emerald-600'}`}
        >
          {row.delay_hours > 0 ? `+${row.delay_hours} hrs` : 'On Schedule'}
        </span>
      ),
    },
    {
      key: 'estimated_arrival',
      header: 'Est. Arrival',
      accessor: (row) => row.estimated_arrival,
      render: (row) => (
        <span className="text-slate-500 font-mono">
          {row.estimated_arrival ? new Date(row.estimated_arrival).toLocaleDateString() : '—'}
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
        title="Freight & Logistics Shipments"
        description="Global multi-modal freight tracking, AIS marine transponder updates, customs dwell-time tracking, and ETA variance alerts."
        breadcrumbs={[{ label: 'Shipments' }]}
        actions={
          <button
            onClick={fetchShipments}
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
        data={shipments}
        isLoading={loading}
        onRowClick={handleSelectShipment}
        searchPlaceholder="Search shipments by tracking number, carrier, port..."
        emptyTitle="No Connected Freight Telemetry"
        emptyDescription="No carrier tracking feeds found. Connect Project44 TMS or carrier EDI 856 feeds, or load development fixtures to review transit status."
        onSeedFixtures={seedFixtures}
        filterComponent={
          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="DELAYED">Delayed</option>
              <option value="IN_TRANSIT">In Transit</option>
              <option value="CUSTOMS_HOLD">Customs Hold</option>
              <option value="DELIVERED">Delivered</option>
            </select>

            <select
              value={modeFilter}
              onChange={(e) => setModeFilter(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">All Modes</option>
              <option value="OCEAN">Ocean</option>
              <option value="AIR">Air</option>
              <option value="TRUCK">Truck</option>
              <option value="RAIL">Rail</option>
            </select>
          </div>
        }
      />

      {/* Record Deep-Dive Drawer */}
      <RecordDrawer
        isOpen={!!selectedShipment}
        onClose={() => {
          setSelectedShipment(null);
          setSelectedRecordId(null);
        }}
        title={`Shipment ${selectedShipment?.tracking_number}`}
        subtitle={`${selectedShipment?.carrier} • ${selectedShipment?.mode} Freight`}
        code={selectedShipment?.tracking_number}
        status={selectedShipment?.status}
        isFixture={selectedShipment?.is_fixture}
        fields={[
          { label: 'Tracking Number', value: selectedShipment?.tracking_number },
          { label: 'Freight Carrier', value: selectedShipment?.carrier },
          { label: 'Transportation Mode', value: selectedShipment?.mode },
          { label: 'Departure Origin', value: selectedShipment?.origin },
          { label: 'Destination Terminal', value: selectedShipment?.destination },
          {
            label: 'Delay Latency',
            value: (selectedShipment?.delay_hours || 0) > 0 ? `+${selectedShipment?.delay_hours} hours` : '0 hours (On Time)',
          },
          {
            label: 'Estimated Arrival',
            value: selectedShipment?.estimated_arrival
              ? new Date(selectedShipment.estimated_arrival).toLocaleDateString()
              : '—',
          },
          {
            label: 'Current Telemetry Position',
            value: selectedShipment?.current_location || 'Corridor waypoint unconfirmed',
          },
        ]}
        relatedSections={[
          {
            title: 'Assigned Purchase Order',
            items: poDetail
              ? [
                  {
                    id: poDetail.id,
                    title: `PO: ${poDetail.po_number}`,
                    subtitle: `Value: $${poDetail.total_amount.toLocaleString()} ${poDetail.currency} • ${poDetail.line_items_count} items`,
                    badge: poDetail.status,
                    onClick: () => {
                      setSelectedShipment(null);
                      navigateToRecord('purchase-orders', poDetail.id);
                    },
                  },
                ]
              : [],
            emptyText: 'No purchase order explicitly linked to this shipment container',
          },
        ]}
      />
    </div>
  );
};

