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

export interface SAPInventoryTransferRequest {
  sourcePlant: string; // e.g. 'PLANT-2020-DE' (Munich)
  targetPlant: string; // e.g. 'PLANT-1010-US' (Austin)
  materialNumber: string; // e.g. 'MCU-8849-AECQ100'
  quantity: number;
  transferType: '301_PLANT_TO_PLANT' | '351_STOCK_TRANSPORT_ORDER';
  freightPriority: 'EXPRESS_AIR' | 'STANDARD_OCEAN';
  authorizingUserId: string;
}

export interface SAPTransferResponse {
  materialDocumentNumber: string;
  sapStatus: 'POSTED' | 'HELD_FOR_APPROVAL' | 'REJECTED';
  postingDate: string;
  sourceStockRemaining: number;
  targetStockUpdated: number;
  message: string;
}

export interface ISAPDataProvider {
  getSuppliers(): Promise<Supplier[]>;
  getComponents(): Promise<Component[]>;
  getFactories(): Promise<Factory[]>;
  getProducts(): Promise<FinishedProduct[]>;
  getCustomerOrders(): Promise<CustomerOrder[]>;
  getPurchaseOrders(): Promise<PurchaseOrder[]>;
  getDisruptions(): Promise<DisruptionEvent[]>;
  getSystemHealth(): Promise<SAPSystemHealth[]>;
  
  // Execution interfaces (Clearly distinct in Simulation vs Live)
  stageInventoryTransfer(req: SAPInventoryTransferRequest): Promise<SAPTransferResponse>;
  checkConnection(serviceName: string): Promise<boolean>;
}
