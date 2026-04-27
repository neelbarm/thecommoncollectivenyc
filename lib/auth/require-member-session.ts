import { redirect } from "next/navigation";

import { auth } from "@/auth";

/** Use on server pages that must not render blank for unauthenticated users. */
export async function requireMemberSession() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }
  return session;
}
