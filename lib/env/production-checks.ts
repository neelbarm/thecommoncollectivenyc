const CORE_REQUIRED_ENV = ["DATABASE_URL", "NEXTAUTH_URL", "NEXTAUTH_SECRET"] as const;
const EMAIL_REQUIRED_ENV = [
  "SMTP_HOST",
  "SMTP_PORT",
  "SMTP_USER",
  "SMTP_PASS",
  "EMAIL_FROM",
  "EMAIL_DISPATCH_TOKEN",
] as const;

function missingVars(keys: readonly string[]) {
  return keys.filter((key) => {
    const value = process.env[key];
    return !value || value.trim().length === 0;
  });
}

/**
 * Fail fast in production for critical runtime configuration.
 * Local/dev remains permissive to preserve setup ergonomics.
 */
export function assertCoreProductionEnv() {
  if (process.env.NODE_ENV !== "production") {
    return;
  }

  const missing = missingVars(CORE_REQUIRED_ENV);
  if (missing.length > 0) {
    throw new Error(`Missing required production env vars: ${missing.join(", ")}`);
  }
}

export function getMissingEmailDispatchEnv() {
  return missingVars(EMAIL_REQUIRED_ENV);
}

export function getMissingProductionEnv(keys: readonly string[]) {
  return missingVars(keys);
}

export function validateEmailDispatchEnv() {
  const missing = getMissingEmailDispatchEnv();
  if (missing.length > 0) {
    return {
      ok: false as const,
      error: `Email dispatch is not configured. Missing env vars: ${missing.join(", ")}`,
    };
  }
  return { ok: true as const };
}

export function ensureNotificationDispatchEnv() {
  return validateEmailDispatchEnv();
}

