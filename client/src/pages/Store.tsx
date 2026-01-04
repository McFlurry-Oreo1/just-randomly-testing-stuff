import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { Product, Order } from "@shared/schema";
import { ProductCard } from "@/components/ProductCard";
import { PurchaseModal } from "@/components/PurchaseModal";
import { Button } from "@/components/ui/button";
import { Package, Loader2 } from "lucide-react";
import applePaySound from "@assets/applepay_1762562188782.mp3";
import { db, collection, addDoc, serverTimestamp, doc, setDoc } from "@/lib/firebase";

export default function Store() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const applePayAudioRef = useRef<HTMLAudioElement | null>(null);

  const { data: products, isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const purchaseMutation = useMutation({
    mutationFn: async (productId: string) => {
      // First call backend to process and record in PG
      const response = await apiRequest("POST", "/api/purchase", { productId });
      
      // Then sync to Firebase for instant admin visibility
      if (user?.email && selectedProduct) {
        const orderData = {
          userId: user.id,
          email: user.email,
          productId: selectedProduct.id,
          productName: selectedProduct.name,
          price: selectedProduct.price,
          status: "pending",
          createdAt: serverTimestamp(),
          userName: `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email
        };

        // Add to main global orders collection for admin
        await addDoc(collection(db, "orders"), orderData);
        
        // Update user's diamond balance in Firebase
        const userDocRef = doc(db, "locked", user.email);
        await setDoc(userDocRef, {
          diamondBalance: user.diamondBalance - selectedProduct.price
        }, { merge: true });
      }
      
      return response;
    },
    onSuccess: () => {
      if (applePayAudioRef.current) {
        applePayAudioRef.current.play().catch(console.error);
      }
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Purchase Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handlePurchase = (product: Product) => {
    setSelectedProduct(product);
    setIsPurchaseModalOpen(true);
  };

  const handleConfirmPurchase = () => {
    if (selectedProduct) {
      purchaseMutation.mutate(selectedProduct.id);
    }
  };

  const handleCloseModal = () => {
    setIsPurchaseModalOpen(false);
    setTimeout(() => {
      setSelectedProduct(null);
      purchaseMutation.reset();
    }, 300);
  };

  if (productsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading products...</p>
        </div>
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center glass p-12 rounded-lg max-w-md">
          <Package className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No Products Available</h3>
          <p className="text-muted-foreground mb-6">
            Check back soon for new items in our collection.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8">
      <audio ref={applePayAudioRef} src={applePaySound} preload="auto" />
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Premium Collection</h1>
        <p className="text-muted-foreground">
          Discover our exclusive items available for purchase with diamonds.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onPurchase={handlePurchase}
            userBalance={user?.diamondBalance ?? 0}
            isPending={purchaseMutation.isPending && selectedProduct?.id === product.id}
          />
        ))}
      </div>

      <PurchaseModal
        isOpen={isPurchaseModalOpen}
        onClose={handleCloseModal}
        product={selectedProduct}
        onConfirm={handleConfirmPurchase}
        isPending={purchaseMutation.isPending}
        isSuccess={purchaseMutation.isSuccess}
        userBalance={user?.diamondBalance ?? 0}
      />
    </div>
  );
}
