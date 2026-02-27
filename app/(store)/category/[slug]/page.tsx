import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getProducts } from "@/lib/db/queries/products";
import { getCategoryBySlug, getCategories, getCategoryWithAncestors, getDescendantIds } from "@/lib/db/queries/categories";
import { db } from "@/lib/db";
import { categories } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import { ProductGrid } from "@/components/products/product-grid";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string; sort?: string }>;
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);

  if (!category) return { title: "Category Not Found" };

  return {
    title: category.name,
    description: category.description || `Shop ${category.name} at SH Apparels`,
  };
}

export async function generateStaticParams() {
  try {
    const allCategories = await getCategories();
    return allCategories.map((c) => ({ slug: c.slug }));
  } catch {
    return [];
  }
}

export const revalidate = 3600;

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { slug } = await params;
  const sp = await searchParams;

  const result = await getCategoryWithAncestors(slug);
  if (!result) notFound();

  const { category, ancestors } = result;

  // Get subcategories
  const subcategories = await db
    .select()
    .from(categories)
    .where(eq(categories.parentId, category.id))
    .orderBy(asc(categories.sortOrder));

  const activeSubcategories = subcategories.filter((c) => c.isActive);

  // Get all descendant category IDs for product query
  const descendantIds = await getDescendantIds(category.id);

  const { products, total, page, totalPages } = await getProducts({
    categoryIds: descendantIds,
    sortBy: (sp.sort as any) || "newest",
    page: sp.page ? Number(sp.page) : 1,
  });

  // Build breadcrumbs
  const breadcrumbItems = [
    { label: "Shop", href: "/products" },
    ...ancestors.map((a) => ({ label: a.name, href: `/category/${a.slug}` })),
    { label: category.name },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Breadcrumbs items={breadcrumbItems} />

      <div className="mt-6">
        <h1 className="font-serif text-3xl font-bold">{category.name}</h1>
        {category.description && (
          <p className="mt-2 text-muted-foreground">{category.description}</p>
        )}
      </div>

      {/* Subcategories grid */}
      {activeSubcategories.length > 0 && (
        <div className="mt-8">
          <h2 className="font-serif text-xl font-semibold">Subcategories</h2>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {activeSubcategories.map((sub) => (
              <Link
                key={sub.id}
                href={`/category/${sub.slug}`}
                className="group relative aspect-[4/3] overflow-hidden rounded-lg border border-border/50"
              >
                {sub.image ? (
                  <Image
                    src={sub.image}
                    alt={sub.name}
                    fill
                    unoptimized
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  />
                ) : (
                  <div className="h-full w-full bg-card" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />
                <div className="absolute inset-0 flex items-end p-4">
                  <h3 className="font-serif text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                    {sub.name}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="mt-8">
        <p className="text-sm text-muted-foreground">
          {total} {total === 1 ? "product" : "products"}
        </p>
        <div className="mt-4">
          <ProductGrid products={products} />
        </div>
      </div>
    </div>
  );
}
