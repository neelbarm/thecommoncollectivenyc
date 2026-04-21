import { NextResponse } from "next/server";

import { buildTarArchive, createApplicationExportFiles } from "@/lib/admin/application-export";
import { requireAdmin } from "@/lib/auth/require-admin";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await requireAdmin();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const applications = await prisma.memberApplication.findMany({
      orderBy: [{ submittedAt: "desc" }, { createdAt: "desc" }],
      include: {
        reviewedBy: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        responses: {
          orderBy: [{ section: "asc" }, { questionKey: "asc" }],
          select: {
            questionKey: true,
            section: true,
            response: true,
            updatedAt: true,
          },
        },
        notes: {
          orderBy: { createdAt: "desc" },
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
                createdAt: "desc",
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
      },
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

    const archive = buildTarArchive(createApplicationExportFiles(exportApplications));
    const exportedAt = new Date().toISOString().slice(0, 10);
    const fileName = `common-collective-applications-${exportedAt}.tar`;

    return new NextResponse(archive, {
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
