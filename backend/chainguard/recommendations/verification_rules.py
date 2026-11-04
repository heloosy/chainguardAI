"""
ChainGuard AI - Verification Rules & Data Quality Engine
Flags assumptions that require human or supplier confirmation before executing recommendations.
"""
from typing import Dict, Any, List


class VerificationEngine:
    @staticmethod
    def inspect_action_prerequisites(action_type: str, context: Dict[str, Any]) -> List[Dict[str, Any]]:
        flags = []
        
        if action_type == "AIR_EXPEDITE":
            container_status = context.get("current_status", "")
            if container_status in ["At Port", "In Transit"]:
                flags.append({
                    "requirement": "Intermodal Re-routing Feasibility",
                    "status": "VERIFICATION_REQUIRED",
                    "instruction": "Confirm with freight forwarder that container has not already cleared sea-side gantry and can be intercepted for air freight split.",
                    "risk_if_unverified": "Carrier fee charged without expediting cargo if manifest is locked."
                })
        
        elif action_type == "SECONDARY_SUPPLIER":
            alt_sup = context.get("alternative_supplier_name", "Alternative Supplier")
            flags.append({
                "requirement": "Real-Time Lot Availability & Tolerance Spec",
                "status": "VERIFICATION_REQUIRED",
                "instruction": f"Contact {alt_sup} rep to verify unallocated spot inventory meets automotive temperature grade tolerances.",
                "risk_if_unverified": "Component may fail line quality inspection on delivery."
            })
            
        elif action_type == "LATERAL_TRANSFER":
            donor_plant = context.get("donor_facility_name", "Sister Facility")
            flags.append({
                "requirement": "Physical Inventory Count Reconciliation",
                "status": "VERIFICATION_REQUIRED",
                "instruction": f"Request physical cycle count at {donor_plant} to confirm ERP stock matches physical rack inventory.",
                "risk_if_unverified": "Ghost inventory in ERP could leave donor plant starved unexpectedly."
            })
            
        elif action_type == "PRODUCTION_RESEQUENCE":
            flags.append({
                "requirement": "Plant Tooling & Changeover Crew Readiness",
                "status": "VERIFICATION_REQUIRED",
                "instruction": "Confirm shift supervisor has tooling fixtures ready for alternative SKU line switch.",
                "risk_if_unverified": "Unscheduled changeover downtime may exceed savings."
            })

        return flags

