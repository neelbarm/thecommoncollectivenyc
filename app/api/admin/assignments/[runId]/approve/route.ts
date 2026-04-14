import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/require-admin";
import { promoteAssignmentRun } from "@/lib/assignments/promote-run";

export async function POST(
  _request: Request,
  context: { params: Promise<{ runId: string }> },
) {
  const session = await requireAdmin();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { runId } = await context.params;

  try {
    const result = await promoteAssignmentRun(runId, session.user.id);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Unable to approve assignment run right now." },
      { status: 500 },
    );
  }
}
