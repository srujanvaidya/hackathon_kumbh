export interface NFCUser {
  id: string;
  name: string;
  phone: string;
  bandId: string;
  balance: number;
  isBlocked: boolean;
  createdAt: Date;
  transactions: Transaction[];
}

export interface Transaction {
  id: string;
  bandId: string;
  amount: number;
  type: 'credit' | 'debit';
  description: string;
  timestamp: Date;
  vendorId?: string;
}

export interface DashboardStats {
  totalUsers: number;
  totalBalance: number;
  activeBands: number;
  blockedBands: number;
  todayTransactions: number;
  todayVolume: number;
}
