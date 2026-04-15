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
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      if (
        (!token.id || (typeof token.id === "string" && token.id.length === 0)) &&
        typeof token.sub === "string" &&
        token.sub.length > 0
      ) {
        token.id = token.sub;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        const idFromToken =
          typeof token.id === "string" && token.id.length > 0 ? token.id : undefined;
        const idFromSub =
          typeof token.sub === "string" && token.sub.length > 0 ? token.sub : undefined;
        session.user.id = idFromToken ?? idFromSub ?? "";
        session.user.role = token.role === "ADMIN" ? "ADMIN" : "MEMBER";
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
