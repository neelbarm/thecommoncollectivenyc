import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { applicationSchema } from "@/lib/validations/application";

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }
  const parsed = applicationSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error:
          parsed.error.issues[0]?.message ??
          "Invalid application payload. Please check your responses and try again.",
      },
      { status: 400 },
    );
  }

  const application = await prisma.memberApplication.create({
    data: {
      userId: session.user.id,
      headline: parsed.data.headline,
      aboutText: parsed.data.aboutText,
      availability: parsed.data.availability,
      status: "SUBMITTED",
      submittedAt: new Date(),
      responses: {
        createMany: {
          data: parsed.data.responses,
        },
      },
    },
    select: {
      id: true,
    },
  });

  return NextResponse.json({ ok: true, applicationId: application.id }, { status: 201 });
}
