import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/require-admin";
import { prisma } from "@/lib/prisma";

const createAdminNoteSchema = z.object({
  body: z.string().trim().min(6, "Note should be at least 6 characters.").max(800),
  subjectUserId: z.string().cuid().optional(),
  applicationId: z.string().cuid().optional(),
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

  const parsed = createAdminNoteSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid note payload" },
      { status: 400 },
    );
  }

  try {
    const note = await prisma.adminNote.create({
      data: {
        adminId: session.user.id,
        body: parsed.data.body,
        subjectUserId: parsed.data.subjectUserId,
        applicationId: parsed.data.applicationId,
      },
      select: {
        id: true,
        body: true,
        createdAt: true,
        applicationId: true,
        admin: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        subjectUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return NextResponse.json({
      ok: true,
      note: {
        id: note.id,
        body: note.body,
        createdAt: note.createdAt.toISOString(),
        applicationId: note.applicationId,
        adminName: `${note.admin.firstName} ${note.admin.lastName}`,
        subjectUserId: note.subjectUser?.id ?? null,
        subjectUserName: note.subjectUser
          ? `${note.subjectUser.firstName} ${note.subjectUser.lastName}`
          : null,
      },
    });
  } catch {
    return NextResponse.json({ error: "Unable to save note right now." }, { status: 500 });
  }
}
