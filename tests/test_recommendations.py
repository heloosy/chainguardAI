"""
Tests for ChainGuard AI - Recommendations & Cost-Benefit Optimizer
"""
import unittest
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))
from chainguard.recommendations.cost_benefit_optimizer import PreventiveActionOptimizer
from chainguard.recommendations.verification_rules import VerificationEngine


class TestRecommendations(unittest.TestCase):
    def setUp(self):
        self.optimizer = PreventiveActionOptimizer()

    def test_recommendation_generation_and_tradeoffs(self):
        consequence_data = {
            "total_unmitigated_loss_usd": 190_000.0,
            "coverage_gap_days": 4.0,
            "daily_consumption_rate": 70.0
        }
        pred_data = {
            "p_delay_ge_3d": 0.85
        }
        comp_row = {
            "component_id": "CMP-MCU-01",
            "unit_cost_usd": 85.0
        }
        sup_row = {
            "supplier_id": "SUP-001",
            "name": "Apex Semiconductor"
        }
        
        opt_res = self.optimizer.optimize_actions(
            component_id="CMP-MCU-01",
            consequence_data=consequence_data,
            prediction_data=pred_data,
            component_row=comp_row,
            supplier_row=sup_row,
            alt_supplier_row=None
        )

        self.assertTrue(opt_res["threshold_crossed"])
        self.assertIn("recommended_action", opt_res)
        self.assertIn("do_nothing_baseline", opt_res)
        self.assertTrue(len(opt_res["all_evaluated_options"]) > 0)
        
        # Verify recommended action has positive ROI compared to unmitigated loss
        rec = opt_res["recommended_action"]
        self.assertGreater(rec["net_financial_benefit_usd"], 0)
        self.assertGreater(rec["expected_risk_reduction_pct"], 0)
        self.assertIn("unintended_consequences", rec)

    def test_verification_flags_raised(self):
        engine = VerificationEngine()
        flags = engine.inspect_action_prerequisites("SECONDARY_SUPPLIER", {
            "alternative_supplier_name": "Silicon Saxony",
            "component_id": "CMP-MCU-01"
        })
        self.assertTrue(len(flags) > 0)
        self.assertEqual(flags[0]["status"], "VERIFICATION_REQUIRED")


if __name__ == "__main__":
    unittest.main()

