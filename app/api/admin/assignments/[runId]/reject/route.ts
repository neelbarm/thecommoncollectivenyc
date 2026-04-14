import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/require-admin";
import { prisma } from "@/lib/prisma";

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
    const run = await prisma.assignmentRun.findUnique({
      where: { id: runId },
      select: { id: true, status: true },
    });

    if (!run) {
      return NextResponse.json({ error: "Assignment run not found." }, { status: 404 });
    }

    if (run.status !== "PENDING_REVIEW" && run.status !== "DRAFT") {
      return NextResponse.json(
        { error: `Run cannot be rejected from status "${run.status}".` },
        { status: 400 },
      );
    }

    await prisma.assignmentRun.update({
      where: { id: runId },
      data: { status: "REJECTED" },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Unable to reject assignment run right now." },
      { status: 500 },
    );
  }
}
