import { describe, it, expect } from "vitest";
import {
  breachesR,
  enclosedR,
  gateB,
  granted,
  maskOf,
  decodeMask,
  sampleInterior,
  sampleInvalid,
  sampleValid,
} from "./residualGates";

describe("ResidualGates / enclosedR", () => {
  it("true when claimed ≤ interior componentwise", () => {
    expect(enclosedR(sampleInterior, sampleValid)).toBe(true);
  });

  it("false when any claimed exceeds interior", () => {
    expect(enclosedR(sampleInterior, sampleInvalid)).toBe(false);
  });

  it("false on length mismatch", () => {
    expect(enclosedR([1, 2], [1])).toBe(false);
  });
});

describe("ResidualGates / breachesR + maskOf", () => {
  it("finds indices 1 and 3 for sampleInvalid", () => {
    expect(breachesR(sampleInterior, sampleInvalid, 0)).toEqual([1, 3]);
  });

  it("maskOf([1,3]) === 10", () => {
    expect(maskOf([1, 3])).toBe(10);
  });
});

describe("ResidualGates / gateB samples (Lean)", () => {
  it("interior [100,50,25,10] + [98,49,25,9] → grant", () => {
    const d = gateB(sampleInterior, sampleValid);
    expect(d.status).toBe("grant");
    expect(d.mask).toBe(0);
    expect(d.failedIndices).toEqual([]);
    expect(granted(d)).toBe(true);
  });

  it("interior [100,50,25,10] + [98,51,25,11] → refuse mask 10", () => {
    const d = gateB(sampleInterior, sampleInvalid);
    expect(d.status).toBe("refuse");
    expect(d.mask).toBe(10);
    expect(d.failedIndices).toEqual([1, 3]);
    expect(granted(d)).toBe(false);
  });
});

describe("ResidualGates / decodeMask", () => {
  it("mask 0 names nothing", () => {
    expect(decodeMask(0)).toEqual([]);
  });

  it("mask 10 is lodging + misc — the live $1 email, the Lean sampleInvalid", () => {
    expect(decodeMask(10)).toEqual(["lodging", "misc"]);
    expect(decodeMask(gateB(sampleInterior, sampleInvalid).mask)).toEqual([
      "lodging",
      "misc",
    ]);
  });

  it("does not read mask 10 as fuel + meals (8-bit jacket is shifted)", () => {
    const jacket = [
      "Primary Residual (Gate A)",
      "Fuel Capacity",
      "Lodging/Thermal Headroom",
      "Meals/Resource Limit",
      "Misc/Payload",
      "Crew Bound (λ-Limit)",
      "Chronology/Sequence",
      "Provenance Integrity",
    ];
    const shifted = jacket.filter((_, i) => (10 & (1 << i)) !== 0);
    expect(shifted).toEqual(["Fuel Capacity", "Meals/Resource Limit"]);
    expect(decodeMask(10)).not.toEqual(["fuel", "meals"]);
    expect(decodeMask(10)).not.toEqual(shifted);
  });
});
