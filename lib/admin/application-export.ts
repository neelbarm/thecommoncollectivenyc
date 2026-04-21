import type { ApplicationStatus, QuestionnaireSection } from "@prisma/client";

/** Shape expected by export (matches Prisma query + mapped reviewer/notes). */
export type ExportApplication = {
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

export type ExportArchiveFile = {
  name: string;
  content: string | Buffer;
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

  return `${submitted}-${safeName}-${application.id.slice(-8)}.txt`;
}

function listOrDash(values: string[]) {
  return values.length > 0 ? values.join(", ") : "—";
}

/** Plain UTF-8 text only: no markdown, no # headings (opens as generic text in any editor). */
function renderApplicationPlainText(application: ExportApplication) {
  const memberName = `${application.user.firstName} ${application.user.lastName}`.trim();
  const profile = application.user.profile;

  const lines: string[] = [];

  const section = (title: string) => {
    lines.push(title);
    lines.push("-".repeat(Math.min(title.length, 72)));
    lines.push("");
  };

  section(`APPLICATION: ${memberName}`);

  lines.push(`Application ID: ${application.id}`);
  lines.push(`Member ID: ${application.user.id}`);
  lines.push(`Status: ${application.status}`);
  lines.push(`Submitted At: ${formatDateTime(application.submittedAt)}`);
  lines.push(`Reviewed At: ${formatDateTime(application.reviewedAt)}`);
  lines.push(`Reviewer: ${application.reviewerName ?? "—"}`);
  lines.push(`Email: ${application.user.email}`);
  lines.push(`Account Created At: ${formatDateTime(application.user.createdAt)}`);
  lines.push(`Exported At: ${new Date().toISOString()}`);
  lines.push("");

  section("APPLICATION (TEXT)");
  lines.push("Headline");
  lines.push(application.headline || "—");
  lines.push("");
  lines.push("About");
  lines.push(application.aboutText || "—");
  lines.push("");
  lines.push("Availability");
  lines.push(application.availability || "—");
  lines.push("");

  section("PROFILE PREFERENCES");
  lines.push(`Neighborhood: ${profile?.neighborhood ?? "—"}`);
  lines.push(`Age range: ${profile?.ageRange ?? "—"}`);
  lines.push(`Occupation: ${profile?.occupation ?? "—"}`);
  lines.push(`Social goal: ${profile?.socialGoal ?? "—"}`);
  lines.push(`Preferred nights: ${profile?.preferredNights ?? "—"}`);
  lines.push(`Budget comfort: ${profile?.budgetComfort ?? "—"}`);
  lines.push(`Drinking preference: ${profile?.drinkingPreference ?? "—"}`);
  lines.push(`Smoking preference: ${profile?.smokingPreference ?? "—"}`);
  lines.push(`Physical activity: ${profile?.physicalActivityLevel ?? "—"}`);
  lines.push(`Time preference: ${profile?.timePreference ?? "—"}`);
  lines.push(`Plans frequency: ${profile?.plansFrequency ?? "—"}`);
  lines.push(`Ideal group energy: ${profile?.idealGroupEnergy ?? "—"}`);
  lines.push(`Interests: ${listOrDash(profile?.interests ?? [])}`);
  lines.push(`Preferred vibe: ${listOrDash(profile?.preferredVibe ?? [])}`);
  lines.push(`People to meet: ${profile?.peopleToMeet ?? "—"}`);
  lines.push(`Ideal week: ${profile?.idealWeek ?? "—"}`);
  lines.push(`Onboarding completed: ${formatDateTime(profile?.onboardingCompletedAt ?? null)}`);
  lines.push("");

  section("COHORT MEMBERSHIPS");
  if (application.user.cohortMemberships.length === 0) {
    lines.push("—");
  } else {
    for (const membership of application.user.cohortMemberships) {
      lines.push(
        `${membership.cohort.season.code} / ${membership.cohort.name} (${membership.status}) · added ${formatDateTime(membership.createdAt)}`,
      );
    }
  }
  lines.push("");

  section("QUESTIONNAIRE RESPONSES");
  if (application.responses.length === 0) {
    lines.push("—");
  } else {
    for (const response of application.responses) {
      lines.push(`${response.section} / ${response.questionKey}`);
      lines.push(response.response || "—");
      lines.push("");
    }
  }

  section("ADMIN NOTES");
  if (application.notes.length === 0) {
    lines.push("—");
  } else {
    for (const note of application.notes) {
      const author = `${note.author.firstName} ${note.author.lastName}`.trim();
      lines.push(`${author} · ${formatDateTime(note.createdAt)}`);
      lines.push(note.body || "—");
      lines.push("");
    }
  }

  return `${lines.join("\n")}\n`;
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

export function buildTarArchive(files: ExportArchiveFile[]) {
  const chunks: Buffer[] = [];

  for (const file of files) {
    const content = typeof file.content === "string" ? Buffer.from(file.content, "utf8") : file.content;
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

/** Tar archive: README.txt, index.json, and one plain .txt file per application (UTF-8, no markdown). */
export function createApplicationTextExportArchive(applications: ExportApplication[]): Buffer {
  const readme = [
    "Common Collective application export",
    "",
    "This archive contains one plain text (.txt) file per application.",
    "Files are UTF-8 with no markdown syntax so they open as simple text in any editor.",
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

  const files: ExportArchiveFile[] = [
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
      content: renderApplicationPlainText(application),
    });
  }

  return buildTarArchive(files);
}
