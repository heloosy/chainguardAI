"""
Tests for ChainGuard AI - Continuous Retraining & Forecast Store
"""
import unittest
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))
from chainguard.validation.forecast_store import forecast_store
from chainguard.validation.retraining_pipeline import pipeline_manager


class TestRetrainingAndGovernance(unittest.TestCase):
    def test_forecast_store_logging_and_reconciliation(self):
        fid = "TEST-FCST-001"
        forecast_store.record_forecast(
            forecast_id=fid,
            entity_type="Component",
            entity_id="CMP-MCU-01",
            inputs={"test_key": "val"},
            prediction={"forecast_horizon_days": 14, "p_delay_ge_3d": 0.78, "uncertainty_std": 0.04},
            recommendation={"title": "Test Air Expedite"}
        )

        all_fc = forecast_store.get_all_forecasts()
        matching = [f for f in all_fc if f["forecast_id"] == fid]
        self.assertEqual(len(matching), 1)
        self.assertEqual(matching[0]["entity_id"], "CMP-MCU-01")

        # Test outcome reconciliation
        success = forecast_store.reconcile_outcome(
            forecast_id=fid,
            actual_lead_time=22.5,
            actual_is_delayed=1
        )
        self.assertTrue(success)

    def test_retraining_increments_version(self):
        curr_ver = pipeline_manager.current_version
        res = pipeline_manager.retrain_with_new_data()
        self.assertEqual(res["status"], "RETRAINED_SUCCESSFULLY")
        self.assertNotEqual(res["new_version"], curr_ver)
        self.assertIn("metrics", res)
        self.assertIn("delta", res)


if __name__ == "__main__":
    unittest.main()

