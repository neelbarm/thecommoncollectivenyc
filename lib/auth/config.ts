import type { Role } from "@prisma/client";
import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";

import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth/password";
import { loginSchema } from "@/lib/validations/auth";

function resolveRole(value: unknown): Role {
  return value === "ADMIN" ? "ADMIN" : "MEMBER";
}

export const authConfig = {
  trustHost: true,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);

        if (!parsed.success) {
          return null;
        }

        const email = parsed.data.email.toLowerCase();
        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user || !user.isActive) {
          return null;
        }

        const isValidPassword = await verifyPassword(
          parsed.data.password,
          user.passwordHash,
        );

        if (!isValidPassword) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      // Credentials flow always puts the user id on `sub`. Keep `id` in sync so encoded
      // JWTs and session callbacks never lose the DB user id (empty id → findUnique fails).
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
        session.user.role = resolveRole(token.role);
      }

      return session;
    },
  },
} satisfies NextAuthConfig;
