import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { registerDevicePushToken } from "@/lib/push/register-device-push-token";

const registerTokenSchema = z.object({
  platform: z.string().trim().min(1).max(32),
  token: z.string().trim().min(16).max(4096),
  appBundle: z.string().trim().min(1).max(256).optional(),
  environment: z.string().trim().min(1).max(64).optional(),
  deviceModel: z.string().trim().min(1).max(128).optional(),
  osVersion: z.string().trim().min(1).max(64).optional(),
  locale: z.string().trim().min(1).max(64).optional(),
});

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = registerTokenSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid push token payload." },
      { status: 400 },
    );
  }

  try {
    const token = await registerDevicePushToken({
      userId: session.user.id,
      ...parsed.data,
    });
    return NextResponse.json({ ok: true, token });
  } catch {
    return NextResponse.json({ error: "Unable to register device token right now." }, { status: 500 });
  }
}
