"""
Tests for ChainGuard AI Streamlined 8-Stage Agent Workflow Pipeline
Validates:
1. External signals collection
2. Early warning detection
3. Information verification (rumor filtering)
4. Supply-chain impact mapping
5. Risk prediction (calibrated delay & shortage)
6. Preventive recommendations (alternatives)
7. Autonomous actions vs Human Approval (Approve / Request Evidence / Block)
8. Outcome tracking & incident learning
"""
import sys
import os
import unittest
from pathlib import Path

# Add backend directory to sys.path
BASE_DIR = Path(__file__).resolve().parent.parent / "backend"
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from chainguard.agents.pipeline import SimpleAgentWorkflow, workflow_pipeline


class TestSimpleAgentWorkflow(unittest.TestCase):

    def setUp(self):
        self.wf = SimpleAgentWorkflow()
        self.wf.reset("CYCLONE_CHENNAI")

    def test_pipeline_initialization(self):
        st = self.wf.get_state()
        self.assertEqual(st["current_stage_index"], 0)
        self.assertEqual(st["status"], "IDLE")
        self.assertIn("suppliers_count", st["sample_data_summary"])
        self.assertEqual(st["scenario"]["scenario_id"], "CYCLONE_CHENNAI")

    def test_pipeline_step_by_step_progression(self):
        # Step 1: Signals
        st1 = self.wf.step()
        self.assertEqual(st1["current_stage_index"], 1)
        self.assertEqual(len(st1["signals"]), 4)
        
        # Step 2: Early Warning
        st2 = self.wf.step()
        self.assertEqual(st2["current_stage_index"], 2)
        self.assertEqual(st2["early_warning"]["severity"], "CRITICAL")
        
        # Step 3: Verification
        st3 = self.wf.step()
        self.assertEqual(st3["current_stage_index"], 3)
        self.assertEqual(st3["verification"]["status"], "CONFIRMED_EVENT")
        self.assertGreaterEqual(st3["verification"]["event_confidence_score"], 0.9)
        
        # Step 4: Impact Mapping
        st4 = self.wf.step()
        self.assertEqual(st4["current_stage_index"], 4)
        self.assertEqual(st4["impact_mapping"]["affected_shipment"]["shipment_id"], "SHP-801")
        
        # Step 5: Risk Prediction
        st5 = self.wf.step()
        self.assertEqual(st5["current_stage_index"], 5)
        self.assertGreater(st5["risk_prediction"]["delay_probability_pct"], 90.0)
        self.assertEqual(st5["risk_prediction"]["coverage_gap_days"], 4.1)
        
        # Step 6: Preventive Recommendations
        st6 = self.wf.step()
        self.assertEqual(st6["current_stage_index"], 6)
        self.assertEqual(len(st6["preventive_actions"]), 3)
        self.assertTrue(st6["preventive_actions"][0]["is_recommended"])

    def test_autonomous_actions_and_human_approval_pause(self):
        # Run until stage 7
        st = self.wf.run_all()
        self.assertEqual(st["current_stage_index"], 7)
        self.assertEqual(st["status"], "AWAITING_HUMAN_APPROVAL")
        
        # Check that agent performed autonomous actions
        auto_actions = st["autonomous_actions"]
        self.assertGreaterEqual(len(auto_actions), 3)
        self.assertTrue(any(a["action"] == "HOLD_AIR_FREIGHT_SLOT" for a in auto_actions))
        self.assertTrue(any(a["action"] == "AUTO_LOCK_SAFETY_BUFFER" for a in auto_actions))
        
        # Check human approval requirement
        ha = st["human_approval"]
        self.assertEqual(ha["status"], "PENDING")
        self.assertEqual(ha["budget_amount_usd"], 95000.0)

    def test_human_approval_decision(self):
        self.wf.run_all()
        dec = self.wf.submit_human_decision("approve", notes="Approved by Operations VP")
        self.assertEqual(dec["current_stage_index"], 8)
        self.assertEqual(dec["status"], "COMPLETED")
        self.assertEqual(dec["outcome_tracking"]["final_decision"], "approve")
        self.assertEqual(dec["outcome_tracking"]["downtime_avoided_days"], 4.1)
        self.assertGreater(dec["outcome_tracking"]["financial_savings_usd"], 1000000.0)

    def test_human_block_decision(self):
        self.wf.run_all()
        dec = self.wf.submit_human_decision("block", notes="Budget rejected")
        self.assertEqual(dec["current_stage_index"], 8)
        self.assertEqual(dec["status"], "COMPLETED")
        self.assertEqual(dec["outcome_tracking"]["final_decision"], "block")
        self.assertEqual(dec["outcome_tracking"]["downtime_avoided_days"], 0.0)
        self.assertEqual(dec["outcome_tracking"]["financial_savings_usd"], 0.0)

    def test_emergency_sms_dispatch_to_commander(self):
        # Step into stage 1: An issue is generated
        st1 = self.wf.step()
        self.assertEqual(st1["current_stage_index"], 1)
        
        # Verify emergency notification was generated and targeted to 7736215631
        sms = st1.get("emergency_notification")
        self.assertIsNotNone(sms)
        self.assertIn("7736215631", sms["recipient_phone"])
        self.assertEqual(sms["delivery_status"], "DELIVERED_TO_HANDSET")
        self.assertIn("CHAINGUARD AI", sms["message"])

    def test_policy_generation_and_activation(self):
        from chainguard.compliance.policy_generator import policy_generator
        
        policy = policy_generator.generate_policy_from_incident(
            incident_title="Severe Cyclone Senyar",
            scenario_id="CYCLONE_CHENNAI",
            delay_days=4.5,
            var_usd=2400000.0,
            coverage_gap_days=4.1
        )
        self.assertIn("POL-SOP-", policy["policy_id"])
        self.assertIn("7736215631", policy["emergency_notification_target"])
        self.assertGreaterEqual(len(policy["quantitative_triggers"]), 2)
        self.assertGreaterEqual(len(policy["mandatory_enforcement_rules"]), 2)
        
        # Test activation
        activated = policy_generator.activate_policy(policy)
        self.assertEqual(activated["status"], "ACTIVE_ENFORCED")
        self.assertIn("activated_at", activated)
        
        # Test markdown export
        md = policy_generator.export_policy_markdown(activated)
        self.assertIn("# ", md)
        self.assertIn("7736215631", md)

    def test_supply_exchange_evaluation_and_legal_bridge(self):
        from chainguard.compliance.supply_exchange_engine import supply_exchange_engine
        from chainguard.compliance.policy_generator import policy_generator

        # 1. Fetch nearest country candidates
        candidates = supply_exchange_engine.get_candidate_suppliers_for_exchange(
            component_id="CMP-MCU-01",
            current_supplier_id="SUP-001"
        )
        self.assertGreaterEqual(len(candidates), 4)
        countries = [c["country"] for c in candidates]
        self.assertIn("Japan", countries)
        self.assertIn("Germany", countries)
        self.assertIn("Mexico", countries)

        # 2. Evaluate exchange to Japan (Kyoto Microelectronics SUP-004)
        evaluation = supply_exchange_engine.evaluate_supply_exchange(
            component_id="CMP-MCU-01",
            current_supplier_id="SUP-001",
            target_supplier_id="SUP-004",
            units_to_exchange=5000,
            destination_facility_id="FAC-DETROIT"
        )
        self.assertEqual(evaluation["target_node"]["country"], "Japan")
        feas = evaluation["operational_feasibility"]
        self.assertTrue(feas["prevents_stockout"])
        self.assertGreaterEqual(feas["feasibility_score_pct"], 90.0)
        self.assertGreater(feas["avoided_downtime_liability_usd"], 2000000.0)

        # Verify trade laws and statutes
        legal = evaluation["cross_border_legal_framework"]
        self.assertIn("15 CFR", legal["primary_statute"]["citation"])
        self.assertIn("740.20", legal["primary_statute"]["citation"])
        self.assertIn("Form BIS-711", legal["mandatory_permits"][0])
        self.assertEqual(legal["customs_fast_track_hours"], 24)
        self.assertEqual(len(evaluation["transition_roadmap"]), 5)

        # 3. Execute supply exchange
        receipt = supply_exchange_engine.execute_supply_exchange_action(
            exchange_id=evaluation["exchange_id"],
            supervisor_notes="Authorized by Operations VP via Legal Bridge"
        )
        self.assertEqual(receipt["status"], "SAP_BAPI_PO_STAGED")
        self.assertEqual(receipt["sap_bapi_function"], "BAPI_PO_CREATE1")
        self.assertIn("7736215631", receipt["emergency_sms"]["recipient_phone"])

        # 4. Generate policy for this exchange
        policy = policy_generator.generate_policy_for_supply_exchange(evaluation)
        self.assertIn("POL-XCHG-", policy["policy_id"])
        self.assertIn("Japan", policy["policy_title"])
        self.assertIn("740.20", policy["governing_statutes"])
        self.assertIn("7736215631", policy["emergency_notification_target"])


if __name__ == "__main__":
    unittest.main()

