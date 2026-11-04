"""
ChainGuard AI - Feature Engineering Pipeline
Transforms raw operational supply chain records into clean numerical feature vectors.
"""
import pandas as pd
import numpy as np
from typing import Dict, Any, List, Tuple

FEATURE_COLUMNS = [
    "agreed_lead_time_days",
    "supplier_capacity_utilization",
    "supplier_historical_rate",
    "supplier_lead_time_drift_pct",
    "weather_severity_index",
    "port_congestion_days",
    "geopolitical_risk_score",
    "last_milestone_deviation_days",
    "is_ocean",
    "is_air",
    "is_truck",
    "supplier_tier"
]


def extract_features_from_df(df: pd.DataFrame) -> pd.DataFrame:
    """
    Extracts standardized features from historical deliveries or live shipment rows.
    """
    X = pd.DataFrame(index=df.index)
    
    # Numeric features
    X["agreed_lead_time_days"] = df["agreed_lead_time_days"].astype(float)
    X["supplier_capacity_utilization"] = df["supplier_capacity_utilization"].astype(float)
    X["supplier_historical_rate"] = df["supplier_historical_rate"].astype(float)
    X["supplier_lead_time_drift_pct"] = df["supplier_lead_time_drift_pct"].astype(float)
    X["weather_severity_index"] = df["weather_severity_index"].astype(float)
    X["port_congestion_days"] = df["port_congestion_days"].astype(float)
    X["geopolitical_risk_score"] = df["geopolitical_risk_score"].astype(float)
    X["last_milestone_deviation_days"] = df["last_milestone_deviation_days"].astype(float)
    
    # Categorical one-hot encoding for transport_mode
    mode = df["transport_mode"].str.lower()
    X["is_ocean"] = (mode == "ocean").astype(float)
    X["is_air"] = (mode == "air").astype(float)
    X["is_truck"] = (mode == "truck").astype(float)

    # Supplier tier
    if "supplier_tier" in df.columns:
        X["supplier_tier"] = df["supplier_tier"].astype(float)
    else:
        X["supplier_tier"] = 1.0

    return X[FEATURE_COLUMNS]


def extract_features_from_dict(record: Dict[str, Any]) -> pd.DataFrame:
    """
    Convenience method for a single operational record dict.
    """
    df = pd.DataFrame([record])
    return extract_features_from_df(df)

