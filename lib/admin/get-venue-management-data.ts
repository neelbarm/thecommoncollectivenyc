import { prisma } from "@/lib/prisma";

export type VenueManagementVenue = {
  id: string;
  name: string;
  slug: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  postalCode: string;
  capacity: number;
  notes: string | null;
  eventCount: number;
};

export type VenueManagementData = {
  venues: VenueManagementVenue[];
};

export async function getVenueManagementData(): Promise<VenueManagementData> {
  const rows = await prisma.venue.findMany({
    orderBy: { name: "asc" },
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
      _count: { select: { events: true } },
    },
  });

  return {
    venues: rows.map((v) => ({
      id: v.id,
      name: v.name,
      slug: v.slug,
      addressLine1: v.addressLine1,
      addressLine2: v.addressLine2,
      city: v.city,
      state: v.state,
      postalCode: v.postalCode,
      capacity: v.capacity,
      notes: v.notes,
      eventCount: v._count.events,
    })),
  };
}
