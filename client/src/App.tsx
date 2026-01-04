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
import { Loader2, Timer } from "lucide-react";
import { useEffect, useState } from "react";
import { db, doc, onSnapshot, updateDoc, setDoc } from "@/lib/firebase";

function GameTimer() {
  const { user } = useAuth();
  const [gameState, setGameState] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, "settings", "game"), (docSnap) => {
      if (docSnap.exists()) {
        setGameState(docSnap.data());
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!gameState?.isActive) return;

    const interval = setInterval(async () => {
      if (user?.email) {
        const userDocRef = doc(db, "locked", user.email);
        await setDoc(userDocRef, {
          diamondBalance: (user.diamondBalance || 0) + 30
        }, { merge: true });
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [gameState?.isActive, user?.email, user?.diamondBalance]);

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
          <GameTimer />
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