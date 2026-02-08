import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProducts } from "@/lib/db/queries/products";
import { getCategoryBySlug, getCategories } from "@/lib/db/queries/categories";
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
    const categories = await getCategories();
    return categories.map((c) => ({ slug: c.slug }));
  } catch {
    return [];
  }
}

export const revalidate = 3600;

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { slug } = await params;
  const sp = await searchParams;
  const category = await getCategoryBySlug(slug);

  if (!category) notFound();

  const { products, total, page, totalPages } = await getProducts({
    categoryId: category.id,
    sortBy: (sp.sort as any) || "newest",
    page: sp.page ? Number(sp.page) : 1,
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Breadcrumbs
        items={[
          { label: "Shop", href: "/products" },
          { label: category.name },
        ]}
      />

      <div className="mt-6">
        <h1 className="font-serif text-3xl font-bold">{category.name}</h1>
        {category.description && (
          <p className="mt-2 text-muted-foreground">{category.description}</p>
        )}
      </div>

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
