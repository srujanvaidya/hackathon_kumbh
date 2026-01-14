import { useState } from 'react';
import { Users, Wallet, CreditCard, Ban, TrendingUp, IndianRupee, Store, Trash2 } from 'lucide-react';
import Header from '@/components/Header';
import StatsCard from '@/components/StatsCard';
import QuickActions from '@/components/QuickActions';
import UsersList from '@/components/UsersList';
import RegisterUserModal from '@/components/RegisterUserModal';
import FundBandModal from '@/components/FundBandModal';
import CheckBalanceModal from '@/components/CheckBalanceModal';
import { useNFCStore } from '@/hooks/useNFCStore';
import { useToast } from '@/hooks/use-toast';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const Admin = () => {
  const [registerOpen, setRegisterOpen] = useState(false);
  const [fundOpen, setFundOpen] = useState(false);
  const [balanceOpen, setBalanceOpen] = useState(false);
  const [selectedBandId, setSelectedBandId] = useState<string | null>(null);
  
  const { users, getStats, registerUser, fundBand, toggleBlockBand, getUserByBandId, deleteUser } = useNFCStore();
  const { toast } = useToast();
  const stats = getStats();

  const handleToggleBlock = (bandId: string) => {
    const user = getUserByBandId(bandId);
    toggleBlockBand(bandId);
    toast({
      title: user?.isBlocked ? 'Band Unblocked' : 'Band Blocked',
      description: user?.isBlocked 
        ? 'The band can now be used for transactions' 
        : 'The band has been blocked from all transactions',
    });
  };

  const handleFundFromList = (bandId: string) => {
    setSelectedBandId(bandId);
    setFundOpen(true);
  };

  const handleDeleteUser = (bandId: string) => {
    const user = getUserByBandId(bandId);
    if (user) {
      deleteUser(bandId);
      toast({
        title: 'User Deleted',
        description: `${user.name} has been removed from the system`,
      });
    }
  };

  return (
    <>
      <Helmet>
        <title>Band Management | Kumbh Pay</title>
        <meta name="description" content="Manage NFC payment bands for Nashik Kumbh - Register users, fund bands, check balances, and control transactions." />
      </Helmet>
      
      <div className="min-h-screen bg-background">
        <Header showSellerLink />
        
        {/* Hero Section */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
          <div className="absolute top-0 right-0 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
          
          <div className="container mx-auto px-4 py-8 relative">
            <div className="text-center mb-8 animate-fade-in">
              <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">
                <span className="text-gradient">Band</span> Management
              </h1>
              <p className="text-muted-foreground max-w-md mx-auto">
                Register users, add balance, block/unblock bands
              </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
              <StatsCard
                title="Total Users"
                value={stats.totalUsers}
                icon={Users}
              />
              <StatsCard
                title="Active Bands"
                value={stats.activeBands}
                icon={CreditCard}
                highlight
              />
              <StatsCard
                title="Total Balance"
                value={`₹${stats.totalBalance.toLocaleString()}`}
                icon={Wallet}
              />
              <StatsCard
                title="Blocked"
                value={stats.blockedBands}
                icon={Ban}
              />
              <StatsCard
                title="Today's Txns"
                value={stats.todayTransactions}
                icon={TrendingUp}
              />
              <StatsCard
                title="Today's Vol"
                value={`₹${stats.todayVolume.toLocaleString()}`}
                icon={IndianRupee}
              />
            </div>

            {/* Quick Actions */}
            <QuickActions
              onRegister={() => setRegisterOpen(true)}
              onFund={() => setFundOpen(true)}
              onCheckBalance={() => setBalanceOpen(true)}
            />
          </div>
        </section>

        {/* Users List Section */}
        <section className="container mx-auto px-4 py-8">
          <UsersList
            users={users}
            onToggleBlock={handleToggleBlock}
            onFund={handleFundFromList}
            onDelete={handleDeleteUser}
            showDelete
          />
        </section>

        {/* Modals */}
        <RegisterUserModal
          open={registerOpen}
          onClose={() => setRegisterOpen(false)}
          onRegister={registerUser}
        />
        <FundBandModal
          open={fundOpen}
          onClose={() => {
            setFundOpen(false);
            setSelectedBandId(null);
          }}
          onFund={fundBand}
          getUserByBandId={getUserByBandId}
        />
        <CheckBalanceModal
          open={balanceOpen}
          onClose={() => setBalanceOpen(false)}
          getUserByBandId={getUserByBandId}
        />

        {/* Footer */}
        <footer className="border-t border-border mt-12 py-6 text-center text-sm text-muted-foreground">
          <p>© 2024 Kumbh Pay - NFC Payment System</p>
          <p className="text-xs mt-1">Secure • Cashless • Sacred</p>
        </footer>
      </div>
    </>
  );
};

export default Admin;
