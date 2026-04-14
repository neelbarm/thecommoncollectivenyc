import {
  ApplicationStatus,
  BookingStatus,
  CohortStatus,
  DropRequestStatus,
  EventStatus,
  ReminderStatus,
  RSVPStatus,
  SeasonStatus,
  type QuestionnaireSection,
} from "@prisma/client";

import type { AdminOpsData } from "@/lib/admin/types";
import { prisma } from "@/lib/prisma";

function toIso(value: Date | null) {
  return value ? value.toISOString() : null;
}

function fullName(firstName: string, lastName: string) {
  return `${firstName} ${lastName}`.trim();
}

function initRsvpStatusMap(): Record<RSVPStatus, number> {
  return {
    GOING: 0,
    MAYBE: 0,
    DECLINED: 0,
    WAITLISTED: 0,
  };
}

function initBookingStatusMap(): Record<BookingStatus, number> {
  return {
    HOLD: 0,
    CONFIRMED: 0,
    CANCELLED: 0,
  };
}

function initReminderStatusMap(): Record<ReminderStatus, number> {
  return {
    SCHEDULED: 0,
    SENT: 0,
    FAILED: 0,
  };
}

export async function getAdminOpsData(): Promise<AdminOpsData> {
  const now = new Date();

  const [
    totalMembers,
    totalApplications,
    totalCohorts,
    upcomingEvents,
    activeDropRequests,
    applications,
    members,
    questionnaireResponses,
    cohorts,
    seasons,
    events,
    recentRsvps,
    dropRequests,
    bookings,
    reminders,
    adminNotes,
  ] = await Promise.all([
    prisma.user.count({
      where: {
        role: "MEMBER",
      },
    }),
    prisma.memberApplication.count(),
    prisma.cohort.count(),
    prisma.event.count({
      where: {
        startsAt: {
          gte: now,
        },
        status: EventStatus.PUBLISHED,
      },
    }),
    prisma.dropRequest.count({
      where: {
        status: {
          in: [DropRequestStatus.OPEN, DropRequestStatus.MATCHED],
        },
      },
    }),
    prisma.memberApplication.findMany({
      orderBy: [{ submittedAt: "desc" }, { createdAt: "desc" }],
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            cohortMemberships: {
              where: {
                status: {
                  in: ["INVITED", "ACTIVE", "PAUSED"],
                },
              },
              orderBy: {
                createdAt: "desc",
              },
              take: 1,
              select: {
                cohortId: true,
                cohort: {
                  select: {
                    name: true,
                    seasonId: true,
                    season: {
                      select: {
                        code: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        reviewedBy: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        responses: {
          select: {
            id: true,
          },
        },
        notes: {
          select: {
            id: true,
          },
        },
      },
      take: 100,
    }),
    prisma.user.findMany({
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        lastLoginAt: true,
        profile: {
          select: {
            neighborhood: true,
            onboardingCompletedAt: true,
          },
        },
        cohortMemberships: {
          where: {
            status: {
              in: ["INVITED", "ACTIVE", "PAUSED"],
            },
          },
          orderBy: {
            createdAt: "desc",
          },
          select: {
            cohortId: true,
            cohort: {
              select: {
                name: true,
                seasonId: true,
                season: {
                  select: {
                    code: true,
                  },
                },
              },
            },
          },
        },
      },
      take: 150,
    }),
    prisma.questionnaireResponse.findMany({
      select: {
        questionKey: true,
        section: true,
      },
      take: 1500,
    }),
    prisma.cohort.findMany({
      orderBy: [{ season: { startsAt: "desc" } }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
        capacity: true,
        seasonId: true,
        season: {
          select: {
            name: true,
            code: true,
          },
        },
        memberships: {
          select: {
            status: true,
          },
        },
      },
      take: 60,
    }),
    prisma.season.findMany({
      orderBy: {
        startsAt: "desc",
      },
      select: {
        id: true,
        name: true,
        code: true,
        status: true,
        startsAt: true,
        endsAt: true,
        _count: {
          select: {
            cohorts: true,
            events: true,
          },
        },
      },
      take: 20,
    }),
    prisma.event.findMany({
      orderBy: {
        startsAt: "desc",
      },
      select: {
        id: true,
        title: true,
        status: true,
        startsAt: true,
        endsAt: true,
        seasonId: true,
        season: {
          select: {
            name: true,
            code: true,
          },
        },
        cohortId: true,
        cohort: {
          select: {
            name: true,
          },
        },
        venue: {
          select: {
            name: true,
          },
        },
        capacity: true,
        rsvps: {
          select: {
            status: true,
          },
        },
      },
      take: 80,
    }),
    prisma.rSVP.findMany({
      orderBy: {
        respondedAt: "desc",
      },
      select: {
        id: true,
        status: true,
        respondedAt: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        event: {
          select: {
            id: true,
            title: true,
            startsAt: true,
            seasonId: true,
            season: {
              select: {
                code: true,
              },
            },
            cohortId: true,
            cohort: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      take: 80,
    }),
    prisma.dropRequest.findMany({
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        title: true,
        status: true,
        createdAt: true,
        requester: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        event: {
          select: {
            id: true,
            title: true,
            seasonId: true,
            season: {
              select: {
                code: true,
              },
            },
            cohortId: true,
            cohort: {
              select: {
                name: true,
              },
            },
          },
        },
        responses: {
          select: {
            status: true,
          },
        },
      },
      take: 100,
    }),
    prisma.booking.findMany({
      orderBy: [{ createdAt: "desc" }],
      select: {
        id: true,
        status: true,
        seats: true,
        createdAt: true,
        confirmedAt: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        event: {
          select: {
            title: true,
          },
        },
      },
      take: 120,
    }),
    prisma.reminder.findMany({
      orderBy: [{ scheduledFor: "asc" }],
      select: {
        id: true,
        channel: true,
        status: true,
        scheduledFor: true,
        sentAt: true,
        recipient: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        event: {
          select: {
            title: true,
          },
        },
      },
      take: 120,
    }),
    prisma.adminNote.findMany({
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        body: true,
        createdAt: true,
        applicationId: true,
        admin: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        subjectUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      take: 60,
    }),
  ]);

  const questionSectionCounts = new Map<QuestionnaireSection, number>();
  const questionKeyCounts = new Map<string, number>();

  for (const response of questionnaireResponses) {
    questionSectionCounts.set(
      response.section,
      (questionSectionCounts.get(response.section) ?? 0) + 1,
    );
    questionKeyCounts.set(response.questionKey, (questionKeyCounts.get(response.questionKey) ?? 0) + 1);
  }

  const rsvpTotals = initRsvpStatusMap();
  for (const rsvp of recentRsvps) {
    rsvpTotals[rsvp.status] += 1;
  }

  const bookingsByStatus = initBookingStatusMap();
  for (const booking of bookings) {
    bookingsByStatus[booking.status] += 1;
  }

  const remindersByStatus = initReminderStatusMap();
  for (const reminder of reminders) {
    remindersByStatus[reminder.status] += 1;
  }

  return {
    generatedAt: new Date().toISOString(),
    overview: {
      totalMembers,
      totalApplications,
      totalCohorts,
      upcomingEvents,
      activeDropRequests,
    },
    filterOptions: {
      seasons: seasons.map((season) => ({
        id: season.id,
        label: `${season.code} · ${season.name}`,
      })),
      cohorts: cohorts.map((cohort) => ({
        id: cohort.id,
        label: cohort.name,
      })),
      applicationStatuses: Object.values(ApplicationStatus),
      cohortStatuses: Object.values(CohortStatus),
      seasonStatuses: Object.values(SeasonStatus),
      eventStatuses: Object.values(EventStatus),
      dropRequestStatuses: Object.values(DropRequestStatus),
    },
    applications: applications.map((application) => {
      const membership = application.user.cohortMemberships[0];
      return {
        id: application.id,
        memberId: application.user.id,
        memberName: fullName(application.user.firstName, application.user.lastName),
        memberEmail: application.user.email,
        status: application.status,
        headline: application.headline,
        availability: application.availability,
        submittedAt: toIso(application.submittedAt),
        reviewedAt: toIso(application.reviewedAt),
        reviewerName: application.reviewedBy
          ? fullName(application.reviewedBy.firstName, application.reviewedBy.lastName)
          : null,
        responseCount: application.responses.length,
        noteCount: application.notes.length,
        memberSeasonId: membership?.cohort.seasonId ?? null,
        memberSeasonCode: membership?.cohort.season.code ?? null,
        memberCohortId: membership?.cohortId ?? null,
        memberCohortName: membership?.cohort.name ?? null,
      };
    }),
    members: members.map((member) => ({
      id: member.id,
      name: fullName(member.firstName, member.lastName),
      email: member.email,
      role: member.role,
      isActive: member.isActive,
      createdAt: member.createdAt.toISOString(),
      lastLoginAt: toIso(member.lastLoginAt),
      neighborhood: member.profile?.neighborhood ?? null,
      onboardingCompletedAt: toIso(member.profile?.onboardingCompletedAt ?? null),
      cohortIds: member.cohortMemberships.map((membership) => membership.cohortId),
      cohortNames: member.cohortMemberships.map((membership) => membership.cohort.name),
      seasonIds: member.cohortMemberships.map((membership) => membership.cohort.seasonId),
      seasonCodes: member.cohortMemberships.map((membership) => membership.cohort.season.code),
    })),
    questionnaireSummary: {
      totalResponses: questionnaireResponses.length,
      sectionBreakdown: [...questionSectionCounts.entries()].map(([section, count]) => ({
        section,
        count,
      })),
      topQuestionKeys: [...questionKeyCounts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([questionKey, count]) => ({
          questionKey,
          count,
        })),
    },
    cohorts: cohorts.map((cohort) => ({
      id: cohort.id,
      name: cohort.name,
      slug: cohort.slug,
      status: cohort.status,
      capacity: cohort.capacity,
      seasonId: cohort.seasonId,
      seasonName: cohort.season.name,
      seasonCode: cohort.season.code,
      invitedCount: cohort.memberships.filter((membership) => membership.status === "INVITED").length,
      activeCount: cohort.memberships.filter((membership) => membership.status === "ACTIVE").length,
      pausedCount: cohort.memberships.filter((membership) => membership.status === "PAUSED").length,
      completedCount: cohort.memberships.filter((membership) => membership.status === "COMPLETED").length,
    })),
    seasons: seasons.map((season) => ({
      id: season.id,
      name: season.name,
      code: season.code,
      status: season.status,
      startsAt: season.startsAt.toISOString(),
      endsAt: season.endsAt.toISOString(),
      cohortCount: season._count.cohorts,
      eventCount: season._count.events,
    })),
    events: events.map((event) => ({
      id: event.id,
      title: event.title,
      status: event.status,
      startsAt: event.startsAt.toISOString(),
      endsAt: event.endsAt.toISOString(),
      seasonId: event.seasonId,
      seasonName: event.season.name,
      seasonCode: event.season.code,
      cohortId: event.cohortId,
      cohortName: event.cohort?.name ?? null,
      venueName: event.venue.name,
      capacity: event.capacity,
      goingCount: event.rsvps.filter((rsvp) => rsvp.status === RSVPStatus.GOING).length,
      maybeCount: event.rsvps.filter((rsvp) => rsvp.status === RSVPStatus.MAYBE).length,
      declinedCount: event.rsvps.filter((rsvp) => rsvp.status === RSVPStatus.DECLINED).length,
      waitlistedCount: event.rsvps.filter((rsvp) => rsvp.status === RSVPStatus.WAITLISTED).length,
    })),
    rsvpOverview: {
      total: recentRsvps.length,
      totalsByStatus: rsvpTotals,
      recent: recentRsvps.map((rsvp) => ({
        id: rsvp.id,
        memberName: fullName(rsvp.user.firstName, rsvp.user.lastName),
        eventId: rsvp.event.id,
        eventTitle: rsvp.event.title,
        eventStartsAt: rsvp.event.startsAt.toISOString(),
        seasonId: rsvp.event.seasonId,
        seasonCode: rsvp.event.season.code,
        cohortId: rsvp.event.cohortId,
        cohortName: rsvp.event.cohort?.name ?? null,
        status: rsvp.status,
        respondedAt: rsvp.respondedAt.toISOString(),
      })),
    },
    dropRequests: dropRequests.map((request) => ({
      id: request.id,
      title: request.title,
      status: request.status,
      createdAt: request.createdAt.toISOString(),
      requesterName: fullName(request.requester.firstName, request.requester.lastName),
      eventTitle: request.event?.title ?? null,
      seasonId: request.event?.seasonId ?? null,
      seasonCode: request.event?.season.code ?? null,
      cohortId: request.event?.cohortId ?? null,
      cohortName: request.event?.cohort?.name ?? null,
      responseCount: request.responses.length,
      acceptedCount: request.responses.filter((response) => response.status === "ACCEPTED").length,
      pendingCount: request.responses.filter((response) => response.status === "PENDING").length,
      declinedCount: request.responses.filter((response) => response.status === "DECLINED").length,
    })),
    bookingReminderStatus: {
      bookingsByStatus,
      remindersByStatus,
      recentBookings: bookings.slice(0, 16).map((booking) => ({
        id: booking.id,
        memberName: fullName(booking.user.firstName, booking.user.lastName),
        eventTitle: booking.event.title,
        status: booking.status,
        seats: booking.seats,
        confirmedAt: toIso(booking.confirmedAt),
        createdAt: booking.createdAt.toISOString(),
      })),
      upcomingReminders: reminders
        .filter((reminder) => reminder.scheduledFor >= now || reminder.status === ReminderStatus.FAILED)
        .slice(0, 20)
        .map((reminder) => ({
          id: reminder.id,
          memberName: fullName(reminder.recipient.firstName, reminder.recipient.lastName),
          eventTitle: reminder.event.title,
          channel: reminder.channel,
          status: reminder.status,
          scheduledFor: reminder.scheduledFor.toISOString(),
          sentAt: toIso(reminder.sentAt),
        })),
    },
    adminNotes: adminNotes.map((note) => ({
      id: note.id,
      body: note.body,
      createdAt: note.createdAt.toISOString(),
      adminName: fullName(note.admin.firstName, note.admin.lastName),
      subjectUserId: note.subjectUser?.id ?? null,
      subjectUserName: note.subjectUser
        ? fullName(note.subjectUser.firstName, note.subjectUser.lastName)
        : null,
      applicationId: note.applicationId,
    })),
  };
}
