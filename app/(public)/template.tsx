import type { ReactNode } from "react";

import { pageEnterClasses } from "@/lib/motion";

export default function PublicTemplate({ children }: { children: ReactNode }) {
  return <div className={pageEnterClasses}>{children}</div>;
}
