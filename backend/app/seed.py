import datetime
from sqlalchemy.orm import Session
from app.auth import get_password_hash, init_bootstrap_users
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

def utcnow():
    return datetime.datetime.now(datetime.timezone.utc)

def seed_database_phase2(db: Session, include_fixtures: bool = True):
    """
    Initializes Phase 2 database:
    1. Bootstrap users with hashed passwords
    2. Enterprise Facilities
    3. Integration Connectors
    4. System Policies & Settings
    5. AI Agents
    6. Isolated Development Fixtures (if include_fixtures is True)
    """
    # 1. Bootstrap users
    init_bootstrap_users(db)
    admin_user = db.query(User).filter(User.role == "ADMIN").first()

    # 2. Facilities
    facilities = [
        Facility(
            facility_code="FAC-AUSTIN-04",
            name="Austin Assembly Plant & Distribution WH-04",
            facility_type="PLANT",
            country="United States",
            city="Austin, TX",
            address="1200 Innovation Blvd, Austin, TX 78728",
            capacity_units=85000,
            is_active=True
        ),
        Facility(
            facility_code="FAC-MUNICH-02",
            name="Munich Strategic Buffer Depot WH-02",
            facility_type="WAREHOUSE",
            country="Germany",
            city="Munich",
            address="Logistics Park Ost 4, 85551 Kirchheim",
            capacity_units=60000,
            is_active=True
        ),
        Facility(
            facility_code="FAC-DETROIT-01",
            name="Detroit Regional Assembly Staging Hub",
            facility_type="DISTRIBUTION_CENTER",
            country="United States",
            city="Detroit, MI",
            address="4500 Terminal Parkway, Detroit, MI 48209",
            capacity_units=45000,
            is_active=True
        )
    ]
    for f in facilities:
        if not db.query(Facility).filter_by(facility_code=f.facility_code).first():
            db.add(f)
    db.commit()

    austin = db.query(Facility).filter_by(facility_code="FAC-AUSTIN-04").first()
    munich = db.query(Facility).filter_by(facility_code="FAC-MUNICH-02").first()
    detroit = db.query(Facility).filter_by(facility_code="FAC-DETROIT-01").first()

    # 3. Connectors
    connectors = [
        IntegrationConnector(
            connector_id="conn-sap-s4hana",
            name="SAP S/4HANA ERP Gateway",
            system_type="SAP_S4HANA",
            endpoint_url="https://sap-gateway.enterprise.example.com/sap/opu/odata4/sap/purchaseorders/v0001",
            status="DISCONNECTED",
            auth_type="OAuth 2.0 (mTLS)",
            health_message="Awaiting credential setup and connection test",
            records_synced=0,
            is_fixture=False
        ),
        IntegrationConnector(
            connector_id="conn-oracle-netsuite",
            name="Oracle NetSuite Supply Planning",
            system_type="ORACLE_NETSUITE",
            endpoint_url="https://rest.netsuite.example.com/services/rest/record/v1",
            status="DISCONNECTED",
            auth_type="Token-Based Auth (TBA)",
            health_message="Token-based authentication unverified",
            records_synced=0,
            is_fixture=False
        ),
        IntegrationConnector(
            connector_id="conn-manhattan-wms",
            name="Manhattan Active WMS",
            system_type="MANHATTAN_WMS",
            endpoint_url="https://wms.manhattan.example.com/api/v1/inventory",
            status="DISCONNECTED",
            auth_type="API Key / HMAC",
            health_message="API Gateway unconfigured; awaiting live warehouse telemetry",
            records_synced=0,
            is_fixture=False
        ),
        IntegrationConnector(
            connector_id="conn-project44-tms",
            name="Project44 Ocean & Air Freight Telemetry",
            system_type="PROJECT44_TMS",
            endpoint_url="https://na12.api.project44.com/v4/shipment-tracking",
            status="DISCONNECTED",
            auth_type="OAuth 2.0 Client Credentials",
            health_message="Carrier EDI/API feed awaiting company account binding",
            records_synced=0,
            is_fixture=False
        ),
        IntegrationConnector(
            connector_id="conn-coupa-ariba",
            name="Coupa / SAP Ariba Procurement Gate",
            system_type="COUPA",
            endpoint_url="https://enterprise.coupahost.com/api/purchase_orders",
            status="DISCONNECTED",
            auth_type="OAuth 2.0 / API Key",
            health_message="Purchase Requisition webhooks disconnected",
            records_synced=0,
            is_fixture=False
        )
    ]
    for c in connectors:
        if not db.query(IntegrationConnector).filter_by(connector_id=c.connector_id).first():
            db.add(c)
    db.commit()

    # 4. Settings
    default_settings = [
        SystemSetting(
            key="approval_financial_threshold_usd",
            value="50000",
            description="Minimum recovery plan expenditure requiring Tier-2 VP sign-off."
        ),
        SystemSetting(
            key="starvation_warning_horizon_days",
            value="14",
            description="Lookahead horizon for projecting plant stockout and starvation events."
        ),
        SystemSetting(
            key="default_telemetry_interval_mins",
            value="15",
            description="External EDI and AIS transponder feed scanning frequency in minutes."
        ),
        SystemSetting(
            key="governance_strict_mode",
            value="true",
            description="Prohibits autonomous ERP execution without explicit user authorization."
        )
    ]
    for s in default_settings:
        if not db.query(SystemSetting).filter_by(key=s.key).first():
            db.add(s)
    db.commit()

    # 5. AI Agents
    agents = [
        AgentStatus(
            agent_id="agent-sentinel",
            agent_name="Sentinel Early Warning Agent",
            role="Monitors multi-tier supply network telemetry, supplier lead times, weather advisories, and marine AIS feeds.",
            status="MONITORING",
            version="v1.2.0",
            active_tasks_count=3,
            description="Continuously correlates telemetry against disruption threshold rules SEC-01 and SEC-04.",
            is_fixture=False
        ),
        AgentStatus(
            agent_id="agent-simulator",
            agent_name="Consequence Simulator Agent",
            role="Projects 14-day multi-plant inventory trajectories, starvation dates, and secondary stockout impacts.",
            status="SIMULATING",
            version="v1.1.4",
            active_tasks_count=2,
            description="Calculates cross-facility inventory bleed rates and downtime cost trade-offs.",
            is_fixture=False
        ),
        AgentStatus(
            agent_id="agent-governance",
            agent_name="Decision Gatekeeper Agent",
            role="Audits supplier capacity, compliance certifications, contractual SLAs, and executive approval thresholds.",
            status="MONITORING",
            version="v1.0.8",
            active_tasks_count=1,
            description="Enforces strict deterministic governance gate before any financial commitments are logged.",
            is_fixture=False
        )
    ]
    for a in agents:
        if not db.query(AgentStatus).filter_by(agent_id=a.agent_id).first():
            db.add(a)
    db.commit()

    # 6. Fixtures if requested
    if include_fixtures:
        seed_fixtures_phase2(db, austin, munich, detroit, admin_user)

    # Initial Audit Log
    db.add(
        AuditLog(
            user_id=admin_user.id if admin_user else None,
            event_type="BOOTSTRAP",
            entity_type="SYSTEM",
            entity_id="ROOT",
            description="Phase 2 normalized database schema and persistent tables initialized."
        )
    )
    db.commit()


def seed_fixtures_phase2(db: Session, austin: Facility, munich: Facility, detroit: Facility, admin_user: User):
    """Populates normalized fixtures across suppliers, products, inventory, POs, and disruptions."""
    now = utcnow()

    # Suppliers
    suppliers = [
        Supplier(
            supplier_code="SUP-TSMC-01",
            name="TSMC Fab 18 Advanced Silicon",
            tier=1,
            status="AT_RISK",
            risk_score=78.5,
            country="Taiwan",
            lead_time_days=42,
            on_time_delivery_rate=91.2,
            contact_email="b2b-resilience@tsmc.example.com",
            critical_components="5nm / 7nm Automotive High-Compute Microcontrollers",
            source_connector="SAP_S4HANA",
            source_record_id="SAP-VEND-10042",
            last_observed_at=now,
            provenance_status="VERIFIED",
            is_fixture=True
        ),
        Supplier(
            supplier_code="SUP-INFINEON-02",
            name="Infineon Power Systems Fab",
            tier=2,
            status="ACTIVE",
            risk_score=24.0,
            country="Germany",
            lead_time_days=21,
            on_time_delivery_rate=98.1,
            contact_email="supply-coordination@infineon.example.com",
            critical_components="Silicon Carbide (SiC) MOSFETs, Power Regulators",
            source_connector="SAP_S4HANA",
            source_record_id="SAP-VEND-10088",
            last_observed_at=now,
            provenance_status="VERIFIED",
            is_fixture=True
        ),
        Supplier(
            supplier_code="SUP-MURATA-03",
            name="Murata Electronic Components",
            tier=1,
            status="ACTIVE",
            risk_score=15.0,
            country="Japan",
            lead_time_days=14,
            on_time_delivery_rate=99.4,
            contact_email="global-orders@murata.example.com",
            critical_components="High-Q MLCC Capacitors, EMI Filters",
            source_connector="COUPA",
            source_record_id="COUPA-SUP-290",
            last_observed_at=now,
            provenance_status="VERIFIED",
            is_fixture=True
        ),
        Supplier(
            supplier_code="SUP-BOSCH-04",
            name="Bosch Sensor Tech GmbH",
            tier=2,
            status="AT_RISK",
            risk_score=62.0,
            country="Germany",
            lead_time_days=28,
            on_time_delivery_rate=88.7,
            contact_email="automotive-sensor-ops@bosch.example.com",
            critical_components="MEMS Accelerometers, Radar Transceiver ASICs",
            source_connector="SAP_S4HANA",
            source_record_id="SAP-VEND-10114",
            last_observed_at=now,
            provenance_status="VERIFIED",
            is_fixture=True
        ),
        Supplier(
            supplier_code="SUP-FOXCONN-05",
            name="Foxconn Precision Interconnect",
            tier=1,
            status="ACTIVE",
            risk_score=31.5,
            country="Vietnam",
            lead_time_days=18,
            on_time_delivery_rate=96.0,
            contact_email="supply-chain@foxconn.example.com",
            critical_components="High-Density High-Speed Wire Harnesses",
            source_connector="MANUAL",
            source_record_id="M-VEND-501",
            last_observed_at=now,
            provenance_status="ESTIMATED",
            is_fixture=True
        )
    ]
    for s in suppliers:
        if not db.query(Supplier).filter_by(supplier_code=s.supplier_code).first():
            db.add(s)
    db.commit()

    tsmc = db.query(Supplier).filter_by(supplier_code="SUP-TSMC-01").first()
    infineon = db.query(Supplier).filter_by(supplier_code="SUP-INFINEON-02").first()
    murata = db.query(Supplier).filter_by(supplier_code="SUP-MURATA-03").first()
    bosch = db.query(Supplier).filter_by(supplier_code="SUP-BOSCH-04").first()
    foxconn = db.query(Supplier).filter_by(supplier_code="SUP-FOXCONN-05").first()

    # Products & Materials
    products = [
        Product(
            sku="SKU-MCU-5NM-01",
            name="Automotive Grade 32-bit MCU 5nm",
            category="Semiconductor",
            unit="units",
            unit_cost=185.00,
            criticality="CRITICAL",
            description="ASIL-D compliant vehicle core processor with integrated hardware safety module.",
            source_connector="SAP_S4HANA",
            source_record_id="MAT-1000921",
            provenance_status="VERIFIED",
            is_fixture=True
        ),
        Product(
            sku="SKU-SIC-PWR-02",
            name="Silicon Carbide Power Transistor Module",
            category="Power Electronics",
            unit="units",
            unit_cost=42.50,
            criticality="HIGH",
            description="1200V automotive dual-inverter SiC power module for high-voltage drivetrain.",
            source_connector="SAP_S4HANA",
            source_record_id="MAT-1000925",
            provenance_status="VERIFIED",
            is_fixture=True
        ),
        Product(
            sku="SKU-MLCC-10UF-03",
            name="Automotive MLCC 10uF 50V 0805",
            category="Passive Components",
            unit="reels",
            unit_cost=0.35,
            criticality="HIGH",
            description="AEC-Q200 qualified surface mount ceramic capacitor reel.",
            source_connector="COUPA",
            source_record_id="MAT-300441",
            provenance_status="VERIFIED",
            is_fixture=True
        ),
        Product(
            sku="SKU-MEMS-RADAR-04",
            name="77GHz Millimeter-Wave Radar Sensor",
            category="Sensors",
            unit="units",
            unit_cost=94.00,
            criticality="HIGH",
            description="Long-range collision avoidance front-facing radar transceiver ASIC.",
            source_connector="SAP_S4HANA",
            source_record_id="MAT-1000938",
            provenance_status="VERIFIED",
            is_fixture=True
        ),
        Product(
            sku="SKU-HARNESS-HD-05",
            name="Shielded High-Voltage Vehicle Wiring Harness",
            category="Assemblies",
            unit="sets",
            unit_cost=68.00,
            criticality="MEDIUM",
            description="Pre-routed copper high-amperage shielded wiring assembly with watertight connectors.",
            source_connector="MANUAL",
            source_record_id="MAT-200019",
            provenance_status="ESTIMATED",
            is_fixture=True
        )
    ]
    for p in products:
        if not db.query(Product).filter_by(sku=p.sku).first():
            db.add(p)
    db.commit()

    mcu = db.query(Product).filter_by(sku="SKU-MCU-5NM-01").first()
    sic = db.query(Product).filter_by(sku="SKU-SIC-PWR-02").first()
    mlcc = db.query(Product).filter_by(sku="SKU-MLCC-10UF-03").first()
    radar = db.query(Product).filter_by(sku="SKU-MEMS-RADAR-04").first()
    harness = db.query(Product).filter_by(sku="SKU-HARNESS-HD-05").first()

    # Supplier-Product Links
    sp_links = [
        SupplierProduct(supplier_id=tsmc.id, product_id=mcu.id, is_primary=True, unit_price=185.00, lead_time_days=42),
        SupplierProduct(supplier_id=infineon.id, product_id=sic.id, is_primary=True, unit_price=42.50, lead_time_days=21),
        SupplierProduct(supplier_id=murata.id, product_id=mlcc.id, is_primary=True, unit_price=0.35, lead_time_days=14),
        SupplierProduct(supplier_id=bosch.id, product_id=radar.id, is_primary=True, unit_price=94.00, lead_time_days=28),
        SupplierProduct(supplier_id=foxconn.id, product_id=harness.id, is_primary=True, unit_price=68.00, lead_time_days=18),
        # Secondary source alternative
        SupplierProduct(supplier_id=murata.id, product_id=mcu.id, is_primary=False, unit_price=198.00, lead_time_days=28, contract_reference="BACKUP-SUB-09")
    ]
    for link in sp_links:
        existing = db.query(SupplierProduct).filter_by(supplier_id=link.supplier_id, product_id=link.product_id).first()
        if not existing:
            db.add(link)
    db.commit()

    # Inventory Records
    inv_records = [
        InventoryRecord(
            product_id=mcu.id,
            facility_id=austin.id,
            quantity_on_hand=340,
            safety_stock=800,
            reorder_point=1200,
            risk_status="CRITICAL",
            source_connector="MANHATTAN_WMS",
            source_record_id="WMS-LOC-A4-892",
            provenance_status="VERIFIED",
            is_fixture=True
        ),
        InventoryRecord(
            product_id=sic.id,
            facility_id=munich.id,
            quantity_on_hand=2400,
            safety_stock=1500,
            reorder_point=2500,
            risk_status="HEALTHY",
            source_connector="MANHATTAN_WMS",
            source_record_id="WMS-LOC-M2-104",
            provenance_status="VERIFIED",
            is_fixture=True
        ),
        InventoryRecord(
            product_id=mlcc.id,
            facility_id=austin.id,
            quantity_on_hand=14500,
            safety_stock=20000,
            reorder_point=35000,
            risk_status="AT_RISK",
            source_connector="MANHATTAN_WMS",
            source_record_id="WMS-LOC-A4-311",
            provenance_status="VERIFIED",
            is_fixture=True
        ),
        InventoryRecord(
            product_id=radar.id,
            facility_id=detroit.id,
            quantity_on_hand=620,
            safety_stock=1000,
            reorder_point=1800,
            risk_status="AT_RISK",
            source_connector="MANHATTAN_WMS",
            source_record_id="WMS-LOC-D1-049",
            provenance_status="VERIFIED",
            is_fixture=True
        ),
        InventoryRecord(
            product_id=harness.id,
            facility_id=detroit.id,
            quantity_on_hand=1800,
            safety_stock=1200,
            reorder_point=2000,
            risk_status="HEALTHY",
            source_connector="MANHATTAN_WMS",
            source_record_id="WMS-LOC-D1-072",
            provenance_status="VERIFIED",
            is_fixture=True
        )
    ]
    for inv in inv_records:
        if not db.query(InventoryRecord).filter_by(product_id=inv.product_id, facility_id=inv.facility_id).first():
            db.add(inv)
    db.commit()

    # Purchase Orders & Line Items
    pos = [
        PurchaseOrder(
            po_number="PO-2026-89210",
            supplier_id=tsmc.id,
            destination_facility_id=austin.id,
            order_date=now - datetime.timedelta(days=25),
            expected_delivery_date=now - datetime.timedelta(days=2),
            status="DELAYED",
            total_amount=185000.00,
            currency="USD",
            notes="Critical wafers delayed due to Taiwan Strait marine typhoon storm rerouting.",
            source_connector="SAP_S4HANA",
            source_record_id="SAP-PO-89210",
            provenance_status="VERIFIED",
            is_fixture=True
        ),
        PurchaseOrder(
            po_number="PO-2026-89211",
            supplier_id=infineon.id,
            destination_facility_id=munich.id,
            order_date=now - datetime.timedelta(days=12),
            expected_delivery_date=now + datetime.timedelta(days=5),
            status="SHIPPED",
            total_amount=51000.00,
            currency="EUR",
            notes="Standard replenishment dispatched via Lufthansa Cargo.",
            source_connector="SAP_S4HANA",
            source_record_id="SAP-PO-89211",
            provenance_status="VERIFIED",
            is_fixture=True
        ),
        PurchaseOrder(
            po_number="PO-2026-89212",
            supplier_id=bosch.id,
            destination_facility_id=detroit.id,
            order_date=now - datetime.timedelta(days=18),
            expected_delivery_date=now + datetime.timedelta(days=1),
            status="DELAYED",
            total_amount=84600.00,
            currency="EUR",
            notes="Sub-tier packaging line maintenance extended lead time.",
            source_connector="SAP_S4HANA",
            source_record_id="SAP-PO-89212",
            provenance_status="VERIFIED",
            is_fixture=True
        ),
        PurchaseOrder(
            po_number="PO-2026-89215",
            supplier_id=murata.id,
            destination_facility_id=austin.id,
            order_date=now - datetime.timedelta(days=30),
            expected_delivery_date=now - datetime.timedelta(days=5),
            actual_delivery_date=now - datetime.timedelta(days=5),
            status="DELIVERED",
            total_amount=24500.00,
            currency="USD",
            notes="Delivered on-time at Austin receiving dock.",
            source_connector="COUPA",
            source_record_id="COUPA-PO-89215",
            provenance_status="VERIFIED",
            is_fixture=True
        )
    ]
    for po in pos:
        if not db.query(PurchaseOrder).filter_by(po_number=po.po_number).first():
            db.add(po)
    db.commit()

    po_tsmc = db.query(PurchaseOrder).filter_by(po_number="PO-2026-89210").first()
    po_inf = db.query(PurchaseOrder).filter_by(po_number="PO-2026-89211").first()
    po_bsh = db.query(PurchaseOrder).filter_by(po_number="PO-2026-89212").first()

    # PO Line items
    if po_tsmc and not po_tsmc.line_items:
        db.add(POLineItem(purchase_order_id=po_tsmc.id, product_id=mcu.id, quantity=1000, unit_price=185.00, total_price=185000.00))
    if po_inf and not po_inf.line_items:
        db.add(POLineItem(purchase_order_id=po_inf.id, product_id=sic.id, quantity=1200, unit_price=42.50, total_price=51000.00))
    if po_bsh and not po_bsh.line_items:
        db.add(POLineItem(purchase_order_id=po_bsh.id, product_id=radar.id, quantity=900, unit_price=94.00, total_price=84600.00))
    db.commit()

    # Shipments
    shipments = [
        Shipment(
            tracking_number="SHP-MSK-9021",
            purchase_order_id=po_tsmc.id if po_tsmc else None,
            origin="Kaohsiung Port, TW",
            destination="Long Beach Port, US",
            carrier="Maersk Line (Maersk Altair)",
            mode="OCEAN",
            status="DELAYED",
            delay_hours=72,
            departed_at=now - datetime.timedelta(days=14),
            estimated_arrival=now + datetime.timedelta(days=4),
            current_location="Mid-Pacific Transit Corridor (Speed reduced for weather evasion)",
            source_connector="PROJECT44_TMS",
            source_record_id="P44-SHP-MSK-9021",
            provenance_status="VERIFIED",
            is_fixture=True
        ),
        Shipment(
            tracking_number="SHP-LH-8210",
            purchase_order_id=po_inf.id if po_inf else None,
            origin="Frankfurt Airport, DE",
            destination="Dallas Fort Worth (DFW), US",
            carrier="Lufthansa Cargo (LH-8210)",
            mode="AIR",
            status="IN_TRANSIT",
            delay_hours=0,
            departed_at=now - datetime.timedelta(hours=18),
            estimated_arrival=now + datetime.timedelta(hours=6),
            current_location="Transatlantic Airspace (ETA on schedule)",
            source_connector="PROJECT44_TMS",
            source_record_id="P44-SHP-LH-8210",
            provenance_status="VERIFIED",
            is_fixture=True
        ),
        Shipment(
            tracking_number="SHP-HAP-4491",
            purchase_order_id=po_bsh.id if po_bsh else None,
            origin="Rotterdam Port, NL",
            destination="New York Harbor, US",
            carrier="Hapag-Lloyd (Express Berlin)",
            mode="OCEAN",
            status="DELAYED",
            delay_hours=48,
            departed_at=now - datetime.timedelta(days=9),
            estimated_arrival=now + datetime.timedelta(days=3),
            current_location="Approaching North Atlantic Sea Lane (Berth hold at arrival)",
            source_connector="PROJECT44_TMS",
            source_record_id="P44-SHP-HAP-4491",
            provenance_status="VERIFIED",
            is_fixture=True
        )
    ]
    for s in shipments:
        if not db.query(Shipment).filter_by(tracking_number=s.tracking_number).first():
            db.add(s)
    db.commit()

    # Disruptions & Affected Entities
    disruptions = [
        Disruption(
            disruption_code="DISR-2026-01",
            title="Taiwan Strait Super Typhoon Early Warning - Port Congestion & Feeder Freeze",
            category="WEATHER",
            severity="CRITICAL",
            status="ACTIVE",
            affected_region="East Asia / Taiwan Strait",
            estimated_loss=375000.00,
            detected_at=now - datetime.timedelta(hours=14),
            summary="Category 4 Super Typhoon 'Gaemi-II' forecast to ground air cargo in Taipei (TPE) and stall Kaohsiung maritime container berthing for 4-5 days.",
            recommended_action="Activate Air-Expedite Protocol from European contingency reserve to safeguard Austin final assembly plant.",
            source_connector="SENTINEL_AI",
            source_record_id="SENT-ALERT-TW-09",
            provenance_status="VERIFIED",
            is_fixture=True
        ),
        Disruption(
            disruption_code="DISR-2026-02",
            title="Rotterdam Port Inland Feeder Barge Congestion & Labor Shortage",
            category="PORT_CONGESTION",
            severity="HIGH",
            status="ACTIVE",
            affected_region="Northern Europe / Benelux",
            estimated_loss=84600.00,
            detected_at=now - datetime.timedelta(hours=36),
            summary="Rhine-Meuse inland barge container interchange experiencing 72-hour dwell time spikes due to crane automation upgrades and seasonal low river water levels.",
            recommended_action="Reroute priority cargo to direct rail shuttle into Antwerp or truck expedite to Frankfurt air hub.",
            source_connector="SENTINEL_AI",
            source_record_id="SENT-ALERT-RT-02",
            provenance_status="VERIFIED",
            is_fixture=True
        )
    ]
    for d in disruptions:
        if not db.query(Disruption).filter_by(disruption_code=d.disruption_code).first():
            db.add(d)
    db.commit()

    disr_tw = db.query(Disruption).filter_by(disruption_code="DISR-2026-01").first()
    disr_rt = db.query(Disruption).filter_by(disruption_code="DISR-2026-02").first()

    if disr_tw and not disr_tw.affected_entities:
        db.add(DisruptionAffectedEntity(disruption_id=disr_tw.id, entity_type="SUPPLIER", entity_id=tsmc.id, notes="Fab 18 wafer output temporarily bottlenecked"))
        db.add(DisruptionAffectedEntity(disruption_id=disr_tw.id, entity_type="PRODUCT", entity_id=mcu.id, notes="Primary automotive microcontroller"))
    if disr_rt and not disr_rt.affected_entities:
        db.add(DisruptionAffectedEntity(disruption_id=disr_rt.id, entity_type="SUPPLIER", entity_id=bosch.id, notes="Sensor container drayage stuck in yard"))
    db.commit()

    # Recovery Plans & Alternatives
    plans = [
        RecoveryPlan(
            plan_code="REC-2026-01",
            disruption_id=disr_tw.id if disr_tw else None,
            title="Strategic Air Expedite from Munich Contingency Buffer to Austin Assembly Plant",
            strategy_type="EXPEDITE",
            estimated_cost=64500.00,
            time_to_recovery_days=3,
            secondary_risk_assessment="Low risk of secondary stockout: Munich hub maintains 14 days of buffer reserve above safety margin.",
            status="PENDING_APPROVAL",
            confidence_score=92.5,
            summary="Bypass Taiwan marine delay by chartering dedicated temperature-controlled air freight from Munich logistics hub, preventing an estimated $420,000 downtime penalty at Austin.",
            execution_steps="1. Issue pick-list at Munich WH-02. 2. Book Lufthansa Cargo slot LH-992. 3. Clear US Customs under pre-filing bond. 4. Deliver directly to Austin line 3.",
            source_connector="CONSEQUENCE_SIMULATOR",
            source_record_id="SIM-PLAN-9901",
            provenance_status="ESTIMATED",
            is_fixture=True
        ),
        RecoveryPlan(
            plan_code="REC-2026-02",
            disruption_id=disr_rt.id if disr_rt else None,
            title="Truck Expedite Shuttle from Rotterdam Terminal to Antwerp Rail Head",
            strategy_type="REROUTE",
            estimated_cost=12800.00,
            time_to_recovery_days=2,
            secondary_risk_assessment="Zero secondary stockout risk; alternative drayage carrier already pre-contracted under SLA Tier-1.",
            status="APPROVED",
            confidence_score=88.0,
            summary="Transfer 4 high-cube containers directly onto dedicated highway drayage tractors to bypass canal congestion.",
            execution_steps="1. Contract 4 dedicated tractors with DHL Freight. 2. Dray containers to Antwerp gate. 3. Load on outbound transatlantic vessel.",
            source_connector="CONSEQUENCE_SIMULATOR",
            source_record_id="SIM-PLAN-9902",
            provenance_status="ESTIMATED",
            is_fixture=True
        )
    ]
    for plan in plans:
        if not db.query(RecoveryPlan).filter_by(plan_code=plan.plan_code).first():
            db.add(plan)
    db.commit()

    plan_exp = db.query(RecoveryPlan).filter_by(plan_code="REC-2026-01").first()
    if plan_exp and not plan_exp.alternatives:
        db.add(
            RecoveryPlanAlternative(
                recovery_plan_id=plan_exp.id,
                title="Secondary Source Production Acceleration via Murata Japan",
                strategy_type="SECOND_SOURCE",
                estimated_cost=89000.00,
                time_to_recovery_days=7,
                trade_off_analysis="Higher cost and 4-day longer lead-time, but preserves European buffer stocks completely."
            )
        )
    db.commit()

    # Approvals & Decisions
    if plan_exp:
        existing_app = db.query(ApprovalRequest).filter_by(approval_code="APP-2026-401").first()
        if not existing_app:
            app_req = ApprovalRequest(
                approval_code="APP-2026-401",
                recovery_plan_id=plan_exp.id,
                title="Executive Authorization: $64,500 Dedicated Air Expedite for Austin MCU Stockout Prevention",
                requested_by="Sentinel Consequence Simulator",
                requested_at=now - datetime.timedelta(hours=6),
                status="PENDING",
                risk_level="CRITICAL",
                financial_threshold=50000.00,
                source_connector="DECISION_GATEKEEPER",
                provenance_status="VERIFIED",
                is_fixture=True
            )
            db.add(app_req)
            db.commit()

    # Incident Outcomes
    incidents = [
        IncidentOutcome(
            incident_code="INC-2025-91",
            disruption_type="CANAL_TRANSIT_RESTRICTION",
            description="Panama Canal Low Draft Restriction - 14-day reroute for East Coast automotive shipments",
            root_cause="Severe El Niño drought reduced Lake Gatun water levels, capping daily transits by 38%.",
            resolved_at=now - datetime.timedelta(days=95),
            duration_days=18,
            financial_impact=82000.00,
            lessons_learned="Established multi-modal rail land-bridge contracts through Long Beach to mitigate Central American transit bottlenecks.",
            effective_strategy="Intermodal Rail Landbridge via BNSF from West Coast ports",
            source_connector="INCIDENT_POSTMORTEM",
            provenance_status="VERIFIED",
            is_fixture=True
        ),
        IncidentOutcome(
            incident_code="INC-2025-44",
            disruption_type="SUB_TIER_SUPPLIER_OUTAGE",
            description="Silicon Wafer Precursor Chemical Shortage at Tier-3 Smelter in Kyushu",
            root_cause="Chemical plant explosion interrupted ultra-pure argon delivery to wafer ingot slicing lines.",
            resolved_at=now - datetime.timedelta(days=210),
            duration_days=26,
            financial_impact=145000.00,
            lessons_learned="Qualified dual-sourcing requirements for all wafer substrates across European and Japanese suppliers.",
            effective_strategy="Emergency allocation from secondary qualified supplier (Murata)",
            source_connector="INCIDENT_POSTMORTEM",
            provenance_status="VERIFIED",
            is_fixture=True
        )
    ]
    for inc in incidents:
        if not db.query(IncidentOutcome).filter_by(incident_code=inc.incident_code).first():
            db.add(inc)
    db.commit()
