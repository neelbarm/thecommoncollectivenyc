export type AdminApplicationStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "REVIEWING"
  | "ACCEPTED"
  | "REJECTED";

export type AdminCohortStatus = "FORMING" | "ACTIVE" | "COMPLETED";
export type AdminSeasonStatus = "PLANNING" | "LIVE" | "CLOSED";
export type AdminEventStatus = "DRAFT" | "PUBLISHED" | "COMPLETED" | "CANCELLED";
export type AdminDropRequestStatus = "OPEN" | "MATCHED" | "WITHDRAWN" | "CLOSED";
export type AdminQuestionnaireSection = "VALUES" | "EXPERIENCE" | "COMMUNITY";
export type AdminRsvpStatus = "GOING" | "MAYBE" | "DECLINED" | "WAITLISTED";
export type AdminBookingStatus = "HOLD" | "CONFIRMED" | "CANCELLED";
export type AdminReminderStatus = "SCHEDULED" | "SENT" | "FAILED";
export type AdminReminderChannel = "EMAIL" | "SMS";
export type AdminRole = "ADMIN" | "MEMBER";

type IdLabel = {
  id: string;
  label: string;
};

export type AdminOpsData = {
  generatedAt: string;
  overview: {
    totalMembers: number;
    totalApplications: number;
    totalCohorts: number;
    upcomingEvents: number;
    activeDropRequests: number;
  };
  announcementComposer: {
    seasons: Array<{
      id: string;
      name: string;
      code: string;
    }>;
    cohorts: Array<{
      id: string;
      name: string;
      seasonId: string;
    }>;
  };
  filterOptions: {
    seasons: IdLabel[];
    cohorts: IdLabel[];
    applicationStatuses: AdminApplicationStatus[];
    cohortStatuses: AdminCohortStatus[];
    seasonStatuses: AdminSeasonStatus[];
    eventStatuses: AdminEventStatus[];
    dropRequestStatuses: AdminDropRequestStatus[];
  };
  applications: Array<{
    id: string;
    memberId: string;
    memberName: string;
    memberEmail: string;
    status: AdminApplicationStatus;
    headline: string;
    availability: string;
    submittedAt: string | null;
    reviewedAt: string | null;
    reviewerName: string | null;
    responseCount: number;
    noteCount: number;
    memberSeasonId: string | null;
    memberSeasonCode: string | null;
    memberCohortId: string | null;
    memberCohortName: string | null;
  }>;
  members: Array<{
    id: string;
    name: string;
    email: string;
    role: AdminRole;
    isActive: boolean;
    createdAt: string;
    lastLoginAt: string | null;
    neighborhood: string | null;
    onboardingCompletedAt: string | null;
    cohortIds: string[];
    cohortNames: string[];
    seasonIds: string[];
    seasonCodes: string[];
  }>;
  questionnaireSummary: {
    totalResponses: number;
    sectionBreakdown: Array<{
      section: AdminQuestionnaireSection;
      count: number;
    }>;
    topQuestionKeys: Array<{
      questionKey: string;
      count: number;
    }>;
  };
  cohorts: Array<{
    id: string;
    name: string;
    slug: string;
    status: AdminCohortStatus;
    capacity: number;
    seasonId: string;
    seasonName: string;
    seasonCode: string;
    invitedCount: number;
    activeCount: number;
    pausedCount: number;
    completedCount: number;
  }>;
  seasons: Array<{
    id: string;
    name: string;
    code: string;
    status: AdminSeasonStatus;
    startsAt: string;
    endsAt: string;
    cohortCount: number;
    eventCount: number;
  }>;
  events: Array<{
    id: string;
    title: string;
    status: AdminEventStatus;
    startsAt: string;
    endsAt: string;
    seasonId: string;
    seasonName: string;
    seasonCode: string;
    cohortId: string | null;
    cohortName: string | null;
    venueName: string;
    capacity: number;
    goingCount: number;
    maybeCount: number;
    declinedCount: number;
    waitlistedCount: number;
  }>;
  rsvpOverview: {
    total: number;
    totalsByStatus: Record<AdminRsvpStatus, number>;
    recent: Array<{
      id: string;
      memberName: string;
      eventId: string;
      eventTitle: string;
      eventStartsAt: string;
      seasonId: string;
      seasonCode: string;
      cohortId: string | null;
      cohortName: string | null;
      status: AdminRsvpStatus;
      respondedAt: string;
    }>;
  };
  dropRequests: Array<{
    id: string;
    title: string;
    status: AdminDropRequestStatus;
    createdAt: string;
    requesterName: string;
    eventTitle: string | null;
    seasonId: string | null;
    seasonCode: string | null;
    cohortId: string | null;
    cohortName: string | null;
    responseCount: number;
    acceptedCount: number;
    pendingCount: number;
    declinedCount: number;
  }>;
  bookingReminderStatus: {
    bookingsByStatus: Record<AdminBookingStatus, number>;
    remindersByStatus: Record<AdminReminderStatus, number>;
    recentBookings: Array<{
      id: string;
      memberName: string;
      eventTitle: string;
      status: AdminBookingStatus;
      seats: number;
      confirmedAt: string | null;
      createdAt: string;
    }>;
    upcomingReminders: Array<{
      id: string;
      memberName: string;
      eventTitle: string;
      channel: AdminReminderChannel;
      status: AdminReminderStatus;
      scheduledFor: string;
      sentAt: string | null;
    }>;
  };
  adminNotes: Array<{
    id: string;
    body: string;
    createdAt: string;
    adminName: string;
    subjectUserId: string | null;
    subjectUserName: string | null;
    applicationId: string | null;
  }>;
  recentAnnouncements: Array<{
    id: string;
    title: string;
    body: string;
    audience: "ALL_MEMBERS" | "SEASON" | "COHORT";
    isPinned: boolean;
    publishedAt: string;
    createdByName: string;
    seasonId: string | null;
    seasonName: string | null;
    cohortId: string | null;
    cohortName: string | null;
  }>;
};
