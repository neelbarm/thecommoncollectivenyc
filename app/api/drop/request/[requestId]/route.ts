import { DropRequestStatus } from "@prisma/client";
import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  context: {
    params: Promise<{ requestId: string }>;
  },
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { requestId } = await context.params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const action = typeof body === "object" && body ? (body as { action?: string }).action : undefined;

  if (action !== "cancel") {
    return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
  }

  const existing = await prisma.dropRequest.findUnique({
    where: { id: requestId },
    select: {
      id: true,
      requesterId: true,
      status: true,
    },
  });

  if (!existing || existing.requesterId !== session.user.id) {
    return NextResponse.json({ error: "Request not found" }, { status: 404 });
  }

  const cancellableStatuses = new Set<DropRequestStatus>([
    DropRequestStatus.OPEN,
    DropRequestStatus.MATCHED,
  ]);

  if (!cancellableStatuses.has(existing.status)) {
    return NextResponse.json(
      { error: "Only active Drop requests can be cancelled." },
      { status: 409 },
    );
  }

  const updated = await prisma.dropRequest.update({
    where: { id: requestId },
    data: {
      status: DropRequestStatus.WITHDRAWN,
    },
    select: {
      id: true,
      status: true,
    },
  });

  return NextResponse.json({ ok: true, request: updated });
}
