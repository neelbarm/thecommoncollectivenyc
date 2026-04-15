import { prisma } from "@/lib/prisma";

export function slugifyVenueName(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Resolves a unique venue slug, optionally excluding one venue (for updates).
 */
export async function resolveUniqueVenueSlug(
  baseSlug: string,
  excludeVenueId?: string,
): Promise<string> {
  let slug = baseSlug;
  let attempt = 0;
  while (true) {
    const existing = await prisma.venue.findFirst({
      where: {
        slug,
        ...(excludeVenueId ? { NOT: { id: excludeVenueId } } : {}),
      },
      select: { id: true },
    });
    if (!existing) return slug;
    attempt++;
    slug = `${baseSlug}-${attempt}`;
  }
}
