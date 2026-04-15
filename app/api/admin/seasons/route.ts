import { SeasonStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/require-admin";
import { prisma } from "@/lib/prisma";

const createSeasonSchema = z
  .object({
    name: z.string().trim().min(2, "Name must be at least 2 characters.").max(80),
    code: z
      .string()
      .trim()
      .min(2, "Code must be at least 2 characters.")
      .max(16)
      .transform((c) => c.toUpperCase()),
    startsAt: z.string().datetime({ message: "Invalid start date." }),
    endsAt: z.string().datetime({ message: "Invalid end date." }),
    status: z.nativeEnum(SeasonStatus).optional().default(SeasonStatus.PLANNING),
  })
  .refine((d) => new Date(d.endsAt).getTime() > new Date(d.startsAt).getTime(), {
    message: "Season end must be after start.",
    path: ["endsAt"],
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

  const parsed = createSeasonSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid season payload." },
      { status: 400 },
    );
  }

  const startsAt = new Date(parsed.data.startsAt);
  const endsAt = new Date(parsed.data.endsAt);

  try {
    const season = await prisma.season.create({
      data: {
        name: parsed.data.name,
        code: parsed.data.code,
        startsAt,
        endsAt,
        status: parsed.data.status,
      },
      select: {
        id: true,
        name: true,
        code: true,
        status: true,
        startsAt: true,
        endsAt: true,
      },
    });

    return NextResponse.json({ ok: true, season }, { status: 201 });
  } catch (e) {
    if (
      e &&
      typeof e === "object" &&
      "code" in e &&
      (e as { code?: string }).code === "P2002"
    ) {
      return NextResponse.json(
        { error: "A season with this code already exists. Choose a different code." },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: "Unable to create season right now." }, { status: 500 });
  }
}
