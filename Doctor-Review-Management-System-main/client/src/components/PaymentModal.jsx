import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { useToast } from './ui/use-toast';
import api from '../utils/api';
import { CreditCard, CheckCircle2 } from 'lucide-react';

const PaymentModal = ({ open, onOpenChange, appointment, doctor, onSuccess }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [paymentIntent, setPaymentIntent] = useState(null);
  const [paid, setPaid] = useState(false);

  useEffect(() => {
    if (open && appointment && !paid) {
      createPaymentIntent();
    }
  }, [open, appointment]);

  const createPaymentIntent = async () => {
    setLoading(true);
    try {
      const response = await api.post('/payments/create-intent', {
        appointmentId: appointment._id,
      });

      if (response.data.success) {
        setPaymentIntent(response.data.data);
        if (response.data.data.mock) {
          // Mock payment for development
          handleMockPayment();
        }
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.message || 'Failed to initialize payment',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMockPayment = async () => {
    // Simulate payment processing
    setTimeout(async () => {
      try {
        await api.post('/payments/confirm', {
          paymentId: paymentIntent.paymentId,
        });
        setPaid(true);
        toast({
          variant: "success",
          title: "Payment Successful!",
          description: "Your appointment is confirmed",
        });
        if (onSuccess) onSuccess();
        setTimeout(() => {
          onOpenChange(false);
          setPaid(false);
        }, 2000);
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Payment confirmation failed",
        });
      }
    }, 1500);
  };

  const handleStripePayment = async () => {
    // Real Stripe integration would go here
    // For now, we'll use mock payment
    handleMockPayment();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Complete Payment</DialogTitle>
          <DialogDescription>
            Pay for your appointment with Dr. {doctor?.name}
          </DialogDescription>
        </DialogHeader>

        {paid ? (
          <div className="text-center py-8">
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <p className="text-lg font-semibold">Payment Successful!</p>
            <p className="text-sm text-muted-foreground mt-2">
              Your appointment is confirmed
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-muted p-4 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-muted-foreground">Appointment Fee</span>
                <span className="text-2xl font-bold">₹{doctor?.fees}</span>
              </div>
            </div>

            {paymentIntent?.mock ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground text-center">
                  Development Mode: Mock Payment
                </p>
                <Button
                  onClick={handleMockPayment}
                  disabled={loading}
                  className="w-full"
                  size="lg"
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  {loading ? 'Processing...' : 'Complete Payment (Mock)'}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Stripe payment integration would be implemented here
                </p>
                <Button
                  onClick={handleStripePayment}
                  disabled={loading}
                  className="w-full"
                  size="lg"
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  {loading ? 'Processing...' : 'Pay with Stripe'}
                </Button>
              </div>
            )}

            <p className="text-xs text-center text-muted-foreground">
              Your payment is secure and encrypted
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PaymentModal;

