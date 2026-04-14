import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

import { auth } from "@/auth";
import {
  ONBOARDING_RESPONSE_DEFINITIONS,
  ONBOARDING_RESPONSE_KEYS,
} from "@/lib/onboarding/constants";
import { prisma } from "@/lib/prisma";
import { onboardingDraftSchema, onboardingSchema } from "@/lib/validations/onboarding";

type OnboardingPayload = {
  firstName?: string;
  lastName?: string;
  email?: string;
  neighborhood?: string;
  ageRange?: string;
  occupation?: string;
  socialGoal?: string;
  interests?: string[];
  preferredNights?: string;
  preferredVibe?: string[];
  budgetComfort?: string;
  drinkingPreference?: string;
  smokingPreference?: string;
  physicalActivityComfort?: string;
  timePreference?: string;
  plansFrequency?: string;
  idealGroupEnergy?: string;
  peopleToMeet?: string;
  idealWeek?: string;
};

const RESPONSE_ORDER = [
  "ageRange",
  "socialGoal",
  "preferredNights",
  "preferredVibe",
  "budgetComfort",
  "drinkingPreference",
  "smokingPreference",
  "physicalActivityComfort",
  "timePreference",
  "plansFrequency",
  "idealGroupEnergy",
  "peopleToMeet",
  "idealWeek",
  "interests",
] as const;

function parseDelimited(value: string | null | undefined) {
  if (!value) {
    return [] as string[];
  }

  return value
    .split("|")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function stringifyDelimited(values: string[]) {
  return values.join("|");
}

function profileDraftToPayload(rawDraft: unknown): OnboardingPayload {
  if (!rawDraft || typeof rawDraft !== "object" || Array.isArray(rawDraft)) {
    return {};
  }

  const candidate = rawDraft as Record<string, unknown>;
  const parsed = onboardingDraftSchema.safeParse(candidate);
  if (!parsed.success) {
    return {};
  }

  return parsed.data;
}

async function ensureApplication(userId: string) {
  const existing = await prisma.memberApplication.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });

  if (existing) {
    return existing.id;
  }

  const created = await prisma.memberApplication.create({
    data: {
      userId,
      status: "DRAFT",
      headline: "Onboarding questionnaire in progress",
      aboutText: "Onboarding answers are being collected.",
      availability: "Flexible",
    },
    select: { id: true },
  });

  return created.id;
}

async function buildOnboardingState(userId: string) {
  const [user, profile, application] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        firstName: true,
        lastName: true,
        email: true,
      },
    }),
    prisma.profile.findUnique({
      where: { userId },
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
        peopleToMeet: true,
        idealWeek: true,
        interests: true,
        preferredVibe: true,
        onboardingCompletedAt: true,
        onboardingDraft: true,
      },
    }),
    prisma.memberApplication.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        responses: {
          where: {
            questionKey: {
              in: ONBOARDING_RESPONSE_KEYS,
            },
          },
          select: {
            questionKey: true,
            response: true,
          },
        },
      },
    }),
  ]);

  const responseMap = new Map(
    (application?.responses ?? []).map((response) => [response.questionKey, response.response]),
  );

  const draftFromProfile = profileDraftToPayload(profile?.onboardingDraft);
  const completedFromResponses = RESPONSE_ORDER.every((fieldKey) =>
    Boolean(responseMap.get(ONBOARDING_RESPONSE_DEFINITIONS[fieldKey].questionKey)),
  );

  return {
    completed: Boolean(profile?.onboardingCompletedAt) || completedFromResponses,
    payload: {
      firstName: draftFromProfile.firstName ?? user?.firstName ?? "",
      lastName: draftFromProfile.lastName ?? user?.lastName ?? "",
      email: draftFromProfile.email ?? user?.email ?? "",
      neighborhood: draftFromProfile.neighborhood ?? profile?.neighborhood ?? "",
      ageRange:
        draftFromProfile.ageRange ??
        profile?.ageRange ??
        responseMap.get(ONBOARDING_RESPONSE_DEFINITIONS.ageRange.questionKey) ??
        "",
      occupation: draftFromProfile.occupation ?? profile?.occupation ?? "",
      socialGoal:
        draftFromProfile.socialGoal ??
        profile?.socialGoal ??
        responseMap.get(ONBOARDING_RESPONSE_DEFINITIONS.socialGoal.questionKey) ??
        "",
      interests:
        draftFromProfile.interests ??
        profile?.interests ??
        parseDelimited(responseMap.get(ONBOARDING_RESPONSE_DEFINITIONS.interests.questionKey)),
      preferredNights:
        draftFromProfile.preferredNights ??
        profile?.preferredNights ??
        responseMap.get(ONBOARDING_RESPONSE_DEFINITIONS.preferredNights.questionKey) ??
        "",
      preferredVibe:
        draftFromProfile.preferredVibe ??
        profile?.preferredVibe ??
        parseDelimited(responseMap.get(ONBOARDING_RESPONSE_DEFINITIONS.preferredVibe.questionKey)),
      budgetComfort:
        draftFromProfile.budgetComfort ??
        profile?.budgetComfort ??
        responseMap.get(ONBOARDING_RESPONSE_DEFINITIONS.budgetComfort.questionKey) ??
        "",
      drinkingPreference:
        draftFromProfile.drinkingPreference ??
        profile?.drinkingPreference ??
        responseMap.get(ONBOARDING_RESPONSE_DEFINITIONS.drinkingPreference.questionKey) ??
        "",
      smokingPreference:
        draftFromProfile.smokingPreference ??
        profile?.smokingPreference ??
        responseMap.get(ONBOARDING_RESPONSE_DEFINITIONS.smokingPreference.questionKey) ??
        "",
      physicalActivityComfort:
        draftFromProfile.physicalActivityComfort ??
        profile?.physicalActivityLevel ??
        responseMap.get(ONBOARDING_RESPONSE_DEFINITIONS.physicalActivityComfort.questionKey) ??
        "",
      timePreference:
        draftFromProfile.timePreference ??
        profile?.timePreference ??
        responseMap.get(ONBOARDING_RESPONSE_DEFINITIONS.timePreference.questionKey) ??
        "",
      plansFrequency:
        draftFromProfile.plansFrequency ??
        profile?.plansFrequency ??
        responseMap.get(ONBOARDING_RESPONSE_DEFINITIONS.plansFrequency.questionKey) ??
        "",
      idealGroupEnergy:
        draftFromProfile.idealGroupEnergy ??
        profile?.idealGroupEnergy ??
        responseMap.get(ONBOARDING_RESPONSE_DEFINITIONS.idealGroupEnergy.questionKey) ??
        "",
      peopleToMeet:
        draftFromProfile.peopleToMeet ??
        profile?.peopleToMeet ??
        responseMap.get(ONBOARDING_RESPONSE_DEFINITIONS.peopleToMeet.questionKey) ??
        "",
      idealWeek:
        draftFromProfile.idealWeek ??
        profile?.idealWeek ??
        responseMap.get(ONBOARDING_RESPONSE_DEFINITIONS.idealWeek.questionKey) ??
        "",
    },
  };
}

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const state = await buildOnboardingState(session.user.id);
    return NextResponse.json(state);
  } catch {
    return NextResponse.json({ error: "Unable to load onboarding state." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }
  const parsed = onboardingDraftSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid onboarding draft payload" },
      { status: 400 },
    );
  }

  await prisma.profile.upsert({
    where: { userId: session.user.id },
    update: {
      onboardingDraft: parsed.data,
    },
    create: {
      userId: session.user.id,
      onboardingDraft: parsed.data,
      interests: [],
      preferredVibe: [],
    },
  });

  return NextResponse.json({ ok: true });
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }
  const parsed = onboardingSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid onboarding submission payload" },
      { status: 400 },
    );
  }

  const data = parsed.data;
  const applicationId = await ensureApplication(session.user.id);

  const responseValues = {
    ageRange: data.ageRange,
    socialGoal: data.socialGoal,
    preferredNights: data.preferredNights,
    preferredVibe: stringifyDelimited(data.preferredVibe),
    budgetComfort: data.budgetComfort,
    drinkingPreference: data.drinkingPreference,
    smokingPreference: data.smokingPreference,
    physicalActivityComfort: data.physicalActivityComfort,
    timePreference: data.timePreference,
    plansFrequency: data.plansFrequency,
    idealGroupEnergy: data.idealGroupEnergy,
    peopleToMeet: data.peopleToMeet,
    idealWeek: data.idealWeek,
    interests: stringifyDelimited(data.interests),
  } as const;

  try {
    await prisma.$transaction([
      prisma.user.update({
        where: { id: session.user.id },
        data: {
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
        },
      }),
      prisma.profile.upsert({
        where: { userId: session.user.id },
        update: {
          neighborhood: data.neighborhood,
          ageRange: data.ageRange,
          occupation: data.occupation,
          socialGoal: data.socialGoal,
          preferredNights: data.preferredNights,
          budgetComfort: data.budgetComfort,
          drinkingPreference: data.drinkingPreference,
          smokingPreference: data.smokingPreference,
          physicalActivityLevel: data.physicalActivityComfort,
          timePreference: data.timePreference,
          plansFrequency: data.plansFrequency,
          idealGroupEnergy: data.idealGroupEnergy,
          peopleToMeet: data.peopleToMeet,
          idealWeek: data.idealWeek,
          interests: data.interests,
          preferredVibe: data.preferredVibe,
          onboardingDraft: Prisma.DbNull,
          onboardingCompletedAt: new Date(),
        },
        create: {
          userId: session.user.id,
          neighborhood: data.neighborhood,
          ageRange: data.ageRange,
          occupation: data.occupation,
          socialGoal: data.socialGoal,
          preferredNights: data.preferredNights,
          budgetComfort: data.budgetComfort,
          drinkingPreference: data.drinkingPreference,
          smokingPreference: data.smokingPreference,
          physicalActivityLevel: data.physicalActivityComfort,
          timePreference: data.timePreference,
          plansFrequency: data.plansFrequency,
          idealGroupEnergy: data.idealGroupEnergy,
          peopleToMeet: data.peopleToMeet,
          idealWeek: data.idealWeek,
          interests: data.interests,
          preferredVibe: data.preferredVibe,
          onboardingCompletedAt: new Date(),
        },
      }),
      prisma.memberApplication.update({
        where: { id: applicationId },
        data: {
          headline: `Onboarding complete: ${data.socialGoal}`,
          aboutText: `${data.peopleToMeet}\n\n${data.idealWeek}`,
          availability: `${data.preferredNights} / ${data.timePreference}`,
        },
      }),
      ...RESPONSE_ORDER.map((fieldKey) => {
        const definition = ONBOARDING_RESPONSE_DEFINITIONS[fieldKey];
        return prisma.questionnaireResponse.upsert({
          where: {
            applicationId_questionKey: {
              applicationId,
              questionKey: definition.questionKey,
            },
          },
          create: {
            applicationId,
            questionKey: definition.questionKey,
            section: definition.section,
            response: responseValues[fieldKey],
          },
          update: {
            section: definition.section,
            response: responseValues[fieldKey],
          },
        });
      }),
    ]);
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code?: string }).code === "P2002"
    ) {
      return NextResponse.json({ error: "That email is already in use." }, { status: 409 });
    }

    return NextResponse.json({ error: "Unable to complete onboarding." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
