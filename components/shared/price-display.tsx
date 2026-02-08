import { CURRENCY_SYMBOL } from "@/lib/constants";

interface PriceDisplayProps {
  price: number;
  compareAtPrice?: number | null;
  className?: string;
}

export function PriceDisplay({ price, compareAtPrice, className = "" }: PriceDisplayProps) {
  const hasDiscount = compareAtPrice && compareAtPrice > price;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="font-semibold text-foreground">
        {CURRENCY_SYMBOL} {price.toLocaleString()}
      </span>
      {hasDiscount && (
        <span className="text-sm text-muted-foreground line-through">
          {CURRENCY_SYMBOL} {compareAtPrice.toLocaleString()}
        </span>
      )}
    </div>
  );
}
