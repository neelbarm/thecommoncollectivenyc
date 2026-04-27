import { getMemberAnnouncementsData } from "@/lib/announcements/get-member-announcements-data";
import { getMemberChatData } from "@/lib/chat/get-member-chat-data";

/** Matches `/api/inbox/unread` total (capped for badge display). */
export async function getInboxUnreadTotalForUser(userId: string): Promise<number> {
  const [announcements, chat] = await Promise.all([
    getMemberAnnouncementsData(userId),
    getMemberChatData(userId),
  ]);
  const a = announcements?.unreadCount ?? 0;
  const c = chat?.unreadCount ?? 0;
  return Math.min(a + c, 99);
}
