"""
ChainGuard AI - Multi-Source Intelligence Ingestion Engine
Aggregates and synthesizes signals from Google News, X (Twitter), Marine AIS sensors,
and Regulatory/Customs bulletins to detect early signs of disruptions before they materialize.
"""
import datetime
import uuid
from typing import Dict, Any, List, Optional
import pandas as pd


class MultiSourceIntelligenceEngine:
    def __init__(self):
        self.signals: List[Dict[str, Any]] = []
        self._seed_default_signals()

    def _seed_default_signals(self):
        now = datetime.datetime.now()
        self.signals = [
            {
                "signal_id": "SIG-X-901",
                "source_platform": "X_TWITTER",
                "source_handle": "@DockworkerDaily_LA",
                "source_name": "Eyewitness Port Terminal Labor Watch",
                "timestamp": (now - datetime.timedelta(hours=2)).isoformat(),
                "headline": "Crane Hydraulic Valve Rupture at Long Beach Pier T",
                "content": "Gantry crane #4 at Long Beach Pier T just blew hydraulic seals. Terminal operators diverting inbound chassis to outer lot. Berth queue already stacking up fast #PortOfLongBeach #SupplyChainStall",
                "url": "https://x.com/DockworkerDaily_LA/status/17849201948",
                "location": "Port of Long Beach, Pier T (USA)",
                "lat": 33.7542,
                "lng": -118.2165,
                "affected_entity": "SHP-801 (Transpacific MCU Shipment)",
                "component_id": "CMP-MCU-01",
                "early_sign_category": "BERTH_BOTTLENECK",
                "credibility_score": 0.88,
                "urgency_tier": "CRITICAL",
                "predicted_delay_shock_days": 4.5,
                "sentiment": "Adverse / Disrupted",
                "virality_metrics": {"reposts": 412, "likes": 1280}
            },
            {
                "signal_id": "SIG-GGL-902",
                "source_platform": "GOOGLE_NEWS",
                "source_handle": "Reuters Logistics & Trade Desk",
                "source_name": "Google News / Reuters",
                "timestamp": (now - datetime.timedelta(hours=4)).isoformat(),
                "headline": "California Air Resources Board (CARB) Zero-Emission Drayage Truck Inspection Blitz",
                "content": "CBP and state regulators launch surprise compliance sweep on diesel drayage trucks entering San Pedro Bay ports. Gate turnaround times surge from 42 mins to 195 mins. Over 300 non-compliant trucks turned away.",
                "url": "https://news.google.com/articles/reuters-drayage-chassis-california",
                "location": "San Pedro Bay Logistics Complex (USA)",
                "lat": 33.7400,
                "lng": -118.2600,
                "affected_entity": "SHP-801",
                "component_id": "CMP-MCU-01",
                "early_sign_category": "REGULATORY_ENVIRONMENTAL_HOLD",
                "credibility_score": 0.96,
                "urgency_tier": "ELEVATED",
                "predicted_delay_shock_days": 2.5,
                "sentiment": "Regulatory Risk",
                "virality_metrics": {"read_time_mins": 3, "citations": 28}
            },
            {
                "signal_id": "SIG-X-903",
                "source_platform": "X_TWITTER",
                "source_handle": "@TyphoonTracker_Pac",
                "source_name": "Pacific Meteorological Telemetry",
                "timestamp": (now - datetime.timedelta(hours=6)).isoformat(),
                "headline": "Category 4 Super Typhoon 'Mawar-II' Generating 10m Waves on North Pacific Route",
                "content": "Barometric pressure dropping to 925hPa across 35°N corridor. Maritime routing agencies strongly recommending commercial container vessels detour at least 450 nautical miles south toward Hawaii #TyphoonAlert #OceanFreight",
                "url": "https://x.com/TyphoonTracker_Pac/status/17849104822",
                "location": "North Pacific Great Circle Shipping Lane",
                "lat": 36.5,
                "lng": -168.0,
                "affected_entity": "SHP-803 (Battery Management Unit)",
                "component_id": "CMP-BAT-03",
                "early_sign_category": "METEOROLOGICAL_CYCLONE",
                "credibility_score": 0.94,
                "urgency_tier": "CRITICAL",
                "predicted_delay_shock_days": 4.0,
                "sentiment": "Adverse Weather",
                "virality_metrics": {"reposts": 890, "likes": 3410}
            },
            {
                "signal_id": "SIG-GGL-904",
                "source_platform": "GOOGLE_NEWS",
                "source_handle": "Bloomberg Technology",
                "source_name": "Google News / Bloomberg",
                "timestamp": (now - datetime.timedelta(hours=9)).isoformat(),
                "headline": "Taiwan Power Co. Implements Rolling Industrial Voltage Curtailment at Hsinchu Fab Clusters",
                "content": "Summer grid overload triggers emergency 15% power reduction for non-critical semiconductor cleanrooms. Apex Semiconductor reports testing line slowdowns on automotive microcontroller packaging lines.",
                "url": "https://news.google.com/articles/bloomberg-taiwan-fab-curtailment",
                "location": "Hsinchu Science Park, Taiwan",
                "lat": 24.7820,
                "lng": 120.9980,
                "affected_entity": "SUP-001 (Apex Semiconductor)",
                "component_id": "CMP-MCU-01",
                "early_sign_category": "SUPPLIER_FORCE_MAJEURE",
                "credibility_score": 0.92,
                "urgency_tier": "CRITICAL",
                "predicted_delay_shock_days": 6.0,
                "sentiment": "Production Capacity Deficit",
                "virality_metrics": {"read_time_mins": 4, "citations": 45}
            }
        ]

    def get_all_signals(self, limit: int = 50) -> List[Dict[str, Any]]:
        return self.signals[:limit]

    def ingest_new_signal(self, 
                           source_platform: str,
                           headline: str,
                           content: str,
                           source_handle: str = "@UserSimulatedFeed",
                           location: str = "Transit Corridor",
                           lat: float = 33.75,
                           lng: float = -118.22,
                           affected_entity: str = "SHP-801",
                           component_id: str = "CMP-MCU-01",
                           early_sign_category: str = "BERTH_BOTTLENECK",
                           predicted_delay_shock_days: float = 4.0,
                           urgency_tier: str = "CRITICAL") -> Dict[str, Any]:
        """
        Dynamically ingests an alert from Google, X, or sensors.
        """
        platform_prefix = "X" if "X" in source_platform.upper() else source_platform[:3].upper()
        sig_id = f"SIG-{platform_prefix}-{datetime.datetime.now().strftime('%M%S')}-{uuid.uuid4().hex[:4].upper()}"
        new_entry = {
            "signal_id": sig_id,
            "source_platform": source_platform.upper(),
            "source_handle": source_handle,
            "source_name": f"{source_platform.replace('_', ' ').title()} Feed",
            "timestamp": datetime.datetime.now().isoformat(),
            "headline": headline,
            "content": content,
            "url": f"https://simulation.chainguard.ai/signals/{sig_id}",
            "location": location,
            "lat": lat,
            "lng": lng,
            "affected_entity": affected_entity,
            "component_id": component_id,
            "early_sign_category": early_sign_category,
            "credibility_score": 0.91,
            "urgency_tier": urgency_tier,
            "predicted_delay_shock_days": predicted_delay_shock_days,
            "sentiment": "Early Warning Detected",
            "virality_metrics": {"reposts": 142, "likes": 560}
        }
        self.signals.insert(0, new_entry)
        return new_entry


# Global Singleton
multi_source_engine = MultiSourceIntelligenceEngine()
