import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateRms,
  classifyDuration,
  classifyNoise,
  estimateSnr,
} from "./audio-quality.ts";

test("calculateRms returns the root mean square for audio samples", () => {
  assert.equal(calculateRms([0, 0, 0, 0]), 0);
  assert.equal(calculateRms([1, -1, 1, -1]), 1);
  assert.ok(Math.abs(calculateRms([0.5, -0.5]) - 0.5) < 0.000001);
});

test("classifyDuration marks clips below the useful duration as too short", () => {
  assert.equal(classifyDuration(699, 700).isTooShort, true);
  assert.equal(classifyDuration(700, 700).isTooShort, false);
  assert.equal(classifyDuration(1200, 700).isTooShort, false);
});

test("classifyNoise accepts speech that is clearly above the noise floor", () => {
  const quality = classifyNoise({
    speechLevel: 0.08,
    noiseFloor: 0.01,
    durationMs: 1500,
  });

  assert.equal(quality.isTooNoisy, false);
  assert.equal(quality.isTooShort, false);
  assert.ok(quality.snr > 7);
});

test("classifyNoise rejects weak speech in a loud environment", () => {
  const quality = classifyNoise({
    speechLevel: 0.03,
    noiseFloor: 0.025,
    durationMs: 1500,
  });

  assert.equal(quality.isTooNoisy, true);
  assert.ok(estimateSnr(0.03, 0.025) < 7);
});
