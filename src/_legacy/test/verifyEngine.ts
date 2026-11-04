import { RiskDetectionEngine } from '../services/detection/riskEngine.ts';
import { ConsequenceSimulationEngine } from '../services/simulation/consequenceSimulator.ts';
import { DecisionValidationEngine } from '../services/validation/decisionValidator.ts';
import { HistoricalMemoryService } from '../services/history/historicalMemoryService.ts';
import { ExternalConnectorService } from '../services/connectors/connectorService.ts';
import { MockSAPDataProvider } from '../services/sap/MockSAPDataProvider.ts';
import { 
  INITIAL_SUPPLIERS, 
  INITIAL_COMPONENTS, 
  INITIAL_FACTORIES, 
  INITIAL_CUSTOMER_ORDERS, 
  INITIAL_PURCHASE_ORDERS,
  INITIAL_DISRUPTION_EVENTS 
} from '../data/seedData.ts';

async function runVerification() {
  console.log('=== CHAINGUARD AI RESILIENCE PLATFORM VERIFICATION ===\n');
  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, msg: string) {
    totalTests++;
    if (condition) {
      console.log(`[PASS] ${msg}`);
      passedTests++;
    } else {
      console.error(`[FAIL] ${msg}`);
      process.exitCode = 1;
    }
  }

  // 1. TEST AGENT ONE: RISK DETECTION
  console.log('--- 1. Testing Agent One: Early Warning Intelligence ---');
  const riskEngine = new RiskDetectionEngine();
  const alerts = riskEngine.evaluateRisks({
    suppliers: INITIAL_SUPPLIERS,
    components: INITIAL_COMPONENTS,
    factories: INITIAL_FACTORIES,
    orders: INITIAL_CUSTOMER_ORDERS,
    disruptions: INITIAL_DISRUPTION_EVENTS,
    purchaseOrders: INITIAL_PURCHASE_ORDERS,
  });

  assert(alerts.length >= 2, `Detected ${alerts.length} risk alerts (expected >= 2)`);
  const critAlert = alerts.find(a => a.severity === 'CRITICAL');
  assert(Boolean(critAlert), 'Critical line shortage alert detected');
  assert(critAlert?.affectedFactoryIds.includes('FAC-A') ?? false, 'Austin Gigafactory identified as affected facility');
  assert(critAlert?.affectedFactoryIds.includes('FAC-B') ?? false, 'Munich Plant identified as interconnected facility sharing component');
  assert(critAlert?.daysUntilImpact === 0.8, 'Days until stockout calculated accurately at 0.8 days (~19 hours)');
  assert(critAlert?.confidenceScore === 98, 'High confidence score (98%) assigned based on verified telemetry');
  assert(critAlert?.isConfirmedDisruption === true, 'Confirmed disruption distinguished from rumors without bill of lading');

  const complianceAlert = alerts.find(a => a.category === 'COMPLIANCE_GAP');
  assert(Boolean(complianceAlert), 'Supplier Y unverified audit compliance alert detected');

  // 2. TEST AGENT TWO: CONSEQUENCE SIMULATION
  console.log('\n--- 2. Testing Agent Two: Consequence Simulation & Secondary Shortage Engine ---');
  const simEngine = new ConsequenceSimulationEngine();
  const responses = simEngine.generateCandidateResponses({
    suppliers: INITIAL_SUPPLIERS,
    components: INITIAL_COMPONENTS,
    factories: INITIAL_FACTORIES,
    orders: INITIAL_CUSTOMER_ORDERS,
    disruptions: INITIAL_DISRUPTION_EVENTS,
    purchaseOrders: INITIAL_PURCHASE_ORDERS,
  });

  assert(responses.length >= 4, `Generated ${responses.length} candidate responses (expected >= 4)`);

  const baseline = responses.find(r => r.actionType === 'DO_NOTHING');
  assert(baseline?.customerDeliveryDelayDays === 16, 'Baseline inaction results in 16 days customer delay');
  assert(baseline?.netBenefit === -3310000, 'Baseline financial loss calculated at -$3.31M');
  assert(baseline?.unmetDemandQuantity === 180, 'Baseline unmet demand identified (180 units)');

  const transferAction = responses.find(r => r.actionType === 'INVENTORY_TRANSFER');
  assert(Boolean(transferAction), 'Aggressive 450-unit Inventory Transfer candidate generated');
  assert(transferAction?.secondaryShortage.detected === true, 'MANDATORY CRITERIA: Secondary Shortage DETECTED on transfer proposal');
  assert(transferAction?.secondaryShortage.facilityId === 'FAC-B', 'Secondary shortage accurately assigned to Factory B (Munich)');
  assert(
    transferAction?.secondaryShortage.daysUntilStockout === 2.2, 
    'Time to secondary stockout mathematically computed at 2.2 days'
  );
  assert(transferAction?.isFeasible === false, 'Action with secondary shortage rejected as infeasible');

  const hybridAction = responses.find(r => r.actionType === 'BALANCED_HYBRID');
  assert(Boolean(hybridAction), 'ChainGuard Balanced Resilience Strategy generated');
  assert(hybridAction?.secondaryShortage.detected === false, 'Zero secondary shortages in balanced strategy');
  assert(hybridAction?.recoveryTimeDays === 0, 'Zero downtime recovery in balanced strategy');
  assert(hybridAction?.unmetDemandQuantity === 0, 'Zero unmet demand achieved');
  assert(hybridAction?.netBenefit === 3241500, 'Net financial benefit calculated at +$3,241,500');
  assert(hybridAction?.rankingRank === 1, 'Balanced Hybrid ranked #1 optimal strategy');
  assert(Boolean(hybridAction?.rankingReason), 'Transparent ranking reason provided');

  // Verify estimates vs verified cost breakdown
  const hasEstimatesLabeled = hybridAction?.costBreakdown.some(c => c.isEstimate) && hybridAction?.costBreakdown.some(c => !c.isEstimate);
  assert(Boolean(hasEstimatesLabeled), 'Cost breakdown clearly separates verified figures from operational estimates');

  // 3. TEST AGENT THREE: EVIDENCE & DECISION VALIDATION
  console.log('\n--- 3. Testing Agent Three: Evidence & Decision Validation Gatekeeper ---');
  const valEngine = new DecisionValidationEngine();

  // Test Transfer Action Validation (BLOCKED)
  const transferReport = valEngine.validateResponse(transferAction!, INITIAL_SUPPLIERS);
  assert(transferReport.outcome === 'BLOCKED', 'Decision Gate State 1: Transfer action with secondary shortage is BLOCKED');
  assert(transferReport.canBeExecuted === false, 'Blocked action cannot be executed');
  assert(Boolean(transferReport.decisionGateReason), 'Explicit decision gate reason provided');
  assert(Boolean(transferReport.nextRequiredAction), 'Next required action guide provided');
  const secRule = transferReport.rules.find(r => r.code === 'SEC-01');
  assert(secRule?.passed === false, 'Rule SEC-01 failed due to secondary stockout violation');

  // Test Supplier Switch Validation (EVIDENCE_REQUIRED)
  const supSwitchAction = responses.find(r => r.actionType === 'SUPPLIER_SWITCH');
  const supSwitchReport = valEngine.validateResponse(supSwitchAction!, INITIAL_SUPPLIERS);
  assert(supSwitchReport.outcome === 'EVIDENCE_REQUIRED', 'Decision Gate State 2: Supplier Y switch outcome is EVIDENCE_REQUIRED');
  assert(supSwitchReport.missingEvidenceList.length > 0, 'Missing evidence items identified for unverified supplier');

  // Test Balanced Hybrid Validation (APPROVAL_REQUIRED)
  const hybridReport = valEngine.validateResponse(hybridAction!, INITIAL_SUPPLIERS);
  assert(hybridReport.outcome === 'APPROVAL_REQUIRED', 'Decision Gate State 3: Balanced strategy outcome is APPROVAL_REQUIRED (spend > $50k)');
  assert(hybridReport.canBeExecuted === true, 'Balanced strategy can be executed after human sign-off');

  // 4. TEST FEATURE SIX: HISTORICAL RECOVERY MEMORY
  console.log('\n--- 4. Testing Feature Six: Historical Recovery Memory ---');
  const historyService = new HistoricalMemoryService();
  const pastIncidents = historyService.getIncidents();
  assert(pastIncidents.length >= 3, `Retrieved ${pastIncidents.length} historical incidents from persistent memory`);

  // Test Similarity Search matching active critical disruption
  const similar = historyService.findSimilarIncidents(critAlert || null);
  assert(similar.length > 0, 'Similarity search executed successfully against historical incidents');
  const topMatch = similar[0];
  assert(topMatch.id === 'INC-2024-TYPHOON-YANTIAN', 'Identified 2024 Yantian Typhoon Embargo as closest historical match');
  assert((topMatch.similarityScore || 0) >= 90, `High similarity score (${topMatch.similarityScore}%) computed`);
  assert(topMatch.actualOutcome?.outcomeStatus === 'FAILED', 'Historical record confirms 2024 400-unit transfer attempt failed');
  assert(topMatch.actualOutcome?.lessonsLearned.length ? true : false, 'Lessons learned retrieved to guide current decision');

  // Test Recording Actual Outcome
  const recordSuccess = historyService.recordActualOutcome(topMatch.id, {
    actualCost: 950000,
    actualDowntimeDays: 4.5,
    actualCustomerDelayDays: 9,
    outcomeStatus: 'FAILED',
    secondaryShortageEncountered: true,
    lessonsLearned: ['Updated post-mortem note: Rule SEC-01 mandatory.'],
    unsuccessfulAttempts: ['Emergency spot purchase was unhedged.'],
    recordedBy: 'Sylvia Tom (Verification Test)',
  });
  assert(recordSuccess, 'Successfully recorded actual outcome into persistent incident memory');

  // 5. TEST FEATURE NINE: EXTERNAL CONNECTORS
  console.log('\n--- 5. Testing Feature Nine: External REST API Connectors ---');
  const connectorService = new ExternalConnectorService();
  const connectors = connectorService.getConnectors();
  assert(connectors.length >= 4, `Initialized ${connectors.length} enterprise connectors (ERP, WMS, TMS, Ariba)`);

  const s4Conn = connectors.find(c => c.systemType === 'ERP_S4HANA');
  assert(Boolean(s4Conn), 'SAP S/4HANA OData v4 connector configured');
  assert(s4Conn?.authMethod === 'OAUTH2', 'OAuth 2.0 authentication method defined');
  assert(s4Conn?.fieldMappings.length ? true : false, 'Field mapping schema configured between external payload and internal model');

  // Test Connection Probe
  const testConnResult = await connectorService.testConnection(s4Conn!.id);
  assert(testConnResult.success === true, 'External connector test handshake succeeded (200 OK)');
  assert(testConnResult.latencyMs > 0, `Round-trip latency measured: ${testConnResult.latencyMs}ms`);

  // Test Sync Execution
  const syncSuccess = await connectorService.syncConnector(s4Conn!.id);
  assert(syncSuccess === true, 'Data synchronization executed without error');

  // 6. TEST STAGING & GOVERNANCE BOUNDARY
  console.log('\n--- 6. Testing Staging & Safe Governance Execution Boundary ---');
  const provider = new MockSAPDataProvider();
  const stagingResult = await provider.stageInventoryTransfer({
    sourcePlant: 'PLANT-2020-DE',
    targetPlant: 'PLANT-1010-US',
    materialNumber: 'MCU-8849-AECQ100',
    quantity: 180,
    transferType: '301_PLANT_TO_PLANT',
    freightPriority: 'EXPRESS_AIR',
    authorizingUserId: 'Sylvia Tom',
  });

  assert(stagingResult.sapStatus === 'POSTED', 'Simulated enterprise movement posted to staging ledger');
  assert(stagingResult.materialDocumentNumber.startsWith('MATDOC-SIM-'), 'Material document number generated in standard format');
  assert(stagingResult.sourceStockRemaining === 340, 'Munich physical stock balance matches deterministic calculation (520 - 180 = 340)');

  console.log(`\n==========================================`);
  console.log(`VERIFICATION RESULT: ${passedTests}/${totalTests} TESTS PASSED`);
  console.log(`==========================================\n`);
}

runVerification().catch(err => {
  console.error('Verification failed with error:', err);
  process.exit(1);
});
