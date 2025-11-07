import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DiamondBalance } from "./DiamondBalance";
import type { Product } from "@shared/schema";
import { Package } from "lucide-react";

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
      <div className="aspect-square bg-muted/20 flex items-center justify-center relative overflow-hidden">
        {product.imageUrl ? (
          <img 
            src={product.imageUrl} 
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <Package className="w-24 h-24 text-muted-foreground/30" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>
      
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
