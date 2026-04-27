import { prisma } from "@/lib/prisma";

export type RegisterDevicePushTokenInput = {
  userId: string;
  platform: string;
  token: string;
  appBundle?: string | null;
  environment?: string | null;
  deviceModel?: string | null;
  osVersion?: string | null;
  locale?: string | null;
};

function compact(value: string | null | undefined) {
  const next = value?.trim();
  return next && next.length > 0 ? next : null;
}

export async function registerDevicePushToken(input: RegisterDevicePushTokenInput) {
  const platform = input.platform.trim().toLowerCase();
  const token = input.token.trim();

  if (!platform || !token) {
    throw new Error("Push token registration requires both platform and token.");
  }

  const now = new Date();

  return prisma.devicePushToken.upsert({
    where: {
      platform_token: {
        platform,
        token,
      },
    },
    update: {
      userId: input.userId,
      isActive: true,
      appBundle: compact(input.appBundle),
      environment: compact(input.environment),
      deviceModel: compact(input.deviceModel),
      osVersion: compact(input.osVersion),
      locale: compact(input.locale),
      lastRegisteredAt: now,
      lastError: null,
    },
    create: {
      userId: input.userId,
      platform,
      token,
      appBundle: compact(input.appBundle),
      environment: compact(input.environment),
      deviceModel: compact(input.deviceModel),
      osVersion: compact(input.osVersion),
      locale: compact(input.locale),
      isActive: true,
      lastRegisteredAt: now,
    },
    select: {
      id: true,
      platform: true,
      lastRegisteredAt: true,
    },
  });
}
