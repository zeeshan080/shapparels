import { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getProductBySlug, getRelatedProducts } from "@/lib/db/queries/products";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { ProductImages } from "@/components/products/product-images";
import { ProductDetailClient } from "./product-detail-client";
import { ProductJsonLd } from "@/components/shared/product-jsonld";
import { ProductGrid } from "@/components/products/product-grid";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SITE_URL } from "@/lib/constants";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) return { title: "Product Not Found" };

  return {
    title: product.metaTitle || product.name,
    description: product.metaDescription || product.shortDescription || product.description?.slice(0, 160),
    openGraph: {
      title: product.metaTitle || product.name,
      description: product.metaDescription || product.shortDescription || "",
      images: product.images[0] ? [{ url: product.images[0].url }] : [],
    },
  };
}

export const revalidate = 3600;

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) notFound();

  const relatedProducts = await getRelatedProducts(
    product.id,
    product.categoryId,
    4
  );

  const breadcrumbItems = [
    { label: "Shop", href: "/products" },
    ...(product.category
      ? [{ label: product.category.name, href: `/category/${product.category.slug}` }]
      : []),
    { label: product.name },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <ProductJsonLd product={product} siteUrl={SITE_URL} />
      <Breadcrumbs items={breadcrumbItems} />

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        {/* Images */}
        <ProductImages images={product.images} productName={product.name} />

        {/* Product Info */}
        <div>
          {product.category && (
            <p className="text-sm font-medium uppercase tracking-wider text-primary">
              {product.category.name}
            </p>
          )}
          <h1 className="mt-1 font-serif text-3xl font-bold sm:text-4xl">
            {product.name}
          </h1>

          {product.shortDescription && (
            <p className="mt-3 text-muted-foreground">
              {product.shortDescription}
            </p>
          )}

          {/* Client component for interactive variant selection + cart */}
          <ProductDetailClient
            product={{
              id: product.id,
              name: product.name,
              slug: product.slug,
              basePrice: product.basePrice,
              compareAtPrice: product.compareAtPrice,
              stock: product.stock,
              image: product.images[0]?.url || "",
            }}
            optionTypes={product.optionTypes}
            variants={product.variants}
          />
        </div>
      </div>

      {/* Description Tabs */}
      {product.description && (
        <div className="mt-12">
          <Tabs defaultValue="description">
            <TabsList>
              <TabsTrigger value="description">Description</TabsTrigger>
              <TabsTrigger value="details">Details</TabsTrigger>
            </TabsList>
            <TabsContent value="description" className="mt-4 prose prose-invert max-w-none text-muted-foreground">
              <div className="whitespace-pre-wrap">{product.description}</div>
            </TabsContent>
            <TabsContent value="details" className="mt-4">
              <dl className="space-y-2 text-sm">
                {product.tags && product.tags.length > 0 && (
                  <div>
                    <dt className="font-medium text-foreground">Tags</dt>
                    <dd className="mt-1 text-muted-foreground">
                      {product.tags.join(", ")}
                    </dd>
                  </div>
                )}
              </dl>
            </TabsContent>
          </Tabs>
        </div>
      )}

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="mt-16">
          <h2 className="font-serif text-2xl font-bold">You May Also Like</h2>
          <div className="mt-6">
            <ProductGrid products={relatedProducts} />
          </div>
        </div>
      )}
    </div>
  );
}
