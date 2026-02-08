import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { products, productImages, categories } from "@/lib/db/schema";
import { eq, and, or, ilike, desc } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q");
  const limit = Number(request.nextUrl.searchParams.get("limit")) || 5;

  if (!query || query.trim().length === 0) {
    return NextResponse.json({ results: [] });
  }

  const searchTerm = `%${query.trim()}%`;

  const results = await db
    .select({
      id: products.id,
      name: products.name,
      slug: products.slug,
      basePrice: products.basePrice,
      categoryName: categories.name,
    })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(
      and(
        eq(products.isActive, true),
        or(
          ilike(products.name, searchTerm),
          ilike(products.description, searchTerm),
          ilike(products.shortDescription, searchTerm)
        )
      )
    )
    .orderBy(desc(products.createdAt))
    .limit(limit);

  // Get first image for each result
  const resultsWithImages = await Promise.all(
    results.map(async (product) => {
      const [image] = await db
        .select({ url: productImages.url })
        .from(productImages)
        .where(eq(productImages.productId, product.id))
        .orderBy(productImages.sortOrder)
        .limit(1);
      return { ...product, image: image?.url || null };
    })
  );

  return NextResponse.json({ results: resultsWithImages });
}
