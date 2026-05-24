"use client";

import { useState } from "react";
import { ShoppingBag, Minus, Plus, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/stores/cart-store";
import { WHATSAPP_NUMBER, CURRENCY_SYMBOL } from "@/lib/constants";
import { trackAddToCart } from "@/lib/fb-pixel";
import { toast } from "sonner";

interface AddToCartButtonProps {
  product: {
    id: string;
    name: string;
    slug: string;
    image: string;
    price: number;
    compareAtPrice: number | null;
  };
  variantId: string | null;
  variantLabel: string | null;
  stock?: number;
  disabled?: boolean;
}

export function AddToCartButton({
  product,
  variantId,
  variantLabel,
  stock,
  disabled,
}: AddToCartButtonProps) {
  const [quantity, setQuantity] = useState(1);
  const addItem = useCartStore((s) => s.addItem);
  const cartItems = useCartStore((s) => s.items);

  // How many of this item are already in the cart
  const cartKey = `${product.id}-${variantId ?? "default"}`;
  const inCart = cartItems.find(
    (i) => `${i.productId}-${i.variantId ?? "default"}` === cartKey
  )?.quantity ?? 0;
  const remaining = stock !== undefined ? stock - inCart : Infinity;
  const allInCart = stock !== undefined && remaining <= 0;

  const handleAddToCart = () => {
    if (stock !== undefined && (remaining <= 0 || quantity > remaining)) {
      toast.error(remaining <= 0 ? "All stock is already in your cart" : `Only ${remaining} more available`);
      return;
    }
    addItem({
      productId: product.id,
      variantId,
      name: product.name,
      slug: product.slug,
      image: product.image,
      price: product.price,
      compareAtPrice: product.compareAtPrice,
      variantLabel,
      quantity,
      maxStock: stock,
    });
    trackAddToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      quantity,
    });
    toast.success(`${product.name} added to cart`);
    setQuantity(1);
  };

  const whatsappMessage = encodeURIComponent(
    `Hi! I'm interested in ${product.name}${variantLabel ? ` (${variantLabel})` : ""} - ${CURRENCY_SYMBOL} ${product.price.toLocaleString()}`
  );

  return (
    <div className="space-y-3">
      {/* Quantity */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">Quantity</span>
        <div className="flex items-center rounded-md border border-border">
          <button
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            disabled={disabled}
            className="flex h-9 w-9 items-center justify-center hover:bg-accent transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="flex h-9 w-10 items-center justify-center text-sm font-medium">
            {quantity}
          </span>
          <button
            onClick={() => setQuantity(Math.min(quantity + 1, Math.max(remaining, 1)))}
            disabled={disabled || (stock !== undefined && quantity >= remaining)}
            className="flex h-9 w-9 items-center justify-center hover:bg-accent transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
        {stock !== undefined && (
          <span className={`text-xs ${remaining <= 0 ? "text-destructive" : "text-muted-foreground"}`}>
            {inCart > 0 ? `${remaining} left (${inCart} in cart)` : `${stock} in stock`}
          </span>
        )}
      </div>

      {/* Add to Cart */}
      <Button
        size="lg"
        className="w-full"
        onClick={handleAddToCart}
        disabled={disabled || allInCart || (stock !== undefined && stock <= 0)}
      >
        <ShoppingBag className="mr-2 h-5 w-5" />
        {stock !== undefined && stock <= 0
          ? "Out of Stock"
          : allInCart
          ? "All Stock in Cart"
          : "Add to Cart"}
      </Button>

      {/* WhatsApp Buy */}
      {WHATSAPP_NUMBER && (
        <Button
          size="lg"
          variant="outline"
          className="w-full border-[#25D366] text-[#25D366] hover:bg-[#25D366]/10"
          asChild
        >
          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}?text=${whatsappMessage}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <MessageCircle className="mr-2 h-5 w-5" />
            Buy on WhatsApp
          </a>
        </Button>
      )}
    </div>
  );
}
