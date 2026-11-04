"""
ChainGuard AI - Multi-Tier Supply Chain Stage Progression Engine
Models the sequential propagation of disruptions and mitigations across every
tier of the supply chain: from Tier-2 semiconductor fab to logistics corridor,
to manufacturing assembly line, distribution hub, customer contract SLA,
and into the closed-loop learning engine.
"""
from typing import Dict, Any, List, Optional
import datetime
import uuid


class SupplyChainStageProgressionEngine:
    def __init__(self):
        self.active_progressions: Dict[str, Dict[str, Any]] = {}
        self._init_default_progression()

    def _init_default_progression(self):
        default_chain_id = "SC-EV-MOTOR-SYS-01"
        self.active_progressions[default_chain_id] = {
            "chain_id": default_chain_id,
            "product_name": "Industrial EV Inverter & Motor Traction System (FG-EV-MOTOR-01)",
            "primary_component": "32-Bit Automotive Master MCU (CMP-MCU-01)",
            "current_stage_index": 2,  # In-Transit Logistics & Customs
            "stages": [
                {
                    "stage_index": 1,
                    "stage_id": "STAGE-1-TIER2-FAB",
                    "stage_name": "Tier-2 Material & Semiconductor Fab",
                    "facility_name": "Apex Semiconductor Fab 3 (Hsinchu Science Park, Taiwan)",
                    "tier_level": "Tier-2 Component Supplier",
                    "status": "COMPLETED",
                    "emerging_issue": {
                        "category": "SUPPLIER_FORCE_MAJEURE",
                        "description": "Grid power curtailment and wafer allocation limits threaten production batch completion.",
                        "severity": "ELEVATED",
                        "impact_days": 2.0
                    },
                    "mitigation": {
                        "action_code": "ACT-SLA-RESERVE-01",
                        "action_title": "Invoke Master Service SLA Priority Reservation Clause 14.b",
                        "details": "Apex Semiconductor dedicated buffer pool allocated 1,200 tested MCU units to priority cleanroom staging.",
                        "cost": 3500.0,
                        "status": "EXECUTED",
                        "verified_by": "SAP S/4HANA Vendor Portal Confirmation"
                    },
                    "outcome_metrics": {
                        "lead_time_variance_days": 0.0,
                        "units_secured": 1200,
                        "stage_cleared_at": (datetime.datetime.now() - datetime.timedelta(days=2)).isoformat()
                    }
                },
                {
                    "stage_index": 2,
                    "stage_id": "STAGE-2-LOGISTICS-CUSTOMS",
                    "stage_name": "In-Transit Multi-Modal Logistics & Customs Clearance",
                    "facility_name": "Transpacific Corridor -> Port of Long Beach / San Pedro Bay",
                    "tier_level": "Tier-1 Freight & Port Transit",
                    "status": "IN_PROGRESS",
                    "emerging_issue": {
                        "category": "PORT_BERTH_BOTTLENECK_AND_EXPORT_CONTROL",
                        "description": "Crane failure at Pier T causes 4.5-day berth dwell queue. EAR dual-use classification ECCN 3A001 requires export documentation clearance.",
                        "severity": "CRITICAL",
                        "impact_days": 4.5
                    },
                    "mitigation": {
                        "action_code": "ACT-AIR-EXPEDITE-02",
                        "action_title": "Expedited Dedicated Air Charter via Anchorage + SNAP-R Form BIS-748P",
                        "details": "Reroute critical batch onto Atlas Air 747F Cargo-Only freighter; electronically file EAR99/TSR license exception to ensure immediate CBP customs release.",
                        "cost": 14200.0,
                        "status": "READY_FOR_EXECUTION",
                        "verified_by": "IATA Cargo Manifest & U.S. BIS Electronic Registration"
                    },
                    "outcome_metrics": {
                        "days_saved": 4.0,
                        "net_arrival_date": (datetime.datetime.now() + datetime.timedelta(days=3)).strftime("%Y-%m-%d"),
                        "compliance_status": "FULLY_COMPLIANT"
                    }
                },
                {
                    "stage_index": 3,
                    "stage_id": "STAGE-3-MANUFACTURING-PLANT",
                    "stage_name": "Advanced Assembly & SMT Production Line",
                    "facility_name": "Detroit Advanced Assembly Facility (Plant 1010)",
                    "tier_level": "Internal Manufacturing OEM",
                    "status": "PENDING",
                    "emerging_issue": {
                        "category": "LINE_STARVATION_RISK",
                        "description": "On-hand safety buffer of CMP-MCU-01 will deplete in 5.2 days. Line stoppage would cost $18,400/hr in idle labor and fixed tooling costs.",
                        "severity": "CRITICAL",
                        "impact_days": 5.0
                    },
                    "mitigation": {
                        "action_code": "ACT-LAT-TRANSFER-03",
                        "action_title": "Emergency Lateral Transfer from Austin Sister Hub (400 units)",
                        "details": "Transfer surplus buffer units via dedicated hotshot carrier to maintain SMT feeder line continuity while air charter is in transit.",
                        "cost": 4200.0,
                        "status": "PLANNED",
                        "verified_by": "SAP S/4HANA Inter-Plant STO (BAPI_PO_CREATE1)"
                    },
                    "outcome_metrics": {
                        "line_shutdown_prevented": True,
                        "buffer_coverage_extended_days": 6.8
                    }
                },
                {
                    "stage_index": 4,
                    "stage_id": "STAGE-4-DISTRIBUTION-HUB",
                    "stage_name": "Central Distribution Hub & Finished Goods Staging",
                    "facility_name": "Detroit Logistics Distribution Center Bay 4",
                    "tier_level": "Outbound Finished Goods Logistics",
                    "status": "PENDING",
                    "emerging_issue": {
                        "category": "FINISHED_GOODS_STOCKOUT",
                        "description": "Downstream inventory of complete EV Inverter Units risks falling below minimum SLA buffer floor.",
                        "severity": "ELEVATED",
                        "impact_days": 2.5
                    },
                    "mitigation": {
                        "action_code": "ACT-CROSS-DOCK-04",
                        "action_title": "Direct Cross-Dock Priority Staging & Batch Split",
                        "details": "Bypass warehouse long-term storage racks; immediately transfer finished units from assembly inspection directly onto outbound temperature-controlled trailers.",
                        "cost": 1800.0,
                        "status": "PLANNED",
                        "verified_by": "SAP EWM Outbound Delivery Order (ODO)"
                    },
                    "outcome_metrics": {
                        "dwell_time_reduced_hours": 36.0,
                        "outbound_sla_readiness": "100%"
                    }
                },
                {
                    "stage_index": 5,
                    "stage_id": "STAGE-5-CUSTOMER-SLA",
                    "stage_name": "End Customer Delivery & Contract SLA Fulfillment",
                    "facility_name": "Titan Mobility Assembly Complex (Customer Site)",
                    "tier_level": "Tier-1 Automotive Customer",
                    "status": "PENDING",
                    "emerging_issue": {
                        "category": "CONTRACT_SLA_LIQUIDATED_DAMAGES",
                        "description": "Breach of scheduled delivery window triggers $45,000/day SLA penalty and risks OEM line stoppage.",
                        "severity": "HIGH",
                        "impact_days": 3.0
                    },
                    "mitigation": {
                        "action_code": "ACT-SLA-PRESERVATION-05",
                        "action_title": "Partial Lot Advance Delivery + SAP GTT Automated Milestone Transmission",
                        "details": "Deliver advance lot of 200 units to preserve Titan Mobility assembly shift; provide real-time EDI-856 tracking token, averting all liquidated damages.",
                        "cost": 1200.0,
                        "status": "PLANNED",
                        "verified_by": "SAP Global Track & Trace (GTT) Milestone Event Token"
                    },
                    "outcome_metrics": {
                        "penalties_avoided": 135000.0,
                        "customer_retention_score": "EXCELLENT"
                    }
                }
            ]
        }

    def get_progression(self, chain_id: str = "SC-EV-MOTOR-SYS-01") -> Dict[str, Any]:
        if chain_id not in self.active_progressions:
            self._init_default_progression()
        return self.active_progressions.get(chain_id, self.active_progressions["SC-EV-MOTOR-SYS-01"])

    def advance_to_next_stage(self, chain_id: str, stage_index: int, custom_feedback: Optional[str] = None) -> Dict[str, Any]:
        """
        Advances the supply chain progression to the next stage after executing mitigations.
        """
        progression = self.get_progression(chain_id)
        current_idx = progression["current_stage_index"]
        
        # Mark current stage as COMPLETED
        for stage in progression["stages"]:
            if stage["stage_index"] == stage_index:
                stage["status"] = "COMPLETED"
                stage["mitigation"]["status"] = "EXECUTED"
                stage["completed_at"] = datetime.datetime.now().isoformat()
                if custom_feedback:
                    stage["execution_notes"] = custom_feedback
            elif stage["stage_index"] == stage_index + 1:
                stage["status"] = "IN_PROGRESS"
                stage["mitigation"]["status"] = "ACTIVE_EVALUATION"

        progression["current_stage_index"] = min(stage_index + 1, len(progression["stages"]))
        progression["last_updated"] = datetime.datetime.now().isoformat()
        return progression


# Global instance
stage_engine = SupplyChainStageProgressionEngine()

