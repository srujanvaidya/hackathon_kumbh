import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Wallet, IndianRupee, CreditCard, CheckCircle } from 'lucide-react';
import { NFCUser } from '@/types/nfc';
import { useToast } from '@/hooks/use-toast';

import { useScanPolling } from '@/hooks/useScanPolling';

interface FundBandModalProps {
  open: boolean;
  onClose: () => void;
  onFund: (bandId: string, amount: number) => void;
  getUserByBandId: (bandId: string) => NFCUser | undefined;
}

const quickAmounts = [500, 1000, 2000, 5000];

const FundBandModal = ({ open, onClose, onFund, getUserByBandId }: FundBandModalProps) => {
  const [bandId, setBandId] = useState('');
  const [amount, setAmount] = useState('');
  const [foundUser, setFoundUser] = useState<NFCUser | null>(null);
  const [success, setSuccess] = useState(false);
  const { toast } = useToast();

  // Auto-fill Band ID from ESP32 Scan
  useScanPolling(open, (scannedBandId) => {
    if (open) { // Only update if modal is open
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
      if (user.isBlocked) {
        toast({
          title: 'Band is Blocked',
          description: 'This band cannot receive funds',
          variant: 'destructive',
        });
        return;
      }
      setFoundUser(user);
    } else {
      toast({
        title: 'Band Not Found',
        description: 'Please check the Band ID and try again',
        variant: 'destructive',
      });
    }
  };

  const handleFund = () => {
    const numAmount = parseInt(amount);
    if (!numAmount || numAmount <= 0) {
      toast({
        title: 'Invalid Amount',
        description: 'Please enter a valid amount',
        variant: 'destructive',
      });
      return;
    }

    onFund(bandId, numAmount);
    setSuccess(true);
    toast({
      title: 'Funds Added Successfully!',
      description: `₹${numAmount} added to ${foundUser?.name}'s band`,
    });
  };

  const handleClose = () => {
    setBandId('');
    setAmount('');
    setFoundUser(null);
    setSuccess(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl flex items-center gap-2">
            <Wallet className="w-5 h-5 text-primary" />
            Fund NFC Band
          </DialogTitle>
          <DialogDescription>
            Add money to an NFC band
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="py-6 text-center animate-scale-in">
            <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-success" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Payment Successful!</h3>
            <p className="text-muted-foreground">
              ₹{amount} has been added to the band
            </p>
            <div className="bg-secondary rounded-lg p-4 mt-4">
              <p className="text-sm text-muted-foreground">New Balance</p>
              <p className="text-2xl font-bold text-success">
                ₹{Math.floor((foundUser?.balance || 0) + parseInt(amount))}
              </p>
            </div>
            <Button className="mt-6" onClick={handleClose}>
              Done
            </Button>
          </div>
        ) : foundUser ? (
          <div className="space-y-4 py-4 animate-fade-in">
            <div className="bg-secondary rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-1">Adding funds for</p>
              <p className="font-semibold">{foundUser.name}</p>
              <p className="text-sm text-muted-foreground">{foundUser.bandId}</p>
              <p className="text-sm mt-2">
                Current Balance: <span className="font-semibold text-primary">₹{Math.floor(foundUser.balance)}</span>
              </p>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <IndianRupee className="w-4 h-4 text-muted-foreground" />
                Enter Amount
              </Label>
              <Input
                type="number"
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="h-12 text-lg"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {quickAmounts.map((amt) => (
                <Button
                  key={amt}
                  type="button"
                  variant={amount === String(amt) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setAmount(String(amt))}
                >
                  ₹{amt}
                </Button>
              ))}
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setFoundUser(null)}>
                Back
              </Button>
              <Button type="button" variant="gradient" className="flex-1" onClick={handleFund}>
                Add Funds
              </Button>
            </div>
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
                Find Band
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default FundBandModal;
