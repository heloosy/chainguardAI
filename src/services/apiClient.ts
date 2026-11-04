// ChainGuard AI - Enterprise Phase 2 Typed API Client

export interface HealthStatus {
  status: string;
  timestamp: string;
  environment: string;
  database_engine: string;
  auth_engine: string;
  version: string;
}

export interface ApplicationStatus {
  application_name: string;
  version: string;
  environment: string;
  database_engine: string;
  database_url_configured: boolean;
  postgres_configured: boolean;
  supabase_configured: boolean;
  persistent_storage_operational: boolean;
  auth_configured: boolean;
  missing_credentials: string[];
  records_count: Record<string, number>;
  system_message: string;
}

export interface UserProfile {
  id: number;
  email: string;
  full_name: string;
  role: 'ADMIN' | 'OPERATOR' | 'AUDITOR' | 'VIEWER';
  is_active: boolean;
  created_at?: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in_seconds: number;
  user: UserProfile;
}

export interface FacilityRecord {
  id: number;
  facility_code: string;
  name: string;
  facility_type: string;
  country: string;
  city: string;
  address?: string;
  capacity_units: number;
  is_active: boolean;
}

export interface ProductRecord {
  id: number;
  sku: string;
  name: string;
  category: string;
  unit: string;
  unit_cost: number;
  criticality: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  description?: string;
  source_connector: string;
  source_record_id?: string;
  provenance_status: 'VERIFIED' | 'ESTIMATED' | 'STALE' | 'UNVERIFIED';
  is_fixture: boolean;
  last_observed_at?: string;
  created_at?: string;
}

export interface SupplierRecord {
  id: number;
  supplier_code: string;
  name: string;
  tier: number;
  status: 'ACTIVE' | 'AT_RISK' | 'INACTIVE';
  risk_score: number;
  country: string;
  lead_time_days: number;
  on_time_delivery_rate: number;
  contact_email?: string;
  critical_components?: string;
  source_connector: string;
  source_record_id?: string;
  provenance_status: 'VERIFIED' | 'ESTIMATED' | 'STALE' | 'UNVERIFIED';
  is_fixture: boolean;
  last_observed_at?: string;
  created_at?: string;
}

export interface AgentRecord {
  id: number;
  agent_id: string;
  agent_name: string;
  role: string;
  status: 'IDLE' | 'MONITORING' | 'SIMULATING' | 'ALERTED' | 'DISABLED';
  last_run_at?: string;
  next_run_at?: string;
  version: string;
  active_tasks_count: number;
  description?: string;
  is_fixture: boolean;
}

export interface InventoryRecord {
  id: number;
  product_id: number;
  facility_id: number;
  product_sku?: string;
  product_name?: string;
  facility_name?: string;
  sku?: string;
  name?: string;
  category?: string;
  warehouse_location?: string;
  supplier_name?: string;
  quantity_on_hand: number;
  safety_stock: number;
  reorder_point: number;
  unit_cost?: number;
  unit?: string;
  risk_status: 'HEALTHY' | 'AT_RISK' | 'CRITICAL';
  source_connector: string;
  source_record_id?: string;
  provenance_status: 'VERIFIED' | 'ESTIMATED' | 'STALE' | 'UNVERIFIED';
  is_fixture: boolean;
  last_observed_at?: string;
}

export interface PurchaseOrderRecord {
  id: number;
  po_number: string;
  supplier_id: number;
  supplier_name?: string;
  destination_facility_id?: number;
  destination_facility_name?: string;
  order_date?: string;
  expected_delivery_date?: string;
  actual_delivery_date?: string;
  status: 'PENDING' | 'CONFIRMED' | 'SHIPPED' | 'DELAYED' | 'DELIVERED' | 'CANCELLED';
  total_amount: number;
  currency: string;
  notes?: string;
  source_connector: string;
  source_record_id?: string;
  provenance_status: 'VERIFIED' | 'ESTIMATED' | 'STALE' | 'UNVERIFIED';
  line_items_count: number;
  shipments_count: number;
  is_fixture: boolean;
  last_observed_at?: string;
}

export interface ShipmentRecord {
  id: number;
  tracking_number: string;
  purchase_order_id?: number;
  po_number?: string;
  origin: string;
  destination: string;
  carrier: string;
  mode: 'OCEAN' | 'AIR' | 'TRUCK' | 'RAIL';
  status: 'IN_TRANSIT' | 'DELAYED' | 'CUSTOMS_HOLD' | 'DELIVERED';
  delay_hours: number;
  departed_at?: string;
  estimated_arrival?: string;
  actual_arrival?: string;
  current_location?: string;
  source_connector: string;
  source_record_id?: string;
  provenance_status: 'VERIFIED' | 'ESTIMATED' | 'STALE' | 'UNVERIFIED';
  is_fixture: boolean;
  last_observed_at?: string;
}

export interface DisruptionRecord {
  id: number;
  disruption_code: string;
  title: string;
  category: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'DETECTED' | 'ACTIVE' | 'MITIGATING' | 'RESOLVED';
  affected_region: string;
  estimated_loss: number;
  affected_inventory_value?: number;
  affected_suppliers_count?: number;
  detected_at?: string;
  summary?: string;
  recommended_action?: string;
  source_connector: string;
  source_record_id?: string;
  provenance_status: 'VERIFIED' | 'ESTIMATED' | 'STALE' | 'UNVERIFIED';
  recovery_plans_count?: number;
  is_fixture: boolean;
  last_observed_at?: string;
}

export interface RecoveryPlanRecord {
  id: number;
  plan_code: string;
  disruption_id?: number;
  disruption_title?: string;
  title: string;
  strategy_type: string;
  estimated_cost: number;
  time_to_recovery_days: number;
  secondary_risk_assessment?: string;
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'EXECUTED';
  confidence_score: number;
  summary?: string;
  execution_steps?: string;
  source_connector: string;
  source_record_id?: string;
  provenance_status: 'VERIFIED' | 'ESTIMATED' | 'STALE' | 'UNVERIFIED';
  is_fixture: boolean;
  last_observed_at?: string;
  created_at?: string;
}

export interface ApprovalRecord {
  id: number;
  approval_code: string;
  recovery_plan_id?: number;
  recovery_plan_title?: string;
  title: string;
  requested_by: string;
  requested_at?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  approver?: string;
  action_notes?: string;
  action_timestamp?: string;
  risk_level: string;
  financial_threshold: number;
  source_connector: string;
  provenance_status: 'VERIFIED' | 'ESTIMATED' | 'STALE' | 'UNVERIFIED';
  is_fixture: boolean;
}

export interface IncidentRecord {
  id: number;
  incident_code: string;
  disruption_type: string;
  description: string;
  root_cause?: string;
  resolved_at?: string;
  duration_days: number;
  financial_impact: number;
  lessons_learned?: string;
  effective_strategy?: string;
  source_connector: string;
  source_record_id?: string;
  provenance_status: 'VERIFIED' | 'ESTIMATED' | 'STALE' | 'UNVERIFIED';
  is_fixture: boolean;
  last_observed_at?: string;
}

export interface IntegrationConnector {
  id: number;
  connector_id: string;
  name: string;
  system_type: string;
  endpoint_url?: string;
  status: 'CONNECTED' | 'DISCONNECTED' | 'ERROR' | 'SYNCING';
  last_sync_at?: string;
  last_ping_latency_ms?: number;
  health_message?: string;
  auth_type: string;
  records_synced: number;
  is_fixture: boolean;
}

export interface SyncRunRecord {
  id: number;
  connector_id: number;
  sync_type: string;
  status: string;
  records_processed: number;
  error_log?: string;
  started_at: string;
  completed_at?: string;
}

export interface AuditLogRecord {
  id: number;
  timestamp: string;
  user_id?: number;
  user_email?: string;
  user_name?: string;
  event_type: string;
  entity_type: string;
  entity_id?: string;
  description: string;
  old_values?: any;
  new_values?: any;
  ip_address?: string;
}

export interface OverviewMetrics {
  active_disruptions: number | null;
  at_risk_suppliers: number | null;
  inventory_at_risk_count: number | null;
  inventory_at_risk_value: number | null;
  delayed_shipments: number | null;
  pending_approvals: number | null;
  data_connection_health: 'DISCONNECTED' | 'HEALTHY' | 'DEGRADED' | 'AWAITING_DATA';
  has_connected_data: boolean;
  data_mode: 'LIVE_EMPTY' | 'FIXTURES_LOADED' | 'LIVE_CONNECTED';
}

export interface OverviewData {
  metrics: OverviewMetrics;
  recent_alerts: {
    id: string;
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    title: string;
    time: string;
    source: string;
    is_fixture: boolean;
  }[];
  supply_chain_risk_overview: {
    category: string;
    risk_level: string;
    count: number;
    description: string;
  }[];
  recent_recovery_decisions: {
    id: number;
    code: string;
    title: string;
    status: string;
    cost: number;
    time_impact: string;
    decided_by?: string;
  }[];
  data_source_status: IntegrationConnector[];
  agent_activity: {
    agent_id: string;
    agent_name: string;
    status: string;
    last_activity: string;
    current_action: string;
  }[];
}

const API_BASE = '/api';

// Token state in memory with localStorage persistence
let authToken: string | null = typeof window !== 'undefined' ? localStorage.getItem('chainguard_token') : null;

export const setAuthToken = (token: string | null) => {
  authToken = token;
  if (typeof window !== 'undefined') {
    if (token) localStorage.setItem('chainguard_token', token);
    else localStorage.removeItem('chainguard_token');
  }
};

export const getAuthToken = () => authToken;

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string>),
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    try {
      const parsed = JSON.parse(errorText);
      if (parsed.detail) errorMessage = parsed.detail;
    } catch {
      if (errorText) errorMessage = errorText;
    }
    throw new Error(errorMessage);
  }

  return response.json();
}

export const apiClient = {
  // Health & Application Status
  checkHealth: () => fetchJson<HealthStatus>('/health'),
  getApplicationStatus: () => fetchJson<ApplicationStatus>(`${API_BASE}/status`),

  // Authentication
  login: async (email: string, password: string): Promise<TokenResponse> => {
    const res = await fetchJson<TokenResponse>(`${API_BASE}/auth/login`, {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setAuthToken(res.access_token);
    return res;
  },
  logout: () => {
    setAuthToken(null);
  },
  getMe: () => fetchJson<UserProfile>(`${API_BASE}/auth/me`),
  getUsers: () => fetchJson<UserProfile[]>(`${API_BASE}/users`),

  // Data status & Fixtures
  getDataStatus: () => fetchJson<any>(`${API_BASE}/data/status`),
  seedFixtures: () => fetchJson<{ message: string; is_fixture: boolean }>(`${API_BASE}/data/fixtures/seed`, { method: 'POST' }),
  clearData: () => fetchJson<{ message: string }>(`${API_BASE}/data/fixtures/clear`, { method: 'POST' }),

  // Overview
  getOverview: () => fetchJson<OverviewData>(`${API_BASE}/overview`),

  // Facilities
  getFacilities: () => fetchJson<FacilityRecord[]>(`${API_BASE}/facilities`),
  createFacility: (data: Partial<FacilityRecord>) =>
    fetchJson<FacilityRecord>(`${API_BASE}/facilities`, { method: 'POST', body: JSON.stringify(data) }),

  // Suppliers
  getSuppliers: (params?: { search?: string; status?: string; tier?: number; provenance_status?: string }) => {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.status) query.append('status', params.status);
    if (params?.tier) query.append('tier', params.tier.toString());
    if (params?.provenance_status) query.append('provenance_status', params.provenance_status);
    const qStr = query.toString();
    return fetchJson<SupplierRecord[]>(`${API_BASE}/suppliers${qStr ? `?${qStr}` : ''}`);
  },
  getSupplierDetail: (id: number) => fetchJson<any>(`${API_BASE}/suppliers/${id}`),
  createSupplier: (data: Partial<SupplierRecord>) =>
    fetchJson<SupplierRecord>(`${API_BASE}/suppliers`, { method: 'POST', body: JSON.stringify(data) }),
  updateSupplier: (id: number, data: Partial<SupplierRecord>) =>
    fetchJson<SupplierRecord>(`${API_BASE}/suppliers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteSupplier: (id: number) =>
    fetchJson<{ message: string }>(`${API_BASE}/suppliers/${id}`, { method: 'DELETE' }),

  // Products & Materials
  getProducts: (params?: { search?: string; category?: string; criticality?: string }) => {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.category) query.append('category', params.category);
    if (params?.criticality) query.append('criticality', params.criticality);
    const qStr = query.toString();
    return fetchJson<ProductRecord[]>(`${API_BASE}/products${qStr ? `?${qStr}` : ''}`);
  },
  getProductDetail: (id: number) => fetchJson<any>(`${API_BASE}/products/${id}`),
  createProduct: (data: Partial<ProductRecord>) =>
    fetchJson<ProductRecord>(`${API_BASE}/products`, { method: 'POST', body: JSON.stringify(data) }),
  updateProduct: (id: number, data: Partial<ProductRecord>) =>
    fetchJson<ProductRecord>(`${API_BASE}/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteProduct: (id: number) =>
    fetchJson<{ message: string }>(`${API_BASE}/products/${id}`, { method: 'DELETE' }),

  // Inventory
  getInventory: (params?: { search?: string; risk_status?: string; facility_id?: number }) => {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.risk_status) query.append('risk_status', params.risk_status);
    if (params?.facility_id) query.append('facility_id', params.facility_id.toString());
    const qStr = query.toString();
    return fetchJson<InventoryRecord[]>(`${API_BASE}/inventory${qStr ? `?${qStr}` : ''}`);
  },
  getInventoryDetail: (id: number) => fetchJson<any>(`${API_BASE}/inventory/${id}`),
  createInventoryRecord: (data: Partial<InventoryRecord>) =>
    fetchJson<InventoryRecord>(`${API_BASE}/inventory`, { method: 'POST', body: JSON.stringify(data) }),
  updateInventoryRecord: (id: number, data: Partial<InventoryRecord>) =>
    fetchJson<InventoryRecord>(`${API_BASE}/inventory/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Purchase Orders
  getPurchaseOrders: (params?: { search?: string; status?: string }) => {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.status) query.append('status', params.status);
    const qStr = query.toString();
    return fetchJson<PurchaseOrderRecord[]>(`${API_BASE}/purchase-orders${qStr ? `?${qStr}` : ''}`);
  },
  getPurchaseOrderDetail: (id: number) => fetchJson<any>(`${API_BASE}/purchase-orders/${id}`),
  createPurchaseOrder: (data: any) =>
    fetchJson<PurchaseOrderRecord>(`${API_BASE}/purchase-orders`, { method: 'POST', body: JSON.stringify(data) }),
  updatePurchaseOrder: (id: number, data: Partial<PurchaseOrderRecord>) =>
    fetchJson<PurchaseOrderRecord>(`${API_BASE}/purchase-orders/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deletePurchaseOrder: (id: number) =>
    fetchJson<{ message: string }>(`${API_BASE}/purchase-orders/${id}`, { method: 'DELETE' }),

  // Shipments
  getShipments: (params?: { search?: string; status?: string; mode?: string }) => {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.status) query.append('status', params.status);
    if (params?.mode) query.append('mode', params.mode);
    const qStr = query.toString();
    return fetchJson<ShipmentRecord[]>(`${API_BASE}/shipments${qStr ? `?${qStr}` : ''}`);
  },
  getShipmentDetail: (id: number) => fetchJson<any>(`${API_BASE}/shipments/${id}`),
  createShipment: (data: Partial<ShipmentRecord>) =>
    fetchJson<ShipmentRecord>(`${API_BASE}/shipments`, { method: 'POST', body: JSON.stringify(data) }),
  updateShipment: (id: number, data: Partial<ShipmentRecord>) =>
    fetchJson<ShipmentRecord>(`${API_BASE}/shipments/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Disruptions
  getDisruptions: (params?: { search?: string; severity?: string; status?: string }) => {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.severity) query.append('severity', params.severity);
    if (params?.status) query.append('status', params.status);
    const qStr = query.toString();
    return fetchJson<DisruptionRecord[]>(`${API_BASE}/disruptions${qStr ? `?${qStr}` : ''}`);
  },
  getDisruptionDetail: (id: number) => fetchJson<any>(`${API_BASE}/disruptions/${id}`),
  createDisruption: (data: Partial<DisruptionRecord>) =>
    fetchJson<DisruptionRecord>(`${API_BASE}/disruptions`, { method: 'POST', body: JSON.stringify(data) }),
  updateDisruption: (id: number, data: Partial<DisruptionRecord>) =>
    fetchJson<DisruptionRecord>(`${API_BASE}/disruptions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Recovery Plans
  getRecoveryPlans: (params?: { status?: string }) => {
    const query = new URLSearchParams();
    if (params?.status) query.append('status', params.status);
    const qStr = query.toString();
    return fetchJson<RecoveryPlanRecord[]>(`${API_BASE}/recovery-plans${qStr ? `?${qStr}` : ''}`);
  },
  getRecoveryPlanDetail: (id: number) => fetchJson<any>(`${API_BASE}/recovery-plans/${id}`),
  createRecoveryPlan: (data: any) =>
    fetchJson<RecoveryPlanRecord>(`${API_BASE}/recovery-plans`, { method: 'POST', body: JSON.stringify(data) }),

  // Approvals & Governance Decisions
  getApprovals: (params?: { status?: string }) => {
    const query = new URLSearchParams();
    if (params?.status) query.append('status', params.status);
    const qStr = query.toString();
    return fetchJson<ApprovalRecord[]>(`${API_BASE}/approvals${qStr ? `?${qStr}` : ''}`);
  },
  executeApprovalDecision: (id: number, data: { decision: 'APPROVE' | 'REJECT'; notes?: string }) =>
    fetchJson<{ message: string; approval_id: number; status: string; approver: string; timestamp: string }>(
      `${API_BASE}/approvals/${id}/decision`,
      { method: 'POST', body: JSON.stringify(data) }
    ),
  actOnApproval: (id: number, data: { action: 'APPROVE' | 'REJECT'; approver?: string; action_notes?: string }) =>
    fetchJson<{ message: string; approval_id: number; status: string; approver: string; timestamp: string }>(
      `${API_BASE}/approvals/${id}/decision`,
      { method: 'POST', body: JSON.stringify({ decision: data.action, notes: data.action_notes }) }
    ),

  // AI Agents
  getAgents: () => fetchJson<AgentRecord[]>(`${API_BASE}/agents`),
  runAgentCycle: (agentId: string) =>
    fetchJson<{ message: string; agent_id: string; status: string }>(`${API_BASE}/agents/${agentId}/run-cycle`, {
      method: 'POST',
    }),
  toggleAgent: (agentId: string) =>
    fetchJson<{ message: string; agent_id: string; status: string }>(`${API_BASE}/agents/${agentId}/toggle`, {
      method: 'POST',
    }),

  // Incidents
  getIncidents: (params?: { search?: string }) => {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    const qStr = query.toString();
    return fetchJson<IncidentRecord[]>(`${API_BASE}/incidents${qStr ? `?${qStr}` : ''}`);
  },
  getIncidentDetail: (id: number) => fetchJson<IncidentRecord>(`${API_BASE}/incidents/${id}`),
  createIncident: (data: Partial<IncidentRecord>) =>
    fetchJson<IncidentRecord>(`${API_BASE}/incidents`, { method: 'POST', body: JSON.stringify(data) }),

  // Integrations & Sync Runs
  getIntegrations: () => fetchJson<IntegrationConnector[]>(`${API_BASE}/integrations`),
  testConnector: (connectorId: string) =>
    fetchJson<{
      connector_id: string;
      tested_at: string;
      success: boolean;
      status: string;
      latency_ms: number;
      message: string;
    }>(`${API_BASE}/integrations/${connectorId}/test`, { method: 'POST' }),
  triggerSync: (connectorId: string, syncType: string = 'INCREMENTAL') =>
    fetchJson<SyncRunRecord>(`${API_BASE}/integrations/${connectorId}/sync`, {
      method: 'POST',
      body: JSON.stringify({ sync_type: syncType }),
    }),
  getSyncRuns: (connectorId: string) =>
    fetchJson<SyncRunRecord[]>(`${API_BASE}/integrations/${connectorId}/sync-runs`),

  // Audit Logs
  getAuditLogs: (params?: { event_type?: string; entity_type?: string; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.event_type) query.append('event_type', params.event_type);
    if (params?.entity_type) query.append('entity_type', params.entity_type);
    if (params?.limit) query.append('limit', params.limit.toString());
    const qStr = query.toString();
    return fetchJson<AuditLogRecord[]>(`${API_BASE}/audit-logs${qStr ? `?${qStr}` : ''}`);
  },

  // Settings
  getSettings: () => fetchJson<Record<string, { value: string; description: string }>>(`${API_BASE}/settings`),
  updateSetting: (key: string, value: string) =>
    fetchJson<{ key: string; value: string }>(`${API_BASE}/settings`, {
      method: 'PUT',
      body: JSON.stringify({ key, value }),
    }),
};
