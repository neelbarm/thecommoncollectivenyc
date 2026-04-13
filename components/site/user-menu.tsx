"use client";

import Link from "next/link";
import type { Session } from "next-auth";
import { signOut } from "next-auth/react";

import { Button } from "@/components/ui/button";

export function UserMenu({ session }: { session: Session | null }) {
  if (!session?.user) {
    return (
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
          <Link href="/login">Log in</Link>
        </Button>
        <Button asChild size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Link href="/signup">Join</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
        <Link href="/dashboard">Dashboard</Link>
      </Button>
      {session.user.role === "ADMIN" ? (
        <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
          <Link href="/admin">Admin</Link>
        </Button>
      ) : null}
      <Button variant="outline" size="sm" onClick={() => signOut({ callbackUrl: "/" })}>
        Log out
      </Button>
    </div>
  );
}
