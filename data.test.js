"use strict";

const assert = require("node:assert/strict");
const {
  ALPHABET,
  DELTA,
  FINALS,
  START,
  STATES,
  ACCEPTED_STRINGS,
  TEST_CASES,
  TRANSITIONS,
  run
} = require("./data.js");

assert.equal(STATES.length, 22, "DFA must have 22 states");
assert.equal(ALPHABET.length, 14, "DFA must have 14 input symbols");
assert.equal(TRANSITIONS.length, 25, "DFA must have 25 transitions");
assert.equal(FINALS.length, 4, "DFA must have four accepting states");
assert.equal(TEST_CASES.length, 16, "All 16 specified test strings must be covered");
assert.equal(ACCEPTED_STRINGS.length, 8, "All eight strings in the DFA language must be listed");

const transitionKeys = TRANSITIONS.map(([from, , symbol]) => `${from}:${symbol}`);
assert.equal(new Set(transitionKeys).size, TRANSITIONS.length, "Transitions must be deterministic");

for (const testCase of TEST_CASES) {
  const actual = run(DELTA, FINALS, testCase.input, START);

  assert.equal(actual.accepted, testCase.accepted, `${testCase.input}: acceptance`);
  assert.deepEqual(actual.trace, testCase.trace, `${testCase.input}: state path`);

  if (testCase.accepted) {
    assert.equal(actual.stoppedAt, actual.trace[actual.trace.length - 1], `${testCase.input}: final state`);
    assert.equal(STATES[actual.stoppedAt].verdict, testCase.verdict, `${testCase.input}: verdict`);
    assert.equal(actual.reason, null, `${testCase.input}: accepted runs have no rejection reason`);
  } else {
    assert.equal(actual.reason, testCase.reason, `${testCase.input}: rejection reason`);
    assert.equal(actual.stoppedAt, actual.trace[actual.trace.length - 1], `${testCase.input}: stop state`);
  }
}

for (const testCase of ACCEPTED_STRINGS) {
  const actual = run(DELTA, FINALS, testCase.input, START);
  assert.equal(actual.accepted, true, `${testCase.input}: accepted language`);
  assert.deepEqual(actual.trace, testCase.trace, `${testCase.input}: accepted path`);
  assert.equal(STATES[actual.stoppedAt].verdict, testCase.verdict, `${testCase.input}: accepted verdict`);
}

console.log(`DFA tests passed: ${TEST_CASES.length}/${TEST_CASES.length} strings match expected results and paths.`);
