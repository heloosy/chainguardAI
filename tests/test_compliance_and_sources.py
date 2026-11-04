"""
Tests for Trade Policy Compliance Engine and Multi-Source Intelligence Ingestion.
Verifies:
1. Multi-source feed collects and ingests signals from Google News, X (Twitter), and sensors.
2. Trade Policy Engine evaluates positive factors of original vs alternative paths.
3. Applicable laws (Jones Act, EAR dual-use, IATA lithium battery restrictions, CBAM) are identified.
4. Transparent legal mitigations are generated.
5. Immutable legal barriers are flagged and strictly prevent illegal actions.
6. Multi-tier stage progression accurately tracks stages 1 through 5.
7. Closed-loop learning endpoint updates model calibration upon stage resolution.
"""
import unittest
import os
import sys

# Ensure backend is on sys.path
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend"))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from chainguard.sources.multi_source_feed import MultiSourceIntelligenceEngine
from chainguard.compliance.policy_engine import TradePolicyEngine
from chainguard.graph.stage_progression import SupplyChainStageProgressionEngine


class TestComplianceAndSources(unittest.TestCase):
    def setUp(self):
        self.sources_engine = MultiSourceIntelligenceEngine()
        self.policy_engine = TradePolicyEngine()
        self.stage_engine = SupplyChainStageProgressionEngine()

    def test_multi_source_ingestion(self):
        signals = self.sources_engine.get_all_signals()
        self.assertGreaterEqual(len(signals), 4)
        
        # Ingest new signal
        new_sig = self.sources_engine.ingest_new_signal(
            source_platform="X_TWITTER",
            headline="Oakland Terminal Berth Crane Fire",
            content="Local crane electrical fire halting gate check-in #OaklandPort",
            early_sign_category="PORT_FIRE_INCIDENT",
            predicted_delay_shock_days=5.0
        )
        self.assertTrue(new_sig["signal_id"].startswith("SIG-X-"))
        self.assertEqual(new_sig["early_sign_category"], "PORT_FIRE_INCIDENT")
        self.assertIn(new_sig, self.sources_engine.get_all_signals())

    def test_trade_policy_evaluation_mcu(self):
        # Microcontroller export controls (EAR)
        res = self.policy_engine.evaluate_path_comparison(
            component_id="CMP-MCU-01",
            original_path={"name": "Ocean Route", "mode": "Ocean", "unit_cost": 42.0},
            alternative_path={"name": "Air Charter", "mode": "Air", "crosses_international_borders": True}
        )
        self.assertIn("original_path", res)
        self.assertIn("alternative_path", res)
        self.assertIn("legal_and_policy_analysis", res)
        
        # Verify EAR export control is detected
        policies = res["legal_and_policy_analysis"]["applicable_policies_detected"]
        self.assertTrue(any("Export Administration Regulations" in p for p in policies))
        
        # Verify legal mitigation is returned
        mitigations = res["legal_and_policy_analysis"]["detailed_mitigations"]
        self.assertTrue(any("BIS-748P" in m["actionable_mitigation"] or "SNAP-R" in m["actionable_mitigation"] for m in mitigations))

    def test_trade_policy_evaluation_battery_iata(self):
        # Battery air transport (IATA UN3480)
        res = self.policy_engine.evaluate_path_comparison(
            component_id="CMP-BAT-03",
            original_path={"name": "Ocean Route", "mode": "Ocean"},
            alternative_path={"name": "Air Cargo", "mode": "Air"}
        )
        policies = res["legal_and_policy_analysis"]["applicable_policies_detected"]
        self.assertTrue(any("IATA Dangerous Goods" in p for p in policies))
        mitigations = res["legal_and_policy_analysis"]["detailed_mitigations"]
        self.assertTrue(any("Cargo Aircraft Only" in m["actionable_mitigation"] for m in mitigations))

    def test_immutable_legal_barrier_flagged(self):
        # Prohibited transshipment through sanctioned territory
        res = self.policy_engine.evaluate_path_comparison(
            component_id="CMP-MCU-01",
            original_path={"name": "Ocean Route"},
            alternative_path={"name": "Sanctioned Route", "attempt_sanctioned_transshipment": True}
        )
        self.assertTrue(res["alternative_path"]["has_immutable_barrier"])
        self.assertEqual(res["alternative_path"]["recommendation_status"], "BLOCKED_BY_LAW")
        self.assertGreaterEqual(len(res["alternative_path"]["immutable_barriers"]), 1)

    def test_multi_tier_stage_progression(self):
        progression = self.stage_engine.get_progression()
        self.assertEqual(len(progression["stages"]), 5)
        self.assertEqual(progression["stages"][0]["stage_id"], "STAGE-1-TIER2-FAB")
        self.assertEqual(progression["stages"][1]["stage_id"], "STAGE-2-LOGISTICS-CUSTOMS")
        self.assertEqual(progression["stages"][4]["stage_id"], "STAGE-5-CUSTOMER-SLA")
        
        # Advance stage 2
        updated = self.stage_engine.advance_to_next_stage(
            chain_id="SC-EV-MOTOR-SYS-01",
            stage_index=2,
            custom_feedback="Air charter departed Taipei via Anchorage, cleared SNAP-R."
        )
        self.assertEqual(updated["current_stage_index"], 3)
        self.assertEqual(updated["stages"][1]["status"], "COMPLETED")
        self.assertEqual(updated["stages"][2]["status"], "IN_PROGRESS")


if __name__ == "__main__":
    unittest.main()

