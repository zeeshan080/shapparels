import { NextRequest, NextResponse } from "next/server";
import { getProducts } from "@/lib/db/queries/products";
import { db } from "@/lib/db";
import { products, productImages, productOptionTypes, productOptionValues, productVariants } from "@/lib/db/schema";
import { auth } from "@/lib/auth/server";
import { headers } from "next/headers";
import { productCreateSchema } from "@/lib/validators/product";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const result = await getProducts({
    categoryId: searchParams.get("category") || undefined,
    search: searchParams.get("search") || undefined,
    minPrice: searchParams.get("minPrice") ? Number(searchParams.get("minPrice")) : undefined,
    maxPrice: searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : undefined,
    sortBy: (searchParams.get("sort") as any) || "newest",
    page: searchParams.get("page") ? Number(searchParams.get("page")) : 1,
    limit: searchParams.get("limit") ? Number(searchParams.get("limit")) : 12,
  });

  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = productCreateSchema.parse(body);

    const [product] = await db
      .insert(products)
      .values({
        name: parsed.name,
        slug: parsed.slug,
        description: parsed.description,
        shortDescription: parsed.shortDescription,
        basePrice: parsed.basePrice.toString(),
        compareAtPrice: parsed.compareAtPrice?.toString() ?? null,
        categoryId: parsed.categoryId ?? null,
        metaTitle: parsed.metaTitle,
        metaDescription: parsed.metaDescription,
        stock: parsed.stock,
        isFeatured: parsed.isFeatured,
        isActive: parsed.isActive,
        tags: parsed.tags,
      })
      .returning();

    return NextResponse.json(product, { status: 201 });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error("Product create error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
