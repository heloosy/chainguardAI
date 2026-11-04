// ChainGuard AI Core Domain Types

export type RiskSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type ResponseActionType = 
  | 'DO_NOTHING' 
  | 'INVENTORY_TRANSFER' 
  | 'SUPPLIER_SWITCH' 
  | 'EXPEDITE_EXISTING'
  | 'PRODUCTION_ADJUSTMENT'
  | 'BALANCED_HYBRID';

export type ValidationOutcome = 
  | 'PROCEED' 
  | 'APPROVAL_REQUIRED' 
  | 'EVIDENCE_REQUIRED' 
  | 'BLOCKED';

export type AuditStatus = 
  | 'PENDING_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'EXECUTED_SIMULATED';

export type DataMode = 'DEMONSTRATION' | 'CONNECTED';

export type EvidenceStatus = 'CONFIRMED' | 'ESTIMATED' | 'MISSING' | 'UNVERIFIED';

export interface EvidenceItem {
  id: string;
  factor: string;
  category: 'SUPPLIER_CAPACITY' | 'INVENTORY_STOCK' | 'LEAD_TIME' | 'COMPLIANCE_POLICY' | 'DATA_FRESHNESS';
  status: EvidenceStatus;
  sourceSystem: string;
  details: string;
  lastUpdated: string;
  verifiedBy?: string;
  requiredDocument?: string;
}

export interface Supplier {
  id: string;
  name: string;
  tier: 1 | 2 | 3;
  country: string;
  region: string;
  reliabilityScore: number; // 0-100
  historicalDelayRate: number; // %
  complianceVerified: boolean;
  aribaVendorId: string;
  currentRiskScore: number; // 0-100
  componentsSupplied: string[];
  auditStatus: 'VERIFIED' | 'PENDING_AUDIT' | 'EXPIRED';
  contact: {
    lead: string;
    email: string;
    phone: string;
  };
  dataSource?: string;
  dependencyCompleteness?: 'VERIFIED_100' | 'PARTIAL_60' | 'ESTIMATED_UNVERIFIED';
}

export interface Component {
  id: string;
  sku: string;
  name: string;
  category: 'Semiconductor' | 'Power Module' | 'Passives' | 'Mechanical';
  unitCost: number;
  criticality: 'CRITICAL' | 'HIGH' | 'STANDARD';
  primarySupplierId: string;
  alternateSupplierIds: string[];
  dailyGlobalConsumption: number;
  bufferThresholdDays: number;
  dataSource?: string;
}

export interface InventoryItem {
  componentId: string;
  currentStock: number;
  reservedStock: number;
  dailyBurnRate: number;
  safetyStock: number;
  minimumThreshold: number;
  daysOnHand: number;
  lastStockUpdate: string;
  incomingPipeline: {
    poNumber: string;
    quantity: number;
    expectedDate: string;
    originalDate: string;
    delayedDays: number;
  }[];
}

export interface Factory {
  id: string;
  code: string;
  name: string;
  location: string;
  region: string;
  coordinates: [number, number]; // [lat, lng]
  dailyCapacity: number;
  currentUtilization: number; // %
  operatingCostPerDay: number;
  inventory: Record<string, InventoryItem>; // componentId -> InventoryItem
  finishedProductsProduced: string[];
  dataSource?: string;
}

export interface FinishedProduct {
  id: string;
  sku: string;
  name: string;
  billOfMaterials: {
    componentId: string;
    quantityRequired: number;
  }[];
  marginPerUnit: number;
  sellingPrice: number;
  factoriesCanProduce: string[];
}

export interface CustomerOrder {
  id: string;
  sapOrderNumber: string;
  customerName: string;
  tier: 'Tier 1 Strategic' | 'Tier 2 Enterprise' | 'Standard Commercial';
  priority: 'P1_CRITICAL' | 'P2_HIGH' | 'P3_NORMAL';
  productId: string;
  quantity: number;
  orderValue: number;
  penaltyPerDayLate: number;
  promisedDeliveryDate: string;
  projectedDeliveryDate: string;
  status: 'ON_TRACK' | 'AT_RISK' | 'DELAYED' | 'FULFILLED';
  assignedFactoryId: string;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  componentId: string;
  componentName: string;
  destinationFactoryId: string;
  destinationFactoryName: string;
  quantity: number;
  unitCost: number;
  totalAmount: number;
  originalDeliveryDate: string;
  projectedDeliveryDate: string;
  delayedDays: number;
  status: 'ON_TIME' | 'AT_RISK' | 'DELAYED' | 'CRITICAL_DELAY';
  shipmentTrackingNumber: string;
  carrierName: string;
  transportMode: 'OCEAN' | 'AIR' | 'ROAD' | 'RAIL';
  riskImpact: string;
  evidenceFreshness: string;
}

export interface DisruptionEvent {
  id: string;
  title: string;
  category: 'GEOPOLITICAL' | 'WEATHER' | 'LOGISTICS' | 'QUALITY' | 'SUPPLIER_INSOLVENCY';
  severity: RiskSeverity;
  location: string;
  detectedAt: string;
  description: string;
  impactedSuppliers: string[];
  impactedShipmentIds: string[];
  estimatedDurationDays: number;
  confidenceScore: number;
  source: string;
  isActive: boolean;
  confirmedProof: boolean; // Confirmed vs suspected risk distinction
}

export interface SupportingSignal {
  type: 'TELEMETRY' | 'EDI_STATUS' | 'PORT_API' | 'ERP_DISCREPANCY' | 'WEATHER_ALERT';
  name: string;
  value: string;
  status: 'NORMAL' | 'WARNING' | 'CRITICAL';
  sourceSystem: string;
  timestamp: string;
  isConfirmed: boolean;
}

export interface RiskAlert {
  id: string;
  title: string;
  severity: RiskSeverity;
  confidenceScore: number;
  detectedAt: string;
  category: string;
  affectedSupplierId?: string;
  affectedComponentId: string;
  affectedFactoryIds: string[];
  affectedOrderIds: string[];
  daysUntilImpact: number;
  estimatedFinancialExposure: number;
  status: 'ACTIVE' | 'MITIGATING' | 'RESOLVED';
  isConfirmedDisruption: boolean;
  supportingSignals: SupportingSignal[];
  evidenceSources: {
    system: string;
    recordId: string;
    verified: boolean;
    lastUpdated: string;
  }[];
  uncertaintyExplanation: string;
  rootCause: string;
  recommendedActionId: string;
}

export interface InventoryCurvePoint {
  day: number;
  date: string;
  factoryAStock: number;
  factoryBStock: number;
  thresholdA: number;
  thresholdB: number;
}

export interface SecondaryShortageDetails {
  detected: boolean;
  facilityId: string;
  facilityName: string;
  componentId: string;
  componentName: string;
  daysUntilStockout: number;
  affectedCustomerOrders: string[];
  secondaryFinancialLoss: number;
  explanation: string;
}

export interface CandidateResponse {
  id: string;
  actionType: ResponseActionType;
  title: string;
  description: string;
  estimatedCost: number;
  costBreakdown: { item: string; amount: number; isEstimate: boolean }[];
  recoveryTimeDays: number;
  customerDeliveryDelayDays: number;
  timeUntilShortageDays: number;
  unmetDemandQuantity: number;
  affectedOrdersCount: number;
  financialExposureAvoided: number;
  netBenefit: number;
  feasibilityScore: number; // 0-100
  isFeasible: boolean;
  rankingRank: number; // 1 = highest recommended
  rankingReason: string;
  
  // Inventory impact
  sourceFacilityId?: string;
  targetFacilityId?: string;
  transferQuantity?: number;
  alternateSupplierId?: string;
  expediteShippingCost?: number;
  
  // Secondary shortage detection (Core Consequence Modeling)
  secondaryShortage: SecondaryShortageDetails;
  
  // 14-day projection
  inventoryProjection: InventoryCurvePoint[];
  
  // Mathematical logic explanation
  calculationFormula: string;
  assumptions: string[];
  evidenceItems: EvidenceItem[];
  
  // Validation status
  validationOutcome: ValidationOutcome;
  validationCheckIds: string[];
}

export interface ValidationRule {
  id: string;
  code: string;
  name: string;
  category: 'SECONDARY_RISK' | 'COMPLIANCE' | 'FINANCIAL_AUTHORITY' | 'CUSTOMER_SLA' | 'DATA_INTEGRITY';
  severity: 'BLOCKING' | 'WARNING' | 'INFORMATIONAL';
  description: string;
  passed: boolean;
  actualValue: string | number;
  thresholdValue: string | number;
  explanation: string;
  requiredEvidenceDoc?: string;
}

export interface ValidationReport {
  actionId: string;
  outcome: ValidationOutcome;
  overallScore: number; // 0-100
  evaluatedAt: string;
  rules: ValidationRule[];
  canBeExecuted: boolean;
  requiredRoleForApproval?: string;
  missingEvidenceList: string[];
  recommendationSummary: string;
  decisionGateReason: string;
  nextRequiredAction: string;
}

export interface AuditRecord {
  id: string;
  timestamp: string;
  riskId: string;
  riskTitle: string;
  actionId: string;
  actionTitle: string;
  actionType: ResponseActionType;
  financialCost: number;
  validationOutcome: ValidationOutcome;
  status: AuditStatus;
  user: string;
  userRole: string;
  rationale: string;
  sapDocumentReference?: string;
  executionTimestamp?: string;
  secondaryShortagePrevented: boolean;
  details: {
    factoryAStockAfter: number;
    factoryBStockAfter: number;
    ordersProtected: number;
  };
}

export interface HistoricalIncident {
  id: string;
  incidentCode: string;
  title: string;
  incidentType: 'WEATHER' | 'GEOPOLITICAL' | 'LOGISTICS' | 'QUALITY' | 'SUPPLIER_INSOLVENCY' | 'EQUIPMENT_FAILURE';
  date: string;
  affectedSupplierIds: string[];
  affectedComponentIds: string[];
  affectedFacilityIds: string[];
  conditionsObserved: {
    initialLeadTimeDelayDays: number;
    stockOnHandAtDetection: number;
    dailyBurnRate: number;
    criticality: string;
    externalContext: string;
  };
  recoveryOptionsConsidered: {
    name: string;
    actionType: ResponseActionType;
    predictedCost: number;
    predictedDowntimeDays: number;
    feasibilityOutcome: string;
  }[];
  selectedAction: {
    actionType: ResponseActionType;
    description: string;
    rationale: string;
    approvedBy: string;
  };
  predictedMetrics: {
    cost: number;
    downtimeDays: number;
    customerDelayDays: number;
    financialExposure: number;
  };
  actualOutcome?: {
    recordedAt: string;
    actualCost: number;
    actualDowntimeDays: number;
    actualCustomerDelayDays: number;
    outcomeStatus: 'RESOLVED_OPTIMAL' | 'RESOLVED_SUBOPTIMAL' | 'FAILED';
    secondaryShortageEncountered: boolean;
    lessonsLearned: string[];
    unsuccessfulAttempts: string[];
    recordedBy: string;
  };
  similarityScore?: number;
  similarityFactors?: {
    factor: string;
    matchLevel: 'EXACT' | 'HIGH' | 'MODERATE' | 'LOW';
    detail: string;
  }[];
}

export type ConnectorAuthType = 'API_KEY' | 'BEARER_TOKEN' | 'OAUTH2' | 'BASIC_AUTH';
export type ConnectorHealthStatus = 'CONNECTED' | 'DISCONNECTED' | 'SYNCING' | 'ERROR' | 'DEGRADED';
export type ConnectorSystemType = 'ERP_S4HANA' | 'ERP_NETSUITE' | 'WMS_INVENTORY' | 'TMS_CARRIER' | 'PROCUREMENT_ARIBA' | 'GENERIC_REST';

export interface FieldMappingEntry {
  sourceField: string;
  targetField: string;
  dataType: 'string' | 'number' | 'boolean' | 'date';
  sampleValue: string;
}

export interface ExternalConnectorConfig {
  id: string;
  name: string;
  systemType: ConnectorSystemType;
  category: 'ERP' | 'WMS' | 'TMS' | 'PROCUREMENT' | 'CUSTOM';
  endpointUrl: string;
  authMethod: ConnectorAuthType;
  credentials: {
    apiKey?: string;
    bearerToken?: string;
    clientId?: string;
    clientSecret?: string;
    username?: string;
    password?: string;
  };
  headers: Record<string, string>;
  timeoutMs: number;
  rateLimitPerMinute: number;
  retryCount: number;
  fieldMappings: FieldMappingEntry[];
  healthStatus: ConnectorHealthStatus;
  lastSyncTimestamp: string;
  lastPingMs: number;
  recordsIndexed: number;
  errorMessage?: string;
  syncLogs: {
    timestamp: string;
    level: 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS';
    message: string;
    recordsProcessed?: number;
  }[];
  mode: 'DEMO' | 'CONNECTED';
}

export interface SAPSystemHealth {
  serviceName: string;
  status: 'CONNECTED_MOCK' | 'CONNECTED_LIVE' | 'ERROR';
  latencyMs: number;
  lastSyncTime: string;
  recordsIndexed: number;
  endpointUrl: string;
}

export interface DetectionInputData {
  suppliers: Supplier[];
  components: Component[];
  factories: Factory[];
  orders: CustomerOrder[];
  disruptions: DisruptionEvent[];
  purchaseOrders?: PurchaseOrder[];
}

export type WarningSourceCategory = 
  | 'AIS_SATELLITE' 
  | 'IOT_TELEMETRY' 
  | 'PORT_AUTHORITY' 
  | 'CARRIER_TMS' 
  | 'FOUNDRY_MES' 
  | 'COMPLIANCE_AUDIT' 
  | 'WEATHER_RADAR';

export type SignalProtocol = 
  | 'REST_WEBHOOK' 
  | 'OIDC_ODATA' 
  | 'MQTT_IOT' 
  | 'EDI_856' 
  | 'AIS_SATELLITE' 
  | 'SFTP_POLL';

export interface GeospatialWarningSource {
  id: string;
  name: string;
  category: WarningSourceCategory;
  sourceSystem: string;
  connectionProtocol: SignalProtocol;
  coordinates: [number, number]; // [lat, lng]
  locationName: string;
  country: string;
  severity: RiskSeverity | 'INFO';
  status: 'CRITICAL_ALERT' | 'WARNING' | 'OPERATIONAL' | 'UNVERIFIED';
  title: string;
  summary: string;
  impactedEntity: string;
  dataFreshness: string;
  isVerifiedRealData: boolean;
  telemetryPayload: Record<string, any>;
  routeArcTo?: [number, number]; // [lat, lng] destination for transit routes
  arcLabel?: string;
  arcColor?: string;
  suggestedAction?: string;
  targetRiskId?: string;
}

// Agentic AI Architecture Types
export type AgentRole = 
  | 'SENTINEL'           // Disruption Detection & Origin Sensor Ingestion
  | 'IMPACT_REASONER'    // Multi-Tier Graph Dependency & Bottleneck Cascade
  | 'STRATEGIST'         // Recovery Strategy Formulation & Portfolio Optimization
  | 'EVIDENCE_VERIFIER'  // Zero-Trust Capacity, ISO Policy & Anti-Cannibalization
  | 'GOVERNANCE_GATE'    // Decision Gating, Human Approval & Staging Boundary
  | 'MEMORY_REASONER';   // Case Precedence & Historical Post-Mortem Retrieval

export type AgentLogType = 
  | 'THOUGHT' 
  | 'TOOL_CALL' 
  | 'OBSERVATION' 
  | 'INTER_AGENT_MSG' 
  | 'DECISION' 
  | 'ACTION_PROPOSED';

export interface AgentActivityLog {
  id: string;
  agentRole: AgentRole;
  agentName: string;
  timestamp: string;
  type: AgentLogType;
  content: string;
  toolInvoked?: string;
  toolParameters?: Record<string, any>;
  targetAgent?: AgentRole;
  confidenceScore?: number;
  evidenceRef?: string;
}

export interface AgentStatusInfo {
  role: AgentRole;
  name: string;
  status: 'ACTIVE_MONITORING' | 'REASONING' | 'VERIFYING' | 'IDLE' | 'AWAITING_INPUT';
  currentTask: string;
  assignedTools: string[];
  lastActionTime: string;
  totalInferencesToday: number;
  description: string;
}
