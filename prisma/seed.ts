import "dotenv/config";

import {
  ApplicationStatus,
  BookingStatus,
  CohortMembershipStatus,
  CohortStatus,
  DropRequestStatus,
  DropResponseStatus,
  EventStatus,
  PrismaClient,
  QuestionnaireSection,
  ReminderChannel,
  ReminderStatus,
  Role,
  RSVPStatus,
  SeasonStatus,
} from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const connectionString =
  process.env.DATABASE_URL ??
  "postgresql://postgres:postgres@localhost:5432/common_collective";

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const memberProfiles = [
  {
    firstName: "Ari",
    lastName: "Monroe",
    email: "ari@example.com",
    neighborhood: "Fort Greene",
    occupation: "Creative Director",
    interests: ["Dinners", "Art", "Walks"],
    socialGoal: "Build",
    preferredNights: "weekdays",
    budgetComfort: "Regular",
    ageRange: "26-30",
    idealGroupEnergy: "Balanced",
    preferredVibe: ["calm", "social"],
  },
  {
    firstName: "Noah",
    lastName: "Kim",
    email: "noah@example.com",
    neighborhood: "Lower East Side",
    occupation: "Product Designer",
    interests: ["Runs", "Coffee", "Creatives"],
    socialGoal: "Expand",
    preferredNights: "both",
    budgetComfort: "Soft",
    ageRange: "26-30",
    idealGroupEnergy: "Lively",
    preferredVibe: ["active", "spontaneous"],
  },
  {
    firstName: "Maya",
    lastName: "Rivera",
    email: "maya@example.com",
    neighborhood: "Prospect Heights",
    occupation: "Brand Strategist",
    interests: ["Art", "Wellness", "Dinners"],
    socialGoal: "Build",
    preferredNights: "weekends",
    budgetComfort: "Regular",
    ageRange: "31-35",
    idealGroupEnergy: "Intimate",
    preferredVibe: ["calm", "low-key"],
  },
  {
    firstName: "James",
    lastName: "Owens",
    email: "james@example.com",
    neighborhood: "SoHo",
    occupation: "Hospitality Consultant",
    interests: ["Dinners", "Late night", "Art"],
    socialGoal: "Expand",
    preferredNights: "weekends",
    budgetComfort: "Big",
    ageRange: "36-40",
    idealGroupEnergy: "High-energy",
    preferredVibe: ["stylish", "social"],
  },
  {
    firstName: "Sofia",
    lastName: "Ng",
    email: "sofia@example.com",
    neighborhood: "Williamsburg",
    occupation: "Startup Operator",
    interests: ["Yoga", "Coffee", "Founders"],
    socialGoal: "Reset",
    preferredNights: "weekdays",
    budgetComfort: "Soft",
    ageRange: "26-30",
    idealGroupEnergy: "Balanced",
    preferredVibe: ["calm", "active"],
  },
  {
    firstName: "Liam",
    lastName: "Patel",
    email: "liam@example.com",
    neighborhood: "Gramercy",
    occupation: "Attorney",
    interests: ["Dinners", "Walks", "Volunteering"],
    socialGoal: "Build",
    preferredNights: "both",
    budgetComfort: "Big",
    ageRange: "31-35",
    idealGroupEnergy: "Balanced",
    preferredVibe: ["social", "low-key"],
  },
  {
    firstName: "Elena",
    lastName: "Holt",
    email: "elena@example.com",
    neighborhood: "Cobble Hill",
    occupation: "Photographer",
    interests: ["Art / Painting", "Cooking", "Hidden NYC"],
    socialGoal: "Reset",
    preferredNights: "weekends",
    budgetComfort: "Regular",
    ageRange: "31-35",
    idealGroupEnergy: "Intimate",
    preferredVibe: ["calm", "stylish"],
  },
  {
    firstName: "Micah",
    lastName: "Stone",
    email: "micah@example.com",
    neighborhood: "Flatiron",
    occupation: "Engineer",
    interests: ["Pickleball", "Coffee", "Runs"],
    socialGoal: "Expand",
    preferredNights: "weekdays",
    budgetComfort: "Regular",
    ageRange: "26-30",
    idealGroupEnergy: "Lively",
    preferredVibe: ["active", "spontaneous"],
  },
  {
    firstName: "Rina",
    lastName: "Das",
    email: "rina@example.com",
    neighborhood: "DUMBO",
    occupation: "Editor",
    interests: ["Book club", "Dinners", "Walks"],
    socialGoal: "Build",
    preferredNights: "weekdays",
    budgetComfort: "Soft",
    ageRange: "26-30",
    idealGroupEnergy: "Intimate",
    preferredVibe: ["calm", "low-key"],
  },
  {
    firstName: "Theo",
    lastName: "Brooks",
    email: "theo@example.com",
    neighborhood: "Chelsea",
    occupation: "Venture Partner",
    interests: ["Founders", "Pickleball", "Dinners"],
    socialGoal: "Expand",
    preferredNights: "both",
    budgetComfort: "Big",
    ageRange: "36-40",
    idealGroupEnergy: "High-energy",
    preferredVibe: ["social", "stylish"],
  },
  {
    firstName: "Priya",
    lastName: "Shah",
    email: "priya@example.com",
    neighborhood: "NoHo",
    occupation: "Journalist",
    interests: ["Dinners", "Art", "Hidden NYC"],
    socialGoal: "Build",
    preferredNights: "weekends",
    budgetComfort: "Regular",
    ageRange: "31-35",
    idealGroupEnergy: "Balanced",
    preferredVibe: ["social", "calm"],
  },
  {
    firstName: "Dylan",
    lastName: "Frost",
    email: "dylan@example.com",
    neighborhood: "Park Slope",
    occupation: "Architect",
    interests: ["Nature", "Hiking", "Coffee"],
    socialGoal: "Reset",
    preferredNights: "weekends",
    budgetComfort: "Soft",
    ageRange: "36-40",
    idealGroupEnergy: "Intimate",
    preferredVibe: ["calm", "low-key"],
  },
] as const;

async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

async function clearExistingData() {
  await prisma.adminNote.deleteMany();
  await prisma.reminder.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.dropResponse.deleteMany();
  await prisma.dropRequest.deleteMany();
  await prisma.rSVP.deleteMany();
  await prisma.event.deleteMany();
  await prisma.cohortMembership.deleteMany();
  await prisma.cohort.deleteMany();
  await prisma.venue.deleteMany();
  await prisma.season.deleteMany();
  await prisma.questionnaireResponse.deleteMany();
  await prisma.memberApplication.deleteMany();
  await prisma.profile.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();
}

async function main() {
  await clearExistingData();

  const defaultPasswordHash = await hashPassword("CommonClub123");

  const admin = await prisma.user.create({
    data: {
      email: "admin@commoncollective.nyc",
      firstName: "Carmen",
      lastName: "Lee",
      role: Role.ADMIN,
      passwordHash: defaultPasswordHash,
      emailVerified: new Date(),
      profile: {
        create: {
          bio: "Founder and operator of The Common Collective.",
          neighborhood: "Tribeca",
          occupation: "Community Builder",
          interests: ["Hospitality", "Culture", "People"],
        },
      },
    },
  });

  const members = [] as { id: string; name: string }[];

  for (let idx = 0; idx < memberProfiles.length; idx++) {
    const member = memberProfiles[idx];
    const isOnboardingComplete = idx < 8;
    const created = await prisma.user.create({
      data: {
        email: member.email,
        firstName: member.firstName,
        lastName: member.lastName,
        role: Role.MEMBER,
        passwordHash: defaultPasswordHash,
        emailVerified: new Date(),
        profile: {
          create: {
            neighborhood: member.neighborhood,
            occupation: member.occupation,
            interests: [...member.interests],
            preferredVibe: [...member.preferredVibe],
            socialGoal: member.socialGoal,
            preferredNights: member.preferredNights,
            budgetComfort: member.budgetComfort,
            ageRange: member.ageRange,
            idealGroupEnergy: member.idealGroupEnergy,
            bio: `${member.firstName} values meaningful city friendships and recurring shared rituals.`,
            onboardingCompletedAt: isOnboardingComplete
              ? new Date("2026-03-20T12:00:00.000Z")
              : null,
          },
        },
      },
    });

    members.push({ id: created.id, name: `${member.firstName} ${member.lastName}` });
  }

  const springSeason = await prisma.season.create({
    data: {
      name: "Spring 2026",
      code: "SP26",
      startsAt: new Date("2026-04-01T00:00:00.000Z"),
      endsAt: new Date("2026-06-30T23:59:59.999Z"),
      status: SeasonStatus.LIVE,
    },
  });

  const summerSeason = await prisma.season.create({
    data: {
      name: "Summer 2026",
      code: "SU26",
      startsAt: new Date("2026-07-01T00:00:00.000Z"),
      endsAt: new Date("2026-09-30T23:59:59.999Z"),
      status: SeasonStatus.PLANNING,
    },
  });

  const cohorts = await Promise.all([
    prisma.cohort.create({
      data: {
        seasonId: springSeason.id,
        name: "The Orchard Table",
        slug: "orchard-table",
        status: CohortStatus.ACTIVE,
        capacity: 8,
      },
    }),
    prisma.cohort.create({
      data: {
        seasonId: springSeason.id,
        name: "City Lanterns",
        slug: "city-lanterns",
        status: CohortStatus.ACTIVE,
        capacity: 8,
      },
    }),
    prisma.cohort.create({
      data: {
        seasonId: summerSeason.id,
        name: "West Village Atelier",
        slug: "west-village-atelier",
        status: CohortStatus.FORMING,
        capacity: 8,
      },
    }),
  ]);

  for (let i = 0; i < members.length; i += 1) {
    const cohort = cohorts[i % 3];

    await prisma.cohortMembership.create({
      data: {
        userId: members[i].id,
        cohortId: cohort.id,
        status:
          cohort.status === CohortStatus.ACTIVE
            ? CohortMembershipStatus.ACTIVE
            : CohortMembershipStatus.INVITED,
        joinedAt:
          cohort.status === CohortStatus.ACTIVE
            ? new Date("2026-04-05T10:00:00.000Z")
            : null,
      },
    });
  }

  const venues = await Promise.all([
    prisma.venue.create({
      data: {
        name: "Atelier Mercer Loft",
        slug: "atelier-mercer-loft",
        addressLine1: "95 Mercer St",
        city: "New York",
        state: "NY",
        postalCode: "10012",
        capacity: 30,
        notes: "Private loft with long table seating.",
      },
    }),
    prisma.venue.create({
      data: {
        name: "Riverside Studio",
        slug: "riverside-studio",
        addressLine1: "407 W 15th St",
        city: "New York",
        state: "NY",
        postalCode: "10011",
        capacity: 24,
        notes: "Warm lighting and intimate lounge setup.",
      },
    }),
    prisma.venue.create({
      data: {
        name: "The Greenhouse Parlour",
        slug: "greenhouse-parlour",
        addressLine1: "22 Bond St",
        city: "New York",
        state: "NY",
        postalCode: "10012",
        capacity: 40,
        notes: "Indoor garden room for gatherings and workshops.",
      },
    }),
  ]);

  const eventBlueprint = [
    {
      title: "Spring Opening Supper",
      slug: "spring-opening-supper",
      description: "A seated dinner introducing this season's members and themes.",
      startsAt: new Date("2026-04-12T23:00:00.000Z"),
      endsAt: new Date("2026-04-13T01:30:00.000Z"),
      seasonId: springSeason.id,
      cohortId: cohorts[0].id,
      venueId: venues[0].id,
      status: EventStatus.PUBLISHED,
      capacity: 18,
    },
    {
      title: "Members Salon: New York Now",
      slug: "members-salon-ny-now",
      description: "Guided conversation and small-group exchange on city life now.",
      startsAt: new Date("2026-04-19T22:30:00.000Z"),
      endsAt: new Date("2026-04-20T00:00:00.000Z"),
      seasonId: springSeason.id,
      cohortId: cohorts[1].id,
      venueId: venues[1].id,
      status: EventStatus.PUBLISHED,
      capacity: 16,
    },
    {
      title: "Chef Table Rotation",
      slug: "chef-table-rotation",
      description: "A rotating dinner format hosted by a neighborhood chef.",
      startsAt: new Date("2026-04-26T23:00:00.000Z"),
      endsAt: new Date("2026-04-27T01:00:00.000Z"),
      seasonId: springSeason.id,
      cohortId: cohorts[0].id,
      venueId: venues[2].id,
      status: EventStatus.PUBLISHED,
      capacity: 20,
    },
    {
      title: "Morning Ritual Walk",
      slug: "morning-ritual-walk",
      description: "A social walk through Lower Manhattan followed by coffee.",
      startsAt: new Date("2026-05-03T13:00:00.000Z"),
      endsAt: new Date("2026-05-03T15:00:00.000Z"),
      seasonId: springSeason.id,
      cohortId: cohorts[1].id,
      venueId: venues[1].id,
      status: EventStatus.PUBLISHED,
      capacity: 14,
    },
    {
      title: "Culture Circuit Night",
      slug: "culture-circuit-night",
      description: "Small groups rotate through galleries and reconvene for reflections.",
      startsAt: new Date("2026-05-10T22:00:00.000Z"),
      endsAt: new Date("2026-05-11T00:30:00.000Z"),
      seasonId: springSeason.id,
      cohortId: cohorts[2].id,
      venueId: venues[0].id,
      status: EventStatus.PUBLISHED,
      capacity: 22,
    },
    {
      title: "Summer Cohort Mixer",
      slug: "summer-cohort-mixer",
      description: "Pre-season mixer for members joining summer cohorts.",
      startsAt: new Date("2026-06-05T23:00:00.000Z"),
      endsAt: new Date("2026-06-06T01:00:00.000Z"),
      seasonId: summerSeason.id,
      cohortId: cohorts[2].id,
      venueId: venues[2].id,
      status: EventStatus.DRAFT,
      capacity: 26,
    },
    {
      title: "Listening Room",
      slug: "listening-room",
      description: "An evening centered around shared music and intentional conversation.",
      startsAt: new Date("2026-06-14T23:30:00.000Z"),
      endsAt: new Date("2026-06-15T01:30:00.000Z"),
      seasonId: summerSeason.id,
      cohortId: cohorts[2].id,
      venueId: venues[1].id,
      status: EventStatus.DRAFT,
      capacity: 18,
    },
    {
      title: "Closing Toast",
      slug: "closing-toast",
      description: "A final spring gathering to reflect and set intentions ahead.",
      startsAt: new Date("2026-06-28T23:00:00.000Z"),
      endsAt: new Date("2026-06-29T01:00:00.000Z"),
      seasonId: springSeason.id,
      cohortId: cohorts[0].id,
      venueId: venues[0].id,
      status: EventStatus.PUBLISHED,
      capacity: 20,
    },
  ] as const;

  const events = [];
  for (const event of eventBlueprint) {
    events.push(await prisma.event.create({ data: event }));
  }

  for (let i = 0; i < members.length; i += 1) {
    const event = events[i % events.length];

    await prisma.rSVP.create({
      data: {
        userId: members[i].id,
        eventId: event.id,
        status: [RSVPStatus.GOING, RSVPStatus.MAYBE, RSVPStatus.DECLINED][i % 3],
        guestsCount: i % 2,
        note: i % 4 === 0 ? "Running a little late from work." : null,
      },
    });
  }

  const dropRequests = await Promise.all([
    prisma.dropRequest.create({
      data: {
        requesterId: members[0].id,
        eventId: events[1].id,
        title: "Gallery companion request",
        context:
          "Looking for a member to join a Thursday gallery run before dinner.",
        status: DropRequestStatus.OPEN,
      },
    }),
    prisma.dropRequest.create({
      data: {
        requesterId: members[3].id,
        eventId: events[2].id,
        title: "Neighborhood dinner duo",
        context: "Seeking one person to co-host a cozy two-table dinner format.",
        status: DropRequestStatus.MATCHED,
      },
    }),
    prisma.dropRequest.create({
      data: {
        requesterId: members[5].id,
        eventId: events[4].id,
        title: "Sunday walk conversation",
        context: "Open to pairing with someone curious about architecture and cities.",
        status: DropRequestStatus.OPEN,
      },
    }),
    prisma.dropRequest.create({
      data: {
        requesterId: members[8].id,
        eventId: null,
        title: "Coffee intro this week",
        context: "Would love to meet a fellow editor or writer in the community.",
        status: DropRequestStatus.CLOSED,
      },
    }),
  ]);

  await prisma.dropResponse.createMany({
    data: [
      {
        requestId: dropRequests[0].id,
        responderId: members[1].id,
        status: DropResponseStatus.PENDING,
      },
      {
        requestId: dropRequests[1].id,
        responderId: members[2].id,
        status: DropResponseStatus.ACCEPTED,
        respondedAt: new Date("2026-04-23T17:00:00.000Z"),
      },
      {
        requestId: dropRequests[2].id,
        responderId: members[7].id,
        status: DropResponseStatus.DECLINED,
        respondedAt: new Date("2026-05-08T16:00:00.000Z"),
      },
    ],
  });

  await prisma.booking.createMany({
    data: [
      {
        userId: members[0].id,
        eventId: events[0].id,
        seats: 2,
        status: BookingStatus.CONFIRMED,
        confirmedAt: new Date("2026-04-07T14:00:00.000Z"),
      },
      {
        userId: members[4].id,
        eventId: events[3].id,
        seats: 1,
        status: BookingStatus.HOLD,
      },
      {
        userId: members[9].id,
        eventId: events[7].id,
        seats: 1,
        status: BookingStatus.CONFIRMED,
        confirmedAt: new Date("2026-06-20T15:30:00.000Z"),
      },
    ],
  });

  await prisma.reminder.createMany({
    data: [
      {
        userId: members[0].id,
        eventId: events[0].id,
        channel: ReminderChannel.EMAIL,
        status: ReminderStatus.SCHEDULED,
        scheduledFor: new Date("2026-04-12T18:00:00.000Z"),
      },
      {
        userId: members[2].id,
        eventId: events[1].id,
        channel: ReminderChannel.SMS,
        status: ReminderStatus.SENT,
        scheduledFor: new Date("2026-04-19T17:00:00.000Z"),
        sentAt: new Date("2026-04-19T17:01:00.000Z"),
      },
      {
        userId: members[9].id,
        eventId: events[7].id,
        channel: ReminderChannel.EMAIL,
        status: ReminderStatus.SCHEDULED,
        scheduledFor: new Date("2026-06-28T16:00:00.000Z"),
      },
    ],
  });

  const createdApplications = [];

  for (let i = 0; i < members.length; i += 1) {
    const application = await prisma.memberApplication.create({
      data: {
        userId: members[i].id,
        status: i < 8 ? ApplicationStatus.ACCEPTED : ApplicationStatus.SUBMITTED,
        submittedAt: new Date("2026-03-15T15:00:00.000Z"),
        headline: "Looking for a thoughtful social rhythm in New York.",
        aboutText:
          "I care about building real relationships through recurring gatherings and meaningful shared experiences.",
        availability: "Weeknights after 6:30pm and occasional Sunday mornings.",
      },
    });

    createdApplications.push(application);

    await prisma.questionnaireResponse.createMany({
      data: [
        {
          applicationId: application.id,
          questionKey: "values_connection",
          section: QuestionnaireSection.VALUES,
          response:
            "I'm energized by spaces where people are curious, generous, and willing to show up consistently.",
        },
        {
          applicationId: application.id,
          questionKey: "experience_hosting",
          section: QuestionnaireSection.EXPERIENCE,
          response:
            "I've hosted small dinners and community circles and enjoy creating warm environments.",
        },
        {
          applicationId: application.id,
          questionKey: "community_contribution",
          section: QuestionnaireSection.COMMUNITY,
          response:
            "I'd contribute by bringing people together across creative and professional backgrounds.",
        },
      ],
    });
  }

  await prisma.adminNote.createMany({
    data: [
      {
        adminId: admin.id,
        subjectUserId: members[0].id,
        applicationId: createdApplications[0].id,
        body: "Strong fit for hosting and conversation leadership.",
      },
      {
        adminId: admin.id,
        subjectUserId: members[4].id,
        applicationId: createdApplications[4].id,
        body: "Prioritize for summer cohort ambassador role.",
      },
    ],
  });

  console.info("Seed completed: admin + members + cohorts + events + related data.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
