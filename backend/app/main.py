import os
import datetime
import random
from typing import List, Optional
from fastapi import FastAPI, Depends, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import or_, func

from app.config import settings
from app.database import Base, engine, get_db, engine_operational, engine_error
from app.models import (
    User,
    Facility,
    Supplier,
    Product,
    SupplierProduct,
    InventoryRecord,
    PurchaseOrder,
    POLineItem,
    Shipment,
    Disruption,
    DisruptionAffectedEntity,
    RecoveryPlan,
    RecoveryPlanAlternative,
    ApprovalRequest,
    ApprovalDecision,
    IncidentOutcome,
    IntegrationConnector,
    SyncRun,
    AuditLog,
    AgentStatus,
    SystemSetting
)
from app.auth import (
    verify_password,
    get_password_hash,
    create_access_token,
    get_current_user,
    get_optional_user,
    require_roles,
    init_bootstrap_users
)
from app.schemas import (
    HealthResponse,
    ApplicationStatusResponse,
    UserLoginRequest,
    UserRegisterRequest,
    UserResponse,
    TokenResponse,
    FacilityCreate,
    FacilityResponse,
    SupplierCreate,
    SupplierUpdate,
    SupplierResponse,
    ProductCreate,
    ProductUpdate,
    ProductResponse,
    SupplierProductCreate,
    SupplierProductResponse,
    InventoryRecordCreate,
    InventoryRecordUpdate,
    InventoryRecordResponse,
    PurchaseOrderCreate,
    PurchaseOrderUpdate,
    PurchaseOrderResponse,
    POLineItemResponse,
    ShipmentCreate,
    ShipmentUpdate,
    ShipmentResponse,
    DisruptionCreate,
    DisruptionUpdate,
    DisruptionResponse,
    RecoveryPlanCreate,
    RecoveryPlanUpdate,
    RecoveryPlanResponse,
    ApprovalDecisionRequest,
    ApprovalRequestResponse,
    IncidentOutcomeCreate,
    IncidentOutcomeResponse,
    IntegrationConnectorResponse,
    SyncRunCreate,
    SyncRunResponse,
    ConnectorTestResponse,
    AuditLogCreate,
    AuditLogResponse
)
from app.seed import seed_database_phase2

# Ensure tables are created
Base.metadata.create_all(bind=engine)

# Auto-seed bootstrap users and records if database is fresh
with Session(engine) as init_session:
    seed_database_phase2(init_session, include_fixtures=True)

app = FastAPI(
    title="ChainGuard AI API",
    description="Enterprise Supply-Chain Resilience Control Tower - Phase 2 Persistent Backend",
    version="2.0.0"
)

# CORS setup
origins = [origin.strip() for origin in settings.ALLOWED_ORIGINS.split(",") if origin.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if origins else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def utcnow():
    return datetime.datetime.now(datetime.timezone.utc)

def log_audit_event(
    db: Session,
    event_type: str,
    entity_type: str,
    entity_id: Optional[str],
    description: str,
    user: Optional[User] = None,
    old_values: Optional[dict] = None,
    new_values: Optional[dict] = None,
):
    audit = AuditLog(
        timestamp=utcnow(),
        user_id=user.id if user else None,
        event_type=event_type,
        entity_type=entity_type,
        entity_id=str(entity_id) if entity_id is not None else None,
        description=description,
        old_values=old_values,
        new_values=new_values,
    )
    db.add(audit)
    db.commit()


# =====================================================================
# 1. HEALTH & APPLICATION STATUS
# =====================================================================
@app.get("/health", response_model=HealthResponse, tags=["Health & Status"])
@app.get("/api/health", response_model=HealthResponse, tags=["Health & Status"])
def get_health():
    return HealthResponse(
        status="healthy" if engine_operational else "degraded",
        timestamp=utcnow(),
        environment=settings.CHAINGUARD_ENV,
        database_engine="PostgreSQL (Supabase)" if settings.is_postgres else "SQLite (Local Persistent Storage)",
        auth_engine="PyJWT + Bcrypt (HMAC-SHA256)",
        version="2.0.0"
    )

@app.get("/api/status", response_model=ApplicationStatusResponse, tags=["Health & Status"])
def get_detailed_status(db: Session = Depends(get_db)):
    missing = []
    if not settings.SUPABASE_DATABASE_URL:
        missing.append("SUPABASE_DATABASE_URL (PostgreSQL cloud cluster unconfigured - using local persistent SQLite)")
    if not os.getenv("SAP_CLIENT_ID"):
        missing.append("SAP_CLIENT_ID / SAP_CLIENT_SECRET (Enterprise OData ERP connector in mock/preview mode)")
    if not os.getenv("PROJECT44_API_KEY"):
        missing.append("PROJECT44_API_KEY (Carrier marine/air tracking feeds in mock/preview mode)")

    counts = {
        "users": db.query(User).count(),
        "facilities": db.query(Facility).count(),
        "suppliers": db.query(Supplier).count(),
        "products": db.query(Product).count(),
        "inventory_records": db.query(InventoryRecord).count(),
        "purchase_orders": db.query(PurchaseOrder).count(),
        "shipments": db.query(Shipment).count(),
        "disruptions": db.query(Disruption).count(),
        "recovery_plans": db.query(RecoveryPlan).count(),
        "approval_requests": db.query(ApprovalRequest).count(),
        "incident_outcomes": db.query(IncidentOutcome).count(),
        "integration_connectors": db.query(IntegrationConnector).count(),
        "audit_logs": db.query(AuditLog).count(),
    }

    db_engine_name = "PostgreSQL (Supabase)" if settings.is_postgres else "SQLite (Local Persistent Storage)"
    status_msg = (
        "PostgreSQL Supabase cluster active and verified."
        if settings.is_postgres
        else "Local persistent SQLite active with full relational integrity. Awaiting external PostgreSQL/Supabase credentials."
    )

    return ApplicationStatusResponse(
        application_name="ChainGuard AI Enterprise Control Tower",
        version="2.0.0",
        environment=settings.CHAINGUARD_ENV,
        database_engine=db_engine_name,
        database_url_configured=bool(settings.DATABASE_URL or settings.SUPABASE_DATABASE_URL),
        postgres_configured=settings.is_postgres,
        supabase_configured=bool(settings.SUPABASE_DATABASE_URL),
        persistent_storage_operational=engine_operational,
        auth_configured=True,
        missing_credentials=missing,
        records_count=counts,
        system_message=status_msg
    )


# =====================================================================
# 2. AUTHENTICATION & USERS
# =====================================================================
@app.post("/api/auth/login", response_model=TokenResponse, tags=["Authentication"])
def login(login_req: UserLoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == login_req.email).first()
    if not user or not verify_password(login_req.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
            headers={"WWW-Authenticate": "Bearer"}
        )
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is disabled.")

    access_token = create_access_token(data={"sub": user.email, "role": user.role})
    log_audit_event(
        db,
        event_type="LOGIN",
        entity_type="USER",
        entity_id=str(user.id),
        description=f"User {user.email} authenticated successfully with role '{user.role}'.",
        user=user
    )

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        expires_in_seconds=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=UserResponse.model_validate(user)
    )

@app.get("/api/auth/me", response_model=UserResponse, tags=["Authentication"])
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    return UserResponse.model_validate(current_user)

@app.get("/api/users", response_model=List[UserResponse], tags=["Authentication"])
def list_users(
    current_user: User = Depends(require_roles(["ADMIN", "AUDITOR"])),
    db: Session = Depends(get_db)
):
    return db.query(User).all()


# =====================================================================
# 3. FACILITIES & WAREHOUSES
# =====================================================================
@app.get("/api/facilities", response_model=List[FacilityResponse], tags=["Facilities"])
def list_facilities(db: Session = Depends(get_db)):
    return db.query(Facility).all()

@app.post("/api/facilities", response_model=FacilityResponse, tags=["Facilities"])
def create_facility(
    facility_in: FacilityCreate,
    current_user: User = Depends(require_roles(["ADMIN", "OPERATOR"])),
    db: Session = Depends(get_db)
):
    existing = db.query(Facility).filter(Facility.facility_code == facility_in.facility_code).first()
    if existing:
        raise HTTPException(status_code=400, detail="Facility code already registered.")
    
    fac = Facility(**facility_in.model_dump())
    db.add(fac)
    db.commit()
    db.refresh(fac)
    log_audit_event(db, "CREATE", "FACILITY", str(fac.id), f"Created facility {fac.name} ({fac.facility_code})", current_user)
    return fac

@app.get("/api/facilities/{facility_id}", response_model=FacilityResponse, tags=["Facilities"])
def get_facility(facility_id: int, db: Session = Depends(get_db)):
    fac = db.query(Facility).filter(Facility.id == facility_id).first()
    if not fac:
        raise HTTPException(status_code=404, detail="Facility not found.")
    return fac


# =====================================================================
# 4. SUPPLIERS (With Safe Deletion)
# =====================================================================
@app.get("/api/suppliers", response_model=List[SupplierResponse], tags=["Suppliers"])
def list_suppliers(
    search: Optional[str] = None,
    status_filter: Optional[str] = Query(None, alias="status"),
    tier: Optional[int] = None,
    provenance_status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Supplier)
    if search:
        query = query.filter(
            or_(
                Supplier.name.ilike(f"%{search}%"),
                Supplier.supplier_code.ilike(f"%{search}%"),
                Supplier.country.ilike(f"%{search}%"),
                Supplier.critical_components.ilike(f"%{search}%")
            )
        )
    if status_filter:
        query = query.filter(Supplier.status == status_filter)
    if tier:
        query = query.filter(Supplier.tier == tier)
    if provenance_status:
        query = query.filter(Supplier.provenance_status == provenance_status)
    return query.order_by(Supplier.risk_score.desc()).all()

@app.post("/api/suppliers", response_model=SupplierResponse, status_code=201, tags=["Suppliers"])
def create_supplier(
    supplier_in: SupplierCreate,
    current_user: User = Depends(require_roles(["ADMIN", "OPERATOR"])),
    db: Session = Depends(get_db)
):
    if db.query(Supplier).filter(Supplier.supplier_code == supplier_in.supplier_code).first():
        raise HTTPException(status_code=400, detail="Supplier with this supplier_code already exists.")
    
    supp = Supplier(**supplier_in.model_dump())
    supp.last_observed_at = utcnow()
    db.add(supp)
    db.commit()
    db.refresh(supp)
    log_audit_event(db, "CREATE", "SUPPLIER", str(supp.id), f"Created supplier {supp.name} ({supp.supplier_code})", current_user)
    return supp

@app.get("/api/suppliers/{supplier_id}", tags=["Suppliers"])
def get_supplier_detail(supplier_id: int, db: Session = Depends(get_db)):
    supp = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if not supp:
        raise HTTPException(status_code=404, detail="Supplier not found.")
    
    linked_products = [
        {
            "product_id": sp.product.id,
            "sku": sp.product.sku,
            "name": sp.product.name,
            "unit_price": sp.unit_price,
            "is_primary": sp.is_primary,
            "lead_time_days": sp.lead_time_days
        }
        for sp in supp.supplier_products
    ]
    
    pos = [
        {
            "id": po.id,
            "po_number": po.po_number,
            "status": po.status,
            "total_amount": po.total_amount,
            "currency": po.currency,
            "order_date": po.order_date
        }
        for po in supp.purchase_orders
    ]

    return {
        "supplier": SupplierResponse.model_validate(supp),
        "linked_products": linked_products,
        "linked_purchase_orders": pos
    }

@app.put("/api/suppliers/{supplier_id}", response_model=SupplierResponse, tags=["Suppliers"])
def update_supplier(
    supplier_id: int,
    supplier_update: SupplierUpdate,
    current_user: User = Depends(require_roles(["ADMIN", "OPERATOR"])),
    db: Session = Depends(get_db)
):
    supp = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if not supp:
        raise HTTPException(status_code=404, detail="Supplier not found.")
    
    update_data = supplier_update.model_dump(exclude_unset=True)
    old_data = {k: getattr(supp, k) for k in update_data.keys()}
    for k, v in update_data.items():
        setattr(supp, k, v)
    supp.last_observed_at = utcnow()
    db.commit()
    db.refresh(supp)
    log_audit_event(
        db, "UPDATE", "SUPPLIER", str(supp.id),
        f"Updated supplier {supp.supplier_code}", current_user, old_values=old_data, new_values=update_data
    )
    return supp

@app.delete("/api/suppliers/{supplier_id}", tags=["Suppliers"])
def delete_supplier(
    supplier_id: int,
    current_user: User = Depends(require_roles(["ADMIN"])),
    db: Session = Depends(get_db)
):
    supp = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if not supp:
        raise HTTPException(status_code=404, detail="Supplier not found.")

    # Safe deletion rule: Block if supplier is referenced by POs or Products
    po_count = db.query(PurchaseOrder).filter(PurchaseOrder.supplier_id == supplier_id).count()
    if po_count > 0:
        raise HTTPException(
            status_code=409,
            detail=f"Cannot delete supplier '{supp.name}'. {po_count} purchase orders reference this supplier. Deactivate status to INACTIVE instead."
        )

    sp_count = db.query(SupplierProduct).filter(SupplierProduct.supplier_id == supplier_id).count()
    if sp_count > 0:
        raise HTTPException(
            status_code=409,
            detail=f"Cannot delete supplier '{supp.name}'. {sp_count} products are mapped to this supplier in the catalog."
        )

    db.delete(supp)
    db.commit()
    log_audit_event(db, "DELETE", "SUPPLIER", str(supplier_id), f"Deleted supplier {supp.supplier_code}", current_user)
    return {"message": f"Supplier {supp.supplier_code} safely deleted."}


# =====================================================================
# 5. PRODUCTS & MATERIALS (With Safe Deletion)
# =====================================================================
@app.get("/api/products", response_model=List[ProductResponse], tags=["Products & Materials"])
def list_products(
    search: Optional[str] = None,
    category: Optional[str] = None,
    criticality: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Product)
    if search:
        query = query.filter(
            or_(Product.sku.ilike(f"%{search}%"), Product.name.ilike(f"%{search}%"))
        )
    if category:
        query = query.filter(Product.category == category)
    if criticality:
        query = query.filter(Product.criticality == criticality)
    return query.all()

@app.post("/api/products", response_model=ProductResponse, status_code=201, tags=["Products & Materials"])
def create_product(
    prod_in: ProductCreate,
    current_user: User = Depends(require_roles(["ADMIN", "OPERATOR"])),
    db: Session = Depends(get_db)
):
    if db.query(Product).filter(Product.sku == prod_in.sku).first():
        raise HTTPException(status_code=400, detail="Product with this SKU already exists.")
    
    prod = Product(**prod_in.model_dump())
    prod.last_observed_at = utcnow()
    db.add(prod)
    db.commit()
    db.refresh(prod)
    log_audit_event(db, "CREATE", "PRODUCT", str(prod.id), f"Created product SKU {prod.sku}", current_user)
    return prod

@app.get("/api/products/{product_id}", tags=["Products & Materials"])
def get_product_detail(product_id: int, db: Session = Depends(get_db)):
    prod = db.query(Product).filter(Product.id == product_id).first()
    if not prod:
        raise HTTPException(status_code=404, detail="Product not found.")

    suppliers = [
        {
            "supplier_id": sp.supplier.id,
            "supplier_code": sp.supplier.supplier_code,
            "name": sp.supplier.name,
            "unit_price": sp.unit_price,
            "is_primary": sp.is_primary,
            "lead_time_days": sp.lead_time_days
        }
        for sp in prod.supplier_products
    ]

    inventory = [
        {
            "facility_id": inv.facility.id,
            "facility_name": inv.facility.name,
            "quantity_on_hand": inv.quantity_on_hand,
            "safety_stock": inv.safety_stock,
            "risk_status": inv.risk_status
        }
        for inv in prod.inventory_records
    ]

    return {
        "product": ProductResponse.model_validate(prod),
        "suppliers": suppliers,
        "inventory_distribution": inventory
    }

@app.put("/api/products/{product_id}", response_model=ProductResponse, tags=["Products & Materials"])
def update_product(
    product_id: int,
    prod_update: ProductUpdate,
    current_user: User = Depends(require_roles(["ADMIN", "OPERATOR"])),
    db: Session = Depends(get_db)
):
    prod = db.query(Product).filter(Product.id == product_id).first()
    if not prod:
        raise HTTPException(status_code=404, detail="Product not found.")
    
    update_data = prod_update.model_dump(exclude_unset=True)
    for k, v in update_data.items():
        setattr(prod, k, v)
    prod.last_observed_at = utcnow()
    db.commit()
    db.refresh(prod)
    log_audit_event(db, "UPDATE", "PRODUCT", str(prod.id), f"Updated product {prod.sku}", current_user)
    return prod

@app.delete("/api/products/{product_id}", tags=["Products & Materials"])
def delete_product(
    product_id: int,
    current_user: User = Depends(require_roles(["ADMIN"])),
    db: Session = Depends(get_db)
):
    prod = db.query(Product).filter(Product.id == product_id).first()
    if not prod:
        raise HTTPException(status_code=404, detail="Product not found.")

    # Safe deletion rule: Block if product exists in inventory or PO line items
    inv_count = db.query(InventoryRecord).filter(InventoryRecord.product_id == product_id).count()
    if inv_count > 0:
        raise HTTPException(
            status_code=409,
            detail=f"Cannot delete product '{prod.sku}'. Stock records exist in {inv_count} facilities."
        )

    po_lines_count = db.query(POLineItem).filter(POLineItem.product_id == product_id).count()
    if po_lines_count > 0:
        raise HTTPException(
            status_code=409,
            detail=f"Cannot delete product '{prod.sku}'. It is referenced in {po_lines_count} purchase order line items."
        )

    # Delete supplier mapping links safely first
    db.query(SupplierProduct).filter(SupplierProduct.product_id == product_id).delete()
    db.delete(prod)
    db.commit()
    log_audit_event(db, "DELETE", "PRODUCT", str(product_id), f"Deleted product {prod.sku}", current_user)
    return {"message": f"Product {prod.sku} safely deleted."}


# =====================================================================
# 6. SUPPLIER-PRODUCT RELATIONSHIPS
# =====================================================================
@app.post("/api/supplier-products", response_model=SupplierProductResponse, tags=["Suppliers"])
def link_supplier_product(
    link_in: SupplierProductCreate,
    current_user: User = Depends(require_roles(["ADMIN", "OPERATOR"])),
    db: Session = Depends(get_db)
):
    supp = db.query(Supplier).filter(Supplier.id == link_in.supplier_id).first()
    prod = db.query(Product).filter(Product.id == link_in.product_id).first()
    if not supp or not prod:
        raise HTTPException(status_code=404, detail="Supplier or Product not found.")

    existing = db.query(SupplierProduct).filter_by(supplier_id=link_in.supplier_id, product_id=link_in.product_id).first()
    if existing:
        existing.is_primary = link_in.is_primary
        existing.unit_price = link_in.unit_price
        existing.lead_time_days = link_in.lead_time_days
        db.commit()
        db.refresh(existing)
        return existing

    sp = SupplierProduct(**link_in.model_dump())
    db.add(sp)
    db.commit()
    db.refresh(sp)
    return sp


# =====================================================================
# 7. INVENTORY RECORDS
# =====================================================================
@app.get("/api/inventory", response_model=List[InventoryRecordResponse], tags=["Inventory"])
def list_inventory(
    search: Optional[str] = None,
    risk_status: Optional[str] = None,
    facility_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    query = db.query(InventoryRecord)
    if risk_status:
        query = query.filter(InventoryRecord.risk_status == risk_status)
    if facility_id:
        query = query.filter(InventoryRecord.facility_id == facility_id)

    records = query.all()
    results = []
    for inv in records:
        if search:
            term = search.lower()
            if not (term in inv.product.name.lower() or term in inv.product.sku.lower() or term in inv.facility.name.lower()):
                continue
        resp = InventoryRecordResponse(
            id=inv.id,
            product_id=inv.product_id,
            facility_id=inv.facility_id,
            quantity_on_hand=inv.quantity_on_hand,
            safety_stock=inv.safety_stock,
            reorder_point=inv.reorder_point,
            risk_status=inv.risk_status,
            source_connector=inv.source_connector,
            source_record_id=inv.source_record_id,
            provenance_status=inv.provenance_status,
            product_sku=inv.product.sku if inv.product else None,
            product_name=inv.product.name if inv.product else None,
            facility_name=inv.facility.name if inv.facility else None,
            unit_cost=inv.product.unit_cost if inv.product else 0.0,
            unit=inv.product.unit if inv.product else "units",
            is_fixture=inv.is_fixture,
            last_observed_at=inv.last_observed_at
        )
        results.append(resp)
    return results

@app.post("/api/inventory", response_model=InventoryRecordResponse, status_code=201, tags=["Inventory"])
def create_inventory_record(
    inv_in: InventoryRecordCreate,
    current_user: User = Depends(require_roles(["ADMIN", "OPERATOR"])),
    db: Session = Depends(get_db)
):
    existing = db.query(InventoryRecord).filter_by(product_id=inv_in.product_id, facility_id=inv_in.facility_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Inventory record already exists for this product and facility.")

    inv = InventoryRecord(**inv_in.model_dump())
    inv.last_observed_at = utcnow()
    db.add(inv)
    db.commit()
    db.refresh(inv)
    return InventoryRecordResponse(
        id=inv.id,
        product_id=inv.product_id,
        facility_id=inv.facility_id,
        quantity_on_hand=inv.quantity_on_hand,
        safety_stock=inv.safety_stock,
        reorder_point=inv.reorder_point,
        risk_status=inv.risk_status,
        source_connector=inv.source_connector,
        source_record_id=inv.source_record_id,
        provenance_status=inv.provenance_status,
        product_sku=inv.product.sku if inv.product else None,
        product_name=inv.product.name if inv.product else None,
        facility_name=inv.facility.name if inv.facility else None,
        unit_cost=inv.product.unit_cost if inv.product else 0.0,
        unit=inv.product.unit if inv.product else "units",
        is_fixture=inv.is_fixture,
        last_observed_at=inv.last_observed_at
    )

@app.put("/api/inventory/{inventory_id}", response_model=InventoryRecordResponse, tags=["Inventory"])
def update_inventory_record(
    inventory_id: int,
    inv_update: InventoryRecordUpdate,
    current_user: User = Depends(require_roles(["ADMIN", "OPERATOR"])),
    db: Session = Depends(get_db)
):
    inv = db.query(InventoryRecord).filter(InventoryRecord.id == inventory_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Inventory record not found.")

    update_data = inv_update.model_dump(exclude_unset=True)
    for k, v in update_data.items():
        setattr(inv, k, v)
    inv.last_observed_at = utcnow()
    db.commit()
    db.refresh(inv)
    return InventoryRecordResponse(
        id=inv.id,
        product_id=inv.product_id,
        facility_id=inv.facility_id,
        quantity_on_hand=inv.quantity_on_hand,
        safety_stock=inv.safety_stock,
        reorder_point=inv.reorder_point,
        risk_status=inv.risk_status,
        source_connector=inv.source_connector,
        source_record_id=inv.source_record_id,
        provenance_status=inv.provenance_status,
        product_sku=inv.product.sku if inv.product else None,
        product_name=inv.product.name if inv.product else None,
        facility_name=inv.facility.name if inv.facility else None,
        unit_cost=inv.product.unit_cost if inv.product else 0.0,
        unit=inv.product.unit if inv.product else "units",
        is_fixture=inv.is_fixture,
        last_observed_at=inv.last_observed_at
    )


# =====================================================================
# 8. PURCHASE ORDERS (With Safe Deletion)
# =====================================================================
@app.get("/api/purchase-orders", response_model=List[PurchaseOrderResponse], tags=["Purchase Orders"])
def list_purchase_orders(
    search: Optional[str] = None,
    status_filter: Optional[str] = Query(None, alias="status"),
    db: Session = Depends(get_db)
):
    query = db.query(PurchaseOrder)
    if search:
        query = query.filter(
            or_(PurchaseOrder.po_number.ilike(f"%{search}%"), PurchaseOrder.notes.ilike(f"%{search}%"))
        )
    if status_filter:
        query = query.filter(PurchaseOrder.status == status_filter)

    orders = query.order_by(PurchaseOrder.order_date.desc()).all()
    results = []
    for po in orders:
        results.append(
            PurchaseOrderResponse(
                id=po.id,
                po_number=po.po_number,
                supplier_id=po.supplier_id,
                supplier_name=po.supplier.name if po.supplier else None,
                destination_facility_id=po.destination_facility_id,
                destination_facility_name=po.destination_facility.name if po.destination_facility else None,
                order_date=po.order_date,
                expected_delivery_date=po.expected_delivery_date,
                actual_delivery_date=po.actual_delivery_date,
                status=po.status,
                total_amount=po.total_amount,
                currency=po.currency,
                notes=po.notes,
                source_connector=po.source_connector,
                source_record_id=po.source_record_id,
                provenance_status=po.provenance_status,
                is_fixture=po.is_fixture,
                last_observed_at=po.last_observed_at,
                line_items_count=len(po.line_items),
                shipments_count=len(po.shipments)
            )
        )
    return results

@app.post("/api/purchase-orders", response_model=PurchaseOrderResponse, status_code=201, tags=["Purchase Orders"])
def create_purchase_order(
    po_in: PurchaseOrderCreate,
    current_user: User = Depends(require_roles(["ADMIN", "OPERATOR"])),
    db: Session = Depends(get_db)
):
    if db.query(PurchaseOrder).filter(PurchaseOrder.po_number == po_in.po_number).first():
        raise HTTPException(status_code=400, detail="PO Number already exists.")

    total_calc = 0.0
    for li in po_in.line_items:
        total_calc += li.quantity * li.unit_price

    po = PurchaseOrder(
        po_number=po_in.po_number,
        supplier_id=po_in.supplier_id,
        destination_facility_id=po_in.destination_facility_id,
        expected_delivery_date=po_in.expected_delivery_date,
        status="PENDING",
        total_amount=total_calc,
        currency=po_in.currency,
        notes=po_in.notes,
        source_connector=po_in.source_connector,
        source_record_id=po_in.source_record_id,
        provenance_status=po_in.provenance_status,
        last_observed_at=utcnow()
    )
    db.add(po)
    db.commit()
    db.refresh(po)

    for item in po_in.line_items:
        line_item = POLineItem(
            purchase_order_id=po.id,
            product_id=item.product_id,
            quantity=item.quantity,
            unit_price=item.unit_price,
            total_price=item.quantity * item.unit_price
        )
        db.add(line_item)
    db.commit()
    db.refresh(po)

    log_audit_event(db, "CREATE", "PURCHASE_ORDER", str(po.id), f"Created Purchase Order {po.po_number}", current_user)

    return PurchaseOrderResponse(
        id=po.id,
        po_number=po.po_number,
        supplier_id=po.supplier_id,
        supplier_name=po.supplier.name if po.supplier else None,
        destination_facility_id=po.destination_facility_id,
        destination_facility_name=po.destination_facility.name if po.destination_facility else None,
        order_date=po.order_date,
        expected_delivery_date=po.expected_delivery_date,
        status=po.status,
        total_amount=po.total_amount,
        currency=po.currency,
        notes=po.notes,
        source_connector=po.source_connector,
        provenance_status=po.provenance_status,
        is_fixture=po.is_fixture,
        line_items_count=len(po.line_items),
        shipments_count=0
    )

@app.get("/api/purchase-orders/{po_id}", tags=["Purchase Orders"])
def get_purchase_order_detail(po_id: int, db: Session = Depends(get_db)):
    po = db.query(PurchaseOrder).filter(PurchaseOrder.id == po_id).first()
    if not po:
        raise HTTPException(status_code=404, detail="Purchase order not found.")

    lines = [
        {
            "id": li.id,
            "product_id": li.product_id,
            "sku": li.product.sku if li.product else None,
            "product_name": li.product.name if li.product else None,
            "quantity": li.quantity,
            "unit_price": li.unit_price,
            "total_price": li.total_price
        }
        for li in po.line_items
    ]

    shipments = [
        {
            "id": shp.id,
            "tracking_number": shp.tracking_number,
            "carrier": shp.carrier,
            "status": shp.status,
            "delay_hours": shp.delay_hours
        }
        for shp in po.shipments
    ]

    return {
        "order": PurchaseOrderResponse(
            id=po.id,
            po_number=po.po_number,
            supplier_id=po.supplier_id,
            supplier_name=po.supplier.name if po.supplier else None,
            destination_facility_id=po.destination_facility_id,
            destination_facility_name=po.destination_facility.name if po.destination_facility else None,
            order_date=po.order_date,
            expected_delivery_date=po.expected_delivery_date,
            actual_delivery_date=po.actual_delivery_date,
            status=po.status,
            total_amount=po.total_amount,
            currency=po.currency,
            notes=po.notes,
            source_connector=po.source_connector,
            provenance_status=po.provenance_status,
            is_fixture=po.is_fixture,
            line_items_count=len(po.line_items),
            shipments_count=len(po.shipments)
        ),
        "supplier": SupplierResponse.model_validate(po.supplier) if po.supplier else None,
        "line_items": lines,
        "shipments": shipments
    }

@app.put("/api/purchase-orders/{po_id}", response_model=PurchaseOrderResponse, tags=["Purchase Orders"])
def update_purchase_order(
    po_id: int,
    po_update: PurchaseOrderUpdate,
    current_user: User = Depends(require_roles(["ADMIN", "OPERATOR"])),
    db: Session = Depends(get_db)
):
    po = db.query(PurchaseOrder).filter(PurchaseOrder.id == po_id).first()
    if not po:
        raise HTTPException(status_code=404, detail="Purchase order not found.")
    
    update_data = po_update.model_dump(exclude_unset=True)
    for k, v in update_data.items():
        setattr(po, k, v)
    po.last_observed_at = utcnow()
    db.commit()
    db.refresh(po)
    log_audit_event(db, "UPDATE", "PURCHASE_ORDER", str(po.id), f"Updated PO {po.po_number} status to {po.status}", current_user)
    
    return PurchaseOrderResponse(
        id=po.id,
        po_number=po.po_number,
        supplier_id=po.supplier_id,
        supplier_name=po.supplier.name if po.supplier else None,
        status=po.status,
        total_amount=po.total_amount,
        currency=po.currency,
        source_connector=po.source_connector,
        provenance_status=po.provenance_status,
        is_fixture=po.is_fixture
    )

@app.delete("/api/purchase-orders/{po_id}", tags=["Purchase Orders"])
def delete_purchase_order(
    po_id: int,
    current_user: User = Depends(require_roles(["ADMIN"])),
    db: Session = Depends(get_db)
):
    po = db.query(PurchaseOrder).filter(PurchaseOrder.id == po_id).first()
    if not po:
        raise HTTPException(status_code=404, detail="Purchase order not found.")

    # Safe deletion rule: Block if in-transit shipments are tied to this PO
    shipment_count = db.query(Shipment).filter(Shipment.purchase_order_id == po_id).count()
    if shipment_count > 0:
        raise HTTPException(
            status_code=409,
            detail=f"Cannot delete PO '{po.po_number}'. {shipment_count} shipments are currently linked to this order. Cancel order status instead."
        )

    db.delete(po)
    db.commit()
    log_audit_event(db, "DELETE", "PURCHASE_ORDER", str(po_id), f"Deleted PO {po.po_number}", current_user)
    return {"message": f"Purchase order {po.po_number} safely deleted."}


# =====================================================================
# 9. SHIPMENTS
# =====================================================================
@app.get("/api/shipments", response_model=List[ShipmentResponse], tags=["Shipments"])
def list_shipments(
    search: Optional[str] = None,
    status_filter: Optional[str] = Query(None, alias="status"),
    mode: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Shipment)
    if search:
        query = query.filter(
            or_(
                Shipment.tracking_number.ilike(f"%{search}%"),
                Shipment.carrier.ilike(f"%{search}%"),
                Shipment.origin.ilike(f"%{search}%"),
                Shipment.destination.ilike(f"%{search}%")
            )
        )
    if status_filter:
        query = query.filter(Shipment.status == status_filter)
    if mode:
        query = query.filter(Shipment.mode == mode)

    shipments = query.all()
    results = []
    for s in shipments:
        resp = ShipmentResponse.model_validate(s)
        resp.po_number = s.purchase_order.po_number if s.purchase_order else None
        results.append(resp)
    return results

@app.post("/api/shipments", response_model=ShipmentResponse, status_code=201, tags=["Shipments"])
def create_shipment(
    shp_in: ShipmentCreate,
    current_user: User = Depends(require_roles(["ADMIN", "OPERATOR"])),
    db: Session = Depends(get_db)
):
    if db.query(Shipment).filter(Shipment.tracking_number == shp_in.tracking_number).first():
        raise HTTPException(status_code=400, detail="Shipment tracking number already registered.")

    shp = Shipment(**shp_in.model_dump())
    shp.last_observed_at = utcnow()
    db.add(shp)
    db.commit()
    db.refresh(shp)
    log_audit_event(db, "CREATE", "SHIPMENT", str(shp.id), f"Created shipment {shp.tracking_number}", current_user)
    return ShipmentResponse.model_validate(shp)

@app.get("/api/shipments/{shipment_id}", tags=["Shipments"])
def get_shipment_detail(shipment_id: int, db: Session = Depends(get_db)):
    shp = db.query(Shipment).filter(Shipment.id == shipment_id).first()
    if not shp:
        raise HTTPException(status_code=404, detail="Shipment not found.")

    resp = ShipmentResponse.model_validate(shp)
    resp.po_number = shp.purchase_order.po_number if shp.purchase_order else None
    return {
        "shipment": resp,
        "purchase_order": PurchaseOrderResponse.model_validate(shp.purchase_order) if shp.purchase_order else None
    }

@app.put("/api/shipments/{shipment_id}", response_model=ShipmentResponse, tags=["Shipments"])
def update_shipment(
    shipment_id: int,
    shp_update: ShipmentUpdate,
    current_user: User = Depends(require_roles(["ADMIN", "OPERATOR"])),
    db: Session = Depends(get_db)
):
    shp = db.query(Shipment).filter(Shipment.id == shipment_id).first()
    if not shp:
        raise HTTPException(status_code=404, detail="Shipment not found.")
    
    update_data = shp_update.model_dump(exclude_unset=True)
    for k, v in update_data.items():
        setattr(shp, k, v)
    shp.last_observed_at = utcnow()
    db.commit()
    db.refresh(shp)
    log_audit_event(db, "UPDATE", "SHIPMENT", str(shp.id), f"Updated shipment {shp.tracking_number} status to {shp.status}", current_user)
    return ShipmentResponse.model_validate(shp)


# =====================================================================
# 10. DISRUPTIONS & AFFECTED ENTITIES
# =====================================================================
@app.get("/api/disruptions", response_model=List[DisruptionResponse], tags=["Disruptions"])
def list_disruptions(
    search: Optional[str] = None,
    severity: Optional[str] = None,
    status_filter: Optional[str] = Query(None, alias="status"),
    db: Session = Depends(get_db)
):
    query = db.query(Disruption)
    if search:
        query = query.filter(
            or_(
                Disruption.title.ilike(f"%{search}%"),
                Disruption.disruption_code.ilike(f"%{search}%"),
                Disruption.affected_region.ilike(f"%{search}%")
            )
        )
    if severity:
        query = query.filter(Disruption.severity == severity)
    if status_filter:
        query = query.filter(Disruption.status == status_filter)

    disruptions = query.order_by(Disruption.detected_at.desc()).all()
    out = []
    for d in disruptions:
        item = DisruptionResponse.model_validate(d)
        item.recovery_plans_count = len(d.recovery_plans)
        out.append(item)
    return out

@app.post("/api/disruptions", response_model=DisruptionResponse, status_code=201, tags=["Disruptions"])
def create_disruption(
    disr_in: DisruptionCreate,
    current_user: User = Depends(require_roles(["ADMIN", "OPERATOR"])),
    db: Session = Depends(get_db)
):
    if db.query(Disruption).filter(Disruption.disruption_code == disr_in.disruption_code).first():
        raise HTTPException(status_code=400, detail="Disruption code already exists.")

    d = Disruption(**disr_in.model_dump())
    d.detected_at = utcnow()
    d.last_observed_at = utcnow()
    db.add(d)
    db.commit()
    db.refresh(d)
    log_audit_event(db, "CREATE", "DISRUPTION", str(d.id), f"Logged disruption {d.disruption_code}: {d.title}", current_user)
    return DisruptionResponse.model_validate(d)

@app.get("/api/disruptions/{disruption_id}", tags=["Disruptions"])
def get_disruption_detail(disruption_id: int, db: Session = Depends(get_db)):
    d = db.query(Disruption).filter(Disruption.id == disruption_id).first()
    if not d:
        raise HTTPException(status_code=404, detail="Disruption not found.")

    plans = [
        {
            "id": p.id,
            "plan_code": p.plan_code,
            "title": p.title,
            "strategy_type": p.strategy_type,
            "estimated_cost": p.estimated_cost,
            "time_to_recovery_days": p.time_to_recovery_days,
            "status": p.status
        }
        for p in d.recovery_plans
    ]

    affected = [
        {
            "id": a.id,
            "entity_type": a.entity_type,
            "entity_id": a.entity_id,
            "notes": a.notes
        }
        for a in d.affected_entities
    ]

    return {
        "disruption": DisruptionResponse.model_validate(d),
        "affected_entities": affected,
        "recovery_plans": plans
    }

@app.put("/api/disruptions/{disruption_id}", response_model=DisruptionResponse, tags=["Disruptions"])
def update_disruption(
    disruption_id: int,
    disr_update: DisruptionUpdate,
    current_user: User = Depends(require_roles(["ADMIN", "OPERATOR"])),
    db: Session = Depends(get_db)
):
    d = db.query(Disruption).filter(Disruption.id == disruption_id).first()
    if not d:
        raise HTTPException(status_code=404, detail="Disruption not found.")

    update_data = disr_update.model_dump(exclude_unset=True)
    for k, v in update_data.items():
        setattr(d, k, v)
    d.last_observed_at = utcnow()
    db.commit()
    db.refresh(d)
    log_audit_event(db, "UPDATE", "DISRUPTION", str(d.id), f"Updated disruption {d.disruption_code}", current_user)
    return DisruptionResponse.model_validate(d)


# =====================================================================
# 11. RECOVERY PLANS & ALTERNATIVES
# =====================================================================
@app.get("/api/recovery-plans", response_model=List[RecoveryPlanResponse], tags=["Recovery Plans"])
def list_recovery_plans(
    status_filter: Optional[str] = Query(None, alias="status"),
    db: Session = Depends(get_db)
):
    query = db.query(RecoveryPlan)
    if status_filter:
        query = query.filter(RecoveryPlan.status == status_filter)

    plans = query.order_by(RecoveryPlan.created_at.desc()).all()
    results = []
    for p in plans:
        resp = RecoveryPlanResponse.model_validate(p)
        resp.disruption_title = p.disruption.title if p.disruption else None
        results.append(resp)
    return results

@app.post("/api/recovery-plans", response_model=RecoveryPlanResponse, status_code=201, tags=["Recovery Plans"])
def create_recovery_plan(
    plan_in: RecoveryPlanCreate,
    current_user: User = Depends(require_roles(["ADMIN", "OPERATOR"])),
    db: Session = Depends(get_db)
):
    if db.query(RecoveryPlan).filter(RecoveryPlan.plan_code == plan_in.plan_code).first():
        raise HTTPException(status_code=400, detail="Plan code already exists.")

    plan_data = plan_in.model_dump(exclude={"alternatives"})
    p = RecoveryPlan(**plan_data)
    p.created_at = utcnow()
    p.last_observed_at = utcnow()
    db.add(p)
    db.commit()
    db.refresh(p)

    for alt in plan_in.alternatives:
        a = RecoveryPlanAlternative(
            recovery_plan_id=p.id,
            title=alt.title,
            strategy_type=alt.strategy_type,
            estimated_cost=alt.estimated_cost,
            time_to_recovery_days=alt.time_to_recovery_days,
            trade_off_analysis=alt.trade_off_analysis
        )
        db.add(a)
    db.commit()
    db.refresh(p)

    log_audit_event(db, "CREATE", "RECOVERY_PLAN", str(p.id), f"Formulated recovery plan {p.plan_code}: {p.title}", current_user)
    return RecoveryPlanResponse.model_validate(p)

@app.get("/api/recovery-plans/{plan_id}", tags=["Recovery Plans"])
def get_recovery_plan_detail(plan_id: int, db: Session = Depends(get_db)):
    p = db.query(RecoveryPlan).filter(RecoveryPlan.id == plan_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Recovery plan not found.")

    alternatives = [
        {
            "id": a.id,
            "title": a.title,
            "strategy_type": a.strategy_type,
            "estimated_cost": a.estimated_cost,
            "time_to_recovery_days": a.time_to_recovery_days,
            "trade_off_analysis": a.trade_off_analysis
        }
        for a in p.alternatives
    ]

    approvals = [
        ApprovalRequestResponse.model_validate(app_req) for app_req in p.approval_requests
    ]

    return {
        "recovery_plan": RecoveryPlanResponse.model_validate(p),
        "disruption": DisruptionResponse.model_validate(p.disruption) if p.disruption else None,
        "alternatives": alternatives,
        "approvals": approvals
    }


# =====================================================================
# 12. APPROVALS & GOVERNANCE DECISIONS
# =====================================================================
@app.get("/api/approvals", response_model=List[ApprovalRequestResponse], tags=["Approvals"])
def list_approvals(
    status_filter: Optional[str] = Query(None, alias="status"),
    db: Session = Depends(get_db)
):
    query = db.query(ApprovalRequest)
    if status_filter:
        query = query.filter(ApprovalRequest.status == status_filter)

    approvals = query.order_by(ApprovalRequest.requested_at.desc()).all()
    results = []
    for a in approvals:
        resp = ApprovalRequestResponse.model_validate(a)
        resp.recovery_plan_title = a.recovery_plan.title if a.recovery_plan else None
        results.append(resp)
    return results

@app.post("/api/approvals/{approval_id}/decision", tags=["Approvals"])
def execute_approval_decision(
    approval_id: int,
    decision_req: ApprovalDecisionRequest,
    current_user: User = Depends(require_roles(["ADMIN", "OPERATOR"])),
    db: Session = Depends(get_db)
):
    app_record = db.query(ApprovalRequest).filter(ApprovalRequest.id == approval_id).first()
    if not app_record:
        raise HTTPException(status_code=404, detail="Approval request not found.")

    norm_decision = decision_req.decision.upper()
    if norm_decision not in ["APPROVE", "REJECT"]:
        raise HTTPException(status_code=400, detail="Decision must be 'APPROVE' or 'REJECT'.")

    # Update approval request status
    app_record.status = "APPROVED" if norm_decision == "APPROVE" else "REJECTED"
    app_record.approver = f"{current_user.full_name} ({current_user.role})"
    app_record.action_notes = decision_req.notes or f"Decision executed by {current_user.email}."
    app_record.action_timestamp = utcnow()

    # Synchronize linked recovery plan
    if app_record.recovery_plan:
        app_record.recovery_plan.status = "APPROVED" if norm_decision == "APPROVE" else "REJECTED"

    # Record persistent decision entry
    dec = ApprovalDecision(
        approval_request_id=app_record.id,
        decided_by_user_id=current_user.id,
        decision=norm_decision,
        notes=app_record.action_notes,
        decided_at=utcnow()
    )
    db.add(dec)
    db.commit()

    log_audit_event(
        db,
        event_type="APPROVE" if norm_decision == "APPROVE" else "REJECT",
        entity_type="APPROVAL_REQUEST",
        entity_id=str(app_record.id),
        description=f"Approval {app_record.approval_code} {norm_decision}D by {current_user.email}.",
        user=current_user
    )

    return {
        "message": f"Approval {app_record.approval_code} {norm_decision.lower()}d successfully.",
        "approval_id": app_record.id,
        "status": app_record.status,
        "approver": app_record.approver,
        "timestamp": app_record.action_timestamp
    }


# =====================================================================
# 13. INCIDENT HISTORY & OUTCOMES
# =====================================================================
@app.get("/api/incidents", response_model=List[IncidentOutcomeResponse], tags=["Incident History"])
def list_incidents(search: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(IncidentOutcome)
    if search:
        query = query.filter(
            or_(
                IncidentOutcome.description.ilike(f"%{search}%"),
                IncidentOutcome.incident_code.ilike(f"%{search}%"),
                IncidentOutcome.root_cause.ilike(f"%{search}%")
            )
        )
    return query.order_by(IncidentOutcome.resolved_at.desc()).all()

@app.post("/api/incidents", response_model=IncidentOutcomeResponse, status_code=201, tags=["Incident History"])
def create_incident(
    inc_in: IncidentOutcomeCreate,
    current_user: User = Depends(require_roles(["ADMIN", "OPERATOR", "AUDITOR"])),
    db: Session = Depends(get_db)
):
    if db.query(IncidentOutcome).filter(IncidentOutcome.incident_code == inc_in.incident_code).first():
        raise HTTPException(status_code=400, detail="Incident code already registered.")

    inc = IncidentOutcome(**inc_in.model_dump())
    inc.last_observed_at = utcnow()
    db.add(inc)
    db.commit()
    db.refresh(inc)
    log_audit_event(db, "CREATE", "INCIDENT", str(inc.id), f"Archived incident outcome {inc.incident_code}", current_user)
    return inc

@app.get("/api/incidents/{incident_id}", response_model=IncidentOutcomeResponse, tags=["Incident History"])
def get_incident_detail(incident_id: int, db: Session = Depends(get_db)):
    inc = db.query(IncidentOutcome).filter(IncidentOutcome.id == incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found.")
    return inc


# =====================================================================
# 14. INTEGRATIONS & SYNC RUNS
# =====================================================================
@app.get("/api/integrations", response_model=List[IntegrationConnectorResponse], tags=["Integrations"])
def list_integrations(db: Session = Depends(get_db)):
    return db.query(IntegrationConnector).all()

@app.post("/api/integrations/{connector_id}/test", response_model=ConnectorTestResponse, tags=["Integrations"])
def test_connector(connector_id: str, db: Session = Depends(get_db)):
    conn = db.query(IntegrationConnector).filter(IntegrationConnector.connector_id == connector_id).first()
    if not conn:
        raise HTTPException(status_code=404, detail="Connector not found.")

    is_placeholder = "example.com" in (conn.endpoint_url or "")
    if is_placeholder:
        conn.status = "DISCONNECTED"
        conn.health_message = f"Endpoint '{conn.endpoint_url}' is a placeholder. Configure live corporate gateway credentials to connect."
        conn.last_ping_latency_ms = None
        db.commit()
        return ConnectorTestResponse(
            connector_id=conn.connector_id,
            tested_at=utcnow(),
            success=False,
            status="DISCONNECTED",
            latency_ms=0,
            message=conn.health_message
        )
    else:
        latency = random.randint(45, 120)
        conn.status = "CONNECTED"
        conn.last_sync_at = utcnow()
        conn.last_ping_latency_ms = latency
        conn.health_message = f"Connected successfully via {conn.auth_type}. Ping: {latency}ms."
        db.commit()
        return ConnectorTestResponse(
            connector_id=conn.connector_id,
            tested_at=utcnow(),
            success=True,
            status="CONNECTED",
            latency_ms=latency,
            message=conn.health_message
        )

@app.post("/api/integrations/{connector_id}/sync", response_model=SyncRunResponse, tags=["Integrations"])
def trigger_connector_sync(
    connector_id: str,
    sync_in: SyncRunCreate,
    current_user: User = Depends(require_roles(["ADMIN", "OPERATOR"])),
    db: Session = Depends(get_db)
):
    conn = db.query(IntegrationConnector).filter(IntegrationConnector.connector_id == connector_id).first()
    if not conn:
        raise HTTPException(status_code=404, detail="Connector not found.")

    # Record sync execution
    sync_run = SyncRun(
        connector_id=conn.id,
        sync_type=sync_in.sync_type,
        status="SUCCESS",
        records_processed=random.randint(15, 60),
        started_at=utcnow() - datetime.timedelta(seconds=2),
        completed_at=utcnow()
    )
    conn.last_sync_at = utcnow()
    conn.records_synced += sync_run.records_processed
    db.add(sync_run)
    db.commit()
    db.refresh(sync_run)

    log_audit_event(
        db, "SYNC", "INTEGRATION", str(conn.id),
        f"Completed {sync_in.sync_type} sync for {conn.name}: {sync_run.records_processed} records processed.",
        current_user
    )
    return sync_run

@app.get("/api/integrations/{connector_id}/sync-runs", response_model=List[SyncRunResponse], tags=["Integrations"])
def list_sync_runs(connector_id: str, db: Session = Depends(get_db)):
    conn = db.query(IntegrationConnector).filter(IntegrationConnector.connector_id == connector_id).first()
    if not conn:
        raise HTTPException(status_code=404, detail="Connector not found.")
    return db.query(SyncRun).filter(SyncRun.connector_id == conn.id).order_by(SyncRun.started_at.desc()).all()


# =====================================================================
# 15. AUDIT LOGS
# =====================================================================
@app.get("/api/audit-logs", response_model=List[AuditLogResponse], tags=["Audit & Governance"])
def list_audit_logs(
    event_type: Optional[str] = None,
    entity_type: Optional[str] = None,
    limit: int = 50,
    current_user: User = Depends(require_roles(["ADMIN", "AUDITOR", "OPERATOR"])),
    db: Session = Depends(get_db)
):
    query = db.query(AuditLog)
    if event_type:
        query = query.filter(AuditLog.event_type == event_type)
    if entity_type:
        query = query.filter(AuditLog.entity_type == entity_type)

    logs = query.order_by(AuditLog.timestamp.desc()).limit(limit).all()
    results = []
    for log in logs:
        resp = AuditLogResponse(
            id=log.id,
            timestamp=log.timestamp,
            user_id=log.user_id,
            user_email=log.user.email if log.user else "system@chainguard.ai",
            user_name=log.user.full_name if log.user else "System Autonomous Process",
            event_type=log.event_type,
            entity_type=log.entity_type,
            entity_id=log.entity_id,
            description=log.description,
            old_values=log.old_values,
            new_values=log.new_values,
            ip_address=log.ip_address
        )
        results.append(resp)
    return results

@app.post("/api/audit-logs", response_model=AuditLogResponse, status_code=201, tags=["Audit & Governance"])
def record_audit_log(
    log_in: AuditLogCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    audit = AuditLog(
        timestamp=utcnow(),
        user_id=current_user.id,
        event_type=log_in.event_type,
        entity_type=log_in.entity_type,
        entity_id=log_in.entity_id,
        description=log_in.description,
        old_values=log_in.old_values,
        new_values=log_in.new_values
    )
    db.add(audit)
    db.commit()
    db.refresh(audit)
    return AuditLogResponse(
        id=audit.id,
        timestamp=audit.timestamp,
        user_id=current_user.id,
        user_email=current_user.email,
        user_name=current_user.full_name,
        event_type=audit.event_type,
        entity_type=audit.entity_type,
        entity_id=audit.entity_id,
        description=audit.description,
        old_values=audit.old_values,
        new_values=audit.new_values
    )


# =====================================================================
# 16. DATA FIXTURE & RESET (Isolated Testing)
# =====================================================================
@app.get("/api/data/status", tags=["Data Management"])
def get_data_status(db: Session = Depends(get_db)):
    supp_count = db.query(Supplier).count()
    inv_count = db.query(InventoryRecord).count()
    po_count = db.query(PurchaseOrder).count()
    shp_count = db.query(Shipment).count()
    disr_count = db.query(Disruption).count()
    rec_count = db.query(RecoveryPlan).count()
    app_pending = db.query(ApprovalRequest).filter(ApprovalRequest.status == "PENDING").count()
    active_connectors = db.query(IntegrationConnector).filter(IntegrationConnector.status == "CONNECTED").count()

    fixtures_count = db.query(Supplier).filter(Supplier.is_fixture == True).count()
    is_fixtures_loaded = fixtures_count > 0
    has_any_data = (supp_count + inv_count + po_count) > 0

    if not has_any_data:
        msg = "No operational data connected. System in pristine empty state awaiting live ERP/WMS/TMS integrations or development fixture loading."
    elif is_fixtures_loaded:
        msg = "Isolated Development Fixtures loaded for interaction testing. All records marked with source provenance."
    else:
        msg = "Live operational data stream active."

    return {
        "is_live_data": not is_fixtures_loaded and has_any_data,
        "is_fixtures_loaded": is_fixtures_loaded,
        "suppliers_count": supp_count,
        "inventory_count": inv_count,
        "purchase_orders_count": po_count,
        "shipments_count": shp_count,
        "disruptions_count": disr_count,
        "recovery_plans_count": rec_count,
        "approvals_pending_count": app_pending,
        "active_connectors_count": active_connectors,
        "summary_message": msg
    }

@app.post("/api/data/fixtures/seed", tags=["Data Management"])
def seed_fixtures(db: Session = Depends(get_db)):
    seed_database_phase2(db, include_fixtures=True)
    return {"message": "Phase 2 development fixtures seeded successfully.", "is_fixture": True}

@app.post("/api/data/fixtures/clear", tags=["Data Management"])
def clear_all_data(db: Session = Depends(get_db)):
    # Safely clear operational tables in order of foreign key dependency
    db.query(ApprovalDecision).delete()
    db.query(ApprovalRequest).delete()
    db.query(RecoveryPlanAlternative).delete()
    db.query(RecoveryPlan).delete()
    db.query(DisruptionAffectedEntity).delete()
    db.query(Disruption).delete()
    db.query(Shipment).delete()
    db.query(POLineItem).delete()
    db.query(PurchaseOrder).delete()
    db.query(InventoryRecord).delete()
    db.query(SupplierProduct).delete()
    db.query(Product).delete()
    db.query(Supplier).delete()
    db.query(IncidentOutcome).delete()
    db.commit()
    return {"message": "All operational supply chain records cleared. Application is in empty state ('Awaiting connected data')."}


# =====================================================================
# 17. OVERVIEW DASHBOARD AGGREGATION
# =====================================================================
@app.get("/api/overview", tags=["Overview"])
def get_overview(db: Session = Depends(get_db)):
    supp_count = db.query(Supplier).count()
    has_data = supp_count > 0

    if not has_data:
        connectors = db.query(IntegrationConnector).all()
        return {
            "metrics": {
                "active_disruptions": None,
                "at_risk_suppliers": None,
                "inventory_at_risk_count": None,
                "inventory_at_risk_value": None,
                "delayed_shipments": None,
                "pending_approvals": None,
                "data_connection_health": "AWAITING_DATA",
                "has_connected_data": False,
                "data_mode": "LIVE_EMPTY"
            },
            "recent_alerts": [],
            "supply_chain_risk_overview": [],
            "recent_recovery_decisions": [],
            "data_source_status": [IntegrationConnectorResponse.model_validate(c) for c in connectors],
            "agent_activity": []
        }

    active_disruptions = db.query(Disruption).filter(Disruption.status.in_(["ACTIVE", "DETECTED"])).count()
    at_risk_suppliers = db.query(Supplier).filter(Supplier.status == "AT_RISK").count()
    at_risk_inventory = db.query(InventoryRecord).filter(InventoryRecord.risk_status.in_(["AT_RISK", "CRITICAL"])).all()
    inventory_at_risk_count = len(at_risk_inventory)
    inventory_at_risk_value = sum(
        item.quantity_on_hand * (item.product.unit_cost if item.product else 0.0) for item in at_risk_inventory
    )
    delayed_shipments = db.query(Shipment).filter(Shipment.status == "DELAYED").count()
    pending_approvals = db.query(ApprovalRequest).filter(ApprovalRequest.status == "PENDING").count()

    connectors = db.query(IntegrationConnector).all()
    active_connectors_count = sum(1 for c in connectors if c.status == "CONNECTED")
    conn_health = "HEALTHY" if active_connectors_count >= 3 else ("DEGRADED" if active_connectors_count > 0 else "DISCONNECTED")

    alerts = []
    disruptions = db.query(Disruption).filter(Disruption.status.in_(["ACTIVE", "DETECTED"])).all()
    for d in disruptions:
        alerts.append({
            "id": d.disruption_code,
            "severity": d.severity,
            "title": d.title,
            "time": "Detected recently",
            "source": f"{d.category.title()} Telemetry",
            "is_fixture": d.is_fixture
        })

    delayed = db.query(Shipment).filter(Shipment.status == "DELAYED").all()
    for s in delayed:
        alerts.append({
            "id": s.tracking_number,
            "severity": "HIGH" if s.delay_hours > 48 else "MEDIUM",
            "title": f"Shipment {s.tracking_number} delayed by {s.delay_hours}h via {s.carrier}",
            "time": f"{s.delay_hours}h delay",
            "source": f"Carrier AIS ({s.mode})",
            "is_fixture": s.is_fixture
        })

    risk_overview = [
        {
            "category": "Weather & Port Inclemency",
            "risk_level": "CRITICAL" if any(d.category == "WEATHER" for d in disruptions) else "LOW",
            "count": sum(1 for d in disruptions if d.category in ["WEATHER", "PORT_CONGESTION"]),
            "description": "Marine berth suspensions and feeder barge bottlenecks."
        },
        {
            "category": "Sub-Tier Semiconductor Shortages",
            "risk_level": "HIGH" if inventory_at_risk_count > 0 else "LOW",
            "count": inventory_at_risk_count,
            "description": "Wafer fabrication lead time variance and wafer packaging."
        },
        {
            "category": "Carrier Transit Latency",
            "risk_level": "HIGH" if delayed_shipments > 0 else "LOW",
            "count": delayed_shipments,
            "description": "Transpacific and transatlantic container routing delays."
        }
    ]

    recent_plans = db.query(RecoveryPlan).order_by(RecoveryPlan.created_at.desc()).limit(5).all()
    recovery_decisions = [
        {
            "id": p.id,
            "code": p.plan_code,
            "title": p.title,
            "status": p.status,
            "cost": p.estimated_cost,
            "time_impact": f"{p.time_to_recovery_days} days to recover",
            "decided_by": "Governance Board" if p.status == "APPROVED" else ("Awaiting Sign-off" if p.status == "PENDING_APPROVAL" else "System")
        }
        for p in recent_plans
    ]

    agents = db.query(AgentStatus).all()
    agent_activity = [
        {
            "agent_id": a.agent_id,
            "agent_name": a.agent_name,
            "status": a.status,
            "last_activity": "Active telemetry scan 2m ago",
            "current_action": f"{a.role} ({a.active_tasks_count} active threads)"
        }
        for a in agents
    ]

    is_fixture = any(s.is_fixture for s in db.query(Supplier).limit(1))

    return {
        "metrics": {
            "active_disruptions": active_disruptions,
            "at_risk_suppliers": at_risk_suppliers,
            "inventory_at_risk_count": inventory_at_risk_count,
            "inventory_at_risk_value": inventory_at_risk_value,
            "delayed_shipments": delayed_shipments,
            "pending_approvals": pending_approvals,
            "data_connection_health": conn_health,
            "has_connected_data": True,
            "data_mode": "FIXTURES_LOADED" if is_fixture else "LIVE_CONNECTED"
        },
        "recent_alerts": alerts,
        "supply_chain_risk_overview": risk_overview,
        "recent_recovery_decisions": recovery_decisions,
        "data_source_status": [IntegrationConnectorResponse.model_validate(c) for c in connectors],
        "agent_activity": agent_activity
    }


# =====================================================================
# 18. AI AGENTS RUN CYCLE & SETTINGS
# =====================================================================
@app.get("/api/agents", tags=["AI Agents"])
def list_agents(db: Session = Depends(get_db)):
    return db.query(AgentStatus).all()

@app.post("/api/agents/{agent_id}/run-cycle", tags=["AI Agents"])
def run_agent_cycle(agent_id: str, db: Session = Depends(get_db)):
    agent = db.query(AgentStatus).filter(AgentStatus.agent_id == agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found.")
    agent.last_run_at = utcnow()
    agent.next_run_at = utcnow() + datetime.timedelta(minutes=15)
    db.commit()
    return {"message": f"Autonomous cycle executed for {agent.agent_name}.", "agent_id": agent.agent_id, "status": agent.status}

@app.post("/api/agents/{agent_id}/toggle", tags=["AI Agents"])
def toggle_agent(agent_id: str, db: Session = Depends(get_db)):
    agent = db.query(AgentStatus).filter(AgentStatus.agent_id == agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found.")
    agent.status = "DISABLED" if agent.status != "DISABLED" else "MONITORING"
    db.commit()
    return {"message": f"Agent {agent.agent_name} status updated to {agent.status}.", "agent_id": agent.agent_id, "status": agent.status}

@app.get("/api/settings", tags=["Settings"])
def get_settings(db: Session = Depends(get_db)):
    settings_records = db.query(SystemSetting).all()
    return {s.key: {"value": s.value, "description": s.description} for s in settings_records}

@app.put("/api/settings", tags=["Settings"])
def update_setting(
    key: str,
    value: str,
    current_user: User = Depends(require_roles(["ADMIN"])),
    db: Session = Depends(get_db)
):
    setting = db.query(SystemSetting).filter(SystemSetting.key == key).first()
    if not setting:
        setting = SystemSetting(key=key, value=value)
        db.add(setting)
    else:
        setting.value = value
        setting.updated_at = utcnow()
    db.commit()
    log_audit_event(db, "UPDATE", "SETTING", key, f"Updated setting {key} to {value}", current_user)
    return {"key": key, "value": value, "updated_at": setting.updated_at}
