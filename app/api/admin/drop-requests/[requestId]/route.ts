import { DropRequestStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/require-admin";
import { prisma } from "@/lib/prisma";

const updateDropRequestSchema = z.object({
  status: z.nativeEnum(DropRequestStatus),
});

export async function PATCH(
  request: Request,
  context: {
    params: Promise<{ requestId: string }>;
  },
) {
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
  const parsed = updateDropRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid drop request update payload." },
      { status: 400 },
    );
  }

  const { requestId } = await context.params;
  const existing = await prisma.dropRequest.findUnique({
    where: { id: requestId },
    select: { id: true },
  });

  if (!existing) {
    return NextResponse.json({ error: "Drop request not found." }, { status: 404 });
  }

  const updated = await prisma.dropRequest.update({
    where: { id: requestId },
    data: {
      status: parsed.data.status,
    },
    select: {
      id: true,
      status: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({ ok: true, request: updated });
}
