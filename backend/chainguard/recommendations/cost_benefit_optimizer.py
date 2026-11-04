"""
ChainGuard AI - Preventive Action & Cost-Benefit Optimizer
Evaluates candidate preventive actions against taking no action (status quo),
weighing implementation cost, lead time, feasibility, risk reduction, and unintended side-effects.
"""
from typing import Dict, Any, List
from chainguard.recommendations.verification_rules import VerificationEngine


class PreventiveActionOptimizer:
    def __init__(self):
        self.verifier = VerificationEngine()

    def optimize_actions(self, 
                         component_id: str, 
                         consequence_data: Dict[str, Any], 
                         prediction_data: Dict[str, Any],
                         component_row: Dict[str, Any],
                         supplier_row: Dict[str, Any],
                         alt_supplier_row: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Generates and ranks preventive actions when risk crosses threshold.
        """
        unmitigated_loss = consequence_data.get("total_unmitigated_loss_usd", 0.0)
        coverage_gap = consequence_data.get("coverage_gap_days", 0.0)
        p_delay = prediction_data.get("p_delay_ge_3d", 0.0)
        daily_consumption = consequence_data.get("daily_consumption_rate", 70.0)
        needed_quantity = daily_consumption * max(3.0, coverage_gap)
        unit_cost = float(component_row.get("unit_cost_usd", 85.0))

        # Baseline: DO NOTHING
        do_nothing_option = {
            "action_id": "ACT-DO-NOTHING",
            "title": "Status Quo (Take No Preventive Action)",
            "action_type": "DO_NOTHING",
            "cost_usd": 0.0,
            "feasibility_pct": 100.0,
            "execution_lead_time_days": 0.0,
            "post_action_delay_risk_pct": round(p_delay * 100, 1),
            "expected_risk_reduction_pct": 0.0,
            "coverage_gap_remaining_days": round(coverage_gap, 1),
            "unmitigated_loss_usd": round(unmitigated_loss, 2),
            "net_financial_benefit_usd": 0.0,
            "roi_ratio": 0.0,
            "unintended_consequences": [
                f"Assembly plant shuts down for {coverage_gap:.1f} days.",
                "Customer contractual SLA penalties trigger on Tier 1 orders.",
                "Loss of customer goodwill and possible contract cancellation."
            ],
            "verification_flags": [],
            "recommendation_rank": 99
        }

        candidate_actions = []

        # 1. Action: Air Freight Expedite / Courier Reroute
        if coverage_gap > 0:
            expedite_cost = 8_500.0 + (needed_quantity * 2.50)  # Air cargo surcharge
            avoided_losses = unmitigated_loss * 0.95
            net_benefit = avoided_losses - expedite_cost
            roi = round(avoided_losses / max(1.0, expedite_cost), 1)

            verif = self.verifier.inspect_action_prerequisites("AIR_EXPEDITE", {
                "current_status": "At Port",
                "component_id": component_id
            })

            candidate_actions.append({
                "action_id": "ACT-AIR-01",
                "title": f"Air Freight Expedite for {int(needed_quantity)} Units",
                "action_type": "AIR_EXPEDITE",
                "cost_usd": round(expedite_cost, 2),
                "feasibility_pct": 94.0,
                "execution_lead_time_days": 2.0,
                "post_action_delay_risk_pct": 8.0,
                "expected_risk_reduction_pct": round((p_delay - 0.08) * 100, 1),
                "coverage_gap_remaining_days": 0.0,
                "unmitigated_loss_usd": 0.0,
                "net_financial_benefit_usd": round(net_benefit, 2),
                "roi_ratio": roi,
                "unintended_consequences": [
                    "Increased freight emissions (~3.4x vs ocean transit).",
                    "Requires expedited import customs brokerage processing."
                ],
                "verification_flags": verif,
                "description": f"Divert {int(needed_quantity)} units from ocean freight to expedited priority air transit. Bypasses port congestion to deliver in 48 hours."
            })

        # 2. Action: Reserve Capacity with Alternative Dual-Sourced Supplier
        if alt_supplier_row is not None and not alt_supplier_row.empty:
            alt_name = str(alt_supplier_row.get("name").iloc[0])
            alt_lead_time = float(alt_supplier_row.get("lead_time_days_mean").iloc[0])
            premium_pct = 0.12  # 12% spot order premium
            alt_order_cost = needed_quantity * unit_cost * (1.0 + premium_pct)
            avoided_losses = unmitigated_loss * 0.90
            # Net cost is the premium over standard unit cost
            net_action_cost = (needed_quantity * unit_cost * premium_pct) + 2_500.0  # Expedite setup
            net_benefit = avoided_losses - net_action_cost
            roi = round(avoided_losses / max(1.0, net_action_cost), 1)

            verif = self.verifier.inspect_action_prerequisites("SECONDARY_SUPPLIER", {
                "alternative_supplier_name": alt_name,
                "component_id": component_id
            })

            candidate_actions.append({
                "action_id": "ACT-SUP-02",
                "title": f"Trigger Dual-Source PO with {alt_name}",
                "action_type": "SECONDARY_SUPPLIER",
                "cost_usd": round(net_action_cost, 2),
                "feasibility_pct": 88.0,
                "execution_lead_time_days": round(alt_lead_time * 0.5, 1),
                "post_action_delay_risk_pct": 12.0,
                "expected_risk_reduction_pct": round((p_delay - 0.12) * 100, 1),
                "coverage_gap_remaining_days": 0.5,
                "unmitigated_loss_usd": 0.0,
                "net_financial_benefit_usd": round(net_benefit, 2),
                "roi_ratio": roi,
                "unintended_consequences": [
                    f"Unit procurement cost increases by {premium_pct*100:.0f}% for this batch.",
                    "Secondary supplier batch requires incoming lot QA signoff."
                ],
                "verification_flags": verif,
                "description": f"Allocate emergency split purchase order of {int(needed_quantity)} units to qualified dual-supplier {alt_name} with fast domestic dispatch."
            })

        # 3. Action: Lateral Stock Transfer from Sister Plant
        lateral_cost = 2_200.0  # Dedicated hotshot cross-state freight
        avoided_losses = unmitigated_loss * 0.98
        net_benefit = avoided_losses - lateral_cost
        roi = round(avoided_losses / max(1.0, lateral_cost), 1)
        verif_lat = self.verifier.inspect_action_prerequisites("LATERAL_TRANSFER", {
            "donor_facility_name": "Austin Assembly Hub",
            "component_id": component_id
        })

        candidate_actions.append({
            "action_id": "ACT-LAT-03",
            "title": f"Lateral Stock Transfer of {int(needed_quantity * 0.75)} Units from Austin Hub",
            "action_type": "LATERAL_TRANSFER",
            "cost_usd": lateral_cost,
            "feasibility_pct": 92.0,
            "execution_lead_time_days": 1.5,
            "post_action_delay_risk_pct": 5.0,
            "expected_risk_reduction_pct": round((p_delay - 0.05) * 100, 1),
            "coverage_gap_remaining_days": 0.0,
            "unmitigated_loss_usd": 0.0,
            "net_financial_benefit_usd": round(net_benefit, 2),
            "roi_ratio": roi,
            "unintended_consequences": [
                "Reduces buffer safety stock at Austin plant from 25 days down to 14 days.",
                "Must monitor Austin demand burn-rate closely."
            ],
            "verification_flags": verif_lat,
            "description": "Dispatch direct team-driver hotshot carrier to transfer surplus buffer stock from Austin to Detroit within 36 hours."
        })

        # 4. Action: Production Line Re-sequencing & SKU Priority Swap
        resequence_cost = 4_500.0  # Line tooling swap cost
        avoided_losses = unmitigated_loss * 0.75
        net_benefit = avoided_losses - resequence_cost
        roi = round(avoided_losses / max(1.0, resequence_cost), 1)
        verif_seq = self.verifier.inspect_action_prerequisites("PRODUCTION_RESEQUENCE", {})

        candidate_actions.append({
            "action_id": "ACT-SEQ-04",
            "title": "Re-sequence Production: Swap Line to Unblocked SKU (Industrial Robot V3)",
            "action_type": "PRODUCTION_RESEQUENCE",
            "cost_usd": resequence_cost,
            "feasibility_pct": 85.0,
            "execution_lead_time_days": 0.8,
            "post_action_delay_risk_pct": 18.0,
            "expected_risk_reduction_pct": round((p_delay - 0.18) * 100, 1),
            "coverage_gap_remaining_days": 1.0,
            "unmitigated_loss_usd": unmitigated_loss * 0.25,
            "net_financial_benefit_usd": round(net_benefit, 2),
            "roi_ratio": roi,
            "unintended_consequences": [
                "Standard commercial order will finish ahead of schedule while Tier 1 OEM wait is rescheduled.",
                "Requires minor tooling changeover."
            ],
            "verification_flags": verif_seq,
            "description": "Keep factory shifts fully productive by advancing build schedule for units with 100% available component coverage."
        })

        # Rank candidate actions by Net Financial Benefit & ROI
        candidate_actions.sort(key=lambda a: a["net_financial_benefit_usd"], reverse=True)
        for i, act in enumerate(candidate_actions):
            act["recommendation_rank"] = i + 1

        top_recommendation = candidate_actions[0] if candidate_actions else do_nothing_option

        return {
            "component_id": component_id,
            "recommended_action": top_recommendation,
            "all_evaluated_options": candidate_actions,
            "do_nothing_baseline": do_nothing_option,
            "threshold_crossed": p_delay >= 0.45 or coverage_gap > 0.0,
            "summary": f"Identified {len(candidate_actions)} viable preventive actions. Top recommendation: '{top_recommendation['title']}' delivers net projected savings of ${top_recommendation['net_financial_benefit_usd']:,.0f}."
        }

