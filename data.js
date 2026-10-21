(function (root) {
  "use strict";

  const STATES = [
    { id: 0, name: "q0", label: "q0", x: 253, y: 360, group: "front", initial: true, final: false },
    { id: 1, name: "q1", label: "q1", x: 376, y: 360, group: "front", initial: false, final: false },
    { id: 2, name: "q2", label: "q2", x: 556, y: 279, group: "front", initial: false, final: false },
    { id: 3, name: "q3", label: "q3", x: 621, y: 156, group: "paas", initial: false, final: false },
    { id: 4, name: "q4", label: "q4", x: 744, y: 156, group: "paas", initial: false, final: false },
    { id: 5, name: "q5", label: "q5", x: 866, y: 156, group: "paas", initial: false, final: false },
    { id: 6, name: "q6", label: "q6", x: 989, y: 156, group: "paas", initial: false, final: false },
    { id: 7, name: "q7_PhishPaaS", label: "q7", verdict: "PhishPaaS", x: 1137, y: 156, group: "paas", initial: false, final: true },
    { id: 8, name: "q8", label: "q8", x: 621, y: 360, group: "brand", initial: false, final: false },
    { id: 9, name: "q9", label: "q9", x: 744, y: 360, group: "brand", initial: false, final: false },
    { id: 10, name: "q10", label: "q10", x: 866, y: 360, group: "brand", initial: false, final: false },
    { id: 11, name: "q11", label: "q11", x: 989, y: 360, group: "brand", initial: false, final: false },
    { id: 12, name: "q12_PhishBrand", label: "q12", verdict: "PhishBrand", x: 1137, y: 360, group: "brand", initial: false, final: true },
    { id: 13, name: "q13", label: "q13", x: 621, y: 483, group: "malware", initial: false, final: false },
    { id: 14, name: "q14", label: "q14", x: 744, y: 483, group: "malware", initial: false, final: false },
    { id: 15, name: "q15", label: "q15", x: 866, y: 483, group: "malware", initial: false, final: false },
    { id: 16, name: "q16", label: "q16", x: 989, y: 483, group: "malware", initial: false, final: false },
    { id: 17, name: "q17_PhishMalware", label: "q17", verdict: "PhishMalware", x: 1137, y: 483, group: "malware", initial: false, final: true },
    { id: 18, name: "q18", label: "q18", x: 515, y: 532, group: "benign", initial: false, final: false },
    { id: 19, name: "q19_BenignPass", label: "q19", verdict: "BenignPass", x: 384, y: 589, group: "benign", initial: false, final: true },
    { id: 20, name: "q20_Malformed", label: "q20", verdict: "Malformed", x: 253, y: 548, group: "error", initial: false, final: false },
    { id: 21, name: "q21_Trap", label: "q21", verdict: "Trap", x: 253, y: 663, group: "error", initial: false, final: false }
  ];

  // Each tuple is [from, to, symbol]; tuple order is used by the transition readings.
  const TRANSITIONS = [
    [0, 1, "S"], [1, 3, "P"], [1, 8, "G"], [1, 2, "H"], [2, 3, "P"], [2, 8, "G"],
    [3, 4, "B"], [4, 5, "A"], [5, 6, "Y"], [6, 7, "X"],
    [8, 9, "B"], [9, 10, "A"], [10, 11, "Q"], [11, 12, "X"],
    [8, 13, "U"], [13, 14, "E"], [14, 15, "R"], [15, 16, "X"], [16, 17, "X"],
    [8, 18, "N"], [18, 19, "X"],
    [0, 20, "Z"], [1, 20, "Z"], [20, 21, "Z"], [21, 21, "Z"]
  ];

  const ALPHABET = ["S", "P", "G", "H", "B", "A", "Y", "Q", "U", "E", "R", "N", "X", "Z"];
  const FINALS = [7, 12, 17, 19];
  const START = 0;
  const DELTA = Object.create(null);

  for (const [from, to, symbol] of TRANSITIONS) {
    DELTA[`${from}:${symbol}`] = to;
  }

  const GROUPS = {
    front: { name: "Main pipeline", stroke: "#2563eb", fill: "#dbeafe", text: "blue" },
    paas: { name: "Branch 1: PaaS brand impersonation", stroke: "#dc2626", fill: "#fee2e2", text: "red" },
    brand: { name: "Branch 2: brand mismatch on generic host", stroke: "#ea580c", fill: "#ffedd5", text: "orange" },
    malware: { name: "Branch 3: urgency / malware lure", stroke: "#7c3aed", fill: "#ede9fe", text: "purple" },
    benign: { name: "Branch 4: benign", stroke: "#16a34a", fill: "#dcfce7", text: "green" },
    error: { name: "Error / trap path", stroke: "#6b7280", fill: "#f3f4f6", text: "grey" }
  };

  const SYMBOL_MEANINGS = {
    S: { name: "Scheme", meaning: "URL starts with a valid scheme (http / https). Parsing succeeded.", usedOn: [0] },
    P: { name: "PaaS host", meaning: "Host is a hosting-platform subdomain such as vercel.app, netlify.app, github.io.", usedOn: [1, 2] },
    G: { name: "Generic host", meaning: "Any other ordinary domain.", usedOn: [1, 2] },
    H: { name: "Host inspection", meaning: "Optional extra host check token (for example an abnormal subdomain). Allowed once, between S and P/G.", usedOn: [1] },
    B: { name: "Brand-like token", meaning: "A well-known brand name or lookalike appears.", usedOn: [3, 8] },
    A: { name: "Action token", meaning: "A credential or verification action (login, verify, secure, account).", usedOn: [4, 9] },
    Y: { name: "PaaS confirmation", meaning: "Final risk cue on the PaaS path: the configured combination of signals is satisfied.", usedOn: [5] },
    Q: { name: "Brand mismatch", meaning: "Confirms the brand word is not on the brand's real domain.", usedOn: [10] },
    U: { name: "Urgency cue", meaning: "Pressure wording (urgent, suspended, immediately).", usedOn: [8] },
    E: { name: "Download lure", meaning: "Executable or download enticement token.", usedOn: [13] },
    R: { name: "Payload / redirect cue", meaning: "Redirect or payload-delivery cue completing the lure.", usedOn: [14] },
    N: { name: "Neutral token", meaning: "Ordinary path content with no risky pattern.", usedOn: [8] },
    X: { name: "End marker", meaning: "Terminator: end of URL / end of the pattern.", usedOn: [6, 11, 15, 16, 18] },
    Z: { name: "Malformed token", meaning: "Unparseable or invalid piece; sends the run to the error path.", usedOn: [0, 1, 20, 21] }
  };

  const STATE_CARDS = {
    0: {
      role: "initial state",
      meaning: "Nothing has been read yet. The machine is waiting for the scheme token.",
      reachedBy: "Start of every run (start arrow).",
      outgoing: ["S → q1 (scheme read)", "Z → q20 (malformed from the very start)"],
      anythingElse: "Reject. A string must begin with S, so something like G… is rejected immediately.",
      tags: ["START"]
    },
    1: {
      role: "scheme accepted",
      meaning: "The scheme has been read. This is the first decision hub: the next symbol says what kind of host this is.",
      reachedBy: "q0 on S.",
      outgoing: ["P → q3 (PaaS host)", "G → q8 (generic host)", "H → q2 (inspect host first)", "Z → q20"],
      anythingElse: "Reject. A second S or any path/brand symbol directly after the scheme is invalid.",
      note: "Only state with four exits. It is where the DFA commits to a branch."
    },
    2: {
      role: "optional host check",
      meaning: "A host-inspection token has been read. It adds one optional step and then rejoins the normal flow.",
      reachedBy: "q1 on H only.",
      outgoing: ["P → q3", "G → q8"],
      anythingElse: "Reject. A second H is not allowed (SHHGNX is rejected at q2).",
      note: "Placed inside the q1-q3-q8 triangle so no arrow crosses another state. With or without H, the same four patterns are accepted, which is why exactly 8 strings are in the language (4 patterns × 2)."
    },
    3: {
      role: "PaaS host seen",
      meaning: "The host is a hosting-platform subdomain. The DFA now expects a brand-like word.",
      reachedBy: "q1 or q2 on P.",
      outgoing: ["B → q4"],
      anythingElse: "Reject (for example SPAYX: action before brand)."
    },
    4: {
      role: "brand on PaaS",
      meaning: "A brand-like token has appeared on a platform host: the first real suspicion signal.",
      reachedBy: "q3 on B.",
      outgoing: ["A → q5"],
      anythingElse: "Reject."
    },
    5: {
      role: "action after brand",
      meaning: "Brand plus credential/verify action: the core phishing pattern (the proposal's “pattern recognised” idea).",
      reachedBy: "q4 on A.",
      outgoing: ["Y → q6"],
      anythingElse: "Reject."
    },
    6: {
      role: "awaiting end",
      meaning: "Pattern is complete; the machine waits for the end marker so it knows nothing else follows.",
      reachedBy: "q5 on Y.",
      outgoing: ["X → q7"],
      anythingElse: "Reject. For example SPBAY stops here without X, so it is rejected even though it looks suspicious.",
      note: "Not accepting by itself. Requiring X means the whole URL must be consumed."
    },
    7: {
      role: "PhishPaaS verdict state",
      meaning: "Verdict: PhishPaaS. A brand-impersonation pattern on a PaaS host was recognised in the exact order.",
      reachedBy: "q6 on X.",
      outgoing: [],
      anythingElse: "Reject. Any extra symbol after q7 is rejected, so the pattern must match the whole input.",
      note: "The proposal would call this the escalation state (“escalate for verification”), not proof of malice.",
      tags: ["ACCEPTING"]
    },
    8: {
      role: "generic host seen",
      meaning: "The host is an ordinary domain. This is the second hub: the next token chooses brand, urgency or neutral.",
      reachedBy: "q1 or q2 on G.",
      outgoing: ["B → q9 (brand)", "U → q13 (urgency)", "N → q18 (neutral)"],
      anythingElse: "Reject.",
      note: "Three exits, one per remaining branch. q8 is where the generic path becomes three different stories."
    },
    9: {
      role: "brand on generic host",
      meaning: "A brand-like word on a normal domain, which may not be the brand's own site.",
      reachedBy: "q8 on B.",
      outgoing: ["A → q10"],
      anythingElse: "Reject."
    },
    10: {
      role: "action after brand",
      meaning: "Brand plus credential action, waiting for the mismatch confirmation.",
      reachedBy: "q9 on A.",
      outgoing: ["Q → q11"],
      anythingElse: "Reject. SGBAX dies here: no mismatch confirmation, so it is not flagged.",
      note: "Shows that the DFA needs the full chain, not just a brand and an action."
    },
    11: {
      role: "awaiting end",
      meaning: "Mismatch confirmed; waiting for the end marker.",
      reachedBy: "q10 on Q.",
      outgoing: ["X → q12"],
      anythingElse: "Reject."
    },
    12: {
      role: "PhishBrand verdict state",
      meaning: "Verdict: PhishBrand. Brand word and action on a host that does not belong to the brand.",
      reachedBy: "q11 on X.",
      outgoing: [],
      anythingElse: "Reject (any extra symbol).",
      tags: ["ACCEPTING"]
    },
    13: {
      role: "urgency seen",
      meaning: "Pressure wording found on a generic host.",
      reachedBy: "q8 on U.",
      outgoing: ["E → q14"],
      anythingElse: "Reject."
    },
    14: {
      role: "lure seen",
      meaning: "A download / executable enticement follows the urgency.",
      reachedBy: "q13 on E.",
      outgoing: ["R → q15"],
      anythingElse: "Reject."
    },
    15: {
      role: "payload cue",
      meaning: "Payload or redirect cue completes the lure sequence.",
      reachedBy: "q14 on R.",
      outgoing: ["X → q16"],
      anythingElse: "Reject."
    },
    16: {
      role: "first terminator",
      meaning: "First terminator read; one more is required.",
      reachedBy: "q15 on X.",
      outgoing: ["X → q17"],
      anythingElse: "Reject. SGUERX (only one X) stops here and is rejected.",
      note: "This is the only branch that reads X twice. Be ready to say why (see viva question 9)."
    },
    17: {
      role: "PhishMalware verdict state",
      meaning: "Verdict: PhishMalware. Urgency, lure and payload cue in the exact order.",
      reachedBy: "q16 on X.",
      outgoing: [],
      anythingElse: "Reject (any extra symbol).",
      tags: ["ACCEPTING"]
    },
    18: {
      role: "neutral content",
      meaning: "Ordinary content on a generic host; none of the risky tokens appeared.",
      reachedBy: "q8 on N.",
      outgoing: ["X → q19"],
      anythingElse: "Reject. SGN without X ends here and is rejected."
    },
    19: {
      role: "BenignPass verdict state",
      meaning: "Verdict: BenignPass.",
      reachedBy: "q18 on X.",
      outgoing: [],
      anythingElse: "Reject (any extra symbol; SGNXS is rejected).",
      note: "This is an accepting state that means benign. In this machine, accepting = “a definite verdict was reached”, and the state name carries the meaning. It does not mean “phishing”.",
      tags: ["ACCEPTING"]
    },
    20: {
      role: "Malformed",
      meaning: "A malformed token has been read, either as the first symbol or right after the scheme.",
      reachedBy: "q0 on Z or q1 on Z.",
      outgoing: ["Z → q21"],
      anythingElse: "Reject.",
      note: "Not accepting. Strings that reach here can never be accepted."
    },
    21: {
      role: "Trap",
      meaning: "Absorbing state: once here, nothing can lead back to an accepting state.",
      reachedBy: "q20 on Z; itself on Z.",
      outgoing: ["Z → q21 (self-loop)"],
      anythingElse: "Reject.",
      note: "Not a fully drawn dead state: only Z loops. Every other symbol is an implicit reject, which has the same effect (see section 9).",
      tags: ["TRAP"]
    }
  };

  const TRANSITION_READINGS = [
    "Valid scheme read: URL parsing begins.",
    "Host is a PaaS platform: go to the PaaS branch.",
    "Host is a generic domain: go to the generic branch.",
    "Optional host-inspection token first.",
    "After inspection, host turned out to be PaaS.",
    "After inspection, host turned out to be generic.",
    "Brand-like word seen on the PaaS host.",
    "Credential/verify action follows the brand.",
    "Confirming cue: pattern complete.",
    "End of URL: verdict PhishPaaS.",
    "Brand-like word on a generic host.",
    "Credential/verify action follows.",
    "Brand mismatch confirmed.",
    "End of URL: verdict PhishBrand.",
    "Urgency cue on a generic host.",
    "Download/executable lure follows.",
    "Payload / redirect cue follows.",
    "First terminator read.",
    "Second terminator read: verdict PhishMalware.",
    "Neutral path content on a generic host.",
    "End of URL: verdict BenignPass.",
    "Malformed token as the very first thing.",
    "Malformed token right after the scheme.",
    "Second malformed token: fall into the trap.",
    "Trap absorbs any further Z."
  ];

  // The array index is the zero-based transition index in TRANSITIONS.
  const EDGE_READINGS = Object.fromEntries(
    TRANSITION_READINGS.map((reading, index) => [index, reading])
  );

  function run(delta, finals, s, start = 0) {
    if (typeof s !== "string") {
      throw new TypeError("Input must be a string.");
    }

    const finalStates = finals instanceof Set ? finals : new Set(finals);
    let state = start;
    const trace = [start];

    for (const symbol of s) {
      const key = `${state}:${symbol}`;
      const nextState = delta instanceof Map ? delta.get(key) : delta[key];

      if (nextState === undefined) {
        return {
          accepted: false,
          trace,
          stoppedAt: state,
          reason: `no arrow from ${stateName(state)} on ${symbol}`
        };
      }

      state = nextState;
      trace.push(state);
    }

    if (!finalStates.has(state)) {
      return {
        accepted: false,
        trace,
        stoppedAt: state,
        reason: `symbols ran out in ${stateName(state)}, which is not accepting`
      };
    }

    return { accepted: true, trace, stoppedAt: state, reason: null };
  }

  function stateName(stateId) {
    const state = STATES[stateId];
    return state ? state.label : `q${stateId}`;
  }

  const TEST_CASES = [
    { input: "SPBAYX", accepted: true, trace: [0, 1, 3, 4, 5, 6, 7], verdict: "PhishPaaS" },
    { input: "SHPBAYX", accepted: true, trace: [0, 1, 2, 3, 4, 5, 6, 7], verdict: "PhishPaaS" },
    { input: "SGBAQX", accepted: true, trace: [0, 1, 8, 9, 10, 11, 12], verdict: "PhishBrand" },
    { input: "SGUERXX", accepted: true, trace: [0, 1, 8, 13, 14, 15, 16, 17], verdict: "PhishMalware" },
    { input: "SGNX", accepted: true, trace: [0, 1, 8, 18, 19], verdict: "BenignPass" },
    { input: "SHGNX", accepted: true, trace: [0, 1, 2, 8, 18, 19], verdict: "BenignPass" },
    { input: "SGBAX", accepted: false, trace: [0, 1, 8, 9, 10], reason: "no arrow from q10 on X" },
    { input: "SGN", accepted: false, trace: [0, 1, 8, 18], reason: "symbols ran out in q18, which is not accepting" },
    { input: "SPBAY", accepted: false, trace: [0, 1, 3, 4, 5, 6], reason: "symbols ran out in q6, which is not accepting" },
    { input: "SGUERX", accepted: false, trace: [0, 1, 8, 13, 14, 15, 16], reason: "symbols ran out in q16, which is not accepting" },
    { input: "SGNXS", accepted: false, trace: [0, 1, 8, 18, 19], reason: "no arrow from q19 on S" },
    { input: "GBAQX", accepted: false, trace: [0], reason: "no arrow from q0 on G" },
    { input: "SHHGNX", accepted: false, trace: [0, 1, 2], reason: "no arrow from q2 on H" },
    { input: "Z", accepted: false, trace: [0, 20], reason: "symbols ran out in q20, which is not accepting" },
    { input: "SZ", accepted: false, trace: [0, 1, 20], reason: "symbols ran out in q20, which is not accepting" },
    { input: "SZZZ", accepted: false, trace: [0, 1, 20, 21, 21], reason: "symbols ran out in q21, which is not accepting" }
  ];

  const ACCEPTED_STRINGS = [
    { input: "SPBAYX", trace: [0, 1, 3, 4, 5, 6, 7], verdict: "PhishPaaS" },
    { input: "SHPBAYX", trace: [0, 1, 2, 3, 4, 5, 6, 7], verdict: "PhishPaaS" },
    { input: "SGBAQX", trace: [0, 1, 8, 9, 10, 11, 12], verdict: "PhishBrand" },
    { input: "SHGBAQX", trace: [0, 1, 2, 8, 9, 10, 11, 12], verdict: "PhishBrand" },
    { input: "SGUERXX", trace: [0, 1, 8, 13, 14, 15, 16, 17], verdict: "PhishMalware" },
    { input: "SHGUERXX", trace: [0, 1, 2, 8, 13, 14, 15, 16, 17], verdict: "PhishMalware" },
    { input: "SGNX", trace: [0, 1, 8, 18, 19], verdict: "BenignPass" },
    { input: "SHGNX", trace: [0, 1, 2, 8, 18, 19], verdict: "BenignPass" }
  ];

  const api = {
    STATES,
    TRANSITIONS,
    ALPHABET,
    FINALS,
    START,
    DELTA,
    GROUPS,
    SYMBOL_MEANINGS,
    STATE_CARDS,
    EDGE_READINGS,
    TEST_CASES,
    ACCEPTED_STRINGS,
    run
  };

  root.PHISHING_DFA = api;
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})(globalThis);
