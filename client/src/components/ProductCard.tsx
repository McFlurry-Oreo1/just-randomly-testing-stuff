import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DiamondBalance } from "./DiamondBalance";
import type { Product } from "@shared/schema";

interface ProductCardProps {
  product: Product;
  onPurchase: (product: Product) => void;
  userBalance: number;
  isPending?: boolean;
}

export function ProductCard({ product, onPurchase, userBalance, isPending = false }: ProductCardProps) {
  const canAfford = userBalance >= product.price;

  return (
    <Card className="glass overflow-hidden hover-elevate transition-all duration-300 group" data-testid={`card-product-${product.id}`}>
      <div className="p-6">
        <h3 className="text-xl font-semibold mb-2" data-testid={`text-product-name-${product.id}`}>
          {product.name}
        </h3>
        
        {product.description && (
          <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
            {product.description}
          </p>
        )}
        
        <div className="flex items-center justify-between mb-4">
          <DiamondBalance balance={product.price} size="md" />
        </div>
        
        <Button 
          onClick={() => onPurchase(product)}
          disabled={!canAfford || isPending}
          className="w-full apple-press"
          variant={canAfford ? "default" : "secondary"}
          data-testid={`button-purchase-${product.id}`}
        >
          {isPending ? "Processing..." : canAfford ? "Purchase" : "Insufficient Diamonds"}
        </Button>
      </div>
    </Card>
  );
}
