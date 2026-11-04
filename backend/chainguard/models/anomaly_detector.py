"""
ChainGuard AI - Statistical Anomaly & Trend Detector
Detects statistical deviations in milestone progression, transit velocities, and supplier lead-time drift.
"""
import numpy as np
import pandas as pd
from typing import Dict, Any, List


class StatisticalAnomalyDetector:
    def __init__(self, z_threshold: float = 2.0):
        self.z_threshold = z_threshold
        self.stats: Dict[str, Dict[str, float]] = {}

    def fit(self, historical_df: pd.DataFrame):
        for col in ["last_milestone_deviation_days", "port_congestion_days", "weather_severity_index"]:
            mean_val = float(historical_df[col].mean())
            std_val = float(historical_df[col].std())
            self.stats[col] = {"mean": mean_val, "std": max(0.01, std_val)}

    def detect_anomalies(self, shipment_record: Dict[str, Any]) -> List[Dict[str, Any]]:
        anomalies = []
        for col, stat in self.stats.items():
            if col in shipment_record:
                val = float(shipment_record[col])
                z_score = (val - stat["mean"]) / stat["std"]
                if z_score >= self.z_threshold:
                    anomalies.append({
                        "metric": col,
                        "current_value": round(val, 2),
                        "baseline_mean": round(stat["mean"], 2),
                        "z_score": round(z_score, 2),
                        "severity": "CRITICAL" if z_score >= 3.0 else "WARNING",
                        "description": f"{col.replace('_', ' ').title()} is {z_score:.1f} standard deviations above normal operating range."
                    })
        return anomalies

