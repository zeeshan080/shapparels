"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ImageUpload } from "./image-upload";

interface Category {
  id: string;
  name: string;
}

interface OptionTypeInput {
  name: string;
  values: string[];
}

interface VariantInput {
  sku: string;
  price: string;
  compareAtPrice: string;
  stock: string;
  optionValueLabels: string[];
}

interface ProductFormProps {
  categories: Category[];
  initialData?: any;
}

export function ProductForm({ categories, initialData }: ProductFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<string[]>(
    initialData?.images?.map((i: any) => i.url) || []
  );
  const [optionTypes, setOptionTypes] = useState<OptionTypeInput[]>(
    initialData?.optionTypes?.map((ot: any) => ({
      name: ot.name,
      values: ot.values.map((v: any) => v.value),
    })) || []
  );
  const [variants, setVariants] = useState<VariantInput[]>(
    initialData?.variants?.map((v: any) => ({
      sku: v.sku || "",
      price: v.price,
      compareAtPrice: v.compareAtPrice || "",
      stock: v.stock.toString(),
      optionValueLabels: [],
    })) || []
  );

  const generateSlug = (name: string) =>
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

  const addOptionType = () => {
    setOptionTypes([...optionTypes, { name: "", values: [""] }]);
  };

  const removeOptionType = (index: number) => {
    setOptionTypes(optionTypes.filter((_, i) => i !== index));
  };

  const addOptionValue = (typeIndex: number) => {
    const updated = [...optionTypes];
    updated[typeIndex].values.push("");
    setOptionTypes(updated);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);

    const data = {
      name: formData.get("name") as string,
      code: (formData.get("code") as string) || null,
      slug: formData.get("slug") as string,
      description: formData.get("description") as string,
      shortDescription: formData.get("shortDescription") as string,
      basePrice: parseFloat(formData.get("basePrice") as string),
      compareAtPrice: formData.get("compareAtPrice")
        ? parseFloat(formData.get("compareAtPrice") as string)
        : null,
      stock: parseInt(formData.get("stock") as string) || 0,
      categoryId: formData.get("categoryId") as string || null,
      metaTitle: formData.get("metaTitle") as string,
      metaDescription: formData.get("metaDescription") as string,
      isFeatured: formData.get("isFeatured") === "on",
      isActive: formData.get("isActive") === "on",
      tags: (formData.get("tags") as string)
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      images,
      optionTypes: optionTypes.filter((ot) => ot.name && ot.values.some(Boolean)),
      variants: variants.map((v) => ({
        ...v,
        price: parseFloat(v.price),
        compareAtPrice: v.compareAtPrice ? parseFloat(v.compareAtPrice) : null,
        stock: parseInt(v.stock),
      })),
    };

    try {
      const url = initialData
        ? `/api/products/${initialData.id}`
        : "/api/products";
      const method = initialData ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Failed to save product");
        return;
      }

      toast.success(initialData ? "Product updated" : "Product created");
      router.push("/admin/products");
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-serif">Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="code">Product Code</Label>
              <Input
                id="code"
                name="code"
                placeholder="e.g. SH-001"
                defaultValue={initialData?.code}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Product Name *</Label>
              <Input
                id="name"
                name="name"
                required
                defaultValue={initialData?.name}
                onChange={(e) => {
                  if (!initialData) {
                    const slugInput = document.getElementById("slug") as HTMLInputElement;
                    if (slugInput) slugInput.value = generateSlug(e.target.value);
                  }
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug *</Label>
              <Input id="slug" name="slug" required defaultValue={initialData?.slug} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="shortDescription">Short Description</Label>
            <Input
              id="shortDescription"
              name="shortDescription"
              defaultValue={initialData?.shortDescription}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Full Description</Label>
            <Textarea
              id="description"
              name="description"
              rows={5}
              defaultValue={initialData?.description}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-serif">Pricing &amp; Inventory</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="basePrice">Base Price (PKR) *</Label>
            <Input
              id="basePrice"
              name="basePrice"
              type="number"
              step="0.01"
              required
              defaultValue={initialData?.basePrice}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="compareAtPrice">Compare At Price (PKR)</Label>
            <Input
              id="compareAtPrice"
              name="compareAtPrice"
              type="number"
              step="0.01"
              defaultValue={initialData?.compareAtPrice}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="stock">Stock Quantity</Label>
            <Input
              id="stock"
              name="stock"
              type="number"
              min="0"
              defaultValue={initialData?.stock ?? 0}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-serif">Organization</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="categoryId">Category</Label>
            <Select name="categoryId" defaultValue={initialData?.categoryId || ""}>
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags (comma separated)</Label>
            <Input
              id="tags"
              name="tags"
              defaultValue={initialData?.tags?.join(", ")}
              placeholder="e.g. new arrival, summer, trending"
            />
          </div>

          <div className="flex gap-6">
            <div className="flex items-center gap-2">
              <Checkbox
                id="isFeatured"
                name="isFeatured"
                defaultChecked={initialData?.isFeatured}
              />
              <Label htmlFor="isFeatured">Featured Product</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="isActive"
                name="isActive"
                defaultChecked={initialData?.isActive ?? true}
              />
              <Label htmlFor="isActive">Active</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-serif">Images</CardTitle>
        </CardHeader>
        <CardContent>
          <ImageUpload images={images} onChange={setImages} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="font-serif">Options &amp; Variants</CardTitle>
          <Button type="button" variant="outline" size="sm" onClick={addOptionType}>
            <Plus className="mr-2 h-4 w-4" />
            Add Option
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {optionTypes.map((ot, typeIndex) => (
            <div key={typeIndex} className="rounded-md border border-border/50 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Option name (e.g. Color, Size)"
                  value={ot.name}
                  onChange={(e) => {
                    const updated = [...optionTypes];
                    updated[typeIndex].name = e.target.value;
                    setOptionTypes(updated);
                  }}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeOptionType(typeIndex)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {ot.values.map((val, valIndex) => (
                  <Input
                    key={valIndex}
                    placeholder={`Value ${valIndex + 1}`}
                    value={val}
                    onChange={(e) => {
                      const updated = [...optionTypes];
                      updated[typeIndex].values[valIndex] = e.target.value;
                      setOptionTypes(updated);
                    }}
                    className="w-32"
                  />
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addOptionValue(typeIndex)}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
          {optionTypes.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No options added. Products without options will use the base price.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-serif">SEO</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="metaTitle">Meta Title</Label>
            <Input id="metaTitle" name="metaTitle" defaultValue={initialData?.metaTitle} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="metaDescription">Meta Description</Label>
            <Textarea
              id="metaDescription"
              name="metaDescription"
              rows={2}
              defaultValue={initialData?.metaDescription}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : initialData ? "Update Product" : "Create Product"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
