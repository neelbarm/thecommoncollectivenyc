import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/require-admin";
import { generateAssignmentRun } from "@/lib/assignments/generate-run";

const createRunSchema = z.object({
  seasonId: z.string().cuid(),
});

export async function POST(request: Request) {
  const session = await requireAdmin();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = createRunSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid payload." },
      { status: 400 },
    );
  }

  try {
    const result = await generateAssignmentRun(parsed.data.seasonId, session.user.id);
    if (result.error) {
      return NextResponse.json({ ok: true, runId: result.runId, warning: result.error });
    }
    return NextResponse.json({ ok: true, runId: result.runId }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Unable to generate assignment run right now." },
      { status: 500 },
    );
  }
}
