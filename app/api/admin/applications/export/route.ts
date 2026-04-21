import type { ApplicationStatus, Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

import { createApplicationTextExportArchive } from "@/lib/admin/application-export";
import { requireAdmin } from "@/lib/auth/require-admin";
import { prisma } from "@/lib/prisma";

const applicationInclude = {
  reviewedBy: {
    select: {
      firstName: true,
      lastName: true,
    },
  },
  responses: {
    orderBy: [{ section: "asc" as const }, { questionKey: "asc" as const }],
    select: {
      questionKey: true,
      section: true,
      response: true,
      updatedAt: true,
    },
  },
  notes: {
    orderBy: { createdAt: "desc" as const },
    select: {
      id: true,
      body: true,
      createdAt: true,
      admin: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
    },
  },
  user: {
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      createdAt: true,
      profile: {
        select: {
          neighborhood: true,
          ageRange: true,
          occupation: true,
          socialGoal: true,
          preferredNights: true,
          budgetComfort: true,
          drinkingPreference: true,
          smokingPreference: true,
          physicalActivityLevel: true,
          timePreference: true,
          plansFrequency: true,
          idealGroupEnergy: true,
          interests: true,
          preferredVibe: true,
          peopleToMeet: true,
          idealWeek: true,
          onboardingCompletedAt: true,
        },
      },
      cohortMemberships: {
        where: {
          status: {
            in: ["INVITED", "ACTIVE", "PAUSED", "COMPLETED"],
          },
        },
        orderBy: {
          createdAt: "desc" as const,
        },
        select: {
          status: true,
          createdAt: true,
          cohort: {
            select: {
              name: true,
              slug: true,
              season: {
                select: {
                  code: true,
                  name: true,
                },
              },
            },
          },
        },
      },
    },
  },
} satisfies Prisma.MemberApplicationInclude;

function buildWhere(searchParams: URLSearchParams): Prisma.MemberApplicationWhereInput {
  const andParts: Prisma.MemberApplicationWhereInput[] = [];

  const statusParam = searchParams.get("status");
  if (statusParam) {
    andParts.push({ status: statusParam as ApplicationStatus });
  }

  const seasonId = searchParams.get("seasonId");
  if (seasonId) {
    andParts.push({
      user: {
        cohortMemberships: {
          some: {
            cohort: { seasonId },
          },
        },
      },
    });
  }

  const cohortId = searchParams.get("cohortId");
  if (cohortId) {
    andParts.push({
      user: {
        cohortMemberships: {
          some: { cohortId },
        },
      },
    });
  }

  const query = searchParams.get("query")?.trim();
  if (query) {
    andParts.push({
      OR: [
        { headline: { contains: query, mode: "insensitive" } },
        { aboutText: { contains: query, mode: "insensitive" } },
        { availability: { contains: query, mode: "insensitive" } },
        { user: { firstName: { contains: query, mode: "insensitive" } } },
        { user: { lastName: { contains: query, mode: "insensitive" } } },
        { user: { email: { contains: query, mode: "insensitive" } } },
      ],
    });
  }

  if (andParts.length === 0) {
    return {};
  }

  return { AND: andParts };
}

export async function GET(request: Request) {
  const session = await requireAdmin();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const where = buildWhere(searchParams);

    const applications = await prisma.memberApplication.findMany({
      where,
      orderBy: [{ submittedAt: "desc" }, { createdAt: "desc" }],
      include: applicationInclude,
      take: 500,
    });

    const exportApplications = applications.map((application) => ({
      ...application,
      reviewerName: application.reviewedBy
        ? `${application.reviewedBy.firstName} ${application.reviewedBy.lastName}`.trim()
        : null,
      notes: application.notes.map((note) => ({
        ...note,
        author: note.admin,
      })),
    }));

    const archive = createApplicationTextExportArchive(exportApplications);
    const exportedAt = new Date().toISOString().slice(0, 10);
    const fileName = `common-collective-applications-${exportedAt}.tar`;

    return new NextResponse(new Uint8Array(archive), {
      status: 200,
      headers: {
        "Content-Type": "application/x-tar",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return NextResponse.json({ error: "Unable to export applications right now." }, { status: 500 });
  }
}
