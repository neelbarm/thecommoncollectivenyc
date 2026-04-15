import { SeasonStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { countEventsOutsideProposedSeasonWindow } from "@/lib/admin/validate-event-program";
import { requireAdmin } from "@/lib/auth/require-admin";
import { prisma } from "@/lib/prisma";

const updateSeasonSchema = z
  .object({
    status: z.nativeEnum(SeasonStatus).optional(),
    name: z.string().trim().min(2).max(80).optional(),
    code: z
      .string()
      .trim()
      .min(2)
      .max(16)
      .transform((c) => c.toUpperCase())
      .optional(),
    startsAt: z.string().datetime().optional(),
    endsAt: z.string().datetime().optional(),
  })
  .refine((d) => Object.values(d).some((v) => v !== undefined), {
    message: "At least one field must be provided.",
  })
  .superRefine((d, ctx) => {
    if (d.startsAt !== undefined && d.endsAt !== undefined) {
      if (new Date(d.endsAt).getTime() <= new Date(d.startsAt).getTime()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Season end must be after start.",
          path: ["endsAt"],
        });
      }
    }
  });

export async function PATCH(
  request: Request,
  context: {
    params: Promise<{ seasonId: string }>;
  },
) {
  const session = await requireAdmin();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { seasonId } = await context.params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  const parsed = updateSeasonSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid season update payload" },
      { status: 400 },
    );
  }

  try {
    const existing = await prisma.season.findUnique({
      where: { id: seasonId },
      select: { id: true, startsAt: true, endsAt: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Season not found" }, { status: 404 });
    }

    const nextStarts =
      parsed.data.startsAt !== undefined ? new Date(parsed.data.startsAt) : existing.startsAt;
    const nextEnds =
      parsed.data.endsAt !== undefined ? new Date(parsed.data.endsAt) : existing.endsAt;

    if (nextEnds.getTime() <= nextStarts.getTime()) {
      return NextResponse.json(
        { error: "Season end must be after start." },
        { status: 400 },
      );
    }

    if (parsed.data.startsAt !== undefined || parsed.data.endsAt !== undefined) {
      const outside = await countEventsOutsideProposedSeasonWindow(seasonId, nextStarts, nextEnds);
      if (outside > 0) {
        return NextResponse.json(
          {
            error: `Cannot shrink season dates: ${outside} event(s) would fall outside the new window. Adjust or move those events first.`,
          },
          { status: 400 },
        );
      }
    }

    const data: Record<string, unknown> = {};
    if (parsed.data.status !== undefined) data.status = parsed.data.status;
    if (parsed.data.name !== undefined) data.name = parsed.data.name;
    if (parsed.data.code !== undefined) data.code = parsed.data.code;
    if (parsed.data.startsAt !== undefined) data.startsAt = nextStarts;
    if (parsed.data.endsAt !== undefined) data.endsAt = nextEnds;

    const updated = await prisma.season.update({
      where: { id: seasonId },
      data,
      select: {
        id: true,
        name: true,
        code: true,
        status: true,
        startsAt: true,
        endsAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ ok: true, season: updated });
  } catch (e) {
    if (
      e &&
      typeof e === "object" &&
      "code" in e &&
      (e as { code?: string }).code === "P2002"
    ) {
      return NextResponse.json(
        { error: "A season with this code already exists." },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: "Unable to update season right now." }, { status: 500 });
  }
}
