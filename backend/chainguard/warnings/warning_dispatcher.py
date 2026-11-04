"""
ChainGuard AI - Warning Dispatcher & Real-Time Ingestion Engine
Allows creating, sending, and ingesting external disruption warnings.
Automatically propagates the warning through ML predictions, consequence graph cascading,
preventive action optimization, and SAP ERP workflow generation.
"""
import os
import sqlite3
import datetime
import uuid
from typing import Dict, Any, List, Optional
import pandas as pd

from chainguard.data.storage import storage
from chainguard.validation.retraining_pipeline import pipeline_manager
from chainguard.validation.forecast_store import forecast_store
from chainguard.graph.dependency_engine import SupplyChainGraph
from chainguard.graph.consequence_calculator import ConsequenceCalculator
from chainguard.recommendations.cost_benefit_optimizer import PreventiveActionOptimizer

DB_PATH = os.path.join(os.path.dirname(__file__), "warnings_store.db")


class WarningDispatcher:
    def __init__(self, db_path: str = DB_PATH):
        self.db_path = db_path
        self._init_db()
        self.sc_graph = SupplyChainGraph()
        self.consequence_calc = ConsequenceCalculator(self.sc_graph)
        self.action_optimizer = PreventiveActionOptimizer()

    def _init_db(self):
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS dispatched_warnings (
                    warning_id TEXT PRIMARY KEY,
                    timestamp TEXT,
                    source TEXT,
                    warning_type TEXT,
                    severity TEXT,
                    title TEXT,
                    description TEXT,
                    target_shipment_id TEXT,
                    target_supplier_id TEXT,
                    target_component_id TEXT,
                    delay_impact_days REAL,
                    port_congestion_delta REAL,
                    weather_severity_override REAL,
                    status TEXT,
                    consequence_summary TEXT,
                    recommended_action TEXT
                )
            """)
            conn.commit()

    def refresh_graph(self):
        self.sc_graph.build_from_tables(
            storage.get_table("suppliers"),
            storage.get_table("components"),
            storage.get_table("bom"),
            storage.get_table("customer_orders")
        )

    def dispatch_warning(self, 
                         title: str,
                         warning_type: str,
                         severity: str,
                         description: str,
                         source: str = "User Console / External Dispatch",
                         target_shipment_id: Optional[str] = "SHP-801",
                         target_supplier_id: Optional[str] = None,
                         target_component_id: Optional[str] = None,
                         delay_impact_days: float = 3.5,
                         port_congestion_delta: float = 0.0,
                         weather_severity_override: Optional[float] = None,
                         geopolitical_risk_delta: float = 0.0) -> Dict[str, Any]:
        """
        Ingests warning, updates operational data, and runs the entire predictive cascade.
        """
        warning_id = f"WARN-{datetime.datetime.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
        timestamp = datetime.datetime.now().isoformat()

        shipments_df = storage.get_table("shipments")
        components_df = storage.get_table("components")
        suppliers_df = storage.get_table("suppliers")
        signals_df = storage.get_table("external_signals")

        # Resolve target shipment / component
        matched_shipment = None
        if target_shipment_id:
            m = shipments_df[shipments_df["shipment_id"] == target_shipment_id]
            if not m.empty:
                matched_shipment = m.iloc[0].to_dict()
                target_component_id = matched_shipment["component_id"]
                target_supplier_id = matched_shipment["supplier_id"]

        if not target_component_id:
            target_component_id = "CMP-MCU-01"
        if not target_supplier_id:
            c_row = components_df[components_df["component_id"] == target_component_id]
            if not c_row.empty:
                target_supplier_id = c_row.iloc[0]["supplier_id"]

        # 1. Update operational records based on incoming warning shock
        if matched_shipment:
            new_dev = float(matched_shipment["last_milestone_deviation_days"]) + delay_impact_days
            new_port = max(0.0, float(matched_shipment["port_congestion_days"]) + port_congestion_delta)
            new_wth = weather_severity_override if weather_severity_override is not None else float(matched_shipment["weather_severity_index"])
            
            new_geo = min(10.0, float(matched_shipment.get("geopolitical_risk_score", 5.0)) + geopolitical_risk_delta)
            
            storage.update_record("shipments", "shipment_id", target_shipment_id, {
                "last_milestone_deviation_days": round(new_dev, 2),
                "port_congestion_days": round(new_port, 2),
                "weather_severity_index": round(new_wth, 2),
                "geopolitical_risk_score": round(new_geo, 2)
            })

        # Append new signal to external_signals table
        new_signal = {
            "signal_id": f"SIG-{warning_id}",
            "source_type": warning_type,
            "location": matched_shipment.get("origin_location", "Global Logistics Corridor") if matched_shipment else "Transit Hub",
            "severity": severity,
            "metric_name": f"{warning_type} Impact Shock",
            "metric_value": delay_impact_days,
            "baseline_value": 0.0,
            "deviation_pct": round(delay_impact_days * 100, 1),
            "description": description,
            "timestamp": timestamp
        }
        signals_df = pd.concat([signals_df, pd.DataFrame([new_signal])], ignore_index=True)
        storage.save_table("external_signals", signals_df)

        # 2. Re-run Machine Learning Disruption Predictions
        updated_shipments = storage.get_table("shipments")
        shp = updated_shipments[updated_shipments["shipment_id"] == target_shipment_id].iloc[0]
        sup = suppliers_df[suppliers_df["supplier_id"] == target_supplier_id].iloc[0]

        feat_dict = {
            "agreed_lead_time_days": float(shp["days_in_transit"] + shp["eta_days_remaining"]),
            "supplier_capacity_utilization": float(sup["capacity_utilization"]),
            "supplier_historical_rate": float(sup["historical_on_time_rate"]),
            "supplier_lead_time_drift_pct": float(sup["lead_time_drift_pct"]),
            "weather_severity_index": float(shp["weather_severity_index"]),
            "port_congestion_days": float(shp["port_congestion_days"]),
            "geopolitical_risk_score": float(shp["geopolitical_risk_score"]),
            "last_milestone_deviation_days": float(shp["last_milestone_deviation_days"]),
            "transport_mode": shp["transport_mode"],
            "supplier_tier": int(sup["tier"])
        }

        updated_risk = pipeline_manager.calibrated_predictor.predict_risk(feat_dict)
        updated_lt = pipeline_manager.lead_time_regressor.predict_lead_time(feat_dict, departure_date=shp["departure_date"])
        anomalies = pipeline_manager.anomaly_detector.detect_anomalies(feat_dict)

        # 3. Re-run Graph Consequence Cascading
        self.refresh_graph()
        c_row = components_df[components_df["component_id"] == target_component_id].iloc[0]

        updated_consequences = self.consequence_calc.evaluate_component_consequences(
            component_id=target_component_id,
            predicted_lead_time_days=updated_lt["predicted_lead_time_p50"],
            current_stock=float(c_row["current_stock"]),
            daily_consumption=float(c_row["daily_consumption_rate"])
        )

        # 4. Re-run Preventive Recommendations
        alt_sup_row = None
        if pd.notna(c_row.get("alternative_supplier_id")) and c_row["alternative_supplier_id"]:
            alt_matches = suppliers_df[suppliers_df["supplier_id"] == c_row["alternative_supplier_id"]]
            if not alt_matches.empty:
                alt_sup_row = alt_matches

        updated_recommendations = self.action_optimizer.optimize_actions(
            component_id=target_component_id,
            consequence_data=updated_consequences,
            prediction_data=updated_risk,
            component_row=c_row.to_dict(),
            supplier_row=sup.to_dict(),
            alt_supplier_row=alt_sup_row
        )

        top_act = updated_recommendations["recommended_action"]
        conseq_summary_str = f"Coverage Gap: {updated_consequences['coverage_gap_days']:.1f}d | Unmitigated Loss: ${updated_consequences['total_unmitigated_loss_usd']:,.0f}"

        # 5. Persist dispatched warning into SQLite
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT OR REPLACE INTO dispatched_warnings (
                    warning_id, timestamp, source, warning_type, severity, title,
                    description, target_shipment_id, target_supplier_id, target_component_id,
                    delay_impact_days, port_congestion_delta, weather_severity_override,
                    status, consequence_summary, recommended_action
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                warning_id, timestamp, source, warning_type, severity, title,
                description, target_shipment_id, target_supplier_id, target_component_id,
                delay_impact_days, port_congestion_delta, weather_severity_override,
                "ACTIVE", conseq_summary_str, top_act.get("title", "")
            ))
            conn.commit()

        # Log into ForecastStore
        forecast_store.record_forecast(
            forecast_id=f"FCST-{warning_id}",
            entity_type="WarningEvent",
            entity_id=target_component_id,
            inputs=feat_dict,
            prediction=updated_risk,
            recommendation=top_act,
            model_version=pipeline_manager.current_version
        )

        return {
            "status": "WARNING_PROCESSED_AND_PROPAGATED",
            "warning_id": warning_id,
            "timestamp": timestamp,
            "warning_details": {
                "title": title,
                "type": warning_type,
                "severity": severity,
                "source": source,
                "description": description,
                "target_shipment_id": target_shipment_id,
                "target_component_id": target_component_id,
                "target_supplier_id": target_supplier_id,
                "delay_shock_applied_days": delay_impact_days
            },
            "resulting_predictions": {
                "calibrated_delay_probability": updated_risk["p_delay_ge_3d"],
                "calibrated_severe_delay_probability": updated_risk["p_severe_delay_ge_7d"],
                "risk_tier": updated_risk["risk_tier"],
                "lead_time_p50_days": updated_lt["predicted_lead_time_p50"],
                "confidence_interval_90": updated_lt["lead_time_interval_90pct"],
                "eta_date": updated_lt["eta_date_p50"],
                "active_anomalies": anomalies,
                "supporting_signals": updated_risk["supporting_signals"]
            },
            "resulting_consequences": updated_consequences,
            "resulting_recommendations": updated_recommendations
        }

    def get_dispatched_warnings(self, limit: int = 50) -> List[Dict[str, Any]]:
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM dispatched_warnings ORDER BY timestamp DESC LIMIT ?", (limit,))
            rows = cursor.fetchall()
            return [dict(r) for r in rows]

    def clear_warnings(self):
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM dispatched_warnings")
            conn.commit()


# Global Singleton
warning_dispatcher = WarningDispatcher()

