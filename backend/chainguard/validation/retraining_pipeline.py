"""
ChainGuard AI - Model Retraining & Continuous Calibration Pipeline
Implements real retraining, model versioning, and validation comparison.
"""
import datetime
import pandas as pd
from typing import Dict, Any, Tuple
from chainguard.models.delay_predictor import CalibratedDelayPredictor
from chainguard.models.lead_time_regressor import LeadTimeQuantileRegressor
from chainguard.models.baseline_models import NaiveBaseline
from chainguard.models.anomaly_detector import StatisticalAnomalyDetector
from chainguard.validation.model_evaluator import ModelEvaluator
from chainguard.validation.forecast_store import forecast_store
from chainguard.data.storage import storage


class ModelPipelineManager:
    def __init__(self):
        self.calibrated_predictor = CalibratedDelayPredictor()
        self.lead_time_regressor = LeadTimeQuantileRegressor()
        self.anomaly_detector = StatisticalAnomalyDetector()
        self.naive_baseline = NaiveBaseline()
        self.evaluator = ModelEvaluator()
        self.current_version = "v1.0"
        self.last_eval_metrics: Dict[str, Any] = {}
        self.version_counter = 0

    def train_initial_models(self):
        """
        Trains initial v1.0 models on historical deliveries using time-based split.
        """
        df_hist = storage.get_table("historical_deliveries")
        
        # Sort by delivery_date for strict time-based validation
        df_sorted = df_hist.sort_values("delivery_date")
        n_train = int(len(df_sorted) * 0.80)
        train_df = df_sorted.iloc[:n_train]
        test_df = df_sorted.iloc[n_train:]

        # Train models
        self.calibrated_predictor.fit(train_df)
        self.lead_time_regressor.fit(train_df)
        self.anomaly_detector.fit(train_df)
        self.naive_baseline.fit(train_df)

        # Run validation
        eval_results = self.evaluator.evaluate(
            self.calibrated_predictor,
            self.lead_time_regressor,
            self.naive_baseline,
            test_df
        )
        self.last_eval_metrics = eval_results

        # Log v1.0 to forecast store
        forecast_store.record_model_version({
            "version": "v1.0",
            "training_sample_count": len(train_df),
            "mae_lead_time": eval_results["chainguard_ai"]["lead_time_mae_days"],
            "brier_score": eval_results["chainguard_ai"]["delay_brier_score"],
            "precision_score": eval_results["chainguard_ai"]["precision"],
            "recall_score": eval_results["chainguard_ai"]["recall"],
            "baseline_mae": eval_results["naive_baseline"]["lead_time_mae_days"],
            "baseline_brier": eval_results["naive_baseline"]["delay_brier_score"],
            "notes": "Initial benchmark calibration on 80/20 time-based split."
        })
        self.current_version = "v1.0"

    def retrain_with_new_data(self, additional_records_df: pd.DataFrame = None) -> Dict[str, Any]:
        """
        Ingests newly reconciled delivery outcomes, retrains models,
        increments version (e.g. v1.1), and compares before/after metrics.
        """
        df_hist = storage.get_table("historical_deliveries")
        if additional_records_df is not None and not additional_records_df.empty:
            df_hist = pd.concat([df_hist, additional_records_df], ignore_index=True)
            storage.save_table("historical_deliveries", df_hist)

        # Increment version
        prev_version = self.current_version
        self.version_counter += 1
        new_version = f"v1.{self.version_counter}"
        
        # Time-based split on full expanded dataset
        df_sorted = df_hist.sort_values("delivery_date")
        n_train = int(len(df_sorted) * 0.85)
        train_df = df_sorted.iloc[:n_train]
        test_df = df_sorted.iloc[n_train:]

        old_metrics = dict(self.last_eval_metrics)

        # Retrain models
        self.calibrated_predictor.fit(train_df)
        self.lead_time_regressor.fit(train_df)
        self.anomaly_detector.fit(train_df)
        self.naive_baseline.fit(train_df)

        # Re-evaluate
        new_eval = self.evaluator.evaluate(
            self.calibrated_predictor,
            self.lead_time_regressor,
            self.naive_baseline,
            test_df
        )
        self.last_eval_metrics = new_eval
        self.current_version = new_version

        # Record new version
        forecast_store.record_model_version({
            "version": new_version,
            "training_sample_count": len(train_df),
            "mae_lead_time": new_eval["chainguard_ai"]["lead_time_mae_days"],
            "brier_score": new_eval["chainguard_ai"]["delay_brier_score"],
            "precision_score": new_eval["chainguard_ai"]["precision"],
            "recall_score": new_eval["chainguard_ai"]["recall"],
            "baseline_mae": new_eval["naive_baseline"]["lead_time_mae_days"],
            "baseline_brier": new_eval["naive_baseline"]["delay_brier_score"],
            "notes": f"Retrained on {len(train_df)} historical deliveries."
        })

        # Calculate metric deltas
        old_mae = old_metrics.get("chainguard_ai", {}).get("lead_time_mae_days", new_eval["chainguard_ai"]["lead_time_mae_days"])
        new_mae = new_eval["chainguard_ai"]["lead_time_mae_days"]
        old_brier = old_metrics.get("chainguard_ai", {}).get("delay_brier_score", new_eval["chainguard_ai"]["delay_brier_score"])
        new_brier = new_eval["chainguard_ai"]["delay_brier_score"]

        return {
            "status": "RETRAINED_SUCCESSFULLY",
            "previous_version": prev_version,
            "new_version": new_version,
            "training_samples": len(train_df),
            "test_samples": len(test_df),
            "metrics": new_eval,
            "delta": {
                "mae_change_days": round(new_mae - old_mae, 3),
                "brier_change": round(new_brier - old_brier, 4)
            }
        }


# Global manager singleton
pipeline_manager = ModelPipelineManager()
