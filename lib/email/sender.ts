import nodemailer from "nodemailer";

let cachedTransporter: nodemailer.Transporter | null = null;

function requiredEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required email config: ${name}`);
  }
  return value;
}

function getTransporter() {
  if (cachedTransporter) {
    return cachedTransporter;
  }

  const host = requiredEnv("SMTP_HOST");
  const port = Number.parseInt(requiredEnv("SMTP_PORT"), 10);
  const user = requiredEnv("SMTP_USER");
  const pass = requiredEnv("SMTP_PASS");

  cachedTransporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
  });

  return cachedTransporter;
}

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  const from = requiredEnv("EMAIL_FROM");
  const transporter = getTransporter();

  await transporter.sendMail({
    from,
    to,
    subject,
    html,
  });
}
