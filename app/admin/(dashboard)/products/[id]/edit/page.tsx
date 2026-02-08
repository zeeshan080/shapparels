import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { products, productImages, productOptionTypes, productOptionValues, productVariants } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getCategories } from "@/lib/db/queries/categories";
import { ProductForm } from "@/components/admin/product-form";

interface EditProductPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  const { id } = await params;

  const [product] = await db.select().from(products).where(eq(products.id, id)).limit(1);
  if (!product) notFound();

  const [cats, imgs, optTypes, vars] = await Promise.all([
    getCategories(),
    db.select().from(productImages).where(eq(productImages.productId, id)).orderBy(productImages.sortOrder),
    db.select().from(productOptionTypes).where(eq(productOptionTypes.productId, id)).orderBy(productOptionTypes.sortOrder),
    db.select().from(productVariants).where(eq(productVariants.productId, id)),
  ]);

  const optTypesWithValues = await Promise.all(
    optTypes.map(async (ot) => {
      const values = await db
        .select()
        .from(productOptionValues)
        .where(eq(productOptionValues.optionTypeId, ot.id))
        .orderBy(productOptionValues.sortOrder);
      return { ...ot, values };
    })
  );

  const initialData = {
    ...product,
    images: imgs,
    optionTypes: optTypesWithValues,
    variants: vars,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold">Edit Product</h1>
        <p className="text-muted-foreground">{product.name}</p>
      </div>
      <ProductForm categories={cats} initialData={initialData} />
    </div>
  );
}
