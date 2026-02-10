import { z } from "zod/v3";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getProducts, getProductBySlug } from "@/lib/db/queries/products";
import { db } from "@/lib/db";
import {
  products,
  productImages,
  productOptionTypes,
  productOptionValues,
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/mcp/auth";

export function registerProductTools(server: McpServer) {
  // Public - both admin and user
  server.registerTool("list_products", {
    title: "List Products",
    description: "Search, filter, and paginate products",
    inputSchema: {
      search: z.string().optional().describe("Search by name or description"),
      categoryId: z.string().uuid().optional().describe("Filter by category UUID"),
      minPrice: z.number().optional().describe("Minimum price filter"),
      maxPrice: z.number().optional().describe("Maximum price filter"),
      sortBy: z.enum(["price-asc", "price-desc", "newest", "name"]).optional().describe("Sort order"),
      page: z.number().int().min(1).optional().describe("Page number (default 1)"),
      limit: z.number().int().min(1).max(100).optional().describe("Items per page (default 12)"),
      featured: z.boolean().optional().describe("Filter featured products only"),
    },
  }, async (params) => {
    const result = await getProducts({
      search: params.search,
      categoryId: params.categoryId,
      minPrice: params.minPrice,
      maxPrice: params.maxPrice,
      sortBy: params.sortBy,
      page: params.page,
      limit: params.limit,
      featured: params.featured,
    });

    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  });

  // Public - both admin and user
  server.registerTool("get_product", {
    title: "Get Product",
    description: "Get full product details by slug, including images, options, and variants",
    inputSchema: {
      slug: z.string().describe("Product URL slug"),
    },
  }, async ({ slug }) => {
    const product = await getProductBySlug(slug);

    if (!product) {
      return { content: [{ type: "text", text: "Product not found" }], isError: true };
    }

    return {
      content: [{ type: "text", text: JSON.stringify(product, null, 2) }],
    };
  });

  // Admin only
  server.registerTool("create_product", {
    title: "Create Product",
    description: "[Admin] Create a new product with validation",
    inputSchema: {
      name: z.string().min(1).describe("Product name"),
      slug: z.string().min(1).regex(/^[a-z0-9-]+$/).describe("URL slug (lowercase, hyphens)"),
      description: z.string().optional().describe("Full description"),
      shortDescription: z.string().optional().describe("Short description"),
      basePrice: z.number().positive().describe("Base price in PKR"),
      compareAtPrice: z.number().positive().optional().nullable().describe("Compare-at price"),
      categoryId: z.string().uuid().optional().nullable().describe("Category UUID"),
      metaTitle: z.string().optional().describe("SEO title"),
      metaDescription: z.string().optional().describe("SEO description"),
      stock: z.number().int().min(0).optional().describe("Stock quantity (default 0)"),
      isFeatured: z.boolean().optional().describe("Featured flag (default false)"),
      isActive: z.boolean().optional().describe("Active flag (default true)"),
      tags: z.array(z.string()).optional().describe("Product tags"),
    },
  }, async (params, extra) => {
    const denied = requireAdmin(extra.authInfo?.extra);
    if (denied) return denied;

    const [product] = await db
      .insert(products)
      .values({
        name: params.name,
        slug: params.slug,
        description: params.description,
        shortDescription: params.shortDescription,
        basePrice: params.basePrice.toString(),
        compareAtPrice: params.compareAtPrice?.toString() ?? null,
        categoryId: params.categoryId ?? null,
        metaTitle: params.metaTitle,
        metaDescription: params.metaDescription,
        stock: params.stock ?? 0,
        isFeatured: params.isFeatured ?? false,
        isActive: params.isActive ?? true,
        tags: params.tags ?? [],
      })
      .returning();

    return {
      content: [{ type: "text", text: JSON.stringify(product, null, 2) }],
    };
  });

  // Admin only
  server.registerTool("update_product", {
    title: "Update Product",
    description: "[Admin] Update a product by ID. Can also replace images and option types.",
    inputSchema: {
      id: z.string().uuid().describe("Product UUID"),
      name: z.string().optional().describe("Product name"),
      slug: z.string().optional().describe("URL slug"),
      description: z.string().optional().describe("Full description"),
      shortDescription: z.string().optional().describe("Short description"),
      basePrice: z.number().positive().optional().describe("Base price in PKR"),
      compareAtPrice: z.number().positive().optional().nullable().describe("Compare-at price"),
      categoryId: z.string().uuid().optional().nullable().describe("Category UUID"),
      metaTitle: z.string().optional().describe("SEO title"),
      metaDescription: z.string().optional().describe("SEO description"),
      stock: z.number().int().min(0).optional().describe("Stock quantity"),
      isFeatured: z.boolean().optional().describe("Featured flag"),
      isActive: z.boolean().optional().describe("Active flag"),
      tags: z.array(z.string()).optional().describe("Product tags"),
      images: z.array(z.string().url()).optional().describe("Replace all images with these URLs"),
      optionTypes: z.array(z.object({
        name: z.string(),
        values: z.array(z.string()),
      })).optional().describe("Replace all option types with these"),
    },
  }, async ({ id, images, optionTypes, ...fields }, extra) => {
    const denied = requireAdmin(extra.authInfo?.extra);
    if (denied) return denied;

    const updates: Record<string, unknown> = {};
    if (fields.name !== undefined) updates.name = fields.name;
    if (fields.slug !== undefined) updates.slug = fields.slug;
    if (fields.description !== undefined) updates.description = fields.description;
    if (fields.shortDescription !== undefined) updates.shortDescription = fields.shortDescription;
    if (fields.basePrice !== undefined) updates.basePrice = fields.basePrice.toString();
    if (fields.compareAtPrice !== undefined) updates.compareAtPrice = fields.compareAtPrice?.toString() ?? null;
    if (fields.categoryId !== undefined) updates.categoryId = fields.categoryId ?? null;
    if (fields.metaTitle !== undefined) updates.metaTitle = fields.metaTitle;
    if (fields.metaDescription !== undefined) updates.metaDescription = fields.metaDescription;
    if (fields.stock !== undefined) updates.stock = fields.stock;
    if (fields.isFeatured !== undefined) updates.isFeatured = fields.isFeatured;
    if (fields.isActive !== undefined) updates.isActive = fields.isActive;
    if (fields.tags !== undefined) updates.tags = fields.tags;

    const [updated] = await db
      .update(products)
      .set(updates)
      .where(eq(products.id, id))
      .returning();

    if (!updated) {
      return { content: [{ type: "text", text: "Product not found" }], isError: true };
    }

    if (images) {
      await db.delete(productImages).where(eq(productImages.productId, id));
      if (images.length > 0) {
        await db.insert(productImages).values(
          images.map((url, index) => ({
            productId: id,
            url,
            alt: updated.name,
            sortOrder: index,
          }))
        );
      }
    }

    if (optionTypes) {
      await db.delete(productOptionTypes).where(eq(productOptionTypes.productId, id));
      for (let i = 0; i < optionTypes.length; i++) {
        const ot = optionTypes[i];
        if (!ot.name) continue;
        const [insertedType] = await db
          .insert(productOptionTypes)
          .values({ productId: id, name: ot.name, sortOrder: i })
          .returning();

        const validValues = ot.values.filter((v) => v.trim());
        if (validValues.length > 0) {
          await db.insert(productOptionValues).values(
            validValues.map((v, j) => ({
              optionTypeId: insertedType.id,
              value: v,
              sortOrder: j,
            }))
          );
        }
      }
    }

    return {
      content: [{ type: "text", text: JSON.stringify(updated, null, 2) }],
    };
  });

  // Admin only
  server.registerTool("delete_product", {
    title: "Delete Product",
    description: "[Admin] Delete a product by ID (cascades to images, variants, options)",
    inputSchema: {
      id: z.string().uuid().describe("Product UUID"),
    },
  }, async ({ id }, extra) => {
    const denied = requireAdmin(extra.authInfo?.extra);
    if (denied) return denied;

    await db.delete(products).where(eq(products.id, id));
    return {
      content: [{ type: "text", text: `Product ${id} deleted` }],
    };
  });
}
