import { EmailOutboxType } from "@prisma/client";

import { prisma } from "@/lib/prisma";

type EnqueueEmailInput = {
  type: EmailOutboxType;
  recipientEmail: string;
  recipientName?: string | null;
  subject: string;
  htmlBody: string;
  dedupeKey: string;
};

export async function enqueueEmailOutbox(input: EnqueueEmailInput) {
  const email = input.recipientEmail.trim().toLowerCase();
  if (!email) {
    throw new Error("Recipient email is required.");
  }

  try {
    return await prisma.emailOutbox.create({
      data: {
        type: input.type,
        recipientEmail: email,
        recipientName: input.recipientName?.trim() || null,
        subject: input.subject,
        htmlBody: input.htmlBody,
        dedupeKey: input.dedupeKey,
      },
      select: { id: true },
    });
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code?: string }).code === "P2002"
    ) {
      return null;
    }

    throw error;
  }
}

export function cohortWelcomeEmailTemplate({
  memberFirstName,
  cohortName,
  seasonName,
}: {
  memberFirstName: string;
  cohortName: string;
  seasonName: string;
}) {
  const safeFirst = memberFirstName || "there";
  const safeCohort = cohortName || "your cohort";
  const safeSeason = seasonName || "this season";

  return {
    subject: `Welcome to ${safeCohort}`,
    htmlBody: `
      <p>Hi ${safeFirst},</p>
      <p>You have been added to <strong>${safeCohort}</strong> for <strong>${safeSeason}</strong>.</p>
      <p>Open your dashboard to review your cohort details and upcoming plans.</p>
      <p>-- The Common Collective</p>
    `.trim(),
  };
}

export function eventPublishedEmailTemplate({
  memberFirstName,
  eventTitle,
  startsAt,
  venueName,
}: {
  memberFirstName: string;
  eventTitle: string;
  startsAt: Date;
  venueName: string;
}) {
  const safeFirst = memberFirstName || "there";
  const safeTitle = eventTitle || "A new event";
  const safeVenue = venueName || "your venue";
  const when = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(startsAt);

  return {
    subject: `New event published: ${safeTitle}`,
    htmlBody: `
      <p>Hi ${safeFirst},</p>
      <p>A new event is now live for your program:</p>
      <p><strong>${safeTitle}</strong><br/>${when}<br/>${safeVenue}</p>
      <p>Visit Events to review details and RSVP.</p>
      <p>-- The Common Collective</p>
    `.trim(),
  };
}
