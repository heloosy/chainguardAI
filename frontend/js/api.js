/**
 * ChainGuard AI - API Client with Warning Dispatch & SAP ERP Features
 */
const API_BASE = window.location.origin.includes("localhost") || window.location.origin.includes("127.0.0.1") 
  ? "" 
  : "http://127.0.0.1:8000";

const API = {
  async getPredictions() {
    const res = await fetch(`${API_BASE}/api/predictions`);
    return res.json();
  },

  async predictSingle(data) {
    const res = await fetch(`${API_BASE}/api/predict/single`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async getConsequences() {
    const res = await fetch(`${API_BASE}/api/consequences`);
    return res.json();
  },

  async getGraph() {
    const res = await fetch(`${API_BASE}/api/graph`);
    return res.json();
  },

  async getRecommendations() {
    const res = await fetch(`${API_BASE}/api/recommendations`);
    return res.json();
  },

  async simulateWhatIf(scenario) {
    const res = await fetch(`${API_BASE}/api/what-if/simulate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(scenario)
    });
    return res.json();
  },

  async getValidationMetrics() {
    const res = await fetch(`${API_BASE}/api/validation/metrics`);
    return res.json();
  },

  async getForecastStore(limit = 50) {
    const res = await fetch(`${API_BASE}/api/validation/forecasts?limit=${limit}`);
    return res.json();
  },

  async triggerRetraining() {
    const res = await fetch(`${API_BASE}/api/validation/retrain`, {
      method: "POST"
    });
    return res.json();
  },

  async reconcileForecast(forecastId, actualLt, isDelayed) {
    const res = await fetch(`${API_BASE}/api/validation/reconcile`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        forecast_id: forecastId,
        actual_lead_time_days: actualLt,
        actual_is_delayed: isDelayed
      })
    });
    return res.json();
  },

  async getTable(tableName) {
    const res = await fetch(`${API_BASE}/api/data/table/${tableName}`);
    return res.json();
  },

  async ingestData(tableName, payload, format = "csv", mode = "append") {
    const res = await fetch(`${API_BASE}/api/data/ingest`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        table_name: tableName,
        payload: payload,
        format: format,
        mode: mode
      })
    });
    return res.json();
  },

  async resetBenchmark() {
    const res = await fetch(`${API_BASE}/api/data/reset`, {
      method: "POST"
    });
    return res.json();
  },

  // ==========================================
  // WARNING DISPATCH & INGESTION
  // ==========================================
  async sendWarning(warningData) {
    const res = await fetch(`${API_BASE}/api/warnings/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(warningData)
    });
    return res.json();
  },

  async getActiveWarnings() {
    const res = await fetch(`${API_BASE}/api/warnings/active`);
    return res.json();
  },

  async clearWarnings() {
    const res = await fetch(`${API_BASE}/api/warnings/clear`, {
      method: "POST"
    });
    return res.json();
  },

  // ==========================================
  // SAP TECHNOLOGIES & ERP INTEGRATION
  // ==========================================
  async getSapMD04(materialId = "CMP-MCU-01") {
    const res = await fetch(`${API_BASE}/api/sap/odata/v4/MD04/${materialId}`);
    return res.json();
  },

  async getSapMaterialStockList() {
    const res = await fetch(`${API_BASE}/api/sap/odata/v4/MaterialStockList`);
    return res.json();
  },

  async getSapGTTEvents() {
    const res = await fetch(`${API_BASE}/api/sap/odata/v4/GTTEvents`);
    return res.json();
  },

  async postSapGTTEvent(eventData) {
    const res = await fetch(`${API_BASE}/api/sap/odata/v4/GTTEvents`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(eventData)
    });
    return res.json();
  },

  async executeSapBapiPO(poData) {
    const res = await fetch(`${API_BASE}/api/sap/bapi/BAPI_PO_CREATE1`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(poData)
    });
    return res.json();
  },

  async getSapIDoc(idocType = "ORDERS05", material = "CMP-MCU-01", qty = 1200) {
    const res = await fetch(`${API_BASE}/api/sap/idoc/${idocType}?material=${material}&qty=${qty}`);
    return res.json();
  },

  // ==========================================
  // MULTI-SOURCE INTELLIGENCE & TRADE COMPLIANCE
  // ==========================================
  async getSourceSignals(limit = 50) {
    const res = await fetch(`${API_BASE}/api/sources/signals?limit=${limit}`);
    return res.json();
  },

  async simulateSourceAlert(alertData) {
    const res = await fetch(`${API_BASE}/api/sources/simulate-alert`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(alertData)
    });
    return res.json();
  },

  async evaluateCompliance(componentId = "CMP-MCU-01", originalPath = null, alternativePath = null) {
    const res = await fetch(`${API_BASE}/api/compliance/evaluate-alternative`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        component_id: componentId,
        original_path: originalPath,
        alternative_path: alternativePath
      })
    });
    return res.json();
  },

  async getCurrentStages(chainId = "SC-EV-MOTOR-SYS-01") {
    const res = await fetch(`${API_BASE}/api/stages/current?chain_id=${chainId}`);
    return res.json();
  },

  async advanceStage(chainId = "SC-EV-MOTOR-SYS-01", stageIndex = 2, feedback = "") {
    const res = await fetch(`${API_BASE}/api/stages/advance`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chain_id: chainId,
        stage_index: stageIndex,
        custom_feedback: feedback
      })
    });
    return res.json();
  },

  async learnFromOutcome(payload) {
    const res = await fetch(`${API_BASE}/api/learning/learn-from-outcome`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  // ==========================================
  // STAGE 1: DATA SETUP & VALIDATION
  // ==========================================
  async getBenchmarkValidation() {
    const res = await fetch(`${API_BASE}/api/setup/benchmark-validation`);
    return res.json();
  },

  async validateDataset() {
    const res = await fetch(`${API_BASE}/api/setup/validate`, { method: "POST" });
    return res.json();
  },

  // ==========================================
  // STAGE 2-5 & 15: SIMULATION CONTROL ROOM
  // ==========================================
  async getSimulationCatalog() {
    const res = await fetch(`${API_BASE}/api/simulation/catalog`);
    return res.json();
  },

  async getSimulationState() {
    const res = await fetch(`${API_BASE}/api/simulation/state`);
    return res.json();
  },

  async startSimulation() {
    const res = await fetch(`${API_BASE}/api/simulation/start`, { method: "POST" });
    return res.json();
  },

  async pauseSimulation() {
    const res = await fetch(`${API_BASE}/api/simulation/pause`, { method: "POST" });
    return res.json();
  },

  async resumeSimulation() {
    const res = await fetch(`${API_BASE}/api/simulation/resume`, { method: "POST" });
    return res.json();
  },

  async stepSimulation() {
    const res = await fetch(`${API_BASE}/api/simulation/step`, { method: "POST" });
    return res.json();
  },

  async resetSimulation() {
    const res = await fetch(`${API_BASE}/api/simulation/reset`, { method: "POST" });
    return res.json();
  },

  async setSimulationScenario(scenarioId) {
    const res = await fetch(`${API_BASE}/api/simulation/scenario`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scenario_id: scenarioId })
    });
    return res.json();
  },

  async setSimulationSpeed(multiplier) {
    const res = await fetch(`${API_BASE}/api/simulation/speed`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ speed_multiplier: multiplier })
    });
    return res.json();
  },

  // ==========================================
  // STAGE 6: EXPOSURE MAPPING
  // ==========================================
  async getCurrentExposure() {
    const res = await fetch(`${API_BASE}/api/exposure/current`);
    return res.json();
  },

  // ==========================================
  // STAGE 11 & 12: DECISION GATE & EXECUTION
  // ==========================================
  async evaluateDecisionGate(payload) {
    const res = await fetch(`${API_BASE}/api/decision-gate/evaluate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  async approveDecisionGate(actionId, approverName, approverRole = "Supply Chain Operations Director", notes = "") {
    const res = await fetch(`${API_BASE}/api/decision-gate/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action_id: actionId,
        approver_name: approverName,
        approver_role: approverRole,
        notes: notes
      })
    });
    return res.json();
  },

  async provideDecisionEvidence(actionId, evidenceKey, evidenceValue) {
    const res = await fetch(`${API_BASE}/api/decision-gate/provide-evidence`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action_id: actionId,
        evidence_key: evidenceKey,
        evidence_value: evidenceValue
      })
    });
    return res.json();
  },

  async executeDecisionAction(actionId, executionMode = "simulated", sapConnected = false) {
    const res = await fetch(`${API_BASE}/api/decision-gate/execute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action_id: actionId,
        execution_mode: executionMode,
        sap_connected: sapConnected
      })
    });
    return res.json();
  },

  // ==========================================
  // STAGE 13: INCIDENT HISTORY & SIMILAR CASES
  // ==========================================
  async getIncidentHistory(limit = 50) {
    const res = await fetch(`${API_BASE}/api/incidents/history?limit=${limit}`);
    return res.json();
  },

  async getIncidentDetail(incidentId) {
    const res = await fetch(`${API_BASE}/api/incidents/${incidentId}`);
    return res.json();
  },

  async searchSimilarIncidents(query, limit = 5) {
    const res = await fetch(`${API_BASE}/api/incidents/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, limit })
    });
    return res.json();
  },

  // ==========================================
  // STREAMLINED AGENT WORKFLOW PIPELINE
  // ==========================================
  async getWorkflowState() {
    const res = await fetch(`${API_BASE}/api/workflow/state`);
    return res.json();
  },

  async runWorkflowPipeline() {
    const res = await fetch(`${API_BASE}/api/workflow/run`, {
      method: "POST"
    });
    return res.json();
  },

  async stepWorkflowPipeline() {
    const res = await fetch(`${API_BASE}/api/workflow/step`, {
      method: "POST"
    });
    return res.json();
  },

  async submitWorkflowDecision(decision, notes = "") {
    const res = await fetch(`${API_BASE}/api/workflow/decision`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision, notes })
    });
    return res.json();
  },

  async resetWorkflowPipeline(scenario_id = "CYCLONE_CHENNAI") {
    const res = await fetch(`${API_BASE}/api/workflow/reset`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scenario_id })
    });
    return res.json();
  },

  async getTableData(tableName, limit = 100) {
    const res = await fetch(`${API_BASE}/api/data/table/${tableName}?limit=${limit}`);
    return res.json();
  },

  async injectDisruptionSignal(payload) {
    const res = await fetch(`${API_BASE}/api/workflow/inject`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  async generatePolicy(params) {
    const res = await fetch(`${API_BASE}/api/policy/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params)
    });
    return res.json();
  },

  async activatePolicy(policy) {
    const res = await fetch(`${API_BASE}/api/policy/activate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(policy)
    });
    return res.json();
  },

  async getPolicyList() {
    const res = await fetch(`${API_BASE}/api/policy/list`);
    return res.json();
  },

  async getPolicyExport(policyId) {
    const res = await fetch(`${API_BASE}/api/policy/${policyId}/export`);
    return res.json();
  },

  async dispatchSMSNotification(params) {
    const res = await fetch(`${API_BASE}/api/notifications/dispatch`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params)
    });
    return res.json();
  },

  async getNotificationHistory() {
    const res = await fetch(`${API_BASE}/api/notifications/history`);
    return res.json();
  },

  async getExchangeCandidates(componentId = "CMP-MCU-01", currentSupplierId = "SUP-001") {
    const res = await fetch(`${API_BASE}/api/supply-exchange/candidates?component_id=${componentId}&current_supplier_id=${currentSupplierId}`);
    return res.json();
  },

  async evaluateSupplyExchange(params) {
    const res = await fetch(`${API_BASE}/api/supply-exchange/evaluate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params)
    });
    return res.json();
  },

  async executeSupplyExchange(params) {
    const res = await fetch(`${API_BASE}/api/supply-exchange/execute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params)
    });
    return res.json();
  },

  async generateExchangePolicy(exchangeRecord) {
    const res = await fetch(`${API_BASE}/api/supply-exchange/generate-policy`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ exchange_record: exchangeRecord })
    });
    return res.json();
  },

  async getExchangeHistory() {
    const res = await fetch(`${API_BASE}/api/supply-exchange/history`);
    return res.json();
  }
};
