import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/require-admin";
import { getEventManagementData } from "@/lib/admin/get-event-management-data";

export async function GET() {
  const session = await requireAdmin();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await getEventManagementData();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Unable to load event data." }, { status: 500 });
  }
}
