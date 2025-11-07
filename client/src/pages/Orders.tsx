import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useEffect } from "react";
import { queryClient } from "@/lib/queryClient";
import { OrderCard } from "@/components/OrderCard";
import { Package, Loader2 } from "lucide-react";

export default function Orders() {
  const { user } = useAuth();
  const { lastMessage } = useWebSocket(user?.id);

  // Listen for WebSocket order updates
  useEffect(() => {
    if (lastMessage?.type === "order_update") {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      
      // Text-to-speech for completed orders
      if (lastMessage.status === "completed" && 'speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance("Please check your hatch for your item");
        utterance.rate = 0.9;
        utterance.pitch = 1.0;
        window.speechSynthesis.speak(utterance);
      }
    }
  }, [lastMessage]);

  const { data: orders, isLoading } = useQuery<any[]>({
    queryKey: ["/api/orders"],
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

  if (!orders || orders.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center glass p-12 rounded-lg max-w-md">
          <Package className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No Orders Yet</h3>
          <p className="text-muted-foreground">
            Start shopping to see your orders here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">My Orders</h1>
        <p className="text-muted-foreground">
          Track your purchases and delivery status.
        </p>
      </div>

      <div className="space-y-4">
        {orders.map((order) => (
          <OrderCard key={order.id} order={order} />
        ))}
      </div>
    </div>
  );
}
