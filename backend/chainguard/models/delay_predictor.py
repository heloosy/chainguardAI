"""
ChainGuard AI - Calibrated Disruption Predictor
Trained model predicting calibrated probabilities of delay (>=3 days) and severe delay (>=7 days),
along with supporting signals and uncertainty estimates.
"""
import numpy as np
import pandas as pd
from typing import Dict, Any, List, Tuple
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.calibration import CalibratedClassifierCV
from chainguard.models.feature_engineering import extract_features_from_df, FEATURE_COLUMNS


class CalibratedDelayPredictor:
    def __init__(self):
        # Base estimators
        self.base_clf_delay = GradientBoostingClassifier(n_estimators=75, max_depth=3, random_state=42)
        self.base_clf_severe = GradientBoostingClassifier(n_estimators=75, max_depth=3, random_state=42)
        
        # Calibrated wrappers (Sigmoid calibration)
        self.calibrated_delay = CalibratedClassifierCV(estimator=self.base_clf_delay, method="sigmoid", cv=3)
        self.calibrated_severe = CalibratedClassifierCV(estimator=self.base_clf_severe, method="sigmoid", cv=3)
        
        self.feature_names = FEATURE_COLUMNS
        self.feature_importances_: Dict[str, float] = {}
        self.is_fitted = False

    def fit(self, historical_df: pd.DataFrame):
        X = extract_features_from_df(historical_df)
        y_delay = historical_df["is_delayed"].values
        y_severe = historical_df["is_severe_delay"].values

        self.calibrated_delay.fit(X, y_delay)
        self.calibrated_severe.fit(X, y_severe)
        
        # Train a standalone base model to extract feature importances for interpretability
        self.base_clf_delay.fit(X, y_delay)
        importances = self.base_clf_delay.feature_importances_
        self.feature_importances_ = {col: float(imp) for col, imp in zip(self.feature_names, importances)}
        self.is_fitted = True

    def predict_risk(self, record_or_df: Any) -> Dict[str, Any]:
        """
        Runs real inference and returns calibrated probabilities, uncertainty, and supporting signals.
        """
        if isinstance(record_or_df, dict):
            df_in = pd.DataFrame([record_or_df])
        else:
            df_in = record_or_df

        X = extract_features_from_df(df_in)
        
        # Calibrated probabilities: class 1 probability
        p_delay = float(self.calibrated_delay.predict_proba(X)[0][1])
        p_severe = float(self.calibrated_severe.predict_proba(X)[0][1])
        # Severe delay (>=7d) is a subset of delay (>=3d); enforce mathematical monotonicity
        p_severe = min(p_severe, p_delay)

        # Calculate prediction uncertainty via ensemble variance across CV calibrated estimators
        preds = []
        for cal_estimator in self.calibrated_delay.calibrated_classifiers_:
            p = cal_estimator.predict_proba(X)[0][1]
            preds.append(p)
        uncertainty_std = float(np.std(preds)) if len(preds) > 1 else 0.05
        
        # Supporting signals: compute normalized contribution of each feature
        row = X.iloc[0]
        signals = []
        
        # Check notable contributors
        if row["port_congestion_days"] > 2.0:
            signals.append({
                "factor": "Port Congestion Backlog",
                "evidence": f"{row['port_congestion_days']:.1f} days waiting time at destination berth",
                "impact": "High Adverse"
            })
        if row["weather_severity_index"] >= 5.0:
            signals.append({
                "factor": "Adverse Weather / Maritime Cyclonic Alert",
                "evidence": f"Severity Index {row['weather_severity_index']:.1f} / 10.0 along transit corridor",
                "impact": "Medium-High Adverse"
            })
        if row["last_milestone_deviation_days"] > 1.5:
            signals.append({
                "factor": "Transit Milestone Lag",
                "evidence": f"+{row['last_milestone_deviation_days']:.1f} days behind planned checkpoint",
                "impact": "High Adverse"
            })
        if row["supplier_capacity_utilization"] >= 0.85:
            signals.append({
                "factor": "Supplier Capacity Saturation",
                "evidence": f"{row['supplier_capacity_utilization']*100:.0f}% current capacity utilization",
                "impact": "Moderate Adverse"
            })
        if row["supplier_historical_rate"] < 0.85:
            signals.append({
                "factor": "Historical Reliability Deficit",
                "evidence": f"Past on-time delivery rate is only {row['supplier_historical_rate']*100:.1f}%",
                "impact": "Moderate Adverse"
            })
        if row["geopolitical_risk_score"] >= 5.0:
            signals.append({
                "factor": "Geopolitical / Maritime Exclusion Alert",
                "evidence": f"Geopolitical risk rating {row['geopolitical_risk_score']:.1f}/10.0",
                "impact": "Moderate Adverse"
            })
        if row["is_air"] == 1.0:
            signals.append({
                "factor": "Air Express Lane",
                "evidence": "Air transport minimizes maritime chokepoints and customs dwell times",
                "impact": "Favorable"
            })

        # Categorize risk level
        if p_delay >= 0.70 or p_severe >= 0.40:
            risk_tier = "CRITICAL"
        elif p_delay >= 0.45 or p_severe >= 0.20:
            risk_tier = "ELEVATED"
        elif p_delay >= 0.25:
            risk_tier = "MODERATE"
        else:
            risk_tier = "LOW"

        return {
            "p_delay_ge_3d": round(p_delay, 3),
            "p_severe_delay_ge_7d": round(p_severe, 3),
            "uncertainty_std": round(uncertainty_std, 3),
            "confidence_interval_90": [
                round(max(0.0, p_delay - 1.645 * uncertainty_std), 3),
                round(min(1.0, p_delay + 1.645 * uncertainty_std), 3)
            ],
            "risk_tier": risk_tier,
            "supporting_signals": signals,
            "is_calibrated": True,
            "forecast_horizon_days": int(row["agreed_lead_time_days"])
        }
