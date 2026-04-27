import { NextResponse } from "next/server";

/**
 * Lightweight liveness for monitors and App Store review (no auth, no DB).
 */
export async function GET() {
  return NextResponse.json({ ok: true, service: "common-collective-app" });
}
