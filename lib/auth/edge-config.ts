import type { NextAuthConfig } from "next-auth";

/**
 * Minimal NextAuth config safe to run in the Edge Runtime (middleware).
 * No Prisma, no pg, no Node.js-only modules.
 * Used exclusively by middleware.ts for JWT session reading.
 */
export const edgeAuthConfig = {
  trustHost: true,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [],
  callbacks: {
    async session({ session, token }) {
      if (session.user) {
        session.user.id = typeof token.id === "string" ? token.id : "";
        session.user.role = token.role === "ADMIN" ? "ADMIN" : "MEMBER";
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
