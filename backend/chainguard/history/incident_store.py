"""
ChainGuard AI - Incident History & Memory Store
Stores end-to-end incident lifecycles:
Signals -> Verification Evolution -> Exposure -> Predictions -> Decisions -> Executions -> Outcomes.
Enables inspection of event progression from uncertain early signals to final assessments,
reconciles predicted vs actual outcomes, and retrieves similar historical cases.
"""
import os
import sqlite3
import json
import datetime
from typing import Dict, Any, List, Optional

DB_PATH = os.path.join(os.path.dirname(__file__), "incidents.db")


class IncidentHistoryStore:
    def __init__(self, db_path: str = DB_PATH):
        self.db_path = db_path
        self._init_db()
        self._seed_default_history()

    def _init_db(self):
        os.makedirs(os.path.dirname(self.db_path), exist_ok=True)
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS incidents (
                    incident_id TEXT PRIMARY KEY,
                    scenario_id TEXT,
                    title TEXT,
                    category TEXT,
                    location TEXT,
                    first_signal_time TEXT,
                    closed_time TEXT,
                    signals_json TEXT,
                    evolution_json TEXT,
                    exposure_json TEXT,
                    predictions_json TEXT,
                    decision_json TEXT,
                    execution_json TEXT,
                    actual_outcome_json TEXT,
                    metrics_json TEXT,
                    search_keywords TEXT
                )
            """)
            conn.commit()

    def _seed_default_history(self):
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT COUNT(*) FROM incidents")
            if cursor.fetchone()[0] > 0:
                return

            # Seed benchmark historical cases
            hist_case_1 = {
                "incident_id": "INC-2025-TYP-01",
                "scenario_id": "TYPHOON_PACIFIC_HIST",
                "title": "Super Typhoon Mawar Maritime Deviation",
                "category": "METEOROLOGICAL_CYCLONE",
                "location": "North Pacific Corridor (34°N, 160°E)",
                "first_signal_time": "2025-09-14T08:00:00Z",
                "closed_time": "2025-09-21T18:00:00Z",
                "signals_json": json.dumps([
                    {"time": "2025-09-14T08:00:00Z", "source": "X_TWITTER", "content": "Huge swells reported off Guam corridor."},
                    {"time": "2025-09-15T04:00:00Z", "source": "NOAA_PACIFIC", "content": "JTWC Category 4 warning issued."},
                    {"time": "2025-09-15T12:00:00Z", "source": "MAERSK_NOTICE", "content": "Vessels detouring 400nm south via Hawaii."}
                ]),
                "evolution_json": json.dumps([
                    {"status": "UNVERIFIED_REPORT", "time": "2025-09-14T08:00:00Z"},
                    {"status": "CORROBORATED_INDEPENDENT", "time": "2025-09-15T04:00:00Z"},
                    {"status": "CONFIRMED_AUTHORITATIVE", "time": "2025-09-15T12:00:00Z"}
                ]),
                "exposure_json": json.dumps({
                    "shipments": ["SHP-HIST-701"],
                    "components": ["CMP-MCU-01"],
                    "suppliers": ["SUP-001"],
                    "facilities": ["FAC-DETROIT"]
                }),
                "predictions_json": json.dumps({
                    "predicted_delay_days": 4.5,
                    "lead_time_p50": 25.5,
                    "coverage_gap_days": 3.2,
                    "unmitigated_loss_usd": 1450000.0
                }),
                "decision_json": json.dumps({
                    "chosen_action": "Air Freight Expedite (Anchorage Hub)",
                    "decision_outcome": "PROCEED",
                    "approver": "R. Vance (Procurement VP)",
                    "cost_usd": 14200.0
                }),
                "execution_json": json.dumps({
                    "execution_type": "SIMULATED_DEMONSTRATION",
                    "status": "COMPLETED_ON_TIME"
                }),
                "actual_outcome_json": json.dumps({
                    "actual_delay_days": 0.5,
                    "prevented_loss_usd": 1435800.0,
                    "line_stoppage_occurred": False,
                    "unexpected_consequences": "Minor cold-chain battery cell insulation check required in Anchorage."
                }),
                "metrics_json": json.dumps({
                    "forecast_mae_days": 0.8,
                    "brier_score": 0.12,
                    "cost_effectiveness_ratio": 101.1
                }),
                "search_keywords": "cyclone, typhoon, pacific, ocean freight, mcu, detroit, air expedite"
            }

            cursor.execute("""
                INSERT INTO incidents (
                    incident_id, scenario_id, title, category, location,
                    first_signal_time, closed_time, signals_json, evolution_json,
                    exposure_json, predictions_json, decision_json, execution_json,
                    actual_outcome_json, metrics_json, search_keywords
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                hist_case_1["incident_id"], hist_case_1["scenario_id"], hist_case_1["title"],
                hist_case_1["category"], hist_case_1["location"], hist_case_1["first_signal_time"],
                hist_case_1["closed_time"], hist_case_1["signals_json"], hist_case_1["evolution_json"],
                hist_case_1["exposure_json"], hist_case_1["predictions_json"], hist_case_1["decision_json"],
                hist_case_1["execution_json"], hist_case_1["actual_outcome_json"], hist_case_1["metrics_json"],
                hist_case_1["search_keywords"]
            ))
            conn.commit()

    def record_completed_incident(
        self,
        scenario_id: str,
        title: str,
        category: str,
        location: str,
        signals: List[Dict[str, Any]],
        evolution: List[Dict[str, Any]],
        exposure: Dict[str, Any],
        predictions: Dict[str, Any],
        decision: Dict[str, Any],
        execution: Dict[str, Any],
        actual_outcome: Dict[str, Any],
        metrics: Optional[Dict[str, Any]] = None,
        keywords: str = ""
    ) -> str:
        """Saves a fully completed simulated or operational incident for retrospective analysis."""
        incident_id = f"INC-{datetime.datetime.now().strftime('%Y%m%d')}-{scenario_id[:6].upper()}"
        first_time = signals[-1].get("timestamp", datetime.datetime.now().isoformat()) if signals else datetime.datetime.now().isoformat()
        closed_time = datetime.datetime.now().isoformat()

        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT OR REPLACE INTO incidents (
                    incident_id, scenario_id, title, category, location,
                    first_signal_time, closed_time, signals_json, evolution_json,
                    exposure_json, predictions_json, decision_json, execution_json,
                    actual_outcome_json, metrics_json, search_keywords
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                incident_id, scenario_id, title, category, location,
                first_time, closed_time,
                json.dumps(signals), json.dumps(evolution),
                json.dumps(exposure), json.dumps(predictions),
                json.dumps(decision), json.dumps(execution),
                json.dumps(actual_outcome), json.dumps(metrics or {}),
                keywords
            ))
            conn.commit()
        return incident_id

    def list_incidents(self, limit: int = 50) -> List[Dict[str, Any]]:
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT incident_id, scenario_id, title, category, location,
                       first_signal_time, closed_time, predictions_json, decision_json,
                       actual_outcome_json, metrics_json, search_keywords
                FROM incidents ORDER BY closed_time DESC LIMIT ?
            """, (limit,))
            rows = cursor.fetchall()

        results = []
        for r in rows:
            results.append({
                "incident_id": r[0],
                "scenario_id": r[1],
                "title": r[2],
                "category": r[3],
                "location": r[4],
                "first_signal_time": r[5],
                "closed_time": r[6],
                "predictions": json.loads(r[7]) if r[7] else {},
                "decision": json.loads(r[8]) if r[8] else {},
                "actual_outcome": json.loads(r[9]) if r[9] else {},
                "metrics": json.loads(r[10]) if r[10] else {},
                "search_keywords": r[11]
            })
        return results

    def get_incident_detail(self, incident_id: str) -> Optional[Dict[str, Any]]:
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT incident_id, scenario_id, title, category, location,
                       first_signal_time, closed_time, signals_json, evolution_json,
                       exposure_json, predictions_json, decision_json, execution_json,
                       actual_outcome_json, metrics_json, search_keywords
                FROM incidents WHERE incident_id = ?
            """, (incident_id,))
            r = cursor.fetchone()

        if not r:
            return None

        return {
            "incident_id": r[0],
            "scenario_id": r[1],
            "title": r[2],
            "category": r[3],
            "location": r[4],
            "first_signal_time": r[5],
            "closed_time": r[6],
            "signals": json.loads(r[7]) if r[7] else [],
            "evolution": json.loads(r[8]) if r[8] else [],
            "exposure": json.loads(r[9]) if r[9] else {},
            "predictions": json.loads(r[10]) if r[10] else {},
            "decision": json.loads(r[11]) if r[11] else {},
            "execution": json.loads(r[12]) if r[12] else {},
            "actual_outcome": json.loads(r[13]) if r[13] else {},
            "metrics": json.loads(r[14]) if r[14] else {},
            "search_keywords": r[15]
        }

    def search_similar_cases(self, query_terms: str, limit: int = 5) -> List[Dict[str, Any]]:
        """Retrieves past incidents matching disruption characteristics."""
        terms = [t.strip().lower() for t in query_terms.split() if len(t.strip()) > 2]
        all_cases = self.list_incidents(limit=100)
        scored = []
        for c in all_cases:
            match_score = 0
            haystack = f"{c['title']} {c['category']} {c['location']} {c['search_keywords']}".lower()
            for t in terms:
                if t in haystack:
                    match_score += 1
            if match_score > 0 or not terms:
                scored.append((match_score, c))
        scored.sort(key=lambda x: x[0], reverse=True)
        return [c for _, c in scored[:limit]]


# Global incident history store instance
incident_store = IncidentHistoryStore()

