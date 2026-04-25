import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { getMemberAnnouncementsData } from "@/lib/announcements/get-member-announcements-data";

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await getMemberAnnouncementsData(session.user.id);
    return NextResponse.json({ ok: true, data });
  } catch {
    return NextResponse.json({ error: "Unable to load announcements right now." }, { status: 500 });
  }
}
