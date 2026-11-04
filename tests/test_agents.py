"""
Tests for ChainGuard AI - Autonomous Multi-Agent Orchestrator
"""
import unittest
import sys
import os
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))
from chainguard.api.app import app
from chainguard.validation.retraining_pipeline import pipeline_manager
from chainguard.agents.orchestrator import agent_orchestrator


class TestAgenticOrchestrator(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        if not pipeline_manager.calibrated_predictor.is_fitted:
            pipeline_manager.train_initial_models()
        cls.client = TestClient(app)

    def test_agentic_cycle_execution(self):
        payload = {
            "title": "Severe Berth Backlog at San Pedro Bay",
            "warning_type": "PORT_CONGESTION",
            "severity": "CRITICAL",
            "description": "Crane terminal outage forcing container offload delays.",
            "target_shipment_id": "SHP-801",
            "delay_impact_days": 4.5,
            "port_congestion_delta": 2.5
        }
        resp = self.client.post("/api/agents/run-cycle", json=payload)
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertIn("orchestration_id", data)
        self.assertIn("agentic_thought_trace", data)
        self.assertEqual(len(data["agentic_thought_trace"]), 4)

        # Check all 4 agents executed
        agents = [s["agent"] for s in data["agentic_thought_trace"]]
        self.assertTrue(any("Sentinel" in a for a in agents))
        self.assertTrue(any("Diagnostic" in a for a in agents))
        self.assertTrue(any("Planning" in a for a in agents))
        self.assertTrue(any("SAP" in a for a in agents))

        # Check SAP execution outputs
        self.assertIn("sap_execution", data)
        self.assertIn("bapi_po", data["sap_execution"])
        self.assertEqual(data["sap_execution"]["bapi_po"]["bapi_return"][0]["TYPE"], "S")

    def test_map_geo_data_endpoint(self):
        resp = self.client.get("/api/map/geo-data")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertIn("nodes", data)
        self.assertIn("lanes", data)
        self.assertIn("hazards", data)
        self.assertTrue(len(data["nodes"]) >= 6)
        self.assertTrue(len(data["lanes"]) >= 3)


if __name__ == "__main__":
    unittest.main()

