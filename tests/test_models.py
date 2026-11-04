"""
Tests for ChainGuard AI - ML Prediction Engine
"""
import unittest
import numpy as np
import pandas as pd
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))
from chainguard.data.storage import storage
from chainguard.validation.retraining_pipeline import pipeline_manager


class TestPredictionModels(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        if not pipeline_manager.calibrated_predictor.is_fitted:
            pipeline_manager.train_initial_models()

    def test_calibrated_probabilities_bounded(self):
        sample_input = {
            "agreed_lead_time_days": 18.0,
            "supplier_capacity_utilization": 0.92,
            "supplier_historical_rate": 0.75,
            "supplier_lead_time_drift_pct": 20.0,
            "weather_severity_index": 7.0,
            "port_congestion_days": 4.5,
            "geopolitical_risk_score": 6.0,
            "last_milestone_deviation_days": 3.0,
            "transport_mode": "Ocean",
            "supplier_tier": 1
        }
        res = pipeline_manager.calibrated_predictor.predict_risk(sample_input)
        self.assertIn("p_delay_ge_3d", res)
        self.assertIn("p_severe_delay_ge_7d", res)
        self.assertTrue(0.0 <= res["p_delay_ge_3d"] <= 1.0)
        self.assertTrue(0.0 <= res["p_severe_delay_ge_7d"] <= 1.0)
        self.assertTrue(res["p_severe_delay_ge_7d"] <= res["p_delay_ge_3d"])
        self.assertTrue(len(res["supporting_signals"]) > 0)
        self.assertIn(res["risk_tier"], ["LOW", "MODERATE", "ELEVATED", "CRITICAL"])

    def test_lead_time_intervals_monotonic(self):
        sample_input = {
            "agreed_lead_time_days": 14.0,
            "supplier_capacity_utilization": 0.85,
            "supplier_historical_rate": 0.80,
            "supplier_lead_time_drift_pct": 10.0,
            "weather_severity_index": 4.0,
            "port_congestion_days": 2.0,
            "geopolitical_risk_score": 3.0,
            "last_milestone_deviation_days": 1.0,
            "transport_mode": "Ocean",
            "supplier_tier": 1
        }
        res = pipeline_manager.lead_time_regressor.predict_lead_time(sample_input)
        p10 = res["p10_lead_time_days"]
        p50 = res["predicted_lead_time_p50"]
        p90 = res["p90_lead_time_days"]
        self.assertTrue(p10 <= p50 <= p90, f"Monotonicity failed: {p10} <= {p50} <= {p90}")

    def test_metrics_beat_naive_baseline(self):
        metrics = pipeline_manager.last_eval_metrics
        chainguard_mae = metrics["chainguard_ai"]["lead_time_mae_days"]
        baseline_mae = metrics["naive_baseline"]["lead_time_mae_days"]
        self.assertLess(chainguard_mae, baseline_mae)
        self.assertGreater(metrics["relative_improvement"]["mae_reduction_pct"], 0)


if __name__ == "__main__":
    unittest.main()

