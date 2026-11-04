"""
ChainGuard AI - Early Warning Simulation Engine
Controls execution of multi-scenario external disruption simulations.
Processes simulated external signals (Social, News, Official Alerts, Port Advisories),
performs deduplication and independent corroboration, matches supply chain exposure,
calculates predictive risk impacts, publishes early warnings to Operations Center,
and supports playback controls (Start, Pause, Resume, Step, Reset, Speed).
"""
import datetime
import uuid
from typing import Dict, Any, List, Optional
from chainguard.simulation.scenarios import SCENARIOS_CATALOG
from chainguard.graph.exposure_mapper import exposure_mapper
from chainguard.warnings.warning_dispatcher import warning_dispatcher


class SimulationEngine:
    def __init__(self):
        self.active_scenario_id = "CYCLONE_CHENNAI"
        self.status = "IDLE"  # IDLE, RUNNING, PAUSED, COMPLETED
        self.current_tick_index = -1
        self.speed_multiplier = 1.0
        self.start_sim_time = datetime.datetime(2026, 11, 4, 6, 0, 0)
        self.current_sim_time = self.start_sim_time
        
        self.emitted_signals: List[Dict[str, Any]] = []
        self.deduplicated_signals: List[Dict[str, Any]] = []
        self.active_event: Optional[Dict[str, Any]] = None
        self.exposure_state: Optional[Dict[str, Any]] = None
        self.published_warning_id: Optional[str] = None
        self.predictive_impact: Optional[Dict[str, Any]] = None
        self.recommendations: List[Dict[str, Any]] = []
        self.selected_action: Optional[Dict[str, Any]] = None
        self.timeline_log: List[Dict[str, Any]] = []

    def get_catalog(self) -> List[Dict[str, Any]]:
        """Returns metadata for all available scenarios."""
        return [
            {
                "scenario_id": s["scenario_id"],
                "title": s["title"],
                "category": s["category"],
                "location": s["location"],
                "lat": s["lat"],
                "lng": s["lng"],
                "description": s["description"],
                "is_default": s.get("is_default", False),
                "total_steps": len(s["ticks"])
            }
            for s in SCENARIOS_CATALOG.values()
        ]

    def set_scenario(self, scenario_id: str) -> Dict[str, Any]:
        if scenario_id not in SCENARIOS_CATALOG:
            raise ValueError(f"Unknown scenario ID: {scenario_id}")
        self.active_scenario_id = scenario_id
        self.reset()
        return self.get_state()

    def set_speed(self, multiplier: float) -> Dict[str, Any]:
        self.speed_multiplier = max(0.5, min(10.0, float(multiplier)))
        return {"status": "SUCCESS", "speed_multiplier": self.speed_multiplier}

    def reset(self) -> Dict[str, Any]:
        """Resets simulation to initial benchmark state without wiping user data."""
        self.status = "IDLE"
        self.current_tick_index = -1
        self.current_sim_time = self.start_sim_time
        self.emitted_signals = []
        self.deduplicated_signals = []
        self.active_event = None
        self.exposure_state = None
        self.published_warning_id = None
        self.predictive_impact = None
        self.recommendations = []
        self.selected_action = None
        self.timeline_log = []
        return self.get_state()

    def start(self) -> Dict[str, Any]:
        if self.status == "IDLE" or self.status == "COMPLETED":
            self.reset()
            self.status = "RUNNING"
            # Automatically advance first tick
            return self.step()
        elif self.status == "PAUSED":
            self.status = "RUNNING"
            return self.get_state()
        return self.get_state()

    def pause(self) -> Dict[str, Any]:
        if self.status == "RUNNING":
            self.status = "PAUSED"
        return self.get_state()

    def resume(self) -> Dict[str, Any]:
        if self.status == "PAUSED":
            self.status = "RUNNING"
        return self.get_state()

    def step(self) -> Dict[str, Any]:
        """Advances simulation by exactly one deterministic tick."""
        scenario = SCENARIOS_CATALOG[self.active_scenario_id]
        ticks = scenario["ticks"]
        next_idx = self.current_tick_index + 1

        if next_idx >= len(ticks):
            self.status = "COMPLETED"
            return self.get_state()

        self.current_tick_index = next_idx
        tick = ticks[next_idx]

        # 1. Update Simulation Clock
        rel_hours = tick.get("relative_time_hours", next_idx * 4)
        self.current_sim_time = self.start_sim_time + datetime.timedelta(hours=rel_hours)

        # 2. Ingest New Signals & Apply Deduplication
        new_signals = tick.get("signals", [])
        for sig in new_signals:
            sig_copy = sig.copy()
            sig_copy["simulated_timestamp"] = self.current_sim_time.strftime("%Y-%m-%d %H:%M:%S UTC")
            sig_copy["ingested_at"] = datetime.datetime.now().isoformat()
            self.emitted_signals.insert(0, sig_copy)

            # Deduplication: flag duplicates vs independent corroborating sources
            is_dup = sig_copy.get("is_duplicate", False)
            if not is_dup:
                self.deduplicated_signals.insert(0, sig_copy)

        # 3. Formulate / Update Active Emerging Event
        # Maintain strict separation between Signal Strength, Event Confidence, and Supply-Chain Risk
        verif_status = tick.get("verification_status", "UNVERIFIED_REPORT")
        sig_strength = tick.get("signal_strength_score", 0.5)
        evt_conf = tick.get("event_confidence_score", 0.4)
        status_rationale = tick.get("status_rationale", "")

        event_id = f"EVT-{self.active_scenario_id}-{self.start_sim_time.strftime('%Y%m%d')}"
        
        # Corroborating sources summary
        indep_sources = list({s.get("source_name", "Unknown") for s in self.deduplicated_signals})
        
        self.active_event = {
            "event_id": event_id,
            "scenario_id": self.active_scenario_id,
            "title": scenario["title"],
            "category": scenario["category"],
            "location": scenario["location"],
            "lat": scenario["lat"],
            "lng": scenario["lng"],
            "current_step_name": tick.get("step_name", f"Step {next_idx + 1}"),
            "current_sim_time": self.current_sim_time.strftime("%Y-%m-%d %H:%M:%S UTC"),
            "verification_status": verif_status,
            "status_rationale": status_rationale,
            # Strict 3-metric concept separation:
            "signal_strength_score": sig_strength,      # Volume / mentions velocity
            "event_confidence_score": evt_conf,          # Evidence corroboration level
            "supply_chain_risk_score": 0.0,             # Updated below upon exposure calculation
            "independent_sources_count": len(indep_sources),
            "independent_sources": indep_sources,
            "total_signals_received": len(self.emitted_signals),
            "deduplicated_signals_count": len(self.deduplicated_signals),
            "duplicates_filtered_count": len(self.emitted_signals) - len(self.deduplicated_signals)
        }

        # 4. Supply Chain Exposure Mapping (Stage 6)
        exp_res = exposure_mapper.map_event_exposure(
            event_type=scenario["category"],
            location_name=scenario["location"],
            lat=scenario["lat"],
            lng=scenario["lng"],
            target_entity_hint=scenario.get("target_shipment_id") or scenario.get("target_supplier_id")
        )
        self.exposure_state = exp_res

        # 5. Predictive Risk Assessment (Stage 7)
        if "predictive_impact" in tick:
            self.predictive_impact = tick["predictive_impact"]
            self.active_event["supply_chain_risk_score"] = float(self.predictive_impact.get("calibrated_delay_probability", 0.9))
        elif exp_res["is_exposed"]:
            # Baseline provisional risk calculation
            self.active_event["supply_chain_risk_score"] = round(evt_conf * 0.85, 2)

        # 6. Candidate Recommendations (Stage 9 & 10)
        if "recommended_actions" in tick:
            self.recommendations = tick["recommended_actions"]

        # 7. Early Warning Publication (Stage 8)
        # When event meets alert criteria (corroborated or confirmed + exposed), publish to WarningDispatcher
        if exp_res["is_exposed"] and verif_status in ["CORROBORATED_INDEPENDENT", "CONFIRMED_AUTHORITATIVE"]:
            if not self.published_warning_id:
                warning_title = f"{scenario['title']} ({verif_status.replace('_', ' ').title()})"
                warn_sev = "CRITICAL" if verif_status == "CONFIRMED_AUTHORITATIVE" else "WARNING"
                
                # Dispatch warning through existing WarningDispatcher
                try:
                    target_shipment = scenario.get("target_shipment_id", "SHP-805")
                    target_comp = scenario.get("target_component_id", "CMP-SNS-05")
                    target_sup = scenario.get("target_supplier_id", "SUP-009")
                    
                    delay_days = self.predictive_impact.get("predicted_delay_days", 5.0) if self.predictive_impact else 4.0

                    warn_rec = warning_dispatcher.dispatch_warning(
                        title=warning_title,
                        warning_type=scenario["category"],
                        severity=warn_sev,
                        description=f"{status_rationale} Operational exposure confirmed for shipment {target_shipment} and component {target_comp}.",
                        source="Early Warning Control Room / Multi-Source Feed",
                        target_shipment_id=target_shipment,
                        target_supplier_id=target_sup,
                        target_component_id=target_comp,
                        delay_impact_days=delay_days,
                        weather_severity_override=8.5 if "CYCLONE" in self.active_scenario_id else None
                    )
                    self.published_warning_id = warn_rec.get("warning_id")
                except Exception as e:
                    print(f"Warning publication notice: {e}")

        # 8. Record Timeline Log
        self.timeline_log.append({
            "tick_index": next_idx,
            "step_name": tick.get("step_name", f"Step {next_idx + 1}"),
            "sim_time": self.current_sim_time.strftime("%Y-%m-%d %H:%M:%S UTC"),
            "verification_status": verif_status,
            "signals_in_tick": len(new_signals),
            "signal_strength": sig_strength,
            "event_confidence": evt_conf,
            "exposure_established": exp_res["is_exposed"]
        })

        if next_idx >= len(ticks) - 1:
            self.status = "COMPLETED"

        return self.get_state()

    def get_state(self) -> Dict[str, Any]:
        """Returns the complete synchronized state for the UI and APIs."""
        scenario = SCENARIOS_CATALOG[self.active_scenario_id]
        total_ticks = len(scenario["ticks"])

        return {
            "status": self.status,
            "scenario_id": self.active_scenario_id,
            "scenario_metadata": {
                "title": scenario["title"],
                "category": scenario["category"],
                "location": scenario["location"],
                "lat": scenario["lat"],
                "lng": scenario["lng"],
                "description": scenario["description"],
                "is_simulated_synthetic": True
            },
            "current_tick_index": self.current_tick_index,
            "total_ticks": total_ticks,
            "progress_pct": int(max(0, (self.current_tick_index + 1) / total_ticks * 100)) if total_ticks > 0 else 0,
            "sim_clock": {
                "current_time_iso": self.current_sim_time.isoformat(),
                "current_time_formatted": self.current_sim_time.strftime("%Y-%m-%d %H:%M:%S UTC"),
                "speed_multiplier": self.speed_multiplier
            },
            "active_event": self.active_event,
            "exposure_state": self.exposure_state,
            "predictive_impact": self.predictive_impact,
            "recommendations": self.recommendations,
            "published_warning_id": self.published_warning_id,
            "recent_signals": self.emitted_signals[:25],
            "timeline": self.timeline_log
        }


# Global simulation engine instance
simulation_engine = SimulationEngine()

