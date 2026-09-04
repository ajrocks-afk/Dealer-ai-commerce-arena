import type { DealState } from "./deal-states";

import { DEAL_TRANSITIONS } from "./deal-transitions";

export interface StateTransitionResult {
  allowed: boolean;

  from: DealState;

  to: DealState;

  reason?: string;
}

export function canTransition(
  from: DealState,
  to: DealState
): boolean {
  const allowedTransitions =
    DEAL_TRANSITIONS[from];

  console.log(
    "[STATE MACHINE]",
    JSON.stringify({
      from,
      to,
      allowedTransitions,
      accepted:
        allowedTransitions?.includes("ACCEPTED"),
    })
  );

  return allowedTransitions.includes(to);
}

export function transitionDeal(
  from: DealState,
  to: DealState
): StateTransitionResult {
  if (canTransition(from, to)) {
    return {
      allowed: true,
      from,
      to,
    };
  }

  return {
    allowed: false,
    from,
    to,
    reason: `Invalid deal state transition: ${from} → ${to}`,
  };
}