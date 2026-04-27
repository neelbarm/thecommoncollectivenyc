/**
 * APNs auth key (p8) via env. Use literal \n in env or real newlines in secret managers.
 */
export function getApnsConfig() {
  const keyId = process.env.APNS_AUTH_KEY_ID?.trim();
  const teamId = process.env.APNS_TEAM_ID?.trim();
  const keyRaw = process.env.APNS_PRIVATE_KEY?.trim();
  const bundleId = process.env.APNS_BUNDLE_ID?.trim() || "space.thecommoncollective.app";
  const sandbox =
    process.env.APNS_USE_SANDBOX === "true" || process.env.APNS_USE_SANDBOX === "1";

  if (!keyId || !teamId || !keyRaw) {
    return null;
  }

  const key = keyRaw.replace(/\\n/g, "\n");

  return {
    keyId,
    teamId,
    key,
    bundleId,
    /** node-apn: production true = Apple production gateway */
    production: !sandbox,
  };
}
