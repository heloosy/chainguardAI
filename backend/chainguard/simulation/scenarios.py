"""
ChainGuard AI - Multi-Scenario Simulation Catalog
Defines 8 deterministic, extensible disruption scenarios including:
1. Potential Cyclone / Severe Weather (Chennai / Bay of Bengal) [Default Demo]
2. Port Closure (Long Beach Gantry Crane Rupture & Berth Dwell)
3. Supplier Shutdown (Hsinchu Semiconductor Cleanroom Voltage Curtailment)
4. Transportation Disruption (Red Sea / Bab-el-Mandeb Rerouting)
5. Trade Restrictions (EAR Dual-Use ECCN Microelectronics License Freeze)
6. Inventory Shortage (Plant 1010 SMT Feeder Scrap Spike)
7. Supplier Capacity Reduction (Tier-1 Foundry Wafer Allocation Cut 35%)
8. Demand Fluctuations (Autonomous EV Powertrain Delivery Surge +40%)

All records are explicitly labelled as simulated synthetic data.
"""
from typing import Dict, Any, List


SCENARIOS_CATALOG: Dict[str, Dict[str, Any]] = {
    "CYCLONE_CHENNAI": {
        "scenario_id": "CYCLONE_CHENNAI",
        "title": "Severe Cyclonic Storm in Bay of Bengal (Chennai Port & Tier-2 Fab)",
        "category": "METEOROLOGICAL_CYCLONE",
        "location": "Chennai & North Tamil Nadu Coast, India",
        "lat": 13.0827,
        "lng": 80.2707,
        "is_default": True,
        "target_shipment_id": "SHP-805",
        "target_component_id": "CMP-SNS-05",
        "target_supplier_id": "SUP-009",
        "destination_facility_id": "FAC-DETROIT",
        "description": "A rapidly intensifying cyclonic depression forms in the Southwest Bay of Bengal, heading toward the North Tamil Nadu coast. Threatens coastal container terminals at Port of Chennai and nearby semiconductor sensor packaging plants.",
        "ticks": [
            {
                "tick_index": 0,
                "step_name": "Initial Uncertain Social Signal",
                "relative_time_hours": 0,
                "signals": [
                    {
                        "signal_id": "SIG-X-CYC-01",
                        "source_platform": "X_TWITTER",
                        "source_type_label": "[SIMULATED - SOCIAL MEDIA]",
                        "source_handle": "@ChennaiFisherWatch",
                        "source_name": "Coromandel Coastal Fishermen Network",
                        "headline": "Rough seas & sudden squalls reported off Ennore and Royapuram",
                        "content": "Deep depression building fast 180 nautical miles east of Chennai. Strong gale squalls picking up to 45 knots. Fishermen advising non-mechanized boats to head to harbor immediately #ChennaiRains #StormAlert",
                        "location": "Royapuram Coastal Basin, Chennai, India",
                        "lat": 13.1120,
                        "lng": 80.2980,
                        "credibility_score": 0.62,
                        "is_corroborating": False,
                        "is_authoritative": False,
                        "virality": {"reposts": 45, "likes": 128}
                    }
                ],
                "signal_strength_score": 0.35,
                "event_confidence_score": 0.28,
                "verification_status": "UNVERIFIED_REPORT",
                "status_rationale": "Single informal eyewitness tweet detected. No official weather agency advisory has been issued yet. Uncertainty remains high."
            },
            {
                "tick_index": 1,
                "step_name": "Secondary Reports & Deduplication",
                "relative_time_hours": 4,
                "signals": [
                    {
                        "signal_id": "SIG-X-CYC-02",
                        "source_platform": "X_TWITTER",
                        "source_type_label": "[SIMULATED - SOCIAL MEDIA]",
                        "source_handle": "@TN_LogisticsHub",
                        "source_name": "Tamil Nadu Drayage Operators",
                        "headline": "Trailer chassis queue forming on Ennore Expressway into Chennai Port",
                        "content": "Waterlogging emerging near Port Gate 2. Container trailer movement slowed by 60%. Customs clearance queue stacking up as rainbands intensify #ChennaiPort #LogisticsDelay",
                        "location": "Ennore Expressway / Port of Chennai Gate 2",
                        "lat": 13.1340,
                        "lng": 80.3120,
                        "credibility_score": 0.74,
                        "is_corroborating": True,
                        "is_authoritative": False,
                        "virality": {"reposts": 164, "likes": 420}
                    },
                    {
                        "signal_id": "SIG-X-CYC-02-DUP",
                        "source_platform": "X_TWITTER",
                        "source_type_label": "[SIMULATED - SOCIAL MEDIA / REPOST]",
                        "source_handle": "@PortTrucksDaily",
                        "source_name": "Syndicated Drayage Reposts",
                        "headline": "Trailer chassis queue forming on Ennore Expressway into Chennai Port",
                        "content": "RT @TN_LogisticsHub: Waterlogging emerging near Port Gate 2. Container trailer movement slowed by 60%. Customs clearance queue stacking up.",
                        "location": "Port of Chennai Gate 2",
                        "lat": 13.1340,
                        "lng": 80.3120,
                        "credibility_score": 0.70,
                        "is_corroborating": False,
                        "is_duplicate": True,
                        "virality": {"reposts": 95, "likes": 210}
                    }
                ],
                "signal_strength_score": 0.58,
                "event_confidence_score": 0.52,
                "verification_status": "UNVERIFIED_REPORT",
                "status_rationale": "Multiple independent drayage posts corroborate localized flooding. Syndicated repost identified and deduplicated. Event confidence elevating but awaiting official meteorological confirmation."
            },
            {
                "tick_index": 2,
                "step_name": "Independent Port Advisory Corroboration",
                "relative_time_hours": 9,
                "signals": [
                    {
                        "signal_id": "SIG-NEWS-CYC-03",
                        "source_platform": "GOOGLE_NEWS",
                        "source_type_label": "[SIMULATED - NEWS REPORT]",
                        "source_handle": "The Hindu BusinessLine Logistics Desk",
                        "source_name": "The Hindu BusinessLine",
                        "headline": "Chennai Port Trust Issues Precautionary Gale Advisory",
                        "content": "Port of Chennai authorities instruct container vessels at outer anchorage to maintain engines on standby. Maritime board warning flags hoisted at harbour. Inbound container berthing slots delayed by minimum 48 hours.",
                        "location": "Port of Chennai Marine Operations",
                        "lat": 13.0850,
                        "lng": 80.2970,
                        "credibility_score": 0.88,
                        "is_corroborating": True,
                        "is_authoritative": False,
                        "virality": {"citations": 14, "views": 3800}
                    }
                ],
                "signal_strength_score": 0.76,
                "event_confidence_score": 0.74,
                "verification_status": "CORROBORATED_INDEPENDENT",
                "status_rationale": "Commercial news reporting and port trust marine advisory independently corroborate emerging cyclone threat. Provisional early warning generated."
            },
            {
                "tick_index": 3,
                "step_name": "Authoritative Meteorological Confirmation",
                "relative_time_hours": 16,
                "signals": [
                    {
                        "signal_id": "SIG-OFF-CYC-04",
                        "source_platform": "OFFICIAL_WEATHER",
                        "source_type_label": "[SIMULATED - OFFICIAL BULLETIN]",
                        "source_handle": "India Meteorological Department (IMD) - RMC Chennai",
                        "source_name": "IMD Cyclone Warning Centre",
                        "headline": "Cyclone Alert Bulletin #4: Severe Cyclonic Storm Over Southwest Bay of Bengal",
                        "content": "Severe cyclonic system centered at 12.4°N, 81.8°E, tracking WNW toward North Tamil Nadu and South Andhra coasts. Sustained surface winds 95-105 km/h gusting to 120 km/h. Red Alert issued for Chennai and Kanchipuram districts. All commercial port operations suspended for 72 hours.",
                        "location": "Bay of Bengal (12.4°N, 81.8°E) / Chennai Coastal Corridor",
                        "lat": 12.4000,
                        "lng": 81.8000,
                        "credibility_score": 0.99,
                        "is_corroborating": True,
                        "is_authoritative": True,
                        "virality": {"official_dispatches": 120, "bulletin_seq": 4}
                    }
                ],
                "signal_strength_score": 0.95,
                "event_confidence_score": 0.98,
                "verification_status": "CONFIRMED_AUTHORITATIVE",
                "status_rationale": "IMD statutory Cyclone Red Alert confirms severe storm landfall within 24 hours. Full commercial port shutdown declared. Disruption confirmed with high operational certainty."
            },
            {
                "tick_index": 4,
                "step_name": "Predictive Risk Cascading & Recovery Options",
                "relative_time_hours": 24,
                "signals": [
                    {
                        "signal_id": "SIG-SUP-CYC-05",
                        "source_platform": "SUPPLIER_NOTICE",
                        "source_type_label": "[SIMULATED - SUPPLIER ADVISORY]",
                        "source_handle": "Apex Sensor India Plant Operations",
                        "source_name": "Apex Sensor & Telemetry Operations Center",
                        "headline": "Force Majeure Notice: Chennai Packaging Fab Flooding & Power Curtailment",
                        "content": "Due to storm surge and state electricity board grid disconnection, Apex Sensor packaging lines halted. Inbound container SHP-805 departure stalled at Port of Chennai Pier 4. Estimated vessel departure delay: +5.5 days.",
                        "location": "Ambattur Industrial Estate / Port of Chennai",
                        "lat": 13.1140,
                        "lng": 80.1540,
                        "credibility_score": 0.97,
                        "is_corroborating": True,
                        "is_authoritative": True,
                        "virality": {"internal_dispatches": 1}
                    }
                ],
                "signal_strength_score": 0.98,
                "event_confidence_score": 0.99,
                "verification_status": "CONFIRMED_AUTHORITATIVE",
                "status_rationale": "Direct supplier force majeure advisory logged. Inbound shipment delay confirmed. Predictive engine calculates downstream plant buffer starvation.",
                "predictive_impact": {
                    "shipment_id": "SHP-805",
                    "component_id": "CMP-SNS-05",
                    "supplier_id": "SUP-009",
                    "facility_id": "FAC-DETROIT",
                    "predicted_delay_days": 5.5,
                    "calibrated_delay_probability": 0.985,
                    "lead_time_quantiles": {"p10": 18.2, "p50": 21.5, "p90": 26.0},
                    "current_on_hand_stock": 280.0,
                    "daily_consumption_rate": 50.0,
                    "days_to_stockout": 5.6,
                    "coverage_gap_days": 4.1,
                    "line_idle_cost_per_hour": 18400.0,
                    "projected_unmitigated_loss_usd": 1812800.0,
                    "affected_customer_orders": ["ORD-OEM-901", "ORD-OEM-902"],
                    "order_sla_penalty_at_risk_usd": 390000.0
                },
                "recommended_actions": [
                    {
                        "action_id": "ACT-CYC-AIR-01",
                        "title": "Air Freight Expedite from Bangalore Inland Airport (BLR)",
                        "action_type": "AIR_FREIGHT_REROUTE",
                        "description": "Truck ready finished stock via dry inland corridor to Kempegowda International Airport (BLR) and charter dedicated freighter flight to Detroit (DTW).",
                        "cost_usd": 12800.0,
                        "lead_time_days": 1.5,
                        "residual_delay_risk": 0.05,
                        "net_benefit_usd": 1800000.0,
                        "feasibility_score": 0.91,
                        "capacity_requirements": "Bangalore air charter slot reservation",
                        "prerequisite_verifications": ["Confirm Bangalore road route bypasses coastal flooding", "Verify customs e-way bill export clearance"],
                        "secondary_risks": "Higher carbon emissions (€250 CBAM offset surcharge)",
                        "decision_gate_default": "HUMAN_APPROVAL"
                    },
                    {
                        "action_id": "ACT-CYC-LAT-02",
                        "title": "Lateral Stock Transfer of 220 Units from Munich European Hub",
                        "action_type": "LATERAL_INVENTORY_TRANSFER",
                        "description": "Transfer 220 units of compatible radar sensors from European logistics buffer to Detroit Plant 1010 via express commercial air.",
                        "cost_usd": 3400.0,
                        "lead_time_days": 2.0,
                        "residual_delay_risk": 0.08,
                        "net_benefit_usd": 1809400.0,
                        "feasibility_score": 0.94,
                        "capacity_requirements": "Munich hub safety buffer drawdown from 24d to 15d",
                        "prerequisite_verifications": ["Physical count reconciliation at Munich central warehouse"],
                        "secondary_risks": "Reduces Munich buffer margin if European demand spikes",
                        "decision_gate_default": "PROCEED"
                    }
                ]
            }
        ]
    },

    "PORT_CLOSURE_LONG_BEACH": {
        "scenario_id": "PORT_CLOSURE_LONG_BEACH",
        "title": "Gantry Crane Structural Failure & Berth Dwell at Port of Long Beach",
        "category": "PORT_DISRUPTION",
        "location": "Port of Long Beach, Pier T, California, USA",
        "lat": 33.7542,
        "lng": -118.2165,
        "is_default": False,
        "target_shipment_id": "SHP-801",
        "target_component_id": "CMP-MCU-01",
        "target_supplier_id": "SUP-001",
        "destination_facility_id": "FAC-DETROIT",
        "description": "Catastrophic hydraulic crane failure at Pier T blocks major container berth. Inbound transpacific container vessels placed in holding patterns off San Pedro Bay.",
        "ticks": [
            {
                "tick_index": 0,
                "step_name": "Dockworker Social Report",
                "relative_time_hours": 0,
                "signals": [
                    {
                        "signal_id": "SIG-X-LB-01",
                        "source_platform": "X_TWITTER",
                        "source_type_label": "[SIMULATED - SOCIAL MEDIA]",
                        "source_handle": "@DockworkerDaily_LA",
                        "headline": "Crane Hydraulic Rupture at Pier T",
                        "content": "Boom crane #4 collapsed cylinder seals. Berth 2 shut down completely. Yard congestion mounting fast #PortOfLongBeach",
                        "location": "Port of Long Beach, Pier T",
                        "lat": 33.7542,
                        "lng": -118.2165,
                        "credibility_score": 0.72,
                        "is_corroborating": False,
                        "is_authoritative": False,
                        "virality": {"reposts": 88, "likes": 310}
                    }
                ],
                "signal_strength_score": 0.40,
                "event_confidence_score": 0.35,
                "verification_status": "UNVERIFIED_REPORT",
                "status_rationale": "Single dockworker post. No terminal bulletin published yet."
            },
            {
                "tick_index": 1,
                "step_name": "Marine Traffic AIS Corroboration",
                "relative_time_hours": 5,
                "signals": [
                    {
                        "signal_id": "SIG-AIS-LB-02",
                        "source_platform": "PORT_NOTICE",
                        "source_type_label": "[SIMULATED - PORT ADVISORY]",
                        "source_handle": "MarineExchange_SoCal",
                        "headline": "San Pedro Bay Anchor Queue Jumps to 18 Vessels",
                        "content": "Marine Exchange Southern California reports Pier T container operations curtailed. Inbound vessel holding queue extended to 4.2 days average wait.",
                        "location": "San Pedro Bay Marine Traffic Control",
                        "lat": 33.7200,
                        "lng": -118.2300,
                        "credibility_score": 0.92,
                        "is_corroborating": True,
                        "is_authoritative": True,
                        "virality": {"bulletin_number": "MX-2026-88"}
                    }
                ],
                "signal_strength_score": 0.85,
                "event_confidence_score": 0.91,
                "verification_status": "CONFIRMED_AUTHORITATIVE",
                "status_rationale": "Marine Exchange official telemetry confirms Pier T outage and 4.2d queue."
            }
        ]
    },

    "SUPPLIER_SHUTDOWN_TAIWAN": {
        "scenario_id": "SUPPLIER_SHUTDOWN_TAIWAN",
        "title": "Industrial Voltage Curtailment & Power Outage at Hsinchu Fab Cluster",
        "category": "SUPPLIER_FORCE_MAJEURE",
        "location": "Hsinchu Science Park, Taiwan",
        "lat": 24.7820,
        "lng": 120.9980,
        "is_default": False,
        "target_shipment_id": "SHP-801",
        "target_component_id": "CMP-MCU-01",
        "target_supplier_id": "SUP-001",
        "destination_facility_id": "FAC-DETROIT",
        "description": "Grid power drop in Northern Taiwan triggers automated emergency shutdown of cleanroom HVAC systems at Tier-1 semiconductor packaging fabs.",
        "ticks": [
            {
                "tick_index": 0,
                "step_name": "Power Grid Anomaly Report",
                "relative_time_hours": 0,
                "signals": [
                    {
                        "signal_id": "SIG-NEWS-TW-01",
                        "source_platform": "GOOGLE_NEWS",
                        "source_type_label": "[SIMULATED - NEWS REPORT]",
                        "source_handle": "Taiwan Economic Daily",
                        "headline": "Taipower 161kV Substation Trip Causes Voltage Dip in Hsinchu",
                        "content": "Voltage sag of 12% recorded at Hsinchu Science Park. Several automated semiconductor testing and packaging lines placed into safe idle mode.",
                        "location": "Hsinchu Science Park, Taiwan",
                        "lat": 24.7820,
                        "lng": 120.9980,
                        "credibility_score": 0.89,
                        "is_corroborating": False,
                        "is_authoritative": True,
                        "virality": {"citations": 32}
                    }
                ],
                "signal_strength_score": 0.70,
                "event_confidence_score": 0.88,
                "verification_status": "CONFIRMED_AUTHORITATIVE",
                "status_rationale": "Taipower and economic daily confirm industrial voltage curtailment."
            }
        ]
    },

    "TRANSPORT_RED_SEA": {
        "scenario_id": "TRANSPORT_RED_SEA",
        "title": "Maritime Security Threat & Missile Incident in Bab-el-Mandeb Strait",
        "category": "GEOPOLITICAL_CONFLICT",
        "location": "Bab-el-Mandeb Strait / Southern Red Sea",
        "lat": 12.5833,
        "lng": 43.3333,
        "is_default": False,
        "target_shipment_id": "SHP-802",
        "target_component_id": "CMP-SEN-02",
        "target_supplier_id": "SUP-002",
        "destination_facility_id": "FAC-DETROIT",
        "description": "Maritime security warning forces commercial container carriers to suspend Suez transit and detour around Cape of Good Hope, adding 12-14 days.",
        "ticks": [
            {
                "tick_index": 0,
                "step_name": "UKMTO Security Warning",
                "relative_time_hours": 0,
                "signals": [
                    {
                        "signal_id": "SIG-UKMTO-01",
                        "source_platform": "PORT_NOTICE",
                        "source_type_label": "[SIMULATED - OFFICIAL BULLETIN]",
                        "source_handle": "United Kingdom Maritime Trade Operations",
                        "headline": "UKMTO Incident 044: Unmanned Aerial Drone Activity 45NM SW of Aden",
                        "content": "Vessels transiting Bab-el-Mandeb Strait advised to exercise extreme caution and maintain security watch. Commercial carriers beginning Cape rerouting.",
                        "location": "Southern Red Sea / Gulf of Aden",
                        "lat": 12.5800,
                        "lng": 43.3300,
                        "credibility_score": 0.98,
                        "is_corroborating": True,
                        "is_authoritative": True,
                        "virality": {"bulletin_no": "UKMTO-WARN-044"}
                    }
                ],
                "signal_strength_score": 0.92,
                "event_confidence_score": 0.98,
                "verification_status": "CONFIRMED_AUTHORITATIVE",
                "status_rationale": "Authoritative maritime defense alert confirms commercial transit suspension."
            }
        ]
    },

    "TRADE_RESTRICTIONS_EAR": {
        "scenario_id": "TRADE_RESTRICTIONS_EAR",
        "title": "Export Administration Regulations (EAR) Dual-Use Microelectronics License Freeze",
        "category": "REGULATORY_EXPORT_CONTROL",
        "location": "Washington D.C. / BIS Transshipment Audits",
        "lat": 38.8951,
        "lng": -77.0364,
        "is_default": False,
        "target_shipment_id": "SHP-801",
        "target_component_id": "CMP-MCU-01",
        "target_supplier_id": "SUP-001",
        "destination_facility_id": "FAC-DETROIT",
        "description": "U.S. Department of Commerce Bureau of Industry and Security (BIS) issues emergency regulatory update subjecting automotive cryptographic MCUs to enhanced transshipment license reviews (15 CFR § 734.4).",
        "ticks": [
            {
                "tick_index": 0,
                "step_name": "Federal Register Notice",
                "relative_time_hours": 0,
                "signals": [
                    {
                        "signal_id": "SIG-FED-EAR-01",
                        "source_platform": "OFFICIAL_WEATHER",
                        "source_type_label": "[SIMULATED - REGULATORY BULLETIN]",
                        "source_handle": "Federal Register / BIS",
                        "headline": "Bureau of Industry and Security Interim Final Rule: ECCN 3A001 Compliance",
                        "content": "Dual-use high-throughput automotive microcontrollers transiting third-party Pacific hubs require verified SNAP-R BIS-748P filings. Customs holds initiated on uncertified manifests.",
                        "location": "Federal Register, Washington D.C.",
                        "lat": 38.8951,
                        "lng": -77.0364,
                        "credibility_score": 0.99,
                        "is_corroborating": True,
                        "is_authoritative": True,
                        "virality": {"rule_id": "BIS-2026-FR-091"}
                    }
                ],
                "signal_strength_score": 0.88,
                "event_confidence_score": 0.99,
                "verification_status": "CONFIRMED_AUTHORITATIVE",
                "status_rationale": "Published Federal Register rule constitutes definitive statutory constraint."
            }
        ]
    },

    "INVENTORY_SHORTAGE_DETROIT": {
        "scenario_id": "INVENTORY_SHORTAGE_DETROIT",
        "title": "Automated SMT Line Feeder Jam & Component Scrap Spike at Plant 1010",
        "category": "INTERNAL_SCRAP_SPIKE",
        "location": "Detroit Advanced Assembly Facility (Plant 1010), Detroit, MI, USA",
        "lat": 42.3314,
        "lng": -83.0458,
        "is_default": False,
        "target_shipment_id": "SHP-801",
        "target_component_id": "CMP-MCU-01",
        "target_supplier_id": "SUP-001",
        "destination_facility_id": "FAC-DETROIT",
        "description": "High-speed surface-mount technology (SMT) feeder misalignment destroys 180 critical microcontroller packages, depleting on-hand safety buffer 3.2 days earlier than scheduled.",
        "ticks": [
            {
                "tick_index": 0,
                "step_name": "Internal MES Quality Deviation",
                "relative_time_hours": 0,
                "signals": [
                    {
                        "signal_id": "SIG-MES-01",
                        "source_platform": "SUPPLIER_NOTICE",
                        "source_type_label": "[SIMULATED - MES INCIDENT]",
                        "source_handle": "Detroit Plant 1010 SCADA / MES",
                        "headline": "SMT Line 3 Optical Inspection Reject Surge: 180 Units Scrapped",
                        "content": "Nozzle pressure vacuum failure bent contact pins on 180 units of CMP-MCU-01. Physical on-hand stock reduced from 420 to 240 units. Time-to-exhaustion compressed to 3.4 days.",
                        "location": "Plant 1010 Detroit Line 3",
                        "lat": 42.3314,
                        "lng": -83.0458,
                        "credibility_score": 0.98,
                        "is_corroborating": True,
                        "is_authoritative": True,
                        "virality": {"defect_log": "MES-DEV-1010-09"}
                    }
                ],
                "signal_strength_score": 0.85,
                "event_confidence_score": 0.99,
                "verification_status": "CONFIRMED_AUTHORITATIVE",
                "status_rationale": "Internal MES telemetry verified by plant quality engineering."
            }
        ]
    },

    "CAPACITY_REDUCTION_FOUNDRY": {
        "scenario_id": "CAPACITY_REDUCTION_FOUNDRY",
        "title": "Primary Semiconductor Foundry Wafer Allocation Curtailment (-35%)",
        "category": "FOUNDRY_ALLOCATION",
        "location": "Apex Semiconductor Fab 3, Hsinchu, Taiwan",
        "lat": 24.7820,
        "lng": 120.9980,
        "is_default": False,
        "target_shipment_id": "SHP-801",
        "target_component_id": "CMP-MCU-01",
        "target_supplier_id": "SUP-001",
        "destination_facility_id": "FAC-DETROIT",
        "description": "Tier-1 silicon foundry reallocates 300mm wafer capacity toward enterprise AI accelerators, reducing automotive microcontroller batch yield by 35% across Q4.",
        "ticks": [
            {
                "tick_index": 0,
                "step_name": "Supplier Allocation Letter",
                "relative_time_hours": 0,
                "signals": [
                    {
                        "signal_id": "SIG-ALLOC-01",
                        "source_platform": "SUPPLIER_NOTICE",
                        "source_type_label": "[SIMULATED - COMMERCIAL NOTICE]",
                        "source_handle": "Apex Commercial Account Management",
                        "headline": "Formal Notice of Controlled Allocation: Automotive MCU Series",
                        "content": "Due to upstream lithography tool delivery delays, delivery volume on PO-501 reduced from 1,000 to 650 units. Replacement batches pushed out by 18 days.",
                        "location": "Apex Semiconductor Corporate HQ",
                        "lat": 24.7820,
                        "lng": 120.9980,
                        "credibility_score": 0.96,
                        "is_corroborating": True,
                        "is_authoritative": True,
                        "virality": {"contract_notice": "ALL-2026-04"}
                    }
                ],
                "signal_strength_score": 0.80,
                "event_confidence_score": 0.98,
                "verification_status": "CONFIRMED_AUTHORITATIVE",
                "status_rationale": "Contractual commercial notice from supplier management."
            }
        ]
    },

    "DEMAND_FLUCTUATION_EV": {
        "scenario_id": "DEMAND_FLUCTUATION_EV",
        "title": "Sudden Surge in Strategic Customer Delivery Orders (+40%)",
        "category": "DEMAND_SURGE",
        "location": "Titan Mobility Systems OEM Headquarters, Chicago, IL",
        "lat": 41.8781,
        "lng": -87.6298,
        "is_default": False,
        "target_shipment_id": "SHP-801",
        "target_component_id": "CMP-MCU-01",
        "target_supplier_id": "SUP-001",
        "destination_facility_id": "FAC-DETROIT",
        "description": "Strategic Tier-1 customer Titan Mobility accelerates fleet delivery schedule, expanding ORD-OEM-901 order quantity by 40% and pulling forward delivery date by 5 days.",
        "ticks": [
            {
                "tick_index": 0,
                "step_name": "EDI Order Change Request",
                "relative_time_hours": 0,
                "signals": [
                    {
                        "signal_id": "SIG-EDI-860-01",
                        "source_platform": "SUPPLIER_NOTICE",
                        "source_type_label": "[SIMULATED - EDI ORDCHG]",
                        "source_handle": "Titan Mobility B2B Gateway (ANSI X12 860)",
                        "headline": "EDI 860 Purchase Order Change Request: Quantity Surge +120 Units",
                        "content": "Customer ORD-OEM-901 requested expedited fulfillment: Quantity updated from 300 to 420 units. Daily component burn rate at Plant 1010 will rise from 70 to 98 units/day.",
                        "location": "Detroit Logistics Hub EDI Gateway",
                        "lat": 42.3314,
                        "lng": -83.0458,
                        "credibility_score": 0.99,
                        "is_corroborating": True,
                        "is_authoritative": True,
                        "virality": {"edi_doc": "860-ORD-901"}
                    }
                ],
                "signal_strength_score": 0.82,
                "event_confidence_score": 0.99,
                "verification_status": "CONFIRMED_AUTHORITATIVE",
                "status_rationale": "Automated EDI 860 transmission processed through enterprise gateway."
            }
        ]
    }
}

# Extended Operational Drift & Multi-Stream Scenarios (Separate from core 8-scenario benchmark catalog)
EXTENDED_SCENARIOS: Dict[str, Dict[str, Any]] = {
    "INTERNAL_LEAD_TIME_DRIFT": {
        "scenario_id": "INTERNAL_LEAD_TIME_DRIFT",
        "title": "Silent Supplier Delivery Drift & Inventory Runout (SAP S/4HANA & IBP Anomaly - Zero External Alerts)",
        "category": "INTERNAL_OPERATIONAL_DRIFT",
        "location": "Apex Semiconductor Packaging / Detroit Plant 1010",
        "lat": 42.3314,
        "lng": -83.0458,
        "is_default": False,
        "target_shipment_id": "SHP-801",
        "target_component_id": "CMP-MCU-01",
        "target_supplier_id": "SUP-007",
        "destination_facility_id": "FAC-DETROIT",
        "description": "Zero public news, weather alerts, or social media reports exist. However, continuous monitoring of SAP S/4HANA delivery records detects supplier lead times have drifted +5.8 days over the past 4 weeks, while SAP IBP registers an unexpected +26% consumption burn surge at Detroit Plant 1010. Component CMP-MCU-01 will exhaust in 5.2 days without intervention.",
        "ticks": [
            {
                "tick_index": 0,
                "step_name": "SAP S/4HANA Lead-Time Drift Detection",
                "relative_time_hours": 0,
                "signals": [
                    {
                        "signal_id": "SIG-SAP-S4-01",
                        "source_platform": "SAP_S4HANA",
                        "source_type_label": "[SIMULATED - SAP S/4HANA EKBE]",
                        "source_handle": "SAP S/4HANA Procurement Analytics",
                        "headline": "Creeping Lead-Time Drift Flagged Across PO-498 to PO-501",
                        "content": "Average actual delivery cycle time for CMP-MCU-01 has steadily lengthened from 14.1d to 22.4d (+59%) over the past 4 purchase orders from Apex Semiconductor (SUP-007).",
                        "location": "Apex Semiconductor (Chennai) -> Detroit Plant 1010",
                        "lat": 13.0827,
                        "lng": 80.2707,
                        "credibility_score": 1.0,
                        "is_corroborating": True,
                        "is_authoritative": True,
                        "virality": {"sap_module": "MM/PUR"}
                    }
                ],
                "signal_strength_score": 0.88,
                "event_confidence_score": 0.97,
                "verification_status": "CONFIRMED_AUTHORITATIVE",
                "status_rationale": "Direct telemetry extraction from enterprise SAP S/4HANA goods receipt ledger."
            }
        ]
    },

    "COMPOUND_RISK": {
        "scenario_id": "COMPOUND_RISK",
        "title": "Compound Multi-Stream Threat (Internal Delivery Drift + External Bay of Bengal Cyclone)",
        "category": "COMPOUND_MULTI_STREAM",
        "location": "Chennai Port, India & Detroit Plant 1010, USA",
        "lat": 13.0827,
        "lng": 80.2707,
        "is_default": False,
        "target_shipment_id": "SHP-801",
        "target_component_id": "CMP-MCU-01",
        "target_supplier_id": "SUP-007",
        "destination_facility_id": "FAC-DETROIT",
        "description": "Supplier lead time was already slipping by +7 days internally (eroding 65% of Detroit Plant buffer). As the shipment nears Chennai Port, a Severe Cyclonic Storm hits, turning a manageable internal buffer into an immediate catastrophic stockout.",
        "ticks": [
            {
                "tick_index": 0,
                "step_name": "Compound Dual-Stream Convergence",
                "relative_time_hours": 0,
                "signals": [
                    {
                        "signal_id": "SIG-COMPOUND-01",
                        "source_platform": "SAP_S4HANA",
                        "source_type_label": "[SIMULATED - SAP S/4HANA + IMD]",
                        "source_handle": "ChainGuard Dual-Stream Engine",
                        "headline": "Internal Safety Margin Depletion Intersects External Storm Track",
                        "content": "SAP S/4HANA confirms shipment SHP-801 was already 7 days delayed. IMD weather radar bulletin #04 confirms Cyclone Senyar has closed container berths CB-1 and CB-2.",
                        "location": "Port of Chennai & Bay of Bengal",
                        "lat": 13.0827,
                        "lng": 80.2707,
                        "credibility_score": 0.98,
                        "is_corroborating": True,
                        "is_authoritative": True,
                        "virality": {"stream_correlation": "DUAL_STREAM_CRITICAL"}
                    }
                ],
                "signal_strength_score": 0.94,
                "event_confidence_score": 0.98,
                "verification_status": "CONFIRMED_AUTHORITATIVE",
                "status_rationale": "High-confidence convergence of internal ERP delay and verified meteorological radar bulletin."
            }
        ]
    }
}

def get_scenario_definition(scenario_id: str) -> Dict[str, Any]:
    """Retrieves scenario from either the 8 core benchmark catalog or extended operational drift scenarios."""
    if scenario_id in SCENARIOS_CATALOG:
        return SCENARIOS_CATALOG[scenario_id]
    if scenario_id in EXTENDED_SCENARIOS:
        return EXTENDED_SCENARIOS[scenario_id]
    return SCENARIOS_CATALOG["CYCLONE_CHENNAI"]


