import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DiamondIcon } from "@/components/DiamondIcon";
import { Sparkles, ShoppingBag, Shield, Loader2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Landing() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const { toast } = useToast();

  const loginMutation = useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      return await apiRequest("POST", "/api/auth/login", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
    onError: (error: any) => {
      toast({
        title: "Login Failed",
        description: error.message || "Invalid email or password",
        variant: "destructive",
      });
    },
  });

  const signupMutation = useMutation({
    mutationFn: async (data: { email: string; password: string; firstName?: string; lastName?: string }) => {
      return await apiRequest("POST", "/api/auth/signup", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
    onError: (error: any) => {
      toast({
        title: "Signup Failed",
        description: error.message || "Failed to create account",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isLogin) {
      loginMutation.mutate({ email, password });
    } else {
      signupMutation.mutate({ email, password, firstName, lastName });
    }
  };

  const isPending = loginMutation.isPending || signupMutation.isPending;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DiamondIcon className="w-8 h-8" withShimmer />
            <span className="text-2xl font-bold gradient-text">Diamond Store</span>
          </div>
        </div>
      </header>

      <div className="pt-24 pb-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left Side - Hero */}
            <div className="order-2 md:order-1">
              <div className="mb-8">
                <div className="diamond-shimmer diamond-glow p-6 rounded-full glass inline-block mb-6">
                  <DiamondIcon className="w-16 h-16" />
                </div>
              </div>
              
              <h1 className="text-5xl md:text-6xl font-bold mb-6 tracking-tight">
                Shop with <span className="gradient-text">Diamonds</span>
              </h1>
              
              <p className="text-xl text-muted-foreground mb-8">
                Experience premium shopping with our exclusive diamond currency system. 
                Elegant design meets seamless functionality.
              </p>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Sparkles className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Diamond Currency</h3>
                    <p className="text-sm text-muted-foreground">Real-time balance updates and secure transactions</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <ShoppingBag className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Premium Products</h3>
                    <p className="text-sm text-muted-foreground">Curated collection of exclusive items</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Shield className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Secure & Fast</h3>
                    <p className="text-sm text-muted-foreground">Live order tracking and instant delivery</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side - Auth Form */}
            <div className="order-1 md:order-2">
              <Card className="glass">
                <CardHeader>
                  <CardTitle className="text-2xl">{isLogin ? "Welcome Back" : "Create Account"}</CardTitle>
                  <CardDescription>
                    {isLogin 
                      ? "Sign in to access your diamond store account" 
                      : "Join our exclusive diamond shopping experience"
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {!isLogin && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="firstName">First Name</Label>
                          <Input
                            id="firstName"
                            type="text"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            placeholder="John"
                            data-testid="input-firstname"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="lastName">Last Name</Label>
                          <Input
                            id="lastName"
                            type="text"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            placeholder="Doe"
                            data-testid="input-lastname"
                          />
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your@email.com"
                        required
                        data-testid="input-email"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        minLength={6}
                        data-testid="input-password"
                      />
                      {!isLogin && (
                        <p className="text-xs text-muted-foreground">
                          Password must be at least 6 characters
                        </p>
                      )}
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={isPending}
                      data-testid="button-submit"
                    >
                      {isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          {isLogin ? "Signing in..." : "Creating account..."}
                        </>
                      ) : (
                        isLogin ? "Sign In" : "Create Account"
                      )}
                    </Button>

                    <div className="text-center pt-4">
                      <button
                        type="button"
                        onClick={() => setIsLogin(!isLogin)}
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                        data-testid="button-toggle-mode"
                      >
                        {isLogin 
                          ? "Don't have an account? Sign up" 
                          : "Already have an account? Sign in"
                        }
                      </button>
                    </div>

                    {isLogin && (
                      <div className="mt-6 p-4 glass rounded-lg">
                        <p className="text-sm font-semibold mb-2">Demo Accounts:</p>
                        <div className="text-xs text-muted-foreground space-y-1">
                          <p><strong>Admin:</strong> admin@example.com / admin123</p>
                          <p><strong>User:</strong> user@example.com / user123</p>
                        </div>
                      </div>
                    )}
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-8 px-6 border-t">
        <div className="max-w-6xl mx-auto text-center text-muted-foreground text-sm">
          <p>&copy; 2025 Diamond Store. Premium shopping experience.</p>
        </div>
      </footer>
    </div>
  );
}
