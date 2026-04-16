import { ApplicationStatus, type QuestionnaireSection } from "@prisma/client";

import { prisma } from "@/lib/prisma";

function toIso(value: Date | null) {
  return value ? value.toISOString() : null;
}

function fullName(firstName: string, lastName: string) {
  return `${firstName} ${lastName}`.trim();
}

export type AdminApplicationReviewData = {
  generatedAt: string;
  statusOptions: ApplicationStatus[];
  seasonFilters: Array<{
    id: string;
    label: string;
  }>;
  applications: Array<{
    id: string;
    status: ApplicationStatus;
    submittedAt: string | null;
    reviewedAt: string | null;
    reviewerName: string | null;
    headline: string;
    aboutText: string;
    availability: string;
    notesCount: number;
    currentSeasonId: string | null;
    currentSeasonCode: string | null;
    currentCohortName: string | null;
    member: {
      id: string;
      name: string;
      email: string;
      createdAt: string;
      isActive: boolean;
      onboardingCompletedAt: string | null;
      profile: {
        neighborhood: string | null;
        ageRange: string | null;
        occupation: string | null;
        socialGoal: string | null;
        preferredNights: string | null;
        budgetComfort: string | null;
        drinkingPreference: string | null;
        smokingPreference: string | null;
        physicalActivityLevel: string | null;
        timePreference: string | null;
        plansFrequency: string | null;
        idealGroupEnergy: string | null;
        interests: string[];
        preferredVibe: string[];
        peopleToMeet: string | null;
        idealWeek: string | null;
      };
      activeMemberships: Array<{
        cohortId: string;
        cohortName: string;
        seasonCode: string;
        status: string;
      }>;
    };
    responses: Array<{
      id: string;
      questionKey: string;
      section: QuestionnaireSection;
      response: string;
      updatedAt: string;
    }>;
  }>;
};

export async function getApplicationReviewData(): Promise<AdminApplicationReviewData> {
  const applications = await prisma.memberApplication.findMany({
    orderBy: [{ submittedAt: "desc" }, { createdAt: "desc" }],
    include: {
      reviewedBy: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
      notes: {
        select: { id: true },
      },
      responses: {
        orderBy: [{ section: "asc" }, { questionKey: "asc" }],
        select: {
          id: true,
          questionKey: true,
          section: true,
          response: true,
          updatedAt: true,
        },
      },
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          isActive: true,
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
            where: { status: { in: ["INVITED", "ACTIVE", "PAUSED"] } },
            orderBy: { createdAt: "desc" },
            select: {
              cohortId: true,
              status: true,
              cohort: {
                select: {
                  seasonId: true,
                  name: true,
                  season: {
                    select: { code: true },
                  },
                },
              },
            },
          },
        },
      },
    },
    take: 150,
  });

  const seasonFilterMap = new Map<string, string>();

  for (const application of applications) {
    for (const membership of application.user.cohortMemberships) {
      if (!seasonFilterMap.has(membership.cohort.seasonId)) {
        seasonFilterMap.set(membership.cohort.seasonId, membership.cohort.season.code);
      }
    }
  }

  return {
    generatedAt: new Date().toISOString(),
    statusOptions: Object.values(ApplicationStatus),
    seasonFilters: Array.from(seasonFilterMap.entries())
      .map(([id, code]) => ({ id, label: code }))
      .sort((a, b) => a.label.localeCompare(b.label)),
    applications: applications.map((application) => ({
      ...(function () {
        const primaryMembership = application.user.cohortMemberships[0];
        return {
          currentSeasonId: primaryMembership?.cohort.seasonId ?? null,
          currentSeasonCode: primaryMembership?.cohort.season.code ?? null,
          currentCohortName: primaryMembership?.cohort.name ?? null,
        };
      })(),
      id: application.id,
      status: application.status,
      submittedAt: toIso(application.submittedAt),
      reviewedAt: toIso(application.reviewedAt),
      reviewerName: application.reviewedBy
        ? fullName(application.reviewedBy.firstName, application.reviewedBy.lastName)
        : null,
      headline: application.headline,
      aboutText: application.aboutText,
      availability: application.availability,
      notesCount: application.notes.length,
      member: {
        id: application.user.id,
        name: fullName(application.user.firstName, application.user.lastName),
        email: application.user.email,
        createdAt: application.user.createdAt.toISOString(),
        isActive: application.user.isActive,
        onboardingCompletedAt: toIso(application.user.profile?.onboardingCompletedAt ?? null),
        profile: {
          neighborhood: application.user.profile?.neighborhood ?? null,
          ageRange: application.user.profile?.ageRange ?? null,
          occupation: application.user.profile?.occupation ?? null,
          socialGoal: application.user.profile?.socialGoal ?? null,
          preferredNights: application.user.profile?.preferredNights ?? null,
          budgetComfort: application.user.profile?.budgetComfort ?? null,
          drinkingPreference: application.user.profile?.drinkingPreference ?? null,
          smokingPreference: application.user.profile?.smokingPreference ?? null,
          physicalActivityLevel: application.user.profile?.physicalActivityLevel ?? null,
          timePreference: application.user.profile?.timePreference ?? null,
          plansFrequency: application.user.profile?.plansFrequency ?? null,
          idealGroupEnergy: application.user.profile?.idealGroupEnergy ?? null,
          interests: application.user.profile?.interests ?? [],
          preferredVibe: application.user.profile?.preferredVibe ?? [],
          peopleToMeet: application.user.profile?.peopleToMeet ?? null,
          idealWeek: application.user.profile?.idealWeek ?? null,
        },
        activeMemberships: application.user.cohortMemberships.map((membership) => ({
          cohortId: membership.cohortId,
          cohortName: membership.cohort.name,
          seasonCode: membership.cohort.season.code,
          status: membership.status,
        })),
      },
      responses: application.responses.map((response) => ({
        id: response.id,
        questionKey: response.questionKey,
        section: response.section,
        response: response.response,
        updatedAt: response.updatedAt.toISOString(),
      })),
    })),
  };
}
