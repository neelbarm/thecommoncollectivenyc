import type { ApplicationStatus, QuestionnaireSection } from "@prisma/client";

type ExportApplication = {
  id: string;
  status: ApplicationStatus;
  createdAt: Date;
  updatedAt: Date;
  submittedAt: Date | null;
  reviewedAt: Date | null;
  headline: string;
  aboutText: string;
  availability: string;
  reviewerName: string | null;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    createdAt: Date;
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
      onboardingCompletedAt: Date | null;
    } | null;
    cohortMemberships: Array<{
      status: string;
      createdAt: Date;
      cohort: {
        name: string;
        slug: string;
        season: {
          code: string;
          name: string;
        };
      };
    }>;
  };
  responses: Array<{
    questionKey: string;
    section: QuestionnaireSection;
    response: string;
    updatedAt: Date;
  }>;
  notes: Array<{
    id: string;
    body: string;
    createdAt: Date;
    author: {
      firstName: string;
      lastName: string;
    };
  }>;
};

type ExportFile = {
  name: string;
  content: string;
};

function formatDateTime(value: Date | null) {
  return value ? value.toISOString() : "—";
}

function escapeSegment(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

function sanitizeFilename(application: ExportApplication) {
  const name = `${application.user.firstName}-${application.user.lastName}`.trim();
  const safeName = escapeSegment(name) || "member";
  const submitted = application.submittedAt
    ? application.submittedAt.toISOString().slice(0, 10)
    : application.createdAt.toISOString().slice(0, 10);

  return `${submitted}-${safeName}-${application.id.slice(-8)}.md`;
}

function section(title: string, lines: string[]) {
  return [`## ${title}`, ...lines, ""].join("\n");
}

function listOrDash(values: string[]) {
  return values.length > 0 ? values.join(", ") : "—";
}

function renderApplicationMarkdown(application: ExportApplication) {
  const memberName = `${application.user.firstName} ${application.user.lastName}`.trim();
  const profile = application.user.profile;

  const header = [
    `# Application: ${memberName}`,
    "",
    `- Application ID: ${application.id}`,
    `- Member ID: ${application.user.id}`,
    `- Status: ${application.status}`,
    `- Submitted At: ${formatDateTime(application.submittedAt)}`,
    `- Reviewed At: ${formatDateTime(application.reviewedAt)}`,
    `- Reviewer: ${application.reviewerName ?? "—"}`,
    `- Email: ${application.user.email}`,
    `- Account Created At: ${formatDateTime(application.user.createdAt)}`,
    `- Exported At: ${new Date().toISOString()}`,
    "",
  ].join("\n");

  const applicationSection = section("Application", [
    `### Headline`,
    application.headline || "—",
    "",
    `### About`,
    application.aboutText || "—",
    "",
    `### Availability`,
    application.availability || "—",
  ]);

  const profileSection = section("Profile Preferences", [
    `- Neighborhood: ${profile?.neighborhood ?? "—"}`,
    `- Age Range: ${profile?.ageRange ?? "—"}`,
    `- Occupation: ${profile?.occupation ?? "—"}`,
    `- Social Goal: ${profile?.socialGoal ?? "—"}`,
    `- Preferred Nights: ${profile?.preferredNights ?? "—"}`,
    `- Budget Comfort: ${profile?.budgetComfort ?? "—"}`,
    `- Drinking Preference: ${profile?.drinkingPreference ?? "—"}`,
    `- Smoking Preference: ${profile?.smokingPreference ?? "—"}`,
    `- Physical Activity Level: ${profile?.physicalActivityLevel ?? "—"}`,
    `- Time Preference: ${profile?.timePreference ?? "—"}`,
    `- Plans Frequency: ${profile?.plansFrequency ?? "—"}`,
    `- Ideal Group Energy: ${profile?.idealGroupEnergy ?? "—"}`,
    `- Interests: ${listOrDash(profile?.interests ?? [])}`,
    `- Preferred Vibe: ${listOrDash(profile?.preferredVibe ?? [])}`,
    `- People To Meet: ${profile?.peopleToMeet ?? "—"}`,
    `- Ideal Week: ${profile?.idealWeek ?? "—"}`,
    `- Onboarding Completed At: ${formatDateTime(profile?.onboardingCompletedAt ?? null)}`,
  ]);

  const membershipsSection = section(
    "Current / Recent Cohort Memberships",
    application.user.cohortMemberships.length > 0
      ? application.user.cohortMemberships.map(
          (membership) =>
            `- ${membership.cohort.season.code} / ${membership.cohort.name} (${membership.status}) · added ${formatDateTime(
              membership.createdAt,
            )}`,
        )
      : ["—"],
  );

  const responsesSection = section(
    "Questionnaire Responses",
    application.responses.length > 0
      ? application.responses.flatMap((response) => [
          `### ${response.section} / ${response.questionKey}`,
          response.response || "—",
          "",
        ])
      : ["—"],
  );

  const notesSection = section(
    "Admin Notes",
    application.notes.length > 0
      ? application.notes.flatMap((note) => [
          `### ${`${note.author.firstName} ${note.author.lastName}`.trim()} · ${formatDateTime(note.createdAt)}`,
          note.body || "—",
          "",
        ])
      : ["—"],
  );

  return [header, applicationSection, profileSection, membershipsSection, responsesSection, notesSection]
    .filter(Boolean)
    .join("\n");
}

function buildTarHeader(name: string, size: number) {
  const header = Buffer.alloc(512, 0);

  const writeString = (value: string, offset: number, length: number) => {
    Buffer.from(value).copy(header, offset, 0, Math.min(Buffer.byteLength(value), length));
  };

  const writeOctal = (value: number, offset: number, length: number) => {
    const octal = value.toString(8).padStart(length - 1, "0");
    writeString(`${octal}\0`, offset, length);
  };

  writeString(name, 0, 100);
  writeOctal(0o644, 100, 8);
  writeOctal(0, 108, 8);
  writeOctal(0, 116, 8);
  writeOctal(size, 124, 12);
  writeOctal(Math.floor(Date.now() / 1000), 136, 12);
  header.fill(32, 148, 156);
  writeString("0", 156, 1);
  writeString("ustar", 257, 6);
  writeString("00", 263, 2);

  let checksum = 0;
  for (const byte of header) {
    checksum += byte;
  }
  const checksumOctal = checksum.toString(8).padStart(6, "0");
  writeString(`${checksumOctal}\0 `, 148, 8);

  return header;
}

export function buildTarArchive(files: ExportFile[]) {
  const chunks: Buffer[] = [];

  for (const file of files) {
    const content = Buffer.from(file.content, "utf8");
    chunks.push(buildTarHeader(file.name, content.length));
    chunks.push(content);

    const remainder = content.length % 512;
    if (remainder !== 0) {
      chunks.push(Buffer.alloc(512 - remainder, 0));
    }
  }

  chunks.push(Buffer.alloc(1024, 0));
  return Buffer.concat(chunks);
}

export function createApplicationExportFiles(applications: ExportApplication[]) {
  const readme = [
    "Common Collective application export",
    "",
    "This archive contains one markdown file per application.",
    "Suggested workflow:",
    "1. Extract the .tar archive locally.",
    "2. Review or rename files if needed.",
    "3. Upload the markdown files into your AI workspace for analysis.",
    "",
    `Total applications: ${applications.length}`,
  ].join("\n");

  const index = applications.map((application) => ({
    id: application.id,
    fileName: sanitizeFilename(application),
    memberName: `${application.user.firstName} ${application.user.lastName}`.trim(),
    email: application.user.email,
    status: application.status,
    submittedAt: application.submittedAt?.toISOString() ?? null,
  }));

  const files: ExportFile[] = [
    {
      name: "README.txt",
      content: `${readme}\n`,
    },
    {
      name: "index.json",
      content: `${JSON.stringify(index, null, 2)}\n`,
    },
  ];

  for (const application of applications) {
    files.push({
      name: `applications/${sanitizeFilename(application)}`,
      content: `${renderApplicationMarkdown(application)}\n`,
    });
  }

  return files;
}
