import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";

type ParsedArgs = {
  email: string;
  password: string;
};

function parseArgs(argv: string[]): ParsedArgs {
  const byFlag = new Map<string, string>();
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token.startsWith("--")) {
      const next = argv[i + 1];
      if (!next || next.startsWith("--")) {
        throw new Error(`Missing value for ${token}`);
      }
      byFlag.set(token, next);
      i += 1;
    }
  }

  const email = (byFlag.get("--email") ?? "").trim().toLowerCase();
  const password = byFlag.get("--password") ?? "";

  if (!email) {
    throw new Error("Missing --email argument.");
  }
  if (!password || password.length < 8) {
    throw new Error("Missing --password argument or password too short (min 8 chars).");
  }

  return { email, password };
}

async function main() {
  const { email, password } = parseArgs(process.argv.slice(2));
  const passwordHash = await hashPassword(password);

  const updated = await prisma.user.updateMany({
    where: { email },
    data: {
      passwordHash,
      isActive: true,
    },
  });

  if (updated.count === 0) {
    throw new Error(`No user found for email: ${email}`);
  }

  console.log(`Password reset complete for ${email}. Updated rows: ${updated.count}.`);
}

main()
  .catch((error) => {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`admin-reset-password failed: ${message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
