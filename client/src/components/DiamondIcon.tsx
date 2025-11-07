import { Gem } from "lucide-react";

interface DiamondIconProps {
  className?: string;
  withShimmer?: boolean;
}

export function DiamondIcon({ className = "w-5 h-5", withShimmer = false }: DiamondIconProps) {
  return (
    <div className={`relative ${withShimmer ? "diamond-shimmer" : ""}`}>
      <Gem className={`${className} text-primary`} />
    </div>
  );
}
