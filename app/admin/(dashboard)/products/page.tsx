import Link from "next/link";
import Image from "next/image";
import { db } from "@/lib/db";
import { products, productImages, categories, productVariants } from "@/lib/db/schema";
import { eq, desc, sql, inArray } from "drizzle-orm";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Edit, Package } from "lucide-react";
import { CURRENCY_SYMBOL } from "@/lib/constants";

export default async function AdminProductsPage() {
  const allProducts = await db
    .select({
      id: products.id,
      name: products.name,
      slug: products.slug,
      basePrice: products.basePrice,
      stock: products.stock,
      isActive: products.isActive,
      isFeatured: products.isFeatured,
      categoryName: categories.name,
      createdAt: products.createdAt,
    })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .orderBy(desc(products.createdAt));

  // Fetch first image and total stock for each product
  const productIds = allProducts.map((p) => p.id);

  const [images, stocks] = await Promise.all([
    productIds.length > 0
      ? db
          .select({ productId: productImages.productId, url: productImages.url })
          .from(productImages)
          .where(inArray(productImages.productId, productIds))
          .orderBy(productImages.sortOrder)
      : Promise.resolve([]),
    productIds.length > 0
      ? db
          .select({
            productId: productVariants.productId,
            totalStock: sql<number>`COALESCE(SUM(${productVariants.stock}), 0)`,
          })
          .from(productVariants)
          .where(inArray(productVariants.productId, productIds))
          .groupBy(productVariants.productId)
      : Promise.resolve([]),
  ]);

  const imageMap = new Map<string, string>();
  for (const img of images) {
    if (!imageMap.has(img.productId)) {
      imageMap.set(img.productId, img.url);
    }
  }

  const stockMap = new Map<string, number>();
  for (const s of stocks) {
    stockMap.set(s.productId, Number(s.totalStock));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold">Products</h1>
          <p className="text-muted-foreground">{allProducts.length} products</p>
        </div>
        <Button asChild>
          <Link href="/admin/products/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Link>
        </Button>
      </div>

      {allProducts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-muted-foreground/30" />
            <p className="mt-4 text-muted-foreground">No products yet</p>
            <Button className="mt-4" asChild>
              <Link href="/admin/products/new">Create your first product</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {allProducts.map((product) => (
            <Link
              key={product.id}
              href={`/admin/products/${product.id}/edit`}
              className="flex items-center gap-4 rounded-lg border border-border/50 p-4 hover:bg-accent transition-colors"
            >
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-card border border-border/50">
                {imageMap.get(product.id) ? (
                  <Image
                    src={imageMap.get(product.id)!}
                    alt={product.name}
                    fill
                    unoptimized
                    className="object-cover"
                    sizes="64px"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                    No img
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{product.name}</p>
                <p className="text-xs text-muted-foreground">
                  {product.categoryName || "No category"} · Stock: {stockMap.has(product.id) ? stockMap.get(product.id) : product.stock}
                </p>
              </div>

              <div className="hidden sm:flex items-center gap-2">
                {!product.isActive && (
                  <Badge variant="secondary">Draft</Badge>
                )}
                {product.isFeatured && (
                  <Badge className="bg-primary/10 text-primary">Featured</Badge>
                )}
              </div>

              <div className="text-right">
                <p className="font-medium">
                  {CURRENCY_SYMBOL} {parseFloat(product.basePrice).toLocaleString()}
                </p>
              </div>

              <Edit className="h-4 w-4 text-muted-foreground shrink-0" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
