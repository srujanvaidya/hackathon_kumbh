import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search, CreditCard, IndianRupee, ShieldCheck, ShieldX, Clock } from 'lucide-react';
import { NFCUser } from '@/types/nfc';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

import { useScanPolling } from '@/hooks/useScanPolling';

interface CheckBalanceModalProps {
  open: boolean;
  onClose: () => void;
  getUserByBandId: (bandId: string) => NFCUser | undefined;
}

const CheckBalanceModal = ({ open, onClose, getUserByBandId }: CheckBalanceModalProps) => {
  const [bandId, setBandId] = useState('');
  const [foundUser, setFoundUser] = useState<NFCUser | null>(null);
  const { toast } = useToast();

  // Auto-fill Band ID from ESP32 Scan
  useScanPolling(open, (scannedBandId) => {
    if (open && !foundUser) { // Only update if modal is open and not already viewing a user
      setBandId(scannedBandId);
      toast({
        title: "Band Scanned",
        description: `Band ID: ${scannedBandId} detected`,
      });
    }
  });

  const handleSearch = () => {
    const user = getUserByBandId(bandId);
    if (user) {
      setFoundUser(user);
    } else {
      toast({
        title: 'Band Not Found',
        description: 'Please check the Band ID and try again',
        variant: 'destructive',
      });
    }
  };

  const handleClose = () => {
    setBandId('');
    setFoundUser(null);
    onClose();
  };

  const recentTransactions = foundUser?.transactions.slice(-5).reverse() || [];

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl flex items-center gap-2">
            <Search className="w-5 h-5 text-primary" />
            Check Balance
          </DialogTitle>
          <DialogDescription>
            View band balance and recent transactions
          </DialogDescription>
        </DialogHeader>

        {foundUser ? (
          <div className="py-4 animate-fade-in space-y-4">
            <div className={cn(
              'rounded-xl p-5 text-center',
              foundUser.isBlocked ? 'bg-destructive/10' : 'gradient-saffron'
            )}>
              <p className={cn(
                'text-sm mb-1',
                foundUser.isBlocked ? 'text-destructive' : 'text-primary-foreground/80'
              )}>
                {foundUser.isBlocked ? 'BLOCKED BAND' : 'Available Balance'}
              </p>
              <p className={cn(
                'text-4xl font-bold flex items-center justify-center gap-1',
                foundUser.isBlocked ? 'text-destructive' : 'text-primary-foreground'
              )}>
                <IndianRupee className="w-8 h-8" />
                {foundUser.balance.toLocaleString()}
              </p>
              <div className="flex items-center justify-center gap-2 mt-3">
                {foundUser.isBlocked ? (
                  <ShieldX className="w-4 h-4 text-destructive" />
                ) : (
                  <ShieldCheck className="w-4 h-4 text-primary-foreground/80" />
                )}
                <span className={cn(
                  'text-xs',
                  foundUser.isBlocked ? 'text-destructive' : 'text-primary-foreground/80'
                )}>
                  {foundUser.isBlocked ? 'Transactions Disabled' : 'Active & Secure'}
                </span>
              </div>
            </div>

            <div className="bg-secondary rounded-lg p-4 space-y-1">
              <p className="font-semibold">{foundUser.name}</p>
              <p className="text-sm text-muted-foreground">{foundUser.phone}</p>
              <p className="text-xs text-muted-foreground">{foundUser.bandId}</p>
            </div>

            {recentTransactions.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  Recent Transactions
                </p>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {recentTransactions.map((txn) => (
                    <div key={txn.id} className="flex items-center justify-between text-sm bg-card rounded-lg p-3 border border-border">
                      <div>
                        <p className="font-medium">{txn.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(txn.timestamp).toLocaleDateString()}
                        </p>
                      </div>
                      <p className={cn(
                        'font-semibold',
                        txn.type === 'credit' ? 'text-success' : 'text-destructive'
                      )}>
                        {txn.type === 'credit' ? '+' : '-'}₹{txn.amount}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Button className="w-full" onClick={() => setFoundUser(null)}>
              Check Another Band
            </Button>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="bandId" className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-muted-foreground" />
                Band ID
              </Label>
              <Input
                id="bandId"
                placeholder="e.g., NKM-ABC1234"
                value={bandId}
                onChange={(e) => setBandId(e.target.value.toUpperCase())}
                className="h-11 uppercase"
              />
            </div>
            <div className="flex gap-3">
              <Button type="button" variant="outline" className="flex-1" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="button" variant="gradient" className="flex-1" onClick={handleSearch}>
                Check Balance
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CheckBalanceModal;
