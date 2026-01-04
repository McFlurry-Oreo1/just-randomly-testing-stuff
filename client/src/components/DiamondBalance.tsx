import { DiamondIcon } from "./DiamondIcon";
import { useEffect, useState } from "react";

interface DiamondBalanceProps {
  balance: number;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function DiamondBalance({ balance, className = "", size = "md" }: DiamondBalanceProps) {
  const [displayBalance, setDisplayBalance] = useState(balance);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (displayBalance !== balance) {
      setIsAnimating(true);
      const duration = 500;
      const steps = 20;
      const increment = (balance - displayBalance) / steps;
      let step = 0;

      const interval = setInterval(() => {
        step++;
        if (step === steps) {
          setDisplayBalance(balance);
          clearInterval(interval);
          setIsAnimating(false);
        } else {
          setDisplayBalance((prev) => prev + increment);
        }
      }, duration / steps);

      return () => clearInterval(interval);
    }
  }, [balance, displayBalance]);

  const sizeClasses = {
    sm: "text-sm",
    md: "text-lg",
    lg: "text-2xl"
  };

  const iconSizes = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6"
  };

  return (
    <div className={`flex items-center gap-2 ${sizeClasses[size]} font-semibold ${className}`}>
      <DiamondIcon className={iconSizes[size]} withShimmer />
      <span className={`gradient-text transition-all duration-200`} data-testid="text-diamond-balance">
        {Math.floor(displayBalance).toLocaleString()}
      </span>
    </div>
  );
}
