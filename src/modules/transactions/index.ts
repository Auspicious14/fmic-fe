export type TransactionType = 'CREDIT_SALE' | 'PAYMENT' | 'ADJUSTMENT' | 'PRODUCT_PRICE_UPDATE' | 'UNKNOWN';

export interface Transaction {
  id: string;
  customerId: string;
  customerName: string;
  type: TransactionType;
  totalAmount: number;
  items?: TransactionItem[];
  createdAt: string;
  voiceTranscript?: string;
}

export interface TransactionItem {
  productName: string;
  quantity: number;
  unitPriceAtSale: number;
  totalPrice: number;
}

export interface Product {
  id: string;
  name: string;
  currentUnitPrice: number;
  currentBulkPrice?: number;
}
