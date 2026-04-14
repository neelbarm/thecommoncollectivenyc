import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/require-admin";
import { getAssignmentData } from "@/lib/admin/get-assignment-data";

export async function GET(request: Request) {
  const session = await requireAdmin();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const seasonId = url.searchParams.get("seasonId") ?? undefined;

  try {
    const data = await getAssignmentData(seasonId);
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Unable to load assignment data." },
      { status: 500 },
    );
  }
}
