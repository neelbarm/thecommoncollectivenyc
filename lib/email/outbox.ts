import { EmailOutboxType } from "@prisma/client";

import { logNotificationAttempt } from "@/lib/notifications/log";
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
    const created = await prisma.emailOutbox.create({
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
    await logNotificationAttempt({
      outboxId: created.id,
      type: input.type,
      status: "QUEUED",
      recipientEmail: email,
      triggerSource: "outbox-enqueue",
      dedupeKey: input.dedupeKey,
    });
    return created;
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code?: string }).code === "P2002"
    ) {
      await logNotificationAttempt({
        type: input.type,
        status: "DUPLICATE_PREVENTED",
        recipientEmail: email,
        triggerSource: "outbox-enqueue",
        dedupeKey: input.dedupeKey,
        errorSummary: "Deduped by existing outbox dedupe key.",
      });
      return null;
    }

    throw error;
  }
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function transactionalEmailShell({
  preheader,
  eyebrow,
  title,
  bodyHtml,
  actionLabel,
  actionHref,
}: {
  preheader: string;
  eyebrow: string;
  title: string;
  bodyHtml: string;
  actionLabel: string;
  actionHref: string;
}) {
  const safePreheader = escapeHtml(preheader);
  const safeEyebrow = escapeHtml(eyebrow);
  const safeTitle = escapeHtml(title);
  const safeActionLabel = escapeHtml(actionLabel);
  const safeActionHref = escapeHtml(actionHref);

  return `
    <div style="margin:0;background:#f6f3ee;padding:24px 12px;font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#1f1a17;">
      <div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;">${safePreheader}</div>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;margin:0 auto;background:#ffffff;border:1px solid #e9e2d8;border-radius:16px;overflow:hidden;">
        <tr>
          <td style="padding:24px 28px 10px;">
            <p style="margin:0 0 10px;font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:#7e6c55;">${safeEyebrow}</p>
            <h1 style="margin:0;font-size:28px;line-height:1.2;font-family:'Times New Roman',serif;color:#17120f;">${safeTitle}</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 28px 8px;font-size:15px;line-height:1.65;color:#302820;">
            ${bodyHtml}
          </td>
        </tr>
        <tr>
          <td style="padding:18px 28px 28px;">
            <a href="${safeActionHref}" style="display:inline-block;padding:11px 18px;border-radius:999px;background:#20160f;color:#fff6ee;text-decoration:none;font-size:13px;letter-spacing:0.06em;text-transform:uppercase;">${safeActionLabel}</a>
          </td>
        </tr>
      </table>
      <p style="max-width:620px;margin:12px auto 0;font-size:12px;line-height:1.5;color:#7e6c55;text-align:center;">
        The Common Collective
      </p>
    </div>
  `.trim();
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
  const appBaseUrl = process.env.NEXTAUTH_URL?.trim() || "http://localhost:3000";
  const safeFirstHtml = escapeHtml(safeFirst);
  const safeCohortHtml = escapeHtml(safeCohort);
  const safeSeasonHtml = escapeHtml(safeSeason);

  return {
    subject: `Welcome to ${safeCohort}`,
    htmlBody: transactionalEmailShell({
      preheader: `You have been added to ${safeCohort} for ${safeSeason}.`,
      eyebrow: "Cohort update",
      title: `Welcome to ${safeCohort}`,
      bodyHtml: `
        <p style="margin:0 0 12px;">Hi ${safeFirstHtml},</p>
        <p style="margin:0 0 12px;">You have been added to <strong>${safeCohortHtml}</strong> for <strong>${safeSeasonHtml}</strong>.</p>
        <p style="margin:0;">Your dashboard now reflects your cohort roster and upcoming plans.</p>
      `.trim(),
      actionLabel: "Open dashboard",
      actionHref: `${appBaseUrl}/dashboard`,
    }),
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
  const appBaseUrl = process.env.NEXTAUTH_URL?.trim() || "http://localhost:3000";
  const safeFirstHtml = escapeHtml(safeFirst);
  const safeTitleHtml = escapeHtml(safeTitle);
  const safeVenueHtml = escapeHtml(safeVenue);
  const when = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(startsAt);

  return {
    subject: `New event published: ${safeTitle}`,
    htmlBody: transactionalEmailShell({
      preheader: `${safeTitle} is now published.`,
      eyebrow: "Event published",
      title: "A new event is live",
      bodyHtml: `
        <p style="margin:0 0 12px;">Hi ${safeFirstHtml},</p>
        <p style="margin:0 0 12px;">A new event has been published for your program.</p>
        <p style="margin:0 0 4px;"><strong>${safeTitleHtml}</strong></p>
        <p style="margin:0 0 4px;">${escapeHtml(when)}</p>
        <p style="margin:0 0 12px;">${safeVenueHtml}</p>
        <p style="margin:0;">Review details and RSVP while spots are available.</p>
      `.trim(),
      actionLabel: "View events",
      actionHref: `${appBaseUrl}/events`,
    }),
  };
}

export function eventReminderEmailTemplate({
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
  const safeTitle = eventTitle || "Your upcoming event";
  const safeVenue = venueName || "your venue";
  const appBaseUrl = process.env.NEXTAUTH_URL?.trim() || "http://localhost:3000";
  const safeFirstHtml = escapeHtml(safeFirst);
  const safeTitleHtml = escapeHtml(safeTitle);
  const safeVenueHtml = escapeHtml(safeVenue);
  const when = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(startsAt);

  return {
    subject: `Reminder: ${safeTitle} starts soon`,
    htmlBody: transactionalEmailShell({
      preheader: `${safeTitle} starts soon.`,
      eyebrow: "Event reminder",
      title: "Upcoming event reminder",
      bodyHtml: `
        <p style="margin:0 0 12px;">Hi ${safeFirstHtml},</p>
        <p style="margin:0 0 12px;">This is your reminder for the event you RSVP'd to:</p>
        <p style="margin:0 0 4px;"><strong>${safeTitleHtml}</strong></p>
        <p style="margin:0 0 4px;">${escapeHtml(when)}</p>
        <p style="margin:0 0 12px;">${safeVenueHtml}</p>
        <p style="margin:0;">See you there.</p>
      `.trim(),
      actionLabel: "View event",
      actionHref: `${appBaseUrl}/events`,
    }),
  };
}
