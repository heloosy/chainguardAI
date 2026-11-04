"""
ChainGuard AI - Lead Time & Quantile Regressor
Predicts continuous lead time distribution (P10, P50, P90) and estimated arrival date intervals.
"""
import numpy as np
import pandas as pd
import datetime
from typing import Dict, Any, List
from sklearn.ensemble import GradientBoostingRegressor
from chainguard.models.feature_engineering import extract_features_from_df


class LeadTimeQuantileRegressor:
    def __init__(self):
        # Three quantile regressors for uncertainty bounds
        self.reg_p10 = GradientBoostingRegressor(loss="quantile", alpha=0.10, n_estimators=60, max_depth=3, random_state=42)
        self.reg_p50 = GradientBoostingRegressor(loss="quantile", alpha=0.50, n_estimators=60, max_depth=3, random_state=42)
        self.reg_p90 = GradientBoostingRegressor(loss="quantile", alpha=0.90, n_estimators=60, max_depth=3, random_state=42)
        self.is_fitted = False

    def fit(self, historical_df: pd.DataFrame):
        X = extract_features_from_df(historical_df)
        y_lead_time = historical_df["actual_lead_time_days"].values

        self.reg_p10.fit(X, y_lead_time)
        self.reg_p50.fit(X, y_lead_time)
        self.reg_p90.fit(X, y_lead_time)
        self.is_fitted = True

    def predict_lead_time(self, record_or_df: Any, departure_date: str = "2026-10-20") -> Dict[str, Any]:
        if isinstance(record_or_df, dict):
            df_in = pd.DataFrame([record_or_df])
        else:
            df_in = record_or_df

        X = extract_features_from_df(df_in)
        p10 = float(self.reg_p10.predict(X)[0])
        p50 = float(self.reg_p50.predict(X)[0])
        p90 = float(self.reg_p90.predict(X)[0])
        
        # Ensure monotonic bounds
        p10 = max(1.0, p10)
        p50 = max(p10, p50)
        p90 = max(p50, p90)

        agreed_lt = float(X["agreed_lead_time_days"].iloc[0])
        expected_delay_days = max(0.0, p50 - agreed_lt)

        # Compute arrival dates
        try:
            dep_dt = datetime.datetime.strptime(departure_date, "%Y-%m-%d")
        except Exception:
            dep_dt = datetime.datetime.now()

        eta_p10_date = (dep_dt + datetime.timedelta(days=int(round(p10)))).strftime("%Y-%m-%d")
        eta_p50_date = (dep_dt + datetime.timedelta(days=int(round(p50)))).strftime("%Y-%m-%d")
        eta_p90_date = (dep_dt + datetime.timedelta(days=int(round(p90)))).strftime("%Y-%m-%d")

        return {
            "agreed_lead_time_days": round(agreed_lt, 1),
            "predicted_lead_time_p50": round(p50, 1),
            "lead_time_interval_90pct": [round(p10, 1), round(p90, 1)],
            "expected_delay_days": round(expected_delay_days, 1),
            "p10_lead_time_days": round(p10, 1),
            "p90_lead_time_days": round(p90, 1),
            "eta_date_p50": eta_p50_date,
            "eta_interval_dates": [eta_p10_date, eta_p90_date]
        }

