/**
 * node-apn expects a hex device token string. Capacitor may return hex (with or without spaces).
 */
export function normalizeApnsDeviceToken(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) {
    return null;
  }

  const noSpaces = trimmed.replace(/\s+/g, "");
  if (/^[0-9a-fA-F]+$/.test(noSpaces) && noSpaces.length % 2 === 0) {
    return noSpaces.toLowerCase();
  }

  try {
    const buf = Buffer.from(trimmed, "base64");
    if (buf.length > 0) {
      return buf.toString("hex");
    }
  } catch {
    // ignore
  }

  return null;
}
