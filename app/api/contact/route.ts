import { NextRequest, NextResponse } from "next/server";
import { createContactMessage } from "@/lib/db/queries/contact";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, message } = body;

    if (!name || !message) {
      return NextResponse.json(
        { error: "Name and message are required" },
        { status: 400 }
      );
    }

    const msg = await createContactMessage({
      name,
      email: email || undefined,
      phone: phone || undefined,
      message,
    });

    return NextResponse.json(
      { success: true, id: msg.id },
      { status: 201 }
    );
  } catch (error) {
    console.error("Contact form error:", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}
