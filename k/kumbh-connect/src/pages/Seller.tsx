import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { CreditCard, IndianRupee, CheckCircle, XCircle, Store, Lock, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from '@/components/ui/badge';
import { useNFCStore } from '@/hooks/useNFCStore';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Link, useNavigate } from 'react-router-dom';

// Removed hardcoded PIN

import { useScanPolling } from '@/hooks/useScanPolling';

const Seller = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [phone, setPhone] = useState('');
  const [sellerId, setSellerId] = useState<string | null>(null);

  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [bandId, setBandId] = useState('');
  const [amount, setAmount] = useState('');
  const [userPin, setUserPin] = useState('');
  const [isPinDialogOpen, setIsPinDialogOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [lastTransaction, setLastTransaction] = useState<{
    success: boolean;
    amount: number;
    bandId: string;
    newBalance: number;
  } | null>(null);

  const { getUserByBandId, deductBalance } = useNFCStore();
  const { toast } = useToast();

  // Auto-fill Band ID from ESP32 Scan
  useScanPolling(isAuthenticated, (scannedBandId) => {
    if (isAuthenticated && !isPinDialogOpen && !processing) {
      setBandId(scannedBandId);
      toast({
        title: "Band Scanned",
        description: `Band ID: ${scannedBandId} detected`,
      });
    }
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/sellers/login/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, pin })
      });
      if (response.ok) {
        const data = await response.json();
        setIsAuthenticated(true);
        setSellerId(data.id); // Store ID
        setError('');
        toast({
          title: "Login Successful",
          description: `Welcome back, ${data.business_name}`
        });
      } else {
        const err = await response.json();
        setError(err.error || 'Login failed');
      }
    } catch (e) {
      setError('Connection failed');
    }
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bandId.trim() || !amount.trim() || !userPin.trim()) return;

    const paymentAmount = parseFloat(amount);
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      toast({
        title: 'Invalid Amount',
        description: 'Please enter a valid payment amount',
        variant: 'destructive',
      });
      return;
    }

    if (userPin.length !== 4) {
      toast({
        title: 'Invalid PIN',
        description: 'Please enter a 4-digit PIN',
        variant: 'destructive',
      });
      return;
    }

    setProcessing(true);

    // Simulate NFC scan delay - Optional
    // await new Promise(resolve => setTimeout(resolve, 800));

    const user = getUserByBandId(bandId);

    // Optimistic check (Backend will also verify)
    if (user && user.isBlocked) {
      // ... existing blocked checks
    }

    // Process payment directly
    // Process payment directly
    const success = await deductBalance(bandId, paymentAmount, 'Payment at seller terminal', userPin, sellerId);

    if (success) {
      // If payment was consistent, we can assume balance updated. 
      // Ideally deductBalance should return the new balance or we re-fetch.
      // For now we do a simple calc if user exists locally
      const currentUser = getUserByBandId(bandId); // Re-fetch from store which might have been updated
      const newBalance = currentUser ? currentUser.balance : (user ? user.balance - paymentAmount : 0);

      setLastTransaction({ success: true, amount: paymentAmount, bandId, newBalance });
      toast({
        title: 'Payment Successful',
        description: `₹${paymentAmount.toLocaleString()} received.`,
      });
      // Reset form
      setBandId('');
      setAmount('');
      setUserPin('');
    } else {
      setLastTransaction({ success: false, amount: paymentAmount, bandId, newBalance: user ? user.balance : 0 });
    }
    setProcessing(false);
  };

  const quickAmounts = [50, 100, 200, 500, 1000];

  if (!isAuthenticated) {
    return (
      <>
        <Helmet>
          <title>Seller Login | Kumbh Pay</title>
          <meta name="description" content="Seller terminal login for Kumbh Pay NFC payment system" />
        </Helmet>

        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />

          <Card className="w-full max-w-md relative border-border">
            <CardHeader className="text-center">
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                <Store className="w-7 h-7 text-primary" />
              </div>
              <CardTitle className="font-display text-2xl">Seller Login</CardTitle>
              <CardDescription>Enter your PIN to access payment mode</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <div className="relative">
                    <Input
                      type="tel"
                      placeholder="Phone Number"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="pl-4"
                      required
                    />
                  </div>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="password"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={4}
                    placeholder="Enter 4-digit PIN"
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                    className="pl-10 text-center text-2xl tracking-widest"
                  />
                </div>
                {error && (
                  <p className="text-destructive text-sm text-center">{error}</p>
                )}
                <Button type="submit" className="w-full" disabled={pin.length !== 4 || !phone}>
                  <Lock className="w-4 h-4 mr-2" />
                  Access Terminal
                </Button>
              </form>

              <div className="mt-6 pt-4 border-t border-border">
                <Link to="/admin">
                  <Button variant="ghost" className="w-full text-muted-foreground">
                    Go to Band Management
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>

                <Link to="/seller/register" className="mt-4 block">
                  <Button variant="link" className="w-full text-xs text-muted-foreground hover:text-primary">
                    Don't have an account? Register new shop
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Accept Payment | Kumbh Pay</title>
        <meta name="description" content="Accept NFC band payments at your seller terminal" />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Store className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="font-display font-bold text-lg">Kumbh Pay</h1>
                <p className="text-xs text-muted-foreground">Seller Terminal</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link to="/admin">
                <Button variant="outline" size="sm">
                  Band Management
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsAuthenticated(false);
                  setPin('');
                }}
              >
                <Lock className="w-4 h-4 mr-2" />
                Lock
              </Button>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto space-y-6">
            {/* Payment Form */}
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CreditCard className="w-5 h-5 text-primary" />
                  Accept Payment
                </CardTitle>
                <CardDescription>
                  Scan NFC band or enter band ID to receive payment
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePayment} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Band ID</label>
                    <div className="relative">
                      <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="NKM-XXXXXXX"
                        value={bandId}
                        onChange={(e) => setBandId(e.target.value.toUpperCase())}
                        className="pl-10 uppercase"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Amount (₹)</label>
                    <div className="relative">
                      <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        type="number"
                        placeholder="Enter amount"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="pl-10 text-xl font-bold"
                        min="1"
                      />
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {quickAmounts.map((amt) => (
                        <Button
                          key={amt}
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setAmount(amt.toString())}
                          className={cn(amount === amt.toString() && 'border-primary bg-primary/5')}
                        >
                          ₹{amt}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Customer PIN</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        type="password"
                        inputMode="numeric"
                        maxLength={4}
                        placeholder="0000"
                        value={userPin}
                        onChange={(e) => setUserPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        className="pl-10 text-xl tracking-widest font-bold"
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    size="lg"
                    className="w-full"
                    disabled={!bandId.trim() || !amount.trim() || userPin.length !== 4 || processing}
                  >
                    {processing ? (
                      <>
                        <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <IndianRupee className="w-5 h-5 mr-2" />
                        Accept Payment
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Last Transaction */}
            {lastTransaction && (
              <Card className={cn(
                'animate-slide-in-right border-2',
                lastTransaction.success ? 'border-success/50 bg-success/5' : 'border-destructive/50 bg-destructive/5'
              )}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      'w-12 h-12 rounded-full flex items-center justify-center',
                      lastTransaction.success ? 'bg-success/20' : 'bg-destructive/20'
                    )}>
                      {lastTransaction.success ? (
                        <CheckCircle className="w-6 h-6 text-success" />
                      ) : (
                        <XCircle className="w-6 h-6 text-destructive" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className={cn(
                        'font-bold text-lg',
                        lastTransaction.success ? 'text-success' : 'text-destructive'
                      )}>
                        {lastTransaction.success ? 'Payment Successful' : 'Payment Failed'}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Band: {lastTransaction.bandId}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">₹{lastTransaction.amount.toLocaleString()}</p>
                      {lastTransaction.success && (
                        <Badge variant="secondary">
                          Balance: ₹{lastTransaction.newBalance.toLocaleString()}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Seller;
