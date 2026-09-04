import { describe, expect, it } from "vitest";

import {
  GeminiDecisionService,
} from "@/services/gemini-service";

import type {
  AgentContext,
} from "@/agents/agent-types";

describe("GeminiDecisionService", () => {
  const context: AgentContext = {
    dealSessionId: "deal-001",

    round: 1,
    maxRounds: 5,

    currentPrice: 5000000,
    initialPrice: 5000000,

    currency: "INR",

    previousOffers: [],
  };

  it("does not generate an AI decision without a configured provider", async () => {
    const service =
      new GeminiDecisionService();

    await expect(
      service.generateDecision(context)
    ).rejects.toThrow(
      "Gemini AI provider is not configured"
    );
  });

  it("does not silently return a fake AI decision", async () => {
    const service =
      new GeminiDecisionService();

    await expect(
      service.generateDecision(context)
    ).rejects.toThrow();
  });

  it("preserves the AI boundary without modifying the context", async () => {
    const service =
      new GeminiDecisionService();

    const originalContext = {
      ...context,
      previousOffers: [
        ...context.previousOffers,
      ],
    };

    await expect(
      service.generateDecision(context)
    ).rejects.toThrow();

    expect(context).toEqual(
      originalContext
    );
  });
});