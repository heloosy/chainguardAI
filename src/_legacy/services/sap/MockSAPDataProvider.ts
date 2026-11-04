import { 
  Supplier, 
  Component, 
  Factory, 
  FinishedProduct, 
  CustomerOrder, 
  PurchaseOrder,
  DisruptionEvent, 
  SAPSystemHealth 
} from '../../types/index.ts';
import { 
  INITIAL_SUPPLIERS, 
  INITIAL_COMPONENTS, 
  INITIAL_FACTORIES, 
  INITIAL_PRODUCTS, 
  INITIAL_CUSTOMER_ORDERS, 
  INITIAL_PURCHASE_ORDERS,
  INITIAL_DISRUPTION_EVENTS, 
  INITIAL_SAP_HEALTH 
} from '../../data/seedData.ts';
import { ISAPDataProvider, SAPInventoryTransferRequest, SAPTransferResponse } from './ISAPDataProvider.ts';

export class MockSAPDataProvider implements ISAPDataProvider {
  private suppliers: Supplier[] = JSON.parse(JSON.stringify(INITIAL_SUPPLIERS));
  private components: Component[] = JSON.parse(JSON.stringify(INITIAL_COMPONENTS));
  private factories: Factory[] = JSON.parse(JSON.stringify(INITIAL_FACTORIES));
  private products: FinishedProduct[] = JSON.parse(JSON.stringify(INITIAL_PRODUCTS));
  private orders: CustomerOrder[] = JSON.parse(JSON.stringify(INITIAL_CUSTOMER_ORDERS));
  private purchaseOrders: PurchaseOrder[] = JSON.parse(JSON.stringify(INITIAL_PURCHASE_ORDERS));
  private disruptions: DisruptionEvent[] = JSON.parse(JSON.stringify(INITIAL_DISRUPTION_EVENTS));
  private health: SAPSystemHealth[] = JSON.parse(JSON.stringify(INITIAL_SAP_HEALTH));

  async getSuppliers(): Promise<Supplier[]> {
    // Simulates S/4HANA BusinessPartner & Ariba SLP aggregation
    return new Promise(res => setTimeout(() => res([...this.suppliers]), 40));
  }

  async getComponents(): Promise<Component[]> {
    return new Promise(res => setTimeout(() => res([...this.components]), 30));
  }

  async getFactories(): Promise<Factory[]> {
    return new Promise(res => setTimeout(() => res([...this.factories]), 35));
  }

  async getProducts(): Promise<FinishedProduct[]> {
    return new Promise(res => setTimeout(() => res([...this.products]), 25));
  }

  async getCustomerOrders(): Promise<CustomerOrder[]> {
    return new Promise(res => setTimeout(() => res([...this.orders]), 30));
  }

  async getPurchaseOrders(): Promise<PurchaseOrder[]> {
    return new Promise(res => setTimeout(() => res([...this.purchaseOrders]), 25));
  }

  async getDisruptions(): Promise<DisruptionEvent[]> {
    return new Promise(res => setTimeout(() => res([...this.disruptions]), 20));
  }

  async getSystemHealth(): Promise<SAPSystemHealth[]> {
    return new Promise(res => setTimeout(() => res([...this.health]), 20));
  }

  async stageInventoryTransfer(req: SAPInventoryTransferRequest): Promise<SAPTransferResponse> {
    // Simulated OData POST /sap/opu/odata/sap/API_MATERIAL_DOCUMENT_SRV/A_MaterialDocumentHeader
    return new Promise(res => {
      setTimeout(() => {
        const matDoc = `MATDOC-SIM-${Math.floor(100000 + Math.random() * 900000)}`;
        res({
          materialDocumentNumber: matDoc,
          sapStatus: 'POSTED',
          postingDate: new Date().toISOString(),
          sourceStockRemaining: 520 - req.quantity,
          targetStockUpdated: 40 + req.quantity,
          message: `[SIMULATED SAP S/4HANA] Staged Movement Type ${req.transferType} for Mat ${req.materialNumber} (${req.quantity} PC). Doc: ${matDoc}`,
        });
      }, 350);
    });
  }

  async checkConnection(serviceName: string): Promise<boolean> {
    return true;
  }

  // Helper for demo reset
  resetToOriginal() {
    this.suppliers = JSON.parse(JSON.stringify(INITIAL_SUPPLIERS));
    this.components = JSON.parse(JSON.stringify(INITIAL_COMPONENTS));
    this.factories = JSON.parse(JSON.stringify(INITIAL_FACTORIES));
    this.products = JSON.parse(JSON.stringify(INITIAL_PRODUCTS));
    this.orders = JSON.parse(JSON.stringify(INITIAL_CUSTOMER_ORDERS));
    this.purchaseOrders = JSON.parse(JSON.stringify(INITIAL_PURCHASE_ORDERS));
    this.disruptions = JSON.parse(JSON.stringify(INITIAL_DISRUPTION_EVENTS));
  }
}
