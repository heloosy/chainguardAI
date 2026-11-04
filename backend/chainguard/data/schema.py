"""
ChainGuard AI - Data Schemas
Defines core supply chain entities with explicit validation types.
"""
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class Supplier(BaseModel):
    supplier_id: str
    name: str
    country: str
    tier: int = Field(..., ge=1, le=2)
    category: str
    capacity_utilization: float = Field(..., ge=0.0, le=1.0)
    historical_on_time_rate: float = Field(..., ge=0.0, le=1.0)
    financial_health_score: float = Field(..., ge=0.0, le=100.0)
    lead_time_days_mean: float
    lead_time_days_std: float
    lead_time_drift_pct: float = Field(default=0.0, description="Recent trend drift % over 30 days")


class Component(BaseModel):
    component_id: str
    name: str
    supplier_id: str
    alternative_supplier_id: Optional[str] = None
    category: str
    criticality: str = Field(..., pattern="^(High|Medium|Low)$")
    unit_cost_usd: float
    current_stock: float
    safety_stock: float
    reorder_point: float
    daily_consumption_rate: float
    consumption_std: float
    holding_cost_rate: float = Field(default=0.20, description="Annual holding cost rate %")
    facility_id: str


class BOMRelationship(BaseModel):
    parent_id: str
    child_id: str
    parent_type: str  # Product, Subassembly, Plant
    child_type: str   # Subassembly, Component, Supplier
    quantity_required: float = 1.0


class PurchaseOrder(BaseModel):
    po_id: str
    component_id: str
    supplier_id: str
    destination_facility_id: str
    quantity: float
    order_date: str
    promised_delivery_date: str
    status: str = Field(..., pattern="^(In-Transit|Processing|Shipped|Delivered)$")


class Shipment(BaseModel):
    shipment_id: str
    po_id: str
    component_id: str
    supplier_id: str
    carrier: str
    transport_mode: str = Field(..., pattern="^(Ocean|Air|Truck|Rail)$")
    origin_location: str
    destination_facility_id: str
    departure_date: str
    scheduled_arrival_date: str
    current_status: str = Field(..., pattern="^(At Port|In Transit|Customs Hold|Out for Delivery|Cleared)$")
    days_in_transit: float
    eta_days_remaining: float
    last_milestone_deviation_days: float
    weather_severity_index: float = Field(..., ge=0.0, le=10.0)
    port_congestion_days: float = Field(..., ge=0.0)
    geopolitical_risk_score: float = Field(..., ge=0.0, le=10.0)


class CustomerOrder(BaseModel):
    order_id: str
    customer_name: str
    product_id: str
    quantity: float
    contract_value_usd: float
    promised_delivery_date: str
    late_penalty_usd_per_day: float
    sla_priority: str = Field(..., pattern="^(Tier 1 Strategic|Standard Commercial)$")
    destination_market: str


class ExternalSignal(BaseModel):
    signal_id: str
    source_type: str  # Port, Weather, Geopolitical, Route
    location: str
    severity: str     # Warning, Severe, Critical
    metric_name: str
    metric_value: float
    baseline_value: float
    deviation_pct: float
    description: str
    timestamp: str

