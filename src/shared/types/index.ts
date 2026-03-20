export type TransactionType = 'CREDIT_SALE' | 'PAYMENT' | 'ADJUSTMENT' | 'PRODUCT_PRICE_UPDATE' | 'UNKNOWN';

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  outstandingBalance: number;
  lastTransactionDate?: string;
  totalDebt: number
  initals: string
  tag?: string
}

export interface Product {
  id: string;
  name: string;
  currentUnitPrice: number;
  currentBulkPrice?: number;
}

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
