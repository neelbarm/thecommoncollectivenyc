import { DropRequestStatus } from "@prisma/client";

import {
  DROP_ACTIVITY_OPTIONS,
  DROP_TIMING_OPTIONS,
  type DropActivity,
  type DropTiming,
} from "@/lib/drop/constants";
import type { MemberDropData, MemberDropRequest } from "@/lib/drop/types";
import { prisma } from "@/lib/prisma";

function parseActivityAndTiming(title: string) {
  const [activityRaw, timingRaw] = title.split("|").map((part) => part?.trim());

  const activity = DROP_ACTIVITY_OPTIONS.find((option) => option === activityRaw) ?? "Anything";
  const timing = DROP_TIMING_OPTIONS.find((option) => option === timingRaw) ?? "tonight";

  return {
    activity,
    timing,
  } satisfies { activity: DropActivity; timing: DropTiming };
}

function toDropRequest(
  request: {
    id: string;
    title: string;
    context: string;
    status: DropRequestStatus;
    createdAt: Date;
    responses: Array<{
      id: string;
      status: "PENDING" | "ACCEPTED" | "DECLINED";
      message: string | null;
      respondedAt: Date | null;
      responder: {
        firstName: string;
        lastName: string;
      };
    }>;
  },
): MemberDropRequest {
  const { activity, timing } = parseActivityAndTiming(request.title);

  return {
    id: request.id,
    title: request.title,
    activityType: activity,
    timing,
    note: request.context || null,
    status: request.status,
    createdAt: request.createdAt.toISOString(),
    responses: request.responses.map((response) => ({
      id: response.id,
      responderName: `${response.responder.firstName} ${response.responder.lastName}`,
      status: response.status,
      message: response.message,
      respondedAt: response.respondedAt?.toISOString() ?? null,
    })),
  };
}

function cohortContextCopy(cohortName: string | null) {
  if (!cohortName) {
    return "The Drop works across the full club. Once your cohort is fully active, we’ll prioritize requests that align with your group rhythm.";
  }

  return `Your cohort, ${cohortName}, can often respond fastest when timing and activity are clear. Keep your request concise and specific.`;
}

export async function getMemberDropData(userId: string): Promise<MemberDropData | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      firstName: true,
      lastName: true,
      cohortMemberships: {
        where: {
          status: {
            in: ["ACTIVE", "INVITED"],
          },
        },
        orderBy: [{ status: "asc" }, { createdAt: "asc" }],
        take: 1,
        select: {
          cohort: {
            select: {
              name: true,
            },
          },
        },
      },
      dropRequests: {
        orderBy: {
          createdAt: "desc",
        },
        take: 8,
        select: {
          id: true,
          title: true,
          context: true,
          status: true,
          createdAt: true,
          responses: {
            orderBy: {
              createdAt: "desc",
            },
            select: {
              id: true,
              status: true,
              message: true,
              respondedAt: true,
              responder: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!user) {
    return null;
  }

  const cohortName = user.cohortMemberships[0]?.cohort.name ?? null;

  const active = user.dropRequests.find(
    (request) =>
      request.status === DropRequestStatus.OPEN ||
      request.status === DropRequestStatus.MATCHED,
  );

  const activeRequest = active ? toDropRequest(active) : null;
  const recentRequests = user.dropRequests
    .filter((request) => request.id !== active?.id)
    .slice(0, 6)
    .map(toDropRequest);

  return {
    memberName: `${user.firstName} ${user.lastName}`,
    firstName: user.firstName,
    hasCohort: Boolean(cohortName),
    cohortName,
    cohortContext: cohortContextCopy(cohortName),
    activeRequest,
    recentRequests,
  };
}
