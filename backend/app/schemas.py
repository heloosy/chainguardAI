import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, ConfigDict

# --- Health & Application Status ---
class HealthResponse(BaseModel):
    status: str
    timestamp: datetime.datetime
    environment: str
    database_engine: str
    auth_engine: str
    version: str

class ApplicationStatusResponse(BaseModel):
    application_name: str
    version: str
    environment: str
    database_engine: str
    database_url_configured: bool
    postgres_configured: bool
    supabase_configured: bool
    persistent_storage_operational: bool
    auth_configured: bool
    missing_credentials: List[str]
    records_count: Dict[str, int]
    system_message: str

# --- Auth & Users ---
class UserLoginRequest(BaseModel):
    email: str
    password: str

class UserRegisterRequest(BaseModel):
    email: str
    password: str
    full_name: str
    role: str = "OPERATOR"

class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    role: str
    is_active: bool
    created_at: Optional[datetime.datetime] = None
    model_config = ConfigDict(from_attributes=True)

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    expires_in_seconds: int
    user: UserResponse

# --- Facilities ---
class FacilityBase(BaseModel):
    facility_code: str
    name: str
    facility_type: str = "WAREHOUSE"
    country: str = "United States"
    city: str = "Austin"
    address: Optional[str] = None
    capacity_units: int = 50000

class FacilityCreate(FacilityBase):
    pass

class FacilityResponse(FacilityBase):
    id: int
    is_active: bool
    created_at: Optional[datetime.datetime] = None
    model_config = ConfigDict(from_attributes=True)

# --- Suppliers ---
class SupplierBase(BaseModel):
    supplier_code: str
    name: str
    tier: int = 1
    status: str = "ACTIVE"
    risk_score: float = 0.0
    country: str = "United States"
    lead_time_days: int = 14
    on_time_delivery_rate: float = 95.0
    contact_email: Optional[str] = None
    critical_components: Optional[str] = None
    source_connector: str = "MANUAL"
    source_record_id: Optional[str] = None
    provenance_status: str = "VERIFIED"

class SupplierCreate(SupplierBase):
    pass

class SupplierUpdate(BaseModel):
    name: Optional[str] = None
    tier: Optional[int] = None
    status: Optional[str] = None
    risk_score: Optional[float] = None
    lead_time_days: Optional[int] = None
    on_time_delivery_rate: Optional[float] = None
    contact_email: Optional[str] = None
    critical_components: Optional[str] = None
    provenance_status: Optional[str] = None

class SupplierResponse(SupplierBase):
    id: int
    is_fixture: bool
    last_observed_at: Optional[datetime.datetime] = None
    created_at: Optional[datetime.datetime] = None
    model_config = ConfigDict(from_attributes=True)

# --- Products & Materials ---
class ProductBase(BaseModel):
    sku: str
    name: str
    category: str = "Raw Materials"
    unit: str = "units"
    unit_cost: float = 0.0
    criticality: str = "HIGH"
    description: Optional[str] = None
    source_connector: str = "MANUAL"
    source_record_id: Optional[str] = None
    provenance_status: str = "VERIFIED"

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    unit: Optional[str] = None
    unit_cost: Optional[float] = None
    criticality: Optional[str] = None
    description: Optional[str] = None
    provenance_status: Optional[str] = None

class ProductResponse(ProductBase):
    id: int
    is_fixture: bool
    last_observed_at: Optional[datetime.datetime] = None
    created_at: Optional[datetime.datetime] = None
    model_config = ConfigDict(from_attributes=True)

# --- Supplier Product Links ---
class SupplierProductCreate(BaseModel):
    supplier_id: int
    product_id: int
    is_primary: bool = True
    unit_price: float = 0.0
    lead_time_days: int = 14
    capacity_share: float = 100.0
    contract_reference: Optional[str] = None

class SupplierProductResponse(BaseModel):
    id: int
    supplier_id: int
    product_id: int
    is_primary: bool
    unit_price: float
    lead_time_days: int
    capacity_share: float
    contract_reference: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)

# --- Inventory Records ---
class InventoryRecordBase(BaseModel):
    product_id: int
    facility_id: int
    quantity_on_hand: int = 0
    safety_stock: int = 100
    reorder_point: int = 200
    risk_status: str = "HEALTHY"
    source_connector: str = "MANHATTAN_WMS"
    source_record_id: Optional[str] = None
    provenance_status: str = "VERIFIED"

class InventoryRecordCreate(InventoryRecordBase):
    pass

class InventoryRecordUpdate(BaseModel):
    quantity_on_hand: Optional[int] = None
    safety_stock: Optional[int] = None
    reorder_point: Optional[int] = None
    risk_status: Optional[str] = None
    provenance_status: Optional[str] = None

class InventoryRecordResponse(InventoryRecordBase):
    id: int
    product_sku: Optional[str] = None
    product_name: Optional[str] = None
    facility_name: Optional[str] = None
    unit_cost: Optional[float] = None
    unit: Optional[str] = None
    is_fixture: bool
    last_observed_at: Optional[datetime.datetime] = None
    model_config = ConfigDict(from_attributes=True)

# --- Purchase Orders & Line Items ---
class POLineItemBase(BaseModel):
    product_id: int
    quantity: int = 1
    unit_price: float = 0.0

class POLineItemCreate(POLineItemBase):
    pass

class POLineItemResponse(POLineItemBase):
    id: int
    purchase_order_id: int
    total_price: float
    product_sku: Optional[str] = None
    product_name: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)

class PurchaseOrderCreate(BaseModel):
    po_number: str
    supplier_id: int
    destination_facility_id: Optional[int] = None
    expected_delivery_date: Optional[datetime.datetime] = None
    currency: str = "USD"
    notes: Optional[str] = None
    line_items: List[POLineItemCreate] = []
    source_connector: str = "SAP_S4HANA"
    source_record_id: Optional[str] = None
    provenance_status: str = "VERIFIED"

class PurchaseOrderUpdate(BaseModel):
    status: Optional[str] = None
    expected_delivery_date: Optional[datetime.datetime] = None
    actual_delivery_date: Optional[datetime.datetime] = None
    notes: Optional[str] = None
    provenance_status: Optional[str] = None

class PurchaseOrderResponse(BaseModel):
    id: int
    po_number: str
    supplier_id: int
    supplier_name: Optional[str] = None
    destination_facility_id: Optional[int] = None
    destination_facility_name: Optional[str] = None
    order_date: Optional[datetime.datetime] = None
    expected_delivery_date: Optional[datetime.datetime] = None
    actual_delivery_date: Optional[datetime.datetime] = None
    status: str
    total_amount: float
    currency: str
    notes: Optional[str] = None
    source_connector: str
    source_record_id: Optional[str] = None
    provenance_status: str
    is_fixture: bool
    last_observed_at: Optional[datetime.datetime] = None
    line_items_count: int = 0
    shipments_count: int = 0
    model_config = ConfigDict(from_attributes=True)

# --- Shipments ---
class ShipmentCreate(BaseModel):
    tracking_number: str
    purchase_order_id: Optional[int] = None
    origin: str
    destination: str
    carrier: str
    mode: str = "OCEAN"
    status: str = "IN_TRANSIT"
    delay_hours: int = 0
    departed_at: Optional[datetime.datetime] = None
    estimated_arrival: Optional[datetime.datetime] = None
    current_location: Optional[str] = None
    source_connector: str = "PROJECT44_TMS"
    source_record_id: Optional[str] = None
    provenance_status: str = "VERIFIED"

class ShipmentUpdate(BaseModel):
    status: Optional[str] = None
    delay_hours: Optional[int] = None
    estimated_arrival: Optional[datetime.datetime] = None
    actual_arrival: Optional[datetime.datetime] = None
    current_location: Optional[str] = None
    provenance_status: Optional[str] = None

class ShipmentResponse(BaseModel):
    id: int
    tracking_number: str
    purchase_order_id: Optional[int] = None
    po_number: Optional[str] = None
    origin: str
    destination: str
    carrier: str
    mode: str
    status: str
    delay_hours: int
    departed_at: Optional[datetime.datetime] = None
    estimated_arrival: Optional[datetime.datetime] = None
    actual_arrival: Optional[datetime.datetime] = None
    current_location: Optional[str] = None
    source_connector: str
    source_record_id: Optional[str] = None
    provenance_status: str
    is_fixture: bool
    last_observed_at: Optional[datetime.datetime] = None
    model_config = ConfigDict(from_attributes=True)

# --- Disruptions ---
class DisruptionCreate(BaseModel):
    disruption_code: str
    title: str
    category: str = "LOGISTICS"
    severity: str = "MEDIUM"
    status: str = "ACTIVE"
    affected_region: str = "Global"
    estimated_loss: float = 0.0
    summary: Optional[str] = None
    recommended_action: Optional[str] = None
    source_connector: str = "SENTINEL_AI"
    source_record_id: Optional[str] = None
    provenance_status: str = "ESTIMATED"

class DisruptionUpdate(BaseModel):
    title: Optional[str] = None
    severity: Optional[str] = None
    status: Optional[str] = None
    affected_region: Optional[str] = None
    estimated_loss: Optional[float] = None
    summary: Optional[str] = None
    recommended_action: Optional[str] = None
    provenance_status: Optional[str] = None

class DisruptionResponse(BaseModel):
    id: int
    disruption_code: str
    title: str
    category: str
    severity: str
    status: str
    affected_region: str
    estimated_loss: float
    detected_at: Optional[datetime.datetime] = None
    summary: Optional[str] = None
    recommended_action: Optional[str] = None
    source_connector: str
    source_record_id: Optional[str] = None
    provenance_status: str
    is_fixture: bool
    last_observed_at: Optional[datetime.datetime] = None
    recovery_plans_count: int = 0
    model_config = ConfigDict(from_attributes=True)

# --- Recovery Plans ---
class AlternativePlanCreate(BaseModel):
    title: str
    strategy_type: str
    estimated_cost: float
    time_to_recovery_days: int
    trade_off_analysis: Optional[str] = None

class RecoveryPlanCreate(BaseModel):
    plan_code: str
    disruption_id: Optional[int] = None
    title: str
    strategy_type: str = "REROUTE"
    estimated_cost: float = 0.0
    time_to_recovery_days: int = 7
    secondary_risk_assessment: Optional[str] = None
    confidence_score: float = 85.0
    summary: Optional[str] = None
    execution_steps: Optional[str] = None
    alternatives: List[AlternativePlanCreate] = []
    source_connector: str = "CONSEQUENCE_SIMULATOR"
    source_record_id: Optional[str] = None
    provenance_status: str = "ESTIMATED"

class RecoveryPlanUpdate(BaseModel):
    status: Optional[str] = None
    estimated_cost: Optional[float] = None
    time_to_recovery_days: Optional[int] = None
    secondary_risk_assessment: Optional[str] = None
    summary: Optional[str] = None
    execution_steps: Optional[str] = None

class RecoveryPlanResponse(BaseModel):
    id: int
    plan_code: str
    disruption_id: Optional[int] = None
    disruption_title: Optional[str] = None
    title: str
    strategy_type: str
    estimated_cost: float
    time_to_recovery_days: int
    secondary_risk_assessment: Optional[str] = None
    status: str
    confidence_score: float
    summary: Optional[str] = None
    execution_steps: Optional[str] = None
    source_connector: str
    source_record_id: Optional[str] = None
    provenance_status: str
    is_fixture: bool
    last_observed_at: Optional[datetime.datetime] = None
    created_at: Optional[datetime.datetime] = None
    model_config = ConfigDict(from_attributes=True)

# --- Approvals ---
class ApprovalDecisionRequest(BaseModel):
    decision: str # "APPROVE" or "REJECT"
    notes: Optional[str] = None

class ApprovalRequestResponse(BaseModel):
    id: int
    approval_code: str
    recovery_plan_id: Optional[int] = None
    recovery_plan_title: Optional[str] = None
    title: str
    requested_by: str
    requested_at: Optional[datetime.datetime] = None
    status: str
    approver: Optional[str] = None
    action_notes: Optional[str] = None
    action_timestamp: Optional[datetime.datetime] = None
    risk_level: str
    financial_threshold: float
    source_connector: str
    provenance_status: str
    is_fixture: bool
    model_config = ConfigDict(from_attributes=True)

# --- Incidents ---
class IncidentOutcomeCreate(BaseModel):
    incident_code: str
    disruption_type: str
    description: str
    root_cause: Optional[str] = None
    resolved_at: Optional[datetime.datetime] = None
    duration_days: int = 5
    financial_impact: float = 0.0
    lessons_learned: Optional[str] = None
    effective_strategy: Optional[str] = None
    source_connector: str = "INCIDENT_POSTMORTEM"
    source_record_id: Optional[str] = None
    provenance_status: str = "VERIFIED"

class IncidentOutcomeResponse(IncidentOutcomeCreate):
    id: int
    is_fixture: bool
    last_observed_at: Optional[datetime.datetime] = None
    model_config = ConfigDict(from_attributes=True)

# --- Integrations & Sync Runs ---
class IntegrationConnectorResponse(BaseModel):
    id: int
    connector_id: str
    name: str
    system_type: str
    endpoint_url: Optional[str] = None
    status: str
    last_sync_at: Optional[datetime.datetime] = None
    last_ping_latency_ms: Optional[int] = None
    health_message: Optional[str] = None
    auth_type: str
    records_synced: int
    is_fixture: bool
    model_config = ConfigDict(from_attributes=True)

class SyncRunCreate(BaseModel):
    sync_type: str = "INCREMENTAL"

class SyncRunResponse(BaseModel):
    id: int
    connector_id: int
    sync_type: str
    status: str
    records_processed: int
    error_log: Optional[str] = None
    started_at: datetime.datetime
    completed_at: Optional[datetime.datetime] = None
    model_config = ConfigDict(from_attributes=True)

class ConnectorTestResponse(BaseModel):
    connector_id: str
    tested_at: datetime.datetime
    success: bool
    status: str
    latency_ms: int
    message: str

# --- Audit Logs ---
class AuditLogCreate(BaseModel):
    event_type: str
    entity_type: str
    entity_id: Optional[str] = None
    description: str
    old_values: Optional[Dict[str, Any]] = None
    new_values: Optional[Dict[str, Any]] = None

class AuditLogResponse(AuditLogCreate):
    id: int
    timestamp: datetime.datetime
    user_id: Optional[int] = None
    user_email: Optional[str] = None
    user_name: Optional[str] = None
    ip_address: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)
