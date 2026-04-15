import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/require-admin";
import { getSeasonManagementData } from "@/lib/admin/get-season-management-data";

export async function GET() {
  const session = await requireAdmin();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await getSeasonManagementData();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Unable to load seasons." }, { status: 500 });
  }
}
