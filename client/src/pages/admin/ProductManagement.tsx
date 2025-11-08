
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { useState } from "react";
import { Package, Loader2, Plus, Edit, Trash2, Save, X } from "lucide-react";
import type { Product } from "@shared/schema";
import { DiamondBalance } from "@/components/DiamondBalance";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ProductFormData {
  name: string;
  description: string;
  price: number;
  imageUrl: string;
}

export default function ProductManagement() {
  const { toast } = useToast();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<ProductFormData>({
    name: "",
    description: "",
    price: 0,
    imageUrl: "",
  });

  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const createProductMutation = useMutation({
    mutationFn: async (data: ProductFormData) => {
      return await apiRequest("POST", "/api/admin/products", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "Success",
        description: "Product created successfully",
      });
      setIsCreateModalOpen(false);
      resetForm();
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
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ProductFormData }) => {
      return await apiRequest("PUT", `/api/admin/products/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "Success",
        description: "Product updated successfully",
      });
      setEditingProduct(null);
      resetForm();
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
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (productId: string) => {
      return await apiRequest("DELETE", `/api/admin/products/${productId}`, undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "Success",
        description: "Product deleted successfully",
      });
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
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      price: 0,
      imageUrl: "",
    });
  };

  const handleCreateProduct = () => {
    if (!formData.name || formData.price <= 0) {
      toast({
        title: "Validation Error",
        description: "Name and price (greater than 0) are required",
        variant: "destructive",
      });
      return;
    }
    createProductMutation.mutate(formData);
  };

  const handleUpdateProduct = () => {
    if (!editingProduct) return;
    if (!formData.name || formData.price <= 0) {
      toast({
        title: "Validation Error",
        description: "Name and price (greater than 0) are required",
        variant: "destructive",
      });
      return;
    }
    updateProductMutation.mutate({ id: editingProduct.id, data: formData });
  };

  const handleEditClick = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || "",
      price: product.price,
      imageUrl: product.imageUrl || "",
    });
  };

  const handleDeleteClick = (product: Product) => {
    if (confirm(`Are you sure you want to delete "${product.name}"?`)) {
      deleteProductMutation.mutate(product.id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2">Product Management</h1>
          <p className="text-muted-foreground">
            Create, edit, and manage products in the store.
          </p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)} data-testid="button-create-product">
          <Plus className="w-4 h-4 mr-2" />
          Create Product
        </Button>
      </div>

      {!products || products.length === 0 ? (
        <div className="text-center glass p-12 rounded-lg max-w-md mx-auto">
          <Package className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No Products</h3>
          <p className="text-muted-foreground mb-6">Create your first product to get started.</p>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Product
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <Card key={product.id} className="glass overflow-hidden" data-testid={`card-product-${product.id}`}>
              <div className="aspect-square bg-muted/20 flex items-center justify-center relative overflow-hidden">
                {product.imageUrl ? (
                  <img 
                    src={product.imageUrl} 
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Package className="w-24 h-24 text-muted-foreground/30" />
                )}
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
                
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleEditClick(product)}
                    variant="outline"
                    className="flex-1"
                    data-testid={`button-edit-${product.id}`}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    onClick={() => handleDeleteClick(product)}
                    variant="destructive"
                    size="icon"
                    disabled={deleteProductMutation.isPending}
                    data-testid={`button-delete-${product.id}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create Product Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Product</DialogTitle>
            <DialogDescription>
              Add a new product to the store.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Product Name *</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Premium Luxury Chair"
                data-testid="input-product-name"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Description</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="An exquisite handcrafted chair..."
                rows={3}
                data-testid="input-product-description"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Price (Diamonds) *</label>
              <Input
                type="number"
                value={formData.price || ""}
                onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })}
                placeholder="500"
                min="1"
                data-testid="input-product-price"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Image URL</label>
              <Input
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                placeholder="https://example.com/image.jpg"
                data-testid="input-product-image"
              />
            </div>
          </div>
          
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateModalOpen(false);
                resetForm();
              }}
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={handleCreateProduct}
              disabled={createProductMutation.isPending}
              data-testid="button-submit-create"
            >
              <Save className="w-4 h-4 mr-2" />
              Create Product
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Product Modal */}
      <Dialog open={!!editingProduct} onOpenChange={(open) => !open && setEditingProduct(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
            <DialogDescription>
              Update product details.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Product Name *</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Premium Luxury Chair"
                data-testid="input-edit-product-name"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Description</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="An exquisite handcrafted chair..."
                rows={3}
                data-testid="input-edit-product-description"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Price (Diamonds) *</label>
              <Input
                type="number"
                value={formData.price || ""}
                onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })}
                placeholder="500"
                min="1"
                data-testid="input-edit-product-price"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Image URL</label>
              <Input
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                placeholder="https://example.com/image.jpg"
                data-testid="input-edit-product-image"
              />
            </div>
          </div>
          
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setEditingProduct(null);
                resetForm();
              }}
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={handleUpdateProduct}
              disabled={updateProductMutation.isPending}
              data-testid="button-submit-edit"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
