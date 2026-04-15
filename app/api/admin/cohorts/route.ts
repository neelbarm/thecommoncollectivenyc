import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/require-admin";
import { prisma } from "@/lib/prisma";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const createCohortSchema = z.object({
  seasonId: z.string().cuid(),
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(80),
  description: z.string().trim().max(400).optional(),
  capacity: z.number().int().min(2).max(100),
  status: z.enum(["FORMING", "ACTIVE", "COMPLETED"]).default("FORMING"),
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

  const parsed = createCohortSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid cohort payload." },
      { status: 400 },
    );
  }

  const baseSlug = slugify(parsed.data.name);
  if (!baseSlug) {
    return NextResponse.json({ error: "Cohort name produces an invalid slug." }, { status: 400 });
  }

  try {
    const season = await prisma.season.findUnique({
      where: { id: parsed.data.seasonId },
      select: { id: true },
    });
    if (!season) {
      return NextResponse.json({ error: "Season not found." }, { status: 404 });
    }

    // Ensure unique slug
    let slug = baseSlug;
    let attempt = 0;
    while (true) {
      const existing = await prisma.cohort.findUnique({ where: { slug }, select: { id: true } });
      if (!existing) break;
      attempt++;
      slug = `${baseSlug}-${attempt}`;
    }

    const cohort = await prisma.cohort.create({
      data: {
        seasonId: parsed.data.seasonId,
        name: parsed.data.name,
        slug,
        description: parsed.data.description ?? null,
        capacity: parsed.data.capacity,
        status: parsed.data.status,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        status: true,
        capacity: true,
        seasonId: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ ok: true, cohort }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Unable to create cohort right now." }, { status: 500 });
  }
}
