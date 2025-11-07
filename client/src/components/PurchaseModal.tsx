import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { DiamondBalance } from "./DiamondBalance";
import type { Product } from "@shared/schema";
import { CheckCircle2, Package } from "lucide-react";
import { useEffect, useState } from "react";

interface PurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onConfirm: () => void;
  isPending: boolean;
  isSuccess: boolean;
  userBalance: number;
}

export function PurchaseModal({
  isOpen,
  onClose,
  product,
  onConfirm,
  isPending,
  isSuccess,
  userBalance,
}: PurchaseModalProps) {
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (isSuccess) {
      setShowSuccess(true);
      
      // Text-to-speech announcement
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance("Your item will arrive soon");
        utterance.rate = 0.9;
        utterance.pitch = 1.0;
        window.speechSynthesis.speak(utterance);
      }

      // Auto-close after 3 seconds
      const timer = setTimeout(() => {
        setShowSuccess(false);
        onClose();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [isSuccess, onClose]);

  if (!product) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="glass sm:max-w-md">
        {!showSuccess ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl">Confirm Purchase</DialogTitle>
              <DialogDescription>
                Review your order details before completing the purchase.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              <div className="flex items-start gap-4 p-4 glass rounded-lg">
                <div className="w-20 h-20 bg-muted/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  {product.imageUrl ? (
                    <img 
                      src={product.imageUrl} 
                      alt={product.name}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <Package className="w-10 h-10 text-muted-foreground/30" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-1">{product.name}</h3>
                  <DiamondBalance balance={product.price} size="sm" />
                </div>
              </div>

              <div className="space-y-2 p-4 bg-muted/5 rounded-lg">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Current Balance</span>
                  <DiamondBalance balance={userBalance} size="sm" />
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Item Cost</span>
                  <DiamondBalance balance={product.price} size="sm" />
                </div>
                <div className="h-px bg-border my-2" />
                <div className="flex justify-between font-semibold">
                  <span>New Balance</span>
                  <DiamondBalance balance={userBalance - product.price} size="sm" />
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={isPending}
                className="flex-1"
                data-testid="button-cancel-purchase"
              >
                Cancel
              </Button>
              <Button
                onClick={onConfirm}
                disabled={isPending}
                className="flex-1 apple-press"
                data-testid="button-confirm-purchase"
              >
                {isPending ? "Processing..." : "Confirm Purchase"}
              </Button>
            </div>
          </>
        ) : (
          <div className="py-12 text-center animate-in fade-in zoom-in duration-500">
            <div className="mb-6 flex justify-center">
              <CheckCircle2 className="w-20 h-20 text-green-500 animate-in zoom-in duration-500" />
            </div>
            <h3 className="text-2xl font-bold mb-2">Purchase Successful!</h3>
            <p className="text-lg text-muted-foreground mb-6" data-testid="text-order-confirmation">
              Your item will arrive soon
            </p>
            <div className="glass p-4 rounded-lg inline-block">
              <p className="text-sm text-muted-foreground">Track your order in the sidebar</p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
