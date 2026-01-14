import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserPlus, CheckCircle, Smartphone, User, Lock } from 'lucide-react';
import { NFCUser } from '@/types/nfc';
import { useToast } from '@/hooks/use-toast';

interface RegisterUserModalProps {
  open: boolean;
  onClose: () => void;
  onRegister: (name: string, phone: string, pin: string) => Promise<NFCUser | undefined>;
}

const RegisterUserModal = ({ open, onClose, onRegister }: RegisterUserModalProps) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [registeredUser, setRegisteredUser] = useState<NFCUser | null>(null);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !phone.trim() || !pin.trim()) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all fields',
        variant: 'destructive',
      });
      return;
    }

    if (!/^\d{10}$/.test(phone)) {
      toast({
        title: 'Invalid Phone Number',
        description: 'Please enter a valid 10-digit phone number',
        variant: 'destructive',
      });
      return;
    }

    if (!/^\d{4}$/.test(pin)) {
      toast({
        title: 'Invalid PIN',
        description: 'Please enter a valid 4-digit PIN',
        variant: 'destructive',
      });
      return;
    }

    const newUser = await onRegister(name, phone, pin);
    if (newUser) {
      setRegisteredUser(newUser);

      toast({
        title: 'User Registered Successfully!',
        description: `Band ID: ${newUser.bandId}`,
      });
    }
  };

  const handleClose = () => {
    setName('');
    setPhone('');
    setPin('');
    setRegisteredUser(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-primary" />
            Register New User
          </DialogTitle>
          <DialogDescription>
            Create a new user and assign an NFC band
          </DialogDescription>
        </DialogHeader>

        {registeredUser ? (
          <div className="py-6 text-center animate-scale-in">
            <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-success" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Registration Successful!</h3>
            <div className="bg-secondary rounded-lg p-4 mt-4 text-left space-y-2">
              <p className="text-sm"><span className="text-muted-foreground">Name:</span> {registeredUser.name}</p>
              <p className="text-sm"><span className="text-muted-foreground">Phone:</span> {registeredUser.phone}</p>
              <p className="text-sm font-medium">
                <span className="text-muted-foreground">Band ID:</span>{' '}
                <span className="text-primary">{registeredUser.bandId}</span>
              </p>
            </div>
            <Button className="mt-6" onClick={handleClose}>
              Done
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground" />
                Full Name
              </Label>
              <Input
                id="name"
                placeholder="Enter full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-muted-foreground" />
                Phone Number
              </Label>
              <Input
                id="phone"
                placeholder="10-digit mobile number"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pin" className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-muted-foreground" />
                Set 4-Digit PIN
              </Label>
              <Input
                id="pin"
                type="password"
                placeholder="Enter 4-digit PIN"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                maxLength={4}
                className="h-11 tracking-widest"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" variant="gradient" className="flex-1">
                Register & Assign Band
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default RegisterUserModal;
