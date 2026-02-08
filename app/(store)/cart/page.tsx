"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useCartStore } from "@/stores/cart-store";
import { CartItem } from "@/components/cart/cart-item";
import { CartSummary } from "@/components/cart/cart-summary";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";

export default function CartPage() {
  const items = useCartStore((s) => s.items);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Breadcrumbs items={[{ label: "Cart" }]} />

      <h1 className="mt-6 font-serif text-3xl font-bold">Shopping Cart</h1>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <ShoppingBag className="h-16 w-16 text-muted-foreground/30" />
          <p className="mt-4 font-serif text-xl text-muted-foreground">
            Your cart is empty
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Browse our collection and find something you love.
          </p>
          <Button className="mt-6" asChild>
            <Link href="/products">Continue Shopping</Link>
          </Button>
        </div>
      ) : (
        <div className="mt-8 grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="divide-y divide-border/50">
              {items.map((item) => (
                <CartItem
                  key={`${item.productId}-${item.variantId}`}
                  item={item}
                />
              ))}
            </div>
            <Separator className="mt-4" />
            <div className="mt-4">
              <Button variant="outline" asChild>
                <Link href="/products">Continue Shopping</Link>
              </Button>
            </div>
          </div>

          <div>
            <CartSummary />
          </div>
        </div>
      )}
    </div>
  );
}
