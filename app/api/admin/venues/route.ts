import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/require-admin";
import { prisma } from "@/lib/prisma";
import { resolveUniqueVenueSlug, slugifyVenueName } from "@/lib/admin/venue-slug";

const createVenueSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters.").max(120),
  addressLine1: z.string().trim().min(2, "Address line 1 is required.").max(200),
  addressLine2: z
    .string()
    .trim()
    .max(200)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined)),
  city: z.string().trim().min(2, "City is required.").max(80),
  state: z.string().trim().min(2, "State is required.").max(8),
  postalCode: z.string().trim().min(3, "Postal code is required.").max(16),
  capacity: z.number().int().min(2, "Capacity must be at least 2.").max(500),
  notes: z
    .string()
    .trim()
    .max(2000)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined)),
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

  const parsed = createVenueSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid venue payload." },
      { status: 400 },
    );
  }

  const baseSlug = slugifyVenueName(parsed.data.name);
  if (!baseSlug) {
    return NextResponse.json({ error: "Venue name produces an invalid slug." }, { status: 400 });
  }

  try {
    const slug = await resolveUniqueVenueSlug(baseSlug);

    const venue = await prisma.venue.create({
      data: {
        name: parsed.data.name,
        slug,
        addressLine1: parsed.data.addressLine1,
        addressLine2: parsed.data.addressLine2 ?? null,
        city: parsed.data.city,
        state: parsed.data.state,
        postalCode: parsed.data.postalCode,
        capacity: parsed.data.capacity,
        notes: parsed.data.notes ?? null,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        addressLine1: true,
        addressLine2: true,
        city: true,
        state: true,
        postalCode: true,
        capacity: true,
        notes: true,
      },
    });

    return NextResponse.json({ ok: true, venue }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Unable to create venue right now." }, { status: 500 });
  }
}
