"""
ChainGuard AI - End-to-End Workflow & Simulation Test Suite
Verifies:
1. Stage 1: Dataset Validator (schema integrity, invalid record detection, duplicates, limitations)
2. Stage 2-5: Shared Simulation Engine (playback controls, signal progression, deduplication, 3 distinct metrics)
3. Stage 6: Supply-Chain Exposure Mapping (corridor traversal, explicit unestablished exposure handling)
4. Stage 11-12: Decision Gate (PROCEED, HUMAN APPROVAL, GATHER EVIDENCE, BLOCK, execution audit)
5. Stage 13: Incident History Store (full lifecycle persistence, retrieval)
"""
import sys
import os
import unittest
from pathlib import Path

# Add backend directory and project root to Python sys.path
BASE_DIR = Path(__file__).resolve().parent.parent / "backend"
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

import pandas as pd
from fastapi.testclient import TestClient
from chainguard.api.app import app
from chainguard.data.storage import storage
from chainguard.data.validator import dataset_validator
from chainguard.simulation.engine import simulation_engine
from chainguard.graph.exposure_mapper import exposure_mapper
from chainguard.compliance.decision_gate import decision_gate
from chainguard.history.incident_store import incident_store


class TestEndToEndWorkflow(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    def test_stage_1_dataset_validation(self):
        """Tests that the dataset validator identifies valid benchmark data and flags invalid records."""
        report = dataset_validator.validate_dataset(storage.tables)
        self.assertTrue(report["is_valid"])
        self.assertGreater(report["total_records_checked"], 30)
        self.assertEqual(len(report["invalid_records"]), 0)
        self.assertGreater(len(report["limitations"]), 2)

        # Test invalid record detection
        bad_tables = {
            "components": pd.DataFrame([{
                "component_id": "CMP-BAD-01",
                "name": "Faulty Component",
                "supplier_id": "SUP-001",
                "unit_cost_usd": 10.0,
                "current_stock": -50.0,  # Negative stock!
                "safety_stock": 20.0,
                "daily_consumption_rate": -5.0,  # Negative consumption!
                "facility_id": "FAC-DETROIT"
            }])
        }
        bad_report = dataset_validator.validate_dataset(bad_tables)
        self.assertFalse(bad_report["is_valid"])
        self.assertGreater(len(bad_report["invalid_records"]), 0)

    def test_stage_2_to_5_simulation_engine_lifecycle(self):
        """Tests start, step, pause, resume, reset, and deduplication in the simulation engine."""
        simulation_engine.set_scenario("CYCLONE_CHENNAI")
        state0 = simulation_engine.reset()
        self.assertEqual(state0["status"], "IDLE")
        self.assertEqual(state0["current_tick_index"], -1)

        # Step 1: Initial uncertain social post
        step1 = simulation_engine.step()
        self.assertEqual(step1["current_tick_index"], 0)
        self.assertEqual(step1["active_event"]["verification_status"], "UNVERIFIED_REPORT")
        self.assertIn("Coromandel", step1["recent_signals"][0]["source_name"])
        self.assertIn("Chennai", step1["recent_signals"][0]["content"])
        self.assertFalse(step1["recent_signals"][0].get("is_corroborating", True))

        # Check distinct metrics concept separation
        evt = step1["active_event"]
        self.assertIn("signal_strength_score", evt)
        self.assertIn("event_confidence_score", evt)
        self.assertIn("supply_chain_risk_score", evt)
        self.assertLess(evt["event_confidence_score"], 0.5)

        # Step 2: Repost deduplication
        step2 = simulation_engine.step()
        self.assertEqual(step2["current_tick_index"], 1)
        self.assertGreater(step2["active_event"]["duplicates_filtered_count"], 0)

        # Step 3: Independent corroboration
        step3 = simulation_engine.step()
        self.assertEqual(step3["active_event"]["verification_status"], "CORROBORATED_INDEPENDENT")

        # Step 4: Official meteorological confirmation
        step4 = simulation_engine.step()
        self.assertEqual(step4["active_event"]["verification_status"], "CONFIRMED_AUTHORITATIVE")
        self.assertGreater(step4["active_event"]["event_confidence_score"], 0.9)

        # Step 5: Predictive impact & recovery actions
        step5 = simulation_engine.step()
        self.assertEqual(step5["status"], "COMPLETED")
        self.assertIsNotNone(step5["predictive_impact"])
        self.assertGreater(len(step5["recommendations"]), 0)

    def test_stage_6_exposure_mapping_positive_and_negative(self):
        """Tests exposure mapping for affected region vs unestablished exposure."""
        # Positive exposure: Chennai cyclone matches SUP-009 / SHP-805
        exp = exposure_mapper.map_event_exposure(
            event_type="METEOROLOGICAL_CYCLONE",
            location_name="Chennai & North Tamil Nadu Coast, India",
            lat=13.0827,
            lng=80.2707,
            target_entity_hint="SHP-805"
        )
        self.assertTrue(exp["is_exposed"])
        self.assertEqual(exp["status_code"], "EXPOSURE_CONFIRMED")
        self.assertGreater(exp["total_exposed_nodes"], 0)

        # Negative exposure: Remote region with zero supply chain links
        exp_none = exposure_mapper.map_event_exposure(
            event_type="METEOROLOGICAL_CYCLONE",
            location_name="Antarctica Weddell Sea",
            lat=-75.0,
            lng=-45.0
        )
        self.assertFalse(exp_none["is_exposed"])
        self.assertEqual(exp_none["status_code"], "EXPOSURE_NOT_ESTABLISHED")
        self.assertIn("Supply-chain exposure not established", exp_none["summary"])

    def test_stage_11_and_12_decision_gate_four_outcomes(self):
        """Tests that the decision gate enforces PROCEED, HUMAN APPROVAL, GATHER EVIDENCE, and BLOCK."""
        # 1. BLOCK: Jones Act cabotage violation
        res_block = decision_gate.evaluate_candidate_action(
            action_id="ACT-TST-BLOCK-01",
            action_title="Domestic Coastal Ocean Feeder on Foreign Flag",
            action_type="COASTAL_OCEAN_FEEDER",
            component_id="CMP-MCU-01",
            cost_usd=4000.0,
            is_jones_act_violating=True
        )
        self.assertEqual(res_block["decision_outcome"], "BLOCK")
        self.assertIn("Jones Act", res_block["rationale"])

        # 2. GATHER EVIDENCE: Missing prerequisite verification
        res_evidence = decision_gate.evaluate_candidate_action(
            action_id="ACT-TST-EVID-02",
            action_title="Lateral Transfer from Austin",
            action_type="LATERAL_TRANSFER",
            component_id="CMP-MCU-01",
            cost_usd=2200.0,
            prerequisites=["Physical Inventory Count Reconciliation"]
        )
        self.assertEqual(res_evidence["decision_outcome"], "GATHER EVIDENCE")
        self.assertEqual(len(res_evidence["unresolved_requirements"]), 1)

        # Clear GATHER EVIDENCE by providing documentation
        cleared = decision_gate.attach_evidence(
            action_id="ACT-TST-EVID-02",
            evidence_key="Physical Inventory Count Reconciliation",
            evidence_value="Austin warehouse clerk confirmed 1,260 units on shelf."
        )
        self.assertEqual(cleared["decision_outcome"], "PROCEED")

        # 3. HUMAN APPROVAL: Cost exceeds $10,000 threshold
        res_approval = decision_gate.evaluate_candidate_action(
            action_id="ACT-TST-APPR-03",
            action_title="Dedicated Cargo Air Charter",
            action_type="AIR_FREIGHT_REROUTE",
            component_id="CMP-SNS-05",
            cost_usd=14200.0
        )
        self.assertEqual(res_approval["decision_outcome"], "HUMAN APPROVAL")

        # Approve with human signature
        approved = decision_gate.approve_action(
            action_id="ACT-TST-APPR-03",
            approver_name="Dr. Sylvia Tom",
            approver_role="VP Global Supply Chain"
        )
        self.assertEqual(approved["decision_outcome"], "PROCEED")
        self.assertIn("Dr. Sylvia Tom", approved["approver"])

        # 4. Stage 12: Demonstration Simulated Execution
        exec_res = decision_gate.execute_action(
            action_id="ACT-TST-APPR-03",
            execution_mode="simulated",
            sap_connected=False
        )
        self.assertTrue(exec_res["is_simulated"])
        self.assertEqual(exec_res["execution_type"], "DEMONSTRATION_SIMULATED_EXECUTION")
        self.assertIn("[DEMONSTRATION SIMULATED EXECUTION", exec_res["disclaimer"])

    def test_stage_13_incident_store(self):
        """Tests that incident cases are persisted, listed, and retrieved."""
        incidents = incident_store.list_incidents(limit=10)
        self.assertGreater(len(incidents), 0)
        first_id = incidents[0]["incident_id"]

        detail = incident_store.get_incident_detail(first_id)
        self.assertIsNotNone(detail)
        self.assertEqual(detail["incident_id"], first_id)

        # Test similarity search
        search_res = incident_store.search_similar_cases("cyclone typhoon", limit=5)
        self.assertGreater(len(search_res), 0)

    def test_rest_api_endpoints(self):
        """Tests the new REST endpoints via FastAPI TestClient."""
        # Setup validation
        r_val = self.client.get("/api/setup/benchmark-validation")
        self.assertEqual(r_val.status_code, 200)
        self.assertTrue(r_val.json()["is_valid"])

        # Simulation catalog
        r_cat = self.client.get("/api/simulation/catalog")
        self.assertEqual(r_cat.status_code, 200)
        self.assertEqual(len(r_cat.json()["catalog"]), 8)

        # Simulation step
        r_step = self.client.post("/api/simulation/step")
        self.assertEqual(r_step.status_code, 200)
        self.assertIn("status", r_step.json())

        # Exposure current
        r_exp = self.client.get("/api/exposure/current")
        self.assertEqual(r_exp.status_code, 200)

        # Incidents history
        r_hist = self.client.get("/api/incidents/history")
        self.assertEqual(r_hist.status_code, 200)
        self.assertIn("incidents", r_hist.json())


if __name__ == "__main__":
    unittest.main()
