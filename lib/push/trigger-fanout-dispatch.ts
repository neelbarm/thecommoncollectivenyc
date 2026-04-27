import { dispatchPushFanout } from "@/lib/push/dispatch-apns";
import { logPushNoTargets } from "@/lib/push/fanout";

type FanoutPlan = {
  targets: Array<{ id: string; token: string; userId: string }>;
  payload: {
    title: string;
    body: string;
    data: Record<string, string>;
  };
};

/**
 * Fire-and-forget: resolve targets + send APNs. Never throws to callers.
 */
export function triggerPushFanoutDispatch(plan: FanoutPlan, dedupeKey: string, triggerSource: string) {
  void (async () => {
    try {
      if (plan.targets.length === 0) {
        await logPushNoTargets(triggerSource);
        return;
      }
      await dispatchPushFanout({
        targets: plan.targets,
        payload: plan.payload,
        dedupeKey,
        triggerSource,
      });
    } catch {
      // Push must not break core flows
    }
  })();
}
