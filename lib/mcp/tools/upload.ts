import { z } from "zod/v3";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { r2Client, getPublicUrl } from "@/lib/r2/client";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { requireAdmin } from "@/lib/mcp/auth";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const MAX_BASE64_SIZE = 3 * 1024 * 1024; // ~3MB base64 ≈ ~2.25MB binary

export function registerUploadTools(server: McpServer) {
  server.registerTool("upload_image", {
    title: "Upload Image",
    description: "[Admin] Upload a base64-encoded image to R2 storage. Returns the public URL. Max ~3MB base64 input.",
    inputSchema: {
      base64: z.string().describe("Base64-encoded image data (no data URI prefix)"),
      filename: z.string().describe("Filename (e.g. product-photo.jpg)"),
      contentType: z.enum(ALLOWED_TYPES as [string, ...string[]]).describe("MIME type"),
    },
  }, async ({ base64, filename, contentType }, extra) => {
    const denied = requireAdmin(extra.authInfo?.extra);
    if (denied) return denied;
    if (base64.length > MAX_BASE64_SIZE) {
      return {
        content: [{ type: "text", text: "Image too large. Max ~3MB base64 input." }],
        isError: true,
      };
    }

    const buffer = Buffer.from(base64, "base64");
    const timestamp = Date.now();
    const sanitizedName = filename.replace(/[^a-zA-Z0-9.-]/g, "-").toLowerCase();
    const key = `products/${timestamp}-${sanitizedName}`;

    await r2Client.send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME!,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      })
    );

    const url = getPublicUrl(key);

    return {
      content: [{ type: "text", text: JSON.stringify({ url, key }, null, 2) }],
    };
  });
}
