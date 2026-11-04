"""
ChainGuard AI - Dual-Stream Risk Detection & Correlation Engine
Monitors two continuous data streams:
1. Internal Enterprise Telemetry: SAP S/4HANA (delivery drift), SAP IBP (inventory burn rate anomaly),
   SAP Ariba (supplier capacity/backorders), and SAP TM (milestone dwell).
2. External Threat Intelligence: News, weather radar, maritime AIS, and social signals.

Crucially detects silent operational failures that have zero public reports or news coverage,
as well as compound risks where internal delivery drift collides with external shocks.
"""
import datetime
from typing import Dict, Any, List, Optional


class DualStreamDetector:
    """
    Ingests and correlates internal enterprise ERP telemetry with external threat intelligence.
    """

    def get_internal_telemetry(
        self,
        component_id: str = "CMP-MCU-01",
        scenario_id: str = "INTERNAL_LEAD_TIME_DRIFT"
    ) -> Dict[str, Any]:
        """
        Retrieves live internal operational telemetry from SAP modules:
        - SAP S/4HANA: Historical PO goods receipt lead-time drift
        - SAP IBP: Consumption rate anomaly vs planned BOM run rate
        - SAP Ariba: Supplier capacity commitments and PO confirmation aging
        - SAP TM: Transport milestone tracking and transit dwell stalls
        """
        now_str = datetime.datetime.now().strftime("%H:%M:%S")

        if scenario_id == "INTERNAL_LEAD_TIME_DRIFT":
            # Scenario A: Silent internal degradation (Creeping lead time + burn surge)
            po_history = [
                {"po_id": "PO-498", "order_date": "T-28d", "delivery_days": 14.1, "status": "DELIVERED_ON_TIME"},
                {"po_id": "PO-499", "order_date": "T-21d", "delivery_days": 16.8, "status": "SLIGHT_SLIP"},
                {"po_id": "PO-500", "order_date": "T-14d", "delivery_days": 19.5, "status": "MODERATE_DELAY"},
                {"po_id": "PO-501", "order_date": "T-7d",  "delivery_days": 22.4, "status": "CRITICAL_DRIFT"}
            ]

            signals = [
                {
                    "stream": "INTERNAL",
                    "system": "SAP S/4HANA (EKBE/EKPO)",
                    "signal_id": "INT-S4-PO-DRIFT",
                    "timestamp": "T-1h",
                    "metric": "Supplier Delivery Lead-Time Drift",
                    "baseline_value": "14.0 Days (SLA Target)",
                    "observed_value": "22.4 Days (+59.0% Drift)",
                    "trend": "STEADY_DEGRADATION",
                    "severity": "CRITICAL",
                    "anomaly_detected": True,
                    "detail": "Historical SAP goods receipt records show lead times from Apex Semiconductor (SUP-007) have crept up over 4 consecutive purchase order cycles without formal vendor delay notification."
                },
                {
                    "stream": "INTERNAL",
                    "system": "SAP IBP (Inventory & Demand)",
                    "signal_id": "INT-IBP-BURN-ANOMALY",
                    "timestamp": "T-2h",
                    "metric": "Daily Component Burn Rate Variance",
                    "baseline_value": "250 Units / Day (Planned)",
                    "observed_value": "315 Units / Day (+26.0% Burn Surge)",
                    "trend": "ACCELERATED_DEPLETION",
                    "severity": "HIGH",
                    "anomaly_detected": True,
                    "detail": "Detroit Plant 1010 MES SMT production line has accelerated consumption to support downstream Titan OEM assembly ramp. Current on-hand inventory of 1,638 units will exhaust in 5.2 days (down from planned 12.0 days)."
                },
                {
                    "stream": "INTERNAL",
                    "system": "SAP Ariba (Supplier Network)",
                    "signal_id": "INT-ARIBA-CAPACITY-CUT",
                    "timestamp": "T-3h",
                    "metric": "Supplier Line Capacity Acknowledgment",
                    "baseline_value": "100% Commitment (2,500 units/wk)",
                    "observed_value": "70% Commitment (1,750 units/wk)",
                    "trend": "CAPACITY_CONSTRAINT",
                    "severity": "MEDIUM",
                    "anomaly_detected": True,
                    "detail": "Apex Semiconductor cleanroom maintenance schedule flagged a 30% reduction in secondary bumping throughput for the next 2 billing cycles."
                },
                {
                    "stream": "INTERNAL",
                    "system": "SAP TM / Global Track & Trace (GTT)",
                    "signal_id": "INT-SAPTM-DWELL-STALL",
                    "timestamp": "T-4h",
                    "metric": "Intermodal Inland Waypoint Dwell",
                    "baseline_value": "18.0 Hours Standard Transit Dwell",
                    "observed_value": "74.2 Hours Stagnant Waypoint Dwell",
                    "trend": "UNANNOUNCED_STALL",
                    "severity": "HIGH",
                    "anomaly_detected": True,
                    "detail": "Tracking ID GTT-SHP-801-TW EDI 214 status messages indicate container dwell at feeder waypoint exceeds normal corridor threshold by 56 hours."
                }
            ]

            summary = {
                "internal_risk_level": "CRITICAL",
                "lead_time_drift_days": 8.4,
                "lead_time_drift_pct": 59.0,
                "burn_rate_variance_pct": 26.0,
                "projected_runout_days": 5.2,
                "coverage_gap_days": 6.2,
                "lead_time_history": po_history,
                "unannounced_disruption": True,
                "detection_verdict": "SILENT INTERNAL OPERATIONAL DRIFT: Supplier delivery creep (+8.4d) combined with accelerated factory burn (+26%) creates an unannounced 6.2-day production stockout."
            }

        elif scenario_id == "COMPOUND_RISK":
            # Scenario B: Compound risk (Internal supplier drift was already occurring + external cyclone hits)
            po_history = [
                {"po_id": "PO-499", "order_date": "T-21d", "delivery_days": 14.5, "status": "DELIVERED"},
                {"po_id": "PO-500", "order_date": "T-14d", "delivery_days": 18.0, "status": "SLIPPING"},
                {"po_id": "PO-501", "order_date": "T-7d",  "delivery_days": 21.0, "status": "DELAYED"}
            ]

            signals = [
                {
                    "stream": "INTERNAL",
                    "system": "SAP S/4HANA (EKBE)",
                    "signal_id": "INT-S4-PRE-DRIFT",
                    "timestamp": "T-1h",
                    "metric": "Pre-Existing Supplier Lead-Time Slip",
                    "baseline_value": "14.0 Days",
                    "observed_value": "21.0 Days (+50.0% Slip)",
                    "trend": "PRE_EXISTING_VULNERABILITY",
                    "severity": "HIGH",
                    "anomaly_detected": True,
                    "detail": "Supplier SUP-007 was already operating 7 days behind scheduled replenishment cadence before external weather events formed."
                },
                {
                    "stream": "INTERNAL",
                    "system": "SAP IBP (Plant Buffer)",
                    "signal_id": "INT-IBP-DEPLETED-BUFFER",
                    "timestamp": "T-2h",
                    "metric": "Factory Safety Stock Depletion",
                    "baseline_value": "14.0 Days Buffer Target",
                    "observed_value": "4.8 Days Buffer Remaining",
                    "trend": "CRITICAL_MARGIN",
                    "severity": "CRITICAL",
                    "anomaly_detected": True,
                    "detail": "Because previous deliveries arrived late, Detroit Plant 1010 has depleted 65% of its safety buffer, leaving zero tolerance for external transport shocks."
                }
            ]

            summary = {
                "internal_risk_level": "HIGH",
                "lead_time_drift_days": 7.0,
                "lead_time_drift_pct": 50.0,
                "burn_rate_variance_pct": 12.0,
                "projected_runout_days": 4.8,
                "coverage_gap_days": 7.5,
                "lead_time_history": po_history,
                "unannounced_disruption": False,
                "detection_verdict": "COMPOUND MULTI-STREAM THREAT: Pre-existing internal lead-time slip (+7d) erased safety margins; incoming external storm will cause immediate assembly shutdown."
            }

        else:
            # Scenario C: Pure external disruption (Baseline internal operations nominal)
            po_history = [
                {"po_id": "PO-498", "order_date": "T-28d", "delivery_days": 13.9, "status": "DELIVERED"},
                {"po_id": "PO-499", "order_date": "T-21d", "delivery_days": 14.1, "status": "DELIVERED"},
                {"po_id": "PO-500", "order_date": "T-14d", "delivery_days": 14.0, "status": "DELIVERED"},
                {"po_id": "PO-501", "order_date": "T-7d",  "delivery_days": 14.2, "status": "NOMINAL"}
            ]

            signals = [
                {
                    "stream": "INTERNAL",
                    "system": "SAP S/4HANA (EKBE)",
                    "signal_id": "INT-S4-NOMINAL",
                    "timestamp": "T-1h",
                    "metric": "PO Delivery Lead Time",
                    "baseline_value": "14.0 Days",
                    "observed_value": "14.2 Days (Normal)",
                    "trend": "STABLE",
                    "severity": "LOW",
                    "anomaly_detected": False,
                    "detail": "Internal SAP procurement records reflect normal historical lead-time cadence prior to external environmental disruption."
                },
                {
                    "stream": "INTERNAL",
                    "system": "SAP IBP (Plant Buffer)",
                    "signal_id": "INT-IBP-NOMINAL",
                    "timestamp": "T-2h",
                    "metric": "Consumption Rate",
                    "baseline_value": "250 Units / Day",
                    "observed_value": "252 Units / Day (Normal)",
                    "trend": "STABLE",
                    "severity": "LOW",
                    "anomaly_detected": False,
                    "detail": "Factory SMT assembly consumption tracking accurately against planned master schedule."
                }
            ]

            summary = {
                "internal_risk_level": "LOW",
                "lead_time_drift_days": 0.2,
                "lead_time_drift_pct": 1.4,
                "burn_rate_variance_pct": 0.8,
                "projected_runout_days": 4.8,
                "coverage_gap_days": 4.1,
                "lead_time_history": po_history,
                "unannounced_disruption": False,
                "detection_verdict": "NOMINAL INTERNAL OPERATIONS: Internal SAP metrics stable. Threat originates purely from external environmental disruption."
            }

        return {
            "scenario_id": scenario_id,
            "component_id": component_id,
            "signals": signals,
            "summary": summary
        }

    def get_external_signals(
        self,
        scenario_id: str = "INTERNAL_LEAD_TIME_DRIFT"
    ) -> List[Dict[str, Any]]:
        """
        Retrieves external intelligence signals (News, Weather radar, Marine AIS, Social).
        For INTERNAL_LEAD_TIME_DRIFT, explicitly demonstrates that external signals are 100% calm and nominal!
        """
        if scenario_id == "INTERNAL_LEAD_TIME_DRIFT":
            # External world is completely calm: No news, no weather alerts, no tweets
            return [
                {
                    "stream": "EXTERNAL",
                    "source": "Global Weather Radar (NOAA / IMD)",
                    "signal_id": "EXT-WX-NOMINAL",
                    "category": "Weather Alert",
                    "timestamp": "T-4h",
                    "headline": "Clear Sea State in North Indian Ocean",
                    "content": "All coastal radar sweeps show nominal maritime meteorological conditions. Sea state 2, wind 8-12 knots. Zero cyclone activity reported.",
                    "status": "NOMINAL_NO_ALERT",
                    "threat_level": "NONE",
                    "verified": True
                },
                {
                    "stream": "EXTERNAL",
                    "source": "Port of Chennai Harbor Master",
                    "signal_id": "EXT-PORT-NOMINAL",
                    "category": "Port Operations",
                    "timestamp": "T-3h",
                    "headline": "Port Berth Utilization Standard at 94%",
                    "content": "Container terminals CB-1 and CB-2 operating without restrictions. Gantry cranes functioning normally. Harbor dwell time 1.2 days.",
                    "status": "NOMINAL_NO_ALERT",
                    "threat_level": "NONE",
                    "verified": True
                },
                {
                    "stream": "EXTERNAL",
                    "source": "Google News / Industry Feeds",
                    "signal_id": "EXT-NEWS-QUIET",
                    "category": "Public News",
                    "timestamp": "T-6h",
                    "headline": "Zero Public Supply-Chain Disruptions Reported",
                    "content": "Automated media scanner crawled 4,200 trade journals and business publications. Zero supply chain disruption articles relating to Tier-2 automotive semiconductor packaging.",
                    "status": "ZERO_NEWS_REPORTS",
                    "threat_level": "NONE",
                    "verified": True
                },
                {
                    "stream": "EXTERNAL",
                    "source": "X / Twitter Social Monitor",
                    "signal_id": "EXT-SOCIAL-QUIET",
                    "category": "Social Media",
                    "timestamp": "T-2h",
                    "headline": "Zero Social Chatter Detected",
                    "content": "Sentiment and anomaly scanner detected zero social media rumors or worker chatter. Public information channels show no awareness of emerging shortage.",
                    "status": "ZERO_SOCIAL_POSTS",
                    "threat_level": "NONE",
                    "verified": True
                }
            ]

        elif scenario_id == "COMPOUND_RISK":
            return [
                {
                    "stream": "EXTERNAL",
                    "source": "India Meteorological Department (IMD)",
                    "signal_id": "EXT-IMD-COMPOUND",
                    "category": "Weather Alert",
                    "timestamp": "T-2h",
                    "headline": "Severe Cyclone Warning Issued for Bay of Bengal",
                    "content": "Deep depression upgraded to Severe Cyclonic Storm. Wind gusts up to 115 km/h. Coastal maritime traffic suspended.",
                    "status": "CRITICAL_ALERT",
                    "threat_level": "CRITICAL",
                    "verified": True
                },
                {
                    "stream": "EXTERNAL",
                    "source": "Carrier Advisory (Maersk Line)",
                    "signal_id": "EXT-MAERSK-COMPOUND",
                    "category": "Carrier Bulletin",
                    "timestamp": "T-1h",
                    "headline": "MV Pacific Trader Berthing Suspended",
                    "content": "Vessel anchorage held outside Chennai port. Minimum 5-7 days delay expected for container loading.",
                    "status": "CRITICAL_ALERT",
                    "threat_level": "HIGH",
                    "verified": True
                }
            ]

        else:
            # Default CYCLONE_CHENNAI external signals
            return [
                {
                    "stream": "EXTERNAL",
                    "source": "X / Twitter",
                    "signal_id": "SIG-01",
                    "category": "Social Media",
                    "timestamp": "T-14h",
                    "headline": "Storm Surge off Chennai Outer Anchorage",
                    "content": "Heavy storm surge and rising swell outside Chennai. Feeder ships dropping anchor or aborting pilot boarding. #CycloneSenyar",
                    "status": "UNVERIFIED_RUMOR",
                    "threat_level": "HIGH",
                    "verified": False
                },
                {
                    "stream": "EXTERNAL",
                    "source": "India Meteorological Department (IMD)",
                    "signal_id": "SIG-02",
                    "category": "Weather Alert",
                    "timestamp": "T-8h",
                    "headline": "BULLETIN NO. 04: Severe Cyclonic Storm 'Senyar'",
                    "content": "Storm moving NW toward North Tamil Nadu coast. Wind gusts 110-125 km/h. Coastal operations red alert.",
                    "status": "OFFICIAL_ALERT",
                    "threat_level": "CRITICAL",
                    "verified": True
                },
                {
                    "stream": "EXTERNAL",
                    "source": "Port of Chennai Authority",
                    "signal_id": "SIG-03",
                    "category": "Port Operations",
                    "timestamp": "T-4h",
                    "headline": "Port Container Berths CB-1 and CB-2 Suspended",
                    "content": "Gantry cranes locked down. Vessel dwell expected to exceed 72-96 hours.",
                    "status": "OFFICIAL_NOTICE",
                    "threat_level": "CRITICAL",
                    "verified": True
                }
            ]

    def correlate_dual_streams(
        self,
        internal_telemetry: Dict[str, Any],
        external_signals: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Synthesizes both streams to classify the detection mode:
        1. INTERNAL_ONLY (Silent Internal Operational Drift - 0 external warnings)
        2. EXTERNAL_ONLY (External environmental/geopolitical shock)
        3. COMPOUND (Internal drift + external shock)
        """
        int_summary = internal_telemetry.get("summary", {})
        int_risk = int_summary.get("internal_risk_level", "LOW")

        ext_threats = [s for s in external_signals if s.get("threat_level") in ["HIGH", "CRITICAL"]]
        has_ext_threat = len(ext_threats) > 0

        if int_risk in ["HIGH", "CRITICAL"] and not has_ext_threat:
            detection_archetype = "INTERNAL_OPERATIONAL_DRIFT"
            banner_title = "INTERNAL OPERATIONAL WARNING: Silent Delivery Drift Detected via SAP Telemetry"
            narrative = (
                "Continuous monitoring of SAP S/4HANA delivery records and SAP IBP consumption discovered a silent operational failure. "
                "Supplier delivery times have crept up +59% (+8.4 days) over 4 weeks, while Detroit Plant 1010 consumption surged +26%. "
                "ZERO public news or social media reports exist. ChainGuard AI identified this threat before downstream production halt."
            )
            detection_steps = [
                {"step": 1, "title": "Retrieve SAP Delivery Records", "detail": "Retrieved 4 past PO cycles for CMP-MCU-01 from SAP S/4HANA EKBE/EKPO tables."},
                {"step": 2, "title": "Detect Creeping Lead-Time Drift", "detail": "Algorithmic drift detection flagged +59.0% increase across PO-498 to PO-501 (+8.4d creep)."},
                {"step": 3, "title": "Check Inventory & Burn Rates", "detail": "Queried SAP IBP: Detroit inventory is 1,638 units; actual burn is 315/day (+26% above planned)."},
                {"step": 4, "title": "Forecast Component Runout Date", "detail": "Projected inventory exhaustion in 5.2 days (earlier than scheduled replacement PO arrival)."},
                {"step": 5, "title": "Identify Affected Production Orders", "detail": "Mapped BOM linkages: Order ORD-OEM-901 for Titan Mobility Systems ($2.4M) at risk."},
                {"step": 6, "title": "Recommend Autonomous & Human Actions", "detail": "Issued BAPI_PO_CREATE1 for secondary supplier allocation before assembly line halts."}
            ]

        elif int_risk in ["HIGH", "CRITICAL"] and has_ext_threat:
            detection_archetype = "COMPOUND_MULTI_STREAM_RISK"
            banner_title = "COMPOUND MULTI-STREAM THREAT: Internal Lead-Time Slip + External Disruption Shock"
            narrative = (
                "Compound failure detected: SAP S/4HANA records reveal supplier was already operating 7 days late, depleting 65% of plant safety buffers. "
                "The incoming external weather shock will immediately trigger a factory shutdown because no internal margin remains."
            )
            detection_steps = [
                {"step": 1, "title": "Pre-Existing Vulnerability Flagged", "detail": "Internal SAP telemetry shows safety stock buffer was already eroded from 14d down to 4.8d."},
                {"step": 2, "title": "External Threat Ingested", "detail": "IMD official bulletin warns of severe cyclone closing Chennai maritime terminal."},
                {"step": 3, "title": "Combined Risk Projection", "detail": "Zero buffer tolerance leads to an unmitigated 7.5-day shutdown ($3.15M loss)."},
                {"step": 4, "title": "Preventive Diversion", "detail": "Recommend emergency transatlantic air freight charter via Frankfurt."}
            ]

        else:
            detection_archetype = "EXTERNAL_EVENT_SHOCK"
            banner_title = "EXTERNAL THREAT WARNING: External Environmental / Logistics Disruption Detected"
            narrative = (
                "External intelligence sensors detected a major meteorological disruption directly impacting maritime shipping lanes. "
                "Internal operational metrics were running nominal prior to the event."
            )
            detection_steps = [
                {"step": 1, "title": "External Signals Ingested", "detail": "Clustered 4 signals from social media, weather radar, and port advisories."},
                {"step": 2, "title": "Source Triangulation", "detail": "Corroborated 94% confidence through official harbor master and IMD bulletins."},
                {"step": 3, "title": "Supply Chain Impact Mapped", "detail": "Stranded cargo SHP-801 identified aboard MV Pacific Trader."},
                {"step": 4, "title": "Predictive ML Forecast", "detail": "Predicted 98.5% delay probability and 4.1-day coverage gap ($1.82M loss)."}
            ]

        return {
            "detection_archetype": detection_archetype,
            "banner_title": banner_title,
            "narrative": narrative,
            "detection_steps": detection_steps,
            "internal_risk_level": int_risk,
            "has_external_threat": has_ext_threat,
            "internal_signals_count": len(internal_telemetry.get("signals", [])),
            "external_signals_count": len(external_signals)
        }


# Global detector singleton
dual_stream_detector = DualStreamDetector()
