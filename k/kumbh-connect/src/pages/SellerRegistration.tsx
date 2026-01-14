import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Store, User, Phone, Lock, ArrowRight, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Link, useNavigate } from 'react-router-dom';

const SellerRegistration = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        business_name: '',
        phone: '',
        pin: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        if (formData.pin.length !== 4) {
            toast({
                title: "Invalid PIN",
                description: "PIN must be exactly 4 digits",
                variant: "destructive"
            });
            setLoading(false);
            return;
        }

        try {
            const response = await fetch('/api/sellers/register/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                toast({
                    title: "Registration Successful",
                    description: "You can now login with your PIN",
                });
                navigate('/seller');
            } else {
                const errorData = await response.json();
                const errorMessage = Object.values(errorData).flat().join(', ');
                toast({
                    title: "Registration Failed",
                    description: errorMessage || "Something went wrong",
                    variant: "destructive"
                });
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to connect to server",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Helmet>
                <title>Seller Registration | Kumbh Pay</title>
                <meta name="description" content="Register as a new seller for Kumbh Pay" />
            </Helmet>

            <div className="min-h-screen bg-background flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />

                <Card className="w-full max-w-md relative border-border">
                    <CardHeader className="text-center">
                        <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                            <Store className="w-7 h-7 text-primary" />
                        </div>
                        <CardTitle className="font-display text-2xl">Seller Registration</CardTitle>
                        <CardDescription>Create a new seller account to accept payments</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Full Name</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input
                                        name="name"
                                        placeholder="John Doe"
                                        value={formData.name}
                                        onChange={handleChange}
                                        className="pl-10"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Business Name</label>
                                <div className="relative">
                                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input
                                        name="business_name"
                                        placeholder="John's Shop"
                                        value={formData.business_name}
                                        onChange={handleChange}
                                        className="pl-10"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Phone Number</label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input
                                        name="phone"
                                        type="tel"
                                        placeholder="9876543210"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        className="pl-10"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Set 4-Digit PIN</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input
                                        name="pin"
                                        type="password"
                                        inputMode="numeric"
                                        maxLength={4}
                                        placeholder="****"
                                        value={formData.pin}
                                        onChange={(e) => {
                                            const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                                            setFormData(prev => ({ ...prev, pin: val }));
                                        }}
                                        className="pl-10 tracking-widest"
                                        required
                                    />
                                </div>
                            </div>

                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? "Registering..." : "Register Shop"}
                            </Button>

                            <div className="mt-4 pt-4 border-t border-border text-center">
                                <Link to="/seller" className="text-sm text-muted-foreground hover:text-primary flex items-center justify-center">
                                    Already have an account? Login
                                    <ArrowRight className="w-4 h-4 ml-1" />
                                </Link>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </>
    );
};

export default SellerRegistration;
