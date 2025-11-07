import { Button } from "@/components/ui/button";
import { DiamondIcon } from "@/components/DiamondIcon";
import { Sparkles, ShoppingBag, Shield } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DiamondIcon className="w-8 h-8" withShimmer />
            <span className="text-2xl font-bold gradient-text">Diamond Store</span>
          </div>
          <Button 
            onClick={() => window.location.href = "/api/login"}
            variant="default"
            size="default"
            className="apple-press"
            data-testid="button-login"
          >
            Sign In
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-8 flex justify-center">
            <div className="diamond-shimmer diamond-glow p-6 rounded-full glass inline-block">
              <DiamondIcon className="w-16 h-16" />
            </div>
          </div>
          
          <h1 className="text-6xl md:text-7xl font-bold mb-6 tracking-tight">
            Shop with <span className="gradient-text">Diamonds</span>
          </h1>
          
          <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto">
            Experience premium shopping with our exclusive diamond currency system. 
            Elegant design meets seamless functionality.
          </p>

          <div className="flex gap-4 justify-center">
            <Button 
              onClick={() => window.location.href = "/api/login"}
              size="lg"
              className="apple-press text-lg px-8"
              data-testid="button-get-started"
            >
              Get Started
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              className="apple-press text-lg px-8 glass"
              data-testid="button-learn-more"
            >
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="glass p-8 rounded-lg hover-elevate active-elevate-2 transition-all duration-300">
              <div className="mb-4 p-3 rounded-lg bg-primary/10 inline-block">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Diamond Currency</h3>
              <p className="text-muted-foreground">
                Shop using our exclusive diamond-based currency system with real-time balance updates.
              </p>
            </div>

            <div className="glass p-8 rounded-lg hover-elevate active-elevate-2 transition-all duration-300">
              <div className="mb-4 p-3 rounded-lg bg-primary/10 inline-block">
                <ShoppingBag className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Premium Products</h3>
              <p className="text-muted-foreground">
                Browse our curated collection of exclusive items with smooth, Apple-inspired animations.
              </p>
            </div>

            <div className="glass p-8 rounded-lg hover-elevate active-elevate-2 transition-all duration-300">
              <div className="mb-4 p-3 rounded-lg bg-primary/10 inline-block">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Secure & Fast</h3>
              <p className="text-muted-foreground">
                Live order tracking and instant delivery notifications for your purchases.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t">
        <div className="max-w-6xl mx-auto text-center text-muted-foreground">
          <p>&copy; 2025 Diamond Store. Premium shopping experience.</p>
        </div>
      </footer>
    </div>
  );
}
