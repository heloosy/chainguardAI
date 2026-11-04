/**
 * ChainGuard AI - Streamlined Enterprise Workflow Controller
 * Drives:
 * 1. Incident Resilience (Agentic AI with autonomous actions & HITL)
 * 2. Supply Chain Data (Always-accessible interactive data panel)
 * 3. Incident History & Memory (Retrospective SQLite audit trail)
 */

let workflowState = null;
let isAutoRunning = false;
let autoRunInterval = null;
let leafletMap = null;
let mapMarkers = [];

let activeNavPanel = "panel-resilience";
let activeDataTableName = "suppliers";
let currentTableRows = [];
let activeStreamFilter = "ALL";

document.addEventListener("DOMContentLoaded", () => {
  initApp();
});

async function initApp() {
  console.log("Initializing ChainGuard AI Enterprise Console...");
  setupEventListeners();
  await refreshWorkflowState();
  initOperationalMap();
  loadIncidentHistory();
}

function setupEventListeners() {
  // Scenario select
  const scenarioSelect = document.getElementById("scenario-select");
  if (scenarioSelect) {
    scenarioSelect.addEventListener("change", async (e) => {
      await resetWorkflow(e.target.value);
    });
  }

  // Run Auto-pilot button
  const runBtn = document.getElementById("btn-run-pipeline");
  if (runBtn) {
    runBtn.addEventListener("click", () => {
      toggleAutoRun();
    });
  }

  // Next Step button
  const stepBtn = document.getElementById("btn-step-pipeline");
  if (stepBtn) {
    stepBtn.addEventListener("click", async () => {
      await stepPipeline();
    });
  }

  // Reset button
  const resetBtn = document.getElementById("btn-reset-pipeline");
  if (resetBtn) {
    resetBtn.addEventListener("click", async () => {
      const scenario = document.getElementById("scenario-select")?.value || "CYCLONE_CHENNAI";
      await resetWorkflow(scenario);
    });
  }

  // Data table search filter
  const searchInput = document.getElementById("data-table-search");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      filterDataTable(e.target.value);
    });
  }
}

// ==========================================
// NAVIGATION BETWEEN SIDEBAR PANELS
// ==========================================

function switchNavPanel(panelId) {
  activeNavPanel = panelId;

  // Hide all panels
  document.getElementById("panel-resilience")?.classList.add("hidden");
  document.getElementById("panel-data")?.classList.add("hidden");
  document.getElementById("panel-history")?.classList.add("hidden");
  document.getElementById("panel-policy")?.classList.add("hidden");
  document.getElementById("panel-exchange")?.classList.add("hidden");

  // Show target panel
  const target = document.getElementById(panelId);
  if (target) target.classList.remove("hidden");

  // Update sidebar button active states
  const navBtns = [
    { id: "nav-btn-resilience", panel: "panel-resilience", title: "Incident Resilience Console" },
    { id: "nav-btn-data", panel: "panel-data", title: "Supply Chain Operational Data" },
    { id: "nav-btn-exchange", panel: "panel-exchange", title: "Supply Exchange & Cross-Border Legal Bridge" },
    { id: "nav-btn-policy", panel: "panel-policy", title: "Enterprise Resilience Policy & SOP Generator" },
    { id: "nav-btn-history", panel: "panel-history", title: "Incident Memory & Retrospective Audit Store" }
  ];

  navBtns.forEach(btn => {
    const el = document.getElementById(btn.id);
    if (!el) return;
    if (btn.panel === panelId) {
      el.className = "w-full flex items-center justify-between px-3 py-2.5 rounded-md text-left transition-all cursor-pointer bg-[#EBF3F0] text-[#176B57] font-semibold border border-emerald-200/80 shadow-2xs";
      const titleEl = document.getElementById("page-title");
      if (titleEl) titleEl.innerText = btn.title;
    } else {
      el.className = "w-full flex items-center justify-between px-3 py-2.5 rounded-md text-left transition-all cursor-pointer text-[#202722] hover:bg-slate-100 font-medium";
    }
  });

  // If opening specific panel, trigger appropriate data loaders
  if (panelId === "panel-data") {
    loadDataTable(activeDataTableName);
  } else if (panelId === "panel-resilience") {
    setTimeout(initOperationalMap, 100);
  } else if (panelId === "panel-exchange") {
    loadSupplyExchangePanel();
  } else if (panelId === "panel-policy") {
    loadPoliciesList();
  } else if (panelId === "panel-history") {
    loadIncidentHistory();
  }
}

// ==========================================
// AGENTIC RESILIENCE PIPELINE CONTROLS
// ==========================================

async function refreshWorkflowState() {
  try {
    workflowState = await API.getWorkflowState();
    renderAll();
    return workflowState;
  } catch (err) {
    console.error("Failed to load workflow state:", err);
  }
}

async function stepPipeline() {
  const stepBtn = document.getElementById("btn-step-pipeline");
  if (stepBtn) stepBtn.disabled = true;

  try {
    workflowState = await API.stepWorkflowPipeline();
    renderAll();
  } catch (err) {
    console.error("Error stepping pipeline:", err);
  } finally {
    if (stepBtn) stepBtn.disabled = false;
  }
}

async function toggleAutoRun() {
  if (isAutoRunning) {
    stopAutoRun();
    return;
  }

  isAutoRunning = true;
  updateRunButton();

  autoRunInterval = setInterval(async () => {
    if (!workflowState) return;

    if (workflowState.status === "AWAITING_HUMAN_APPROVAL" || workflowState.status === "COMPLETED") {
      stopAutoRun();
      return;
    }

    try {
      workflowState = await API.stepWorkflowPipeline();
      renderAll();

      if (workflowState.status === "AWAITING_HUMAN_APPROVAL" || workflowState.status === "COMPLETED") {
        stopAutoRun();
      }
    } catch (err) {
      console.error("Auto run error:", err);
      stopAutoRun();
    }
  }, 1600);
}

function stopAutoRun() {
  isAutoRunning = false;
  if (autoRunInterval) {
    clearInterval(autoRunInterval);
    autoRunInterval = null;
  }
  updateRunButton();
}

function updateRunButton() {
  const btn = document.getElementById("btn-run-pipeline");
  if (!btn) return;

  if (isAutoRunning) {
    btn.innerHTML = `
      <svg class="w-3.5 h-3.5 animate-spin mr-1.5" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path></svg>
      Pause Auto-Pilot
    `;
    btn.classList.remove("bg-[#176B57]", "hover:bg-[#115243]");
    btn.classList.add("bg-amber-600", "hover:bg-amber-700");
  } else {
    btn.innerHTML = `
      <svg class="w-3.5 h-3.5 mr-1.5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd"></path></svg>
      Run Agentic Cycle
    `;
    btn.classList.add("bg-[#176B57]", "hover:bg-[#115243]");
    btn.classList.remove("bg-amber-600", "hover:bg-amber-700");
  }
}

async function resetWorkflow(scenarioId) {
  stopAutoRun();
  try {
    workflowState = await API.resetWorkflowPipeline(scenarioId);
    renderAll();
  } catch (err) {
    console.error("Error resetting workflow:", err);
  }
}

async function submitDecision(decisionKey) {
  try {
    workflowState = await API.submitWorkflowDecision(decisionKey, "Supervisor decision executed from resilience console");
    renderAll();
    loadIncidentHistory();
  } catch (err) {
    console.error("Error submitting decision:", err);
  }
}

// ==========================================
// RENDERING RESILIENCE CONSOLE
// ==========================================

let selectedAlternativeIndex = 0;

function renderAll() {
  if (!workflowState) return;

  renderStatusAndPhase();
  renderPredictiveMetrics();
  renderSignalsAndVerification();
  renderAlternativesAndIssues();
  renderAutonomousAndHumanGate();
  renderAgentThoughts();
  updateOperationalMap();
  checkAndTriggerEmergencyAlert();
}

function renderStatusAndPhase() {
  const pill = document.getElementById("pipeline-status-pill");
  const badge = document.getElementById("incident-phase-badge");
  const title = document.getElementById("incident-title");
  const summary = document.getElementById("incident-summary");
  const currentIdx = workflowState.current_stage_index;

  const modePill = document.getElementById("lifecycle-mode-pill");
  const stageName = document.getElementById("lifecycle-stage-name");
  const progressBar = document.getElementById("lifecycle-progress-bar");
  const progressText = document.getElementById("lifecycle-progress-text");

  // Map header and dot
  const mapDot = document.getElementById("map-status-dot");
  const mapHeaderTitle = document.getElementById("map-header-title");

  // 1. Calm Nominal State (Stage 0)
  if (currentIdx === 0) {
    if (title) title.innerText = "All 8 Global Supply Corridors Operating Within Standard Tolerances";
    if (summary) summary.innerText = "Autonomous sentry monitoring port dwell times, satellite weather, and Tier-1/Tier-2 shipments. Detroit plant inventory buffer healthy at 18.5 days. Zero active disruption warnings.";
    
    if (pill) {
      pill.className = "px-2.5 py-0.5 text-[11px] font-medium rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200";
      pill.innerHTML = `● Nominal (All Systems Healthy)`;
    }

    if (badge) {
      badge.innerText = "PHASE: NOMINAL MONITORING";
      badge.className = "px-2.5 py-1 text-xs font-mono font-bold rounded bg-emerald-100 text-emerald-900 border border-emerald-300";
    }

    if (modePill) {
      modePill.className = "px-2 py-0.5 rounded font-mono font-semibold text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-300";
      modePill.innerText = "● NOMINAL MONITORING";
    }

    if (stageName) stageName.innerText = "Baseline Telemetry Streaming (Zero Early Warnings)";
    if (progressBar) progressBar.style.width = "10%";
    if (progressText) progressText.innerText = "Stage 0 / 8";

    if (mapDot) mapDot.className = "w-2 h-2 rounded-full bg-emerald-500";
    if (mapHeaderTitle) mapHeaderTitle.innerText = "Geospatial Supply Corridor & Telemetry Track (Normal Transit)";

    // Snapshot cards under map
    const snapCargo = document.getElementById("map-snapshot-cargo");
    const snapCargoSub = document.getElementById("map-snapshot-cargo-sub");
    const snapBuffer = document.getElementById("map-snapshot-buffer");
    const snapBufferSub = document.getElementById("map-snapshot-buffer-sub");
    const snapContract = document.getElementById("map-snapshot-contract");
    const snapContractSub = document.getElementById("map-snapshot-contract-sub");

    if (snapCargo) { snapCargo.innerText = "SHP-801 (5,000 MCUs)"; snapCargo.className = "font-bold text-emerald-900 mt-0.5"; }
    if (snapCargoSub) snapCargoSub.innerText = "Aboard MV Pacific Trader (On Schedule)";
    if (snapBuffer) { snapBuffer.innerText = "18.5 Days Healthy Buffer"; snapBuffer.className = "font-bold text-emerald-900 mt-0.5"; }
    if (snapBufferSub) snapBufferSub.innerText = "Detroit Plant 1010 (4,625 on hand)";
    if (snapContract) { snapContract.innerText = "$0.00 At Risk"; snapContract.className = "font-bold text-emerald-900 mt-0.5"; }
    if (snapContractSub) snapContractSub.innerText = "Titan OEM SLA On Schedule";

    return;
  }

  // 2. Active Disruption State (Stage 1 to 8)
  const isInternalDrift = workflowState.scenario?.scenario_id === "INTERNAL_LEAD_TIME_DRIFT";
  if (title && workflowState.scenario) {
    title.innerText = workflowState.scenario.title;
  }
  if (summary) {
    if (isInternalDrift) {
      summary.innerText = "Simulated real-time agentic loop: SAP PO goods receipts audit flags creeping lead time (+8.4d, +59%) and factory burn surge (+26%). 6.2-day coverage gap detected with zero public news or weather reports.";
    } else {
      summary.innerText = "Simulated real-time agentic loop: External Signals → Early Warning → Verification → Impact Mapping → Risk Prediction → Recommendations → Human Approval → Outcome Tracking.";
    }
  }

  if (mapDot) mapDot.className = "w-2 h-2 rounded-full bg-red-600 animate-pulse";
  if (mapHeaderTitle) {
    mapHeaderTitle.innerText = isInternalDrift 
      ? "Internal Enterprise ERP Telemetry: Apex Semiconductor → Detroit Plant 1010" 
      : "Geospatial Disruption Corridor & Exposure";
  }

  // Update Status Pill
  if (pill) {
    const st = workflowState.status;
    if (st === "RUNNING") {
      pill.className = "px-2.5 py-0.5 text-[11px] font-medium rounded-full bg-blue-50 text-blue-700 border border-blue-200 animate-pulse";
      pill.innerHTML = `● Running: Stage ${currentIdx} of 8`;
    } else if (st === "AWAITING_HUMAN_APPROVAL") {
      pill.className = "px-2.5 py-0.5 text-[11px] font-bold rounded-full bg-amber-50 text-amber-800 border border-amber-300 animate-bounce";
      pill.innerHTML = `⚠️ Awaiting Human Authorization`;
    } else if (st === "COMPLETED") {
      pill.className = "px-2.5 py-0.5 text-[11px] font-medium rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300";
      pill.innerHTML = `✓ Resolved & Retrained`;
    }
  }

  // Update Phase Badge
  if (badge) {
    if (currentIdx === 1) {
      badge.innerText = "PHASE: SIGNALS INGESTED";
      badge.className = "px-2.5 py-1 text-xs font-mono font-bold rounded bg-blue-100 text-blue-900 border border-blue-300";
    } else if (currentIdx === 2) {
      badge.innerText = "PHASE: EARLY WARNING DETECTED";
      badge.className = "px-2.5 py-1 text-xs font-mono font-bold rounded bg-amber-100 text-amber-900 border border-amber-300";
    } else if (currentIdx === 3) {
      badge.innerText = "PHASE: TRIANGULATED & CONFIRMED (94%)";
      badge.className = "px-2.5 py-1 text-xs font-mono font-bold rounded bg-purple-100 text-purple-900 border border-purple-300";
    } else if (currentIdx === 4) {
      badge.innerText = "PHASE: IMPACT EXPOSURE MAPPED";
      badge.className = "px-2.5 py-1 text-xs font-mono font-bold rounded bg-indigo-100 text-indigo-900 border border-indigo-300";
    } else if (currentIdx === 5) {
      badge.innerText = "PHASE: DELAY & SHORTAGE PREDICTED";
      badge.className = "px-2.5 py-1 text-xs font-mono font-bold rounded bg-red-100 text-red-900 border border-red-300";
    } else if (currentIdx === 6) {
      badge.innerText = "PHASE: RECOMMENDATIONS & ISSUES ANALYZED";
      badge.className = "px-2.5 py-1 text-xs font-mono font-bold rounded bg-emerald-100 text-emerald-900 border border-emerald-300";
    } else if (currentIdx === 7) {
      badge.innerText = "PHASE: HUMAN APPROVAL REQUIRED";
      badge.className = "px-2.5 py-1 text-xs font-mono font-bold rounded bg-amber-100 text-amber-900 border border-amber-400";
    } else if (currentIdx === 8) {
      badge.innerText = "PHASE: RESOLVED & RECORDED TO MEMORY";
      badge.className = "px-2.5 py-1 text-xs font-mono font-bold rounded bg-emerald-100 text-emerald-900 border border-emerald-400";
    }
  }

  // Update Lifecycle ribbon
  if (modePill) {
    modePill.className = "px-2 py-0.5 rounded font-mono font-semibold text-[10px] bg-red-100 text-red-800 border border-red-300";
    modePill.innerText = "⚠️ ACTIVE DISRUPTION";
  }
  if (stageName) {
    stageName.innerText = workflowState.current_stage_name || `Stage ${currentIdx}`;
  }
  if (progressBar) {
    const pct = Math.min(100, Math.round((currentIdx / 8) * 100));
    progressBar.style.width = `${pct}%`;
  }
  if (progressText) {
    progressText.innerText = `Stage ${currentIdx} / 8`;
  }

  // Snapshot cards under map in disruption
  const snapCargo = document.getElementById("map-snapshot-cargo");
  const snapCargoSub = document.getElementById("map-snapshot-cargo-sub");
  const snapBuffer = document.getElementById("map-snapshot-buffer");
  const snapBufferSub = document.getElementById("map-snapshot-buffer-sub");
  const snapContract = document.getElementById("map-snapshot-contract");
  const snapContractSub = document.getElementById("map-snapshot-contract-sub");

  if (isInternalDrift) {
    if (snapCargo) { snapCargo.innerText = "PO-501 (Apex Semi SUP-007)"; snapCargo.className = "font-bold text-red-900 mt-0.5"; }
    if (snapCargoSub) snapCargoSub.innerText = "Lead time: 14.1d → 22.4d (+59% drift)";
    if (snapBuffer) { snapBuffer.innerText = "5.2 Days Runout (Critical Gap)"; snapBuffer.className = "font-bold text-amber-900 mt-0.5"; }
    if (snapBufferSub) snapBufferSub.innerText = "Detroit burn: 315 units/day (+26%)";
    if (snapContract) { snapContract.innerText = "$2.60M Contract at Risk"; snapContract.className = "font-bold text-red-900 mt-0.5"; }
    if (snapContractSub) snapContractSub.innerText = "Titan OEM Production Order ORD-OEM-901";
  } else {
    if (snapCargo) { snapCargo.innerText = "SHP-801 (5,000 MCUs)"; snapCargo.className = "font-bold text-red-900 mt-0.5"; }
    if (snapCargoSub) snapCargoSub.innerText = "Aboard MV Pacific Trader (Stranded)";
    if (snapBuffer) { snapBuffer.innerText = "4.8 Days Remaining"; snapBuffer.className = "font-bold text-amber-900 mt-0.5"; }
    if (snapBufferSub) snapBufferSub.innerText = "Detroit Plant 1010 (1,200 on hand)";
    if (snapContract) { snapContract.innerText = "$2.40M Contract at Risk"; snapContract.className = "font-bold text-red-900 mt-0.5"; }
    if (snapContractSub) snapContractSub.innerText = "Titan OEM SLA delivery due in 12 days";
  }
}

function renderPredictiveMetrics() {
  const rp = workflowState.risk_prediction;
  if (!rp) return;

  const probEl = document.getElementById("metric-delay-prob");
  const delayEl = document.getElementById("metric-delay-days");
  const gapEl = document.getElementById("metric-coverage-gap");
  const varEl = document.getElementById("metric-var");
  const narrativeEl = document.getElementById("predictive-narrative");

  const cardProb = document.getElementById("metric-card-prob");
  const cardDelay = document.getElementById("metric-card-delay");
  const cardGap = document.getElementById("metric-card-gap");

  const currentIdx = workflowState.current_stage_index;

  if (probEl) probEl.innerText = `${rp.delay_probability_pct}%`;
  if (delayEl) delayEl.innerText = `+${rp.expected_arrival_delay_days}d`;
  if (gapEl) gapEl.innerText = `${rp.coverage_gap_days} Days`;
  if (varEl) varEl.innerText = `$${(rp.total_unmitigated_financial_loss_usd / 1000000).toFixed(2)}M`;
  if (narrativeEl) narrativeEl.innerText = rp.prediction_summary;

  if (currentIdx === 0) {
    if (cardProb) cardProb.className = "p-2.5 rounded bg-emerald-50/70 border border-emerald-200 text-emerald-950";
    if (cardDelay) cardDelay.className = "p-2.5 rounded bg-emerald-50/70 border border-emerald-200 text-emerald-950";
    if (cardGap) cardGap.className = "p-2.5 rounded bg-emerald-50/70 border border-emerald-200 text-emerald-950";
    if (varEl) varEl.className = "text-lg font-bold text-emerald-400 mt-0.5";
  } else {
    if (cardProb) cardProb.className = "p-2.5 rounded bg-red-50/70 border border-red-200 text-red-950";
    if (cardDelay) cardDelay.className = "p-2.5 rounded bg-red-50/70 border border-red-200 text-red-950";
    if (cardGap) cardGap.className = "p-2.5 rounded bg-amber-50/70 border border-amber-200 text-amber-950";
    if (varEl) varEl.className = "text-lg font-bold text-red-400 mt-0.5";
  }
}

function filterSignalsStream(filter) {
  activeStreamFilter = filter;
  
  // Update tab buttons
  const tabs = ["all", "internal", "external"];
  tabs.forEach(t => {
    const btn = document.getElementById(`stream-tab-${t}`);
    if (!btn) return;
    if (t === filter.toLowerCase()) {
      btn.className = "px-2 py-1 rounded bg-white font-bold text-[#202722] shadow-2xs transition-all cursor-pointer";
    } else {
      btn.className = "px-2 py-1 rounded text-[#68736C] hover:text-[#202722] transition-all cursor-pointer";
    }
  });

  renderSignalsAndVerification();
}

function renderSignalsAndVerification() {
  const container = document.getElementById("incoming-signals-stream");
  const threatClassBadge = document.getElementById("threat-class-badge");
  const breakdownEl = document.getElementById("internal-detection-breakdown");
  const externalCalmBanner = document.getElementById("external-calm-banner");

  if (!container || !workflowState) return;

  const currentIdx = workflowState.current_stage_index;
  const dual = workflowState.dual_stream_telemetry || {};
  const internal = dual.internal_telemetry || {};
  const external = dual.external_signals || [];
  const correlation = dual.correlation || {};
  const classification = correlation.threat_classification || "EXTERNAL_EVENT_SHOCK";
  const sixSteps = correlation.six_step_detection_sequence || [];
  const signals = workflowState.signals || [];
  const ver = workflowState.verification || {};

  // 1. Update Threat Classification Badge
  if (threatClassBadge) {
    if (classification === "INTERNAL_OPERATIONAL_DRIFT") {
      threatClassBadge.innerText = "🏢 INTERNAL OPERATIONAL DRIFT (SAP S/4HANA & IBP)";
      threatClassBadge.className = "text-[9px] font-mono uppercase px-2 py-0.5 rounded font-bold bg-amber-100 text-amber-900 border border-amber-300";
    } else if (classification === "COMPOUND_MULTI_STREAM_RISK") {
      threatClassBadge.innerText = "⚡ COMPOUND THREAT (INTERNAL DRIFT + EXTERNAL SHOCK)";
      threatClassBadge.className = "text-[9px] font-mono uppercase px-2 py-0.5 rounded font-bold bg-red-100 text-red-900 border border-red-300";
    } else {
      threatClassBadge.innerText = "🌐 EXTERNAL THREAT (WEATHER / CHOKEPOINT)";
      threatClassBadge.className = "text-[9px] font-mono uppercase px-2 py-0.5 rounded font-bold bg-blue-100 text-blue-900 border border-blue-300";
    }
  }

  // 2. Render 6-Step Internal Detection Breakdown when Internal Drift or Compound Threat
  if (breakdownEl) {
    if ((classification === "INTERNAL_OPERATIONAL_DRIFT" || classification === "COMPOUND_MULTI_STREAM_RISK") && sixSteps.length > 0 && currentIdx > 0) {
      breakdownEl.classList.remove("hidden");
      breakdownEl.innerHTML = `
        <div class="p-3.5 bg-amber-50/70 border border-amber-300 rounded-lg space-y-2.5">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-2">
              <span class="text-sm">🏢</span>
              <span class="text-xs font-bold text-amber-950 uppercase tracking-tight">
                6-Step Internal Operational Detection (Zero External Reports Needed)
              </span>
            </div>
            <span class="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-amber-200 text-amber-900">
              AUTOMATED ERP AUDIT
            </span>
          </div>
          <p class="text-[11px] text-amber-900/90 leading-relaxed">
            ${internal.summary?.detection_verdict || "Disruption detected silently within enterprise SAP telemetry before production interruption."}
          </p>

          <!-- 6 Step Cards Grid -->
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 pt-1">
            ${sixSteps.map((stepText, idx) => {
              const parts = stepText.split(":");
              const stepTitle = parts[0] || `Step ${idx + 1}`;
              const stepDesc = parts.slice(1).join(":");
              return `
                <div class="p-2.5 bg-white/95 rounded border border-amber-200/90 shadow-2xs space-y-1">
                  <div class="flex items-center justify-between text-[10px]">
                    <span class="font-bold text-[#176B57] font-mono">${stepTitle}</span>
                    <span class="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-[9px]">✓</span>
                  </div>
                  <p class="text-[11px] text-[#202722] leading-snug font-sans">${stepDesc}</p>
                </div>
              `;
            }).join("")}
          </div>
        </div>
      `;
    } else {
      breakdownEl.classList.add("hidden");
    }
  }

  // 3. Render External Calm Banner when external environment is calm
  if (externalCalmBanner) {
    if ((classification === "INTERNAL_OPERATIONAL_DRIFT" || currentIdx === 0) && activeStreamFilter !== "INTERNAL") {
      externalCalmBanner.classList.remove("hidden");
    } else {
      externalCalmBanner.classList.add("hidden");
    }
  }

  // 4. Render Stream Cards
  const renderedCards = [];

  // Internal SAP Telemetry Cards
  if (activeStreamFilter === "ALL" || activeStreamFilter === "INTERNAL") {
    const internalSignals = internal.signals || [];
    internalSignals.forEach(s => {
      let borderClass = s.severity === "CRITICAL" ? "border-amber-300 bg-amber-50/40" : "border-slate-200 bg-white";
      let badgeColor = s.severity === "CRITICAL" ? "bg-amber-100 text-amber-900 border-amber-300" : "bg-slate-100 text-slate-700 border-slate-200";
      
      renderedCards.push(`
        <div class="p-3 rounded border ${borderClass} shadow-2xs flex flex-col justify-between space-y-2">
          <div>
            <div class="flex items-center justify-between text-[10px]">
              <div class="flex items-center space-x-1.5">
                <span class="w-2 h-2 rounded-full ${s.anomaly_detected ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}"></span>
                <span class="font-bold font-mono text-[#202722]">${s.system}</span>
              </div>
              <span class="font-mono text-slate-400">${s.timestamp}</span>
            </div>
            
            <div class="mt-1.5">
              <div class="text-xs font-bold text-[#202722]">${s.metric}</div>
              <div class="text-[10px] font-mono mt-0.5 space-x-1">
                <span class="text-slate-500">Baseline: ${s.baseline_value}</span>
                <span class="text-slate-400">→</span>
                <span class="font-bold ${s.severity === 'CRITICAL' ? 'text-red-700' : 'text-amber-800'}">${s.observed_value}</span>
              </div>
            </div>

            <p class="text-xs text-slate-700 mt-1.5 leading-snug">${s.detail}</p>
          </div>

          <div class="flex items-center justify-between pt-2 border-t border-slate-100 text-[10px] font-mono">
            <span class="px-1.5 py-0.5 rounded border text-[9px] font-bold ${badgeColor}">
              ${s.trend.replace('_', ' ')}
            </span>
            <span class="font-bold text-emerald-800">
              ● SAP ERP DIRECT TELEMETRY
            </span>
          </div>
        </div>
      `);
    });
  }

  // External Disruption Cards
  if (activeStreamFilter === "ALL" || activeStreamFilter === "EXTERNAL") {
    signals.forEach(s => {
      let isVerified = s.verified;
      let borderClass = isVerified ? "border-emerald-200 bg-white" : "border-slate-200 bg-slate-50/50";
      
      renderedCards.push(`
        <div class="p-3 rounded border ${borderClass} shadow-2xs flex flex-col justify-between space-y-2">
          <div>
            <div class="flex items-center justify-between text-[10px]">
              <div class="flex items-center space-x-1.5">
                <span class="w-2 h-2 rounded-full ${isVerified ? 'bg-emerald-500' : 'bg-amber-400'}"></span>
                <span class="font-bold text-[#202722]">${s.source}</span>
              </div>
              <span class="font-mono text-slate-400">${s.timestamp}</span>
            </div>
            <p class="text-xs text-[#202722] mt-1.5 leading-snug">${s.content}</p>
          </div>

          <div class="flex items-center justify-between pt-2 border-t border-slate-100 text-[10px] font-mono">
            <span class="${s.reliability_score >= 0.9 ? 'text-emerald-700 font-bold' : 'text-amber-700'}">
              Reliability: ${(s.reliability_score * 100).toFixed(0)}%
            </span>
            <span class="font-bold ${isVerified ? 'text-emerald-700' : 'text-amber-700'}">
              ${isVerified ? '✓ VERIFIED SIGNAL' : 'FILTERED RUMOR'}
            </span>
          </div>
        </div>
      `);
    });
  }

  if (renderedCards.length === 0) {
    container.innerHTML = `
      <div class="col-span-2 p-3 text-center text-xs text-slate-500">
        No signals active for the selected stream filter.
      </div>
    `;
  } else {
    container.innerHTML = renderedCards.join("");
  }
}

function renderAutonomousAndHumanGate() {
  const autoList = document.getElementById("autonomous-actions-list");
  const humanCard = document.getElementById("human-gate-card");
  const buttonsRow = document.getElementById("decision-buttons-row");
  const completedBanner = document.getElementById("decision-completed-banner");
  const completedText = document.getElementById("decision-completed-text");
  const actionTitle = document.getElementById("proposed-action-title");

  if (!autoList || !workflowState) return;

  const auto = workflowState.autonomous_actions || [];
  const ha = workflowState.human_approval || {};
  const isDecided = ha.status !== "PENDING" && ha.status !== "NOT_REACHED";

  // Render autonomous actions
  autoList.innerHTML = auto.map(a => `
    <div class="flex items-start space-x-2 bg-white/90 p-1.5 rounded border border-emerald-200/80">
      <span class="text-emerald-600 font-bold mt-0.5">✓</span>
      <div class="flex-1">
        <span class="font-bold">${a.action}:</span> ${a.detail}
      </div>
      <span class="font-mono font-bold text-[9px] px-1 py-0.5 rounded bg-emerald-100 text-emerald-800">${a.status}</span>
    </div>
  `).join("");

  if (actionTitle && ha.proposed_action) {
    actionTitle.innerText = `${ha.proposed_action.title} ($${ha.budget_amount_usd.toLocaleString()})`;
  }

  // Toggle Human Gate Buttons vs Completed Banner
  if (isDecided) {
    if (buttonsRow) buttonsRow.classList.add("hidden");
    if (completedBanner) {
      completedBanner.classList.remove("hidden");
      if (completedText) {
        if (ha.status === "approve") {
          completedText.innerText = "✓ Action APPROVED by human supervisor: $95,000 emergency air charter executed.";
          completedBanner.className = "p-2.5 rounded bg-emerald-100 border border-emerald-300 text-xs font-semibold text-emerald-900 flex items-center justify-between";
        } else if (ha.status === "block") {
          completedText.innerText = "✕ Action BLOCKED by human supervisor: Expenditure rejected. Baseline downtime recorded.";
          completedBanner.className = "p-2.5 rounded bg-red-100 border border-red-300 text-xs font-semibold text-red-900 flex items-center justify-between";
        } else {
          completedText.innerText = "⚠️ Telemetry & radar sweeps requested. Verification package assembled.";
          completedBanner.className = "p-2.5 rounded bg-amber-100 border border-amber-300 text-xs font-semibold text-amber-900 flex items-center justify-between";
        }
      }
    }
  } else {
    if (buttonsRow) buttonsRow.classList.remove("hidden");
    if (completedBanner) completedBanner.classList.add("hidden");
  }
}

function renderAgentThoughts() {
  const container = document.getElementById("agent-thought-stream");
  if (!container || !workflowState) return;

  const trace = workflowState.agent_thought_trace || [];
  container.innerHTML = trace.map(t => {
    let badgeClass = "bg-slate-100 text-slate-700 border-slate-200";
    if (t.type === "warning") badgeClass = "bg-amber-100 text-amber-800 border-amber-300";
    else if (t.type === "danger") badgeClass = "bg-red-100 text-red-800 border-red-300";
    else if (t.type === "success") badgeClass = "bg-emerald-100 text-emerald-800 border-emerald-300";

    return `
      <div class="p-2.5 rounded bg-white border border-[#E2E5E0] shadow-2xs space-y-1">
        <div class="flex items-center justify-between text-[10px]">
          <div class="flex items-center space-x-1.5">
            <span class="font-mono text-slate-400">${t.timestamp}</span>
            <span class="font-bold text-[#202722]">${t.agent}</span>
          </div>
          <span class="px-1.5 py-0.5 rounded text-[9px] font-mono border ${badgeClass}">
            ${t.action}
          </span>
        </div>
        <p class="text-xs text-[#202722] leading-relaxed font-sans">${t.thought}</p>
      </div>
    `;
  }).join("");

  container.scrollTop = container.scrollHeight;
}

function renderAlternativesAndIssues() {
  const container = document.getElementById("alternatives-container");
  const badge = document.getElementById("recommendation-engine-badge");
  if (!container || !workflowState) return;

  const currentIdx = workflowState.current_stage_index;
  const actions = workflowState.preventive_actions || [];

  if (currentIdx === 0) {
    if (badge) {
      badge.innerText = "Nominal Monitoring Active";
      badge.className = "text-[10px] font-mono px-2 py-0.5 rounded font-bold bg-emerald-50 text-emerald-800 border border-emerald-200";
    }
    container.innerHTML = `
      <div class="p-3.5 rounded bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div class="font-bold flex items-center space-x-1.5">
            <span class="w-2 h-2 rounded-full bg-emerald-600"></span>
            <span>Baseline Nominal Monitoring Active</span>
          </div>
          <div class="text-[11px] text-emerald-800/90 mt-0.5">
            All 8 global supply corridors are operating within safe baseline tolerances. Detroit plant buffer healthy at 18.5 days. Zero active disruption warnings.
          </div>
        </div>
        <div class="flex items-center space-x-2 flex-shrink-0">
          <a href="injector.html" target="_blank" class="px-3 py-1.5 bg-[#176B57] hover:bg-[#115243] text-white rounded text-xs font-semibold whitespace-nowrap shadow-2xs">
            ⚡ Open Injector Studio ↗
          </a>
        </div>
      </div>
    `;
    return;
  }

  if (actions.length === 0) {
    if (badge) {
      badge.innerText = "Disruption Pipeline In Progress";
      badge.className = "text-[10px] font-mono px-2 py-0.5 rounded font-bold bg-slate-100 text-slate-700 border border-slate-300";
    }
    container.innerHTML = `
      <div class="p-3 rounded bg-slate-50 border border-slate-200 text-xs text-slate-600">
        Stage ${currentIdx} of 8 in progress. Preventive action alternatives and trade compliance evaluations will be fully ranked at Stage 6.
      </div>
    `;
    return;
  }

  // At or beyond Stage 6: We have alternatives!
  if (selectedAlternativeIndex >= actions.length) {
    selectedAlternativeIndex = 0;
  }

  const activeAction = actions[selectedAlternativeIndex];
  const analysis = activeAction.alternative_issues_analysis || {};
  const isGemini = (analysis.engine || "").includes("Gemini");

  if (badge) {
    if (isGemini) {
      badge.innerText = "Google Gemini 2.5 Flash (Live AI)";
      badge.className = "text-[10px] font-mono px-2 py-0.5 rounded font-bold bg-blue-50 text-blue-800 border border-blue-200";
    } else {
      badge.innerText = "Compliance Policy Engine (Rule-based Fallback)";
      badge.className = "text-[10px] font-mono px-2 py-0.5 rounded font-bold bg-slate-100 text-slate-800 border border-slate-300";
    }
  }

  // 1. Render alternative selection tabs
  const tabsHtml = `
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 pb-1">
      ${actions.map((act, idx) => {
        const isSelected = idx === selectedAlternativeIndex;
        const isRec = act.is_recommended;
        let borderClass = isSelected ? "border-[#176B57] bg-white ring-1 ring-[#176B57]" : "border-[#E2E5E0] bg-[#FAFAF8] hover:bg-white";
        return `
          <button onclick="selectAlternative(${idx})" class="p-2.5 rounded-lg border ${borderClass} text-left transition-all cursor-pointer flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between">
                <span class="text-[10px] font-mono font-bold ${isRec ? 'text-emerald-700' : 'text-slate-500'}">
                  ${isRec ? '★ RECOMMENDED' : `ALTERNATIVE ${idx + 1}`}
                </span>
                <span class="text-[10px] font-mono font-bold text-[#202722]">
                  $${act.cost_usd.toLocaleString()}
                </span>
              </div>
              <div class="text-xs font-bold text-[#202722] mt-1 leading-snug line-clamp-2">
                ${act.title}
              </div>
            </div>
            <div class="flex items-center justify-between text-[10px] text-[#68736C] mt-2 pt-1.5 border-t border-slate-200/60 font-mono">
              <span>Transit: ${act.execution_lead_time_days}d</span>
              <span class="${act.net_financial_benefit_usd > 0 ? 'text-emerald-700 font-bold' : 'text-red-700'}">
                Net: ${act.net_financial_benefit_usd > 0 ? '+' : ''}$${(act.net_financial_benefit_usd / 1000).toFixed(0)}k
              </span>
            </div>
          </button>
        `;
      }).join("")}
    </div>
  `;

  // 2. Render deep issues breakdown for the selected alternative
  const positiveList = (analysis.positive_factors || []).map(p => `
    <li class="flex items-start space-x-1.5">
      <span class="text-emerald-600 font-bold text-xs">✓</span>
      <span>${p}</span>
    </li>
  `).join("");

  const issuesList = (analysis.issues || []).map(iss => {
    let sevBadge = "bg-amber-100 text-amber-900 border-amber-300";
    if (iss.severity === "HIGH") sevBadge = "bg-orange-100 text-orange-900 border-orange-300";
    if (iss.severity === "CRITICAL") sevBadge = "bg-red-100 text-red-900 border-red-300";
    if (iss.severity === "LOW") sevBadge = "bg-slate-100 text-slate-700 border-slate-300";

    return `
      <div class="p-3 bg-white rounded border border-[#E2E5E0] shadow-2xs space-y-2">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
          <div class="flex items-center space-x-2">
            <span class="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold border ${sevBadge}">
              ${iss.severity} RISK
            </span>
            <span class="text-xs font-bold text-[#202722]">${iss.issue}</span>
          </div>
          <span class="text-[10px] font-mono text-slate-500">${iss.statute || iss.category}</span>
        </div>
        <p class="text-xs text-slate-700 leading-relaxed">${iss.description}</p>
        <div class="p-2 rounded bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-950 space-y-0.5">
          <div class="font-bold text-[10px] uppercase font-mono text-emerald-900 flex items-center space-x-1">
            <svg class="w-3 h-3 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <span>Actionable Compliance & Operational Mitigation</span>
          </div>
          <div class="text-[11px] leading-relaxed text-emerald-950">${iss.mitigation}</div>
        </div>
      </div>
    `;
  }).join("");

  const barriersList = (analysis.immutable_statutory_barriers || []).map(b => `
    <div class="p-2.5 rounded bg-red-100 border border-red-300 text-xs text-red-950 font-bold flex items-start space-x-2">
      <span class="text-base">⛔</span>
      <div class="flex-1">
        <span class="font-mono uppercase text-[10px] text-red-800">IMMUTABLE STATUTORY BARRIER:</span>
        <div class="text-[11px] font-normal text-red-950 mt-0.5">${b}</div>
      </div>
    </div>
  `).join("");

  const noBarrierNotice = (!analysis.immutable_barrier_detected && (!analysis.immutable_statutory_barriers || analysis.immutable_statutory_barriers.length === 0))
    ? `<div class="p-2 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-900 flex items-center space-x-1.5">
        <svg class="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
        <span><strong>No immutable statutory barriers detected:</strong> Path is legally permissible under international trade conventions with active mitigations.</span>
       </div>`
    : "";

  container.innerHTML = `
    ${tabsHtml}
    
    <div class="p-3.5 rounded-lg bg-[#FAFAF8] border border-[#E2E5E0] space-y-3">
      
      <!-- Engine Source Banner -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-2 border-b border-[#E2E5E0] gap-2">
        <div>
          <span class="text-xs font-bold text-[#202722]">Alternative Detailed Analysis: ${activeAction.title}</span>
          <div class="text-[10px] text-[#68736C]">Evaluates regulatory export compliance, carrier operations, and country cabotage statutes.</div>
        </div>
        <div class="flex items-center space-x-1.5">
          <span class="text-[9px] font-mono text-slate-400">ANALYSIS ENGINE:</span>
          ${isGemini ? `
            <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-100 text-blue-900 border border-blue-300">
              🤖 Google Gemini 2.5 Flash (Live AI)
            </span>
          ` : `
            <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-200 text-slate-800 border border-slate-300" title="Offline sandbox fallback: deterministic compliance rules applied">
              ⚖️ Deterministic Compliance Policy Engine (Rule-based Fallback)
            </span>
          `}
        </div>
      </div>

      <!-- Positive Factors -->
      <div class="space-y-1 text-xs text-[#202722]">
        <div class="text-[10px] font-mono font-bold text-slate-500 uppercase">Positive Factors (Why Choose This Path):</div>
        <ul class="space-y-1 text-xs">
          ${positiveList}
        </ul>
      </div>

      <!-- Issues that occur in this alternative -->
      <div class="space-y-2 pt-2 border-t border-[#E2E5E0]">
        <div class="text-[10px] font-mono font-bold text-slate-500 uppercase flex items-center justify-between">
          <span>Issues That Occur When Executing This Alternative (${(analysis.issues || []).length}):</span>
          <span class="text-[9px] text-[#68736C]">Regulatory · Operational · Country Policy</span>
        </div>
        <div class="space-y-2">
          ${issuesList}
        </div>
      </div>

      <!-- Immutable Statutory Barriers -->
      <div class="space-y-1.5 pt-1">
        ${barriersList}
        ${noBarrierNotice}
      </div>

      <!-- Legal Summary Verdict -->
      ${analysis.legal_verdict ? `
        <div class="p-2 rounded bg-slate-100 border border-slate-200 text-[11px] font-mono text-slate-800">
          <strong>LEGAL & REGULATORY VERDICT:</strong> ${analysis.legal_verdict}
        </div>
      ` : ""}

    </div>
  `;
}

function selectAlternative(index) {
  selectedAlternativeIndex = index;
  renderAlternativesAndIssues();
}

function initOperationalMap() {
  updateOperationalMap();
}

function updateOperationalMap() {
  const mapDiv = document.getElementById("operational-map");
  if (!mapDiv || typeof L === "undefined") return;

  if (!leafletMap) {
    leafletMap = L.map('operational-map', {
      zoomControl: true,
      attributionControl: false
    }).setView([28.0, 20.0], 2);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18
    }).addTo(leafletMap);
  }

  // Clear existing markers
  mapMarkers.forEach(m => leafletMap.removeLayer(m));
  mapMarkers = [];

  const currentIdx = workflowState ? workflowState.current_stage_index : 0;

  if (currentIdx === 0) {
    // -------------------------------------------------------------
    // CALM NOMINAL MAP (Green markers, calm ocean lane, no storm)
    // -------------------------------------------------------------
    const chennai = [13.0827, 80.2707];
    const detroit = [42.3314, -83.0458];

    const chennaiMarker = L.marker(chennai).addTo(leafletMap)
      .bindPopup("<b>Port of Chennai, India</b><br>Nominal Operations: Berth utilization 94%<br>Shipment SHP-801 on schedule for Detroit");
    mapMarkers.push(chennaiMarker);

    const detroitMarker = L.marker(detroit).addTo(leafletMap)
      .bindPopup("<b>Detroit Advanced Assembly Plant 1010</b><br>Buffer Stock: 18.5 days on hand<br>Zero stockout projected");
    mapMarkers.push(detroitMarker);

    const nominalOceanRoute = L.polyline([
      chennai,
      [11.5, 60.0],
      [12.5, 43.5],
      [27.8, 34.0],
      [36.0, -5.5],
      [36.9, -76.3],
      detroit
    ], {
      color: '#059669',
      weight: 2.5,
      dashArray: '5, 8'
    }).addTo(leafletMap).bindPopup("Standard Ocean Corridor (Chennai -> Suez -> Norfolk -> Detroit)");
    mapMarkers.push(nominalOceanRoute);

  } else {
    // -------------------------------------------------------------
    // ACTIVE DISRUPTION MAP (Red cyclone zone, stranded cargo, reroute)
    // -------------------------------------------------------------
    const chennai = [13.0827, 80.2707];
    const frankfurt = [50.0379, 8.5622];
    const detroit = [42.3314, -83.0458];

    const chennaiMarker = L.marker(chennai).addTo(leafletMap)
      .bindPopup("<b>Port of Chennai, India</b><br>Disruption Epicenter: Severe Cyclone Senyar<br>Shipment SHP-801 Blocked");
    mapMarkers.push(chennaiMarker);

    const cycloneCircle = L.circle(chennai, {
      color: 'red',
      fillColor: '#f87171',
      fillOpacity: 0.35,
      radius: 450000
    }).addTo(leafletMap).bindPopup("Cyclone Senyar Impact Zone (110 km/h winds)");
    mapMarkers.push(cycloneCircle);

    const frankfurtMarker = L.marker(frankfurt).addTo(leafletMap)
      .bindPopup("<b>Frankfurt Air Cargo Hub (FRA)</b><br>Recommended Preventive Corridor<br>2.0-day transit window");
    mapMarkers.push(frankfurtMarker);

    const detroitMarker = L.marker(detroit).addTo(leafletMap)
      .bindPopup("<b>Detroit Plant 1010 (USA)</b><br>On-Hand Stock: 4.8 days<br>4.1-day coverage gap averted");
    mapMarkers.push(detroitMarker);

    const airRoute = L.polyline([chennai, frankfurt, detroit], {
      color: '#059669',
      weight: 3,
      dashArray: '6, 8'
    }).addTo(leafletMap).bindPopup("Expedited Air Freight Corridor (Lufthansa Cargo via FRA)");
    mapMarkers.push(airRoute);
  }

  leafletMap.invalidateSize();
}

// ==========================================
// SUPPLY CHAIN DATA PANEL (ALWAYS ACCESSIBLE)
// ==========================================

async function loadDataTable(tableName) {
  activeDataTableName = tableName;

  // Update tab styles
  const allTabs = ["suppliers", "components", "shipments", "customer_orders", "bom"];
  allTabs.forEach(t => {
    const tabEl = document.getElementById(`tab-btn-${t}`);
    if (!tabEl) return;
    if (t === tableName) {
      tabEl.className = "data-sub-tab px-4 py-2 text-xs font-semibold border-b-2 border-[#176B57] text-[#176B57] cursor-pointer";
    } else {
      tabEl.className = "data-sub-tab px-4 py-2 text-xs font-medium text-slate-500 hover:text-slate-800 border-b-2 border-transparent cursor-pointer";
    }
  });

  const titleEl = document.getElementById("data-table-title");
  const countEl = document.getElementById("data-table-count");
  if (titleEl) titleEl.innerText = `Table: ${tableName}`;
  if (countEl) countEl.innerText = "Loading records...";

  try {
    const data = await API.getTableData(tableName, 100);
    currentTableRows = data.rows || [];
    renderDataTableRows(currentTableRows);
    if (countEl) countEl.innerText = `${currentTableRows.length} records active in repository`;
  } catch (err) {
    console.error(`Failed to load data table ${tableName}:`, err);
    if (countEl) countEl.innerText = "Error loading records";
  }
}

function refreshActiveDataTable() {
  loadDataTable(activeDataTableName);
}

function renderDataTableRows(rows) {
  const thead = document.getElementById("data-table-head");
  const tbody = document.getElementById("data-table-body");
  if (!thead || !tbody) return;

  if (!rows || rows.length === 0) {
    thead.innerHTML = "";
    tbody.innerHTML = `<tr><td class="p-6 text-center text-xs text-slate-400">No records found matching query.</td></tr>`;
    return;
  }

  const columns = Object.keys(rows[0]);

  // Render headers
  thead.innerHTML = `
    <tr>
      ${columns.map(col => `
        <th class="py-2.5 px-3 font-semibold uppercase tracking-wider text-[10px] text-[#68736C]">
          ${col.replace(/_/g, " ")}
        </th>
      `).join("")}
    </tr>
  `;

  // Render body rows
  tbody.innerHTML = rows.map((r, i) => `
    <tr class="hover:bg-slate-50 ${i % 2 === 0 ? 'bg-white' : 'bg-[#FAFAF8]'}">
      ${columns.map(col => {
        let val = r[col];
        if (val === null || val === undefined) val = "-";
        else if (typeof val === "number") {
          val = Number.isInteger(val) ? val.toLocaleString() : val.toFixed(2);
        }
        return `<td class="py-2 px-3 text-[#202722] font-mono text-[11px] truncate max-w-[200px]">${val}</td>`;
      }).join("")}
    </tr>
  `).join("");
}

function filterDataTable(query) {
  if (!query || query.trim() === "") {
    renderDataTableRows(currentTableRows);
    return;
  }

  const q = query.toLowerCase().trim();
  const filtered = currentTableRows.filter(r => {
    return Object.values(r).some(val => String(val).toLowerCase().includes(q));
  });

  renderDataTableRows(filtered);
  const countEl = document.getElementById("data-table-count");
  if (countEl) countEl.innerText = `${filtered.length} of ${currentTableRows.length} records matching "${query}"`;
}

// ==========================================
// INCIDENT HISTORY & RETROSPECTIVE STORE
// ==========================================

async function loadIncidentHistory() {
  const tbody = document.getElementById("incident-history-tbody");
  if (!tbody) return;

  try {
    const res = await API.getIncidentHistory(50);
    const incidents = res.incidents || [];

    if (incidents.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" class="p-6 text-center text-xs text-slate-400">No completed incidents recorded yet.</td></tr>`;
      return;
    }

    tbody.innerHTML = incidents.map(inc => {
      let dec = {};
      try { dec = JSON.parse(inc.decision_json || "{}"); } catch (e) {}
      let outcome = {};
      try { outcome = JSON.parse(inc.actual_outcome_json || "{}"); } catch (e) {}

      const savings = outcome.savings_usd || outcome.prevented_loss_usd || 0;
      const isApproved = (dec.outcome === "APPROVED" || dec.action_id);

      return `
        <tr class="hover:bg-slate-50">
          <td class="py-2.5 px-4 font-mono font-bold text-xs text-[#202722]">${inc.incident_id}</td>
          <td class="py-2.5 px-4 text-xs text-[#202722] font-medium">${inc.title}</td>
          <td class="py-2.5 px-4 text-[11px] font-mono text-[#68736C]">${inc.category}</td>
          <td class="py-2.5 px-4">
            <span class="px-2 py-0.5 rounded text-[10px] font-bold ${isApproved ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}">
              ${dec.outcome || (isApproved ? 'APPROVED' : 'BLOCKED')}
            </span>
          </td>
          <td class="py-2.5 px-4 font-mono font-bold text-xs ${savings > 0 ? 'text-emerald-700' : 'text-slate-500'}">
            ${savings > 0 ? `+$${savings.toLocaleString()}` : '$0'}
          </td>
          <td class="py-2.5 px-4 text-[11px] font-mono text-[#68736C]">
            ${inc.closed_time ? inc.closed_time.split("T")[0] : "-"}
          </td>
        </tr>
      `;
    }).join("");
  } catch (err) {
    console.error("Failed to load incident history:", err);
  }
}

// ==========================================
// EMERGENCY POPUP & SMS ALERT DISPATCH (7736215631)
// ==========================================

let lastAlertedDispatchId = null;

function checkAndTriggerEmergencyAlert() {
  if (!workflowState) return;
  const currentIdx = workflowState.current_stage_index;
  const sms = workflowState.emergency_notification;

  // Trigger popup when an issue is active and there's a new SMS notification
  if (currentIdx > 0 && sms && sms.dispatch_id && sms.dispatch_id !== lastAlertedDispatchId) {
    lastAlertedDispatchId = sms.dispatch_id;
    showEmergencyPopup(workflowState, sms);
  }
}

function showEmergencyPopup(state, sms) {
  const modal = document.getElementById("emergency-alert-modal");
  if (!modal) return;

  const scen = state.scenario || {};
  const rp = state.risk_prediction || {};
  const delay = rp.expected_arrival_delay_days || 4.5;
  const gap = rp.coverage_gap_days || 4.1;
  const varLoss = rp.total_unmitigated_financial_loss_usd || 2400000;
  const varFormatted = varLoss < 1000000 ? `$${(varLoss/1000).toFixed(0)}k` : `$${(varLoss/1000000).toFixed(2)}M`;

  const titleEl = document.getElementById("modal-issue-title");
  const summaryEl = document.getElementById("modal-issue-summary");
  const delayEl = document.getElementById("modal-metric-delay");
  const gapEl = document.getElementById("modal-metric-gap");
  const varEl = document.getElementById("modal-metric-var");
  const bodyEl = document.getElementById("modal-sms-body");
  const carrierEl = document.getElementById("modal-sms-carrier");
  const timeEl = document.getElementById("modal-sms-time");

  if (titleEl) titleEl.innerText = scen.title || "Critical Supply Chain Disruption Detected";
  if (summaryEl) summaryEl.innerText = scen.description || rp.prediction_summary || "Autonomous sentry detected critical risk in supply corridor.";
  if (delayEl) delayEl.innerText = `+${delay.toFixed(1)}d`;
  if (gapEl) gapEl.innerText = `${gap.toFixed(1)} Days`;
  if (varEl) varEl.innerText = varFormatted;

  if (bodyEl && sms) bodyEl.innerText = sms.message || "";
  if (carrierEl && sms) carrierEl.innerText = sms.carrier || "Telephony Gateway";
  if (timeEl && sms) timeEl.innerText = sms.timestamp || "Just Now";

  modal.classList.remove("hidden");

  // Also show quick sticky toast
  const toast = document.getElementById("sms-toast");
  const toastText = document.getElementById("sms-toast-text");
  if (toast) {
    if (toastText && sms) toastText.innerText = `To 7736215631: ${sms.message.slice(0, 80)}...`;
    toast.classList.remove("hidden");
  }
}

function showSMSToast(message) {
  const toast = document.getElementById("sms-toast");
  const toastText = document.getElementById("sms-toast-text");
  if (toast) {
    if (toastText) toastText.innerText = message || "Emergency SMS Dispatched to 7736215631";
    toast.classList.remove("hidden");
    setTimeout(() => {
      toast.classList.add("hidden");
    }, 6000);
  }
}

function closeEmergencyPopup() {
  document.getElementById("emergency-alert-modal")?.classList.add("hidden");
}

function openPolicyGeneratorFromModal() {
  closeEmergencyPopup();
  switchNavPanel("panel-policy");
  generatePolicyForCurrentIssue();
}

function reviewInConsoleFromModal() {
  closeEmergencyPopup();
  switchNavPanel("panel-resilience");
  document.getElementById("human-gate-card")?.scrollIntoView({ behavior: "smooth" });
}

// ==========================================
// POLICY GENERATOR & GOVERNANCE ENGINE
// ==========================================

let currentGeneratedPolicy = null;

async function loadPoliciesList() {
  try {
    const res = await API.getPolicyList();
    const policies = res.policies || [];
    
    const countEl = document.getElementById("active-policies-count");
    if (countEl) countEl.innerText = `${policies.length} Enforced`;

    const listEl = document.getElementById("active-policies-list");
    if (listEl) {
      listEl.innerHTML = policies.map(p => `
        <div onclick="selectPolicyFromList('${p.policy_id}')" class="p-2.5 rounded border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/40 text-left transition-all cursor-pointer">
          <div class="flex items-center justify-between text-[10px]">
            <span class="font-mono font-bold text-slate-700">${p.policy_id}</span>
            <span class="px-1.5 py-0.5 rounded font-mono font-bold text-[9px] ${p.status === 'ACTIVE_ENFORCED' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'}">${p.status}</span>
          </div>
          <div class="font-bold text-xs text-[#202722] mt-1 leading-snug truncate">${p.title}</div>
          <div class="text-[10px] text-[#68736C] font-mono mt-0.5">${p.regulatory_framework ? p.regulatory_framework.slice(0, 35) + '...' : ''}</div>
        </div>
      `).join("");
    }

    // If no policy currently displayed, display the first one
    if (!currentGeneratedPolicy && policies.length > 0) {
      renderPolicyPreview(policies[0]);
    }
  } catch (err) {
    console.error("Failed to load policy list:", err);
  }
}

async function selectPolicyFromList(policyId) {
  try {
    const res = await API.getPolicyList();
    const found = (res.policies || []).find(p => p.policy_id === policyId);
    if (found) {
      renderPolicyPreview(found);
    }
  } catch (err) {
    console.error("Error selecting policy:", err);
  }
}

async function generatePolicyForCurrentIssue() {
  if (!workflowState) return;
  const scen = workflowState.scenario || {};
  const rp = workflowState.risk_prediction || {};
  const delay = rp.expected_arrival_delay_days || 8.4;
  const varUsd = rp.total_unmitigated_financial_loss_usd || 2604000;
  const gap = rp.coverage_gap_days || 6.2;

  const btn = document.querySelector("#panel-policy button[onclick='generatePolicyForCurrentIssue()']");
  if (btn) btn.innerHTML = `<span>⏳ Synthesizing Policy with AI...</span>`;

  try {
    const policy = await API.generatePolicy({
      scenario_id: scen.scenario_id || "INTERNAL_LEAD_TIME_DRIFT",
      incident_title: scen.title || "Operational Disruption",
      delay_days: delay,
      var_usd: varUsd,
      coverage_gap_days: gap,
      component_id: "CMP-MCU-01",
      affected_entity: "PO-501",
      custom_instructions: document.getElementById("policy-custom-prompt")?.value || null
    });
    renderPolicyPreview(policy);
  } catch (err) {
    console.error("Failed to generate policy for current issue:", err);
  } finally {
    if (btn) btn.innerHTML = `<span>⚡ Generate Policy for Current Issue</span>`;
  }
}

async function triggerGeneratePolicy() {
  const scenVal = document.getElementById("policy-scenario-select")?.value || "CURRENT";
  const targetScenario = scenVal === "CURRENT" ? (workflowState?.scenario?.scenario_id || "INTERNAL_LEAD_TIME_DRIFT") : scenVal;
  const promptVal = document.getElementById("policy-custom-prompt")?.value || "";

  const rp = workflowState?.risk_prediction || {};
  const delay = rp.expected_arrival_delay_days || 4.5;
  const varUsd = rp.total_unmitigated_financial_loss_usd || 2400000;
  const gap = rp.coverage_gap_days || 4.1;

  try {
    const policy = await API.generatePolicy({
      scenario_id: targetScenario,
      incident_title: `Resilience Policy for ${targetScenario}`,
      delay_days: delay,
      var_usd: varUsd,
      coverage_gap_days: gap,
      component_id: "CMP-MCU-01",
      affected_entity: "SHP-801",
      custom_instructions: promptVal || null
    });
    renderPolicyPreview(policy);
  } catch (err) {
    console.error("Failed to trigger generate policy:", err);
  }
}

function selectPolicyArchetype(archetype) {
  const select = document.getElementById("policy-scenario-select");
  const promptEl = document.getElementById("policy-custom-prompt");

  if (archetype === "dual_sourcing") {
    if (select) select.value = "INTERNAL_LEAD_TIME_DRIFT";
    if (promptEl) promptEl.value = "Enforce dual-sourcing mandate with automated SAP BAPI_PO_CREATE1 reservation when delivery drift > 15%. Include SMS alert to 7736215631.";
  } else if (archetype === "hazardous_iata") {
    if (select) select.value = "PORT_CLOSURE_LONG_BEACH";
    if (promptEl) promptEl.value = "Mandate IATA Packing Instruction 965 Section IA compliance, Cargo-Aircraft Only, and <= 30% SoC cell discharge.";
  } else if (archetype === "ear_compliance") {
    if (select) select.value = "SUPPLIER_SHUTDOWN_TAIWAN";
    if (promptEl) promptEl.value = "Enforce EAR § 734 dual-use cryptographic export licensing for automotive microcontrollers. Block Entity List routes.";
  } else if (archetype === "fiscal_ceiling") {
    if (select) select.value = "CYCLONE_CHENNAI";
    if (promptEl) promptEl.value = "Establish $50,000 USD fiscal authorization ceiling for expedited air charters. Mandate VP Human Approval.";
  }

  triggerGeneratePolicy();
}

function renderPolicyPreview(policy) {
  if (!policy) return;
  currentGeneratedPolicy = policy;

  const idEl = document.getElementById("preview-policy-id");
  const statusEl = document.getElementById("preview-policy-status");
  const catEl = document.getElementById("preview-policy-category");
  const titleEl = document.getElementById("preview-policy-title");
  const fwEl = document.getElementById("preview-policy-framework");
  const dateEl = document.getElementById("preview-policy-date");
  const scopeEl = document.getElementById("preview-policy-scope");
  const triggersEl = document.getElementById("preview-policy-triggers");
  const rulesEl = document.getElementById("preview-policy-rules");
  const guardrailsEl = document.getElementById("preview-policy-guardrails");
  const penaltiesEl = document.getElementById("preview-policy-penalties");
  const pagingEl = document.getElementById("preview-policy-paging");
  const activateBtn = document.getElementById("btn-activate-policy");

  if (idEl) idEl.innerText = policy.policy_id || "POL-RES-001";
  if (statusEl) {
    statusEl.innerText = policy.status || "DRAFT_GENERATED";
    statusEl.className = policy.status === "ACTIVE_ENFORCED" 
      ? "text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300"
      : "text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300";
  }
  if (catEl) catEl.innerText = (policy.category || "RESILIENCE").replace(/_/g, " ");
  if (titleEl) titleEl.innerText = policy.title || "Enterprise Resilience Policy";
  if (fwEl) fwEl.innerText = policy.regulatory_framework || "ISO 22301";
  if (dateEl) dateEl.innerText = policy.effective_date || "2026-01-15";
  if (scopeEl) scopeEl.innerText = policy.scope || "Global Enterprise Logistics Network";

  if (triggersEl) {
    const trigs = policy.quantitative_triggers || [];
    triggersEl.innerHTML = trigs.map(t => `
      <div class="p-2 rounded bg-amber-50/60 border border-amber-200 text-amber-950 flex items-start space-x-2">
        <span class="text-amber-700 font-bold mt-0.5">⚡</span>
        <span>${t}</span>
      </div>
    `).join("");
  }

  if (rulesEl) {
    const rules = policy.mandatory_enforcement_rules || [];
    rulesEl.innerHTML = rules.map(r => `
      <div class="p-2 rounded bg-emerald-50/60 border border-emerald-200 text-emerald-950 flex items-start space-x-2">
        <span class="text-emerald-700 font-bold mt-0.5">✓</span>
        <span>${r}</span>
      </div>
    `).join("");
  }

  if (guardrailsEl) {
    const guards = policy.statutory_compliance_guardrails || [];
    guardrailsEl.innerHTML = guards.map(g => `<div>• ${g}</div>`).join("");
  }

  if (penaltiesEl) penaltiesEl.innerText = policy.sla_penalty_clause || "Standard delay damages apply.";
  if (pagingEl) pagingEl.innerText = policy.emergency_notification_target || "Operations Commander (+91 7736215631)";

  if (activateBtn) {
    if (policy.status === "ACTIVE_ENFORCED") {
      activateBtn.innerHTML = `<span>✓ Policy Active & Enforced</span>`;
      activateBtn.className = "px-3 py-1.5 bg-slate-100 text-emerald-800 border border-emerald-300 rounded text-xs font-semibold shadow-2xs";
      activateBtn.disabled = true;
    } else {
      activateBtn.innerHTML = `<span>Activate Policy</span>`;
      activateBtn.className = "px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold shadow-2xs transition-all cursor-pointer";
      activateBtn.disabled = false;
    }
  }
}

async function activateCurrentPolicy() {
  if (!currentGeneratedPolicy) return;
  try {
    const res = await API.activatePolicy(currentGeneratedPolicy);
    renderPolicyPreview(res);
    await loadPoliciesList();
  } catch (err) {
    console.error("Failed to activate policy:", err);
  }
}

function copyPolicyMarkdown() {
  if (!currentGeneratedPolicy) return;
  API.getPolicyExport(currentGeneratedPolicy.policy_id).then(res => {
    navigator.clipboard.writeText(res.markdown || "").then(() => {
      alert(`Policy document [${currentGeneratedPolicy.policy_id}] copied to clipboard as Markdown!`);
    });
  }).catch(err => {
    console.error("Failed to export markdown:", err);
  });
}

// ==========================================
// 8. SUPPLY EXCHANGE & CROSS-BORDER LEGAL BRIDGE
// ==========================================

let selectedExchangeSupplierId = "SUP-004"; // Default: Kyoto Microelectronics, Japan
let currentExchangeCandidates = [];
let activeExchangeEvaluation = null;

async function loadSupplyExchangePanel() {
  try {
    const componentId = "CMP-MCU-01";
    const currentSupplierId = "SUP-001";
    
    // Fetch candidates
    const res = await API.getExchangeCandidates(componentId, currentSupplierId);
    currentExchangeCandidates = res.candidates || [];
    renderExchangeCandidateCards();
    
    // Evaluate for currently selected candidate
    await runSupplyExchangeEvaluation();
  } catch (err) {
    console.error("Failed to load supply exchange panel:", err);
  }
}

function renderExchangeCandidateCards() {
  const container = document.getElementById("exchange-candidates-grid");
  if (!container) return;

  if (currentExchangeCandidates.length === 0) {
    container.innerHTML = `<div class="col-span-full p-4 text-center text-xs text-[#68736C]">No qualified candidate suppliers found.</div>`;
    return;
  }

  container.innerHTML = currentExchangeCandidates.map(c => {
    const isSelected = c.supplier_id === selectedExchangeSupplierId;
    const borderClass = isSelected ? "border-indigo-600 bg-indigo-50/50 shadow-sm ring-2 ring-indigo-500/20" : "border-[#E2E5E0] bg-[#FAFAF8] hover:border-indigo-300";
    const flag = c.country === "Japan" ? "🇯🇵" : c.country === "Germany" ? "🇩🇪" : c.country === "USA" ? "🇺🇸" : c.country === "Mexico" ? "🇲🇽" : "🇰🇷";

    return `
      <div onclick="selectExchangeCandidate('${c.supplier_id}')" class="p-3 rounded-lg border ${borderClass} transition-all cursor-pointer flex flex-col justify-between space-y-2">
        <div>
          <div class="flex items-center justify-between">
            <span class="text-sm">${flag} <span class="font-bold text-xs text-[#202722]">${c.country}</span></span>
            <span class="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-700'}">
              ${c.supplier_id}
            </span>
          </div>
          <div class="font-semibold text-xs text-[#202722] mt-1.5 leading-snug line-clamp-2">${c.name}</div>
          <div class="text-[10px] text-[#68736C] mt-0.5">${c.city}</div>
        </div>

        <div class="pt-2 border-t border-[#E2E5E0]/60 space-y-1 text-[10px] font-mono">
          <div class="flex items-center justify-between">
            <span class="text-[#68736C]">Transit Lead:</span>
            <span class="font-bold text-emerald-800">${c.standard_lead_time_days} days</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-[#68736C]">Buffer Cap:</span>
            <span class="font-bold text-indigo-900">${c.available_capacity_pct}% avail</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-[#68736C]">Unit Cost:</span>
            <span class="font-bold text-[#202722]">$${c.unit_cost_usd.toFixed(2)}</span>
          </div>
        </div>
      </div>
    `;
  }).join("");
}

function selectExchangeCandidate(supplierId) {
  selectedExchangeSupplierId = supplierId;
  renderExchangeCandidateCards();
  runSupplyExchangeEvaluation();
}

async function runSupplyExchangeEvaluation() {
  const qtyInput = document.getElementById("exchange-qty-input");
  const units = qtyInput ? parseInt(qtyInput.value) || 5000 : 5000;

  try {
    const payload = {
      component_id: "CMP-MCU-01",
      current_supplier_id: "SUP-001",
      target_supplier_id: selectedExchangeSupplierId,
      units_to_exchange: units,
      destination_facility_id: "FAC-DETROIT"
    };

    const res = await API.evaluateSupplyExchange(payload);
    activeExchangeEvaluation = res;
    renderExchangeEvaluationDetails(res);
  } catch (err) {
    console.error("Evaluation failed:", err);
  }
}

function renderExchangeEvaluationDetails(evalData) {
  if (!evalData) return;

  const feas = evalData.operational_feasibility || {};
  const legal = evalData.cross_border_legal_framework || {};
  const target = evalData.target_node || {};

  // Feasibility badges & metrics
  const statusBadge = document.getElementById("feasibility-status-badge");
  const scorePill = document.getElementById("feasibility-score-pill");
  const leadTimeEl = document.getElementById("feasibility-lead-time");
  const leadTimeSub = document.getElementById("feasibility-lead-time-sub");
  const bufferMarginEl = document.getElementById("feasibility-buffer-margin");
  const costDeltaEl = document.getElementById("feasibility-cost-delta");
  const unitCostEl = document.getElementById("feasibility-unit-cost");
  const netGainEl = document.getElementById("feasibility-net-gain");
  const verdictEl = document.getElementById("feasibility-verdict");
  const explanationEl = document.getElementById("feasibility-explanation");

  if (statusBadge) {
    statusBadge.innerText = feas.prevents_stockout ? "FEASIBLE (RECOMMENDED)" : "TIGHT TOLERANCE";
    statusBadge.className = feas.prevents_stockout 
      ? "px-2 py-0.5 rounded font-mono font-bold text-[9px] bg-emerald-100 text-emerald-900 border border-emerald-300"
      : "px-2 py-0.5 rounded font-mono font-bold text-[9px] bg-amber-100 text-amber-900 border border-amber-300";
  }

  if (scorePill) {
    scorePill.innerText = `Score: ${feas.feasibility_score_pct || 94} / 100`;
  }

  if (leadTimeEl) leadTimeEl.innerText = `${feas.transition_lead_time_days || target.transit_lead_time_days || 3.8} Days`;
  if (leadTimeSub) leadTimeSub.innerText = `Direct routing from ${target.country || 'Partner Hub'}`;

  if (bufferMarginEl) {
    const margin = feas.stockout_safety_margin_days || 1.4;
    bufferMarginEl.innerText = margin >= 0 ? `+${margin} Days` : `${margin} Days`;
    bufferMarginEl.className = margin >= 0 ? "text-lg font-bold text-emerald-950 mt-0.5" : "text-lg font-bold text-red-950 mt-0.5";
  }

  if (costDeltaEl) {
    const incCost = feas.incremental_cost_usd || 65000;
    costDeltaEl.innerText = incCost >= 0 ? `+$${(incCost).toLocaleString()}` : `-$${Math.abs(incCost).toLocaleString()}`;
  }

  if (unitCostEl) {
    unitCostEl.innerText = `+$${((target.unit_cost_usd || 98) - 85).toFixed(2)}/unit (+${feas.unit_cost_premium_pct || 15.3}%)`;
  }

  if (netGainEl) {
    const netGain = feas.net_financial_benefit_usd || 2539000;
    netGainEl.innerText = `+$${(netGain / 1000000).toFixed(3)}M`;
  }

  if (verdictEl) {
    verdictEl.innerText = feas.prevents_stockout 
      ? `✓ ${feas.stockout_safety_margin_days}d safety buffer before Detroit assembly line shutdown`
      : `⚠️ Margin narrow: requires priority customs fast-track`;
  }

  if (explanationEl) {
    explanationEl.innerText = `${target.name} (${target.country}) can fulfill ${evalData.units_to_exchange?.toLocaleString()} units in ${feas.transition_lead_time_days} days. Detroit assembly buffer exhausts in 5.2 days, yielding +${feas.stockout_safety_margin_days} days of buffer headroom and protecting $${(feas.avoided_downtime_liability_usd / 1000000).toFixed(3)}M in avoided downtime liability.`;
  }

  // Legal Framework & Documents
  const primStatute = legal.primary_statute || {};
  const statuteTitle = document.getElementById("statute-title");
  const statuteDesc = document.getElementById("statute-description");
  if (statuteTitle) statuteTitle.innerText = `${primStatute.statute_name || 'U.S. EAR 15 CFR § 740.20'} (${primStatute.citation || 'STA License Exception'})`;
  if (statuteDesc) statuteDesc.innerText = primStatute.legal_scope || primStatute.compliance_mechanism || "Authorizes cross-border transfer under expedited multilateral trade exception.";

  // Documents list
  const docsContainer = document.getElementById("exchange-documents-container");
  if (docsContainer) {
    const docs = legal.mandatory_permits || [];
    docsContainer.innerHTML = docs.map(d => `
      <div class="p-2 rounded bg-slate-50 border border-slate-200 text-xs text-slate-800 flex items-start space-x-2">
        <span class="text-indigo-600 font-bold mt-0.5">📄</span>
        <span class="font-mono text-[11px] leading-tight">${d}</span>
      </div>
    `).join("");
  }

  // Tariff & Speed
  const tariffEl = document.getElementById("exchange-tariff-rate");
  const speedEl = document.getElementById("exchange-clearance-speed");
  if (tariffEl) tariffEl.innerText = legal.tariff_rate || "0.0% (ITA / MFN)";
  if (speedEl) speedEl.innerText = `${legal.customs_fast_track_hours || 24} Hours`;

  // 5-Step Roadmap
  const roadmapContainer = document.getElementById("exchange-roadmap-container");
  if (roadmapContainer) {
    const steps = evalData.transition_roadmap || [];
    roadmapContainer.innerHTML = steps.map((s, idx) => `
      <div class="p-2.5 rounded bg-[#FAFAF8] border border-[#E2E5E0] text-xs flex items-start space-x-2.5">
        <span class="w-5 h-5 rounded-full bg-indigo-100 text-indigo-900 font-mono font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
          ${idx + 1}
        </span>
        <span class="text-[#202722] text-[11px] leading-relaxed">${s}</span>
      </div>
    `).join("");
  }

  // Reset Execute Button state
  const execBtn = document.getElementById("btn-execute-exchange");
  if (execBtn) {
    execBtn.disabled = false;
    execBtn.className = "w-full py-2.5 px-3 bg-[#176B57] hover:bg-[#115243] text-white rounded text-xs font-semibold shadow-xs flex items-center justify-center space-x-1.5 cursor-pointer transition-all";
    execBtn.innerHTML = `
      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path></svg>
      <span>Authorize & Stage SAP BAPI Purchase Order</span>
    `;
  }
}

async function commitSupplyExchange() {
  if (!activeExchangeEvaluation) return;

  const execBtn = document.getElementById("btn-execute-exchange");
  if (execBtn) {
    execBtn.disabled = true;
    execBtn.innerHTML = `
      <svg class="w-3.5 h-3.5 animate-spin mr-1.5" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path></svg>
      Staging SAP BAPI PO...
    `;
  }

  try {
    const payload = {
      exchange_id: activeExchangeEvaluation.exchange_id,
      supervisor_notes: "Authorized by Chief Operations Officer via Legal Bridge"
    };

    const receipt = await API.executeSupplyExchange(payload);
    
    if (execBtn) {
      execBtn.className = "w-full py-2.5 px-3 bg-emerald-700 text-white rounded text-xs font-semibold shadow-xs flex items-center justify-center space-x-1.5";
      execBtn.innerHTML = `<span>✓ Staged via SAP BAPI (PO ${receipt.sap_po_number || 'PO-SAP-748921'})</span>`;
    }

    // Show toast with SMS confirmation
    showSMSToast(`Supply exchange to ${activeExchangeEvaluation.target_node?.country} staged. Confirmation SMS sent to 7736215631.`);
  } catch (err) {
    console.error("Execution failed:", err);
    if (execBtn) {
      execBtn.disabled = false;
      execBtn.innerHTML = `<span>Retry SAP Execution</span>`;
    }
  }
}

async function generatePolicyFromActiveExchange() {
  if (!activeExchangeEvaluation) return;

  try {
    const policy = await API.generateExchangePolicy(activeExchangeEvaluation);
    switchNavPanel("panel-policy");
    renderPolicyPreview(policy);
  } catch (err) {
    console.error("Failed to generate exchange policy:", err);
  }
}

function openSupplyExchangeForCurrentIssue() {
  switchNavPanel("panel-exchange");
}

function openSupplyExchangeFromModal() {
  closeEmergencyPopup();
  switchNavPanel("panel-exchange");
}
