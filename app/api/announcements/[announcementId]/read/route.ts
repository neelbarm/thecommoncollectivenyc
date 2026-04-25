import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const paramsSchema = z.object({
  announcementId: z.string().cuid(),
});

export async function POST(
  _request: Request,
  context: { params: Promise<{ announcementId: string }> },
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsedParams = paramsSchema.safeParse(await context.params);

  if (!parsedParams.success) {
    return NextResponse.json({ error: "Invalid announcement." }, { status: 400 });
  }

  try {
    await prisma.announcementRead.upsert({
      where: {
        announcementId_userId: {
          announcementId: parsedParams.data.announcementId,
          userId: session.user.id,
        },
      },
      create: {
        announcementId: parsedParams.data.announcementId,
        userId: session.user.id,
        readAt: new Date(),
      },
      update: {
        readAt: new Date(),
      },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Unable to mark this announcement as read." }, { status: 500 });
  }
}
