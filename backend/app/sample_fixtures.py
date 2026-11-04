import datetime
from sqlalchemy.orm import Session
from app.models import (
    Supplier,
    InventoryItem,
    PurchaseOrder,
    Shipment,
    Disruption,
    RecoveryPlan,
    ApprovalRequest,
    IncidentHistory,
    AgentStatus,
    IntegrationConnector,
    SystemSetting
)

def seed_development_fixtures(db: Session):
    """
    Seeds isolated, clearly labeled development fixtures for layout and interaction testing.
    All fixture records have is_fixture=True.
    """
    # 1. Clear existing fixture records first to prevent duplicates
    clear_development_fixtures(db)

    # 2. Suppliers
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
            is_fixture=True,
            created_at=datetime.datetime.utcnow() - datetime.timedelta(days=120)
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
            is_fixture=True,
            created_at=datetime.datetime.utcnow() - datetime.timedelta(days=180)
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
            is_fixture=True,
            created_at=datetime.datetime.utcnow() - datetime.timedelta(days=200)
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
            is_fixture=True,
            created_at=datetime.datetime.utcnow() - datetime.timedelta(days=90)
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
            is_fixture=True,
            created_at=datetime.datetime.utcnow() - datetime.timedelta(days=150)
        )
    ]
    db.add_all(suppliers)
    db.commit()

    # Re-query suppliers to get generated IDs
    tsmc = db.query(Supplier).filter_by(supplier_code="SUP-TSMC-01").first()
    infineon = db.query(Supplier).filter_by(supplier_code="SUP-INFINEON-02").first()
    murata = db.query(Supplier).filter_by(supplier_code="SUP-MURATA-03").first()
    bosch = db.query(Supplier).filter_by(supplier_code="SUP-BOSCH-04").first()
    foxconn = db.query(Supplier).filter_by(supplier_code="SUP-FOXCONN-05").first()

    # 3. Inventory Items
    inventory = [
        InventoryItem(
            sku="SKU-MCU-5NM-01",
            name="Automotive Grade 32-bit MCU 5nm",
            category="Semiconductor",
            warehouse_location="Austin Hub WH-04",
            quantity_on_hand=340,
            safety_stock=800,
            reorder_point=1200,
            unit_cost=185.00,
            unit="units",
            risk_status="CRITICAL",
            primary_supplier_id=tsmc.id if tsmc else None,
            is_fixture=True
        ),
        InventoryItem(
            sku="SKU-SIC-PWR-02",
            name="Silicon Carbide Power Transistor Module",
            category="Power Electronics",
            warehouse_location="Munich WH-02",
            quantity_on_hand=2400,
            safety_stock=1500,
            reorder_point=2500,
            unit_cost=42.50,
            unit="units",
            risk_status="HEALTHY",
            primary_supplier_id=infineon.id if infineon else None,
            is_fixture=True
        ),
        InventoryItem(
            sku="SKU-MLCC-10UF-03",
            name="Automotive MLCC 10uF 50V 0805",
            category="Passive Components",
            warehouse_location="Austin Hub WH-04",
            quantity_on_hand=14500,
            safety_stock=20000,
            reorder_point=35000,
            unit_cost=0.35,
            unit="reels",
            risk_status="AT_RISK",
            primary_supplier_id=murata.id if murata else None,
            is_fixture=True
        ),
        InventoryItem(
            sku="SKU-MEMS-RADAR-04",
            name="77GHz Millimeter-Wave Radar Sensor",
            category="Sensors",
            warehouse_location="Detroit Regional WH-01",
            quantity_on_hand=620,
            safety_stock=1000,
            reorder_point=1800,
            unit_cost=94.00,
            unit="units",
            risk_status="AT_RISK",
            primary_supplier_id=bosch.id if bosch else None,
            is_fixture=True
        ),
        InventoryItem(
            sku="SKU-HARNESS-HD-05",
            name="Shielded High-Voltage Vehicle Wiring Harness",
            category="Assemblies",
            warehouse_location="Detroit Regional WH-01",
            quantity_on_hand=1800,
            safety_stock=1200,
            reorder_point=2000,
            unit_cost=68.00,
            unit="sets",
            risk_status="HEALTHY",
            primary_supplier_id=foxconn.id if foxconn else None,
            is_fixture=True
        )
    ]
    db.add_all(inventory)
    db.commit()

    # 4. Purchase Orders
    now = datetime.datetime.utcnow()
    pos = [
        PurchaseOrder(
            po_number="PO-2026-89210",
            supplier_id=tsmc.id if tsmc else None,
            order_date=now - datetime.timedelta(days=25),
            expected_delivery_date=now - datetime.timedelta(days=2),
            status="DELAYED",
            total_amount=185000.00,
            currency="USD",
            line_items_count=3,
            notes="Critical wafers delayed due to Taiwan Strait marine typhoon storm rerouting.",
            is_fixture=True
        ),
        PurchaseOrder(
            po_number="PO-2026-89211",
            supplier_id=infineon.id if infineon else None,
            order_date=now - datetime.timedelta(days=12),
            expected_delivery_date=now + datetime.timedelta(days=5),
            status="SHIPPED",
            total_amount=51000.00,
            currency="EUR",
            line_items_count=2,
            notes="Standard replenishment dispatched via Lufthansa Cargo.",
            is_fixture=True
        ),
        PurchaseOrder(
            po_number="PO-2026-89212",
            supplier_id=bosch.id if bosch else None,
            order_date=now - datetime.timedelta(days=18),
            expected_delivery_date=now + datetime.timedelta(days=1),
            status="DELAYED",
            total_amount=84600.00,
            currency="EUR",
            line_items_count=4,
            notes="Sub-tier packaging line maintenance extended lead time.",
            is_fixture=True
        ),
        PurchaseOrder(
            po_number="PO-2026-89215",
            supplier_id=murata.id if murata else None,
            order_date=now - datetime.timedelta(days=30),
            expected_delivery_date=now - datetime.timedelta(days=5),
            actual_delivery_date=now - datetime.timedelta(days=5),
            status="DELIVERED",
            total_amount=24500.00,
            currency="USD",
            line_items_count=5,
            notes="Delivered on-time at Austin receiving dock.",
            is_fixture=True
        )
    ]
    db.add_all(pos)
    db.commit()

    po_tsmc = db.query(PurchaseOrder).filter_by(po_number="PO-2026-89210").first()
    po_infineon = db.query(PurchaseOrder).filter_by(po_number="PO-2026-89211").first()
    po_bosch = db.query(PurchaseOrder).filter_by(po_number="PO-2026-89212").first()

    # 5. Shipments
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
            is_fixture=True
        ),
        Shipment(
            tracking_number="SHP-LH-8210",
            purchase_order_id=po_infineon.id if po_infineon else None,
            origin="Frankfurt Airport, DE",
            destination="Dallas Fort Worth (DFW), US",
            carrier="Lufthansa Cargo (LH-8210)",
            mode="AIR",
            status="IN_TRANSIT",
            delay_hours=0,
            departed_at=now - datetime.timedelta(hours=18),
            estimated_arrival=now + datetime.timedelta(hours=6),
            current_location="Transatlantic Airspace (ETA on schedule)",
            is_fixture=True
        ),
        Shipment(
            tracking_number="SHP-HAP-4491",
            purchase_order_id=po_bosch.id if po_bosch else None,
            origin="Rotterdam Port, NL",
            destination="New York Harbor, US",
            carrier="Hapag-Lloyd (Express Berlin)",
            mode="OCEAN",
            status="DELAYED",
            delay_hours=48,
            departed_at=now - datetime.timedelta(days=9),
            estimated_arrival=now + datetime.timedelta(days=3),
            current_location="Approaching North Atlantic Sea Lane (Berth hold at arrival)",
            is_fixture=True
        )
    ]
    db.add_all(shipments)
    db.commit()

    # 6. Disruptions
    disruptions = [
        Disruption(
            disruption_code="DISR-2026-01",
            title="Taiwan Strait Super Typhoon Early Warning - Port Congestion & Feeder Freeze",
            category="WEATHER",
            severity="CRITICAL",
            status="ACTIVE",
            affected_region="East Asia / Taiwan Strait",
            affected_suppliers_count=2,
            affected_inventory_value=375000.00,
            detected_at=now - datetime.timedelta(hours=14),
            summary="Category 4 Super Typhoon 'Gaemi-II' forecast to ground air cargo in Taipei (TPE) and stall Kaohsiung maritime container berthing for 4-5 days.",
            recommended_action="Activate Air-Expedite Protocol from European contingency reserve to safeguard Austin final assembly plant.",
            is_fixture=True
        ),
        Disruption(
            disruption_code="DISR-2026-02",
            title="Rotterdam Port Inland Feeder Barge Congestion & Labor Shortage",
            category="PORT_CONGESTION",
            severity="HIGH",
            status="ACTIVE",
            affected_region="Northern Europe / Benelux",
            affected_suppliers_count=1,
            affected_inventory_value=84600.00,
            detected_at=now - datetime.timedelta(hours=36),
            summary="Rhine-Meuse inland barge container interchange experiencing 72-hour dwell time spikes due to crane automation upgrades and seasonal low river water levels.",
            recommended_action="Reroute priority cargo to direct rail shuttle into Antwerp or truck expedite to Frankfurt air hub.",
            is_fixture=True
        )
    ]
    db.add_all(disruptions)
    db.commit()

    disr_tw = db.query(Disruption).filter_by(disruption_code="DISR-2026-01").first()
    disr_rt = db.query(Disruption).filter_by(disruption_code="DISR-2026-02").first()

    # 7. Recovery Plans
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
            is_fixture=True
        )
    ]
    db.add_all(plans)
    db.commit()

    plan_exp = db.query(RecoveryPlan).filter_by(plan_code="REC-2026-01").first()

    # 8. Approval Requests
    approvals = [
        ApprovalRequest(
            approval_code="APP-2026-401",
            recovery_plan_id=plan_exp.id if plan_exp else None,
            title="Executive Authorization: $64,500 Dedicated Air Expedite for Austin MCU Stockout Prevention",
            requested_by="Sentinel Consequence Simulator",
            requested_at=now - datetime.timedelta(hours=6),
            status="PENDING",
            approver=None,
            action_notes=None,
            action_timestamp=None,
            risk_level="CRITICAL",
            financial_threshold=50000.00,
            is_fixture=True
        )
    ]
    db.add_all(approvals)
    db.commit()

    # 9. Incident History
    incidents = [
        IncidentHistory(
            incident_code="INC-2025-91",
            disruption_type="CANAL_TRANSIT_RESTRICTION",
            description="Panama Canal Low Draft Restriction - 14-day reroute for East Coast automotive shipments",
            root_cause="Severe El Niño drought reduced Lake Gatun water levels, capping daily transits by 38%.",
            resolved_at=now - datetime.timedelta(days=95),
            duration_days=18,
            financial_impact=82000.00,
            lessons_learned="Established multi-modal rail land-bridge contracts through Long Beach to mitigate Central American transit bottlenecks.",
            effective_strategy="Intermodal Rail Landbridge via BNSF from West Coast ports",
            is_fixture=True
        ),
        IncidentHistory(
            incident_code="INC-2025-44",
            disruption_type="SUB_TIER_SUPPLIER_OUTAGE",
            description="Silicon Wafer Precursor Chemical Shortage at Tier-3 Smelter in Kyushu",
            root_cause="Chemical plant explosion interrupted ultra-pure argon delivery to wafer ingot slicing lines.",
            resolved_at=now - datetime.timedelta(days=210),
            duration_days=26,
            financial_impact=145000.00,
            lessons_learned="Qualified dual-sourcing requirements for all wafer substrates across European and Japanese suppliers.",
            effective_strategy="Emergency allocation from secondary qualified supplier (Murata)",
            is_fixture=True
        )
    ]
    db.add_all(incidents)
    db.commit()

    # 10. AI Agents
    agents = [
        AgentStatus(
            agent_id="agent-sentinel",
            agent_name="Sentinel Early Warning Agent",
            role="Monitors multi-tier supply network telemetry, supplier lead times, weather advisories, and marine AIS feeds.",
            status="MONITORING",
            last_run_at=now - datetime.timedelta(minutes=4),
            next_run_at=now + datetime.timedelta(minutes=11),
            version="v1.2.0",
            active_tasks_count=3,
            description="Continuously correlates telemetry against disruption threshold rules SEC-01 and SEC-04.",
            is_fixture=True
        ),
        AgentStatus(
            agent_id="agent-simulator",
            agent_name="Consequence Simulator Agent",
            role="Projects 14-day multi-plant inventory trajectories, starvation dates, and secondary stockout impacts.",
            status="SIMULATING",
            last_run_at=now - datetime.timedelta(minutes=18),
            next_run_at=now + datetime.timedelta(minutes=42),
            version="v1.1.4",
            active_tasks_count=2,
            description="Calculates cross-facility inventory bleed rates and downtime cost trade-offs.",
            is_fixture=True
        ),
        AgentStatus(
            agent_id="agent-governance",
            agent_name="Decision Gatekeeper Agent",
            role="Audits supplier capacity, compliance certifications, contractual SLAs, and executive approval thresholds.",
            status="MONITORING",
            last_run_at=now - datetime.timedelta(minutes=2),
            next_run_at=now + datetime.timedelta(minutes=8),
            version="v1.0.8",
            active_tasks_count=1,
            description="Enforces strict 4-state deterministic governance gate before any financial commitments are logged.",
            is_fixture=True
        )
    ]
    db.add_all(agents)
    db.commit()

    # 11. Integration Connectors
    connectors = [
        IntegrationConnector(
            connector_id="conn-sap-s4hana",
            name="SAP S/4HANA ERP Connector",
            system_type="SAP_S4HANA",
            endpoint_url="https://sap-gateway.enterprise.example.com/sap/opu/odata4/sap/purchaseorders/v0001",
            status="DISCONNECTED",
            last_sync_at=None,
            last_ping_latency_ms=None,
            health_message="Awaiting credential setup and endpoint reachability test",
            auth_type="OAuth 2.0 (mTLS)",
            records_synced=0,
            is_fixture=True
        ),
        IntegrationConnector(
            connector_id="conn-oracle-netsuite",
            name="Oracle NetSuite Supply Planning",
            system_type="ORACLE_NETSUITE",
            endpoint_url="https://rest.netsuite.example.com/services/rest/record/v1",
            status="DISCONNECTED",
            last_sync_at=None,
            last_ping_latency_ms=None,
            health_message="Token-based authentication unverified",
            auth_type="Token-Based Auth (TBA)",
            records_synced=0,
            is_fixture=True
        ),
        IntegrationConnector(
            connector_id="conn-manhattan-wms",
            name="Manhattan Active WMS",
            system_type="MANHATTAN_WMS",
            endpoint_url="https://wms.manhattan.example.com/api/v1/inventory",
            status="DISCONNECTED",
            last_sync_at=None,
            last_ping_latency_ms=None,
            health_message="API Gateway unconfigured; awaiting live warehouse telemetry",
            auth_type="API Key / HMAC",
            records_synced=0,
            is_fixture=True
        ),
        IntegrationConnector(
            connector_id="conn-project44-tms",
            name="Project44 Ocean & Air Freight Telemetry",
            system_type="PROJECT44_TMS",
            endpoint_url="https://na12.api.project44.com/v4/shipment-tracking",
            status="DISCONNECTED",
            last_sync_at=None,
            last_ping_latency_ms=None,
            health_message="Carrier EDI/API feed awaiting company account binding",
            auth_type="OAuth 2.0 Client Credentials",
            records_synced=0,
            is_fixture=True
        ),
        IntegrationConnector(
            connector_id="conn-coupa-ariba",
            name="Coupa / SAP Ariba Procurement Gate",
            system_type="COUPA",
            endpoint_url="https://enterprise.coupahost.com/api/purchase_orders",
            status="DISCONNECTED",
            last_sync_at=None,
            last_ping_latency_ms=None,
            health_message="Purchase Requisition webhooks disconnected",
            auth_type="OAuth 2.0 / API Key",
            records_synced=0,
            is_fixture=True
        )
    ]
    db.add_all(connectors)
    db.commit()

    # 12. System Settings
    settings_records = [
        SystemSetting(
            key="approval_financial_threshold_usd",
            value="50000",
            description="Minimum recovery plan cost requiring Tier-2 Executive VP sign-off."
        ),
        SystemSetting(
            key="starvation_warning_horizon_days",
            value="14",
            description="Lead-time lookahead window for projecting plant component starvation."
        ),
        SystemSetting(
            key="default_telemetry_interval_mins",
            value="15",
            description="Polling cadence for external AIS transponder and EDI shipping notice feeds."
        ),
        SystemSetting(
            key="governance_strict_mode",
            value="true",
            description="Prevent autonomous Live ERP purchase order execution without human verification."
        )
    ]
    db.add_all(settings_records)
    db.commit()


def clear_development_fixtures(db: Session):
    """
    Clears all development fixtures (is_fixture=True) while preserving any live production records.
    """
    db.query(ApprovalRequest).filter(ApprovalRequest.is_fixture == True).delete()
    db.query(RecoveryPlan).filter(RecoveryPlan.is_fixture == True).delete()
    db.query(Disruption).filter(Disruption.is_fixture == True).delete()
    db.query(Shipment).filter(Shipment.is_fixture == True).delete()
    db.query(PurchaseOrder).filter(PurchaseOrder.is_fixture == True).delete()
    db.query(InventoryItem).filter(InventoryItem.is_fixture == True).delete()
    db.query(Supplier).filter(Supplier.is_fixture == True).delete()
    db.query(IncidentHistory).filter(IncidentHistory.is_fixture == True).delete()
    db.query(AgentStatus).filter(AgentStatus.is_fixture == True).delete()
    db.query(IntegrationConnector).filter(IntegrationConnector.is_fixture == True).delete()
    db.commit()


def clear_all_data(db: Session):
    """
    Resets all tables to empty state (for verifying Phase 1 Empty States: "Awaiting connected data").
    """
    db.query(ApprovalRequest).delete()
    db.query(RecoveryPlan).delete()
    db.query(Disruption).delete()
    db.query(Shipment).delete()
    db.query(PurchaseOrder).delete()
    db.query(InventoryItem).delete()
    db.query(Supplier).delete()
    db.query(IncidentHistory).delete()
    db.query(AgentStatus).delete()
    db.query(IntegrationConnector).delete()
    db.commit()

