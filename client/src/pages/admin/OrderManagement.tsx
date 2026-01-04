import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Button } from "@/components/ui/button";
import { OrderCard } from "@/components/OrderCard";
import { Package, Loader2, CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";
import { db, collection, query, orderBy, onSnapshot, doc, setDoc } from "@/lib/firebase";

export default function OrderManagement() {
  const { toast } = useToast();
  const [firebaseOrders, setFirebaseOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const orders: any[] = [];
      querySnapshot.forEach((doc) => {
        orders.push({ id: doc.id, ...doc.data() });
      });
      setFirebaseOrders(orders);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const completeOrderMutation = useMutation({
    mutationFn: async (orderId: string) => {
      // Update Firebase first for instant feedback
      const orderRef = doc(db, "orders", orderId);
      await setDoc(orderRef, { status: "completed" }, { merge: true });
      
      // Then sync to backend if needed (optional since we're relying on Firebase now)
      try {
        await apiRequest("POST", `/api/admin/orders/${orderId}/complete`, undefined);
      } catch (e) {
        console.error("Failed to sync status to backend", e);
      }
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Order marked as completed",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading orders...</p>
        </div>
      </div>
    );
  }

  const pendingOrders = firebaseOrders.filter(o => o.status === "pending");
  const completedOrders = firebaseOrders.filter(o => o.status === "completed");

  return (
    <div className="py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Order Management</h1>
        <p className="text-muted-foreground">
          Process and track customer orders.
        </p>
      </div>

      {/* Pending Orders */}
      <div className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Pending Deliveries</h2>
        {pendingOrders.length === 0 ? (
          <div className="text-center glass p-12 rounded-lg">
            <Package className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Pending Orders</h3>
            <p className="text-muted-foreground">All orders have been completed.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingOrders.map((order) => (
              <div key={order.id} className="relative">
                <OrderCard order={order} showUserInfo />
                <div className="mt-3 flex justify-end">
                  <Button
                    onClick={() => completeOrderMutation.mutate(order.id)}
                    disabled={completeOrderMutation.isPending}
                    className="apple-press"
                    data-testid={`button-complete-order-${order.id}`}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Mark Completed
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Completed Orders */}
      {completedOrders.length > 0 && (
        <div>
          <h2 className="text-2xl font-semibold mb-4">Completed Orders</h2>
          <div className="space-y-4 opacity-60">
            {completedOrders.map((order) => (
              <OrderCard key={order.id} order={order} showUserInfo />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
