"""
Tests for ChainGuard AI - FastAPI Endpoints
"""
import unittest
import sys
import os
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))
from chainguard.api.app import app
from chainguard.validation.retraining_pipeline import pipeline_manager


class TestAPIEndpoints(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        if not pipeline_manager.calibrated_predictor.is_fitted:
            pipeline_manager.train_initial_models()
        cls.client = TestClient(app)

    def test_get_predictions(self):
        resp = self.client.get("/api/predictions")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["status"], "SUCCESS")
        self.assertGreater(data["total_active_shipments_evaluated"], 0)
        self.assertIn("predictions", data)

    def test_get_consequences(self):
        resp = self.client.get("/api/consequences")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["status"], "SUCCESS")
        self.assertIn("total_value_at_risk_usd", data)
        self.assertIn("consequences", data)

    def test_get_recommendations(self):
        resp = self.client.get("/api/recommendations")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["status"], "SUCCESS")
        self.assertIn("recommendations", data)

    def test_what_if_simulation(self):
        payload = {
            "component_id": "CMP-MCU-01",
            "port_congestion_delta_days": 3.0,
            "demand_surge_pct": 20.0,
            "disable_alternative_supplier": False
        }
        resp = self.client.post("/api/what-if/simulate", json=payload)
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["status"], "SUCCESS")
        self.assertIn("baseline_trajectory", data)
        self.assertIn("simulated_trajectory", data)
        self.assertIn("variance_summary", data)

    def test_validation_metrics(self):
        resp = self.client.get("/api/validation/metrics")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertIn("current_version", data)
        self.assertIn("metrics", data)

    def test_sources_signals(self):
        resp = self.client.get("/api/sources/signals")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertIn("signals", data)
        self.assertGreater(data["count"], 0)

    def test_simulate_alert(self):
        payload = {
            "source_platform": "X_TWITTER",
            "headline": "Crane Failure at Pier T",
            "content": "Port of Long Beach berth backlog rising",
            "predicted_delay_shock_days": 4.5,
            "urgency_tier": "CRITICAL"
        }
        resp = self.client.post("/api/sources/simulate-alert", json=payload)
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["status"], "INGESTED_AND_DISPATCHED")

    def test_compliance_evaluate_alternative(self):
        payload = {
            "component_id": "CMP-MCU-01"
        }
        resp = self.client.post("/api/compliance/evaluate-alternative", json=payload)
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertIn("legal_and_policy_analysis", data)
        self.assertIn("detailed_mitigations", data["legal_and_policy_analysis"])

    def test_stages_current_and_advance(self):
        resp = self.client.get("/api/stages/current")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(len(data["stages"]), 5)

        advance_payload = {
            "chain_id": "SC-EV-MOTOR-SYS-01",
            "stage_index": 2,
            "custom_feedback": "Air charter flight en route"
        }
        resp2 = self.client.post("/api/stages/advance", json=advance_payload)
        self.assertEqual(resp2.status_code, 200)
        self.assertEqual(resp2.json()["status"], "ADVANCED_SUCCESSFULLY")

    def test_learning_outcome(self):
        payload = {
            "chain_id": "SC-EV-MOTOR-SYS-01",
            "actual_delay_days": 0.5,
            "compliance_clearance_success": True,
            "total_cost_spent": 14200.0
        }
        resp = self.client.post("/api/learning/learn-from-outcome", json=payload)
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["status"], "LEARNING_CYCLE_COMPLETED")
        self.assertIn("validation_metrics", data)


if __name__ == "__main__":
    unittest.main()
