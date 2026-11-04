"""
ChainGuard AI - Baseline Models
Reference baselines for benchmarking predictive accuracy and value-add.
"""
import numpy as np
import pandas as pd
from typing import Dict, Any, List


class NaiveBaseline:
    """
    Standard naive baseline used in traditional ERP systems:
    - Assumes lead time equals supplier's static average/median.
    - Assumes delay probability equals the unconditioned historical late rate.
    - Ignores real-time port congestion, weather, transit milestones, and capacity drifts.
    """
    def __init__(self):
        self.supplier_means: Dict[str, float] = {}
        self.supplier_late_rates: Dict[str, float] = {}
        self.global_mean_lead_time: float = 14.0
        self.global_late_rate: float = 0.20

    def fit(self, historical_df: pd.DataFrame):
        grouped = historical_df.groupby("supplier_id")
        self.supplier_means = grouped["actual_lead_time_days"].median().to_dict()
        self.supplier_late_rates = grouped["is_delayed"].mean().to_dict()
        self.global_mean_lead_time = float(historical_df["actual_lead_time_days"].median())
        self.global_late_rate = float(historical_df["is_delayed"].mean())

    def predict_lead_time(self, supplier_ids: List[str]) -> np.ndarray:
        return np.array([self.supplier_means.get(sid, self.global_mean_lead_time) for sid in supplier_ids])

    def predict_delay_probability(self, supplier_ids: List[str]) -> np.ndarray:
        return np.array([self.supplier_late_rates.get(sid, self.global_late_rate) for sid in supplier_ids])

