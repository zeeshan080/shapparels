import { NextResponse } from "next/server";
import { getCategoriesHierarchy } from "@/lib/db/queries/categories";

export async function GET() {
  const tree = await getCategoriesHierarchy();
  return NextResponse.json(tree);
}
