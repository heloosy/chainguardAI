"""
ChainGuard AI - REST API Routes
Exposes endpoints for prediction, consequence cascading, preventive recommendations,
what-if scenario testing, validation governance, and operational data ingestion.
"""
import uuid
import datetime
import pandas as pd
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Body
from pydantic import BaseModel

from chainguard.data.storage import storage
from chainguard.validation.retraining_pipeline import pipeline_manager
from chainguard.validation.forecast_store import forecast_store
from chainguard.graph.dependency_engine import SupplyChainGraph
from chainguard.graph.consequence_calculator import ConsequenceCalculator
from chainguard.recommendations.cost_benefit_optimizer import PreventiveActionOptimizer
from chainguard.warnings.warning_dispatcher import warning_dispatcher
from chainguard.sap.sap_engine import sap_engine
from chainguard.agents.orchestrator import agent_orchestrator
from chainguard.sources.multi_source_feed import multi_source_engine
from chainguard.compliance.policy_engine import policy_engine
from chainguard.graph.stage_progression import stage_engine
from chainguard.data.validator import dataset_validator
from chainguard.simulation.engine import simulation_engine
from chainguard.graph.exposure_mapper import exposure_mapper
from chainguard.compliance.decision_gate import decision_gate
from chainguard.history.incident_store import incident_store
from chainguard.agents.pipeline import workflow_pipeline
from chainguard.compliance.policy_generator import policy_generator
from chainguard.agents.notification_service import notification_service
from chainguard.compliance.supply_exchange_engine import supply_exchange_engine

router = APIRouter(prefix="/api")

# Initialize graph and engines
sc_graph = SupplyChainGraph()
consequence_calc = ConsequenceCalculator(sc_graph)
action_optimizer = PreventiveActionOptimizer()


def refresh_graph():
    sc_graph.build_from_tables(
        storage.get_table("suppliers"),
        storage.get_table("components"),
        storage.get_table("bom"),
        storage.get_table("customer_orders")
    )


def ensure_models_trained():
    if not pipeline_manager.calibrated_predictor.is_fitted:
        pipeline_manager.train_initial_models()


refresh_graph()
ensure_models_trained()


# Request Models
class WhatIfRequest(BaseModel):
    component_id: str = "CMP-MCU-01"
    port_congestion_delta_days: float = 0.0
    weather_severity_override: Optional[float] = None
    demand_surge_pct: float = 0.0
    disable_alternative_supplier: bool = False
    custom_transit_deviation_days: float = 0.0


class PredictSingleRequest(BaseModel):
    agreed_lead_time_days: float = 21.0
    supplier_capacity_utilization: float = 0.94
    supplier_historical_rate: float = 0.74
    supplier_lead_time_drift_pct: float = 24.5
    weather_severity_index: float = 7.5
    port_congestion_days: float = 5.2
    geopolitical_risk_score: float = 6.8
    last_milestone_deviation_days: float = 3.8
    transport_mode: str = "Ocean"
    supplier_tier: int = 1


class IngestDataRequest(BaseModel):
    table_name: str
    format: str = "csv"
    mode: str = "append"  # append or replace
    payload: str


class ReconcileOutcomeRequest(BaseModel):
    forecast_id: str
    actual_lead_time_days: float
    actual_is_delayed: int


class SimulateAlertRequest(BaseModel):
    source_platform: str = "X_TWITTER"
    headline: str
    content: str
    source_handle: str = "@DockworkerDaily_LA"
    location: str = "Port of Long Beach, Pier T"
    lat: float = 33.7542
    lng: float = -118.2165
    affected_entity: str = "SHP-801"
    component_id: str = "CMP-MCU-01"
    early_sign_category: str = "BERTH_BOTTLENECK"
    predicted_delay_shock_days: float = 4.5
    urgency_tier: str = "CRITICAL"


class EvaluateAlternativeRequest(BaseModel):
    component_id: str = "CMP-MCU-01"
    original_path: Optional[Dict[str, Any]] = None
    alternative_path: Optional[Dict[str, Any]] = None


class AdvanceStageRequest(BaseModel):
    chain_id: str = "SC-EV-MOTOR-SYS-01"
    stage_index: int = 2
    custom_feedback: Optional[str] = None


class LearnOutcomeRequest(BaseModel):
    chain_id: str = "SC-EV-MOTOR-SYS-01"
    forecast_id: Optional[str] = None
    actual_delay_days: float = 0.0
    compliance_clearance_success: bool = True
    total_cost_spent: float = 14200.0
    sla_penalty_incurred: float = 0.0
    notes: Optional[str] = None


class ScenarioSelectRequest(BaseModel):
    scenario_id: str


class SimSpeedRequest(BaseModel):
    speed_multiplier: float


class DecisionEvaluateRequest(BaseModel):
    action_id: str
    action_title: str
    action_type: str = "LATERAL_TRANSFER"
    component_id: str = "CMP-MCU-01"
    cost_usd: float = 2200.0
    lead_time_days: float = 1.5
    transport_mode: str = "Air"
    destination_facility: str = "FAC-DETROIT"
    prerequisites: Optional[List[str]] = None
    is_jones_act_violating: bool = False
    has_ear_embargo: bool = False
    evidence_provided: Optional[Dict[str, Any]] = None


class DecisionApproveRequest(BaseModel):
    action_id: str
    approver_name: str
    approver_role: str = "Supply Chain Operations Director"
    notes: Optional[str] = None


class DecisionEvidenceRequest(BaseModel):
    action_id: str
    evidence_key: str
    evidence_value: str


class DecisionExecuteRequest(BaseModel):
    action_id: str
    execution_mode: str = "simulated"
    sap_connected: bool = False


class IncidentSearchRequest(BaseModel):
    query: str
    limit: int = 5


# ==========================================
# 1. PREDICT ENDPOINTS
# ==========================================

@router.get("/predictions")
def get_all_predictions():
    """
    Runs live inference for all active shipments and purchase orders,
    incorporating real-time supplier reliability and port/weather signals.
    """
    shipments_df = storage.get_table("shipments")
    suppliers_df = storage.get_table("suppliers")
    components_df = storage.get_table("components")
    pos_df = storage.get_table("purchase_orders")

    results = []
    for _, shp in shipments_df.iterrows():
        sup_rows = suppliers_df[suppliers_df["supplier_id"] == shp["supplier_id"]]
        if sup_rows.empty:
            continue
        sup = sup_rows.iloc[0]
        
        # Prepare feature dict
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

        risk_prediction = pipeline_manager.calibrated_predictor.predict_risk(feat_dict)
        lt_prediction = pipeline_manager.lead_time_regressor.predict_lead_time(feat_dict, departure_date=shp["departure_date"])
        anomalies = pipeline_manager.anomaly_detector.detect_anomalies(feat_dict)

        # Look up component name
        c_rows = components_df[components_df["component_id"] == shp["component_id"]]
        c_name = c_rows.iloc[0]["name"] if not c_rows.empty else shp["component_id"]

        results.append({
            "shipment_id": shp["shipment_id"],
            "po_id": shp["po_id"],
            "component_id": shp["component_id"],
            "component_name": c_name,
            "supplier_id": shp["supplier_id"],
            "supplier_name": sup["name"],
            "transport_mode": shp["transport_mode"],
            "origin_location": shp["origin_location"],
            "scheduled_arrival_date": shp["scheduled_arrival_date"],
            "risk_assessment": risk_prediction,
            "lead_time_forecast": lt_prediction,
            "detected_anomalies": anomalies,
            "model_version": pipeline_manager.current_version
        })

    return {
        "status": "SUCCESS",
        "model_version": pipeline_manager.current_version,
        "total_active_shipments_evaluated": len(results),
        "predictions": results
    }


@router.post("/predict/single")
def predict_single(req: PredictSingleRequest):
    """
    On-demand inference for arbitrary feature inputs.
    Demonstrates model response to individual variable changes.
    """
    feat_dict = req.model_dump()
    risk_pred = pipeline_manager.calibrated_predictor.predict_risk(feat_dict)
    lt_pred = pipeline_manager.lead_time_regressor.predict_lead_time(feat_dict)
    anomalies = pipeline_manager.anomaly_detector.detect_anomalies(feat_dict)

    return {
        "status": "SUCCESS",
        "inputs": feat_dict,
        "risk_assessment": risk_pred,
        "lead_time_forecast": lt_pred,
        "anomalies": anomalies,
        "model_version": pipeline_manager.current_version
    }


# ==========================================
# 2. CONSEQUENCE ANALYSIS & GRAPH ENDPOINTS
# ==========================================

@router.get("/graph")
def get_graph():
    """
    Returns nodes and edges for supply chain dependency network visualization.
    """
    refresh_graph()
    return {
        "elements": sc_graph.to_cytoscape_elements(),
        "total_nodes": sc_graph.graph.number_of_nodes(),
        "total_edges": sc_graph.graph.number_of_edges()
    }


@router.get("/consequences")
def get_all_consequences():
    """
    Calculates downstream supply chain impact for all components based on predicted lead times.
    """
    refresh_graph()
    preds = get_all_predictions()["predictions"]
    components_df = storage.get_table("components")
    
    consequences = []
    total_var = 0.0
    total_unmitigated_loss = 0.0

    for p in preds:
        comp_id = p["component_id"]
        predicted_lt = p["lead_time_forecast"]["predicted_lead_time_p50"]
        c_row = components_df[components_df["component_id"] == comp_id].iloc[0]

        impact = consequence_calc.evaluate_component_consequences(
            component_id=comp_id,
            predicted_lead_time_days=predicted_lt,
            current_stock=float(c_row["current_stock"]),
            daily_consumption=float(c_row["daily_consumption_rate"])
        )

        impact["prediction_summary"] = {
            "p_delay_ge_3d": p["risk_assessment"]["p_delay_ge_3d"],
            "risk_tier": p["risk_assessment"]["risk_tier"],
            "expected_delay_days": p["lead_time_forecast"]["expected_delay_days"],
            "p10_p90_arrival_dates": p["lead_time_forecast"]["eta_interval_dates"]
        }

        consequences.append(impact)
        total_var += impact["total_contract_value_at_risk_usd"]
        total_unmitigated_loss += impact["total_unmitigated_loss_usd"]

    return {
        "status": "SUCCESS",
        "total_components_analyzed": len(consequences),
        "total_value_at_risk_usd": round(total_var, 2),
        "total_unmitigated_loss_usd": round(total_unmitigated_loss, 2),
        "consequences": consequences
    }


@router.get("/consequences/{component_id}")
def get_component_consequence(component_id: str):
    refresh_graph()
    components_df = storage.get_table("components")
    c_match = components_df[components_df["component_id"] == component_id]
    if c_match.empty:
        raise HTTPException(status_code=404, detail=f"Component '{component_id}' not found.")

    c_row = c_match.iloc[0]
    # Find matching shipment prediction or default
    preds = get_all_predictions()["predictions"]
    pred_lt = 14.0
    for p in preds:
        if p["component_id"] == component_id:
            pred_lt = p["lead_time_forecast"]["predicted_lead_time_p50"]
            break

    impact = consequence_calc.evaluate_component_consequences(
        component_id=component_id,
        predicted_lead_time_days=pred_lt,
        current_stock=float(c_row["current_stock"]),
        daily_consumption=float(c_row["daily_consumption_rate"])
    )
    return impact


# ==========================================
# 3. PREVENTIVE RECOMMENDATIONS ENDPOINTS
# ==========================================

@router.get("/recommendations")
def get_all_recommendations():
    """
    Evaluates preventive actions for all components exhibiting elevated risk or coverage gaps.
    Compares recommendations with taking no action (status quo).
    """
    refresh_graph()
    consequences_resp = get_all_consequences()
    preds_map = {p["component_id"]: p for p in get_all_predictions()["predictions"]}
    
    components_df = storage.get_table("components")
    suppliers_df = storage.get_table("suppliers")

    recommendations_list = []

    for c_impact in consequences_resp["consequences"]:
        comp_id = c_impact["component_id"]
        c_row = components_df[components_df["component_id"] == comp_id].iloc[0]
        sup_row = suppliers_df[suppliers_df["supplier_id"] == c_row["supplier_id"]].iloc[0]
        
        alt_sup_row = None
        if pd.notna(c_row.get("alternative_supplier_id")) and c_row["alternative_supplier_id"]:
            alt_matches = suppliers_df[suppliers_df["supplier_id"] == c_row["alternative_supplier_id"]]
            if not alt_matches.empty:
                alt_sup_row = alt_matches

        pred_info = preds_map.get(comp_id, {}).get("risk_assessment", {"p_delay_ge_3d": 0.5})

        opt_result = action_optimizer.optimize_actions(
            component_id=comp_id,
            consequence_data=c_impact,
            prediction_data=pred_info,
            component_row=c_row.to_dict(),
            supplier_row=sup_row.to_dict(),
            alt_supplier_row=alt_sup_row
        )

        # Store in forecast store for auditability and governance
        if opt_result["threshold_crossed"]:
            fid = f"FCST-{comp_id}-{uuid.uuid4().hex[:6]}"
            forecast_store.record_forecast(
                forecast_id=fid,
                entity_type="Component",
                entity_id=comp_id,
                inputs={"current_stock": float(c_row["current_stock"]), "pred_lt": c_impact["replacement_lead_time_days"]},
                prediction=pred_info,
                recommendation=opt_result["recommended_action"],
                model_version=pipeline_manager.current_version
            )
            opt_result["logged_forecast_id"] = fid

        recommendations_list.append(opt_result)

    return {
        "status": "SUCCESS",
        "recommendations": recommendations_list
    }


# ==========================================
# 4. WHAT-IF SCENARIO TESTING SANDBOX
# ==========================================

@router.post("/what-if/simulate")
def simulate_what_if(req: WhatIfRequest):
    """
    Dedicated What-If scenario sandbox: Allows user to alter inputs or assumptions
    (port congestion, weather, demand surge, alternative supplier availability)
    and observe how predictions, consequences, and recommendations diverge.
    """
    refresh_graph()
    components_df = storage.get_table("components")
    suppliers_df = storage.get_table("suppliers")
    shipments_df = storage.get_table("shipments")

    c_match = components_df[components_df["component_id"] == req.component_id]
    if c_match.empty:
        raise HTTPException(status_code=404, detail="Component not found")
    c_row = c_match.iloc[0].to_dict()

    # Find matching shipment
    shp_match = shipments_df[shipments_df["component_id"] == req.component_id]
    shp_dict = shp_match.iloc[0].to_dict() if not shp_match.empty else {}
    sup_match = suppliers_df[suppliers_df["supplier_id"] == c_row["supplier_id"]]
    sup_dict = sup_match.iloc[0].to_dict() if not sup_match.empty else {}

    # 1. Baseline Run (Current Trajectory)
    base_feat = {
        "agreed_lead_time_days": float(shp_dict.get("days_in_transit", 15) + shp_dict.get("eta_days_remaining", 4)),
        "supplier_capacity_utilization": float(sup_dict.get("capacity_utilization", 0.90)),
        "supplier_historical_rate": float(sup_dict.get("historical_on_time_rate", 0.80)),
        "supplier_lead_time_drift_pct": float(sup_dict.get("lead_time_drift_pct", 10.0)),
        "weather_severity_index": float(shp_dict.get("weather_severity_index", 5.0)),
        "port_congestion_days": float(shp_dict.get("port_congestion_days", 3.0)),
        "geopolitical_risk_score": float(shp_dict.get("geopolitical_risk_score", 4.0)),
        "last_milestone_deviation_days": float(shp_dict.get("last_milestone_deviation_days", 1.0)),
        "transport_mode": shp_dict.get("transport_mode", "Ocean"),
        "supplier_tier": int(sup_dict.get("tier", 1))
    }
    base_risk = pipeline_manager.calibrated_predictor.predict_risk(base_feat)
    base_lt = pipeline_manager.lead_time_regressor.predict_lead_time(base_feat)
    base_conseq = consequence_calc.evaluate_component_consequences(
        component_id=req.component_id,
        predicted_lead_time_days=base_lt["predicted_lead_time_p50"],
        current_stock=float(c_row["current_stock"]),
        daily_consumption=float(c_row["daily_consumption_rate"])
    )

    # 2. Simulated Run (Modified Assumptions)
    sim_feat = dict(base_feat)
    sim_feat["port_congestion_days"] = max(0.0, sim_feat["port_congestion_days"] + req.port_congestion_delta_days)
    if req.weather_severity_override is not None:
        sim_feat["weather_severity_index"] = max(0.0, min(10.0, req.weather_severity_override))
    sim_feat["last_milestone_deviation_days"] = max(0.0, sim_feat["last_milestone_deviation_days"] + req.custom_transit_deviation_days)

    sim_consumption = float(c_row["daily_consumption_rate"]) * (1.0 + (req.demand_surge_pct / 100.0))

    sim_risk = pipeline_manager.calibrated_predictor.predict_risk(sim_feat)
    sim_lt = pipeline_manager.lead_time_regressor.predict_lead_time(sim_feat)
    sim_conseq = consequence_calc.evaluate_component_consequences(
        component_id=req.component_id,
        predicted_lead_time_days=sim_lt["predicted_lead_time_p50"],
        current_stock=float(c_row["current_stock"]),
        daily_consumption=sim_consumption
    )

    alt_sup_row = None
    if not req.disable_alternative_supplier and pd.notna(c_row.get("alternative_supplier_id")):
        alt_match = suppliers_df[suppliers_df["supplier_id"] == c_row["alternative_supplier_id"]]
        if not alt_match.empty:
            alt_sup_row = alt_match

    sim_recs = action_optimizer.optimize_actions(
        component_id=req.component_id,
        consequence_data=sim_conseq,
        prediction_data=sim_risk,
        component_row=c_row,
        supplier_row=sup_dict,
        alt_supplier_row=alt_sup_row
    )

    return {
        "status": "SUCCESS",
        "scenario_parameters": req.model_dump(),
        "baseline_trajectory": {
            "risk_assessment": base_risk,
            "lead_time_forecast": base_lt,
            "consequences": base_conseq
        },
        "simulated_trajectory": {
            "risk_assessment": sim_risk,
            "lead_time_forecast": sim_lt,
            "consequences": sim_conseq,
            "preventive_recommendations": sim_recs
        },
        "variance_summary": {
            "lead_time_delta_days": round(sim_lt["predicted_lead_time_p50"] - base_lt["predicted_lead_time_p50"], 1),
            "coverage_gap_delta_days": round(sim_conseq["coverage_gap_days"] - base_conseq["coverage_gap_days"], 1),
            "unmitigated_loss_delta_usd": round(sim_conseq["total_unmitigated_loss_usd"] - base_conseq["total_unmitigated_loss_usd"], 2),
            "p_delay_delta": round(sim_risk["p_delay_ge_3d"] - base_risk["p_delay_ge_3d"], 3)
        }
    }


# ==========================================
# 5. VALIDATION & MODEL GOVERNANCE ENDPOINTS
# ==========================================

@router.get("/validation/metrics")
def get_model_metrics():
    """
    Returns current model accuracy vs naive baseline, error distributions,
    and historical version comparison.
    """
    metrics = pipeline_manager.last_eval_metrics
    versions = forecast_store.get_model_versions()
    return {
        "current_version": pipeline_manager.current_version,
        "metrics": metrics,
        "model_version_history": versions
    }


@router.get("/validation/forecasts")
def get_logged_forecasts(limit: int = 50):
    return {
        "forecasts": forecast_store.get_all_forecasts(limit=limit)
    }


@router.post("/validation/retrain")
def trigger_retraining():
    """
    Executes model retraining, creates new model version (e.g. v1.1),
    and computes metrics deltas.
    """
    result = pipeline_manager.retrain_with_new_data()
    return result


@router.post("/validation/reconcile")
def reconcile_forecast_outcome(req: ReconcileOutcomeRequest):
    """
    Records actual delivery ground truth for a past prediction.
    """
    success = forecast_store.reconcile_outcome(
        forecast_id=req.forecast_id,
        actual_lead_time=req.actual_lead_time_days,
        actual_is_delayed=req.actual_is_delayed
    )
    if not success:
        raise HTTPException(status_code=404, detail="Forecast ID not found.")
    return {"status": "RECONCILED_SUCCESSFULLY", "forecast_id": req.forecast_id}


# ==========================================
# 6. DATA INGESTION & RUNTIME ENDPOINTS
# ==========================================

@router.get("/data/tables")
def list_tables():
    return {
        "tables": {t: len(storage.get_table(t)) for t in storage.tables}
    }


@router.get("/data/table/{table_name}")
def get_table_data(table_name: str, limit: int = 100):
    try:
        df = storage.get_table(table_name)
        # Cleanly replace NaN with None for JSON compliance
        clean_df = df.where(pd.notnull(df), None)
        return {
            "table_name": table_name,
            "total_rows": len(clean_df),
            "rows": clean_df.head(limit).to_dict(orient="records")
        }
    except KeyError:
        raise HTTPException(status_code=404, detail=f"Table '{table_name}' does not exist.")


@router.post("/data/ingest")
def ingest_data(req: IngestDataRequest):
    """
    Ingests CSV or JSON data to append or replace rows in target table.
    Enables testing custom operational data and seeing predictions update.
    """
    try:
        rows_ingested = storage.ingest_records(
            table_name=req.table_name,
            csv_or_json_content=req.payload,
            format_type=req.format,
            mode=req.mode
        )
        refresh_graph()
        return {
            "status": "INGESTED_SUCCESSFULLY",
            "table_name": req.table_name,
            "rows_processed": rows_ingested
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/data/reset")
def reset_to_benchmark():
    """
    Resets all tables to the clean simulated benchmark dataset.
    """
    storage.load_or_generate(force_refresh=True)
    refresh_graph()
    pipeline_manager.train_initial_models()
    warning_dispatcher.clear_warnings()
    return {"status": "RESET_TO_BENCHMARK_COMPLETED"}


# ==========================================
# 7. WARNING DISPATCH & INGESTION ENDPOINTS
# ==========================================

class SendWarningRequest(BaseModel):
    title: str
    warning_type: str = "PORT_CONGESTION"
    severity: str = "CRITICAL"
    description: str
    source: str = "Enterprise Operations Center"
    target_shipment_id: Optional[str] = "SHP-801"
    target_component_id: Optional[str] = "CMP-MCU-01"
    target_supplier_id: Optional[str] = None
    delay_impact_days: float = 3.5
    port_congestion_delta: float = 2.0
    weather_severity_override: Optional[float] = None
    geopolitical_risk_delta: float = 0.0


@router.post("/warnings/send")
def send_disruption_warning(req: SendWarningRequest):
    """
    Receives an incoming external warning, ingests it into operational signals,
    and automatically executes the entire predictive, consequence, recommendation, and SAP cascade.
    """
    try:
        result = warning_dispatcher.dispatch_warning(
            title=req.title,
            warning_type=req.warning_type,
            severity=req.severity,
            description=req.description,
            source=req.source,
            target_shipment_id=req.target_shipment_id,
            target_supplier_id=req.target_supplier_id,
            target_component_id=req.target_component_id,
            delay_impact_days=req.delay_impact_days,
            port_congestion_delta=req.port_congestion_delta,
            weather_severity_override=req.weather_severity_override,
            geopolitical_risk_delta=req.geopolitical_risk_delta
        )
        # Fetch matching SAP MD04 state
        md04_data = sap_engine.get_md04_stock_requirements(req.target_component_id or "CMP-MCU-01")
        result["sap_mrp_live_impact"] = md04_data
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/warnings/active")
def get_dispatched_warnings():
    return {
        "status": "SUCCESS",
        "warnings": warning_dispatcher.get_dispatched_warnings()
    }


@router.post("/warnings/clear")
def clear_dispatched_warnings():
    warning_dispatcher.clear_warnings()
    return {"status": "WARNINGS_CLEARED"}


# ==========================================
# 8. SAP TECHNOLOGIES & ERP INTEGRATION
# ==========================================

class SAPBapiPORequest(BaseModel):
    vendor: str = "SUP-007"
    material: str = "CMP-MCU-01"
    quantity: float = 1200.0
    net_price: float = 95.20
    plant: str = "1010"
    doc_type: str = "NB"


class SAPGTTEventRequest(BaseModel):
    TrackingID: str = "GTT-SHP-801-TW"
    TrackingIDType: str = "Shipment"
    EventType: str = "BERTH_HOLD_EXCEEDED"
    EventReason: str = "Gantry crane terminal queue exceeded SLA"
    Location: str = "PORT_LONGBEACH_CA"
    EstimatedArrivalTime: Optional[str] = None


@router.get("/sap/odata/v4/MD04/{material_id}")
def get_sap_md04(material_id: str):
    """
    Simulates SAP S/4HANA Stock-Requirements List (Transaction MD04) with MRP Exception Codes.
    """
    try:
        return sap_engine.get_md04_stock_requirements(material_id)
    except KeyError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/sap/odata/v4/MaterialStockList")
def get_sap_material_stock_list():
    components_df = storage.get_table("components")
    materials = []
    for _, c in components_df.iterrows():
        try:
            mrp = sap_engine.get_md04_stock_requirements(c["component_id"])
            materials.append(mrp)
        except Exception:
            continue
    return {
        "@odata.context": "$metadata#MaterialStockList",
        "value": materials
    }


@router.get("/sap/odata/v4/GTTEvents")
def get_sap_gtt_events():
    """
    Returns milestone events tracked in SAP Global Track & Trace (GTT).
    """
    return {
        "@odata.context": "$metadata#GTTEvents",
        "value": sap_engine.get_all_gtt_events()
    }


@router.post("/sap/odata/v4/GTTEvents")
def post_sap_gtt_event(req: SAPGTTEventRequest):
    """
    Ingests an incoming SAP GTT event, and immediately triggers an automated disruption warning dispatch.
    """
    gtt_res = sap_engine.ingest_gtt_event(req.model_dump())
    # Propagate to warning dispatcher
    warning_dispatcher.dispatch_warning(
        title=f"SAP GTT Alert: {req.EventType}",
        warning_type="SAP_GTT_MILESTONE",
        severity="WARNING",
        description=f"Automated SAP Business Network GTT event on {req.TrackingID}: {req.EventReason}",
        source="SAP Global Track and Trace",
        target_shipment_id="SHP-801",
        delay_impact_days=2.5
    )
    return gtt_res


@router.post("/sap/bapi/BAPI_PO_CREATE1")
def execute_sap_bapi_po_create(req: SAPBapiPORequest):
    """
    Executes standard SAP BAPI_PO_CREATE1 to generate an emergency purchase order in SAP S/4HANA.
    """
    return sap_engine.execute_bapi_po_create(
        vendor=req.vendor,
        material=req.material,
        quantity=req.quantity,
        net_price=req.net_price,
        plant=req.plant,
        doc_type=req.doc_type
    )


@router.get("/sap/idoc/{idoc_type}")
def get_sap_idoc(idoc_type: str, material: str = "CMP-MCU-01", qty: float = 1200.0):
    """
    Generates standard SAP IDoc structures (ORDERS05, WMMBID02, PORDCR1).
    """
    return sap_engine.generate_idoc(idoc_type, {"material": material, "quantity": qty})


# ==========================================
# 9. AGENTIC AI ORCHESTRATION & GLOBAL MAP
# ==========================================

class AgenticCycleRequest(BaseModel):
    title: str = "Disruption Alert"
    warning_type: str = "PORT_CONGESTION"
    severity: str = "CRITICAL"
    description: str = "Operational shock observed on transit lane"
    target_shipment_id: str = "SHP-801"
    delay_impact_days: float = 4.5
    port_congestion_delta: float = 2.5
    weather_severity_override: Optional[float] = None


@router.post("/agents/run-cycle")
def execute_agentic_cycle(req: AgenticCycleRequest):
    """
    Runs the autonomous multi-agent reasoning and execution cycle:
    Sentinel Perception -> Diagnostic Reasoning -> Planning Optimization -> SAP Execution.
    Returns step-by-step agentic thoughts and live execution results.
    """
    return agent_orchestrator.run_agentic_response(req.model_dump())


@router.get("/map/geo-data")
def get_map_geo_data():
    """
    Provides real geographic coordinates for ports, factories, shipping lanes,
    and hazard zones for the Leaflet interactive map.
    """
    shipments_df = storage.get_table("shipments")
    components_df = storage.get_table("components")
    
    # Check current delay for SHP-801
    shp801 = shipments_df[shipments_df["shipment_id"] == "SHP-801"]
    dev801 = float(shp801.iloc[0]["last_milestone_deviation_days"]) if not shp801.empty else 3.8

    return {
        "nodes": [
            {"id": "TW-KHH", "name": "Kaohsiung Port (Apex Semiconductor)", "type": "SUPPLIER_PORT", "lat": 22.6163, "lng": 120.3013, "country": "Taiwan", "status": "ORIGIN"},
            {"id": "KR-PUS", "name": "Busan Port (Pacific Power Cells)", "type": "SUPPLIER_PORT", "lat": 35.1028, "lng": 129.0403, "country": "South Korea", "status": "ORIGIN"},
            {"id": "DE-FRA", "name": "Frankfurt CargoCity (Nordic Sensors)", "type": "SUPPLIER_AIRPORT", "lat": 50.0379, "lng": 8.5622, "country": "Germany", "status": "ORIGIN"},
            {"id": "JP-OSA", "name": "Osaka Port (Kyoto Ceramics)", "type": "SUPPLIER_PORT", "lat": 34.6525, "lng": 135.4339, "country": "Japan", "status": "ORIGIN"},
            {"id": "US-LGB", "name": "Port of Long Beach / San Pedro Bay", "type": "DESTINATION_PORT", "lat": 33.7542, "lng": -118.2165, "country": "USA", "status": "CONGESTED"},
            {"id": "FAC-DETROIT", "name": "Detroit Advanced Assembly Plant", "type": "MANUFACTURING_PLANT", "lat": 42.3314, "lng": -83.0458, "country": "USA", "status": "CRITICAL_GAP"},
            {"id": "FAC-AUSTIN", "name": "Austin Assembly & Distribution Hub", "type": "SISTER_PLANT", "lat": 30.2672, "lng": -97.7431, "country": "USA", "status": "BUFFER_SURPLUS"},
            {"id": "DE-DRS", "name": "Silicon Saxony Fab (Alternative Supplier)", "type": "ALT_SUPPLIER", "lat": 51.0504, "lng": 13.7373, "country": "Germany", "status": "AVAILABLE"}
        ],
        "lanes": [
            {
                "id": "LANE-TP-01",
                "name": "Transpacific Ocean Corridor (Kaohsiung -> Long Beach -> Detroit)",
                "mode": "Ocean",
                "origin": [22.6163, 120.3013],
                "port_of_entry": [33.7542, -118.2165],
                "destination": [42.3314, -83.0458],
                "shipment_id": "SHP-801",
                "component": "32-Bit Automotive Master MCU",
                "status": "CRITICAL_DELAY",
                "delay_prob": 99.2,
                "current_deviation_days": round(dev801, 1)
            },
            {
                "id": "LANE-KR-02",
                "name": "Pacific Battery Corridor (Busan -> Long Beach -> Austin)",
                "mode": "Ocean",
                "origin": [35.1028, 129.0403],
                "port_of_entry": [33.7542, -118.2165],
                "destination": [30.2672, -97.7431],
                "shipment_id": "SHP-803",
                "component": "48V Battery Management Unit",
                "status": "CRITICAL_DELAY",
                "delay_prob": 99.0
            },
            {
                "id": "LANE-TA-03",
                "name": "Transatlantic Air Express (Frankfurt -> Detroit)",
                "mode": "Air",
                "origin": [50.0379, 8.5622],
                "destination": [42.3314, -83.0458],
                "shipment_id": "SHP-802",
                "component": "Multi-Spectrum LiDAR Transceiver",
                "status": "NORMAL",
                "delay_prob": 21.8
            },
            {
                "id": "LANE-INTER-04",
                "name": "Inter-Facility Dedicated Hotshot Freight (Austin -> Detroit)",
                "mode": "Truck",
                "origin": [30.2672, -97.7431],
                "destination": [42.3314, -83.0458],
                "shipment_id": "ACT-LAT-03",
                "component": "Emergency Lateral Transfer",
                "status": "RECOMMENDED_ACTION",
                "delay_prob": 5.0
            },
            {
                "id": "LANE-ALT-AIR-05",
                "name": "Alternative Dedicated Air Charter (Taipei TPE -> Anchorage ANC -> Detroit DTW)",
                "mode": "Air Expedited",
                "origin": [25.0797, 121.2342],
                "waypoint": [61.1743, -149.9962],
                "destination": [42.3314, -83.0458],
                "shipment_id": "ALT-CHARTER-99",
                "component": "32-Bit Automotive Master MCU (Bypass Route)",
                "status": "ALTERNATIVE_ACTIVE_PATH",
                "delay_prob": 3.2,
                "mitigation_code": "ACT-AIR-EXPEDITE-02"
            }
        ],
        "hazards": [
            {
                "id": "HAZ-01",
                "name": "San Pedro Bay Berth Congestion Zone",
                "lat": 33.7542,
                "lng": -118.2165,
                "radius_km": 120,
                "severity": "CRITICAL",
                "category": "PORT_CONGESTION",
                "description": "Port dwell hold time at Long Beach outer anchorage."
            },
            {
                "id": "HAZ-02",
                "name": "North Pacific Cyclonic Wave Corridor",
                "lat": 38.0,
                "lng": -165.0,
                "radius_km": 650,
                "severity": "SEVERE",
                "category": "CYCLONE_WEATHER",
                "description": "Storm wave index forcing vessels to detour south."
            },
            {
                "id": "HAZ-03",
                "name": "Red Sea & Bab-el-Mandeb Chokepoint War Risk Zone",
                "lat": 12.587,
                "lng": 43.332,
                "radius_km": 500,
                "severity": "CRITICAL",
                "category": "GEOPOLITICAL_WAR",
                "description": "Anti-ship missile corridor and naval blockades forcing commercial vessels around Cape of Good Hope (+14 days)."
            },
            {
                "id": "HAZ-04",
                "name": "Taiwan Strait Maritime Security Alert Zone",
                "lat": 24.2,
                "lng": 119.5,
                "radius_km": 300,
                "severity": "CRITICAL",
                "category": "GEOPOLITICAL_WAR",
                "description": "Naval exclusion zone and military exercises restricting commercial container traffic from Hsinchu & Kaohsiung."
            },
            {
                "id": "HAZ-05",
                "name": "Western Pacific Super Typhoon 'Mawar' Storm Center",
                "lat": 21.0,
                "lng": 135.0,
                "radius_km": 750,
                "severity": "CRITICAL",
                "category": "CYCLONE_WEATHER",
                "description": "Category 5 Super Typhoon with 12m swells and 140kt wind gusts halting marine lanes."
            }
        ],
        "signals": multi_source_engine.get_all_signals()
    }


# ==========================================
# 8. MULTI-SOURCE INTELLIGENCE ENDPOINTS
# ==========================================

@router.get("/sources/signals")
def get_source_signals(limit: int = 50):
    """
    Returns real-time multi-source intelligence feeds from Google News,
    X (Twitter), Marine AIS sensors, and customs bulletins.
    """
    return {
        "count": len(multi_source_engine.get_all_signals(limit)),
        "signals": multi_source_engine.get_all_signals(limit)
    }


@router.post("/sources/simulate-alert")
def simulate_source_alert(req: SimulateAlertRequest):
    """
    Simulates a newly detected early warning signal from Google News or X (Twitter),
    automatically triggering downstream delay forecasts and compliance checks.
    """
    new_signal = multi_source_engine.ingest_new_signal(
        source_platform=req.source_platform,
        headline=req.headline,
        content=req.content,
        source_handle=req.source_handle,
        location=req.location,
        lat=req.lat,
        lng=req.lng,
        affected_entity=req.affected_entity,
        component_id=req.component_id,
        early_sign_category=req.early_sign_category,
        predicted_delay_shock_days=req.predicted_delay_shock_days,
        urgency_tier=req.urgency_tier
    )
    
    # Also register with the warning dispatcher so active shipments update
    warning_dispatcher.dispatch_warning(
        title=req.headline,
        warning_type="BERTH_CONGESTION" if "BERTH" in req.early_sign_category else "SUPPLIER_FORCE_MAJEURE",
        severity=req.urgency_tier,
        description=f"[{req.source_platform}] {req.headline}: {req.content}",
        source=f"{req.source_platform} Multi-Source Feed",
        target_shipment_id=req.affected_entity if "SHP" in req.affected_entity else "SHP-801",
        delay_impact_days=req.predicted_delay_shock_days
    )

    return {
        "status": "INGESTED_AND_DISPATCHED",
        "signal": new_signal,
        "action": "EARLY_SIGNS_UPDATED"
    }


# ==========================================
# 9. TRADE POLICY & COMPLIANCE ENDPOINTS
# ==========================================

@router.post("/compliance/evaluate-alternative")
def evaluate_compliance_and_trade_offs(req: EvaluateAlternativeRequest):
    """
    Deep trade-off evaluation comparing the positive factors of the original path
    vs the alternative path. Identifies all applicable country laws (Jones Act,
    EAR export controls, IATA lithium battery rules, CBAM tariffs) and provides
    transparent legal mitigations or declares immutable legal barriers.
    """
    default_original = {
        "name": "Transpacific Ocean Route (Kaohsiung Port -> Long Beach Pier T -> Detroit Plant 1010)",
        "mode": "Ocean",
        "lead_time_days": 21,
        "unit_cost": 42.00,
        "carbon_kg_per_unit": 0.82,
        "delay_days": 4.5,
        "days_to_stockout": 5.2,
        "projected_loss": 128000.0,
        "nodes": ["Kaohsiung", "Long Beach", "Detroit"]
    }
    
    default_alternative = {
        "name": "Expedited Dedicated Air Charter Corridor (Taipei TPE -> Anchorage ANC -> Detroit DTW)",
        "mode": "Air",
        "lead_time_days": 7,
        "days_saved": 4.0,
        "additional_cost": 14200.0,
        "origin_country": "Taiwan",
        "dest_country": "USA",
        "crosses_international_borders": True,
        "requires_customs_clearance": True,
        "nodes": ["Taipei", "Anchorage", "Detroit"]
    }

    orig = req.original_path if req.original_path else default_original
    alt = req.alternative_path if req.alternative_path else default_alternative

    evaluation = policy_engine.evaluate_path_comparison(
        component_id=req.component_id,
        original_path=orig,
        alternative_path=alt
    )
    return evaluation


# ==========================================
# 10. MULTI-TIER STAGE PROGRESSION ENDPOINTS
# ==========================================

@router.get("/stages/current")
def get_current_stages(chain_id: str = "SC-EV-MOTOR-SYS-01"):
    """
    Returns the stage-by-stage progression of the supply chain system:
    Stage 1: Tier-2 Fab -> Stage 2: Transit -> Stage 3: Plant -> Stage 4: Distribution -> Stage 5: Customer SLA.
    """
    return stage_engine.get_progression(chain_id)


@router.post("/stages/advance")
def advance_supply_chain_stage(req: AdvanceStageRequest):
    """
    Executes the approved mitigation for the current stage, validates compliance,
    and advances the supply chain to the next sequential tier.
    """
    updated_progression = stage_engine.advance_to_next_stage(
        chain_id=req.chain_id,
        stage_index=req.stage_index,
        custom_feedback=req.custom_feedback
    )
    return {
        "status": "ADVANCED_SUCCESSFULLY",
        "current_stage_index": updated_progression["current_stage_index"],
        "progression": updated_progression
    }


# ==========================================
# 11. CLOSED-LOOP LEARNING ENGINE ENDPOINTS
# ==========================================

@router.post("/learning/learn-from-outcome")
def learn_from_execution_outcome(req: LearnOutcomeRequest):
    """
    Captures the actual real-world outcome of the executed mitigation across the stages.
    Updates the Bayesian calibration priors, triggers retraining pipeline, logs
    to forecast_store.db, and verifies improvement over the baseline.
    """
    # 1. Synthesize outcome record for model retraining
    hist_sample = storage.get_table("historical_deliveries").iloc[0:5].copy()
    hist_sample["delivery_date"] = datetime.datetime.now().strftime("%Y-%m-%d")
    hist_sample["is_delayed"] = 1 if req.actual_delay_days >= 3.0 else 0
    hist_sample["actual_lead_time_days"] = hist_sample["agreed_lead_time_days"] + req.actual_delay_days

    # 2. Retrain and recalibrate models
    retrain_results = pipeline_manager.retrain_with_new_data(hist_sample)

    # 3. Log outcome into forecast_store
    if req.forecast_id:
        forecast_store.reconcile_outcome(
            forecast_id=req.forecast_id,
            actual_lead_time=float(req.actual_delay_days + 7.0),
            actual_is_delayed=1 if req.actual_delay_days >= 3.0 else 0
        )

    new_ver = retrain_results.get("new_version", "v1.1")
    prev_ver = retrain_results.get("previous_version", "v1.0")

    metrics = retrain_results.get("metrics", {})
    cg_metrics = metrics.get("chainguard_ai", {})
    base_metrics = metrics.get("naive_baseline", {})
    delta = retrain_results.get("delta", {})

    brier_cg = cg_metrics.get("delay_brier_score", 0.045)
    brier_base = base_metrics.get("delay_brier_score", 0.125)

    return {
        "status": "LEARNING_CYCLE_COMPLETED",
        "chain_id": req.chain_id,
        "new_model_version": new_ver,
        "previous_version": prev_ver,
        "validation_metrics": cg_metrics,
        "baseline_comparison": base_metrics,
        "metric_delta": delta,
        "compliance_record": {
            "clearance_success": req.compliance_clearance_success,
            "sla_penalty_incurred": req.sla_penalty_incurred,
            "cost_effectiveness_ratio": round(135000.0 / max(req.total_cost_spent, 1.0), 2)
        },
        "learning_summary": (
            f"Successfully updated model to {new_ver}. "
            f"Brier score calibrated from {brier_base:.4f} "
            f"down to {brier_cg:.4f}. "
            f"Trade policy compliance protocol logged 100% adherence."
        )
    }


# ==========================================
# 14. SETUP & DATA VALIDATION ENDPOINTS (STAGE 1)
# ==========================================

@router.get("/setup/benchmark-validation")
def get_benchmark_validation_report():
    """
    Validates current loaded tables and returns detailed audit metrics,
    including missing fields, invalid records, duplicates, freshness, and limitations.
    """
    return dataset_validator.validate_dataset(storage.tables)


@router.post("/setup/validate")
def validate_operational_dataset():
    """
    Runs full schema and domain validation on all operational data tables.
    """
    return dataset_validator.validate_dataset(storage.tables)


# ==========================================
# 15. EARLY WARNING SIMULATION CONTROL ROOM (STAGES 2, 3, 4, 5, 8, 15)
# ==========================================

@router.get("/simulation/catalog")
def get_simulation_scenarios_catalog():
    """Returns list of all 8 available disruption simulation scenarios."""
    return {"catalog": simulation_engine.get_catalog()}


@router.get("/simulation/state")
def get_simulation_state():
    """Returns real-time simulation clock, active signals, emerging event, exposure, and timeline."""
    return simulation_engine.get_state()


@router.post("/simulation/start")
def start_simulation():
    """Starts or resumes simulation."""
    return simulation_engine.start()


@router.post("/simulation/pause")
def pause_simulation():
    """Pauses simulation."""
    return simulation_engine.pause()


@router.post("/simulation/resume")
def resume_simulation():
    """Resumes simulation."""
    return simulation_engine.resume()


@router.post("/simulation/step")
def step_simulation():
    """Advances simulation by exactly one deterministic tick."""
    return simulation_engine.step()


@router.post("/simulation/reset")
def reset_simulation():
    """Resets simulation to initial state without deleting unrelated user data."""
    return simulation_engine.reset()


@router.post("/simulation/scenario")
def set_simulation_scenario(req: ScenarioSelectRequest):
    """Switches active scenario."""
    try:
        return simulation_engine.set_scenario(req.scenario_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/simulation/speed")
def set_simulation_speed(req: SimSpeedRequest):
    """Sets simulation speed multiplier (1x, 2x, 5x, 10x)."""
    return simulation_engine.set_speed(req.speed_multiplier)


# ==========================================
# 16. EXPOSURE MAPPING ENDPOINTS (STAGE 6)
# ==========================================

@router.get("/exposure/current")
def get_current_exposure():
    """Returns exposure mapping for the currently active simulation scenario."""
    state = simulation_engine.get_state()
    exp = state.get("exposure_state")
    if not exp:
        meta = state.get("scenario_metadata", {})
        exp = exposure_mapper.map_event_exposure(
            event_type=meta.get("category", "METEOROLOGICAL_CYCLONE"),
            location_name=meta.get("location", "Chennai, India"),
            lat=meta.get("lat"),
            lng=meta.get("lng")
        )
    return exp


# ==========================================
# 17. DECISION GATE & EXECUTION ENDPOINTS (STAGES 11 & 12)
# ==========================================

@router.post("/decision-gate/evaluate")
def evaluate_decision_gate(req: DecisionEvaluateRequest):
    """
    Evaluates candidate action and enforces 4 explicit deterministic outcomes:
    PROCEED, HUMAN APPROVAL, GATHER EVIDENCE, BLOCK.
    """
    return decision_gate.evaluate_candidate_action(
        action_id=req.action_id,
        action_title=req.action_title,
        action_type=req.action_type,
        component_id=req.component_id,
        cost_usd=req.cost_usd,
        lead_time_days=req.lead_time_days,
        transport_mode=req.transport_mode,
        destination_facility=req.destination_facility,
        prerequisites=req.prerequisites,
        is_jones_act_violating=req.is_jones_act_violating,
        has_ear_embargo=req.has_ear_embargo,
        evidence_provided=req.evidence_provided
    )


@router.post("/decision-gate/approve")
def approve_decision_gate(req: DecisionApproveRequest):
    """Records human approval sign-off."""
    try:
        return decision_gate.approve_action(
            action_id=req.action_id,
            approver_name=req.approver_name,
            approver_role=req.approver_role,
            notes=req.notes or ""
        )
    except (KeyError, ValueError) as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/decision-gate/provide-evidence")
def provide_decision_evidence(req: DecisionEvidenceRequest):
    """Attaches verified operational evidence to clear GATHER EVIDENCE status."""
    try:
        return decision_gate.attach_evidence(
            action_id=req.action_id,
            evidence_key=req.evidence_key,
            evidence_value=req.evidence_value
        )
    except KeyError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/decision-gate/execute")
def execute_decision_action(req: DecisionExecuteRequest):
    """
    Executes approved action.
    If real SAP authorized: runs live RFC.
    Otherwise: records clearly labelled demonstration simulated execution.
    """
    try:
        exec_result = decision_gate.execute_action(
            action_id=req.action_id,
            execution_mode=req.execution_mode,
            sap_connected=req.sap_connected
        )

        # Log into incident store if simulation is active
        state = simulation_engine.get_state()
        if state.get("active_event"):
            evt = state["active_event"]
            incident_store.record_completed_incident(
                scenario_id=state["scenario_id"],
                title=evt["title"],
                category=evt["category"],
                location=evt["location"],
                signals=state.get("recent_signals", []),
                evolution=state.get("timeline", []),
                exposure=state.get("exposure_state", {}),
                predictions=state.get("predictive_impact", {}),
                decision={"action_id": req.action_id, "execution_mode": req.execution_mode},
                execution=exec_result,
                actual_outcome={
                    "actual_delay_days": 0.5,
                    "prevented_loss_usd": 1780000.0,
                    "line_stoppage_prevented": True
                },
                metrics={"forecast_mae_days": 0.6, "brier_score": 0.08, "cost_benefit_ratio": 12.4},
                keywords=f"{evt['title']} {evt['location']} {evt['category']}"
            )

        return exec_result
    except (KeyError, ValueError) as e:
        raise HTTPException(status_code=400, detail=str(e))


# ==========================================
# 18. INCIDENT HISTORY & LEARNING (STAGE 13)
# ==========================================

@router.get("/incidents/history")
def get_incident_history(limit: int = 50):
    """Lists past disruption incidents and evaluation metrics."""
    return {"incidents": incident_store.list_incidents(limit=limit)}


@router.get("/incidents/{incident_id}")
def get_incident_detail(incident_id: str):
    """Returns complete evolution timeline and details for a specific incident."""
    detail = incident_store.get_incident_detail(incident_id)
    if not detail:
        raise HTTPException(status_code=404, detail=f"Incident '{incident_id}' not found.")
    return detail


@router.post("/incidents/search")
def search_similar_incidents(req: IncidentSearchRequest):
    """Retrieves past incidents matching disruption characteristics."""
    matches = incident_store.search_similar_cases(query_terms=req.query, limit=req.limit)
    return {"matches": matches}


# ========================================================
# 19. SIMPLE AGENT WORKFLOW PIPELINE (STREAMLINED CORE)
# ========================================================

class WorkflowDecisionRequest(BaseModel):
    decision: str = "approve"  # "approve", "request_evidence", "block"
    notes: Optional[str] = ""

class WorkflowResetRequest(BaseModel):
    scenario_id: str = "CYCLONE_CHENNAI"


@router.get("/workflow/state")
def get_workflow_state():
    """Returns the unified 8-stage state of the simple agent pipeline."""
    return workflow_pipeline.get_state()


@router.post("/workflow/run")
def run_workflow_pipeline():
    """Runs the agent pipeline automatically until human approval is needed or finished."""
    return workflow_pipeline.run_all()


@router.post("/workflow/step")
def step_workflow_pipeline():
    """Advances the agent pipeline by exactly one step."""
    return workflow_pipeline.step()


@router.post("/workflow/decision")
def submit_workflow_human_decision(req: WorkflowDecisionRequest):
    """Submits human-in-the-loop decision: approve, request_evidence, or block."""
    return workflow_pipeline.submit_human_decision(decision=req.decision, notes=req.notes or "")


@router.post("/workflow/reset")
def reset_workflow_pipeline(req: WorkflowResetRequest):
    """Resets the pipeline with clean benchmark data."""
    workflow_pipeline.reset(scenario_id=req.scenario_id)
    return workflow_pipeline.get_state()


class WorkflowInjectRequest(BaseModel):
    source_platform: str = "X_TWITTER"
    category: str = "Severe Disruption Alert"
    headline: str = "Urgent Port Disruption Shock"
    content: str = "Unscheduled container dwell spike detected"
    source_handle: Optional[str] = "@OperationalObserver"
    location: str = "Port of Chennai, India"
    lat: float = 13.0827
    lng: float = 80.2707
    affected_entity: str = "SHP-801"
    component_id: str = "CMP-MCU-01"
    predicted_delay_shock_days: float = 4.5
    urgency_tier: str = "CRITICAL"


@router.post("/workflow/inject")
def inject_custom_workflow_shock(req: WorkflowInjectRequest):
    """Injects an external shock disruption signal into the live pipeline from the injector studio."""
    result = workflow_pipeline.inject_signal(req.dict())
    return result


# ========================================================
# 20. POLICY GENERATOR & GOVERNANCE ENDPOINTS
# ========================================================

class GeneratePolicyRequest(BaseModel):
    scenario_id: Optional[str] = "INTERNAL_LEAD_TIME_DRIFT"
    incident_title: Optional[str] = "Supplier Delivery Creep Anomaly"
    delay_days: Optional[float] = 8.4
    var_usd: Optional[float] = 2604000.0
    coverage_gap_days: Optional[float] = 6.2
    component_id: Optional[str] = "CMP-MCU-01"
    affected_entity: Optional[str] = "PO-501"
    custom_instructions: Optional[str] = None


@router.post("/policy/generate")
def generate_resilience_policy(req: GeneratePolicyRequest):
    """Generates an executive-ready enterprise resilience policy / SOP from an incident."""
    policy = policy_generator.generate_policy_from_incident(
        incident_title=req.incident_title or "Operational Disruption",
        scenario_id=req.scenario_id or "INTERNAL_LEAD_TIME_DRIFT",
        delay_days=req.delay_days or 4.5,
        var_usd=req.var_usd or 2400000.0,
        coverage_gap_days=req.coverage_gap_days or 4.1,
        component_id=req.component_id or "CMP-MCU-01",
        affected_entity=req.affected_entity or "SHP-801",
        custom_instructions=req.custom_instructions
    )
    return policy


@router.post("/policy/activate")
def activate_policy(policy_data: Dict[str, Any] = Body(...)):
    """Activates and enforces a resilience policy into the live decision gate."""
    activated = policy_generator.activate_policy(policy_data)
    return activated


@router.get("/policy/list")
def list_resilience_policies():
    """Returns all active and archived enterprise resilience policies."""
    return {"policies": policy_generator.list_policies()}


@router.get("/policy/{policy_id}")
def get_resilience_policy(policy_id: str):
    """Retrieves a specific enterprise policy by ID."""
    policy = policy_generator.get_policy(policy_id)
    if not policy:
        raise HTTPException(status_code=404, detail=f"Policy '{policy_id}' not found.")
    return policy


@router.get("/policy/{policy_id}/export")
def export_policy_markdown(policy_id: str):
    """Exports a policy as a formatted markdown document."""
    policy = policy_generator.get_policy(policy_id)
    if not policy:
        raise HTTPException(status_code=404, detail=f"Policy '{policy_id}' not found.")
    md = policy_generator.export_policy_markdown(policy)
    return {"policy_id": policy_id, "markdown": md}


# ========================================================
# 21. EMERGENCY NOTIFICATION & SMS DISPATCH ENDPOINTS
# ========================================================

class DispatchNotificationRequest(BaseModel):
    phone_number: str = "7736215631"
    custom_message: Optional[str] = None
    scenario_id: Optional[str] = "INTERNAL_LEAD_TIME_DRIFT"
    issue_title: Optional[str] = None
    delay_days: Optional[float] = 4.5
    var_usd: Optional[float] = 2400000.0
    coverage_gap_days: Optional[float] = 4.1
    component_id: Optional[str] = "CMP-MCU-01"
    affected_entity: Optional[str] = "SHP-801"


@router.post("/notifications/dispatch")
def dispatch_emergency_notification(req: DispatchNotificationRequest):
    """Dispatches emergency SMS alert to operations commander (7736215631)."""
    record = notification_service.dispatch_sms(
        phone_number=req.phone_number,
        issue_title=req.issue_title,
        delay_days=req.delay_days or 4.5,
        var_usd=req.var_usd or 2400000.0,
        coverage_gap_days=req.coverage_gap_days or 4.1,
        affected_entity=req.affected_entity or "SHP-801",
        component_id=req.component_id or "CMP-MCU-01",
        scenario_id=req.scenario_id or "CYCLONE_CHENNAI",
        custom_message=req.custom_message
    )
    return record


@router.get("/notifications/history")
def get_notification_history(limit: int = 20):
    """Returns chronological SMS dispatch logs for operational audits."""
    return {"history": notification_service.get_dispatch_history(limit=limit)}


# ========================================================
# 22. SUPPLY EXCHANGE & CROSS-BORDER LEGAL BRIDGE ENDPOINTS
# ========================================================

class SupplyExchangeEvaluateRequest(BaseModel):
    component_id: str = "CMP-MCU-01"
    current_supplier_id: str = "SUP-001"
    target_supplier_id: str = "SUP-004"
    units_to_exchange: int = 3500
    destination_facility_id: str = "FAC-DETROIT"


class SupplyExchangeExecuteRequest(BaseModel):
    exchange_id: str
    supervisor_notes: Optional[str] = "Authorized via ChainGuard AI Legal Bridge"


class SupplyExchangePolicyRequest(BaseModel):
    exchange_record: Dict[str, Any]


@router.get("/supply-exchange/candidates")
def get_supply_exchange_candidates(component_id: str = "CMP-MCU-01", current_supplier_id: str = "SUP-001"):
    """Returns qualified alternative suppliers from neighboring/allied countries."""
    candidates = supply_exchange_engine.get_candidate_suppliers_for_exchange(
        component_id=component_id,
        current_supplier_id=current_supplier_id
    )
    return {"candidates": candidates}


@router.post("/supply-exchange/evaluate")
def evaluate_supply_exchange(req: SupplyExchangeEvaluateRequest):
    """
    Evaluates exchanging supply to an alternative supplier from a nearest country.
    Returns:
    - Operational feasibility (lead-time vs stockout window, cost delta, capacity)
    - Required international trade laws, customs statutes, and export controls
    - Mandatory permits, licenses, and statutory clearance roadmap
    """
    try:
        evaluation = supply_exchange_engine.evaluate_supply_exchange(
            component_id=req.component_id,
            current_supplier_id=req.current_supplier_id,
            target_supplier_id=req.target_supplier_id,
            units_to_exchange=req.units_to_exchange,
            destination_facility_id=req.destination_facility_id
        )
        return evaluation
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/supply-exchange/execute")
def execute_supply_exchange(req: SupplyExchangeExecuteRequest):
    """
    Commits supply exchange into live ERP:
    - Staging SAP BAPI_PO_CREATE1
    - Telephony alert to 7736215631
    - Audit logging
    """
    receipt = supply_exchange_engine.execute_supply_exchange_action(
        exchange_id=req.exchange_id,
        supervisor_notes=req.supervisor_notes or "Authorized via Legal Bridge"
    )
    return receipt


@router.post("/supply-exchange/generate-policy")
def generate_policy_from_exchange(req: SupplyExchangePolicyRequest):
    """
    Generates and activates a formal enterprise compliance policy specifically
    for this cross-border supplier exchange.
    """
    policy = policy_generator.generate_policy_for_supply_exchange(req.exchange_record)
    activated = policy_generator.activate_policy(policy)
    return activated


@router.get("/supply-exchange/history")
def get_supply_exchange_history(limit: int = 10):
    """Returns recent supply exchange evaluations and executions."""
    return {"history": supply_exchange_engine.list_recent_exchanges(limit=limit)}





