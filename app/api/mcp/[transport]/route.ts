import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { verifyApiKey } from "@/lib/mcp/auth";
import { registerCategoryTools } from "@/lib/mcp/tools/categories";
import { registerProductTools } from "@/lib/mcp/tools/products";
import { registerOrderTools } from "@/lib/mcp/tools/orders";
import { registerUploadTools } from "@/lib/mcp/tools/upload";

function createServer() {
  const server = new McpServer(
    { name: "sh-apparels", version: "1.0.0" },
    { capabilities: { tools: {} } }
  );

  registerCategoryTools(server);
  registerProductTools(server);
  registerOrderTools(server);
  registerUploadTools(server);

  return server;
}

async function handler(req: Request) {
  // Auth check
  const authHeader = req.headers.get("Authorization");
  const [type, token] = authHeader?.split(" ") ?? [];
  const bearerToken = type?.toLowerCase() === "bearer" ? token : undefined;

  const authInfo = await verifyApiKey(req, bearerToken);
  if (!authInfo) {
    return new Response(
      JSON.stringify({ error: "invalid_token", error_description: "Invalid or missing API key" }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  // Create fresh server + transport per request (stateless)
  const server = createServer();
  const transport = new WebStandardStreamableHTTPServerTransport();
  await server.connect(transport);

  return transport.handleRequest(req, { authInfo });
}

export { handler as GET, handler as POST };
