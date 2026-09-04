import type { DealState } from "@/state-machine/deal-states";
import type { DealSession } from "@/models/deal-session";

import {
  transitionDeal,
} from "@/state-machine/deal-state-machine";

export interface DealControllerResult {
  success: boolean;
  session: DealSession;
  error?: string;
}

export class DealController {
  transition(
    session: DealSession,
    nextState: DealState
  ): DealControllerResult {
    const result = transitionDeal(
      session.state,
      nextState
    );

    if (!result.allowed) {
      return {
        success: false,
        session,
        error: result.reason,
      };
    }

    const updatedSession: DealSession = {
      ...session,

      state: nextState,

      updatedAt:
        new Date().toISOString(),
    };

    /*
     * When a deal is accepted, freeze the
     * accepted transaction price.
     */
    if (nextState === "ACCEPTED") {
      updatedSession.acceptedPrice =
        session.currentPrice;
    }

    return {
      success: true,
      session: updatedSession,
    };
  }

  incrementRound(
    session: DealSession
  ): DealSession {
    return {
      ...session,

      currentRound:
        session.currentRound + 1,

      updatedAt:
        new Date().toISOString(),
    };
  }
}