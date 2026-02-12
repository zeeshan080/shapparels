import { db } from "@/lib/db";
import { contactMessages } from "@/lib/db/schema";
import { eq, desc, sql, and } from "drizzle-orm";

export async function createContactMessage(data: {
  name: string;
  email?: string;
  phone?: string;
  message: string;
}) {
  const [msg] = await db
    .insert(contactMessages)
    .values(data)
    .returning();
  return msg;
}

export async function getContactMessages(options: {
  page?: number;
  limit?: number;
  unreadOnly?: boolean;
} = {}) {
  const { page = 1, limit = 20, unreadOnly } = options;
  const offset = (page - 1) * limit;

  const conditions = [];
  if (unreadOnly) {
    conditions.push(eq(contactMessages.isRead, false));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [messages, countResult] = await Promise.all([
    db
      .select()
      .from(contactMessages)
      .where(whereClause)
      .orderBy(desc(contactMessages.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(contactMessages)
      .where(whereClause),
  ]);

  return {
    messages,
    total: Number(countResult[0]?.count ?? 0),
    page,
    limit,
    totalPages: Math.ceil(Number(countResult[0]?.count ?? 0) / limit),
  };
}

export async function markMessageRead(id: string) {
  const [updated] = await db
    .update(contactMessages)
    .set({ isRead: true })
    .where(eq(contactMessages.id, id))
    .returning();
  return updated;
}

export async function deleteContactMessage(id: string) {
  await db.delete(contactMessages).where(eq(contactMessages.id, id));
}

export async function getUnreadCount() {
  const [result] = await db
    .select({ count: sql<number>`count(*)` })
    .from(contactMessages)
    .where(eq(contactMessages.isRead, false));
  return Number(result?.count ?? 0);
}
