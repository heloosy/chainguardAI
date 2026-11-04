/**
 * ChainGuard AI - Early Warning & Disruption Injection Studio Controller
 * Independent client script for injecting crisis shocks into the live pipeline.
 */

const PRESETS = {
  cyclone_chennai: {
    source_platform: "IMD_METEOROLOGICAL",
    category: "Severe Cyclone / Storm",
    source_handle: "@CycloneWarning_IMD",
    urgency_tier: "CRITICAL",
    headline: "BULLETIN 04: Severe Cyclonic Storm 'Senyar' targeting North Tamil Nadu Coast",
    content: "Rapidly intensifying cyclonic storm 180nm east of Chennai moving NW. Wind gusts 120-135 km/h. Coastal operations red alert. Chennai port gantry cranes locked down with 72-96h container dwell expected.",
    location: "Port of Chennai & Coastal Fab Basin, India",
    lat: 13.0827,
    lng: 80.2707,
    affected_entity: "SHP-801",
    component_id: "CMP-MCU-01",
    predicted_delay_shock_days: 4.5
  },
  red_sea_war: {
    source_platform: "SECURITY_FEED",
    category: "Geopolitical War / Conflict",
    source_handle: "@MaritimeDomainWatch",
    urgency_tier: "CRITICAL",
    headline: "Anti-Ship Drone & Missile Swarm in Bab-el-Mandeb Chokepoint",
    content: "Commercial container convoy intercepted by surface drones in Southern Red Sea. Naval coalition issues emergency exclusion notice. Major container lines (Maersk, Hapag-Lloyd, MSC) rerouting around Cape of Good Hope (+12 to 14 days transit delay).",
    location: "Bab-el-Mandeb Strait / Southern Red Sea",
    lat: 12.5833,
    lng: 43.3333,
    affected_entity: "SHP-802",
    component_id: "CMP-SN-02",
    predicted_delay_shock_days: 12.0
  },
  port_long_beach: {
    source_platform: "PORT_AUTHORITY",
    category: "Port Closure / Berth Congestion",
    source_handle: "@HarborMaster_POLB",
    urgency_tier: "HIGH",
    headline: "Catastrophic Gantry Crane Hydraulic Rupture at Pier T Berth 140",
    content: "Post-panamax container crane boom collapse halts all ship-to-shore discharge. Pier T closed indefinitely. Inbound Pacific container vessels diverted to outer anchorage with anchor dwell exceeding 6 days.",
    location: "Port of Long Beach, Pier T, California",
    lat: 33.7542,
    lng: -118.2165,
    affected_entity: "SHP-803",
    component_id: "CMP-BAT-03",
    predicted_delay_shock_days: 5.5
  },
  taiwan_fab: {
    source_platform: "OCEAN_CARRIER",
    category: "Supplier Cleanroom Outage",
    source_handle: "@ApexSupplySec",
    urgency_tier: "CRITICAL",
    headline: "Hsinchu Cleanroom High-Voltage Transient Curtailment & Wafer Scrap",
    content: "345kV regional transmission drop in Northern Taiwan trips fab cleanroom HVAC recirculators. Automotive 300mm microcontroller batch suffers catastrophic thermal shock. Apex Semiconductor declares Force Majeure; Q4 allocations slashed 35%.",
    location: "Hsinchu Science Park, Taiwan",
    lat: 24.7820,
    lng: 120.9980,
    affected_entity: "SUP-001",
    component_id: "CMP-MCU-01",
    predicted_delay_shock_days: 8.0
  },
  trade_embargo: {
    source_platform: "SECURITY_FEED",
    category: "Trade Sanctions / EAR Embargo",
    source_handle: "@BIS_FederalRegister",
    urgency_tier: "HIGH",
    headline: "Emergency EAR § 734.4 Dual-Use Cryptographic Microelectronics License Freeze",
    content: "U.S. Department of Commerce Bureau of Industry and Security issues interim rule restricting transshipment of automotive microcontrollers without validated end-user certification. All pending customs broker clearances placed on administrative hold.",
    location: "Washington D.C. / BIS Customs Gateway",
    lat: 38.8951,
    lng: -77.0364,
    affected_entity: "CMP-MCU-01",
    component_id: "CMP-MCU-01",
    predicted_delay_shock_days: 6.5
  },
  plant_scrap: {
    source_platform: "X_TWITTER",
    category: "Severe Disruption Alert",
    source_handle: "@DetroitAutoPlant1010",
    urgency_tier: "HIGH",
    headline: "SMT Feeder Line Jam & High-Speed Scrap Spike at Plant 1010",
    content: "Robotic surface-mount feeder pin misalignment destroys 180 critical microcontroller packages, depleting on-hand safety buffer 3.2 days earlier than scheduled. Assembly line line-stop risk elevated to Critical.",
    location: "Detroit Assembly Facility 1010, MI",
    lat: 42.3314,
    lng: -83.0458,
    affected_entity: "FAC-1010",
    component_id: "CMP-MCU-01",
    predicted_delay_shock_days: 3.2
  },
  internal_lead_time_drift: {
    source_platform: "SAP_S4HANA",
    category: "Internal Supplier Delivery Drift",
    source_handle: "@SAP_EKBE_LeadTimeTracker",
    urgency_tier: "CRITICAL",
    headline: "SAP S/4HANA PO Goods Receipt Drift: Apex Semi (SUP-007) Lead Times +59% (+8.4d)",
    content: "Zero external news or weather alerts. SAP EKBE/EKPO transaction audit reveals steady delivery creep across 4 consecutive PO cycles (14.1d -> 22.4d). Coupled with SAP IBP factory burn rate surge (+26%), safety buffer exhausts in 5.2 days creating an unannounced 6.2-day gap.",
    location: "Apex Semiconductor Fab (SUP-007) & Detroit Plant 1010",
    lat: 13.0827,
    lng: 80.2707,
    affected_entity: "SUP-007",
    component_id: "CMP-MCU-01",
    predicted_delay_shock_days: 8.4,
    scenario_id: "INTERNAL_LEAD_TIME_DRIFT"
  },
  compound_risk: {
    source_platform: "SAP_AND_EXTERNAL",
    category: "Compound Multi-Stream Threat",
    source_handle: "@ChainGuard_DualStream",
    urgency_tier: "CRITICAL",
    headline: "Compound Threat: Unannounced SAP Lead-Time Drift Collides with Cyclone 'Senyar'",
    content: "Dual-stream correlation alert: Internal supplier lead time was already slipping (+4.5d drift in SAP EKBE) when Category 4 Cyclone Senyar forces Chennai port shutdown. Compounding multiplier raises total delivery delay to +9.5 days.",
    location: "Bay of Bengal & Chennai Port, India",
    lat: 13.0827,
    lng: 80.2707,
    affected_entity: "SHP-801",
    component_id: "CMP-MCU-01",
    predicted_delay_shock_days: 9.5,
    scenario_id: "COMPOUND_RISK"
  }
};

let injectedHistory = [];

async function loadAndInjectPreset(presetKey) {
  const p = PRESETS[presetKey];
  if (!p) return;

  // Populate form
  document.getElementById("form-platform").value = p.source_platform;
  document.getElementById("form-category").value = p.category;
  document.getElementById("form-handle").value = p.source_handle;
  document.getElementById("form-urgency").value = p.urgency_tier;
  document.getElementById("form-headline").value = p.headline;
  document.getElementById("form-content").value = p.content;
  document.getElementById("form-location").value = p.location;
  document.getElementById("form-lat").value = p.lat;
  document.getElementById("form-lng").value = p.lng;
  document.getElementById("form-shipment").value = p.affected_entity;
  document.getElementById("form-component").value = p.component_id;
  document.getElementById("form-delay").value = p.predicted_delay_shock_days;

  // Dispatch immediately
  await dispatchShockPayload(p);
}

async function handleCustomSubmit(e) {
  e.preventDefault();
  
  const payload = {
    source_platform: document.getElementById("form-platform").value,
    category: document.getElementById("form-category").value,
    source_handle: document.getElementById("form-handle").value,
    urgency_tier: document.getElementById("form-urgency").value,
    headline: document.getElementById("form-headline").value,
    content: document.getElementById("form-content").value,
    location: document.getElementById("form-location").value,
    lat: parseFloat(document.getElementById("form-lat").value) || 13.0827,
    lng: parseFloat(document.getElementById("form-lng").value) || 80.2707,
    affected_entity: document.getElementById("form-shipment").value,
    component_id: document.getElementById("form-component").value,
    predicted_delay_shock_days: parseFloat(document.getElementById("form-delay").value) || 4.0
  };

  await dispatchShockPayload(payload);
}

async function dispatchShockPayload(payload) {
  const submitBtn = document.getElementById("btn-submit-shock");
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<span>Transmitting Shock...</span>`;
  }

  try {
    const res = await API.injectDisruptionSignal(payload);
    if (payload.scenario_id) {
      try {
        await API.resetWorkflowPipeline(payload.scenario_id);
      } catch (e) {
        console.warn("Could not auto-switch workflow scenario:", e);
      }
    }
    
    // Add to history
    injectedHistory.unshift({
      timestamp: new Date().toLocaleTimeString(),
      headline: payload.headline,
      platform: payload.source_platform,
      category: payload.category,
      delay: payload.predicted_delay_shock_days,
      location: payload.location,
      status: res.status || "DISPATCHED"
    });

    renderFeedbackBanner(payload, res);
    renderHistoryList();

  } catch (err) {
    console.error("Failed to inject disruption shock:", err);
    alert("Failed to transmit shock to backend: " + err.message);
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = `<span>⚡ Inject Disruption Shock</span>`;
    }
  }
}

function renderFeedbackBanner(payload, res) {
  const card = document.getElementById("dispatch-feedback-card");
  const timeEl = document.getElementById("feedback-timestamp");
  const textEl = document.getElementById("feedback-text");
  if (!card || !timeEl || !textEl) return;

  timeEl.innerText = new Date().toLocaleTimeString();
  textEl.innerHTML = `
    Successfully injected <strong>${payload.headline}</strong> into live agent pipeline.<br>
    The agent has ingested the shock and is cascading consequence calculations (+${payload.predicted_delay_shock_days}d transit deviation).<br>
    <div class="mt-2 pt-2 border-t border-slate-700/80 flex items-center space-x-2 text-[11px] text-emerald-400 font-mono">
      <span>📱</span>
      <span>Emergency SMS Alert Dispatched to Operations Commander: <strong>+91 7736215631</strong> (Status: DELIVERED)</span>
    </div>
  `;

  card.classList.remove("hidden");
}

function renderHistoryList() {
  const container = document.getElementById("injection-log-list");
  const countEl = document.getElementById("log-count");
  if (!container) return;

  if (countEl) countEl.innerText = `${injectedHistory.length} Injected`;

  if (injectedHistory.length === 0) {
    container.innerHTML = `
      <div class="p-6 text-center text-slate-500 font-mono text-xs">
        No custom shocks injected yet.<br>Click any preset or submit a custom signal above.
      </div>
    `;
    return;
  }

  container.innerHTML = injectedHistory.map(item => `
    <div class="p-3 rounded bg-slate-800 border border-slate-700 space-y-1">
      <div class="flex items-center justify-between text-[10px] font-mono">
        <span class="text-amber-400 font-bold">${item.platform}</span>
        <span class="text-slate-400">${item.timestamp}</span>
      </div>
      <div class="font-bold text-xs text-white">${item.headline}</div>
      <div class="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-1">
        <span>${item.location}</span>
        <span class="text-red-400 font-bold">+${item.delay}d shock</span>
      </div>
    </div>
  `).join("");
}

async function resetInjectedPipeline() {
  if (confirm("Reset the main pipeline back to clean benchmark baseline?")) {
    try {
      await API.resetWorkflowPipeline("CYCLONE_CHENNAI");
      injectedHistory = [];
      renderHistoryList();
      const feedback = document.getElementById("dispatch-feedback-card");
      if (feedback) feedback.classList.add("hidden");
      alert("Pipeline reset successfully. Main dashboard is back to clean baseline.");
    } catch (err) {
      console.error("Error resetting pipeline:", err);
    }
  }
}

