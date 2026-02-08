"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface ProductFiltersProps {
  categories: Category[];
}

export function ProductFilters({ categories }: ProductFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const selectedCategory = searchParams.get("category") || "";
  const minPrice = Number(searchParams.get("minPrice")) || 0;
  const maxPrice = Number(searchParams.get("maxPrice")) || 50000;

  const updateFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      params.delete("page");
      router.push(`/products?${params.toString()}`);
    },
    [router, searchParams]
  );

  const clearFilters = () => {
    router.push("/products");
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-serif text-sm font-semibold">Categories</h3>
        <div className="mt-3 space-y-2">
          {categories.map((cat) => (
            <div key={cat.id} className="flex items-center gap-2">
              <Checkbox
                id={`cat-${cat.id}`}
                checked={selectedCategory === cat.id}
                onCheckedChange={(checked) =>
                  updateFilter("category", checked ? cat.id : "")
                }
              />
              <Label
                htmlFor={`cat-${cat.id}`}
                className="text-sm text-muted-foreground cursor-pointer"
              >
                {cat.name}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      <div>
        <h3 className="font-serif text-sm font-semibold">Price Range</h3>
        <div className="mt-3">
          <Slider
            min={0}
            max={50000}
            step={500}
            value={[minPrice, maxPrice]}
            onValueCommit={(value) => {
              updateFilter("minPrice", value[0] > 0 ? value[0].toString() : "");
              updateFilter("maxPrice", value[1] < 50000 ? value[1].toString() : "");
            }}
          />
          <div className="mt-2 flex justify-between text-xs text-muted-foreground">
            <span>Rs. {minPrice.toLocaleString()}</span>
            <span>Rs. {maxPrice.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <Separator />

      <Button variant="outline" size="sm" onClick={clearFilters} className="w-full">
        Clear Filters
      </Button>
    </div>
  );
}
