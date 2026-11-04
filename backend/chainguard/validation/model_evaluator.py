"""
ChainGuard AI - Model Evaluator & Benchmarking Suite
Evaluates prediction performance using time-based validation splits and
explicitly benchmarks against simple baselines (Naive Median & Static SLA).
"""
import numpy as np
import pandas as pd
from typing import Dict, Any, Tuple
from sklearn.metrics import mean_absolute_error, mean_squared_error, brier_score_loss, precision_score, recall_score, f1_score, roc_auc_score
from chainguard.models.baseline_models import NaiveBaseline
from chainguard.models.feature_engineering import extract_features_from_df


class ModelEvaluator:
    def __init__(self):
        pass

    def evaluate(self, 
                 calibrated_predictor: Any, 
                 lead_time_regressor: Any, 
                 naive_baseline: NaiveBaseline, 
                 test_df: pd.DataFrame) -> Dict[str, Any]:
        """
        Runs comprehensive evaluation on holdout/test operational dataset.
        """
        X_test = extract_features_from_df(test_df)
        y_true_lt = test_df["actual_lead_time_days"].values
        y_true_delay = test_df["is_delayed"].values
        supplier_ids = test_df["supplier_id"].tolist()

        # 1. ChainGuard AI Model Predictions
        p_delay_probs = calibrated_predictor.calibrated_delay.predict_proba(X_test)[:, 1]
        y_pred_delay_binary = (p_delay_probs >= 0.45).astype(int)
        
        pred_lt_p50 = lead_time_regressor.reg_p50.predict(X_test)
        pred_lt_p10 = lead_time_regressor.reg_p10.predict(X_test)
        pred_lt_p90 = lead_time_regressor.reg_p90.predict(X_test)

        # 2. Naive Baseline Predictions
        baseline_lt = naive_baseline.predict_lead_time(supplier_ids)
        baseline_delay_probs = naive_baseline.predict_delay_probability(supplier_ids)
        baseline_delay_binary = (baseline_delay_probs >= 0.45).astype(int)

        # Metrics for Lead Time (MAE, RMSE)
        model_mae = float(mean_absolute_error(y_true_lt, pred_lt_p50))
        model_rmse = float(np.sqrt(mean_squared_error(y_true_lt, pred_lt_p50)))
        baseline_mae = float(mean_absolute_error(y_true_lt, baseline_lt))
        baseline_rmse = float(np.sqrt(mean_squared_error(y_true_lt, baseline_lt)))
        mae_improvement_pct = round(((baseline_mae - model_mae) / baseline_mae) * 100, 1)

        # Metrics for Delay Probability (Brier Score, ROC-AUC, Precision, Recall)
        model_brier = float(brier_score_loss(y_true_delay, p_delay_probs))
        baseline_brier = float(brier_score_loss(y_true_delay, baseline_delay_probs))
        brier_improvement_pct = round(((baseline_brier - model_brier) / baseline_brier) * 100, 1)

        model_prec = float(precision_score(y_true_delay, y_pred_delay_binary, zero_division=0))
        model_rec = float(recall_score(y_true_delay, y_pred_delay_binary, zero_division=0))
        model_f1 = float(f1_score(y_true_delay, y_pred_delay_binary, zero_division=0))
        
        try:
            model_auc = float(roc_auc_score(y_true_delay, p_delay_probs))
        except Exception:
            model_auc = 0.50

        # False Alarms & Missed Disruptions
        # False alarm: Model predicted delay=1, but actual delay=0
        false_alarms = int(np.sum((y_pred_delay_binary == 1) & (y_true_delay == 0)))
        # Missed disruption: Model predicted delay=0, but actual delay=1
        missed_disruptions = int(np.sum((y_pred_delay_binary == 0) & (y_true_delay == 1)))
        total_eval_samples = len(test_df)

        # Interval Coverage: % of true lead times that fell inside [P10, P90]
        within_interval = np.sum((y_true_lt >= pred_lt_p10) & (y_true_lt <= pred_lt_p90))
        interval_coverage_pct = round((within_interval / total_eval_samples) * 100, 1)

        return {
            "evaluation_sample_count": total_eval_samples,
            "chainguard_ai": {
                "lead_time_mae_days": round(model_mae, 2),
                "lead_time_rmse_days": round(model_rmse, 2),
                "delay_brier_score": round(model_brier, 4),
                "roc_auc": round(model_auc, 3),
                "precision": round(model_prec, 3),
                "recall": round(model_rec, 3),
                "f1_score": round(model_f1, 3),
                "p10_p90_interval_coverage_pct": interval_coverage_pct,
                "false_alarms_count": false_alarms,
                "missed_disruptions_count": missed_disruptions,
                "false_alarm_rate": round(false_alarms / total_eval_samples, 3),
                "missed_disruption_rate": round(missed_disruptions / max(1, np.sum(y_true_delay == 1)), 3)
            },
            "naive_baseline": {
                "lead_time_mae_days": round(baseline_mae, 2),
                "lead_time_rmse_days": round(baseline_rmse, 2),
                "delay_brier_score": round(baseline_brier, 4)
            },
            "relative_improvement": {
                "mae_reduction_pct": mae_improvement_pct,
                "brier_score_improvement_pct": brier_improvement_pct,
                "interpretation": f"ChainGuard AI achieves a {mae_improvement_pct}% reduction in lead time error and a {brier_improvement_pct}% improvement in probabilistic calibration over the naive baseline."
            }
        }

