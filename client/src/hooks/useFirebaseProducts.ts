import { useState, useEffect } from "react";
import { db, collection, onSnapshot, getDocs } from "@/lib/firebase";
import type { Product } from "@shared/schema";

export function useFirebaseProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const productsRef = collection(db, "products");
    
    // Initial load
    const loadProducts = async () => {
      try {
        const snapshot = await getDocs(productsRef);
        const productsList: Product[] = [];
        
        snapshot.forEach((doc) => {
          const data = doc.data();
          productsList.push({
            id: doc.id, // Document ID is the item name
            name: doc.id, // Document ID is the item name
            description: data.description || "",
            price: data.price || 0,
            imageUrl: data.imageUrl || undefined,
            createdAt: data.createdAt?.toDate() || new Date(),
          });
        });
        
        setProducts(productsList);
        setIsLoading(false);
      } catch (error) {
        console.error("Error loading products:", error);
        setIsLoading(false);
      }
    };

    loadProducts();

    // Set up real-time listener that also refreshes every 1 minute
    const unsubscribe = onSnapshot(productsRef, (snapshot) => {
      const productsList: Product[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        productsList.push({
          id: doc.id, // Document ID is the item name
          name: doc.id, // Document ID is the item name
          description: data.description || "",
          price: data.price || 0,
          imageUrl: data.imageUrl || undefined,
          createdAt: data.createdAt?.toDate() || new Date(),
        });
      });
      
      setProducts(productsList);
      setIsLoading(false);
    });

    // Also refresh every 1 minute as a backup
    const interval = setInterval(() => {
      loadProducts();
    }, 60000); // 1 minute

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  return { products, isLoading };
}

