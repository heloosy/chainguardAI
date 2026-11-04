"""
ChainGuard AI - Realistic Benchmark Supply Chain Dataset Generator
Generates multi-tier supply chain data with realistic statistical properties,
explicitly labelled as benchmark / simulated operational data.
"""
import os
import json
import random
import datetime
import numpy as np
import pandas as pd
from typing import Dict, Any, Tuple


def generate_benchmark_data(base_date: str = "2026-11-01", random_seed: int = 42) -> Dict[str, pd.DataFrame]:
    random.seed(random_seed)
    np.random.seed(random_seed)
    
    base_dt = datetime.datetime.strptime(base_date, "%Y-%m-%d")

    # 1. Suppliers (Tier 1 and Tier 2)
    # Explicit simulated benchmark label to meet criteria
    suppliers = [
        {
            "supplier_id": "SUP-001",
            "name": "Apex Semiconductor (Simulated Benchmark)",
            "country": "Taiwan",
            "tier": 1,
            "category": "Microcontrollers & SoCs",
            "capacity_utilization": 0.94,
            "historical_on_time_rate": 0.74,
            "financial_health_score": 88.0,
            "lead_time_days_mean": 21.0,
            "lead_time_days_std": 4.8,
            "lead_time_drift_pct": 24.5  # Worsening trend
        },
        {
            "supplier_id": "SUP-002",
            "name": "Nordic Precision Sensors (Simulated Benchmark)",
            "country": "Germany",
            "tier": 1,
            "category": "Optical & LiDAR Sensors",
            "capacity_utilization": 0.76,
            "historical_on_time_rate": 0.93,
            "financial_health_score": 94.0,
            "lead_time_days_mean": 12.0,
            "lead_time_days_std": 1.5,
            "lead_time_drift_pct": -2.0
        },
        {
            "supplier_id": "SUP-003",
            "name": "Pacific Power Cells (Simulated Benchmark)",
            "country": "South Korea",
            "tier": 1,
            "category": "Li-Ion Battery Modules",
            "capacity_utilization": 0.89,
            "historical_on_time_rate": 0.81,
            "financial_health_score": 85.0,
            "lead_time_days_mean": 18.0,
            "lead_time_days_std": 3.6,
            "lead_time_drift_pct": 14.2
        },
        {
            "supplier_id": "SUP-004",
            "name": "Kyoto High-Density Ceramics (Simulated Benchmark)",
            "country": "Japan",
            "tier": 2,
            "category": "Passive Components & Substrates",
            "capacity_utilization": 0.72,
            "historical_on_time_rate": 0.96,
            "financial_health_score": 96.0,
            "lead_time_days_mean": 14.0,
            "lead_time_days_std": 1.2,
            "lead_time_drift_pct": 0.5
        },
        {
            "supplier_id": "SUP-005",
            "name": "Shenzhen Harness & Cabling (Simulated Benchmark)",
            "country": "China",
            "tier": 1,
            "category": "Wire Harnesses & Connectors",
            "capacity_utilization": 0.83,
            "historical_on_time_rate": 0.88,
            "financial_health_score": 79.0,
            "lead_time_days_mean": 10.0,
            "lead_time_days_std": 2.1,
            "lead_time_drift_pct": 5.0
        },
        {
            "supplier_id": "SUP-006",
            "name": "Detroit Stampings & Enclosures (Simulated Benchmark)",
            "country": "USA",
            "tier": 1,
            "category": "Aluminum Enclosures",
            "capacity_utilization": 0.68,
            "historical_on_time_rate": 0.95,
            "financial_health_score": 91.0,
            "lead_time_days_mean": 6.0,
            "lead_time_days_std": 0.9,
            "lead_time_drift_pct": -1.2
        },
        {
            "supplier_id": "SUP-007",
            "name": "Silicon Saxony Fab (Simulated Benchmark - Alt)",
            "country": "Germany",
            "tier": 1,
            "category": "Microcontrollers & SoCs",
            "capacity_utilization": 0.71,
            "historical_on_time_rate": 0.94,
            "financial_health_score": 92.0,
            "lead_time_days_mean": 14.0,
            "lead_time_days_std": 2.0,
            "lead_time_drift_pct": -1.5
        },
        {
            "supplier_id": "SUP-008",
            "name": "Austin Micro Devices (Simulated Benchmark - Alt)",
            "country": "USA",
            "tier": 1,
            "category": "Li-Ion Battery Modules",
            "capacity_utilization": 0.65,
            "historical_on_time_rate": 0.96,
            "financial_health_score": 95.0,
            "lead_time_days_mean": 7.0,
            "lead_time_days_std": 1.1,
            "lead_time_drift_pct": -3.0
        },
        {
            "supplier_id": "SUP-009",
            "name": "Apex Sensor & Telemetry India (Simulated Benchmark)",
            "country": "India",
            "tier": 2,
            "category": "Sensors & RF Modules",
            "capacity_utilization": 0.82,
            "historical_on_time_rate": 0.91,
            "financial_health_score": 89.0,
            "lead_time_days_mean": 16.0,
            "lead_time_days_std": 2.5,
            "lead_time_drift_pct": 3.0
        }
    ]
    df_suppliers = pd.DataFrame(suppliers)

    # 2. Components
    components = [
        {
            "component_id": "CMP-MCU-01",
            "name": "32-Bit Automotive Master MCU",
            "supplier_id": "SUP-001",
            "alternative_supplier_id": "SUP-007",
            "category": "Microcontrollers",
            "criticality": "High",
            "unit_cost_usd": 85.0,
            "current_stock": 420.0,
            "safety_stock": 350.0,
            "reorder_point": 650.0,
            "daily_consumption_rate": 70.0,  # ~6 days remaining stock!
            "consumption_std": 8.5,
            "holding_cost_rate": 0.20,
            "facility_id": "FAC-DETROIT"
        },
        {
            "component_id": "CMP-SEN-02",
            "name": "Multi-Spectrum LiDAR Transceiver",
            "supplier_id": "SUP-002",
            "alternative_supplier_id": None,
            "category": "Sensors",
            "criticality": "High",
            "unit_cost_usd": 240.0,
            "current_stock": 680.0,
            "safety_stock": 200.0,
            "reorder_point": 400.0,
            "daily_consumption_rate": 35.0,  # ~19.4 days
            "consumption_std": 4.0,
            "holding_cost_rate": 0.22,
            "facility_id": "FAC-DETROIT"
        },
        {
            "component_id": "CMP-BAT-03",
            "name": "48V High-Yield Battery Management Unit",
            "supplier_id": "SUP-003",
            "alternative_supplier_id": "SUP-008",
            "category": "Power",
            "criticality": "High",
            "unit_cost_usd": 310.0,
            "current_stock": 210.0,
            "safety_stock": 180.0,
            "reorder_point": 450.0,
            "daily_consumption_rate": 30.0,  # 7 days remaining!
            "consumption_std": 5.2,
            "holding_cost_rate": 0.25,
            "facility_id": "FAC-AUSTIN"
        },
        {
            "component_id": "CMP-SUB-04",
            "name": "Dielectric Multilayer Substrate",
            "supplier_id": "SUP-004",
            "alternative_supplier_id": None,
            "category": "Passive",
            "criticality": "Medium",
            "unit_cost_usd": 18.0,
            "current_stock": 3400.0,
            "safety_stock": 800.0,
            "reorder_point": 1500.0,
            "daily_consumption_rate": 140.0,
            "consumption_std": 12.0,
            "holding_cost_rate": 0.15,
            "facility_id": "FAC-DETROIT"
        },
        {
            "component_id": "CMP-HAR-05",
            "name": "High-Voltage Shielded Harness",
            "supplier_id": "SUP-005",
            "alternative_supplier_id": None,
            "category": "Harness",
            "criticality": "Medium",
            "unit_cost_usd": 45.0,
            "current_stock": 820.0,
            "safety_stock": 300.0,
            "reorder_point": 600.0,
            "daily_consumption_rate": 40.0,
            "consumption_std": 3.8,
            "holding_cost_rate": 0.18,
            "facility_id": "FAC-AUSTIN"
        },
        {
            "component_id": "CMP-ENC-06",
            "name": "Milled IP68 Aluminum Housing",
            "supplier_id": "SUP-006",
            "alternative_supplier_id": None,
            "category": "Structural",
            "criticality": "Low",
            "unit_cost_usd": 62.0,
            "current_stock": 950.0,
            "safety_stock": 250.0,
            "reorder_point": 500.0,
            "daily_consumption_rate": 45.0,
            "consumption_std": 4.1,
            "holding_cost_rate": 0.12,
            "facility_id": "FAC-DETROIT"
        },
        {
            "component_id": "CMP-SNS-05",
            "name": "Solid-State Radar Front-End Unit",
            "supplier_id": "SUP-009",
            "alternative_supplier_id": "SUP-002",
            "category": "Sensors",
            "criticality": "High",
            "unit_cost_usd": 165.0,
            "current_stock": 280.0,
            "safety_stock": 200.0,
            "reorder_point": 380.0,
            "daily_consumption_rate": 50.0,
            "consumption_std": 6.0,
            "holding_cost_rate": 0.20,
            "facility_id": "FAC-DETROIT"
        }
    ]
    df_components = pd.DataFrame(components)

    # 3. Bill of Materials (BOM) & Graph Relationships
    # Tier 2 -> Tier 1 -> Components -> Assemblies -> Products -> Customer Orders
    bom_edges = [
        # Substrate (Tier 2) to MCU (Tier 1)
        {"parent_id": "CMP-MCU-01", "child_id": "CMP-SUB-04", "parent_type": "Component", "child_type": "Component", "quantity_required": 1.0},
        # Components to Assemblies
        {"parent_id": "ASM-AUTOPILOT", "child_id": "CMP-MCU-01", "parent_type": "Assembly", "child_type": "Component", "quantity_required": 1.0},
        {"parent_id": "ASM-AUTOPILOT", "child_id": "CMP-SEN-02", "parent_type": "Assembly", "child_type": "Component", "quantity_required": 2.0},
        {"parent_id": "ASM-AUTOPILOT", "child_id": "CMP-ENC-06", "parent_type": "Assembly", "child_type": "Component", "quantity_required": 1.0},
        {"parent_id": "ASM-AUTOPILOT", "child_id": "CMP-SNS-05", "parent_type": "Assembly", "child_type": "Component", "quantity_required": 1.0},
        {"parent_id": "ASM-POWERTRAIN", "child_id": "CMP-BAT-03", "parent_type": "Assembly", "child_type": "Component", "quantity_required": 1.0},
        {"parent_id": "ASM-POWERTRAIN", "child_id": "CMP-HAR-05", "parent_type": "Assembly", "child_type": "Component", "quantity_required": 1.0},
        # Assemblies to Finished Goods
        {"parent_id": "PRD-EV-CORE", "child_id": "ASM-AUTOPILOT", "parent_type": "Product", "child_type": "Assembly", "quantity_required": 1.0},
        {"parent_id": "PRD-EV-CORE", "child_id": "ASM-POWERTRAIN", "parent_type": "Product", "child_type": "Assembly", "quantity_required": 1.0},
        {"parent_id": "PRD-ROBOT-V3", "child_id": "ASM-AUTOPILOT", "parent_type": "Product", "child_type": "Assembly", "quantity_required": 1.0},
        # Plants manufacturing Products
        {"parent_id": "FAC-DETROIT", "child_id": "PRD-EV-CORE", "parent_type": "Facility", "child_type": "Product", "quantity_required": 1.0},
        {"parent_id": "FAC-AUSTIN", "child_id": "PRD-ROBOT-V3", "parent_type": "Facility", "child_type": "Product", "quantity_required": 1.0}
    ]
    df_bom = pd.DataFrame(bom_edges)

    # 4. Customer Orders (with revenue & SLA penalty commitments)
    customer_orders = [
        {
            "order_id": "ORD-OEM-901",
            "customer_name": "Titan Mobility Systems",
            "product_id": "PRD-EV-CORE",
            "quantity": 300,
            "contract_value_usd": 1_250_000.0,
            "promised_delivery_date": (base_dt + datetime.timedelta(days=9)).strftime("%Y-%m-%d"),
            "late_penalty_usd_per_day": 25_000.0,
            "sla_priority": "Tier 1 Strategic",
            "destination_market": "North America"
        },
        {
            "order_id": "ORD-OEM-902",
            "customer_name": "Nordic Fleet Solutions",
            "product_id": "PRD-EV-CORE",
            "quantity": 180,
            "contract_value_usd": 780_000.0,
            "promised_delivery_date": (base_dt + datetime.timedelta(days=12)).strftime("%Y-%m-%d"),
            "late_penalty_usd_per_day": 14_000.0,
            "sla_priority": "Tier 1 Strategic",
            "destination_market": "Europe"
        },
        {
            "order_id": "ORD-IND-903",
            "customer_name": "Helios Robotics Logistics",
            "product_id": "PRD-ROBOT-V3",
            "quantity": 150,
            "contract_value_usd": 920_000.0,
            "promised_delivery_date": (base_dt + datetime.timedelta(days=10)).strftime("%Y-%m-%d"),
            "late_penalty_usd_per_day": 18_500.0,
            "sla_priority": "Standard Commercial",
            "destination_market": "North America"
        }
    ]
    df_customer_orders = pd.DataFrame(customer_orders)

    # 5. Active Purchase Orders & Shipments in Transit
    # Notice: CMP-MCU-01 has PO-501 in transit via Ocean, scheduled in 4 days, BUT port congestion + weather + supplier delay indicates a 6+ day delay, creating a critical 4-day coverage gap!
    purchase_orders = [
        {
            "po_id": "PO-501",
            "component_id": "CMP-MCU-01",
            "supplier_id": "SUP-001",
            "destination_facility_id": "FAC-DETROIT",
            "quantity": 1000.0,
            "order_date": (base_dt - datetime.timedelta(days=17)).strftime("%Y-%m-%d"),
            "promised_delivery_date": (base_dt + datetime.timedelta(days=4)).strftime("%Y-%m-%d"),
            "status": "In-Transit"
        },
        {
            "po_id": "PO-502",
            "component_id": "CMP-SEN-02",
            "supplier_id": "SUP-002",
            "destination_facility_id": "FAC-DETROIT",
            "quantity": 500.0,
            "order_date": (base_dt - datetime.timedelta(days=8)).strftime("%Y-%m-%d"),
            "promised_delivery_date": (base_dt + datetime.timedelta(days=4)).strftime("%Y-%m-%d"),
            "status": "In-Transit"
        },
        {
            "po_id": "PO-503",
            "component_id": "CMP-BAT-03",
            "supplier_id": "SUP-003",
            "destination_facility_id": "FAC-AUSTIN",
            "quantity": 600.0,
            "order_date": (base_dt - datetime.timedelta(days=12)).strftime("%Y-%m-%d"),
            "promised_delivery_date": (base_dt + datetime.timedelta(days=6)).strftime("%Y-%m-%d"),
            "status": "In-Transit"
        },
        {
            "po_id": "PO-504",
            "component_id": "CMP-SUB-04",
            "supplier_id": "SUP-004",
            "destination_facility_id": "FAC-DETROIT",
            "quantity": 2500.0,
            "order_date": (base_dt - datetime.timedelta(days=10)).strftime("%Y-%m-%d"),
            "promised_delivery_date": (base_dt + datetime.timedelta(days=4)).strftime("%Y-%m-%d"),
            "status": "In-Transit"
        },
        {
            "po_id": "PO-505",
            "component_id": "CMP-SNS-05",
            "supplier_id": "SUP-009",
            "destination_facility_id": "FAC-DETROIT",
            "quantity": 600.0,
            "order_date": (base_dt - datetime.timedelta(days=12)).strftime("%Y-%m-%d"),
            "promised_delivery_date": (base_dt + datetime.timedelta(days=4)).strftime("%Y-%m-%d"),
            "status": "In-Transit"
        }
    ]
    df_purchase_orders = pd.DataFrame(purchase_orders)

    shipments = [
        {
            "shipment_id": "SHP-801",
            "po_id": "PO-501",
            "component_id": "CMP-MCU-01",
            "supplier_id": "SUP-001",
            "carrier": "TransPacific Maritime (Simulated)",
            "transport_mode": "Ocean",
            "origin_location": "Kaohsiung Port, TW",
            "destination_facility_id": "FAC-DETROIT",
            "departure_date": (base_dt - datetime.timedelta(days=15)).strftime("%Y-%m-%d"),
            "scheduled_arrival_date": (base_dt + datetime.timedelta(days=4)).strftime("%Y-%m-%d"),
            "current_status": "At Port",
            "days_in_transit": 15.0,
            "eta_days_remaining": 4.0,
            "last_milestone_deviation_days": 3.8,  # Berthing delay already observed!
            "weather_severity_index": 7.5,        # Typhoon lingering near route
            "port_congestion_days": 5.2,          # Port of Long Beach high wait
            "geopolitical_risk_score": 6.8
        },
        {
            "shipment_id": "SHP-802",
            "po_id": "PO-502",
            "component_id": "CMP-SEN-02",
            "supplier_id": "SUP-002",
            "carrier": "Lufthansa Cargo (Simulated)",
            "transport_mode": "Air",
            "origin_location": "Frankfurt, DE",
            "destination_facility_id": "FAC-DETROIT",
            "departure_date": (base_dt - datetime.timedelta(days=2)).strftime("%Y-%m-%d"),
            "scheduled_arrival_date": (base_dt + datetime.timedelta(days=4)).strftime("%Y-%m-%d"),
            "current_status": "In Transit",
            "days_in_transit": 2.0,
            "eta_days_remaining": 4.0,
            "last_milestone_deviation_days": 0.2,
            "weather_severity_index": 2.1,
            "port_congestion_days": 0.5,
            "geopolitical_risk_score": 1.2
        },
        {
            "shipment_id": "SHP-803",
            "po_id": "PO-503",
            "component_id": "CMP-BAT-03",
            "supplier_id": "SUP-003",
            "carrier": "Hanjin Logistics (Simulated)",
            "transport_mode": "Ocean",
            "origin_location": "Busan, KR",
            "destination_facility_id": "FAC-AUSTIN",
            "departure_date": (base_dt - datetime.timedelta(days=10)).strftime("%Y-%m-%d"),
            "scheduled_arrival_date": (base_dt + datetime.timedelta(days=6)).strftime("%Y-%m-%d"),
            "current_status": "In Transit",
            "days_in_transit": 10.0,
            "eta_days_remaining": 6.0,
            "last_milestone_deviation_days": 1.8,
            "weather_severity_index": 5.4,
            "port_congestion_days": 3.2,
            "geopolitical_risk_score": 4.5
        },
        {
            "shipment_id": "SHP-804",
            "po_id": "PO-504",
            "component_id": "CMP-SUB-04",
            "supplier_id": "SUP-004",
            "carrier": "Nippon Express Air (Simulated)",
            "transport_mode": "Air",
            "origin_location": "Osaka, JP",
            "destination_facility_id": "FAC-DETROIT",
            "departure_date": (base_dt - datetime.timedelta(days=3)).strftime("%Y-%m-%d"),
            "scheduled_arrival_date": (base_dt + datetime.timedelta(days=4)).strftime("%Y-%m-%d"),
            "current_status": "In Transit",
            "days_in_transit": 3.0,
            "eta_days_remaining": 4.0,
            "last_milestone_deviation_days": 0.1,
            "weather_severity_index": 1.8,
            "port_congestion_days": 0.8,
            "geopolitical_risk_score": 2.0
        },
        {
            "shipment_id": "SHP-805",
            "po_id": "PO-505",
            "component_id": "CMP-SNS-05",
            "supplier_id": "SUP-009",
            "carrier": "Maersk Line (Simulated)",
            "transport_mode": "Ocean",
            "origin_location": "Port of Chennai, IN",
            "destination_facility_id": "FAC-DETROIT",
            "departure_date": (base_dt - datetime.timedelta(days=10)).strftime("%Y-%m-%d"),
            "scheduled_arrival_date": (base_dt + datetime.timedelta(days=4)).strftime("%Y-%m-%d"),
            "current_status": "At Port",
            "days_in_transit": 10.0,
            "eta_days_remaining": 4.0,
            "last_milestone_deviation_days": 0.2,
            "weather_severity_index": 1.5,
            "port_congestion_days": 1.2,
            "geopolitical_risk_score": 1.5
        }
    ]
    df_shipments = pd.DataFrame(shipments)

    # 6. External Signals
    signals = [
        {
            "signal_id": "SIG-PRT-01",
            "source_type": "Port Congestion",
            "location": "Port of Long Beach / San Pedro Bay",
            "severity": "Severe",
            "metric_name": "Vessel Waiting Time (Days)",
            "metric_value": 5.2,
            "baseline_value": 1.4,
            "deviation_pct": 271.4,
            "description": "Berth backlog caused by crane maintenance and container terminal chassis shortages.",
            "timestamp": base_date + "T08:00:00Z"
        },
        {
            "signal_id": "SIG-WTH-02",
            "source_type": "Weather",
            "location": "North Pacific Great Circle Shipping Lane",
            "severity": "Warning",
            "metric_name": "Wave Height / Wind Severity Index",
            "metric_value": 7.5,
            "baseline_value": 3.0,
            "deviation_pct": 150.0,
            "description": "Developing winter cyclonic low forcing container vessels to reduce speed to 12 knots or detour south.",
            "timestamp": base_date + "T06:30:00Z"
        },
        {
            "signal_id": "SIG-GEO-03",
            "source_type": "Geopolitical",
            "location": "Taiwan Strait Straits Maritime Zone",
            "severity": "Warning",
            "metric_name": "Air/Maritime Exclusion Zone Activity",
            "metric_value": 6.8,
            "baseline_value": 2.5,
            "deviation_pct": 172.0,
            "description": "Unscheduled naval exercises near commercial shipping corridors causing 24-48 hr departure holds.",
            "timestamp": base_date + "T04:15:00Z"
        },
        {
            "signal_id": "SIG-PRT-04",
            "source_type": "Port Congestion",
            "location": "Port of Rotterdam",
            "severity": "Normal",
            "metric_name": "Vessel Waiting Time (Days)",
            "metric_value": 1.1,
            "baseline_value": 1.2,
            "deviation_pct": -8.3,
            "description": "Standard seasonal throughput; dwell times within nominal SLA.",
            "timestamp": base_date + "T07:45:00Z"
        }
    ]
    df_signals = pd.DataFrame(signals)

    # 7. Historical Delivery Records (1,200 records for real Model Training & Time-based Validation)
    historical_records = []
    # Generate past shipments over 18 months
    supplier_list = df_suppliers.to_dict(orient="records")
    modes = ["Ocean", "Air", "Truck"]
    
    for i in range(1200):
        sup = random.choice(supplier_list)
        mode = random.choices(["Ocean", "Air", "Truck"], weights=[0.55, 0.25, 0.20])[0]
        
        # Base lead time according to supplier and mode
        if mode == "Air":
            base_lt = sup["lead_time_days_mean"] * 0.45
            mode_factor = 0.5
        elif mode == "Truck":
            base_lt = sup["lead_time_days_mean"] * 0.35
            mode_factor = 0.3
        else:
            base_lt = sup["lead_time_days_mean"]
            mode_factor = 1.0

        agreed_lt = max(3.0, round(random.gauss(base_lt, max(1.0, sup["lead_time_days_std"])), 1))
        
        # Environmental conditions
        weather_sev = round(max(0.0, min(10.0, random.betavariate(2, 5) * 10)), 1)
        port_cong = round(max(0.0, min(10.0, np.random.exponential(1.5) if mode == "Ocean" else np.random.exponential(0.3))), 1)
        geo_risk = round(max(0.0, min(10.0, random.betavariate(1.5, 4) * 10)), 1)
        last_dev = round(random.gauss(0.2, 0.8), 1)
        cap_util = round(max(0.4, min(1.0, sup["capacity_utilization"] + random.gauss(0, 0.05))), 2)
        hist_rate = sup["historical_on_time_rate"]
        drift = sup["lead_time_drift_pct"]

        # Synthetic ground truth physics-grounded delay equation with realistic noise
        # High port congestion, extreme weather, high capacity utilization, and poor supplier reliability drive delays
        delay_propensity = (
            (1.0 - hist_rate) * 5.0 +
            max(0, cap_util - 0.80) * 12.0 +
            (port_cong * 0.9 if mode == "Ocean" else port_cong * 0.2) +
            (weather_sev * 0.4) +
            (geo_risk * 0.3) +
            (last_dev * 0.8) +
            (drift / 20.0) +
            np.random.normal(0, 1.2)
        )

        actual_delay = max(0.0, round(delay_propensity, 1))
        # Zero out small trivial noise
        if actual_delay < 1.0 and random.random() < 0.6:
            actual_delay = 0.0

        actual_lt = agreed_lt + actual_delay
        is_delayed = 1 if actual_delay >= 3.0 else 0
        is_severe = 1 if actual_delay >= 7.0 else 0

        # Timestamp in past 400 days
        days_ago = random.randint(1, 400)
        rec_dt = base_dt - datetime.timedelta(days=days_ago)

        historical_records.append({
            "record_id": f"HIST-{i+1:04d}",
            "order_date": (rec_dt - datetime.timedelta(days=int(agreed_lt))).strftime("%Y-%m-%d"),
            "delivery_date": rec_dt.strftime("%Y-%m-%d"),
            "supplier_id": sup["supplier_id"],
            "supplier_tier": sup["tier"],
            "supplier_category": sup["category"],
            "transport_mode": mode,
            "agreed_lead_time_days": agreed_lt,
            "supplier_capacity_utilization": cap_util,
            "supplier_historical_rate": hist_rate,
            "supplier_lead_time_drift_pct": drift,
            "weather_severity_index": weather_sev,
            "port_congestion_days": port_cong,
            "geopolitical_risk_score": geo_risk,
            "last_milestone_deviation_days": last_dev,
            "actual_lead_time_days": actual_lt,
            "actual_delay_days": actual_delay,
            "is_delayed": is_delayed,
            "is_severe_delay": is_severe
        })

    df_historical = pd.DataFrame(historical_records)

    facilities = [
        {
            "facility_id": "FAC-DETROIT",
            "name": "Detroit Advanced Manufacturing Plant (Plant 1010)",
            "type": "Assembly & Integration Hub",
            "location": "Detroit, MI, USA",
            "lat": 42.3314,
            "lng": -83.0458,
            "daily_capacity_units": 500.0,
            "idle_cost_usd_per_hour": 18400.0,
            "operational_status": "ACTIVE_PRODUCTION"
        },
        {
            "facility_id": "FAC-AUSTIN",
            "name": "Austin Clean-Tech Propulsion Facility (Plant 2020)",
            "type": "Battery & Powertrain Center",
            "location": "Austin, TX, USA",
            "lat": 30.2672,
            "lng": -97.7431,
            "daily_capacity_units": 350.0,
            "idle_cost_usd_per_hour": 14200.0,
            "operational_status": "ACTIVE_PRODUCTION"
        }
    ]
    df_facilities = pd.DataFrame(facilities)

    return {
        "suppliers": df_suppliers,
        "components": df_components,
        "facilities": df_facilities,
        "bom": df_bom,
        "customer_orders": df_customer_orders,
        "purchase_orders": df_purchase_orders,
        "shipments": df_shipments,
        "external_signals": df_signals,
        "historical_deliveries": df_historical
    }


if __name__ == "__main__":
    data = generate_benchmark_data()
    print("Generated benchmark data:")
    for k, v in data.items():
        print(f" - {k}: {len(v)} rows")
