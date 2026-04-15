import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/require-admin";
import { prisma } from "@/lib/prisma";
import { resolveUniqueVenueSlug, slugifyVenueName } from "@/lib/admin/venue-slug";

const updateVenueSchema = z
  .object({
    name: z.string().trim().min(2).max(120).optional(),
    addressLine1: z.string().trim().min(2).max(200).optional(),
    addressLine2: z
      .string()
      .trim()
      .max(200)
      .nullable()
      .optional()
      .transform((v) => (v === "" ? null : v)),
    city: z.string().trim().min(2).max(80).optional(),
    state: z.string().trim().min(2).max(8).optional(),
    postalCode: z.string().trim().min(3).max(16).optional(),
    capacity: z.number().int().min(2).max(500).optional(),
    notes: z
      .string()
      .trim()
      .max(2000)
      .nullable()
      .optional()
      .transform((v) => (v === "" ? null : v)),
  })
  .refine((d) => Object.values(d).some((v) => v !== undefined), {
    message: "At least one field must be provided.",
  });

export async function PATCH(
  request: Request,
  context: { params: Promise<{ venueId: string }> },
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

  const parsed = updateVenueSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid venue update." },
      { status: 400 },
    );
  }

  const { venueId } = await context.params;

  try {
    const existing = await prisma.venue.findUnique({
      where: { id: venueId },
      select: { id: true, name: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Venue not found." }, { status: 404 });
    }

    const data: Record<string, unknown> = {};
    if (parsed.data.name !== undefined) {
      data.name = parsed.data.name;
      if (parsed.data.name.trim() !== existing.name) {
        const baseSlug = slugifyVenueName(parsed.data.name);
        if (!baseSlug) {
          return NextResponse.json({ error: "Venue name produces an invalid slug." }, { status: 400 });
        }
        data.slug = await resolveUniqueVenueSlug(baseSlug, venueId);
      }
    }
    if (parsed.data.addressLine1 !== undefined) data.addressLine1 = parsed.data.addressLine1;
    if (parsed.data.addressLine2 !== undefined) data.addressLine2 = parsed.data.addressLine2;
    if (parsed.data.city !== undefined) data.city = parsed.data.city;
    if (parsed.data.state !== undefined) data.state = parsed.data.state;
    if (parsed.data.postalCode !== undefined) data.postalCode = parsed.data.postalCode;
    if (parsed.data.capacity !== undefined) data.capacity = parsed.data.capacity;
    if (parsed.data.notes !== undefined) data.notes = parsed.data.notes;

    const venue = await prisma.venue.update({
      where: { id: venueId },
      data,
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

    return NextResponse.json({ ok: true, venue });
  } catch {
    return NextResponse.json({ error: "Unable to update venue right now." }, { status: 500 });
  }
}
