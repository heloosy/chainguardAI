import { HistoricalIncident, RiskAlert, ResponseActionType } from '../../types';
import { INITIAL_HISTORICAL_INCIDENTS } from '../../data/seedData';

const STORAGE_KEY = 'chainguard_historical_memory';

export class HistoricalMemoryService {
  private incidents: HistoricalIncident[];

  constructor() {
    this.incidents = this.loadIncidents();
  }

  private loadIncidents(): HistoricalIncident[] {
    if (typeof localStorage === 'undefined') {
      return INITIAL_HISTORICAL_INCIDENTS;
    }
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.warn('Failed to parse historical memory from localStorage:', e);
      }
    }
    return INITIAL_HISTORICAL_INCIDENTS;
  }

  public getIncidents(): HistoricalIncident[] {
    return [...this.incidents];
  }

  public saveIncidents(updated: HistoricalIncident[]): void {
    this.incidents = updated;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    }
  }

  /**
   * Retrieves similar historical incidents based on the active risk alert.
   * Compares component type, disruption cause, lead time, and impacted facilities.
   */
  public findSimilarIncidents(activeRisk: RiskAlert | null): HistoricalIncident[] {
    if (!activeRisk) return this.incidents;

    return this.incidents.map(inc => {
      let score = 0;
      const factors: { factor: string; matchLevel: 'EXACT' | 'HIGH' | 'MODERATE' | 'LOW'; detail: string }[] = [];

      // 1. Component match
      if (inc.affectedComponentIds.includes(activeRisk.affectedComponentId)) {
        score += 35;
        factors.push({
          factor: 'Component Identity',
          matchLevel: 'EXACT',
          detail: `Exact component match: ${activeRisk.affectedComponentId}`,
        });
      } else {
        score += 15;
        factors.push({
          factor: 'Component Category',
          matchLevel: 'MODERATE',
          detail: 'Related electronic assembly / hardware component',
        });
      }

      // 2. Disruption category match
      const textToSearch = `${activeRisk.title} ${activeRisk.rootCause} ${activeRisk.category}`.toLowerCase();
      const isCategoryMatch = 
        (textToSearch.includes('typhoon') && inc.incidentType === 'WEATHER') ||
        (textToSearch.includes('port') && (inc.incidentType === 'LOGISTICS' || inc.incidentType === 'WEATHER')) ||
        (textToSearch.includes('weather') && inc.incidentType === 'WEATHER') ||
        (activeRisk.category === 'INVENTORY_SHORTAGE' && inc.incidentType === 'WEATHER') ||
        (activeRisk.category === 'COMPLIANCE_GAP' && inc.incidentType === 'QUALITY');

      if (isCategoryMatch) {
        score += 30;
        factors.push({
          factor: 'Root Cause & Hazard',
          matchLevel: 'EXACT',
          detail: `Matching disturbance profile: ${inc.incidentType}`,
        });
      } else {
        score += 10;
        factors.push({
          factor: 'Root Cause & Hazard',
          matchLevel: 'LOW',
          detail: 'Supply chain delivery variance',
        });
      }

      // 3. Network Facility Overlap
      const facilityOverlap = inc.affectedFacilityIds.filter(f => activeRisk.affectedFactoryIds.includes(f));
      if (facilityOverlap.length > 0) {
        score += 20;
        factors.push({
          factor: 'Facility Topology',
          matchLevel: facilityOverlap.length >= 2 ? 'EXACT' : 'HIGH',
          detail: `Shared affected plants: ${facilityOverlap.join(', ')}`,
        });
      }

      // 4. Criticality & Time-to-stockout
      if (activeRisk.daysUntilImpact < 2 && inc.conditionsObserved.stockOnHandAtDetection < 60) {
        score += 15;
        factors.push({
          factor: 'Stockout Urgency',
          matchLevel: 'HIGH',
          detail: 'Critical run-out timeline under 48 hours',
        });
      }

      const normalizedScore = Math.min(100, Math.max(25, score));

      return {
        ...inc,
        similarityScore: normalizedScore,
        similarityFactors: factors,
      };
    }).sort((a, b) => (b.similarityScore || 0) - (a.similarityScore || 0));
  }

  /**
   * Records the actual outcome of an incident after recovery actions were executed.
   */
  public recordActualOutcome(
    incidentId: string,
    outcomeData: {
      actualCost: number;
      actualDowntimeDays: number;
      actualCustomerDelayDays: number;
      outcomeStatus: 'RESOLVED_OPTIMAL' | 'RESOLVED_SUBOPTIMAL' | 'FAILED';
      secondaryShortageEncountered: boolean;
      lessonsLearned: string[];
      unsuccessfulAttempts: string[];
      recordedBy: string;
    }
  ): boolean {
    const updated = this.incidents.map(inc => {
      if (inc.id === incidentId) {
        return {
          ...inc,
          actualOutcome: {
            ...outcomeData,
            recordedAt: new Date().toISOString().slice(0, 10),
          },
        };
      }
      return inc;
    });

    this.saveIncidents(updated);
    return true;
  }

  /**
   * Adds a new disruption incident to persistent memory when triggered.
   */
  public createIncidentFromActive(
    activeRisk: RiskAlert,
    selectedActionType: ResponseActionType,
    actionTitle: string,
    rationale: string,
    predictedCost: number,
    predictedDelay: number
  ): HistoricalIncident {
    const newInc: HistoricalIncident = {
      id: `INC-${Date.now()}`,
      incidentCode: `INC-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`,
      title: activeRisk.title,
      incidentType: activeRisk.category === 'INVENTORY_SHORTAGE' ? 'WEATHER' : 'LOGISTICS',
      date: new Date().toISOString().slice(0, 10),
      affectedSupplierIds: activeRisk.affectedSupplierId ? [activeRisk.affectedSupplierId] : ['SUP-X'],
      affectedComponentIds: [activeRisk.affectedComponentId],
      affectedFacilityIds: activeRisk.affectedFactoryIds,
      conditionsObserved: {
        initialLeadTimeDelayDays: 18,
        stockOnHandAtDetection: 40,
        dailyBurnRate: 50,
        criticality: 'CRITICAL',
        externalContext: activeRisk.rootCause,
      },
      recoveryOptionsConsidered: [
        {
          name: actionTitle,
          actionType: selectedActionType,
          predictedCost,
          predictedDowntimeDays: 0,
          feasibilityOutcome: 'Selected by executive human approval',
        },
      ],
      selectedAction: {
        actionType: selectedActionType,
        description: actionTitle,
        rationale,
        approvedBy: 'Sylvia Tom (VP Global Operations)',
      },
      predictedMetrics: {
        cost: predictedCost,
        downtimeDays: 0,
        customerDelayDays: predictedDelay,
        financialExposure: activeRisk.estimatedFinancialExposure,
      },
      similarityScore: 100,
    };

    const updated = [newInc, ...this.incidents];
    this.saveIncidents(updated);
    return newInc;
  }

  public resetToDefault(): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
    this.incidents = INITIAL_HISTORICAL_INCIDENTS;
  }
}
