import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { useAuth } from "@/hooks/useAuth";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { OrderCompletionAlert } from "@/components/OrderCompletionAlert";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/Landing";
import Store from "@/pages/Store";
import Orders from "@/pages/Orders";
import Camera from "@/pages/Camera";
import UserManagement from "./pages/admin/UserManagement";
import ProductManagement from "./pages/admin/ProductManagement";
import OrderManagement from "./pages/admin/OrderManagement";
import CameraViewer from "./pages/admin/CameraViewer";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { db, doc, setDoc, getDoc } from "@/lib/firebase";
import { apiRequest } from "@/lib/queryClient";

function DiamondTimer() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.email || !user?.id) return;

    const interval = setInterval(async () => {
      const userDocRef = doc(db, "locked", user.email);
      // Read current balance from Firebase to avoid stale closure values
      const userDoc = await getDoc(userDocRef);
      const currentBalance = userDoc.exists() ? userDoc.data().diamondBalance || 0 : 0;
      const newBalance = currentBalance + 70;
      
      // Update Firebase
      await setDoc(userDocRef, {
        diamondBalance: newBalance
      }, { merge: true });
      
      // Sync to database
      try {
        await apiRequest("POST", "/api/sync-balance", { balance: newBalance });
      } catch (error) {
        console.error("Failed to sync balance to database:", error);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [user?.email, user?.id]);

  return null;
}

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Switch>
      {!isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <Route path="/" component={Store} />
          <Route path="/orders" component={Orders} />
          <Route path="/camera" component={Camera} />
          {/* Admin Routes */}
          <Route path="/admin/users" element={<ProtectedRoute adminOnly><UserManagement /></ProtectedRoute>} />
          <Route path="/admin/products" element={<ProtectedRoute adminOnly><ProductManagement /></ProtectedRoute>} />
          <Route path="/admin/orders" element={<ProtectedRoute adminOnly><OrderManagement /></ProtectedRoute>} />
          <Route path="/admin/camera" element={<ProtectedRoute adminOnly><CameraViewer /></ProtectedRoute>} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();
  const style = {
    "--sidebar-width": "20rem",
    "--sidebar-width-icon": "4rem",
  };

  if (isLoading || !isAuthenticated) {
    return (
      <TooltipProvider>
        <Router />
        <Toaster />
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <SidebarProvider style={style as React.CSSProperties}>
        <div className="flex h-screen w-full">
          <AppSidebar />
          <DiamondTimer />
          <div className="flex flex-col flex-1 overflow-hidden">
            <header className="flex items-center justify-between p-4 border-b glass sticky top-0 z-40">
              <SidebarTrigger data-testid="button-sidebar-toggle" />
            </header>
            <main className="flex-1 overflow-auto">
              <div className="w-full px-6">
                <Router />
              </div>
            </main>
          </div>
        </div>
      </SidebarProvider>
      <OrderCompletionAlert />
      <Toaster />
    </TooltipProvider>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AppContent />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;