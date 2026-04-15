import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/require-admin";
import { getVenueManagementData } from "@/lib/admin/get-venue-management-data";

export async function GET() {
  const session = await requireAdmin();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await getVenueManagementData();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Unable to load venues." }, { status: 500 });
  }
}
