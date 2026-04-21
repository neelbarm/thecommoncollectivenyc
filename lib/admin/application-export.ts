import type { ApplicationStatus, QuestionnaireSection } from "@prisma/client";
import PDFDocument from "pdfkit";

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

function sanitizeFilename(application: ExportApplication, extension: "md" | "pdf") {
  const name = `${application.user.firstName}-${application.user.lastName}`.trim();
  const safeName = escapeSegment(name) || "member";
  const submitted = application.submittedAt
    ? application.submittedAt.toISOString().slice(0, 10)
    : application.createdAt.toISOString().slice(0, 10);

  return `${submitted}-${safeName}-${application.id.slice(-8)}.${extension}`;
}

function listOrDash(values: string[]) {
  return values.length > 0 ? values.join(", ") : "—";
}

function pdfSafe(text: string) {
  return text.replace(/\r\n/g, "\n").replace(/\u0000/g, "");
}

function renderApplicationPdf(application: ExportApplication): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: "LETTER", bufferPages: true });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => {
      chunks.push(chunk);
    });
    doc.on("end", () => {
      resolve(Buffer.concat(chunks));
    });
    doc.on("error", reject);

    const memberName = `${application.user.firstName} ${application.user.lastName}`.trim();
    const profile = application.user.profile;
    const textWidth = 512;

    doc.font("Helvetica-Bold").fontSize(16).text(`Application: ${pdfSafe(memberName)}`, { width: textWidth });
    doc.moveDown(0.8);
    doc.font("Helvetica").fontSize(10);

    const metaLines = [
      `Application ID: ${application.id}`,
      `Member ID: ${application.user.id}`,
      `Status: ${application.status}`,
      `Submitted At: ${formatDateTime(application.submittedAt)}`,
      `Reviewed At: ${formatDateTime(application.reviewedAt)}`,
      `Reviewer: ${application.reviewerName ?? "—"}`,
      `Email: ${application.user.email}`,
      `Account Created At: ${formatDateTime(application.user.createdAt)}`,
      `Exported At: ${new Date().toISOString()}`,
    ];
    for (const line of metaLines) {
      doc.text(pdfSafe(line), { width: textWidth });
    }
    doc.moveDown(1);

    const heading = (title: string) => {
      doc.font("Helvetica-Bold").fontSize(12).text(pdfSafe(title), { width: textWidth });
      doc.font("Helvetica").fontSize(10);
      doc.moveDown(0.35);
    };

    const body = (t: string) => {
      doc.text(pdfSafe(t || "—"), { width: textWidth, align: "left" });
      doc.moveDown(0.5);
    };

    heading("Application");
    doc.font("Helvetica-Bold").fontSize(10).text("Headline", { width: textWidth });
    doc.font("Helvetica");
    body(application.headline);
    doc.font("Helvetica-Bold").text("About");
    doc.font("Helvetica");
    body(application.aboutText);
    doc.font("Helvetica-Bold").text("Availability");
    doc.font("Helvetica");
    body(application.availability);
    doc.moveDown(0.5);

    heading("Profile preferences");
    const profileLines = [
      `Neighborhood: ${profile?.neighborhood ?? "—"}`,
      `Age range: ${profile?.ageRange ?? "—"}`,
      `Occupation: ${profile?.occupation ?? "—"}`,
      `Social goal: ${profile?.socialGoal ?? "—"}`,
      `Preferred nights: ${profile?.preferredNights ?? "—"}`,
      `Budget comfort: ${profile?.budgetComfort ?? "—"}`,
      `Drinking preference: ${profile?.drinkingPreference ?? "—"}`,
      `Smoking preference: ${profile?.smokingPreference ?? "—"}`,
      `Physical activity: ${profile?.physicalActivityLevel ?? "—"}`,
      `Time preference: ${profile?.timePreference ?? "—"}`,
      `Plans frequency: ${profile?.plansFrequency ?? "—"}`,
      `Ideal group energy: ${profile?.idealGroupEnergy ?? "—"}`,
      `Interests: ${listOrDash(profile?.interests ?? [])}`,
      `Preferred vibe: ${listOrDash(profile?.preferredVibe ?? [])}`,
      `People to meet: ${profile?.peopleToMeet ?? "—"}`,
      `Ideal week: ${profile?.idealWeek ?? "—"}`,
      `Onboarding completed: ${formatDateTime(profile?.onboardingCompletedAt ?? null)}`,
    ];
    for (const line of profileLines) {
      doc.text(pdfSafe(line), { width: textWidth });
    }
    doc.moveDown(0.8);

    heading("Cohort memberships");
    if (application.user.cohortMemberships.length === 0) {
      doc.text("—", { width: textWidth });
    } else {
      for (const membership of application.user.cohortMemberships) {
        doc.text(
          pdfSafe(
            `${membership.cohort.season.code} / ${membership.cohort.name} (${membership.status}) · added ${formatDateTime(membership.createdAt)}`,
          ),
          { width: textWidth },
        );
      }
    }
    doc.moveDown(0.8);

    heading("Questionnaire responses");
    if (application.responses.length === 0) {
      doc.text("—", { width: textWidth });
    } else {
      for (const response of application.responses) {
        doc.font("Helvetica-Bold").fontSize(10).text(`${response.section} / ${response.questionKey}`, { width: textWidth });
        doc.font("Helvetica");
        doc.text(pdfSafe(response.response || "—"), { width: textWidth });
        doc.moveDown(0.5);
      }
    }
    doc.moveDown(0.5);

    heading("Admin notes");
    if (application.notes.length === 0) {
      doc.text("—", { width: textWidth });
    } else {
      for (const note of application.notes) {
        const author = `${note.author.firstName} ${note.author.lastName}`.trim();
        doc.font("Helvetica-Bold").fontSize(10).text(`${author} · ${formatDateTime(note.createdAt)}`, { width: textWidth });
        doc.font("Helvetica");
        doc.text(pdfSafe(note.body || "—"), { width: textWidth });
        doc.moveDown(0.6);
      }
    }

    doc.end();
  });
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

/** Builds a tar archive with README, index.json, and one PDF per application. */
export async function createApplicationPdfExportArchive(applications: ExportApplication[]): Promise<Buffer> {
  const readme = [
    "Common Collective application export",
    "",
    "This archive contains one PDF file per application.",
    "Suggested workflow:",
    "1. Extract the .tar archive locally.",
    "2. Open PDFs or upload them to your review / AI tools.",
    "",
    `Total applications: ${applications.length}`,
  ].join("\n");

  const index = applications.map((application) => ({
    id: application.id,
    fileName: sanitizeFilename(application, "pdf"),
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
    const pdf = await renderApplicationPdf(application);
    files.push({
      name: `applications/${sanitizeFilename(application, "pdf")}`,
      content: pdf,
    });
  }

  return buildTarArchive(files);
}
