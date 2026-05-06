import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth/server";
import { uploadDocument, listDocuments } from "@/lib/ai/documents";

export const runtime = "nodejs";
export const maxDuration = 60;

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const documents = await listDocuments();
    return NextResponse.json({ documents });
  } catch (error) {
    console.error("Failed to list documents:", error);
    return NextResponse.json(
      { error: "Failed to list documents" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const allowedTypes = ["pdf", "txt", "docx"];
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!ext || !allowedTypes.includes(ext)) {
      return NextResponse.json(
        {
          error: `Unsupported file type: .${ext}. Allowed: ${allowedTypes.join(", ")}`,
        },
        { status: 400 }
      );
    }

    const document = await uploadDocument(file);
    return NextResponse.json({ document }, { status: 201 });
  } catch (error) {
    console.error("Failed to upload document:", error);
    const message =
      error instanceof Error ? error.message : "Failed to upload document";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
