import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { trackEvent } from "@/lib/analytics/track";

const clientTrackSchema = z.object({
  name: z.enum([
    "signup_started",
    "onboarding_started",
    "onboarding_step_completed",
  ]),
  anonymousId: z.string().trim().min(8).max(128).optional(),
  path: z.string().trim().min(1).max(256).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  dedupeKey: z.string().trim().min(1).max(256).optional(),
});

export async function POST(request: Request) {
  const session = await auth();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = clientTrackSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid analytics payload." },
      { status: 400 },
    );
  }

  await trackEvent({
    name: parsed.data.name,
    actorUserId: session?.user?.id ?? null,
    anonymousId: parsed.data.anonymousId ?? null,
    path: parsed.data.path ?? null,
    metadata: parsed.data.metadata,
    dedupeKey: parsed.data.dedupeKey,
  });

  return NextResponse.json({ ok: true });
}
