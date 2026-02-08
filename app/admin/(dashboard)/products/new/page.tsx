import { getCategories } from "@/lib/db/queries/categories";
import { ProductForm } from "@/components/admin/product-form";

export default async function NewProductPage() {
  const categories = await getCategories();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold">New Product</h1>
        <p className="text-muted-foreground">Add a new product to your catalog.</p>
      </div>
      <ProductForm categories={categories} />
    </div>
  );
}
