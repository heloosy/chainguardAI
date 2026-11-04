import React, { useState, useEffect } from 'react';
import { Package, RefreshCw, Trash2, Edit3, Plus, ExternalLink } from 'lucide-react';
import { apiClient, ProductRecord } from '../../services/apiClient';
import { useApp } from '../../context/AppContext';
import { PageHeader } from '../common/PageHeader';
import { DataTable, Column } from '../common/DataTable';
import { StatusBadge } from '../common/StatusBadge';
import { RecordDrawer } from '../common/RecordDrawer';
import { ConfirmationDialog } from '../common/ConfirmationDialog';
import { useToast } from '../common/Toast';

export const ProductsPage: React.FC = () => {
  const { seedFixtures, selectedRecordId, setSelectedRecordId, navigateToRecord, currentUser } = useApp();
  const { showToast } = useToast();
  const [products, setProducts] = useState<ProductRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [criticalityFilter, setCriticalityFilter] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<ProductRecord | null>(null);
  const [detailData, setDetailData] = useState<{ suppliers: any[]; inventory_distribution: any[] } | null>(null);
  const [productToDelete, setProductToDelete] = useState<ProductRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (categoryFilter) params.category = categoryFilter;
      if (criticalityFilter) params.criticality = criticalityFilter;
      const res = await apiClient.getProducts(params);
      setProducts(res);

      if (selectedRecordId) {
        const found = res.find((p) => p.id === selectedRecordId);
        if (found) handleSelectProduct(found);
      }
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [categoryFilter, criticalityFilter]);

  const handleSelectProduct = async (product: ProductRecord) => {
    setSelectedProduct(product);
    setSelectedRecordId(product.id);
    try {
      const res = await apiClient.getProductDetail(product.id);
      setDetailData({
        suppliers: res.suppliers,
        inventory_distribution: res.inventory_distribution,
      });
    } catch (err) {
      console.error('Failed to fetch product detail:', err);
    }
  };

  const handleDeleteProduct = async () => {
    if (!productToDelete) return;
    try {
      setIsDeleting(true);
      const res = await apiClient.deleteProduct(productToDelete.id);
      showToast('success', 'Product Deleted', res.message);
      setProductToDelete(null);
      await fetchProducts();
    } catch (err: any) {
      showToast('error', 'Safe Deletion Blocked', err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const columns: Column<ProductRecord>[] = [
    {
      key: 'sku',
      header: 'Product SKU',
      accessor: (row) => row.sku,
      render: (row) => <span className="font-mono font-medium text-slate-800">{row.sku}</span>,
    },
    {
      key: 'name',
      header: 'Component / Material',
      accessor: (row) => row.name,
      render: (row) => (
        <div>
          <div className="font-semibold text-slate-900">{row.name}</div>
          <div className="text-[11px] text-slate-500 line-clamp-1">{row.description || row.category}</div>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      accessor: (row) => row.category,
    },
    {
      key: 'unit_cost',
      header: 'Unit Cost',
      accessor: (row) => row.unit_cost,
      render: (row) => (
        <span className="font-mono text-slate-800">
          ${row.unit_cost.toFixed(2)} <span className="text-[11px] text-slate-400 font-normal">/{row.unit}</span>
        </span>
      ),
    },
    {
      key: 'criticality',
      header: 'Criticality',
      accessor: (row) => row.criticality,
      render: (row) => <StatusBadge status={row.criticality} size="sm" isFixture={row.is_fixture} />,
    },
    {
      key: 'provenance_status',
      header: 'Data Provenance',
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
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setProductToDelete(row);
          }}
          title="Safe Delete Product"
          className="p-1 text-slate-400 hover:text-rose-600 rounded transition"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      ),
    },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 animate-fade-in">
      <PageHeader
        title="Products & Critical Materials"
        description="Normalized master catalog of bill-of-materials components, unit economics, criticality tiers, and upstream supplier associations."
        breadcrumbs={[{ label: 'Products & Materials' }]}
        actions={
          <button
            onClick={fetchProducts}
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
        data={products}
        isLoading={loading}
        onRowClick={handleSelectProduct}
        searchPlaceholder="Search materials by SKU, description, category..."
        emptyTitle="No Master Products Registered"
        emptyDescription="No bill-of-materials records found. Load development fixtures to verify catalog relations."
        onSeedFixtures={seedFixtures}
        filterComponent={
          <div className="flex items-center gap-2">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">All Categories</option>
              <option value="Semiconductor">Semiconductor</option>
              <option value="Power Electronics">Power Electronics</option>
              <option value="Passive Components">Passive Components</option>
              <option value="Sensors">Sensors</option>
              <option value="Assemblies">Assemblies</option>
            </select>

            <select
              value={criticalityFilter}
              onChange={(e) => setCriticalityFilter(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">All Criticalities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>
        }
      />

      {/* Record Drawer */}
      <RecordDrawer
        isOpen={!!selectedProduct}
        onClose={() => {
          setSelectedProduct(null);
          setSelectedRecordId(null);
        }}
        title={selectedProduct?.name || ''}
        subtitle={`SKU: ${selectedProduct?.sku} • Category: ${selectedProduct?.category}`}
        code={selectedProduct?.sku}
        status={selectedProduct?.criticality}
        isFixture={selectedProduct?.is_fixture}
        fields={[
          { label: 'Product SKU', value: selectedProduct?.sku },
          { label: 'Component Category', value: selectedProduct?.category },
          { label: 'Unit Standard Cost', value: `$${selectedProduct?.unit_cost.toFixed(2)} USD` },
          { label: 'Measurement Unit', value: selectedProduct?.unit },
          { label: 'Resilience Criticality', value: selectedProduct?.criticality },
          { label: 'Data Provenance Status', value: selectedProduct?.provenance_status },
          { label: 'Source Connector', value: selectedProduct?.source_connector },
          { label: 'Description', value: selectedProduct?.description },
        ]}
        relatedSections={[
          {
            title: 'Mapped Qualified Suppliers',
            items: (detailData?.suppliers || []).map((s) => ({
              id: s.supplier_id,
              title: s.name,
              subtitle: `Quote: $${s.unit_price.toFixed(2)} • Lead Time: ${s.lead_time_days}d ${s.is_primary ? '• (Primary Source)' : ''}`,
              badge: s.is_primary ? 'ACTIVE' : 'CONFIRMED',
              onClick: () => {
                setSelectedProduct(null);
                navigateToRecord('suppliers', s.supplier_id);
              },
            })),
            emptyText: 'No approved suppliers currently mapped to this SKU',
          },
          {
            title: 'Warehouse Stock Distribution',
            items: (detailData?.inventory_distribution || []).map((inv, idx) => ({
              id: idx,
              title: inv.facility_name,
              subtitle: `Stock: ${inv.quantity_on_hand.toLocaleString()} units • Safety: ${inv.safety_stock.toLocaleString()}`,
              badge: inv.risk_status,
              onClick: () => {
                setSelectedProduct(null);
                navigateToRecord('inventory', inv.facility_id);
              },
            })),
            emptyText: 'No warehouse stock balances recorded',
          },
        ]}
      />

      {/* Safe Deletion Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={!!productToDelete}
        onClose={() => setProductToDelete(null)}
        onConfirm={handleDeleteProduct}
        isLoading={isDeleting}
        title="Confirm Safe Deletion"
        message={`Are you sure you want to delete SKU '${productToDelete?.sku}'? The system enforces safe deletion rules: if any inventory stock or purchase order lines reference this product, deletion will be blocked.`}
        confirmLabel="Safe Delete"
        variant="danger"
      />
    </div>
  );
};
