export interface DashboardStats {
  totalBalance: number;
  totalDebtors: number;
  recentTransactions: number;
}

export interface RecentActivityItem {
  id: string;
  type: 'sale' | 'payment';
  customerName: string;
  amount: number;
  date: string;
}
