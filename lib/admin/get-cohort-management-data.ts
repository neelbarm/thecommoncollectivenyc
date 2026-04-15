import { prisma } from "@/lib/prisma";

export type CohortManagementMember = {
  membershipId: string;
  userId: string;
  name: string;
  email: string;
  neighborhood: string | null;
  status: string;
  joinedAt: string | null;
};

export type CohortManagementCohort = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  status: string;
  capacity: number;
  seasonId: string;
  seasonName: string;
  seasonCode: string;
  memberCount: number;
  members: CohortManagementMember[];
};

export type CohortManagementData = {
  cohorts: CohortManagementCohort[];
  seasons: { id: string; name: string; code: string; status: string }[];
  allMembers: { id: string; name: string; email: string }[];
};

export async function getCohortManagementData(): Promise<CohortManagementData> {
  const [cohorts, seasons, allMembers] = await Promise.all([
    prisma.cohort.findMany({
      orderBy: [{ season: { startsAt: "desc" } }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        status: true,
        capacity: true,
        seasonId: true,
        season: { select: { name: true, code: true } },
        memberships: {
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            userId: true,
            status: true,
            joinedAt: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                profile: { select: { neighborhood: true } },
              },
            },
          },
        },
      },
      take: 60,
    }),
    prisma.season.findMany({
      orderBy: { startsAt: "desc" },
      select: { id: true, name: true, code: true, status: true },
      take: 20,
    }),
    prisma.user.findMany({
      where: { role: "MEMBER", isActive: true },
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
      select: { id: true, firstName: true, lastName: true, email: true },
      take: 300,
    }),
  ]);

  return {
    cohorts: cohorts.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description,
      status: c.status,
      capacity: c.capacity,
      seasonId: c.seasonId,
      seasonName: c.season.name,
      seasonCode: c.season.code,
      memberCount: c.memberships.length,
      members: c.memberships.map((m) => ({
        membershipId: m.id,
        userId: m.userId,
        name: `${m.user.firstName} ${m.user.lastName}`.trim(),
        email: m.user.email,
        neighborhood: m.user.profile?.neighborhood ?? null,
        status: m.status,
        joinedAt: m.joinedAt?.toISOString() ?? null,
      })),
    })),
    seasons: seasons.map((s) => ({ ...s, status: s.status as string })),
    allMembers: allMembers.map((u) => ({
      id: u.id,
      name: `${u.firstName} ${u.lastName}`.trim(),
      email: u.email,
    })),
  };
}
