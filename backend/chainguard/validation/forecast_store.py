"""
ChainGuard AI - Forecast Store
Persistently records every generated forecast with input features, uncertainty, and recommendations.
Supports ground truth reconciliation when actual delivery outcomes occur.
"""
import os
import json
import sqlite3
import datetime
from typing import Dict, Any, List, Optional

DB_PATH = os.path.join(os.path.dirname(__file__), "forecast_store.db")


class ForecastStore:
    def __init__(self, db_path: str = DB_PATH):
        self.db_path = db_path
        self._init_db()

    def _init_db(self):
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS forecasts (
                    forecast_id TEXT PRIMARY KEY,
                    timestamp TEXT,
                    horizon_days INTEGER,
                    entity_type TEXT,
                    entity_id TEXT,
                    inputs_snapshot TEXT,
                    predicted_p_delay REAL,
                    predicted_p_severe REAL,
                    uncertainty_std REAL,
                    predicted_lead_time_p50 REAL,
                    p10_lead_time REAL,
                    p90_lead_time REAL,
                    risk_tier TEXT,
                    recommended_action TEXT,
                    model_version TEXT,
                    actual_outcome_lead_time REAL,
                    actual_outcome_is_delayed INTEGER,
                    reconciled_at TEXT
                )
            """)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS model_versions (
                    version TEXT PRIMARY KEY,
                    created_at TEXT,
                    training_sample_count INTEGER,
                    mae_lead_time REAL,
                    brier_score REAL,
                    precision_score REAL,
                    recall_score REAL,
                    baseline_mae REAL,
                    baseline_brier REAL,
                    notes TEXT
                )
            """)
            conn.commit()

    def record_forecast(self, 
                        forecast_id: str,
                        entity_type: str,
                        entity_id: str,
                        inputs: Dict[str, Any],
                        prediction: Dict[str, Any],
                        recommendation: Dict[str, Any],
                        model_version: str = "v1.0") -> str:
        timestamp = datetime.datetime.now().isoformat()
        horizon = int(prediction.get("forecast_horizon_days", 14))
        p_delay = float(prediction.get("p_delay_ge_3d", 0.0))
        p_severe = float(prediction.get("p_severe_delay_ge_7d", 0.0))
        uncertainty = float(prediction.get("uncertainty_std", 0.05))
        p50 = float(prediction.get("predicted_lead_time_p50", 14.0))
        p10 = float(prediction.get("p10_lead_time_days", p50 - 2.0))
        p90 = float(prediction.get("p90_lead_time_days", p50 + 4.0))
        risk_tier = prediction.get("risk_tier", "MODERATE")
        rec_title = recommendation.get("title", "No action")

        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT OR REPLACE INTO forecasts (
                    forecast_id, timestamp, horizon_days, entity_type, entity_id,
                    inputs_snapshot, predicted_p_delay, predicted_p_severe, uncertainty_std,
                    predicted_lead_time_p50, p10_lead_time, p90_lead_time, risk_tier,
                    recommended_action, model_version
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                forecast_id, timestamp, horizon, entity_type, entity_id,
                json.dumps(inputs), p_delay, p_severe, uncertainty,
                p50, p10, p90, risk_tier, rec_title, model_version
            ))
            conn.commit()
        return forecast_id

    def reconcile_outcome(self, 
                          forecast_id: str, 
                          actual_lead_time: float, 
                          actual_is_delayed: int) -> bool:
        """
        Records the actual ground-truth outcome when delivery completes.
        """
        now = datetime.datetime.now().isoformat()
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("""
                UPDATE forecasts 
                SET actual_outcome_lead_time = ?, actual_outcome_is_delayed = ?, reconciled_at = ?
                WHERE forecast_id = ?
            """, (actual_lead_time, actual_is_delayed, now, forecast_id))
            conn.commit()
            return cursor.rowcount > 0

    def get_all_forecasts(self, limit: int = 100) -> List[Dict[str, Any]]:
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM forecasts ORDER BY timestamp DESC LIMIT ?", (limit,))
            rows = cursor.fetchall()
            return [dict(r) for r in rows]

    def record_model_version(self, version_info: Dict[str, Any]):
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT OR REPLACE INTO model_versions (
                    version, created_at, training_sample_count, mae_lead_time,
                    brier_score, precision_score, recall_score, baseline_mae,
                    baseline_brier, notes
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                version_info["version"],
                datetime.datetime.now().isoformat(),
                version_info.get("training_sample_count", 1000),
                version_info.get("mae_lead_time", 0.0),
                version_info.get("brier_score", 0.0),
                version_info.get("precision_score", 0.0),
                version_info.get("recall_score", 0.0),
                version_info.get("baseline_mae", 0.0),
                version_info.get("baseline_brier", 0.0),
                version_info.get("notes", "")
            ))
            conn.commit()

    def get_model_versions(self) -> List[Dict[str, Any]]:
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM model_versions ORDER BY created_at DESC")
            rows = cursor.fetchall()
            return [dict(r) for r in rows]


forecast_store = ForecastStore()

