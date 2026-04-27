import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { getMemberAnnouncementsData } from "@/lib/announcements/get-member-announcements-data";
import { getMemberChatData } from "@/lib/chat/get-member-chat-data";

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [announcements, chat] = await Promise.all([
      getMemberAnnouncementsData(session.user.id),
      getMemberChatData(session.user.id),
    ]);

    const unreadAnnouncements = announcements?.unreadCount ?? 0;
    const unreadChat = chat?.unreadCount ?? 0;
    const total = unreadAnnouncements + unreadChat;

    return NextResponse.json({
      ok: true,
      unreadAnnouncements,
      unreadChat,
      total,
    });
  } catch {
    return NextResponse.json({ error: "Unable to load inbox counts." }, { status: 500 });
  }
}
