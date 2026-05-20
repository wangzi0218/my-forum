import { describe, it, expect } from "vitest";
import { SCENARIOS, getScenario, DEFAULT_SCENARIO } from "../registry";

describe("SCENARIOS", () => {
  it("contains at least 2 scenarios", () => {
    expect(SCENARIOS.length).toBeGreaterThanOrEqual(2);
  });

  it("each scenario has required fields", () => {
    for (const scenario of SCENARIOS) {
      expect(scenario.id).toBeTruthy();
      expect(scenario.name).toBeTruthy();
      expect(scenario.description).toBeTruthy();
      expect(scenario.characters.length).toBeGreaterThan(0);
      expect(scenario.speakingOrder.length).toBeGreaterThan(0);
      expect(typeof scenario.speakingDelay).toBe("object");
      expect(typeof scenario.fallbackResponses).toBe("object");
    }
  });

  it("speakingOrder references valid character IDs", () => {
    for (const scenario of SCENARIOS) {
      const characterIds = scenario.characters.map((c) => c.id);
      for (const orderId of scenario.speakingOrder) {
        expect(characterIds).toContain(orderId);
      }
    }
  });
});

describe("getScenario", () => {
  it("returns scenario by ID", () => {
    const pm = getScenario("pm-discussion");
    expect(pm).toBeDefined();
    expect(pm!.name).toBe("PM 讨论");
  });

  it("returns engineering review scenario", () => {
    const eng = getScenario("engineering-review");
    expect(eng).toBeDefined();
    expect(eng!.name).toBe("工程评审");
  });

  it("returns undefined for unknown ID", () => {
    expect(getScenario("nonexistent")).toBeUndefined();
  });
});

describe("DEFAULT_SCENARIO", () => {
  it("is the PM discussion scenario", () => {
    expect(DEFAULT_SCENARIO.id).toBe("pm-discussion");
  });
});
