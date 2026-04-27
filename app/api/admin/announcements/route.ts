import { AnnouncementAudience } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/require-admin";
import { fanoutAnnouncementPush } from "@/lib/push/fanout";
import { prisma } from "@/lib/prisma";

const createAnnouncementSchema = z
  .object({
    title: z.string().trim().min(4, "Title should be at least 4 characters.").max(120),
    body: z.string().trim().min(10, "Announcement should be at least 10 characters.").max(1200),
    audience: z.nativeEnum(AnnouncementAudience),
    seasonId: z.string().cuid().optional(),
    cohortId: z.string().cuid().optional(),
    isPinned: z.boolean().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.audience === AnnouncementAudience.SEASON && !value.seasonId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Season announcements require a season.",
        path: ["seasonId"],
      });
    }

    if (value.audience === AnnouncementAudience.COHORT && !value.cohortId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Cohort announcements require a cohort.",
        path: ["cohortId"],
      });
    }
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

  const parsed = createAnnouncementSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid announcement payload." },
      { status: 400 },
    );
  }

  try {
    if (parsed.data.seasonId) {
      const season = await prisma.season.findUnique({
        where: { id: parsed.data.seasonId },
        select: { id: true },
      });

      if (!season) {
        return NextResponse.json({ error: "Season not found." }, { status: 404 });
      }
    }

    if (parsed.data.cohortId) {
      const cohort = await prisma.cohort.findUnique({
        where: { id: parsed.data.cohortId },
        select: { id: true, seasonId: true },
      });

      if (!cohort) {
        return NextResponse.json({ error: "Cohort not found." }, { status: 404 });
      }

      if (parsed.data.seasonId && cohort.seasonId !== parsed.data.seasonId) {
        return NextResponse.json(
          { error: "Selected cohort does not belong to the selected season." },
          { status: 400 },
        );
      }
    }

    const announcement = await prisma.announcement.create({
      data: {
        title: parsed.data.title,
        body: parsed.data.body,
        audience: parsed.data.audience,
        seasonId: parsed.data.seasonId,
        cohortId: parsed.data.cohortId,
        isPinned: parsed.data.isPinned ?? false,
        createdById: session.user.id,
      },
      include: {
        createdBy: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        cohort: {
          select: {
            name: true,
          },
        },
        season: {
          select: {
            name: true,
          },
        },
      },
    });

    // Fire-and-forget fanout so admin publishing is never blocked by push provider latency.
    void fanoutAnnouncementPush({
      announcementId: announcement.id,
      title: announcement.title,
      body: announcement.body,
      audience: announcement.audience,
      seasonId: announcement.seasonId ?? null,
      cohortId: announcement.cohortId ?? null,
    });

    return NextResponse.json({
      ok: true,
      announcement: {
        id: announcement.id,
        title: announcement.title,
        body: announcement.body,
        audience: announcement.audience,
        isPinned: announcement.isPinned,
        publishedAt: announcement.publishedAt.toISOString(),
        createdByName: `${announcement.createdBy.firstName} ${announcement.createdBy.lastName}`,
        seasonId: announcement.seasonId,
        cohortName: announcement.cohort?.name ?? null,
        cohortId: announcement.cohortId,
        seasonName: announcement.season?.name ?? null,
      },
    });
  } catch {
    return NextResponse.json({ error: "Unable to create announcement right now." }, { status: 500 });
  }
}
