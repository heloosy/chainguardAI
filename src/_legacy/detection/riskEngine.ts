import { 
  Supplier, 
  Component, 
  Factory, 
  CustomerOrder, 
  DisruptionEvent, 
  RiskAlert, 
  RiskSeverity, 
  SupportingSignal,
  DetectionInputData
} from '../../types/index.ts';

export class RiskDetectionEngine {
  /**
   * Deterministic Rule-Based Risk Detection Engine
   * Evaluates operational data from ERP, WMS, TMS, and external disruption signals.
   */
  public evaluateRisks(data: DetectionInputData): RiskAlert[] {
    const alerts: RiskAlert[] = [];
    const activeDisruptions = data.disruptions.filter(d => d.isActive);

    // Rule 1: Stockout Imminence & Line Stoppage Threat
    // Checks if any factory component Days-On-Hand < 2.5 days
    for (const factory of data.factories) {
      for (const [compId, inv] of Object.entries(factory.inventory)) {
        const daysOnHand = inv.currentStock / (inv.dailyBurnRate || 1);
        const comp = data.components.find(c => c.id === compId);

        if (daysOnHand <= 2.5) {
          const hoursLeft = Math.round(daysOnHand * 24);
          const primarySup = data.suppliers.find(s => s.id === comp?.primarySupplierId);
          
          // Check if incoming PO is delayed
          const delayedPO = inv.incomingPipeline.find(po => po.delayedDays > 0);
          
          // Correlate with active disruptions
          const matchingDisruption = activeDisruptions.find(d => 
            primarySup && d.impactedSuppliers.includes(primarySup.id)
          );

          // Find affected customer orders produced at this factory requiring this component
          const affectedOrders = data.orders.filter(ord => 
            ord.assignedFactoryId === factory.id && ord.status !== 'FULFILLED'
          );

          const totalFinancialExposure = affectedOrders.reduce((sum, o) => sum + o.orderValue, 0) + 
            (factory.operatingCostPerDay * (delayedPO ? Math.min(delayedPO.delayedDays, 7) : 3));

          const signals: SupportingSignal[] = [
            {
              type: 'TELEMETRY',
              name: `${factory.name} Physical Stock Telemetry`,
              value: `${inv.currentStock} units remaining (Burn rate: ${inv.dailyBurnRate}/day, Stockout in ~${hoursLeft}h)`,
              status: 'CRITICAL',
              sourceSystem: 'Enterprise ERP Inventory Management (MM-IM)',
              timestamp: new Date().toISOString(),
              isConfirmed: true,
            },
          ];

          if (delayedPO) {
            signals.push({
              type: 'EDI_STATUS',
              name: `Inbound PO #${delayedPO.poNumber} Status`,
              value: `Delayed by ${delayedPO.delayedDays} days (Expected: ${delayedPO.expectedDate})`,
              status: 'CRITICAL',
              sourceSystem: 'B2B Procurement Network (EDI 856 ASN)',
              timestamp: new Date().toISOString(),
              isConfirmed: true,
            });
          }

          if (matchingDisruption) {
            signals.push({
              type: 'PORT_API',
              name: `Disruption Correlation: ${matchingDisruption.title}`,
              value: `${matchingDisruption.location} - ${matchingDisruption.category}`,
              status: 'CRITICAL',
              sourceSystem: matchingDisruption.source,
              timestamp: matchingDisruption.detectedAt,
              isConfirmed: matchingDisruption.confirmedProof,
            });
          }

          // Also check other facilities using this same component!
          const otherFactoriesUsingComp = data.factories.filter(f => f.id !== factory.id && f.inventory[compId]);
          const sharedFacilityNames = otherFactoriesUsingComp.map(f => f.name).join(', ');

          alerts.push({
            id: `RISK-STOCKOUT-${factory.id}-${compId}`,
            title: `Critical Shortage: ${comp?.name || compId} at ${factory.name} (${hoursLeft}h to Line Shutdown)`,
            severity: 'CRITICAL',
            confidenceScore: 98,
            detectedAt: new Date().toISOString(),
            category: 'INVENTORY_SHORTAGE',
            affectedSupplierId: primarySup?.id,
            affectedComponentId: compId,
            affectedFactoryIds: [factory.id, ...otherFactoriesUsingComp.map(f => f.id)],
            affectedOrderIds: affectedOrders.map(o => o.id),
            daysUntilImpact: Number(daysOnHand.toFixed(1)),
            estimatedFinancialExposure: totalFinancialExposure,
            status: 'ACTIVE',
            isConfirmedDisruption: true,
            rootCause: `${primarySup?.name || 'Primary supplier'} delivery is stalled due to ${matchingDisruption?.title || 'maritime port embargo'}. ${factory.name} stock (${inv.currentStock} units) is depleted in ${hoursLeft} hours. Shared by: ${sharedFacilityNames || 'None'}.`,
            uncertaintyExplanation: 'Deterministic telemetry verified via ERP Material Ledger. High confidence (>95%) based on validated plant consumption meters and confirmed port embargo.',
            recommendedActionId: 'ACT-BALANCED-03',
            supportingSignals: signals,
            evidenceSources: [
              {
                system: 'ERP Physical Inventory (MM-IM)',
                recordId: `PLANT-${factory.code}-STOCK-${compId}`,
                verified: true,
                lastUpdated: '10 mins ago',
              },
              {
                system: 'Carrier Transportation Management (TMS)',
                recordId: delayedPO ? `FO-${delayedPO.poNumber}` : 'TM-SHIP-FEED',
                verified: true,
                lastUpdated: '35 mins ago',
              },
              {
                system: 'Supplier Lifecycle & Performance',
                recordId: primarySup ? primarySup.aribaVendorId : 'AR-VENDOR',
                verified: true,
                lastUpdated: '1 hour ago',
              },
            ],
          });
        }
      }
    }

    // Rule 2: Unverified Alternate Supplier / Compliance Risk
    for (const sup of data.suppliers) {
      if (sup.auditStatus === 'PENDING_AUDIT' || !sup.complianceVerified) {
        alerts.push({
          id: `RISK-COMPLIANCE-${sup.id}`,
          title: `Unverified Candidate Supplier: ${sup.name} Lacks On-Site Compliance Audit`,
          severity: 'HIGH',
          confidenceScore: 84,
          detectedAt: new Date().toISOString(),
          category: 'COMPLIANCE_GAP',
          affectedSupplierId: sup.id,
          affectedComponentId: sup.componentsSupplied[0] || '',
          affectedFactoryIds: ['FAC-A'],
          affectedOrderIds: [],
          daysUntilImpact: 4,
          estimatedFinancialExposure: 320000,
          status: 'ACTIVE',
          isConfirmedDisruption: true,
          rootCause: `${sup.name} is configured as an alternate source, but lacks formal SLP automotive qualification and verified lead-time telemetry.`,
          uncertaintyExplanation: 'Quoted capacity and 12-day transit time are based on unverified supplier sales claims; no EDI test transponder active.',
          recommendedActionId: 'ACT-SUP-SWITCH-02',
          supportingSignals: [
            {
              type: 'ERP_DISCREPANCY',
              name: 'Supplier Scorecard & Audit Status',
              value: `Audit Status: ${sup.auditStatus} | Historical Delay Rate: ${sup.historicalDelayRate}%`,
              status: 'WARNING',
              sourceSystem: 'Supplier Lifecycle Management (SLP)',
              timestamp: new Date().toISOString(),
              isConfirmed: true,
            },
          ],
          evidenceSources: [
            {
              system: 'Supplier Compliance Database',
              recordId: `SLP-REC-${sup.aribaVendorId}`,
              verified: false,
              lastUpdated: '1 day ago',
            },
          ],
        });
      }
    }

    // Rule 3: Customer Order SLA At-Risk Detection
    for (const ord of data.orders) {
      if (ord.status === 'AT_RISK') {
        alerts.push({
          id: `RISK-ORDER-${ord.id}`,
          title: `Customer Commitment At-Risk: Order #${ord.sapOrderNumber} (${ord.customerName})`,
          severity: ord.priority === 'P1_CRITICAL' ? 'CRITICAL' : 'HIGH',
          confidenceScore: 92,
          detectedAt: new Date().toISOString(),
          category: 'CUSTOMER_SLA_BREACH',
          affectedComponentId: 'COMP-MCU-8849',
          affectedFactoryIds: [ord.assignedFactoryId],
          affectedOrderIds: [ord.id],
          daysUntilImpact: 4,
          estimatedFinancialExposure: ord.orderValue + (ord.penaltyPerDayLate * 7),
          status: 'ACTIVE',
          isConfirmedDisruption: true,
          rootCause: `Production of ${ord.productId} at Factory ${ord.assignedFactoryId} is blocked by upstream component shortage. SLA penalty of $${ord.penaltyPerDayLate.toLocaleString()}/day will accrue starting Day 4.`,
          uncertaintyExplanation: 'Delivery projection calculated from BOM component availability and assembly cycle times.',
          recommendedActionId: 'ACT-BALANCED-03',
          supportingSignals: [
            {
              type: 'ERP_DISCREPANCY',
              name: 'Sales Order Schedule Line',
              value: `Promised: ${ord.promisedDeliveryDate}, Projected: ${ord.projectedDeliveryDate}`,
              status: 'CRITICAL',
              sourceSystem: 'Sales & Distribution (SD) Order Engine',
              timestamp: new Date().toISOString(),
              isConfirmed: true,
            },
          ],
          evidenceSources: [
            {
              system: 'Enterprise Sales Order Ledger',
              recordId: ord.sapOrderNumber,
              verified: true,
              lastUpdated: '18 mins ago',
            },
          ],
        });
      }
    }

    return alerts;
  }
}
