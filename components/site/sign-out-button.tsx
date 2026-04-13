"use client";

import { signOut } from "next-auth/react";

export function SignOutButton() {
  return (
    <button
      className="w-full cursor-pointer text-left"
      onClick={() => signOut({ callbackUrl: "/" })}
      type="button"
    >
      Log out
    </button>
  );
}
