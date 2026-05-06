import { timingSafeEqual } from "crypto";
import type { AuthInfo } from "@modelcontextprotocol/sdk/server/auth/types.js";

export type McpRole = "admin" | "user";

function matchKey(token: string, keys: string[]): boolean {
  const tokenBuf = Buffer.from(token);
  for (const key of keys) {
    const keyBuf = Buffer.from(key);
    if (tokenBuf.length === keyBuf.length && timingSafeEqual(tokenBuf, keyBuf)) {
      return true;
    }
  }
  return false;
}

function parseKeys(envVar: string | undefined): string[] {
  return (envVar ?? "").split(",").map((k) => k.trim()).filter(Boolean);
}

export async function verifyApiKey(
  _req: Request,
  bearerToken?: string
): Promise<AuthInfo | undefined> {
  if (!bearerToken) return undefined;

  const adminKeys = parseKeys(process.env.MCP_ADMIN_KEYS);
  const userKeys = parseKeys(process.env.MCP_USER_KEYS);

  if (matchKey(bearerToken, adminKeys)) {
    return {
      token: bearerToken,
      clientId: "mcp-admin",
      scopes: ["admin"],
      extra: { role: "admin" as McpRole },
    };
  }

  if (matchKey(bearerToken, userKeys)) {
    return {
      token: bearerToken,
      clientId: "mcp-user",
      scopes: ["user"],
      extra: { role: "user" as McpRole },
    };
  }

  return undefined;
}

export function getRole(extra: Record<string, unknown> | undefined): McpRole {
  return (extra?.role as McpRole) ?? "user";
}

export function requireAdmin(extra: Record<string, unknown> | undefined) {
  if (getRole(extra) !== "admin") {
    return {
      content: [{ type: "text" as const, text: "Forbidden: admin access required" }],
      isError: true,
    };
  }
  return null;
}
