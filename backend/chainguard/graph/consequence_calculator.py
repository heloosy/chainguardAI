"""
ChainGuard AI - Consequence Calculator
Calculates exact coverage gaps, stockout dates, plant idle costs,
cascading assembly halts, and customer contract SLA penalties from graph dependencies.
"""
import datetime
from typing import Dict, Any, List, Optional
import pandas as pd
from chainguard.graph.dependency_engine import SupplyChainGraph


class ConsequenceCalculator:
    def __init__(self, graph: SupplyChainGraph):
        self.graph = graph

    def evaluate_component_consequences(self, 
                                       component_id: str, 
                                       predicted_lead_time_days: float, 
                                       current_stock: Optional[float] = None,
                                       daily_consumption: Optional[float] = None,
                                       base_date: str = "2026-11-01") -> Dict[str, Any]:
        """
        Performs deterministic consequence calculations for a component shortage.
        """
        if not self.graph.graph.has_node(component_id):
            raise KeyError(f"Component '{component_id}' not found in dependency graph.")

        c_node = self.graph.graph.nodes[component_id]
        
        # Current stock and consumption rates
        stock = float(current_stock if current_stock is not None else c_node.get("current_stock", 0.0))
        daily_rate = float(daily_consumption if daily_consumption is not None else c_node.get("daily_consumption_rate", 1.0))
        safety_stock = float(c_node.get("safety_stock", 0.0))
        facility_id = c_node.get("facility_id", "FAC-UNKNOWN")

        # Time-to-Shortage (TTS)
        tts_days = stock / daily_rate if daily_rate > 0 else 999.0
        # Time until safety stock is breached
        time_to_safety_breach_days = max(0.0, (stock - safety_stock) / daily_rate) if daily_rate > 0 else 999.0

        # Replacement Lead Time (RLT) from prediction
        rlt_days = max(0.0, float(predicted_lead_time_days))

        # Coverage Gap
        coverage_gap_days = max(0.0, rlt_days - tts_days)
        has_coverage_gap = coverage_gap_days > 0.05

        base_dt = datetime.datetime.strptime(base_date, "%Y-%m-%d")
        stockout_dt = base_dt + datetime.timedelta(days=int(round(tts_days)))
        arrival_dt = base_dt + datetime.timedelta(days=int(round(rlt_days)))
        stockout_date_str = stockout_dt.strftime("%Y-%m-%d")
        arrival_date_str = arrival_dt.strftime("%Y-%m-%d")

        # Trace downstream cascade in graph
        downstream = self.graph.get_downstream_impact(component_id)

        # Financial Calculations
        plant_daily_idle_rate = 35_000.0  # Industry standard daily assembly line stall cost
        estimated_plant_idle_cost = coverage_gap_days * plant_daily_idle_rate if has_coverage_gap else 0.0

        total_sla_penalties = 0.0
        total_contract_value_at_risk = 0.0
        affected_orders_detail = []

        for ord_node in downstream["customer_orders"]:
            order_id = ord_node["id"]
            contract_val = float(ord_node.get("contract_value_usd", 0.0))
            penalty_per_day = float(ord_node.get("late_penalty_usd_per_day", 0.0))
            promised_date_str = str(ord_node.get("promised_delivery_date", base_date))
            
            try:
                promised_dt = datetime.datetime.strptime(promised_date_str, "%Y-%m-%d")
                promised_day_offset = (promised_dt - base_dt).days
            except Exception:
                promised_day_offset = 10

            # If arrival date is past the customer delivery commitment
            order_delay_days = max(0.0, rlt_days - promised_day_offset) if has_coverage_gap else 0.0
            order_penalty = order_delay_days * penalty_per_day

            total_sla_penalties += order_penalty
            if order_delay_days > 0:
                total_contract_value_at_risk += contract_val

            affected_orders_detail.append({
                "order_id": order_id,
                "customer_name": ord_node.get("customer_name"),
                "product_id": ord_node.get("product_id"),
                "contract_value_usd": contract_val,
                "promised_delivery_date": promised_date_str,
                "projected_delivery_date": (base_dt + datetime.timedelta(days=int(round(max(promised_day_offset, rlt_days))))).strftime("%Y-%m-%d"),
                "projected_delay_days": round(order_delay_days, 1),
                "penalty_usd_per_day": penalty_per_day,
                "total_penalty_usd": round(order_penalty, 2),
                "sla_priority": ord_node.get("sla_priority")
            })

        # Total unmitigated financial exposure
        total_financial_loss_if_unmitigated = estimated_plant_idle_cost + total_sla_penalties

        return {
            "component_id": component_id,
            "component_name": c_node.get("name"),
            "current_stock": round(stock, 1),
            "safety_stock": round(safety_stock, 1),
            "daily_consumption_rate": round(daily_rate, 1),
            "time_to_shortage_days": round(tts_days, 1),
            "time_to_safety_breach_days": round(time_to_safety_breach_days, 1),
            "replacement_lead_time_days": round(rlt_days, 1),
            "coverage_gap_days": round(coverage_gap_days, 1),
            "has_coverage_gap": has_coverage_gap,
            "stockout_date": stockout_date_str,
            "replenishment_arrival_date": arrival_date_str,
            "facility_id": facility_id,
            "plant_idle_cost_usd": round(estimated_plant_idle_cost, 2),
            "sla_penalties_usd": round(total_sla_penalties, 2),
            "total_contract_value_at_risk_usd": round(total_contract_value_at_risk, 2),
            "total_unmitigated_loss_usd": round(total_financial_loss_if_unmitigated, 2),
            "affected_assemblies": [a["name"] for a in downstream["assemblies"]],
            "affected_products": [p["name"] for p in downstream["products"]],
            "affected_facilities": [f["name"] for f in downstream["facilities"]],
            "affected_customer_orders": affected_orders_detail
        }

