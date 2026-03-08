import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const text = typeof body?.text === "string" ? body.text : "";
  // TODO: implement spelling correction
  return NextResponse.json({ corrected: text || "" });
}
