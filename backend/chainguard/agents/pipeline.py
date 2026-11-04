"""
ChainGuard AI - Streamlined 8-Stage Autonomous Agent Pipeline
Coordinates the exact end-to-end workflow:
1. Start application (load sample supply-chain data, calm nominal monitoring baseline)
2. Collect external signals (social media, news, weather alerts, carrier updates)
3. Detect early warnings (group related signals, cluster disruption)
4. Verify information (cross-check sources, distinguish confirmed events from rumours)
5. Map supply-chain impact (affected suppliers, ports, shipments, inventory, facilities)
6. Predict risks (delays, shortages, coverage gap, financial consequences)
7. Recommend preventive actions & Analyze alternative issues (Gemini AI + deterministic compliance fallback)
8. Autonomous execution & Human approval (agent executes low-risk decisions; humans validate high-budget actions: approve, request evidence, block)
9. Track outcomes (record results in incident store, track avoided loss, continuous learning)
"""
import os
import json
import datetime
import uuid
from typing import Dict, Any, List, Optional

from chainguard.data.storage import storage
from chainguard.simulation.scenarios import SCENARIOS_CATALOG, get_scenario_definition
from chainguard.graph.exposure_mapper import exposure_mapper
from chainguard.validation.retraining_pipeline import pipeline_manager
from chainguard.history.incident_store import incident_store
from chainguard.compliance.decision_gate import decision_gate
from chainguard.agents.gemini_analyzer import analyze_alternative_with_gemini
from chainguard.agents.dual_stream_detector import dual_stream_detector
from chainguard.agents.notification_service import notification_service


STAGE_NAMES = [
    "1. Calm Nominal Monitoring",
    "2. Collect External Signals",
    "3. Detect Early Warnings",
    "4. Verify Information",
    "5. Map Supply-Chain Impact",
    "6. Predict Risks",
    "7. Recommend Preventive Actions",
    "8. Human-in-the-Loop Approval",
    "9. Track Outcomes & Learn"
]


class SimpleAgentWorkflow:
    def __init__(self):
        self.scenario_id = "CYCLONE_CHENNAI"
        self.stage_index = 0
        self.status = "IDLE"  # IDLE, RUNNING, AWAITING_HUMAN_APPROVAL, COMPLETED
        self.human_decision: Optional[str] = None  # "approve", "request_evidence", "block"
        self.human_decision_notes: str = ""
        self.agent_thought_trace: List[Dict[str, Any]] = []
        self.custom_injected_signals: List[Dict[str, Any]] = []
        self._cached_alternative_analysis: Dict[str, Any] = {}
        self.last_updated = datetime.datetime.now().isoformat()
        self.reset("CYCLONE_CHENNAI")

    def reset(self, scenario_id: str = "CYCLONE_CHENNAI"):
        """Resets the pipeline to Stage 0 with clean benchmark sample data in a calm nominal state."""
        scenario_def = get_scenario_definition(scenario_id)
        self.scenario_id = scenario_def.get("scenario_id", "CYCLONE_CHENNAI")
        self.stage_index = 0
        self.status = "IDLE"
        self.human_decision = None
        self.human_decision_notes = ""
        self.custom_injected_signals = []
        self._cached_alternative_analysis = {}
        self.agent_thought_trace = [
            {
                "timestamp": datetime.datetime.now().strftime("%H:%M:%S"),
                "agent": "System Orchestrator",
                "role": "Environment Initialization",
                "thought": f"Calm baseline initialized. Active scenario: {scenario_def['title']}. Ready to detect risks.",
                "action": "NOMINAL_MONITORING_STANDBY",
                "type": "info"
            }
        ]
        self.last_updated = datetime.datetime.now().isoformat()

    def inject_signal(self, signal_dict: Dict[str, Any]) -> Dict[str, Any]:
        """Injects an external shock disruption signal into the live pipeline."""
        sig_id = f"INJ-{datetime.datetime.now().strftime('%H%M%S')}"
        platform = signal_dict.get("source_platform", "X_TWITTER")
        category = signal_dict.get("category", "Disruption Shock Alert")
        headline = signal_dict.get("headline", "External shock signal")
        content = signal_dict.get("content", "Disruption shock detected")
        location = signal_dict.get("location", "Chennai & North Tamil Nadu Coast, India")
        lat = float(signal_dict.get("lat", 13.0827))
        lng = float(signal_dict.get("lng", 80.2707))
        severity = signal_dict.get("urgency_tier", "CRITICAL").upper()
        delay_days = float(signal_dict.get("predicted_delay_shock_days", 4.5))

        is_rumor = "rumor" in headline.lower() or "rumour" in content.lower()
        reliability = 0.65 if is_rumor else 0.95

        new_sig = {
            "id": sig_id,
            "source": platform.replace("_", " ").title(),
            "author": signal_dict.get("source_handle", "@ExternalObserver"),
            "category": category,
            "content": f"{headline}: {content}",
            "timestamp": "Just Now (Injected)",
            "reliability_score": reliability,
            "is_rumor": is_rumor,
            "verified": not is_rumor,
            "location": location,
            "lat": lat,
            "lng": lng
        }
        self.custom_injected_signals.insert(0, new_sig)

        now_str = datetime.datetime.now().strftime("%H:%M:%S")
        self.agent_thought_trace.append({
            "timestamp": now_str,
            "agent": "External Shock Receiver",
            "role": "Shock Perception",
            "thought": f"EXTERNAL SHOCK INJECTED from {new_sig['source']}: '{headline}' at {location}. Dispatching to agentic perception sensors (impact: +{delay_days}d transit delay).",
            "action": "INGEST_INJECTED_SHOCK",
            "type": "danger"
        })

        # Automated emergency SMS dispatch to Operations Commander (7736215631)
        sms_record = notification_service.dispatch_sms(
            phone_number="7736215631",
            issue_title=headline,
            delay_days=delay_days,
            var_usd=2400000.0,
            coverage_gap_days=4.1,
            affected_entity=signal_dict.get("affected_entity", "SHP-801"),
            component_id=signal_dict.get("component_id", "CMP-MCU-01"),
            scenario_id=self.scenario_id
        )
        self.agent_thought_trace.append({
            "timestamp": now_str,
            "agent": "Telephony Dispatch Sentry",
            "role": "Emergency Incident Paging",
            "thought": f"EMERGENCY SMS DISPATCHED to Operations Commander (7736215631) via {sms_record['carrier']}. Delivery status: {sms_record['delivery_status']}.",
            "action": "DISPATCH_EMERGENCY_SMS",
            "type": "warning"
        })

        if self.stage_index == 0:
            self.stage_index = 1
            self.status = "RUNNING"

        self.last_updated = datetime.datetime.now().isoformat()
        return {
            "status": "SIGNAL_INJECTED",
            "injected_signal": new_sig,
            "emergency_notification": sms_record,
            "active_pipeline_stage": self.stage_index,
            "pipeline_status": self.status
        }

    def _get_alternative_analysis(self, alt_id: str, title: str, action_type: str, cost_usd: float) -> Dict[str, Any]:
        """Caches or computes the Gemini/deterministic compliance analysis for an alternative."""
        if alt_id not in self._cached_alternative_analysis:
            self._cached_alternative_analysis[alt_id] = analyze_alternative_with_gemini(
                alt_id=alt_id,
                title=title,
                action_type=action_type,
                cost_usd=cost_usd,
                context={"scenario_id": self.scenario_id, "component": "CMP-MCU-01"}
            )
        return self._cached_alternative_analysis[alt_id]

    def get_state(self) -> Dict[str, Any]:
        """Returns the full unified state for the frontend."""
        scenario = get_scenario_definition(self.scenario_id)
        
        # Sample data summary
        suppliers_df = storage.get_table("suppliers")
        components_df = storage.get_table("components")
        shipments_df = storage.get_table("shipments")
        
        sample_summary = {
            "suppliers_count": len(suppliers_df),
            "components_count": len(components_df),
            "shipments_count": len(shipments_df),
            "active_shipment_id": "SHP-801",
            "critical_component": "CMP-MCU-01 (Automotive 32-bit Microcontroller)",
            "assembly_plant": "Detroit Advanced Assembly Plant 1010",
            "detroit_inventory": 4625 if self.stage_index == 0 else 1200,
            "daily_consumption": 250,
            "days_of_stock_baseline": 18.5 if self.stage_index == 0 else 4.8
        }

        # -------------------------------------------------------------------
        # CALM NOMINAL MONITORING STATE (Stage 0: No early warnings, all green)
        # -------------------------------------------------------------------
        if self.stage_index == 0:
            nominal_signals = [
                {
                    "id": "SIG-NOM-01",
                    "source": "Port of Chennai Telemetry",
                    "author": "Port Authority Harbor EDI",
                    "category": "Port Operations",
                    "content": "Container terminal operations running smoothly at optimal 94% berth utilization. Average dwell time: 1.2 days. Weather clear.",
                    "timestamp": "T-2h",
                    "reliability_score": 0.98,
                    "is_rumor": False,
                    "verified": True
                },
                {
                    "id": "SIG-NOM-02",
                    "source": "Automated Satellite Weather (NOAA / IMD)",
                    "author": "Bay of Bengal Regional Forecast",
                    "category": "Weather Alert",
                    "content": "Calm sea state throughout North Indian Ocean and Bay of Bengal. Wind speed 8-12 knots. No tropical depression detected.",
                    "timestamp": "T-4h",
                    "reliability_score": 0.99,
                    "is_rumor": False,
                    "verified": True
                },
                {
                    "id": "SIG-NOM-03",
                    "source": "Maersk Line Fleet Gateway",
                    "author": "Vessel Telemetry Automated Feed",
                    "category": "Carrier Bulletin",
                    "content": "Vessel MV Pacific Trader (Voyage 2026W carrying shipment SHP-801) underway on scheduled transit track. Telemetry ETA Detroit via Norfolk on track.",
                    "timestamp": "T-6h",
                    "reliability_score": 0.97,
                    "is_rumor": False,
                    "verified": True
                },
                {
                    "id": "SIG-NOM-04",
                    "source": "Detroit Plant 1010 MES",
                    "author": "Inventory Controller",
                    "category": "Internal Telemetry",
                    "content": "Detroit Plant 1010 SMT Line operating smoothly. Current buffer: 18.5 days on hand (4,625 units). Zero stockouts projected.",
                    "timestamp": "T-1h",
                    "reliability_score": 1.0,
                    "is_rumor": False,
                    "verified": True
                }
            ]

            nominal_risk_prediction = {
                "calibrated_delay_probability": 0.021,
                "delay_probability_pct": 2.1,
                "delay_severity": "NOMINAL",
                "expected_arrival_delay_days": 0.0,
                "lead_time_quantiles": {"P10": 0.0, "P50": 0.0, "P90": 0.5},
                "time_to_shortage_days": 18.5,
                "replacement_lead_time_days": 0.0,
                "coverage_gap_days": 0.0,
                "projected_stockout_date": "None (Buffer Healthy: 18.5d)",
                "daily_downtime_penalty_usd": 0.0,
                "sla_breach_penalty_usd": 0.0,
                "total_unmitigated_financial_loss_usd": 0.0,
                "prediction_summary": "All corridors nominal. Calibrated baseline risk is 2.1% (standard maritime variance). Detroit plant has 18.5 days of inventory buffer ($0.00 VaR)."
            }

            nominal_impact_mapping = {
                "disruption_epicenter": None,
                "affected_tier2_supplier": None,
                "affected_shipment": None,
                "affected_facility": None,
                "affected_customer_orders": [],
                "exposure_verdict": "All 8 corridors nominal. No operational exposure detected."
            }

            nominal_verification = {
                "status": "ALL_CHANNELS_NOMINAL",
                "event_confidence_score": 1.0,
                "rumors_filtered_count": 0,
                "cross_checked_sources": [
                    {"source": "Port Telemetry", "status": "NOMINAL"},
                    {"source": "Satellite Weather", "status": "NOMINAL"},
                    {"source": "Carrier Fleet", "status": "NOMINAL"},
                    {"source": "Detroit MES", "status": "NOMINAL"}
                ],
                "verification_verdict": "Continuous telemetry streaming across 4 operational feeds. Zero anomalous deviation detected."
            }

            nominal_autonomous = [
                {
                    "action": "CONTINUOUS_CORRIDOR_SWEEP",
                    "target": "Global AIS & Weather Gateways",
                    "detail": "Autonomous agent continuously polling 8 maritime routes and tier-1/tier-2 telemetry every 15 minutes.",
                    "status": "ACTIVE_MONITORING",
                    "timestamp": "Continuous"
                }
            ]

            nominal_human_approval = {
                "status": "NOT_TRIGGERED",
                "proposed_action": None,
                "budget_amount_usd": 0.0,
                "autonomous_actions_taken": nominal_autonomous,
                "escalation_reason": "No emergency capital expenditure required. System operating in autonomous baseline monitoring state.",
                "decision_options": [],
                "notes": "Nominal operations"
            }

            # Dual-stream telemetry
            int_telemetry = dual_stream_detector.get_internal_telemetry("CMP-MCU-01", "NOMINAL")
            ext_stream = dual_stream_detector.get_external_signals("INTERNAL_LEAD_TIME_DRIFT")
            cross_stream = dual_stream_detector.correlate_dual_streams(int_telemetry, ext_stream)

            return {
                "scenario": scenario,
                "current_stage_index": 0,
                "current_stage_name": STAGE_NAMES[0],
                "total_stages": len(STAGE_NAMES),
                "status": "IDLE",
                "sample_data_summary": sample_summary,
                "signals": nominal_signals,
                "early_warning": None,
                "verification": nominal_verification,
                "impact_mapping": nominal_impact_mapping,
                "risk_prediction": nominal_risk_prediction,
                "preventive_actions": [],
                "autonomous_actions": nominal_autonomous,
                "human_approval": nominal_human_approval,
                "outcome_tracking": None,
                "dual_stream_telemetry": {
                    "internal_telemetry": int_telemetry,
                    "external_signals": ext_stream,
                    "cross_stream_correlation": cross_stream
                },
                "agent_thought_trace": self.agent_thought_trace,
                "last_updated": self.last_updated
            }

        # -------------------------------------------------------------------
        # ACTIVE DISRUPTION WORKFLOW STATE (Stage 1 to 8)
        # -------------------------------------------------------------------
        int_telemetry = dual_stream_detector.get_internal_telemetry("CMP-MCU-01", self.scenario_id)
        ext_stream = dual_stream_detector.get_external_signals(self.scenario_id)
        cross_stream = dual_stream_detector.correlate_dual_streams(int_telemetry, ext_stream)

        if self.scenario_id == "INTERNAL_LEAD_TIME_DRIFT":
            # ---------------------------------------------------------------
            # SCENARIO: SILENT INTERNAL SUPPLIER DRIFT (ZERO EXTERNAL ALERTS)
            # ---------------------------------------------------------------
            int_signals = [
                {
                    "id": s["signal_id"],
                    "source": s["system"],
                    "author": "Enterprise ERP Telemetry",
                    "category": "Internal Operational Anomaly",
                    "content": f"{s['metric']}: Observed {s['observed_value']} vs Baseline {s['baseline_value']}. {s['detail']}",
                    "timestamp": s["timestamp"],
                    "reliability_score": 0.99,
                    "is_rumor": False,
                    "verified": True,
                    "stream": "INTERNAL"
                }
                for s in int_telemetry.get("signals", [])
            ]
            ext_nominal = [
                {
                    "id": s["signal_id"],
                    "source": s["source"],
                    "author": "External Threat Monitor",
                    "category": s["category"],
                    "content": f"{s['headline']}: {s['content']}",
                    "timestamp": s["timestamp"],
                    "reliability_score": 0.98,
                    "is_rumor": False,
                    "verified": True,
                    "stream": "EXTERNAL"
                }
                for s in ext_stream
            ]
            signals = self.custom_injected_signals + int_signals + ext_nominal

            early_warning = {
                "title": "Silent Supplier Delivery Drift & Inventory Runout (SAP S/4HANA & IBP Anomaly - Zero External Alerts)",
                "cluster_detected": "Internal Enterprise Telemetry: Creeping Delivery Degradation & Burn Surge",
                "severity": "CRITICAL",
                "signal_strength_score": 0.94,
                "corridor": "Apex Semiconductor Fab -> Detroit Plant 1010 Assembly",
                "detected_at": "Simulation Tick T-0",
                "detection_archetype": "INTERNAL_OPERATIONAL_DRIFT",
                "summary": "Continuous monitoring of SAP S/4HANA delivery records and SAP IBP consumption discovered a silent operational failure. Supplier lead times crept up +59% (+8.4d) over 4 weeks, while plant burn rate surged +26%. ZERO public news or social media reports exist."
            }

            verification = {
                "status": "CONFIRMED_VIA_SAP_LEDGER",
                "event_confidence_score": 0.98,
                "rumors_filtered_count": 0,
                "cross_checked_sources": [
                    {"source": "SAP S/4HANA Goods Receipt Ledger", "weight": 0.40, "confidence": 0.99, "status": "VERIFIED"},
                    {"source": "SAP IBP Inventory & Consumption Feed", "weight": 0.35, "confidence": 0.98, "status": "VERIFIED"},
                    {"source": "SAP Ariba Supplier Capacity Commitment", "weight": 0.25, "confidence": 0.96, "status": "VERIFIED"}
                ],
                "verification_verdict": "Event 98% confirmed via internal SAP ERP ledgers and automated telemetry. Zero dependence on social media or external news."
            }

            impact_mapping = {
                "disruption_epicenter": {
                    "name": "Detroit Plant 1010 & Apex Fab Line 2",
                    "country": "USA / India",
                    "lat": 42.3314,
                    "lng": -83.0458
                },
                "affected_tier2_supplier": {
                    "supplier_id": "SUP-007",
                    "name": "Apex Semiconductor Packaging Partner",
                    "category": "Lead-Time Degradation (+8.4d)"
                },
                "affected_shipment": {
                    "shipment_id": "SHP-801",
                    "component_id": "CMP-MCU-01",
                    "component_name": "Automotive 32-bit Microcontroller",
                    "quantity": 5000,
                    "transport_mode": "Ocean Intermodal",
                    "carrier": "Ocean Network",
                    "origin": "Chennai, India",
                    "destination": "Plant 1010, Detroit, MI"
                },
                "affected_facility": {
                    "facility_id": "FAC-1010",
                    "name": "Detroit Advanced Assembly Plant 1010",
                    "on_hand_inventory": 1638,
                    "daily_burn_rate": 315,
                    "days_of_stock_left": 5.2
                },
                "affected_customer_orders": [
                    {
                        "order_id": "ORD-OEM-901",
                        "customer": "Titan Mobility Systems OEM",
                        "contract_value": 2400000.00,
                        "units": 1500,
                        "sla_deadline_days": 12,
                        "status": "AT_CRITICAL_RISK"
                    }
                ],
                "exposure_verdict": "Direct internal exposure: Unannounced lead-time creep (+8.4d) coupled with accelerated factory burn (+26%) creates an unannounced 6.2-day production stockout."
            }

            risk_prediction = {
                "calibrated_delay_probability": 0.975,
                "delay_probability_pct": 97.5,
                "delay_severity": "CRITICAL",
                "expected_arrival_delay_days": 8.4,
                "lead_time_quantiles": {"P10": 6.8, "P50": 8.4, "P90": 11.2},
                "time_to_shortage_days": 5.2,
                "replacement_lead_time_days": 11.4,
                "coverage_gap_days": 6.2,
                "projected_stockout_date": (datetime.datetime.now() + datetime.timedelta(days=5.2)).strftime("%b %d, %Y"),
                "daily_downtime_penalty_usd": 420000.00,
                "sla_breach_penalty_usd": 93000.00,
                "total_unmitigated_financial_loss_usd": 2604000.00,
                "prediction_summary": "Internal SAP telemetry predicts a 97.5% delay probability. Without intervention, Detroit Plant 1010 will deplete inventory in 5.2 days, resulting in a 6.2-day assembly line shutdown and $2,604,000 in unmitigated loss."
            }

            raw_preventive_actions = [
                {
                    "id": "ACT-01",
                    "title": "Activate Secondary European Supplier (Nordic Precision Sensors)",
                    "action_type": "SECONDARY_SOURCING",
                    "is_recommended": True,
                    "cost_usd": 142000.00,
                    "feasibility_pct": 88.0,
                    "execution_lead_time_days": 4.5,
                    "residual_delay_risk_pct": 14.0,
                    "coverage_gap_eliminated_days": 6.2,
                    "gross_loss_avoided_usd": 2604000.00,
                    "net_financial_benefit_usd": 2462000.00,
                    "requires_human_approval": True,
                    "approval_reason": "Procurement contract commitment of $142,000 exceeds autonomous decision threshold of $50,000",
                    "description": "Trigger emergency allocation from Nordic Precision in Germany. Pre-qualified automotive grade MCUs arrive in 4.5 days, preventing Detroit plant shutdown before current stock reaches zero."
                },
                {
                    "id": "ACT-02",
                    "title": "Expedite Alternative Air Charter via Frankfurt Hub",
                    "action_type": "EXPEDITE_AIR_CHARTER",
                    "is_recommended": False,
                    "cost_usd": 95000.00,
                    "feasibility_pct": 92.0,
                    "execution_lead_time_days": 2.0,
                    "residual_delay_risk_pct": 12.0,
                    "coverage_gap_eliminated_days": 6.2,
                    "gross_loss_avoided_usd": 2604000.00,
                    "net_financial_benefit_usd": 2509000.00,
                    "requires_human_approval": True,
                    "approval_reason": "High-budget operational expenditure ($95,000 exceeds $50,000 autonomous ceiling)",
                    "description": "Charter 5,000 units from backup fab batch via emergency Frankfurt air cargo corridor. Arrives in 2.0 days."
                },
                {
                    "id": "ACT-03",
                    "title": "Status Quo (Accept Operational Drift & Stockout)",
                    "action_type": "DO_NOTHING",
                    "is_recommended": False,
                    "cost_usd": 0.00,
                    "feasibility_pct": 100.0,
                    "execution_lead_time_days": 0.0,
                    "residual_delay_risk_pct": 97.5,
                    "coverage_gap_eliminated_days": 0.0,
                    "gross_loss_avoided_usd": 0.00,
                    "net_financial_benefit_usd": -2604000.00,
                    "requires_human_approval": False,
                    "approval_reason": "Baseline reference only",
                    "description": "No intervention. Assembly line suffers 6.2 days of unannounced shutdown incurring $2.604M in idle overhead and customer contract cancellation."
                }
            ]

            autonomous_actions = [
                {
                    "action": "AUTO_STAGE_SAP_BAPI_PO",
                    "target": "SAP S/4HANA BAPI Gateway (BAPI_PO_CREATE1)",
                    "detail": "Agent automatically staged emergency Purchase Order in SAP for 1,500 units of CMP-MCU-01 from backup vendor.",
                    "status": "EXECUTED",
                    "timestamp": "T+10s"
                },
                {
                    "action": "AUTO_ADJUST_MRP_SAFETY_STOCK",
                    "target": "SAP S/4HANA MRP Live (MD04)",
                    "detail": "Agent dynamically adjusted safety stock parameter from 500 to 1,200 units to account for observed supplier lead-time drift.",
                    "status": "EXECUTED",
                    "timestamp": "T+15s"
                },
                {
                    "action": "TRANSMIT_EDI_860_PO_CHANGE",
                    "target": "Apex Semiconductor EDI B2B Gateway",
                    "detail": "Agent dispatched automated EDI 860 order change notice flagging delivery schedule SLA breach.",
                    "status": "EXECUTED",
                    "timestamp": "T+20s"
                }
            ]

        else:
            # ---------------------------------------------------------------
            # SCENARIO: EXTERNAL SHOCK DISRUPTION (CYCLONE / WEATHER)
            # ---------------------------------------------------------------
            base_signals = [
                {
                    "id": "SIG-01",
                    "source": "X / Twitter",
                    "author": "@chennai_port_spotter (Maritime Observer)",
                    "category": "Social Media",
                    "content": "Heavy storm surge and rising swell outside Chennai outer anchorage. Several feeder ships dropping anchor or aborting pilot boarding. #CycloneSenyar #ChennaiPort",
                    "timestamp": "T-14h",
                    "reliability_score": 0.65,
                    "is_rumor": True,
                    "verified": False,
                    "stream": "EXTERNAL"
                },
                {
                    "id": "SIG-02",
                    "source": "India Meteorological Department (IMD)",
                    "author": "Cyclone Warning Division, New Delhi",
                    "category": "Weather Alert",
                    "content": "BULLETIN NO. 04: Severe Cyclonic Storm 'Senyar' over Southwest Bay of Bengal moving NW toward North Tamil Nadu-South Andhra coast. Wind gusts 110-125 km/h. Coastal operations red alert.",
                    "timestamp": "T-8h",
                    "reliability_score": 0.96,
                    "is_rumor": False,
                    "verified": True,
                    "stream": "EXTERNAL"
                },
                {
                    "id": "SIG-03",
                    "source": "Port of Chennai Authority",
                    "author": "Harbor Master Operations Notice",
                    "category": "Port Operations",
                    "content": "Port operational notice: Container berths CB-1 and CB-2 suspended from 18:00 IST. Gantry cranes locked down. Vessel dwell expected to exceed 72-96 hours.",
                    "timestamp": "T-4h",
                    "reliability_score": 0.94,
                    "is_rumor": False,
                    "verified": True,
                    "stream": "EXTERNAL"
                },
                {
                    "id": "SIG-04",
                    "source": "Ocean Network Logistics",
                    "author": "Maersk / Hapag Coastal Fleet Advisory",
                    "category": "Carrier Bulletin",
                    "content": "Advisory for MV Pacific Trader (Voyage 2026W carrying shipment SHP-801): Terminal arrival rescheduled. Incurring min 5-8 days feeder queue + potential transshipment roll.",
                    "timestamp": "T-1h",
                    "reliability_score": 0.91,
                    "is_rumor": False,
                    "verified": True,
                    "stream": "EXTERNAL"
                }
            ]
            signals = self.custom_injected_signals + base_signals

            early_warning = {
                "title": "Severe Cyclonic Storm in Bay of Bengal Threatening Chennai Port Corridor",
                "cluster_detected": "Severe Meteorological Disruption & Marine Terminal Closure",
                "severity": "CRITICAL",
                "signal_strength_score": 0.89,
                "corridor": "Bay of Bengal -> Port of Chennai -> Detroit Intermodal",
                "detected_at": "Simulation Tick T-0",
                "detection_archetype": "EXTERNAL_EVENT_SHOCK",
                "summary": "AI identified 4 correlated external signals indicating a major meteorological disruption directly impacting maritime export lanes from Southeast India."
            }

            verification = {
                "status": "CONFIRMED_EVENT",
                "event_confidence_score": 0.94,
                "rumors_filtered_count": 1,
                "cross_checked_sources": [
                    {"source": "IMD Official Alert", "weight": 0.40, "confidence": 0.96, "status": "VERIFIED"},
                    {"source": "Port Authority Harbor Master", "weight": 0.35, "confidence": 0.94, "status": "VERIFIED"},
                    {"source": "Carrier Vessel Schedule Feed", "weight": 0.20, "confidence": 0.91, "status": "VERIFIED"},
                    {"source": "Social Media Observation", "weight": 0.05, "confidence": 0.65, "status": "UNVERIFIED_RUMOR"}
                ],
                "verification_verdict": "Event is 94% confirmed based on triangulated official weather and harbor notices. Social chatter corroborated with zero false-positive penalty."
            }

            impact_mapping = {
                "disruption_epicenter": {
                    "name": "Port of Chennai & Coastal Packaging Cluster",
                    "country": "India",
                    "lat": 13.0827,
                    "lng": 80.2707
                },
                "affected_tier2_supplier": {
                    "supplier_id": "SUP-007",
                    "name": "Apex Semiconductor Packaging Partner (Chennai)",
                    "category": "Packaging & Sensor Bumping"
                },
                "affected_shipment": {
                    "shipment_id": "SHP-801",
                    "component_id": "CMP-MCU-01",
                    "component_name": "Automotive 32-bit Microcontroller",
                    "quantity": 5000,
                    "transport_mode": "Ocean",
                    "carrier": "Maersk Line (MV Pacific Trader)",
                    "origin": "Chennai Port, India",
                    "destination": "Plant 1010, Detroit, MI"
                },
                "affected_facility": {
                    "facility_id": "FAC-1010",
                    "name": "Detroit Advanced Assembly Plant 1010",
                    "on_hand_inventory": 1200,
                    "daily_burn_rate": 250,
                    "days_of_stock_left": 4.8
                },
                "affected_customer_orders": [
                    {
                        "order_id": "ORD-OEM-901",
                        "customer": "Titan Mobility Systems OEM",
                        "contract_value": 2400000.00,
                        "units": 1500,
                        "sla_deadline_days": 12,
                        "status": "AT_CRITICAL_RISK"
                    }
                ],
                "exposure_verdict": "Direct exposure established: In-transit shipment SHP-801 is stranded at Chennai origin. Detroit assembly plant will exhaust stock in 4.8 days, endangering Titan OEM contract."
            }

            risk_prediction = {
                "calibrated_delay_probability": 0.985,
                "delay_probability_pct": 98.5,
                "delay_severity": "CRITICAL",
                "expected_arrival_delay_days": 21.5,
                "lead_time_quantiles": {"P10": 18.2, "P50": 21.5, "P90": 26.0},
                "time_to_shortage_days": 4.8,
                "replacement_lead_time_days": 8.9,
                "coverage_gap_days": 4.1,
                "projected_stockout_date": (datetime.datetime.now() + datetime.timedelta(days=4.8)).strftime("%b %d, %Y"),
                "daily_downtime_penalty_usd": 420000.00,
                "sla_breach_penalty_usd": 93000.00,
                "total_unmitigated_financial_loss_usd": 1815000.00,
                "prediction_summary": "Calibrated ML predicts a 98.5% probability of a +21.5 day arrival delay. Without intervention, Detroit Plant 1010 will deplete inventory in 4.8 days, resulting in a 4.1-day assembly line shutdown and $1,815,000 in unmitigated loss."
            }

            raw_preventive_actions = [
                {
                    "id": "ACT-01",
                    "title": "Expedite Alternative Air Charter via Frankfurt Hub",
                    "action_type": "EXPEDITE_AIR_CHARTER",
                    "is_recommended": True,
                    "cost_usd": 95000.00,
                    "feasibility_pct": 92.0,
                    "execution_lead_time_days": 2.0,
                    "residual_delay_risk_pct": 12.0,
                    "coverage_gap_eliminated_days": 4.1,
                    "gross_loss_avoided_usd": 1815000.00,
                    "net_financial_benefit_usd": 1720000.00,
                    "requires_human_approval": True,
                    "approval_reason": "High-budget operational expenditure ($95,000 exceeds $50,000 autonomous ceiling)",
                    "description": "Charter 5,000 units from backup fab batch via emergency Frankfurt air cargo corridor. Arrives in 2.0 days, completely preventing Detroit plant shutdown."
                },
                {
                    "id": "ACT-02",
                    "title": "Activate Secondary European Supplier (Nordic Precision Sensors)",
                    "action_type": "SECONDARY_SOURCING",
                    "is_recommended": False,
                    "cost_usd": 142000.00,
                    "feasibility_pct": 78.0,
                    "execution_lead_time_days": 4.5,
                    "residual_delay_risk_pct": 28.0,
                    "coverage_gap_eliminated_days": 3.2,
                    "gross_loss_avoided_usd": 1815000.00,
                    "net_financial_benefit_usd": 1673000.00,
                    "requires_human_approval": True,
                    "approval_reason": "Procurement contract value ($142,000) and tooling qualification check required",
                    "description": "Trigger emergency allocation from Nordic Precision in Germany. Higher tooling premium ($142k) with a tighter 4.5-day delivery window."
                },
                {
                    "id": "ACT-03",
                    "title": "Status Quo (Accept Ocean Delay)",
                    "action_type": "DO_NOTHING",
                    "is_recommended": False,
                    "cost_usd": 0.00,
                    "feasibility_pct": 100.0,
                    "execution_lead_time_days": 0.0,
                    "residual_delay_risk_pct": 98.5,
                    "coverage_gap_eliminated_days": 0.0,
                    "gross_loss_avoided_usd": 0.00,
                    "net_financial_benefit_usd": -1815000.00,
                    "requires_human_approval": False,
                    "approval_reason": "Baseline reference only",
                    "description": "No intervention. Assembly line suffers 4.1 days of catastrophic downtime incurring $1.815M in downtime costs and contract cancellation."
                }
            ]

            autonomous_actions = [
                {
                    "action": "AUTO_LOCK_SAFETY_BUFFER",
                    "target": "Plant 1010 Inventory Controller",
                    "detail": "Agent automatically locked Detroit Plant safety stock buffer allocation for priority ORD-OEM-901.",
                    "status": "EXECUTED",
                    "timestamp": "T+10s"
                },
                {
                    "action": "PING_OCEAN_CARRIER_TELEMETRY",
                    "target": "Maersk Line EDI Gateway",
                    "detail": "Agent automatically sent automated EDI 214 telemetry query to monitor vessel anchor coordinates.",
                    "status": "EXECUTED",
                    "timestamp": "T+15s"
                },
                {
                    "action": "HOLD_AIR_FREIGHT_SLOT",
                    "target": "Lufthansa Cargo Booking Gateway (FRA)",
                    "detail": "Agent placed temporary 4-hour hold on 5,000kg air pallet slot without financial liability.",
                    "status": "EXECUTED",
                    "timestamp": "T+20s"
                }
            ]

        # Attach alternative issues analysis (Gemini AI + Fallback)
        preventive_actions = []
        for act in raw_preventive_actions:
            act_copy = act.copy()
            act_copy["alternative_issues_analysis"] = self._get_alternative_analysis(
                alt_id=act["id"],
                title=act["title"],
                action_type=act["action_type"],
                cost_usd=act["cost_usd"]
            )
            preventive_actions.append(act_copy)

        human_approval_state = {
            "status": self.human_decision or ("PENDING" if self.stage_index >= 7 else "NOT_REACHED"),
            "proposed_action": preventive_actions[0],
            "budget_amount_usd": preventive_actions[0]["cost_usd"],
            "autonomous_actions_taken": autonomous_actions,
            "escalation_reason": f"Expenditure of ${preventive_actions[0]['cost_usd']:,.2f} exceeds autonomous decision threshold of $50,000. Operational policy requires human supervisor validation before releasing airline charter/PO funds.",
            "decision_options": [
                {
                    "key": "approve",
                    "label": "Approve Action",
                    "description": "Authorize $95,000 expedited air freight. Agent will issue emergency PO and commit air cargo space.",
                    "theme": "emerald"
                },
                {
                    "key": "request_evidence",
                    "label": "Request Evidence",
                    "description": "Direct Agent to produce supporting satellite imagery, carrier logs, and tariff documentation before approval.",
                    "theme": "amber"
                },
                {
                    "key": "block",
                    "label": "Block Action",
                    "description": "Reject air charter expenditure. Fall back to secondary supplier or accept shutdown.",
                    "theme": "red"
                }
            ],
            "notes": self.human_decision_notes
        }

        outcome_tracking = {
            "incident_id": f"INC-2026-CHENN-{(self.human_decision or 'AUTO')[:3].upper()}",
            "recorded_at": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "final_decision": self.human_decision or "PENDING",
            "downtime_avoided_days": 4.1 if self.human_decision == "approve" else 0.0,
            "financial_savings_usd": 1720000.00 if self.human_decision == "approve" else 0.0,
            "customer_contract_status": "FULFILLED_ON_TIME" if self.human_decision == "approve" else "BREACHED",
            "model_learning": {
                "brier_score_improvement": -0.042,
                "mae_reduction_days": -1.2,
                "new_model_version": "v1.2-calibrated",
                "retraining_dataset_size": 1205,
                "learning_summary": "Incident resolved and archived to SQLite store. GradientBoosting delay weights updated with 0.985 ground-truth confirmation."
            }
        }

        return {
            "scenario": scenario,
            "current_stage_index": self.stage_index,
            "current_stage_name": STAGE_NAMES[self.stage_index] if self.stage_index < len(STAGE_NAMES) else STAGE_NAMES[-1],
            "total_stages": len(STAGE_NAMES),
            "status": self.status,
            "sample_data_summary": sample_summary,
            "signals": signals,
            "early_warning": early_warning,
            "verification": verification,
            "impact_mapping": impact_mapping,
            "risk_prediction": risk_prediction,
            "preventive_actions": preventive_actions,
            "autonomous_actions": autonomous_actions,
            "human_approval": human_approval_state,
            "outcome_tracking": outcome_tracking,
            "dual_stream_telemetry": {
                "internal_telemetry": int_telemetry,
                "external_signals": ext_stream,
                "cross_stream_correlation": cross_stream
            },
            "emergency_notification": notification_service.get_latest_dispatch_for("7736215631"),
            "notification_history": notification_service.get_dispatch_history(limit=5),
            "agent_thought_trace": self.agent_thought_trace,
            "last_updated": self.last_updated
        }

    def step(self) -> Dict[str, Any]:
        """Advances the pipeline by exactly one step."""
        if self.stage_index >= 8:
            self.status = "COMPLETED"
            return self.get_state()

        # If we are at stage 7 and no human decision has been made, stay paused!
        if self.stage_index == 7 and not self.human_decision:
            self.status = "AWAITING_HUMAN_APPROVAL"
            return self.get_state()

        self.stage_index += 1
        now_str = datetime.datetime.now().strftime("%H:%M:%S")

        # Add agent thoughts based on current stage and scenario
        is_internal = self.scenario_id == "INTERNAL_LEAD_TIME_DRIFT"

        if self.stage_index == 1:
            self.status = "RUNNING"
            thought_msg = (
                "DUAL-STREAM PERCEPTION: Polled SAP S/4HANA PO histories and SAP IBP consumption. "
                "External channels completely quiet (0 weather warnings, 0 news articles, 0 tweets). "
                "Internal SAP ledger detected supplier lead times crept from 14.1d to 22.4d (+59%)."
                if is_internal else
                "Ingested 4 external signals from X/Twitter, Indian Meteorological Dept, Chennai Port Authority, and Maersk schedule bulletins."
            )
            self.agent_thought_trace.append({
                "timestamp": now_str,
                "agent": "Sentinel Perception Agent",
                "role": "Signal Ingestion",
                "thought": thought_msg,
                "action": "INGEST_DUAL_STREAM_SIGNALS",
                "type": "info"
            })

            # Automated emergency SMS dispatch to Operations Commander (7736215631)
            scen_def = get_scenario_definition(self.scenario_id)
            sms_rec = notification_service.dispatch_sms(
                phone_number="7736215631",
                issue_title=scen_def.get("title", "Supply Chain Disruption Detected"),
                delay_days=8.4 if is_internal else 4.5,
                var_usd=2604000.0 if is_internal else 2400000.0,
                coverage_gap_days=6.2 if is_internal else 4.1,
                affected_entity="PO-501" if is_internal else "SHP-801",
                component_id="CMP-MCU-01",
                scenario_id=self.scenario_id
            )
            self.agent_thought_trace.append({
                "timestamp": now_str,
                "agent": "Telephony Dispatch Sentry",
                "role": "Emergency Incident Paging",
                "thought": f"EMERGENCY SMS DISPATCHED to Operations Commander (7736215631). Status: {sms_rec['delivery_status']} via {sms_rec['carrier']}.",
                "action": "DISPATCH_EMERGENCY_SMS",
                "type": "warning"
            })
        elif self.stage_index == 2:
            thought_msg = (
                "SILENT DRIFT CLUSTERED: Pattern recognition identified unannounced supplier degradation (+8.4d) coupled with SAP IBP accelerated assembly burn rate (+26%). Zero public announcements required."
                if is_internal else
                "Clustered weather and port signals: Severe Cyclonic Storm 'Senyar' detected directly threatening Chennai maritime shipping corridor (Signal Strength: 89%)."
            )
            self.agent_thought_trace.append({
                "timestamp": now_str,
                "agent": "Pattern Recognition Agent",
                "role": "Early Warning Detection",
                "thought": thought_msg,
                "action": "DETECT_EARLY_WARNING",
                "type": "warning"
            })
        elif self.stage_index == 3:
            thought_msg = (
                "INTERNAL VERIFICATION: Corroborated anomaly across 3 internal enterprise sources (SAP S/4HANA EKBE/EKPO, IBP MARD, Ariba Network). Confidence: 98%. Zero reliance on public media."
                if is_internal else
                "Cross-checked 4 sources. Confirmed event with 94% confidence. Filtered out 1 unverified social media rumor. Event status: CONFIRMED."
            )
            self.agent_thought_trace.append({
                "timestamp": now_str,
                "agent": "Verification & Triangulation Agent",
                "role": "Information Verification",
                "thought": thought_msg,
                "action": "VERIFY_INFORMATION",
                "type": "success"
            })
        elif self.stage_index == 4:
            thought_msg = (
                "IMPACT MAPPED: Apex Semiconductor delivery delay of +8.4d will deplete Detroit Plant 1010 inventory in 5.2 days, creating an unannounced 6.2-day shutdown endangering Titan OEM contract ($2.4M)."
                if is_internal else
                "Mapped BOM & route dependencies: Shipment SHP-801 carrying 5,000 MCUs blocked at Chennai Port. Destination Plant 1010 has 4.8 days stock remaining. Customer contract ORD-OEM-901 endangered."
            )
            self.agent_thought_trace.append({
                "timestamp": now_str,
                "agent": "Supply-Chain Knowledge Graph Agent",
                "role": "Impact Mapping",
                "thought": thought_msg,
                "action": "MAP_SUPPLY_CHAIN_IMPACT",
                "type": "warning"
            })
        elif self.stage_index == 5:
            thought_msg = (
                "PREDICTIVE FORECAST: Calibrated ML predicts 97.5% probability of assembly line starvation. Stockout in 5.2 days leaves 6.2-day coverage gap. Unmitigated loss: $2,604,000 in idle labor and SLA fines."
                if is_internal else
                "Predictive forecast: 98.5% delay probability (+21.5 days lead time). Stockout in 4.8 days creates a 4.1-day assembly shutdown. Unmitigated loss: $1,815,000."
            )
            self.agent_thought_trace.append({
                "timestamp": now_str,
                "agent": "Calibrated ML Predictor Agent",
                "role": "Risk Prediction",
                "thought": thought_msg,
                "action": "PREDICT_OPERATIONAL_RISKS",
                "type": "danger"
            })
        elif self.stage_index == 6:
            thought_msg = (
                "PREVENTIVE RECOMMENDATIONS: Option #1 (Issue Emergency BAPI PO to Secondary Supplier Nordic Precision) recommended: Cost $142k, lead time 4.5d, avoids $2.604M downtime. Compliant under EAR STA & EU CBAM green certification."
                if is_internal else
                "Evaluated 3 alternatives with Gemini AI / Compliance Engine. Option #1 (Air Charter via Frankfurt Hub) recommended: Cost $95k, 2-day transit, solves 4.1d gap, net benefit +$1.72M. Compliant under EAR STA exception & IATA PI 965."
            )
            self.agent_thought_trace.append({
                "timestamp": now_str,
                "agent": "Strategy & Compliance Intelligence Agent",
                "role": "Preventive Recommendations & Legal Analysis",
                "thought": thought_msg,
                "action": "RECOMMEND_PREVENTIVE_ACTIONS",
                "type": "info"
            })
        elif self.stage_index == 7:
            auto_msg = (
                "AUTONOMOUS DECISIONS EXECUTED: Pre-staged SAP BAPI_PO_CREATE1 for 1,500 units, dynamically adjusted MD04 safety stock buffer from 500 to 1,200 units, and dispatched EDI 860 notice."
                if is_internal else
                "AUTONOMOUS DECISIONS EXECUTED: Pre-reserved 4-hour Frankfurt air freight slot, pinged carrier EDI gateway, and locked Detroit safety buffer. Zero financial liability committed."
            )
            esc_msg = (
                "HUMAN APPROVAL REQUIRED: Action commits $142,000 procurement expenditure (exceeds $50k autonomous ceiling). Pausing pipeline for Human Supervisor authorization."
                if is_internal else
                "HUMAN APPROVAL REQUIRED: Action requires $95,000 expenditure (exceeds $50k autonomous ceiling). Pausing pipeline for Human Supervisor authorization."
            )
            self.agent_thought_trace.append({
                "timestamp": now_str,
                "agent": "Autonomous Execution Agent",
                "role": "Routine Autonomous Action",
                "thought": auto_msg,
                "action": "EXECUTE_AUTONOMOUS_LOW_RISK_ACTIONS",
                "type": "success"
            })
            self.agent_thought_trace.append({
                "timestamp": now_str,
                "agent": "Decision Governance Agent",
                "role": "Human-in-the-Loop Escalation",
                "thought": esc_msg,
                "action": "ESCALATE_TO_HUMAN",
                "type": "warning"
            })
            self.status = "AWAITING_HUMAN_APPROVAL"
        elif self.stage_index == 8:
            dec_upper = (self.human_decision or 'AUTO').upper()
            self.agent_thought_trace.append({
                "timestamp": now_str,
                "agent": "Incident Memory & Learning Agent",
                "role": "Outcome Tracking & Continuous Learning",
                "thought": f"Final outcome recorded: Human decision was '{dec_upper}'. ERP actions released. Incident saved to SQLite store. Model weights recalibrated (v1.2). Pipeline complete!",
                "action": "TRACK_OUTCOMES_AND_LEARN",
                "type": "success"
            })
            self.status = "COMPLETED"

        self.last_updated = datetime.datetime.now().isoformat()
        return self.get_state()

    def run_all(self) -> Dict[str, Any]:
        """Runs the pipeline until it pauses for Human Approval or finishes."""
        while self.stage_index < 7:
            self.step()
        
        # When it reaches stage 7, it executes autonomous actions and pauses for human decision
        if self.stage_index == 7 and not self.human_decision:
            self.status = "AWAITING_HUMAN_APPROVAL"
            return self.get_state()
            
        if self.stage_index == 7 and self.human_decision:
            self.step()

        return self.get_state()

    def submit_human_decision(self, decision: str, notes: str = "") -> Dict[str, Any]:
        """
        Receives human-in-the-loop decision:
        - "approve": commits the recommended action
        - "request_evidence": requests supporting documentation
        - "block": rejects the recommended action
        """
        valid_decisions = ["approve", "request_evidence", "block"]
        decision = decision.lower().strip()
        if decision not in valid_decisions:
            decision = "approve"

        self.human_decision = decision
        self.human_decision_notes = notes
        now_str = datetime.datetime.now().strftime("%H:%M:%S")

        if decision == "approve":
            self.agent_thought_trace.append({
                "timestamp": now_str,
                "agent": "Human Operator (Supervisor)",
                "role": "Decision Authorization",
                "thought": f"HUMAN APPROVED: Authorized $95,000 emergency air charter for shipment SHP-801. Notes: {notes or 'Approved by Operations Manager'}.",
                "action": "HUMAN_APPROVED",
                "type": "success"
            })
            self.stage_index = 8
            self.status = "COMPLETED"
            
            try:
                incident_store.record_completed_incident(
                    scenario_id=self.scenario_id,
                    title="Chennai Cyclone Air Freight Expedite",
                    category="METEOROLOGICAL_CYCLONE",
                    location="Chennai, India / Detroit, USA",
                    signals=self.get_state()["signals"],
                    evolution=[],
                    exposure=self.get_state()["impact_mapping"],
                    predictions=self.get_state()["risk_prediction"],
                    decision={"outcome": "APPROVED", "operator_notes": notes, "authorized_cost_usd": 95000.00},
                    execution={"mode": "AIR_CHARTER_VIA_FRANKFURT", "bapi_po": "4500892001"},
                    actual_outcome={"downtime_avoided_days": 4.1, "savings_usd": 1720000.00, "customer_sla": "MAINTAINED"},
                    keywords="cyclone chennai air freight expedite mcu plant 1010"
                )
            except Exception as e:
                print("Failed to save to incident store:", e)

        elif decision == "request_evidence":
            self.agent_thought_trace.append({
                "timestamp": now_str,
                "agent": "Human Operator (Supervisor)",
                "role": "Evidence Request",
                "thought": f"HUMAN REQUESTED EVIDENCE: Requested radar telemetry & carrier quotes before release. Notes: {notes or 'Verifying air cargo quote validity'}.",
                "action": "HUMAN_REQUESTED_EVIDENCE",
                "type": "warning"
            })
            self.agent_thought_trace.append({
                "timestamp": now_str,
                "agent": "Evidence Triangulation Agent",
                "role": "Telemetry Assembly",
                "thought": "Retrieved IMD radar Doppler sweep #204 & Lufthansa Cargo charter quote #FRA-90214 ($94,820 confirmed). Re-submitting for final approval.",
                "action": "DELIVER_EVIDENCE",
                "type": "info"
            })
            self.status = "AWAITING_HUMAN_APPROVAL"

        elif decision == "block":
            self.agent_thought_trace.append({
                "timestamp": now_str,
                "agent": "Human Operator (Supervisor)",
                "role": "Decision Veto",
                "thought": f"HUMAN BLOCKED: Rejected $95,000 air charter expenditure. Notes: {notes or 'Action blocked due to budget constraints'}.",
                "action": "HUMAN_BLOCKED",
                "type": "danger"
            })
            self.stage_index = 8
            self.status = "COMPLETED"

            try:
                incident_store.record_completed_incident(
                    scenario_id=self.scenario_id,
                    title="Chennai Cyclone Air Freight Expedite (Blocked)",
                    category="METEOROLOGICAL_CYCLONE",
                    location="Chennai, India / Detroit, USA",
                    signals=self.get_state()["signals"],
                    evolution=[],
                    exposure=self.get_state()["impact_mapping"],
                    predictions=self.get_state()["risk_prediction"],
                    decision={"outcome": "BLOCKED", "operator_notes": notes},
                    execution={"mode": "STATUS_QUO"},
                    actual_outcome={"downtime_incurred_days": 4.1, "loss_usd": 1815000.00, "customer_sla": "BREACHED"},
                    keywords="cyclone chennai blocked status quo"
                )
            except Exception as e:
                print("Failed to save to incident store:", e)

        self.last_updated = datetime.datetime.now().isoformat()
        return self.get_state()


# Global pipeline instance
workflow_pipeline = SimpleAgentWorkflow()
