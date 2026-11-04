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
      pill.className = "stamp-tag stamp-sap";
      pill.innerHTML = `[ RUNNING: STAGE ${currentIdx} OF 8 ]`;
    } else if (st === "AWAITING_HUMAN_APPROVAL") {
      pill.className = "stamp-tag stamp-warning";
      pill.innerHTML = `[ AWAITING HUMAN AUTHORIZATION ]`;
    } else if (st === "COMPLETED") {
      pill.className = "stamp-tag stamp-nominal";
      pill.innerHTML = `[ RESOLVED & RETRAINED ]`;
    }
  }

  // Update Phase Badge
  if (badge) {
    if (currentIdx === 1) {
      badge.innerText = "PHASE: SIGNALS INGESTED";
      badge.className = "stamp-tag stamp-neutral";
    } else if (currentIdx === 2) {
      badge.innerText = "PHASE: EARLY WARNING DETECTED";
      badge.className = "stamp-tag stamp-warning";
    } else if (currentIdx === 3) {
      badge.innerText = "PHASE: TRIANGULATED & CONFIRMED (94%)";
      badge.className = "stamp-tag stamp-sap";
    } else if (currentIdx === 4) {
      badge.innerText = "PHASE: IMPACT EXPOSURE MAPPED";
      badge.className = "stamp-tag stamp-sap";
    } else if (currentIdx === 5) {
      badge.innerText = "PHASE: DELAY & SHORTAGE PREDICTED";
      badge.className = "stamp-tag stamp-critical";
    } else if (currentIdx === 6) {
      badge.innerText = "PHASE: RECOMMENDATIONS & ISSUES ANALYZED";
      badge.className = "stamp-tag stamp-nominal";
    } else if (currentIdx === 7) {
      badge.innerText = "PHASE: HUMAN APPROVAL REQUIRED";
      badge.className = "stamp-tag stamp-warning";
    } else if (currentIdx === 8) {
      badge.innerText = "PHASE: RESOLVED & RECORDED TO MEMORY";
      badge.className = "stamp-tag stamp-nominal";
    }
  }

  // Update Lifecycle ribbon
  if (modePill) {
    modePill.className = "stamp-tag stamp-critical";
    modePill.innerText = "[ ALERT: ACTIVE DISRUPTION ]";
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
    if (snapCargo) { snapCargo.innerText = "PO-501 (Apex Semi SUP-007)"; snapCargo.className = "font-bold text-[#8F2718] mt-0.5 font-mono"; }
    if (snapCargoSub) snapCargoSub.innerText = "Lead time: 14.1d → 22.4d (+59% drift)";
    if (snapBuffer) { snapBuffer.innerText = "5.2 Days Runout (Critical Gap)"; snapBuffer.className = "font-bold text-[#78450E] mt-0.5 font-mono"; }
    if (snapBufferSub) snapBufferSub.innerText = "Detroit burn: 315 units/day (+26%)";
    if (snapContract) { snapContract.innerText = "$2.60M Contract at Risk"; snapContract.className = "font-bold text-[#8F2718] mt-0.5 font-mono"; }
    if (snapContractSub) snapContractSub.innerText = "Titan OEM Production Order ORD-OEM-901";
  } else {
    if (snapCargo) { snapCargo.innerText = "SHP-801 (5,000 MCUs)"; snapCargo.className = "font-bold text-[#8F2718] mt-0.5 font-mono"; }
    if (snapCargoSub) snapCargoSub.innerText = "Aboard MV Pacific Trader (Stranded)";
    if (snapBuffer) { snapBuffer.innerText = "4.8 Days Remaining"; snapBuffer.className = "font-bold text-[#78450E] mt-0.5 font-mono"; }
    if (snapBufferSub) snapBufferSub.innerText = "Detroit Plant 1010 (1,200 on hand)";
    if (snapContract) { snapContract.innerText = "$2.40M Contract at Risk"; snapContract.className = "font-bold text-[#8F2718] mt-0.5 font-mono"; }
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
    if (cardProb) cardProb.className = "p-3 bg-[#FAF9F5] border border-[#D5CEBF]";
    if (cardDelay) cardDelay.className = "p-3 bg-[#FAF9F5] border border-[#D5CEBF]";
    if (cardGap) cardGap.className = "p-3 bg-[#FAF9F5] border border-[#D5CEBF]";
    if (varEl) varEl.className = "text-xl font-bold font-mono text-[#144336] mt-0.5";
  } else {
    if (cardProb) cardProb.className = "p-3 bg-[#FAF0EE] border border-[#E8BFB7]";
    if (cardDelay) cardDelay.className = "p-3 bg-[#FAF0EE] border border-[#E8BFB7]";
    if (cardGap) cardGap.className = "p-3 bg-[#FDF7EB] border border-[#E8D3A8]";
    if (varEl) varEl.className = "text-xl font-bold font-mono text-[#8F2718] mt-0.5";
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
      btn.className = "px-2.5 py-1 bg-[#144336] text-white font-bold cursor-pointer font-mono text-[10px]";
    } else {
      btn.className = "px-2.5 py-1 text-[#48524B] hover:text-[#1C201D] cursor-pointer font-mono text-[10px]";
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
      threatClassBadge.innerText = "[INTERNAL] OPERATIONAL DRIFT (SAP S/4HANA & IBP)";
      threatClassBadge.className = "stamp-tag stamp-warning";
    } else if (classification === "COMPOUND_MULTI_STREAM_RISK") {
      threatClassBadge.innerText = "[COMPOUND] INTERNAL DRIFT + EXTERNAL SHOCK";
      threatClassBadge.className = "stamp-tag stamp-critical";
    } else {
      threatClassBadge.innerText = "[EXTERNAL] CHOKEPOINT / WEATHER DISRUPTION";
      threatClassBadge.className = "stamp-tag stamp-sap";
    }
  }

  // 2. Render 6-Step Internal Detection Breakdown when Internal Drift or Compound Threat
  if (breakdownEl) {
    if ((classification === "INTERNAL_OPERATIONAL_DRIFT" || classification === "COMPOUND_MULTI_STREAM_RISK") && sixSteps.length > 0 && currentIdx > 0) {
      breakdownEl.classList.remove("hidden");
      breakdownEl.innerHTML = `
        <div class="p-3.5 bg-[#FAF9F5] border border-[#D5CEBF] space-y-2.5">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-2">
              <span class="font-mono text-xs font-bold text-[#144336]">[AUDIT]</span>
              <span class="text-xs font-bold text-[#1C201D] uppercase font-mono tracking-tight">
                6-Step Internal Operational Detection (SAP S/4HANA & IBP)
              </span>
            </div>
            <span class="stamp-tag stamp-sap">
              AUTOMATED ERP AUDIT
            </span>
          </div>
          <p class="text-[11px] text-[#48524B] leading-relaxed font-mono">
            ${internal.summary?.detection_verdict || "Disruption detected silently within enterprise SAP telemetry before production interruption."}
          </p>

          <!-- 6 Step Cards Grid -->
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 pt-1">
            ${sixSteps.map((stepText, idx) => {
              const parts = stepText.split(":");
              const stepTitle = parts[0] || `Step ${idx + 1}`;
              const stepDesc = parts.slice(1).join(":");
              return `
                <div class="p-2.5 bg-[#FFFFFF] border border-[#D5CEBF] space-y-1">
                  <div class="flex items-center justify-between text-[10px]">
                    <span class="font-bold text-[#144336] font-mono">${stepTitle}</span>
                    <span class="font-mono font-bold text-[#144336] text-[10px]">[OK]</span>
                  </div>
                  <p class="text-[11px] text-[#1C201D] leading-snug font-mono">${stepDesc}</p>
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
      let borderClass = s.severity === "CRITICAL" ? "border-[#E8BFB7] bg-[#FAF0EE]" : "border-[#D5CEBF] bg-[#FFFFFF]";
      let badgeTag = s.severity === "CRITICAL" ? "stamp-tag stamp-critical" : "stamp-tag stamp-neutral";
      
      renderedCards.push(`
        <div class="p-3 border ${borderClass} flex flex-col justify-between space-y-2">
          <div>
            <div class="flex items-center justify-between text-[10px]">
              <div class="flex items-center space-x-1.5">
                <span class="font-bold font-mono text-[#1C201D]">[${s.system}]</span>
              </div>
              <span class="font-mono text-[#707A72]">${s.timestamp}</span>
            </div>
            
            <div class="mt-1.5">
              <div class="text-xs font-bold font-mono text-[#1C201D]">${s.metric}</div>
              <div class="text-[10px] font-mono mt-0.5 space-x-1">
                <span class="text-[#707A72]">Baseline: ${s.baseline_value}</span>
                <span class="text-[#707A72]">→</span>
                <span class="font-bold ${s.severity === 'CRITICAL' ? 'text-[#8F2718]' : 'text-[#78450E]'}">${s.observed_value}</span>
              </div>
            </div>

            <p class="text-xs text-[#48524B] mt-1.5 leading-snug font-mono">${s.detail}</p>
          </div>

          <div class="flex items-center justify-between pt-2 border-t border-[#D5CEBF] text-[10px] font-mono">
            <span class="${badgeTag}">
              ${s.trend.replace('_', ' ')}
            </span>
            <span class="font-bold text-[#144336]">
              [SAP S/4HANA TELEMETRY]
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
      let borderClass = isVerified ? "border-[#BEDBCF] bg-[#FFFFFF]" : "border-[#D5CEBF] bg-[#FAF9F5]";
      
      renderedCards.push(`
        <div class="p-3 border ${borderClass} flex flex-col justify-between space-y-2">
          <div>
            <div class="flex items-center justify-between text-[10px]">
              <div class="flex items-center space-x-1.5 font-mono">
                <span class="font-bold text-[#1C201D]">[${s.source.toUpperCase()}]</span>
              </div>
              <span class="font-mono text-[#707A72]">${s.timestamp}</span>
            </div>
            <p class="text-xs text-[#1C201D] mt-1.5 leading-snug font-mono">${s.content}</p>
          </div>

          <div class="flex items-center justify-between pt-2 border-t border-[#D5CEBF] text-[10px] font-mono">
            <span class="${s.reliability_score >= 0.9 ? 'text-[#144336] font-bold' : 'text-[#78450E]'}">
              CONFIDENCE: ${(s.reliability_score * 100).toFixed(0)}%
            </span>
            <span class="font-bold ${isVerified ? 'text-[#144336]' : 'text-[#78450E]'}">
              ${isVerified ? '[VERIFIED SIGNAL]' : '[UNVERIFIED RUMOR]'}
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
    <div class="flex items-start space-x-2 bg-white p-2 rounded-none border border-[#D8D5CD]">
      <span class="font-mono text-xs font-bold text-[#144336]">[AUTO]</span>
      <div class="flex-1 text-xs">
        <span class="font-bold text-[#1C201D]">${a.action}:</span> <span class="text-[#2C332D]">${a.detail}</span>
      </div>
      <span class="stamp-tag stamp-operational">${a.status}</span>
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
          completedText.innerText = "[VERIFIED DISPATCH] Action APPROVED by human supervisor: $95,000 emergency air charter executed.";
          completedBanner.className = "p-3 rounded-none bg-[#E8F1EC] border border-[#144336] text-xs font-medium text-[#144336] flex items-center justify-between";
        } else if (ha.status === "block") {
          completedText.innerText = "[ORDER BLOCKED] Action BLOCKED by human supervisor: Expenditure rejected. Baseline downtime recorded.";
          completedBanner.className = "p-3 rounded-none bg-[#FAF0EE] border border-[#8F2718] text-xs font-medium text-[#8F2718] flex items-center justify-between";
        } else {
          completedText.innerText = "[TELEMETRY SWEEP] Telemetry & radar sweeps requested. Verification package assembled.";
          completedBanner.className = "p-3 rounded-none bg-[#FDF7EB] border border-[#78450E] text-xs font-medium text-[#78450E] flex items-center justify-between";
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
    let badgeClass = "stamp-tag";
    if (t.type === "warning") badgeClass = "stamp-tag stamp-disrupted";
    else if (t.type === "danger") badgeClass = "stamp-tag stamp-critical";
    else if (t.type === "success") badgeClass = "stamp-tag stamp-operational";

    return `
      <div class="p-2.5 rounded-none bg-white border border-[#D8D5CD] space-y-1">
        <div class="flex items-center justify-between text-[11px]">
          <div class="flex items-center space-x-2">
            <span class="font-mono text-[#5A645C] text-[10px]">${t.timestamp}</span>
            <span class="font-bold text-[#1C201D] tracking-wide">${t.agent}</span>
          </div>
          <span class="${badgeClass}">
            ${t.action}
          </span>
        </div>
        <p class="text-xs text-[#2C332D] leading-relaxed font-sans">${t.thought}</p>
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
      badge.innerText = "NOMINAL MONITORING ACTIVE";
      badge.className = "stamp-tag stamp-operational";
    }
    container.innerHTML = `
      <div class="p-3.5 bg-white border border-[#D8D5CD] text-xs text-[#1C201D] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div class="font-bold flex items-center space-x-2">
            <span class="w-1.5 h-1.5 bg-[#144336]"></span>
            <span class="font-serif text-sm">Baseline Nominal Monitoring Active</span>
          </div>
          <div class="text-[11px] text-[#5A645C] mt-1 font-sans">
            All 8 global supply corridors are operating within safe baseline tolerances. Detroit plant buffer healthy at 18.5 days. Zero active disruption warnings.
          </div>
        </div>
        <div class="flex items-center space-x-2 flex-shrink-0">
          <a href="injector.html" target="_blank" class="btn-craft-primary text-xs uppercase tracking-wider">
            [ Injector Workbench ↗ ]
          </a>
        </div>
      </div>
    `;
    return;
  }

  if (actions.length === 0) {
    if (badge) {
      badge.innerText = "PIPELINE SYNTHESIS IN PROGRESS";
      badge.className = "stamp-tag";
    }
    container.innerHTML = `
      <div class="p-3 bg-white border border-[#D8D5CD] text-xs text-[#5A645C]">
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
      badge.innerText = "ENGINE: GOOGLE GEMINI 2.5 FLASH";
      badge.className = "stamp-tag stamp-operational";
    } else {
      badge.innerText = "ENGINE: DETERMINISTIC STATUTORY AUDIT";
      badge.className = "stamp-tag";
    }
  }

  // 1. Render alternative selection tabs
  const tabsHtml = `
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 pb-1">
      ${actions.map((act, idx) => {
        const isSelected = idx === selectedAlternativeIndex;
        const isRec = act.is_recommended;
        let borderClass = isSelected ? "border-[#144336] bg-[#FFFFFF] ring-1 ring-[#144336]" : "border-[#D8D5CD] bg-[#F7F5F0] hover:bg-white";
        return `
          <button onclick="selectAlternative(${idx})" class="p-3 border ${borderClass} text-left transition-all cursor-pointer flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between">
                <span class="text-[10px] font-mono font-bold ${isRec ? 'text-[#144336]' : 'text-[#5A645C]'}">
                  ${isRec ? '[RECOMMENDED OPTION]' : `[OPTION 0${idx + 1}]`}
                </span>
                <span class="text-[11px] font-mono font-bold text-[#1C201D]">
                  $${act.cost_usd.toLocaleString()}
                </span>
              </div>
              <div class="text-xs font-bold text-[#1C201D] mt-1.5 leading-snug line-clamp-2">
                ${act.title}
              </div>
            </div>
            <div class="flex items-center justify-between text-[10px] text-[#5A645C] mt-2 pt-1.5 border-t border-[#D8D5CD] font-mono">
              <span>Transit: ${act.execution_lead_time_days}d</span>
              <span class="${act.net_financial_benefit_usd > 0 ? 'text-[#144336] font-bold' : 'text-[#8F2718]'}">
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
    <li class="flex items-start space-x-2">
      <span class="text-[#144336] font-mono font-bold text-xs">[+]</span>
      <span class="text-[#2C332D]">${p}</span>
    </li>
  `).join("");

  const issuesList = (analysis.issues || []).map(iss => {
    let sevClass = "stamp-tag";
    if (iss.severity === "HIGH") sevClass = "stamp-tag stamp-disrupted";
    if (iss.severity === "CRITICAL") sevClass = "stamp-tag stamp-critical";
    if (iss.severity === "LOW") sevClass = "stamp-tag";

    return `
      <div class="p-3 bg-white border border-[#D8D5CD] space-y-2">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
          <div class="flex items-center space-x-2">
            <span class="${sevClass}">
              ${iss.severity} RISK
            </span>
            <span class="text-xs font-bold text-[#1C201D]">${iss.issue}</span>
          </div>
          <span class="text-[10px] font-mono text-[#5A645C]">${iss.statute || iss.category}</span>
        </div>
        <p class="text-xs text-[#2C332D] leading-relaxed font-sans">${iss.description}</p>
        <div class="p-2.5 bg-[#E8F1EC] border border-[#144336]/30 text-xs text-[#144336] space-y-0.5">
          <div class="font-bold text-[10px] uppercase font-mono tracking-wider text-[#144336] flex items-center space-x-1">
            <span>[ COMPLIANCE & OPERATIONAL MITIGATION ]</span>
          </div>
          <div class="text-[11px] leading-relaxed text-[#1C201D] font-sans mt-0.5">${iss.mitigation}</div>
        </div>
      </div>
    `;
  }).join("");

  const barriersList = (analysis.immutable_statutory_barriers || []).map(b => `
    <div class="p-3 bg-[#FAF0EE] border border-[#8F2718] text-xs text-[#8F2718] font-bold flex items-start space-x-2">
      <span class="font-mono text-xs uppercase text-[#8F2718]">[EMBARGO]</span>
      <div class="flex-1">
        <span class="font-mono uppercase text-[10px] text-[#8F2718] tracking-wider">IMMUTABLE STATUTORY BARRIER:</span>
        <div class="text-[11px] font-normal text-[#1C201D] mt-0.5 font-sans">${b}</div>
      </div>
    </div>
  `).join("");

  const noBarrierNotice = (!analysis.immutable_barrier_detected && (!analysis.immutable_statutory_barriers || analysis.immutable_statutory_barriers.length === 0))
    ? `<div class="p-2.5 bg-[#E8F1EC] border border-[#144336] text-xs text-[#144336] flex items-center space-x-2 font-mono">
        <span class="font-bold">[CLEARED]</span>
        <span class="text-[11px] font-sans text-[#1C201D]"><strong>No immutable statutory barriers detected:</strong> Path is legally permissible under international trade conventions with active mitigations.</span>
       </div>`
    : "";

  container.innerHTML = `
    ${tabsHtml}
    
    <div class="p-3.5 bg-[#F7F5F0] border border-[#D8D5CD] space-y-3">
      
      <!-- Engine Source Banner -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-2 border-b border-[#D8D5CD] gap-2">
        <div>
          <span class="text-xs font-bold text-[#1C201D] font-serif text-sm">Alternative Detailed Analysis: ${activeAction.title}</span>
          <div class="text-[10px] text-[#5A645C] font-mono mt-0.5">Evaluates regulatory export compliance, carrier operations, and country cabotage statutes.</div>
        </div>
        <div class="flex items-center space-x-1.5">
          <span class="text-[9px] font-mono text-[#5A645C]">AUDIT PROTOCOL:</span>
          ${isGemini ? `
            <span class="stamp-tag stamp-operational">
              GOOGLE GEMINI 2.5 FLASH
            </span>
          ` : `
            <span class="stamp-tag" title="Deterministic compliance rules applied">
              STATUTORY COMPLIANCE ENGINE
            </span>
          `}
        </div>
      </div>

      <!-- Positive Factors -->
      <div class="space-y-1 text-xs text-[#1C201D]">
        <div class="text-[10px] font-mono font-bold text-[#5A645C] uppercase tracking-wider">Positive Decision Drivers (Operational Justification):</div>
        <ul class="space-y-1 text-xs mt-1">
          ${positiveList}
        </ul>
      </div>

      <!-- Issues that occur in this alternative -->
      <div class="space-y-2 pt-2 border-t border-[#D8D5CD]">
        <div class="text-[10px] font-mono font-bold text-[#5A645C] uppercase tracking-wider flex items-center justify-between">
          <span>Identified Compliance Exposures (${(analysis.issues || []).length}):</span>
          <span class="text-[9px] text-[#5A645C]">Regulatory · Operational · Country Policy</span>
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
        <div class="p-2.5 bg-white border border-[#D8D5CD] text-[11px] font-mono text-[#1C201D]">
          <strong class="text-[#144336]">[LEGAL & REGULATORY VERDICT]</strong> ${analysis.legal_verdict}
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
      color: '#144336',
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
      color: '#8F2718',
      fillColor: '#8F2718',
      fillOpacity: 0.3,
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
      color: '#144336',
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
      tabEl.className = "data-sub-tab px-4 py-2 text-xs font-mono font-bold border-b-2 border-[#144336] text-[#144336] bg-white cursor-pointer";
    } else {
      tabEl.className = "data-sub-tab px-4 py-2 text-xs font-mono font-medium text-[#5A645C] hover:text-[#1C201D] border-b-2 border-transparent cursor-pointer";
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
        <tr class="hover:bg-[#F7F5F0] border-b border-[#D8D5CD]">
          <td class="py-2.5 px-4 font-mono font-bold text-xs text-[#1C201D]">${inc.incident_id}</td>
          <td class="py-2.5 px-4 text-xs text-[#1C201D] font-medium font-serif text-sm">${inc.title}</td>
          <td class="py-2.5 px-4 text-[11px] font-mono text-[#5A645C]">${inc.category}</td>
          <td class="py-2.5 px-4">
            <span class="stamp-tag ${isApproved ? 'stamp-operational' : 'stamp-critical'}">
              ${dec.outcome || (isApproved ? 'APPROVED' : 'BLOCKED')}
            </span>
          </td>
          <td class="py-2.5 px-4 font-mono font-bold text-xs ${savings > 0 ? 'text-[#144336]' : 'text-[#5A645C]'}">
            ${savings > 0 ? `+$${savings.toLocaleString()}` : '$0'}
          </td>
          <td class="py-2.5 px-4 text-[11px] font-mono text-[#5A645C]">
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
        <div onclick="selectPolicyFromList('${p.policy_id}')" class="p-2.5 border border-[#D8D5CD] hover:border-[#144336] hover:bg-[#F7F5F0] text-left transition-all cursor-pointer">
          <div class="flex items-center justify-between text-[10px]">
            <span class="font-mono font-bold text-[#1C201D]">${p.policy_id}</span>
            <span class="stamp-tag ${p.status === 'ACTIVE_ENFORCED' ? 'stamp-operational' : 'stamp-disrupted'}">${p.status}</span>
          </div>
          <div class="font-bold text-xs text-[#1C201D] mt-1 leading-snug truncate font-serif text-sm">${p.title}</div>
          <div class="text-[10px] text-[#5A645C] font-mono mt-0.5">${p.regulatory_framework ? p.regulatory_framework.slice(0, 35) + '...' : ''}</div>
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
  if (btn) btn.innerHTML = `<span>[ SYNTHESIZING POLICY PROTOCOL... ]</span>`;

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
    if (btn) btn.innerHTML = `<span>[ GENERATE POLICY FOR CURRENT ISSUE ]</span>`;
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
      ? "stamp-tag stamp-operational"
      : "stamp-tag stamp-disrupted";
  }
  if (catEl) catEl.innerText = (policy.category || "RESILIENCE").replace(/_/g, " ");
  if (titleEl) titleEl.innerText = policy.title || "Enterprise Resilience Policy";
  if (fwEl) fwEl.innerText = policy.regulatory_framework || "ISO 22301";
  if (dateEl) dateEl.innerText = policy.effective_date || "2026-01-15";
  if (scopeEl) scopeEl.innerText = policy.scope || "Global Enterprise Logistics Network";

  if (triggersEl) {
    const trigs = policy.quantitative_triggers || [];
    triggersEl.innerHTML = trigs.map(t => `
      <div class="p-2 bg-[#FDF7EB] border border-[#78450E]/30 text-[#78450E] flex items-start space-x-2">
        <span class="font-mono font-bold text-xs mt-0.5">[TRIGGER]</span>
        <span class="text-xs text-[#1C201D] font-sans">${t}</span>
      </div>
    `).join("");
  }

  if (rulesEl) {
    const rules = policy.mandatory_enforcement_rules || [];
    rulesEl.innerHTML = rules.map(r => `
      <div class="p-2 bg-[#E8F1EC] border border-[#144336]/30 text-[#144336] flex items-start space-x-2">
        <span class="font-mono font-bold text-xs mt-0.5">[MANDATE]</span>
        <span class="text-xs text-[#1C201D] font-sans">${r}</span>
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
      activateBtn.innerHTML = `<span>[ POLICY ACTIVE & ENFORCED ]</span>`;
      activateBtn.className = "btn-craft-secondary text-xs opacity-75 cursor-not-allowed";
      activateBtn.disabled = true;
    } else {
      activateBtn.innerHTML = `<span>[ ACTIVATE POLICY PROTOCOL ]</span>`;
      activateBtn.className = "btn-craft-primary text-xs";
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
    container.innerHTML = `<div class="col-span-full p-4 text-center text-xs text-[#5A645C]">No qualified candidate suppliers found.</div>`;
    return;
  }

  container.innerHTML = currentExchangeCandidates.map(c => {
    const isSelected = c.supplier_id === selectedExchangeSupplierId;
    const borderClass = isSelected ? "border-[#144336] bg-[#E8F1EC] ring-1 ring-[#144336]" : "border-[#D8D5CD] bg-white hover:border-[#144336]";
    const countryCode = c.country === "Japan" ? "JP" : c.country === "Germany" ? "DE" : c.country === "USA" ? "US" : c.country === "Mexico" ? "MX" : "KR";

    return `
      <div onclick="selectExchangeCandidate('${c.supplier_id}')" class="p-3 border ${borderClass} transition-all cursor-pointer flex flex-col justify-between space-y-2">
        <div>
          <div class="flex items-center justify-between">
            <span class="font-mono text-xs font-bold text-[#1C201D]">[${countryCode}] ${c.country.toUpperCase()}</span>
            <span class="stamp-tag ${isSelected ? 'stamp-operational' : ''}">
              ${c.supplier_id}
            </span>
          </div>
          <div class="font-serif font-bold text-sm text-[#1C201D] mt-1.5 leading-snug line-clamp-2">${c.name}</div>
          <div class="text-[10px] text-[#5A645C] font-mono mt-0.5">${c.city}</div>
        </div>

        <div class="pt-2 border-t border-[#D8D5CD] space-y-1 text-[10px] font-mono">
          <div class="flex items-center justify-between">
            <span class="text-[#5A645C]">Transit Lead:</span>
            <span class="font-bold text-[#1C201D]">${c.standard_lead_time_days} days</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-[#5A645C]">Buffer Cap:</span>
            <span class="font-bold text-[#144336]">${c.available_capacity_pct}% avail</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-[#5A645C]">Unit Cost:</span>
            <span class="font-bold text-[#1C201D]">$${c.unit_cost_usd.toFixed(2)}</span>
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
      ? "stamp-tag stamp-operational"
      : "stamp-tag stamp-disrupted";
  }

  if (scorePill) {
    scorePill.className = "stamp-tag";
    scorePill.innerText = `Score: ${feas.feasibility_score_pct || 94} / 100`;
  }

  if (leadTimeEl) leadTimeEl.innerText = `${feas.transition_lead_time_days || target.transit_lead_time_days || 3.8} Days`;
  if (leadTimeSub) leadTimeSub.innerText = `Direct routing from ${target.country || 'Partner Hub'}`;

  if (bufferMarginEl) {
    const margin = feas.stockout_safety_margin_days || 1.4;
    bufferMarginEl.innerText = margin >= 0 ? `+${margin} Days` : `${margin} Days`;
    bufferMarginEl.className = margin >= 0 ? "text-lg font-bold text-[#144336] mt-0.5 font-mono" : "text-lg font-bold text-[#8F2718] mt-0.5 font-mono";
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
      ? `[SAFETY BUFFER MAINTAINED] ${feas.stockout_safety_margin_days}d safety buffer before Detroit assembly line shutdown`
      : `[CUSTOMS FAST-TRACK REQUIRED] Margin narrow: requires priority customs clearance`;
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
      <div class="p-2 bg-white border border-[#D8D5CD] text-xs text-[#1C201D] flex items-start space-x-2">
        <span class="font-mono text-xs text-[#144336] font-bold mt-0.5">[PERMIT]</span>
        <span class="font-mono text-[11px] leading-tight text-[#1C201D]">${d}</span>
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
      <div class="p-2.5 bg-white border border-[#D8D5CD] text-xs flex items-start space-x-2.5">
        <span class="font-mono font-bold text-xs text-[#144336] shrink-0 mt-0.5">
          [0${idx + 1}]
        </span>
        <span class="text-[#1C201D] text-[11px] leading-relaxed font-sans">${s}</span>
      </div>
    `).join("");
  }

  // Reset Execute Button state
  const execBtn = document.getElementById("btn-execute-exchange");
  if (execBtn) {
    execBtn.disabled = false;
    execBtn.className = "btn-craft-primary w-full text-xs font-mono uppercase tracking-wider justify-center";
    execBtn.innerHTML = `
      <span>[ AUTHORIZE & STAGE SAP BAPI PURCHASE ORDER ]</span>
    `;
  }
}

async function commitSupplyExchange() {
  if (!activeExchangeEvaluation) return;

  const execBtn = document.getElementById("btn-execute-exchange");
  if (execBtn) {
    execBtn.disabled = true;
    execBtn.innerHTML = `
      <span>[ TRANSMITTING SAP BAPI PROTOCOL... ]</span>
    `;
  }

  try {
    const payload = {
      exchange_id: activeExchangeEvaluation.exchange_id,
      supervisor_notes: "Authorized by Chief Operations Officer via Legal Bridge"
    };

    const receipt = await API.executeSupplyExchange(payload);
    
    if (execBtn) {
      execBtn.className = "btn-craft-secondary w-full text-xs font-mono uppercase tracking-wider justify-center";
      execBtn.innerHTML = `<span>[ STAGED VIA SAP BAPI: ${receipt.sap_po_number || 'PO-SAP-748921'} ]</span>`;
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
