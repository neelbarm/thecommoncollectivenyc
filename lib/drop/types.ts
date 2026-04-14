import type { DropRequestStatus, DropResponseStatus } from "@prisma/client";

import type { DropActivity, DropTiming } from "@/lib/drop/constants";

export type MemberDropRequest = {
  id: string;
  title: string;
  activityType: DropActivity;
  timing: DropTiming;
  note: string | null;
  status: DropRequestStatus;
  createdAt: string;
  responses: Array<{
    id: string;
    responderName: string;
    status: DropResponseStatus;
    message: string | null;
    respondedAt: string | null;
  }>;
};

export type MemberDropData = {
  memberName: string;
  firstName: string;
  hasCohort: boolean;
  cohortName: string | null;
  cohortContext: string;
  activeRequest: MemberDropRequest | null;
  recentRequests: MemberDropRequest[];
};
