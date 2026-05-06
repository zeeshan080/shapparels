import { NextRequest } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth/server";
import { runAgent } from "@/lib/ai/agent";
import type { ChatRequest } from "@/lib/ai/types";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ChatRequest;

    if (!body.messages || body.messages.length === 0) {
      return new Response(
        JSON.stringify({ error: "No messages provided" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const role = body.role ?? "user";

    if (role === "admin") {
      const session = await auth.api.getSession({ headers: await headers() });
      if (!session) {
        return new Response(
          JSON.stringify({ error: "Unauthorized: admin login required" }),
          { status: 401, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    const stream = await runAgent(body.messages, role);

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("Chat error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to process chat";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
