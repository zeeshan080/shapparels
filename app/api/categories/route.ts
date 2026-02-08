import { NextRequest, NextResponse } from "next/server";
import { getCategories } from "@/lib/db/queries/categories";
import { db } from "@/lib/db";
import { categories } from "@/lib/db/schema";
import { auth } from "@/lib/auth/server";
import { headers } from "next/headers";

export async function GET() {
  const allCategories = await getCategories();
  return NextResponse.json(allCategories);
}

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, slug, description, image, sortOrder } = body;

    if (!name || !slug) {
      return NextResponse.json({ error: "Name and slug are required" }, { status: 400 });
    }

    const [category] = await db
      .insert(categories)
      .values({
        name,
        slug,
        description: description || null,
        image: image || null,
        sortOrder: sortOrder || 0,
      })
      .returning();

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error("Category create error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
