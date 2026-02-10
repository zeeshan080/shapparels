import { z } from "zod/v3";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getCategories } from "@/lib/db/queries/categories";
import { db } from "@/lib/db";
import { categories } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/mcp/auth";

export function registerCategoryTools(server: McpServer) {
  // Public - both admin and user
  server.registerTool("list_categories", {
    title: "List Categories",
    description: "Get all active product categories",
  }, async () => {
    const result = await getCategories();
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  });

  // Admin only
  server.registerTool("create_category", {
    title: "Create Category",
    description: "[Admin] Create a new product category",
    inputSchema: {
      name: z.string().describe("Category name"),
      slug: z.string().describe("URL-friendly slug (lowercase, hyphens)"),
      description: z.string().optional().describe("Category description"),
      image: z.string().optional().describe("Category image URL"),
      sortOrder: z.number().int().optional().describe("Display order (default 0)"),
    },
  }, async ({ name, slug, description, image, sortOrder }, extra) => {
    const denied = requireAdmin(extra.authInfo?.extra);
    if (denied) return denied;

    const [category] = await db
      .insert(categories)
      .values({
        name,
        slug,
        description: description ?? null,
        image: image ?? null,
        sortOrder: sortOrder ?? 0,
      })
      .returning();

    return {
      content: [{ type: "text", text: JSON.stringify(category, null, 2) }],
    };
  });

  // Admin only
  server.registerTool("update_category", {
    title: "Update Category",
    description: "[Admin] Update an existing category by ID",
    inputSchema: {
      id: z.string().uuid().describe("Category UUID"),
      name: z.string().optional().describe("Category name"),
      slug: z.string().optional().describe("URL-friendly slug"),
      description: z.string().optional().describe("Category description"),
      image: z.string().optional().describe("Category image URL"),
      sortOrder: z.number().int().optional().describe("Display order"),
    },
  }, async ({ id, name, slug, description, image, sortOrder }, extra) => {
    const denied = requireAdmin(extra.authInfo?.extra);
    if (denied) return denied;

    const updates: Record<string, unknown> = {};
    if (name !== undefined) updates.name = name;
    if (slug !== undefined) updates.slug = slug;
    if (description !== undefined) updates.description = description;
    if (image !== undefined) updates.image = image;
    if (sortOrder !== undefined) updates.sortOrder = sortOrder;

    const [updated] = await db
      .update(categories)
      .set(updates)
      .where(eq(categories.id, id))
      .returning();

    if (!updated) {
      return { content: [{ type: "text", text: "Category not found" }], isError: true };
    }

    return {
      content: [{ type: "text", text: JSON.stringify(updated, null, 2) }],
    };
  });

  // Admin only
  server.registerTool("delete_category", {
    title: "Delete Category",
    description: "[Admin] Delete a category by ID",
    inputSchema: {
      id: z.string().uuid().describe("Category UUID"),
    },
  }, async ({ id }, extra) => {
    const denied = requireAdmin(extra.authInfo?.extra);
    if (denied) return denied;

    await db.delete(categories).where(eq(categories.id, id));
    return {
      content: [{ type: "text", text: `Category ${id} deleted` }],
    };
  });
}
