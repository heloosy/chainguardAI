import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, JSON
)
from sqlalchemy.orm import relationship
from app.database import Base

def utcnow():
    return datetime.datetime.now(datetime.timezone.utc)

# 1. Users and Roles
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(150), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(150), nullable=False)
    role = Column(String(50), default="OPERATOR") # ADMIN, OPERATOR, AUDITOR, VIEWER
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=utcnow)

    # Relationships
    audit_logs = relationship("AuditLog", back_populates="user")
    approval_decisions = relationship("ApprovalDecision", back_populates="user")


# 2. Facilities and Warehouses
class Facility(Base):
    __tablename__ = "facilities"

    id = Column(Integer, primary_key=True, index=True)
    facility_code = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(200), nullable=False)
    facility_type = Column(String(50), default="WAREHOUSE") # PLANT, WAREHOUSE, DISTRIBUTION_CENTER
    country = Column(String(100), default="United States")
    city = Column(String(100), default="Austin")
    address = Column(String(255), nullable=True)
    capacity_units = Column(Integer, default=50000)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=utcnow)

    # Relationships
    inventory_records = relationship("InventoryRecord", back_populates="facility")
    destination_orders = relationship("PurchaseOrder", back_populates="destination_facility")


# 3. Suppliers
class Supplier(Base):
    __tablename__ = "suppliers"

    id = Column(Integer, primary_key=True, index=True)
    supplier_code = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(200), nullable=False)
    tier = Column(Integer, default=1)
    status = Column(String(50), default="ACTIVE") # ACTIVE, AT_RISK, INACTIVE
    risk_score = Column(Float, default=0.0) # 0-100
    country = Column(String(100), default="United States")
    lead_time_days = Column(Integer, default=14)
    on_time_delivery_rate = Column(Float, default=95.0)
    contact_email = Column(String(150), nullable=True)
    critical_components = Column(Text, nullable=True)

    # Data Provenance
    source_connector = Column(String(100), default="MANUAL")
    source_record_id = Column(String(150), nullable=True)
    last_observed_at = Column(DateTime, default=utcnow)
    provenance_status = Column(String(50), default="VERIFIED") # VERIFIED, ESTIMATED, STALE, UNVERIFIED
    is_fixture = Column(Boolean, default=False)
    created_at = Column(DateTime, default=utcnow)

    # Relationships
    supplier_products = relationship("SupplierProduct", back_populates="supplier")
    purchase_orders = relationship("PurchaseOrder", back_populates="supplier")


# 4. Products and Materials
class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    sku = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(200), nullable=False)
    category = Column(String(100), default="Raw Materials") # Semiconductor, Power Electronics, Passives, Sensors, Assemblies
    unit = Column(String(20), default="units")
    unit_cost = Column(Float, default=0.0)
    criticality = Column(String(50), default="HIGH") # CRITICAL, HIGH, MEDIUM, LOW
    description = Column(Text, nullable=True)

    # Data Provenance
    source_connector = Column(String(100), default="MANUAL")
    source_record_id = Column(String(150), nullable=True)
    last_observed_at = Column(DateTime, default=utcnow)
    provenance_status = Column(String(50), default="VERIFIED")
    is_fixture = Column(Boolean, default=False)
    created_at = Column(DateTime, default=utcnow)

    # Relationships
    supplier_products = relationship("SupplierProduct", back_populates="product")
    inventory_records = relationship("InventoryRecord", back_populates="product")
    po_line_items = relationship("POLineItem", back_populates="product")


# 5. Supplier-Product Relationships
class SupplierProduct(Base):
    __tablename__ = "supplier_products"

    id = Column(Integer, primary_key=True, index=True)
    supplier_id = Column(Integer, ForeignKey("suppliers.id", ondelete="RESTRICT"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="RESTRICT"), nullable=False)
    is_primary = Column(Boolean, default=True)
    unit_price = Column(Float, default=0.0)
    lead_time_days = Column(Integer, default=14)
    capacity_share = Column(Float, default=100.0) # Percentage of supplier capacity allocated
    contract_reference = Column(String(100), nullable=True)

    # Relationships
    supplier = relationship("Supplier", back_populates="supplier_products")
    product = relationship("Product", back_populates="supplier_products")


# 6. Inventory Records
class InventoryRecord(Base):
    __tablename__ = "inventory_records"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="RESTRICT"), nullable=False)
    facility_id = Column(Integer, ForeignKey("facilities.id", ondelete="RESTRICT"), nullable=False)
    quantity_on_hand = Column(Integer, default=0)
    safety_stock = Column(Integer, default=100)
    reorder_point = Column(Integer, default=200)
    risk_status = Column(String(50), default="HEALTHY") # HEALTHY, AT_RISK, CRITICAL

    # Data Provenance
    source_connector = Column(String(100), default="MANHATTAN_WMS")
    source_record_id = Column(String(150), nullable=True)
    last_observed_at = Column(DateTime, default=utcnow)
    provenance_status = Column(String(50), default="VERIFIED")
    is_fixture = Column(Boolean, default=False)
    created_at = Column(DateTime, default=utcnow)

    # Relationships
    product = relationship("Product", back_populates="inventory_records")
    facility = relationship("Facility", back_populates="inventory_records")


# 7. Purchase Orders & Line Items
class PurchaseOrder(Base):
    __tablename__ = "purchase_orders"

    id = Column(Integer, primary_key=True, index=True)
    po_number = Column(String(50), unique=True, index=True, nullable=False)
    supplier_id = Column(Integer, ForeignKey("suppliers.id", ondelete="RESTRICT"), nullable=False)
    destination_facility_id = Column(Integer, ForeignKey("facilities.id", ondelete="SET NULL"), nullable=True)
    order_date = Column(DateTime, default=utcnow)
    expected_delivery_date = Column(DateTime, nullable=True)
    actual_delivery_date = Column(DateTime, nullable=True)
    status = Column(String(50), default="PENDING") # PENDING, CONFIRMED, SHIPPED, DELAYED, DELIVERED, CANCELLED
    total_amount = Column(Float, default=0.0)
    currency = Column(String(10), default="USD")
    notes = Column(Text, nullable=True)

    # Data Provenance
    source_connector = Column(String(100), default="SAP_S4HANA")
    source_record_id = Column(String(150), nullable=True)
    last_observed_at = Column(DateTime, default=utcnow)
    provenance_status = Column(String(50), default="VERIFIED")
    is_fixture = Column(Boolean, default=False)

    # Relationships
    supplier = relationship("Supplier", back_populates="purchase_orders")
    destination_facility = relationship("Facility", back_populates="destination_orders")
    line_items = relationship("POLineItem", back_populates="purchase_order", cascade="all, delete-orphan")
    shipments = relationship("Shipment", back_populates="purchase_order")


class POLineItem(Base):
    __tablename__ = "po_line_items"

    id = Column(Integer, primary_key=True, index=True)
    purchase_order_id = Column(Integer, ForeignKey("purchase_orders.id", ondelete="CASCADE"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="RESTRICT"), nullable=False)
    quantity = Column(Integer, default=1)
    unit_price = Column(Float, default=0.0)
    total_price = Column(Float, default=0.0)

    # Relationships
    purchase_order = relationship("PurchaseOrder", back_populates="line_items")
    product = relationship("Product", back_populates="po_line_items")


# 8. Shipments
class Shipment(Base):
    __tablename__ = "shipments"

    id = Column(Integer, primary_key=True, index=True)
    tracking_number = Column(String(100), unique=True, index=True, nullable=False)
    purchase_order_id = Column(Integer, ForeignKey("purchase_orders.id", ondelete="SET NULL"), nullable=True)
    origin = Column(String(150), default="Port of Origin")
    destination = Column(String(150), default="Destination Hub")
    carrier = Column(String(100), default="Global Carrier")
    mode = Column(String(50), default="OCEAN") # OCEAN, AIR, TRUCK, RAIL
    status = Column(String(50), default="IN_TRANSIT") # IN_TRANSIT, DELAYED, CUSTOMS_HOLD, DELIVERED
    delay_hours = Column(Integer, default=0)
    departed_at = Column(DateTime, nullable=True)
    estimated_arrival = Column(DateTime, nullable=True)
    actual_arrival = Column(DateTime, nullable=True)
    current_location = Column(String(150), nullable=True)

    # Data Provenance
    source_connector = Column(String(100), default="PROJECT44_TMS")
    source_record_id = Column(String(150), nullable=True)
    last_observed_at = Column(DateTime, default=utcnow)
    provenance_status = Column(String(50), default="VERIFIED")
    is_fixture = Column(Boolean, default=False)

    # Relationships
    purchase_order = relationship("PurchaseOrder", back_populates="shipments")


# 9. Disruptions & Affected Entities
class Disruption(Base):
    __tablename__ = "disruptions"

    id = Column(Integer, primary_key=True, index=True)
    disruption_code = Column(String(50), unique=True, index=True, nullable=False)
    title = Column(String(250), nullable=False)
    category = Column(String(100), default="LOGISTICS") # GEOPOLITICAL, WEATHER, PORT_CONGESTION, SUPPLIER_INSOLVENCY, QUALITY_DEFECT
    severity = Column(String(50), default="MEDIUM") # LOW, MEDIUM, HIGH, CRITICAL
    status = Column(String(50), default="ACTIVE") # DETECTED, ACTIVE, MITIGATING, RESOLVED
    affected_region = Column(String(150), default="Global")
    estimated_loss = Column(Float, default=0.0)
    detected_at = Column(DateTime, default=utcnow)
    summary = Column(Text, nullable=True)
    recommended_action = Column(Text, nullable=True)

    # Data Provenance
    source_connector = Column(String(100), default="SENTINEL_AI")
    source_record_id = Column(String(150), nullable=True)
    last_observed_at = Column(DateTime, default=utcnow)
    provenance_status = Column(String(50), default="ESTIMATED")
    is_fixture = Column(Boolean, default=False)

    # Relationships
    affected_entities = relationship("DisruptionAffectedEntity", back_populates="disruption", cascade="all, delete-orphan")
    recovery_plans = relationship("RecoveryPlan", back_populates="disruption")


class DisruptionAffectedEntity(Base):
    __tablename__ = "disruption_affected_entities"

    id = Column(Integer, primary_key=True, index=True)
    disruption_id = Column(Integer, ForeignKey("disruptions.id", ondelete="CASCADE"), nullable=False)
    entity_type = Column(String(50), nullable=False) # SUPPLIER, PRODUCT, FACILITY, SHIPMENT
    entity_id = Column(Integer, nullable=False)
    notes = Column(Text, nullable=True)

    # Relationships
    disruption = relationship("Disruption", back_populates="affected_entities")


# 10. Recovery Plans & Plan Alternatives
class RecoveryPlan(Base):
    __tablename__ = "recovery_plans"

    id = Column(Integer, primary_key=True, index=True)
    plan_code = Column(String(50), unique=True, index=True, nullable=False)
    disruption_id = Column(Integer, ForeignKey("disruptions.id", ondelete="SET NULL"), nullable=True)
    title = Column(String(250), nullable=False)
    strategy_type = Column(String(100), default="REROUTE") # REROUTE, EXPEDITE, SECOND_SOURCE, BUFFER_STOCK
    estimated_cost = Column(Float, default=0.0)
    time_to_recovery_days = Column(Integer, default=7)
    secondary_risk_assessment = Column(Text, nullable=True)
    status = Column(String(50), default="PENDING_APPROVAL") # DRAFT, PENDING_APPROVAL, APPROVED, REJECTED, EXECUTED
    confidence_score = Column(Float, default=85.0)
    summary = Column(Text, nullable=True)
    execution_steps = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utcnow)

    # Data Provenance
    source_connector = Column(String(100), default="CONSEQUENCE_SIMULATOR")
    source_record_id = Column(String(150), nullable=True)
    last_observed_at = Column(DateTime, default=utcnow)
    provenance_status = Column(String(50), default="ESTIMATED")
    is_fixture = Column(Boolean, default=False)

    # Relationships
    disruption = relationship("Disruption", back_populates="recovery_plans")
    alternatives = relationship("RecoveryPlanAlternative", back_populates="recovery_plan", cascade="all, delete-orphan")
    approval_requests = relationship("ApprovalRequest", back_populates="recovery_plan")


class RecoveryPlanAlternative(Base):
    __tablename__ = "recovery_plan_alternatives"

    id = Column(Integer, primary_key=True, index=True)
    recovery_plan_id = Column(Integer, ForeignKey("recovery_plans.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(250), nullable=False)
    strategy_type = Column(String(100), default="SECOND_SOURCE")
    estimated_cost = Column(Float, default=0.0)
    time_to_recovery_days = Column(Integer, default=14)
    trade_off_analysis = Column(Text, nullable=True)

    # Relationships
    recovery_plan = relationship("RecoveryPlan", back_populates="alternatives")


# 11. Approval Requests & Decisions
class ApprovalRequest(Base):
    __tablename__ = "approval_requests"

    id = Column(Integer, primary_key=True, index=True)
    approval_code = Column(String(50), unique=True, index=True, nullable=False)
    recovery_plan_id = Column(Integer, ForeignKey("recovery_plans.id", ondelete="SET NULL"), nullable=True)
    title = Column(String(250), nullable=False)
    requested_by = Column(String(100), default="Sentinel Recovery Engine")
    requested_at = Column(DateTime, default=utcnow)
    status = Column(String(50), default="PENDING") # PENDING, APPROVED, REJECTED
    risk_level = Column(String(50), default="HIGH")
    financial_threshold = Column(Float, default=50000.0)

    # Audit fields for current decision
    approver = Column(String(100), nullable=True)
    action_notes = Column(Text, nullable=True)
    action_timestamp = Column(DateTime, nullable=True)

    # Data Provenance
    source_connector = Column(String(100), default="DECISION_GATEKEEPER")
    source_record_id = Column(String(150), nullable=True)
    last_observed_at = Column(DateTime, default=utcnow)
    provenance_status = Column(String(50), default="VERIFIED")
    is_fixture = Column(Boolean, default=False)

    # Relationships
    recovery_plan = relationship("RecoveryPlan", back_populates="approval_requests")
    decisions = relationship("ApprovalDecision", back_populates="approval_request", cascade="all, delete-orphan")


class ApprovalDecision(Base):
    __tablename__ = "approval_decisions"

    id = Column(Integer, primary_key=True, index=True)
    approval_request_id = Column(Integer, ForeignKey("approval_requests.id", ondelete="CASCADE"), nullable=False)
    decided_by_user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    decision = Column(String(50), nullable=False) # APPROVE, REJECT
    notes = Column(Text, nullable=True)
    decided_at = Column(DateTime, default=utcnow)

    # Relationships
    approval_request = relationship("ApprovalRequest", back_populates="decisions")
    user = relationship("User", back_populates="approval_decisions")


# 12. Incident Outcomes
class IncidentOutcome(Base):
    __tablename__ = "incident_outcomes"

    id = Column(Integer, primary_key=True, index=True)
    incident_code = Column(String(50), unique=True, index=True, nullable=False)
    disruption_type = Column(String(100), default="SUPPLY_CHAIN_BOTTLENECK")
    description = Column(String(300), nullable=False)
    root_cause = Column(Text, nullable=True)
    resolved_at = Column(DateTime, default=utcnow)
    duration_days = Column(Integer, default=5)
    financial_impact = Column(Float, default=0.0)
    lessons_learned = Column(Text, nullable=True)
    effective_strategy = Column(String(150), nullable=True)

    # Data Provenance
    source_connector = Column(String(100), default="INCIDENT_POSTMORTEM")
    source_record_id = Column(String(150), nullable=True)
    last_observed_at = Column(DateTime, default=utcnow)
    provenance_status = Column(String(50), default="VERIFIED")
    is_fixture = Column(Boolean, default=False)


# 13. Integrations & Sync Runs
class IntegrationConnector(Base):
    __tablename__ = "integration_connectors"

    id = Column(Integer, primary_key=True, index=True)
    connector_id = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(150), nullable=False)
    system_type = Column(String(50), nullable=False) # SAP_S4HANA, ORACLE_NETSUITE, MANHATTAN_WMS, PROJECT44_TMS, COUPA
    endpoint_url = Column(String(255), nullable=True)
    status = Column(String(50), default="DISCONNECTED") # CONNECTED, DISCONNECTED, ERROR, SYNCING
    last_sync_at = Column(DateTime, nullable=True)
    last_ping_latency_ms = Column(Integer, nullable=True)
    health_message = Column(String(255), default="Awaiting credential setup and connection test")
    auth_type = Column(String(50), default="OAuth 2.0 / API Key")
    records_synced = Column(Integer, default=0)
    is_fixture = Column(Boolean, default=False)

    # Relationships
    sync_runs = relationship("SyncRun", back_populates="connector", cascade="all, delete-orphan")


class SyncRun(Base):
    __tablename__ = "sync_runs"

    id = Column(Integer, primary_key=True, index=True)
    connector_id = Column(Integer, ForeignKey("integration_connectors.id", ondelete="CASCADE"), nullable=False)
    sync_type = Column(String(50), default="INCREMENTAL") # FULL, INCREMENTAL
    status = Column(String(50), default="SUCCESS") # SUCCESS, FAILED, RUNNING
    records_processed = Column(Integer, default=0)
    error_log = Column(Text, nullable=True)
    started_at = Column(DateTime, default=utcnow)
    completed_at = Column(DateTime, default=utcnow)

    # Relationships
    connector = relationship("IntegrationConnector", back_populates="sync_runs")


# 14. Audit Logs
class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=utcnow, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    event_type = Column(String(50), nullable=False, index=True) # CREATE, UPDATE, DELETE, APPROVE, REJECT, SYNC, LOGIN
    entity_type = Column(String(50), nullable=False, index=True) # SUPPLIER, PRODUCT, ORDER, PLAN, APPROVAL
    entity_id = Column(String(50), nullable=True)
    description = Column(String(300), nullable=False)
    old_values = Column(JSON, nullable=True)
    new_values = Column(JSON, nullable=True)
    ip_address = Column(String(50), nullable=True)

    # Relationships
    user = relationship("User", back_populates="audit_logs")


# 15. AI Agent Status
class AgentStatus(Base):
    __tablename__ = "agent_status"

    id = Column(Integer, primary_key=True, index=True)
    agent_id = Column(String(50), unique=True, index=True, nullable=False)
    agent_name = Column(String(150), nullable=False)
    role = Column(String(250), nullable=False)
    status = Column(String(50), default="MONITORING") # IDLE, MONITORING, SIMULATING, ALERTED, DISABLED
    last_run_at = Column(DateTime, default=utcnow)
    next_run_at = Column(DateTime, nullable=True)
    version = Column(String(20), default="v1.0.0")
    active_tasks_count = Column(Integer, default=0)
    description = Column(Text, nullable=True)
    is_fixture = Column(Boolean, default=False)


# 16. System Settings
class SystemSetting(Base):
    __tablename__ = "system_settings"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String(100), unique=True, index=True, nullable=False)
    value = Column(String(255), nullable=False)
    description = Column(String(255), nullable=True)
    updated_at = Column(DateTime, default=utcnow)
