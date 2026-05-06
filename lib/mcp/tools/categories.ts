import { z } from "zod/v3";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getCategories, getCategoriesHierarchy } from "@/lib/db/queries/categories";
import { db } from "@/lib/db";
import { categories } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/mcp/auth";

const MAX_DEPTH = 3;

async function resolveLevelFromParent(parentId: string | null | undefined): Promise<{ level: number; error?: string }> {
  if (!parentId) return { level: 0 };
  const [parent] = await db
    .select({ level: categories.level })
    .from(categories)
    .where(eq(categories.id, parentId))
    .limit(1);
  if (!parent) return { level: 0, error: "Parent category not found" };
  if (parent.level >= MAX_DEPTH - 1) {
    return { level: 0, error: `Maximum nesting depth is ${MAX_DEPTH} levels` };
  }
  return { level: parent.level + 1 };
}

export function registerCategoryTools(server: McpServer) {
  // Public - both admin and user
  server.registerTool("list_categories", {
    title: "List Categories",
    description: "Get all active product categories. Pass tree=true to get nested hierarchy.",
    inputSchema: {
      tree: z.boolean().optional().describe("Return nested tree (default: flat list)"),
    },
  }, async ({ tree }) => {
    const result = tree ? await getCategoriesHierarchy() : await getCategories();
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  });

  // Admin only
  server.registerTool("create_category", {
    title: "Create Category",
    description: "[Admin] Create a new product category. Supports nesting via parentId (max 3 levels).",
    inputSchema: {
      name: z.string().describe("Category name"),
      slug: z.string().describe("URL-friendly slug (lowercase, hyphens)"),
      description: z.string().optional().describe("Category description"),
      image: z.string().optional().describe("Category image URL"),
      parentId: z.string().uuid().optional().nullable().describe("Parent category UUID for nesting"),
      sortOrder: z.number().int().optional().describe("Display order (default 0)"),
    },
  }, async ({ name, slug, description, image, parentId, sortOrder }, extra) => {
    const denied = requireAdmin(extra.authInfo?.extra);
    if (denied) return denied;

    const { level, error } = await resolveLevelFromParent(parentId);
    if (error) {
      return { content: [{ type: "text", text: error }], isError: true };
    }

    const [category] = await db
      .insert(categories)
      .values({
        name,
        slug,
        description: description ?? null,
        image: image ?? null,
        parentId: parentId ?? null,
        level,
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
    description: "[Admin] Update an existing category by ID. Changing parentId recomputes the level.",
    inputSchema: {
      id: z.string().uuid().describe("Category UUID"),
      name: z.string().optional().describe("Category name"),
      slug: z.string().optional().describe("URL-friendly slug"),
      description: z.string().optional().describe("Category description"),
      image: z.string().optional().describe("Category image URL"),
      parentId: z.string().uuid().optional().nullable().describe("Parent category UUID (null to make root)"),
      sortOrder: z.number().int().optional().describe("Display order"),
    },
  }, async ({ id, name, slug, description, image, parentId, sortOrder }, extra) => {
    const denied = requireAdmin(extra.authInfo?.extra);
    if (denied) return denied;

    const updates: Record<string, unknown> = {};
    if (name !== undefined) updates.name = name;
    if (slug !== undefined) updates.slug = slug;
    if (description !== undefined) updates.description = description;
    if (image !== undefined) updates.image = image;
    if (sortOrder !== undefined) updates.sortOrder = sortOrder;

    if (parentId !== undefined) {
      const { level, error } = await resolveLevelFromParent(parentId);
      if (error) {
        return { content: [{ type: "text", text: error }], isError: true };
      }
      updates.parentId = parentId ?? null;
      updates.level = level;
    }

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
