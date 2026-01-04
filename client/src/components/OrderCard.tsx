import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DiamondBalance } from "./DiamondBalance";
import { Package, CheckCircle2, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface OrderCardProps {
  order: any;
  showUserInfo?: boolean;
}

export function OrderCard({ order, showUserInfo = false }: OrderCardProps) {
  const isCompleted = order.status === "completed";

  return (
    <Card className="glass p-6 hover-elevate transition-all duration-300" data-testid={`card-order-${order.id}`}>
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 bg-muted/20 rounded-lg flex items-center justify-center flex-shrink-0">
          {order.product?.imageUrl ? (
            <img 
              src={order.product.imageUrl} 
              alt={order.product.name}
              className="w-full h-full object-cover rounded-lg"
            />
          ) : (
            <Package className="w-8 h-8 text-muted-foreground/30" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4 mb-2">
            <div>
              <h3 className="font-semibold text-lg" data-testid={`text-order-product-${order.id}`}>
                {order.product?.name || "Product"}
              </h3>
              {showUserInfo && order.user && (
                <p className="text-sm text-muted-foreground">
                  {order.user.email || `User ${order.userId.slice(0, 8)}`}
                </p>
              )}
            </div>
            <Badge 
              variant={isCompleted ? "default" : "secondary"}
              className="flex items-center gap-1"
              data-testid={`badge-order-status-${order.id}`}
            >
              {isCompleted ? (
                <CheckCircle2 className="w-3 h-3" />
              ) : (
                <Clock className="w-3 h-3" />
              )}
              {isCompleted ? "Completed" : "Pending"}
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <DiamondBalance balance={order.product?.price ?? 0} size="sm" />
            <span className="text-xs text-muted-foreground">
              {(() => {
                try {
                  if (!order.createdAt) return "just now";
                  const date = order.createdAt?.toDate ? order.createdAt.toDate() : new Date(order.createdAt);
                  if (isNaN(date.getTime())) return "just now";
                  return formatDistanceToNow(date, { addSuffix: true });
                } catch (e) {
                  return "just now";
                }
              })()}
            </span>
          </div>

          {isCompleted && order.completedAt && (
            <p className="text-sm text-green-600 dark:text-green-400 mt-2 flex items-center gap-2" data-testid={`text-delivery-message-${order.id}`}>
              <CheckCircle2 className="w-4 h-4" />
              Please check your hatch for your item
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}
