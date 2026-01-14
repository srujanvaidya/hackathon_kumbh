import { useState, useCallback, useEffect } from 'react';
import { NFCUser, Transaction, DashboardStats } from '@/types/nfc';
import { useToast } from '@/hooks/use-toast';

export const useNFCStore = () => {
  const [users, setUsers] = useState<NFCUser[]>([]);
  const { toast } = useToast();

  const fetchUsers = useCallback(async () => {
    try {
      const response = await fetch('/api/users/');
      if (response.ok) {
        const data = await response.json();
        // Map backend fields to frontend types if needed
        // Backend: band_id -> Frontend: bandId
        // Backend: is_blocked -> Frontend: isBlocked
        // Backend: created_at -> Frontend: createdAt
        const mappedUsers = data.map((u: any) => ({
          ...u,
          bandId: u.band_id,
          isBlocked: u.is_blocked,
          createdAt: new Date(u.created_at),
          transactions: [] // Transactions might need a separate fetch or nested serializer
        }));
        setUsers(mappedUsers);
      }
    } catch (error) {
      console.error('Failed to fetch users', error);
    }
  }, []);

  const getStats = useCallback((): DashboardStats => {
    // This is a synchronous placeholder. Ideally stats should come from API.
    // For now, we will fetch stats from API in components or here if we change the signature to async
    // Since the component expects synchronous return, we might need to refactor the component or 
    // keep a local stats state.
    // Let's rely on the API for stats in the Admin component, but here we can calculate from users or return default.
    return {
      totalUsers: users.length,
      totalBalance: users.reduce((sum, u) => sum + Number(u.balance), 0),
      activeBands: users.filter(u => !u.isBlocked).length,
      blockedBands: users.filter(u => u.isBlocked).length,
      todayTransactions: 0, // Placeholder
      todayVolume: 0, // Placeholder
    };
  }, [users]);

  // Actually, we should probably add a fetchStats method or load it
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0, totalBalance: 0, activeBands: 0, blockedBands: 0, todayTransactions: 0, todayVolume: 0
  });

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch('/api/stats/');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
    fetchStats();
  }, [fetchUsers, fetchStats]);

  const registerUser = useCallback(async (name: string, phone: string, pin: string, bandId?: string) => {
    try {
      const response = await fetch('/api/users/create/', { // We need to create this endpoint
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, pin, bandId }) // Default PIN for now
      });
      if (response.ok) {
        const data = await response.json();
        const newUser = {
          ...data,
          bandId: data.band_id,
          isBlocked: data.is_blocked,
          createdAt: new Date(data.created_at),
        };
        toast({ title: 'User Registered', description: `Band ID: ${newUser.bandId}` });
        fetchUsers();
        fetchStats();
        return newUser;
      } else {
        toast({ title: 'Registration Failed', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to register', variant: 'destructive' });
    }
  }, [fetchUsers, fetchStats, toast]);

  const fundBand = useCallback(async (bandId: string, amount: number) => {
    try {
      const response = await fetch('/api/fund/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bandId, amount })
      });
      if (response.ok) {
        toast({ title: 'Fund Added' });
        fetchUsers();
        fetchStats();
      } else {
        toast({ title: 'Fund Failed', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', variant: 'destructive' });
    }
  }, [fetchUsers, fetchStats, toast]);

  const toggleBlockBand = useCallback(async (bandId: string) => {
    try {
      const response = await fetch('/api/block/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bandId })
      });
      if (response.ok) {
        fetchUsers();
        fetchStats();
      }
    } catch (error) {
      toast({ title: 'Error', variant: 'destructive' });
    }
  }, [fetchUsers, fetchStats]);

  const deductBalance = useCallback(async (bandId: string, amount: number, description: string = 'Payment', pin?: string, sellerId?: string | null) => {
    try {
      const response = await fetch('/api/payment/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, description, pin, sellerId }) // Include sellerId
      });
      if (response.ok) {
        // toast handled in component? or here.
        fetchUsers();
        fetchStats();
        return true;
      } else {
        const err = await response.json();
        toast({ title: 'Payment Failed', description: err.error, variant: 'destructive' });
        return false;
      }
    } catch (error) {
      toast({ title: 'Error', variant: 'destructive' });
      return false;
    }
  }, [fetchUsers, fetchStats, toast]);

  const deleteUser = useCallback(async (bandId: string) => {
    try {
      const response = await fetch('/api/users/delete/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bandId })
      });
      if (response.ok) {
        toast({ title: 'User Deleted Successfully' });
        fetchUsers();
        fetchStats();
      } else {
        toast({ title: 'Failed to delete user', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error deleting user', variant: 'destructive' });
    }
  }, [fetchUsers, fetchStats, toast]);

  const getUserByBandId = useCallback((bandId: string) => {
    return users.find(u => u.bandId.toLowerCase() === bandId.toLowerCase());
  }, [users]);

  const getUserByPhone = useCallback((phone: string) => {
    return users.find(u => u.phone === phone);
  }, [users]);

  return {
    users,
    getStats: () => stats, // Return state instead of calculating
    registerUser,
    fundBand,
    toggleBlockBand,
    deductBalance,
    deleteUser,
    getUserByBandId,
    getUserByPhone,
  };
};
