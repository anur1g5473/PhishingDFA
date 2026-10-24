(function () {
  "use strict";

  const D = window.PHISHING_DFA;
  if (!D) {
    throw new Error("DFA data did not load. Keep data.js before app.js in index.html.");
  }

  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
  const esc = (value) => String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char]);
  const state = (id) => D.STATES[id];
  const qname = (id) => state(id)?.label || `q${id}`;
  const stateTitle = (id) => state(id)?.verdict ? `${qname(id)} ${state(id).verdict}` : qname(id);
  const edgeIndex = (from, to, symbol) => D.TRANSITIONS.findIndex(
    (entry) => entry[0] === from && entry[1] === to && entry[2] === symbol
  );
  const navSections = [
    "The one-minute explanation",
    "How the system works",
    "Formal definition",
    "The complete DFA diagram",
    "Transition table and matrix",
    "State-by-state details",
    "The language the DFA accepts",
    "Worked traces",
    "Theory points",
    "Implementation details",
    "Viva questions and answers",
    "Last-minute cheat sheet"
  ];
  const nav = $("#section-nav");
  const app = $("#app");
  nav.innerHTML = navSections.map((title, index) =>
    `<a class="nav-link" href="#section-${index + 1}" data-section-link="${index + 1}">${index + 1}. ${esc(title)}</a>`
  ).join("");

  const acceptedRows = [
    ["q7 PhishPaaS", "A brand-like word plus a login/verify action on a free hosting-platform subdomain (the secure-brand-login.vercel.app style).", "S [H] P B A Y X", 7],
    ["q12 PhishBrand", "A brand word plus an action on an ordinary host that is not the brand's own domain: brand mismatch.", "S [H] G B A Q X", 12],
    ["q17 PhishMalware", "Urgency wording followed by a download/payload lure.", "S [H] G U E R X X", 17],
    ["q19 BenignPass", "Ordinary host with a neutral path and none of the risky sequences.", "S [H] G N X", 19]
  ];
  const urlTestLinks = [
    ["PaaS brand pattern", "https://secure-brand-login.vercel.app/verify-account"],
    ["PaaS with PayPal token", "https://paypal-login.netlify.app/confirm"],
    ["PaaS Google verification", "https://google-login.pages.dev/validate"],
    ["PaaS Apple security cue", "https://apple-secure.github.io/recover"],
    ["PaaS missing confirmation", "https://brand-login.vercel.app/account"],
    ["Generic PayPal mismatch", "https://paypal-login.example.com/verify"],
    ["Generic Amazon mismatch", "https://amazon-secure.example.net/account"],
    ["Generic Google mismatch", "https://accounts.example.org/google/verify"],
    ["Brand without action", "https://paypal.example.com/"],
    ["Action without brand", "https://example.com/login"],
    ["Urgency and download lure", "https://example.com/urgent-download-payload"],
    ["Urgency without download", "https://example.com/urgent-alert"],
    ["Download without payload", "https://example.com/urgent-download"],
    ["Payload without urgency", "https://example.com/download-payload"],
    ["Ordinary neutral path", "https://example.com/home"],
    ["Neutral path with query", "https://example.org/help?topic=general"],
    ["Inspected generic host", "https://news.portal.example.com/home"],
    ["Inspected PaaS host", "https://secure.brand-login.vercel.app/verify-account"],
    ["Malformed URL", "http://["],
    ["Missing URL scheme", "example.com/login"]
  ];

  const alphabetOrder = D.ALPHABET;
  const getGroup = (group) => D.GROUPS[group] || D.GROUPS.front;
  const tintStyle = (group) => {
    const colors = getGroup(group);
    return `--branch:${colors.stroke};--tint:${colors.fill};--branch-text:${colors.stroke}`;
  };

  const sectionContents = `
    <div class="stats" aria-label="DFA summary">
      <div class="stat"><strong>22</strong><span>states</span></div>
      <div class="stat"><strong>14</strong><span>input symbols</span></div>
      <div class="stat"><strong>25</strong><span>transitions</span></div>
      <div class="stat"><strong>4</strong><span>accepting states</span></div>
      <div class="stat"><strong>8</strong><span>strings accepted</span></div>
    </div>
    <div class="intro-box">
      <p><strong>What this document is.</strong> A single place to learn and explain the DFA you built. Every number, transition, trace and table in it comes from the machine data in <code>data.js</code>, so the guide cannot drift from the automaton. Start with the one-minute explanation, then use the state-by-state section when someone points at a circle on the screen and asks “what is this state?”</p>
      <p class="contents-line"><strong>Contents.</strong> ${navSections.map((title, index) => `<a href="#section-${index + 1}">${index + 1} ${esc(title)}</a>`).join("")}</p>
    </div>

    <section class="section-card" id="section-1">
      <h2>1. The one-minute explanation</h2>
      <div class="callout"><strong class="callout-title">Say this first</strong>Our project applies Models of Computation to phishing-link detection. We break a URL into tokens (scheme, host type, brand-like word, login/verify action, urgency cue, and so on). Each token class is one letter of a 14-symbol alphabet, so a URL becomes a short string such as <code>SPBAYX</code>. A Deterministic Finite Automaton with 22 states reads that string left to right, one symbol per step, with exactly one possible move each time. If it finishes in one of four accepting states it has reached a verdict: <em>PhishPaaS</em>, <em>PhishBrand</em>, <em>PhishMalware</em> or <em>BenignPass</em>. The path it took is the explanation. We implemented and tested it in this interactive study guide.</div>
      <h3>The four things the DFA can conclude</h3>
      <div class="table-wrap"><table class="data-table">
        <thead><tr><th>Verdict state</th><th>Plain-English meaning</th><th>Accepted pattern (symbols)</th></tr></thead>
        <tbody>${acceptedRows.map(([verdict, meaning, pattern, id]) => `<tr class="verdict-jump" data-state-jump="${id}" tabindex="0" role="button"><td>${esc(verdict)}</td><td>${esc(meaning)}</td><td class="mono">${esc(pattern)}</td></tr>`).join("")}</tbody>
      </table></div>
      <p class="small-note"><code>[H]</code> means the optional host-inspection symbol: it may appear once or not at all. Select a row to highlight its state in the diagram.</p>
      <div class="callout amber"><strong class="callout-title">Be upfront about this</strong>Our professor's proposal says automata give pattern recognition, not proof that a site is malicious. A match is an indicator. The DFA looks only at the URL text, so it can produce false positives and miss URLs that do not contain the expected tokens. Saying this yourself first is much stronger than being asked.</div>
      <h3>Why a DFA and not just if-statements?</h3>
      <ul class="tight-list">
        <li><strong>Order matters.</strong> “brand then action” is different from “action then brand”. A state remembers what has already been seen, which a flat keyword list cannot do.</li>
        <li><strong>Deterministic.</strong> Same input always gives the same path. No guessing, no backtracking.</li>
        <li><strong>Linear time.</strong> One table lookup per token: time O(n), memory O(1).</li>
        <li><strong>Explainable.</strong> The state trace (q0 → q1 → q3 → …) shows exactly why a URL was flagged.</li>
        <li><strong>Formal.</strong> It can be tested, minimised, described by a regular expression and compared with an NFA.</li>
      </ul>
    </section>

    <section class="section-card" id="section-2">
      <h2>2. How the system works end to end</h2>
      <div class="pipeline" id="live-pipeline">
        <div class="pipeline-step"><strong>URL</strong><small data-live-url>https://secure-brand-login.vercel.app/verify-account</small></div>
        <div class="pipeline-step"><strong>Normalise and parse</strong><small>scheme, host labels, path terms</small></div>
        <div class="pipeline-step"><strong>Tokenise</strong><small>each part becomes one token class</small></div>
        <div class="pipeline-step"><strong>Symbol string</strong><small class="mono" data-live-symbols>S P B A Y X</small></div>
        <div class="pipeline-step"><strong>DFA run</strong><small>one move per symbol</small></div>
        <div class="pipeline-step"><strong>Verdict</strong><small data-live-verdict>accepting state or reject</small></div>
      </div>
      <p>Left to right: the DFA is the fifth box. Everything before it is preparation; everything after it is just reading the final state.</p>
      <h3>Illustrative tokenisation</h3>
      <p>The example URL below comes from the proposal document. The mapping is illustrative: it shows the idea, not a claim that the URL is malicious.</p>
      <div class="table-wrap"><table class="token-table">
        <thead><tr><th>URL piece</th><th>Token class (symbol)</th><th>Meaning</th></tr></thead>
        <tbody data-live-token-rows>
          <tr><td>https://</td><td><strong>S</strong></td><td>scheme parsed (URL_PARSED)</td></tr>
          <tr><td>*.vercel.app</td><td><strong>P</strong></td><td>PaaS / hosting-platform host (PLATFORM_HOST)</td></tr>
          <tr><td>brand</td><td><strong>B</strong></td><td>brand-like token (BRAND_LIKE_TOKEN)</td></tr>
          <tr><td>login</td><td><strong>A</strong></td><td>credential / verify action (VERIFY_ACTION)</td></tr>
          <tr><td>verify-account</td><td><strong>Y</strong></td><td>confirming cue: the risk condition is satisfied</td></tr>
          <tr><td>end of URL</td><td><strong>X</strong></td><td>terminator: nothing more to read</td></tr>
        </tbody>
      </table></div>
      <p data-live-result><strong>Result:</strong> SPBAYX drives the DFA along q0 → q1 → q3 → q4 → q5 → q6 → q7_PhishPaaS, an accepting state, so the verdict is PhishPaaS. This is exactly the proposal's path URL_PARSED → PLATFORM_HOST → BRAND_LIKE_TOKEN → VERIFY_ACTION, extended with a confirmation symbol and an end marker.</p>
      <button class="btn primary" type="button" data-load-example>Run this in the simulator</button>
      <h3>Where this sits in the proposal's four-layer method</h3>
      <div class="table-wrap"><table><thead><tr><th>Layer</th><th>Role</th><th>In our DFA?</th></tr></thead>
        <tbody>
          <tr><td>A: URL lexical / semantic</td><td>DFA, NFA and regex over URL tokens</td><td><strong>Yes: this is what we built</strong></td></tr>
          <tr><td>B: Hosting / infrastructure</td><td>domain age, hosting class, DNS/certificate</td><td>Only the host class (P vs G) is encoded</td></tr>
          <tr><td>C: Page / code</td><td>HTML/JS inspection</td><td>No (optional extension)</td></tr>
          <tr><td>D: Behaviour / delivery</td><td>redirects and delivery events as a state workflow</td><td>No (optional extension)</td></tr>
        </tbody></table></div>
      <div class="callout amber"><strong class="callout-title">Honest scope</strong>Our DFA is a Layer A recogniser. Layers B to D need external data (WHOIS, page fetches, redirect telemetry) and are outside a basic MoC prototype. If asked “does it really detect phishing?”, the correct answer is: it recognises suspicious token sequences in the URL, and those matches are signals for a wider risk assessment.</div>
    </section>

    <section class="section-card" id="section-3">
      <h2>3. Formal definition</h2>
      <p>A DFA is a 5-tuple <span class="mono">M = (Q, Σ, δ, q0, F)</span>.</p>
      <div class="table-wrap"><table>
        <thead><tr><th>Part</th><th>Our value</th></tr></thead>
        <tbody>
          <tr><td>Q (states)</td><td>{ q0, q1, q2, …, q19, q20, q21 }: 22 states. Four carry names: q7_PhishPaaS, q12_PhishBrand, q17_PhishMalware, q19_BenignPass; q20_Malformed and q21_Trap name the error path.</td></tr>
          <tr><td>Σ (alphabet)</td><td class="mono">{ S, P, G, H, B, A, Y, X, Q, U, E, R, N, Z }: 14 symbols, each a token class.</td></tr>
          <tr><td>δ (transition function)</td><td>Partial function δ : Q × Σ → Q with 25 defined entries (listed in section 5). Undefined entries mean reject.</td></tr>
          <tr><td>q0 (start)</td><td>q0, marked with the start arrow.</td></tr>
          <tr><td>F (accepting)</td><td>{ q7_PhishPaaS, q12_PhishBrand, q17_PhishMalware, q19_BenignPass }</td></tr>
        </tbody>
      </table></div>
      <h3>Alphabet table (Σ in detail)</h3>
      <p>Each symbol is a colour-coded chip; select a chip to highlight every transition that uses it in the diagram.</p>
      <div class="table-wrap"><table class="data-table"><thead><tr><th>Sym</th><th>Name</th><th>Meaning as used in our design</th><th>Used on</th></tr></thead>
        <tbody>${alphabetOrder.map((symbol) => {
          const item = D.SYMBOL_MEANINGS[symbol];
          const groups = [...new Set(item.usedOn.map((from) => {
            const transition = D.TRANSITIONS.find(([source, , label]) => source === from && label === symbol);
            return transition ? state(transition[1]).group : "front";
          }))];
          const group = groups[0] || "front";
          return `<tr><td><button class="symbol-chip" type="button" style="${tintStyle(group)}" data-symbol-highlight="${symbol}">${symbol}</button></td><td>${esc(item.name)}</td><td>${esc(item.meaning)}</td><td>${item.usedOn.map((id) => qname(id)).join(", ")}</td></tr>`;
        }).join("")}</tbody>
      </table></div>
      <div class="callout amber"><strong class="callout-title">Check this table with your teammates</strong>The structure (which symbol goes where) comes straight from the code. The wording of what Y, Q, E, R and the second X stand for is my reading of the code comments and the proposal document, because the generator uses only the letters. If your team defined them differently, say so in the viva and use your definitions: the DFA itself does not change.</div>
      <p>Each symbol is one character, so any test string is easy to type (for example <code>SGBAQX</code>) and each token class has a short label on the arrow.</p>
    </section>

    <section class="section-card" id="section-4">
      <h2>4. The complete DFA diagram <span class="small-note">(the centrepiece)</span></h2>
      <p>Explore every state and transition. Hover for an explanation, select a state for its full card, or right-click a state for more actions. Use the wheel to zoom and drag to pan.</p>
      <div class="diagram-toolbar">
        <button class="btn" id="reset-view" type="button">Reset view</button>
        <label class="btn"><input type="checkbox" id="complete-toggle"> Complete the DFA (show implicit rejects)</label>
        <label class="btn"><input type="checkbox" id="classes-toggle"> Show equivalence classes</label>
        <span id="completion-note" class="small-note" hidden>Completing it changes nothing about which strings are accepted; it only draws what was implicit.</span>
      </div>
      <div class="diagram-panel" id="diagram-panel">
        <div class="diagram-scroll"><div class="diagram-frame" id="diagram-frame"><svg id="dfa-svg" viewBox="0 0 1300 760" role="img" aria-label="Interactive diagram of a 22-state phishing URL DFA"></svg></div></div>
        <aside class="state-detail" id="state-detail" aria-live="polite"></aside>
      </div>
      <p class="diagram-caption">The diagram uses the supplied state coordinates and transitions. Colours show which branch each state belongs to; the interactive SVG and the simulator use the same 22 states and 25 transitions.</p>
      <div class="simulator" id="simulator">
        <div class="sim-tabs" role="tablist" aria-label="DFA tools">
          <button class="sim-tab active" type="button" role="tab" aria-selected="true" data-tab="symbol-tool">Symbol simulator</button>
          <button class="sim-tab" type="button" role="tab" aria-selected="false" data-tab="url-tool">URL checker</button>
        </div>
        <div class="tab-panel" id="symbol-tool" role="tabpanel">
          <h3>Run a symbol string through the DFA</h3>
          <div class="input-row">
            <div class="input-field"><label for="symbol-input">Input string</label><input id="symbol-input" class="mono-input" type="text" autocomplete="off" spellcheck="false" placeholder="For example, SPBAYX" aria-describedby="input-error"></div>
            <button class="btn primary" id="run-button" type="button">Run</button>
          </div>
          <div class="field-error" id="input-error" role="alert"></div>
          <div class="virtual-keyboard" aria-label="DFA input symbols">${alphabetOrder.map((symbol) => `<button class="quick-chip" type="button" data-key-symbol="${symbol}" aria-label="Add symbol ${symbol}">${symbol}</button>`).join("")}<button class="quick-chip" type="button" data-key-backspace aria-label="Remove last symbol">⌫</button><button class="quick-chip" type="button" data-key-clear>Clear</button></div>
          <details><summary>Quick-fill the 16 test strings</summary><div class="quick-fills">${D.TEST_CASES.map((test) => `<button class="quick-chip" type="button" data-fill="${test.input}" title="${test.accepted ? "Accept" : "Reject"}">${test.input}</button>`).join("")}</div></details>
          <div class="sim-toolbar">
            <button class="btn" id="step-button" type="button">Step</button>
            <button class="btn" id="back-button" type="button">Back</button>
            <button class="btn primary" id="auto-run-button" type="button">Run automatically</button>
            <button class="btn" id="pause-button" type="button" disabled>Pause</button>
            <button class="btn" id="reset-sim-button" type="button">Reset</button>
            <label class="speed-control" for="speed-input">Speed <input id="speed-input" type="range" min="0.25" max="3" value="1" step="0.25"><span id="speed-value">1×</span></label>
          </div>
          <div class="tape" id="tape" aria-label="Input tape"></div>
          <p><strong>Trace</strong></p><div class="trace-line" id="trace-line">q0</div>
          <p class="reading-line" id="reading-line" aria-live="polite">Enter a string and run the DFA one symbol at a time.</p>
          <div id="path-results" aria-live="polite"></div>
          <div id="result-banner" aria-live="polite"></div>
          <p class="disclaimer">A match is an indicator, not proof of phishing.</p>
        </div>
        <div class="tab-panel" id="url-tool" role="tabpanel" hidden>
          <h3>URL checker</h3>
          <p class="url-disclaimer">Illustrative front end; the DFA is the formal part. This rule-based tokeniser produces symbols from URL text only; it does not fetch or inspect the site.</p>
          <div class="input-row">
            <div class="input-field"><label for="url-input">URL</label><input id="url-input" type="text" value="https://secure-brand-login.vercel.app/verify-account" spellcheck="false"></div>
            <button class="btn primary" id="check-url-button" type="button">Parse and run</button>
          </div>
          <div class="field-error" id="url-error" role="alert"></div>
          <details class="url-test-list"><summary>20 test URLs — select one to run it through the checker</summary><div class="url-test-links" id="sample-urls"></div></details>
          <div class="url-pipeline" aria-label="URL processing pipeline"><span>Parse</span><b>→</b><span>Tokenise</span><b>→</b><span>Symbol string</span><b>→</b><span>DFA run</span><b>→</b><span>Verdict</span></div>
          <div id="token-table-wrap"></div>
          <p><strong>Symbol string:</strong> <code class="mono" id="token-string">S P B A Y X</code></p>
          <button class="btn" id="run-token-string" type="button">Run these symbols in the simulator</button>
          <div id="url-verdict" aria-live="polite"></div>
          <p class="disclaimer">A match is an indicator, not proof of phishing. The DFA sees only URL text and can give false positives and false negatives.</p>
        </div>
      </div>
    </section>

    <section class="section-card" id="section-5">
      <h2>5. Transition table and matrix</h2>
      <h3>5a. Transition matrix δ</h3>
      <p>Hover a defined cell to highlight its edge in the diagram; click to pin the highlight.</p>
      <div class="matrix-wrap"><table class="matrix" id="transition-matrix"></table></div>
      <p class="small-note">A dot (·) means no transition is defined: the run stops and the string is rejected. 25 of the 22 × 14 = 308 possible (state, symbol) pairs are defined; the other 283 are implicit rejects. Each pair appears at most once, which is what makes the machine deterministic.</p>
      <h3>5b. All 25 transitions in plain English</h3>
      <div class="control-row"><label for="transition-filter">Filter transitions</label><input id="transition-filter" type="search" placeholder="Filter by state, symbol, or reading"></div>
      <div class="table-wrap"><table class="data-table" id="transition-table">
        <thead><tr><th data-sort-column="number" tabindex="0" role="button" aria-sort="ascending"># ↕</th><th data-sort-column="from" tabindex="0" role="button">From ↕</th><th data-sort-column="symbol" tabindex="0" role="button">Read ↕</th><th data-sort-column="to" tabindex="0" role="button">To ↕</th><th data-sort-column="reading" tabindex="0" role="button">Reading ↕</th></tr></thead>
        <tbody></tbody>
      </table></div>
    </section>

    <section class="section-card" id="section-6">
      <h2>6. State-by-state details</h2>
      <p>Each card answers the questions a teacher usually asks about a circle: what does it mean, how do we get here, where can we go, and what happens on anything else. “Anything else” always means the run is rejected, because the missing transition is an implicit dead end.</p>
      <div id="state-groups" class="state-groups"></div>
    </section>

    <section class="section-card" id="section-7">
      <h2>7. The language the DFA accepts</h2>
      <div class="regex-box mono">L(M) = S H? ( P B A Y X | G ( B A Q X | U E R X X | N X ) )</div>
      <div class="table-wrap"><table class="data-table"><thead><tr><th>#</th><th>String</th><th>Length</th><th>Path</th><th>Verdict</th><th></th></tr></thead><tbody id="accepted-language"></tbody></table></div>
      <ul class="tight-list">
        <li>Exactly 8 strings are accepted: 2 prefix choices (with or without H) × 4 patterns. Shortest: SGNX (4). Longest: SHGUERXX (8).</li>
        <li>The language is finite, and every finite language is regular. So an equivalent regular expression exists (above).</li>
        <li>Every other string over the 14 symbols is rejected. This is deliberately strict: it recognises exactly the configured patterns, nothing fuzzy.</li>
      </ul>
      <div class="callout amber"><strong class="callout-title">A strength and a weakness, say both</strong>Strength: total precision, since every accepted string maps to a named verdict with a clear trace. Weakness: filler tokens are not tolerated. <code>SG B N A Q X</code> is rejected. A natural extension is N self-loops on the intermediate states so filler tokens are skipped.</div>
    </section>

    <section class="section-card" id="section-8">
      <h2>8. Worked traces (accepted and rejected)</h2>
      <p>Run any row in the simulator, or check every listed input against the expected result and path.</p>
      <div class="control-row"><button class="btn primary" id="run-all-tests" type="button">Run all tests</button><strong id="test-summary" aria-live="polite"></strong></div>
      <div class="table-wrap"><table class="data-table" id="worked-traces"><thead><tr><th>Input</th><th>Result</th><th>Path (states visited)</th><th>Why</th><th>Check</th><th></th></tr></thead><tbody></tbody></table></div>
      <p class="small-note">Two kinds of reject: (1) <strong>dead end:</strong> the run reaches a state with no arrow for the next symbol (for example SGBAX at q10); (2) <strong>ends in a non-accepting state:</strong> the symbols run out too early (for example SGN ends in q18).</p>
    </section>

    <section class="section-card" id="section-9">
      <h2>9. Theory points a teacher may probe</h2>
      <div class="control-row"><button class="btn" id="determinism-check" type="button">Run determinism check</button><strong id="determinism-result" aria-live="polite"></strong><button class="btn" type="button" data-scroll-complete>Go to “Complete the DFA”</button></div>
      <details class="accordion"><summary>1. Is it really a DFA?</summary><div class="accordion-content">Yes. Each (state, symbol) pair has at most one transition (25 transitions, 25 distinct pairs), there are no λ-transitions, and there is exactly one start state. Those three facts are the definition of deterministic. Use the live determinism check above to verify those properties directly from the transition data.</div></details>
      <details class="accordion"><summary>2. Partial vs complete DFA</summary><div class="accordion-content">Textbook DFAs are complete: every state has a transition on every symbol. Ours is a partial DFA: only the 25 meaningful transitions are drawn, and a missing transition is an implicit reject. The proposal says a complete DFA must define all transitions, so know the completion recipe: total pairs = 22 × 14 = 308; defined = 25; implicit rejects = 283. To complete the DFA, send every missing pair to a sink. We do not need a new state: make q21_Trap the sink by giving it a self-loop on all 14 symbols and redirecting the 283 missing pairs to it. Completing it changes nothing about which strings are accepted; it only draws what was implicit. We leave it partial to keep the diagram readable.</div></details>
      <details class="accordion"><summary>3. Minimisation</summary><div class="accordion-content">Running standard partition-refinement (Moore) on the machine, treating missing transitions as going to a dead state, gives 15 equivalence classes including the dead state (14 live). The merges would be: q6, q11, q16, q18 (each reads one X into an accepting state and nothing else); q7, q12, q17, q19 (all accepting with no exits, so identical as recognisers); q20, q21 and the implicit dead state (none can ever reach acceptance). We deliberately keep them separate. Merging the four accepting states would erase the verdict (PhishPaaS vs PhishBrand…), and that label is the whole point. In formal terms we use the state identity as an output function on top of a recogniser (a Moore-machine style reading). A pure yes/no recogniser could be minimised from 22 to 15 states.</div></details>
      <details class="accordion"><summary>4. DFA vs NFA vs regex</summary><div class="accordion-content">Every NFA converts to a DFA (subset construction), and every DFA converts to a regular expression: all three recognise exactly the regular languages. The proposal's NFA models four pattern families as separate parallel paths (login, delivery/billing, wallet/payment, brand mismatch). Our DFA has the same idea merged into one machine: the shared prefix S [H] is factored out and G forks into branches, so no real nondeterminism remains. An NFA does not improve detection accuracy; it is a convenient formal way to write the patterns.</div></details>
      <details class="accordion"><summary>5. Complexity</summary><div class="accordion-content">One table lookup per symbol: O(n) time for n tokens, O(1) extra memory (just the current state). No backtracking.</div></details>
      <details class="accordion"><summary>6. What a DFA cannot do</summary><div class="accordion-content">No memory beyond the current state: it cannot count unbounded things or match nested structure (not needed here). It sees only the URL string: no page content, hosting age, redirects or certificates. Sequence strictness: tokens must appear consecutively and in the configured order, so reordered or padded URLs can slip through. False positives (legitimate sites using a brand name or hosted on a PaaS) and false negatives (malicious URLs with none of the expected tokens). Matches are indicators, not proof.</div></details>
    </section>

    <section class="section-card" id="section-10">
      <h2>10. Implementation details</h2>
      <h3>One source of truth for the DFA</h3>
      <p><code>data.js</code> stores the 22 states, 25 transitions, 14-symbol alphabet, accepting states, start state, state explanations, branch colours, transition readings, and the 16 test cases. The diagram, matrix, state cards, and simulator all read from this same data.</p>
      <h3>How the implementation works</h3>
      <ul class="tight-list">
        <li><strong><code>index.html</code></strong> provides the page shell and loads the local stylesheet and scripts. The app has no framework, server requirement, or external runtime dependency.</li>
        <li><strong><code>style.css</code></strong> styles the document, branch-coloured cards, responsive layout, focus states, reduced-motion behavior, and print view.</li>
        <li><strong><code>app.js</code></strong> renders the inline SVG and the study-guide sections, connects state/transition interactions, and runs the simulator and illustrative URL tokeniser.</li>
        <li><strong><code>run()</code></strong> is a pure transition-table traversal. It returns the verdict, visited-state trace, stopping state, and rejection reason; both the simulator and tests use this same function.</li>
        <li><strong>URL tokeniser</strong> is a separate, illustrative front end. It turns URL text into symbols, then passes those symbols to the same DFA; the automaton itself remains the formal core.</li>
      </ul>
      <h3>Run the same DFA logic</h3>
      <p>The browser console can inspect the result object directly. The unit test script also checks every specified test string and path.</p>
      <div class="code-block"><button class="btn small code-copy" type="button" data-copy-code>Copy</button><pre><code>const result = PHISHING_DFA.run(
  PHISHING_DFA.DELTA,
  PHISHING_DFA.FINALS,
  "SPBAYX",
  PHISHING_DFA.START
);
console.log(result);
// accepted: true
// trace: [0, 1, 3, 4, 5, 6, 7]</code></pre></div>
      <p>To run the tests locally, open a terminal in the project folder and use <code>node data.test.js</code>. The result should report that all 16 strings match their expected results and paths.</p>
    </section>

    <section class="section-card" id="section-11">
      <h2>11. Viva questions and answers</h2>
      <div class="qa-tools"><input id="qa-search" type="search" placeholder="Search questions and answers"><label><input id="practice-mode" type="checkbox"> Practice mode (hide answers)</label><button class="btn" id="random-question" type="button">Random question</button></div>
      <div id="qa-list"></div>
    </section>

    <section class="section-card cheat-section" id="section-12">
      <h2>12. Last-minute cheat sheet</h2>
      <div class="control-row"><button class="btn primary" type="button" id="print-cheat-sheet">Print cheat sheet</button></div>
      <div class="table-wrap"><table class="cheat-table"><thead><tr><th>Item</th><th>Value</th></tr></thead><tbody id="cheat-sheet"></tbody></table></div>
    </section>
  `;
  app.innerHTML = sectionContents;
  $("#sample-urls").innerHTML = urlTestLinks.map(([label, url], index) =>
    `<button class="url-test-link" type="button" data-sample-url="${esc(url)}"><span class="url-test-number">${String(index + 1).padStart(2, "0")}</span><span><strong>${esc(label)}</strong><code>${esc(url)}</code></span></button>`
  ).join("");

  const viva = [
    ["What is a DFA, in one sentence?", "A machine with a finite set of states that reads input one symbol at a time and has exactly one next state for each (state, symbol), accepting if it ends in a final state."],
    ["Why did you choose a DFA for phishing detection?", "Phishing URLs often follow ordered token patterns (brand, then action, then confirmation). A DFA remembers what came before, runs in linear time, is deterministic, and its state trace explains every decision."],
    ["What is your alphabet and why single letters?", "14 token classes: S P G H B A Y Q U E R N X Z. One letter per class keeps test strings short and arrow labels readable. The class meanings are in section 3."],
    ["How many states, transitions, accepting states?", "22 states, 25 transitions, 14 symbols, 1 start state (q0), 4 accepting states (q7, q12, q17, q19)."],
    ["What does each accepting state mean?", "q7 PhishPaaS, q12 PhishBrand, q17 PhishMalware, q19 BenignPass. Note q19 is accepting but benign: “accepting” means a verdict was reached, and the state name carries the meaning."],
    ["Is it a complete DFA? You have missing transitions.", "It is a partial DFA: missing transitions are implicit rejects. 283 of 308 pairs are undefined. It can be completed by routing them to a sink (for example q21) without changing the accepted strings."],
    ["Which strings does it accept?", "Exactly 8: S H? followed by one of PBAYX, GBAQX, GUERXX, GNX. Regular expression: S H? ( P B A Y X | G ( B A Q X | U E R X X | N X ) )."],
    ["Is the language finite? Does that matter?", "Yes, finite, hence regular. A lookup table could recognise it too; the DFA gives us formal properties, a state trace, and a base to extend with loops (filler tokens) where lookups get awkward."],
    ["Why does the malware branch read X twice?", "Structurally, q15→q16→q17 both read X. In our design the first X closes the payload cue and the second closes the URL. If asked whether it is redundant: it is a design choice, and the DFA would work the same with distinct symbols for the two terminators. Say plainly that this is a point we could clean up."],
    ["What is q2 for?", "An optional host-inspection step. Reading H sends q1→q2, and q2 continues to P or G. It means a URL can pass through an extra host check without changing which patterns are recognised."],
    ["What happens to malformed input?", "Z leads from q0 or q1 to q20_Malformed, then to q21_Trap, which loops on Z. None of these can reach an accepting state, so malformed input is always rejected."],
    ["What happens if there are extra symbols after a verdict?", "The accepting states have no outgoing transitions, so any extra symbol is a dead end and the string is rejected. A pattern must match the entire input."],
    ["Prove it is deterministic.", "25 transitions, no repeated (state, symbol) pair, no λ-transitions, and one start state. The live determinism check verifies all four facts from the implementation."],
    ["Could you minimise it? Why didn't you?", "Yes: partition refinement merges q6/q11/q16/q18, the four accepting states and q20/q21 with the implicit dead state, giving 15 classes including dead. We keep them separate because merging accepting states would lose the verdict labels."],
    ["How is this different from an NFA?", "An NFA may have several next states per symbol or λ-moves. The proposal's NFA models four pattern families as parallel paths. Ours merges them into one deterministic machine by factoring the shared prefix; any NFA can be converted with subset construction anyway."],
    ["What is the time complexity?", "O(n) time for n tokens with one lookup each, and O(1) memory."],
    ["Does a match prove the URL is phishing?", "No. It is an indicator. A legitimate site could include a brand name or sit on a PaaS host. Hosting, page and behaviour checks (proposal layers B to D) would be needed for stronger evidence."],
    ["What are the limitations?", "Lexical only; strict consecutive order, so padded or reordered tokens evade it; finite pattern set; false positives and false negatives; no memory beyond the state."],
    ["How would you improve it?", "Add N self-loops on intermediate states to tolerate filler tokens; add more brand and action classes; add an NFA for multi-pattern matching and compare; feed the verdict to an ML model as an extra feature; add deeper checks only for uncertain cases."],
    ["How does it relate to the ML paper in your review sheet?", "The paper (stacking ensemble on 16 URL features, 84.79% accuracy) has no automaton. It is a statistical detector with features such as suspicious words and abnormal subdomains. Our DFA is a sequence-aware, explainable rule layer that could supply an extra feature to such a model."],
    ["Why are q2, q18 and q19 placed where they are in the diagram?", "Their coordinates help keep the branches readable and limit visual crossings. State positions affect only the drawing; the transition data and accepted language stay the same."],
    ["How is the interactive implementation organized?", "data.js is the single source of truth for states, transitions, symbols, explanations and tests. app.js renders the SVG, tables, state cards, simulator and URL-tokeniser interface; style.css handles the PDF-inspired presentation and responsive behavior."],
    ["What is the proposal's 5-state example compared to your 22 states?", "The proposal's table (Start, Host inspected, Brand recorded, Pattern recognised, Escalate) shows only the main path. Ours expands it into a full machine: roughly q0 start, q1/q2 host inspected, q4 brand recorded, q5/q6 pattern recognised, q7 escalation, plus three more verdict branches and the error path."]
  ];

  const cheatRows = [
    ["Machine", "DFA (partial), M = (Q, Σ, δ, q0, F)"],
    ["Numbers", "22 states, 14 symbols, 25 transitions, 1 start, 4 accepting, 8 accepted strings"],
    ["Alphabet", "S scheme · P PaaS host · G generic host · H host inspection · B brand · A action · Y PaaS confirm · Q mismatch · U urgency · E lure · R payload cue · N neutral · X end · Z malformed"],
    ["Language", "S H? ( P B A Y X | G ( B A Q X | U E R X X | N X ) )"],
    ["Verdicts", "q7 PhishPaaS · q12 PhishBrand · q17 PhishMalware · q19 BenignPass"],
    ["Hubs", "q1 (host type: P / G / H) and q8 (after generic host: B / U / N)"],
    ["Error path", "Z: q0 or q1 → q20 → q21 (loops on Z), never accepting"],
    ["Partial DFA", "283 of 308 pairs undefined = implicit reject; complete by sending them to q21"],
    ["Minimisation", "15 classes incl. dead; merges q6/q11/q16/q18, the four finals and q20/q21; kept separate for verdict labels"],
    ["Complexity", "O(n) time, O(1) space"],
    ["Implementation", "Offline single-page app in plain HTML, CSS and vanilla JavaScript"],
    ["Test strings", "Accept: SPBAYX, SHPBAYX, SGBAQX, SGUERXX, SGNX, SHGNX. Reject: SGBAX, SGN, SPBAY, SGUERX, SGNXS, GBAQX, SHHGNX, Z, SZ, SZZZ"],
    ["Always say", "It recognises suspicious token sequences in the URL. A match is an indicator, not proof of phishing."]
  ];

  $("#qa-list").innerHTML = viva.map(([question, answer], index) =>
    `<article class="accordion qa-item" data-question="${esc(question.toLowerCase())}" data-answer="${esc(answer.toLowerCase())}"><details><summary>${index + 1}. ${esc(question)}</summary><div class="accordion-content"><div class="qa-answer">${esc(answer)}</div><button class="btn small qa-reveal" type="button" hidden>Reveal answer</button></div></details></article>`
  ).join("");
  $("#cheat-sheet").innerHTML = cheatRows.map(([term, value]) => `<tr><td>${esc(term)}</td><td>${esc(value)}</td></tr>`).join("");

  const groupOrder = [
    ["front", "Main pipeline: q0, q1, q2", "The shared front end every URL passes through before it splits into branches."],
    ["paas", "Branch 1: PaaS brand impersonation (q3 to q7)", "Hosting-platform host, then brand word, then credential action, then confirmation. Pattern: P B A Y X."],
    ["brand", "Branch 2: brand mismatch on a generic host (q8 to q12)", "q8 is the second decision hub. Branch 2 pattern: G B A Q X."],
    ["malware", "Branch 3: urgency / malware lure (q13 to q17)", "From q8 on U. Pattern: G U E R X X."],
    ["benign", "Branch 4: benign (q18, q19)", "From q8 on N. Pattern: G N X. The “nothing suspicious” route."],
    ["error", "Error path: q20, q21", "How malformed input is handled instead of silently ignored."]
  ];

  $("#state-groups").innerHTML = groupOrder.map(([group, title, description]) => `
    <div class="state-group">
      <h3 class="branch-heading ${group}">${esc(title)}</h3><p class="section-lede">${esc(description)}</p>
      ${D.STATES.filter((item) => item.group === group).map((item) => {
        const card = D.STATE_CARDS[item.id];
          const tags = [...new Set([card.role === "initial state" ? "initial state" : "", card.role.includes("verdict") ? "verdict state" : "", ...(card.tags || [])].filter(Boolean))];
        return `<article class="state-card" style="${tintStyle(group)}">
          <div class="state-card-head" role="button" tabindex="0" data-state-jump="${item.id}" aria-label="Select ${esc(item.name)}">
            <strong>${esc(item.label)}</strong>${item.verdict ? `<small><strong>${esc(item.verdict)}</strong></small>` : ""}
            <small>${esc(card.role)}</small><div class="state-tags">${tags.map((tag) => `<span class="badge">${esc(tag)}</span>`).join("")}</div>
          </div>
          <div class="state-card-body">
            <p><strong>Meaning:</strong> ${esc(card.meaning)}</p>
            <p><strong>Reached by:</strong> ${esc(card.reachedBy)}</p>
            <p><strong>Outgoing:</strong> ${card.outgoing.length ? card.outgoing.map(esc).join("; ") : "none."}</p>
            <p><strong>Anything else:</strong> ${esc(card.anythingElse)}</p>
            ${card.note ? `<p><strong>Note:</strong> ${esc(card.note)}</p>` : ""}
          </div>
        </article>`;
      }).join("")}
    </div>`).join("");

  const acceptedInputs = D.ACCEPTED_STRINGS;
  $("#accepted-language").innerHTML = acceptedInputs.map((test, index) => {
    const finalState = state(test.trace[test.trace.length - 1]);
    const path = test.trace.map(qname).join(" → ");
    return `<tr><td>${index + 1}</td><td class="mono">${test.input}</td><td>${test.input.length}</td><td class="mono">${path}</td><td>${esc(finalState.verdict)}</td><td><button class="btn small" type="button" data-fill="${test.input}" data-scroll-sim>Simulate</button></td></tr>`;
  }).join("");

  $("#worked-traces tbody").innerHTML = D.TEST_CASES.map((test) => {
    const path = test.trace.map(qname).join(" → ");
    const why = test.accepted
      ? ["The proposal's example.", "Same with optional host inspection.", "Brand mismatch.", "Malware lure.", "Benign.", "Benign with host inspection."][D.TEST_CASES.filter((entry, index) => entry.accepted && D.TEST_CASES.indexOf(entry) < D.TEST_CASES.indexOf(test)).length]
      : ({
        SGBAX: "Missing Q: brand and action but no mismatch confirmation.",
        SGN: "Premature end: stopped in q18, not accepting.",
        SPBAY: "Premature end at q6: no X.",
        SGUERX: "Only one X on the malware branch.",
        SGNXS: "Extra symbol after a verdict.",
        GBAQX: "Does not start with S.",
        SHHGNX: "Two H symbols.",
        Z: "Malformed from the start.",
        SZ: "Malformed right after scheme.",
        SZZZ: "Falls into and loops in the trap."
      })[test.input];
    const displayPath = test.accepted ? path : test.reason.startsWith("no arrow")
      ? `${path} (${test.reason})` : path;
    return `<tr data-test-row="${test.input}"><td class="mono">${test.input}</td><td class="${test.accepted ? "accepted-label" : "rejected-label"}">${test.accepted ? "ACCEPT" : "REJECT"}</td><td class="mono">${esc(displayPath)}</td><td>${esc(why)}</td><td class="test-check" aria-live="polite">—</td><td><button class="btn small" type="button" data-fill="${test.input}" data-scroll-sim>Run</button></td></tr>`;
  }).join("");

  function renderMatrix() {
    const head = `<thead><tr><th>state</th>${alphabetOrder.map((symbol) => `<th>${symbol}</th>`).join("")}</tr></thead>`;
    const rows = D.STATES.map((item) => {
      const group = item.group;
      const label = `${item.label}${item.verdict ? ` ${item.verdict}` : item.initial ? " (start)" : ""}`;
      const cells = alphabetOrder.map((symbol) => {
        const to = D.DELTA[`${item.id}:${symbol}`];
        if (to === undefined) return "<td>·</td>";
        const index = edgeIndex(item.id, to, symbol);
        const branch = state(to).group;
        return `<td class="has-transition" style="${tintStyle(branch)}" data-edge-ref="${index}" tabindex="0" role="button" aria-label="${qname(item.id)} on ${symbol} goes to ${qname(to)}">${qname(to)}</td>`;
      }).join("");
      return `<tr><th style="${tintStyle(group)}">${esc(label)}</th>${cells}</tr>`;
    }).join("");
    $("#transition-matrix").innerHTML = `${head}<tbody>${rows}</tbody>`;
  }
  renderMatrix();

  function renderTransitions() {
    $("#transition-table tbody").innerHTML = D.TRANSITIONS.map(([from, to, symbol], index) => {
      const toState = state(to);
      const destination = `${qname(to)}${toState.verdict ? ` ${toState.verdict}` : ""}`;
      const entry = `${index + 1} ${qname(from)} ${symbol} ${destination} ${D.EDGE_READINGS[index]}`.toLowerCase();
      return `<tr class="transition-row" data-edge-row="${index}" data-search="${esc(entry)}" data-number="${index + 1}" data-from="${qname(from)}" data-symbol="${symbol}" data-to="${esc(destination)}" data-reading="${esc(D.EDGE_READINGS[index])}" tabindex="0"><td>${index + 1}</td><td>${qname(from)}</td><td><span class="symbol-chip" style="${tintStyle(toState.group)}">${symbol}</span></td><td>${esc(destination)}</td><td>${esc(D.EDGE_READINGS[index])}</td></tr>`;
    }).join("");
  }
  renderTransitions();

  const SVG_NS = "http://www.w3.org/2000/svg";
  const svg = $("#dfa-svg");
  const defaultZoom = { scale: 1, x: 0, y: 0 };
  let zoom = { ...defaultZoom };
  let hoveredState = null;
  let selectedState = null;
  let highlightedEdges = new Set();
  let pinnedEdge = null;
  let classMode = false;
  const edgePaths = [];
  const nodePositions = new Map(D.STATES.map((item) => [item.id, { x: item.x, y: item.y }]));
  const sim = {
    input: "", index: 0, currentState: D.START, trace: [D.START],
    started: false, halted: false, deadState: null, start: D.START,
    timer: null, transitionTrace: []
  };
  const labelAdjust = {
    "1:3:P": [-2, -15], "1:8:G": [0, -14], "1:2:H": [0, -10], "2:3:P": [-6, -13],
    "2:8:G": [10, 1], "8:13:U": [18, 0], "8:18:N": [-7, -6], "1:20:Z": [-12, 4],
    "0:20:Z": [-16, 0], "21:21:Z": [-42, -4]
  };

  function svgEl(tag, attributes = {}, text = "") {
    const element = document.createElementNS(SVG_NS, tag);
    Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, String(value)));
    if (text) element.textContent = text;
    return element;
  }

  function lineGeometry(from, to, selfLoop) {
    const a = nodePositions.get(from);
    const b = nodePositions.get(to);
    if (selfLoop) {
      return { d: `M ${a.x - 17} ${a.y - 17} C ${a.x - 75} ${a.y - 70}, ${a.x - 75} ${a.y + 70}, ${a.x - 17} ${a.y + 17}`, label: [a.x - 62, a.y] };
    }
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const length = Math.hypot(dx, dy);
    const ux = dx / length;
    const uy = dy / length;
    const sx = a.x + ux * 25;
    const sy = a.y + uy * 25;
    const ex = b.x - ux * 28;
    const ey = b.y - uy * 28;
    return { d: `M ${sx} ${sy} L ${ex} ${ey}`, label: [(sx + ex) / 2, (sy + ey) / 2] };
  }

  function renderDiagram() {
    svg.innerHTML = "";
    const defs = svgEl("defs");
    Object.entries(D.GROUPS).forEach(([group, value]) => {
      const marker = svgEl("marker", { id: `arrow-${group}`, viewBox: "0 0 10 10", refX: "8.5", refY: "5", markerWidth: "7", markerHeight: "7", orient: "auto-start-reverse" });
      marker.append(svgEl("path", { d: "M 0 0 L 10 5 L 0 10 z", fill: value.stroke }));
      defs.append(marker);
    });
    svg.append(defs);
    const viewport = svgEl("g", { id: "svg-viewport" });
    svg.append(viewport);

    const titles = [
      [880, 114, "Branch 1: PaaS brand impersonation", "paas"],
      [880, 294, "Branch 2: brand mismatch on generic host", "brand"],
      [880, 433, "Branch 3: urgency / malware lure", "malware"],
      [560, 650, "Branch 4: benign", "benign"],
      [253, 716, "Error / trap path", "error"]
    ];
    titles.forEach(([x, y, title, group]) => viewport.append(svgEl("text", { x, y, class: "branch-title-svg", fill: getGroup(group).stroke }, title)));

    const startMarker = svgEl("marker", { id: "arrow-start", viewBox: "0 0 10 10", refX: "8.5", refY: "5", markerWidth: "7", markerHeight: "7", orient: "auto" });
    startMarker.append(svgEl("path", { d: "M 0 0 L 10 5 L 0 10 z", fill: "#111827" }));
    defs.append(startMarker);
    const startLine = svgEl("path", { d: "M 174 360 L 222 360", stroke: "#111827", "stroke-width": "2.2", "marker-end": "url(#arrow-start)" });
    viewport.append(startLine, svgEl("text", { x: 173, y: 350, class: "svg-note", "text-anchor": "end" }, "start"));

    D.TRANSITIONS.forEach(([from, to, symbol], index) => {
      const branch = state(to).group;
      const geom = lineGeometry(from, to, from === to);
      const path = svgEl("path", {
        d: geom.d, class: "svg-edge", stroke: getGroup(branch).stroke,
        "marker-end": `url(#arrow-${branch})`, "data-edge": index,
        tabindex: "0", role: "button", "aria-label": `${qname(from)} on ${symbol} to ${qname(to)}. ${D.EDGE_READINGS[index]}`
      });
      path.addEventListener("pointerenter", (event) => showEdgeTooltip(index, event));
      path.addEventListener("pointermove", moveTooltip);
      path.addEventListener("pointerleave", hideTooltip);
      path.addEventListener("focus", (event) => showEdgeTooltip(index, event));
      path.addEventListener("blur", hideTooltip);
      path.addEventListener("click", () => jumpToTransition(index));
      path.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          jumpToTransition(index);
        }
      });
      viewport.append(path);
      edgePaths.push(path);

      const adjust = labelAdjust[`${from}:${to}:${symbol}`] || [0, -12];
      const lx = geom.label[0] + adjust[0];
      const ly = geom.label[1] + adjust[1];
      const labelGroup = svgEl("g", { class: "edge-label", "data-edge-label": index, "aria-hidden": "true" });
      labelGroup.append(
        svgEl("rect", { x: lx - 12, y: ly - 10, width: 24, height: 20, rx: 4, class: "edge-label-box", stroke: getGroup(branch).stroke }),
        svgEl("text", { x: lx, y: ly + 1, class: "edge-label-text", fill: getGroup(branch).stroke }, symbol),
        svgEl("rect", { x: lx - 16, y: ly - 14, width: 32, height: 28, class: "edge-label-hit", "data-edge-label-hit": index, "aria-label": `Show transition ${index + 1}` })
      );
      viewport.append(labelGroup);
      const labelHit = labelGroup.querySelector("[data-edge-label-hit]");
      labelHit.addEventListener("pointerenter", (event) => showEdgeTooltip(index, event));
      labelHit.addEventListener("pointermove", moveTooltip);
      labelHit.addEventListener("pointerleave", hideTooltip);
      labelHit.addEventListener("focus", (event) => showEdgeTooltip(index, event));
      labelHit.addEventListener("blur", hideTooltip);
      labelHit.addEventListener("click", () => jumpToTransition(index));
    });

    D.STATES.forEach((item) => {
      const group = getGroup(item.group);
      const node = svgEl("g", {
        class: `state-node${item.final ? " final" : ""}${item.initial ? " initial" : ""}`,
        "data-state": item.id, transform: `translate(${item.x} ${item.y})`,
        tabindex: "0", role: "button",
        "aria-label": `${item.name}${item.verdict ? `, ${item.verdict}` : ""}. ${D.STATE_CARDS[item.id].role}. ${D.STATE_CARDS[item.id].meaning}`
      });
      node.style.setProperty("--branch", group.stroke);
      node.style.setProperty("--tint", group.fill);
      node.append(svgEl("circle", { r: 24, class: "node-circle" }));
      if (item.final) node.append(svgEl("circle", { r: 18, class: "inner-ring", stroke: group.stroke }));
      node.append(svgEl("text", { class: "node-text", y: 1 }, item.label));
      node.addEventListener("pointerenter", (event) => showStateTooltip(item.id, event));
      node.addEventListener("pointermove", moveTooltip);
      node.addEventListener("pointerleave", () => {
        hoveredState = null;
        hideTooltip();
        refreshHighlights();
      });
      node.addEventListener("focus", (event) => showStateTooltip(item.id, event));
      node.addEventListener("blur", () => {
        hoveredState = null;
        hideTooltip();
        refreshHighlights();
      });
      node.addEventListener("click", () => selectState(item.id));
      node.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          selectState(item.id);
        }
      });
      node.addEventListener("contextmenu", (event) => {
        event.preventDefault();
        showContextMenu(item.id, event.clientX, event.clientY);
      });
      viewport.append(node);
    });

    viewport.append(
      svgEl("text", { x: 1200, y: 184, class: "verdict-caption", fill: getGroup("paas").stroke }, "PhishPaaS"),
      svgEl("text", { x: 1200, y: 388, class: "verdict-caption", fill: getGroup("brand").stroke }, "PhishBrand"),
      svgEl("text", { x: 1200, y: 511, class: "verdict-caption", fill: getGroup("malware").stroke }, "PhishMalware"),
      svgEl("text", { x: 340, y: 619, class: "verdict-caption", fill: getGroup("benign").stroke, "text-anchor": "end" }, "BenignPass"),
      svgEl("text", { x: 286, y: 544, class: "svg-note" }, "Malformed"),
      svgEl("text", { x: 286, y: 669, class: "svg-note" }, "Trap")
    );

    const legend = svgEl("g", { transform: "translate(930 572)" });
    legend.append(
      svgEl("rect", { width: 350, height: 130, rx: 5, class: "diagram-legend" }),
      svgEl("text", { x: 14, y: 22, fill: "#111827", "font-size": 16, "font-weight": 700 }, "How to read"),
      svgEl("circle", { cx: 27, cy: 48, r: 11, fill: "#dbeafe", stroke: "#2563eb", "stroke-width": 2 }),
      svgEl("text", { x: 49, y: 53, class: "svg-note" }, "Normal state (single circle)"),
      svgEl("circle", { cx: 27, cy: 78, r: 11, fill: "#dbeafe", stroke: "#2563eb", "stroke-width": 2 }),
      svgEl("circle", { cx: 27, cy: 78, r: 7, fill: "none", stroke: "#2563eb", "stroke-width": 1.4 }),
      svgEl("text", { x: 49, y: 83, class: "svg-note" }, "Accepting (verdict) state"),
      svgEl("text", { x: 14, y: 111, class: "svg-note" }, "No arrow for a symbol = implicit reject")
    );
    viewport.append(legend);

    const caption = svgEl("text", { x: 650, y: 746, class: "svg-note", "text-anchor": "middle" }, "22 states · 25 transitions · 4 verdict states · partial DFA");
    viewport.append(caption);
    applyZoom();
    refreshHighlights();
  }

  function applyZoom() {
    const viewport = $("#svg-viewport");
    if (viewport) viewport.setAttribute("transform", `translate(${zoom.x} ${zoom.y}) scale(${zoom.scale})`);
  }

  function transitionsForState(id) {
    return D.TRANSITIONS.map((transition, index) => ({ transition, index }))
      .filter(({ transition: [from, to] }) => from === id || to === id);
  }

  function refreshHighlights() {
    const focusState = hoveredState;
    const focusEdges = new Set(highlightedEdges);
    if (focusState !== null) transitionsForState(focusState).forEach(({ index }) => focusEdges.add(index));
    edgePaths.forEach((path, index) => {
      path.classList.toggle("traced", highlightedEdges.has(index));
      path.classList.toggle("highlight", focusEdges.has(index));
      path.classList.toggle("dim", (focusState !== null || highlightedEdges.size > 0) && !focusEdges.has(index));
    });
    $$(".state-node", svg).forEach((node) => {
      const id = Number(node.dataset.state);
      const related = focusState === null || transitionsForState(focusState).some(({ transition: [from, to] }) => from === id || to === id) || id === focusState;
      node.classList.toggle("dim", (focusState !== null || highlightedEdges.size > 0) && !related);
      node.classList.toggle("selected", id === selectedState);
      node.classList.toggle("active", sim.currentState === id && sim.started);
      node.classList.toggle("dead", sim.deadState === id);
    });
  }

  function showStateTooltip(id, event) {
    hoveredState = id;
    highlightedEdges = new Set(pinnedEdge === null ? [] : [pinnedEdge]);
    const card = D.STATE_CARDS[id];
    const item = state(id);
    const incoming = D.TRANSITIONS.map(([from, to, symbol], index) => ({ from, to, symbol, index }))
      .filter((transition) => transition.to === id);
    const outgoing = D.TRANSITIONS.map(([from, to, symbol], index) => ({ from, to, symbol, index }))
      .filter((transition) => transition.from === id);
    const incomingText = incoming.length
      ? incoming.map(({ from, symbol }) => `${qname(from)} --${symbol}--> ${qname(id)}`).join("; ")
      : "Start of every run.";
    const outgoingText = outgoing.length
      ? outgoing.map(({ to, symbol }) => `${symbol} → ${qname(to)}`).join("; ")
      : "No outgoing transitions.";
    const simulationDetails = getStateSimulationDetails(id);
    const tooltip = $("#diagram-tooltip") || createTooltip();
    tooltip.innerHTML = `<div class="tooltip-title"><strong>${esc(stateTitle(id))}</strong><span class="tooltip-branch" style="${tintStyle(item.group)}">${esc(getGroup(item.group).name)}</span></div>
      <div><strong>Role:</strong> ${esc(card.role)}${item.initial ? " · START" : ""}${item.final ? " · ACCEPTING" : ""}${id === 21 ? " · TRAP" : ""}</div>
      <div><strong>Meaning:</strong> ${esc(card.meaning)}</div>
      <div><strong>Reached by:</strong> ${esc(card.reachedBy)}</div>
      <div><strong>Incoming:</strong> ${esc(incomingText)}</div>
      <div><strong>Outgoing:</strong> ${esc(outgoingText)}</div>
      <div><strong>Anything else:</strong> ${esc(card.anythingElse)}</div>
      ${card.note ? `<div><strong>Note:</strong> ${esc(card.note)}</div>` : ""}
      <div class="tooltip-simulation"><strong>Simulation:</strong> ${simulationDetails}</div>`;
    tooltip.style.display = "block";
    moveTooltip(event);
    refreshHighlights();
  }

  function showEdgeTooltip(index, event) {
    const [from, to, symbol] = D.TRANSITIONS[index];
    const destination = state(to);
    const meaning = D.SYMBOL_MEANINGS[symbol];
    const simulationDetails = getEdgeSimulationDetails(index);
    const tooltip = $("#diagram-tooltip") || createTooltip();
    tooltip.innerHTML = `<div class="tooltip-title"><strong>${qname(from)} <span class="tooltip-symbol">${symbol}</span> → ${qname(to)}${destination.verdict ? ` · ${esc(destination.verdict)}` : ""}</strong></div>
      <div><strong>Transition:</strong> ${esc(qname(from))} reads ${esc(symbol)} and moves to ${esc(qname(to))}.</div>
      <div><strong>${esc(meaning.name)} (${esc(symbol)}):</strong> ${esc(meaning.meaning)}</div>
      <div><strong>Reading:</strong> ${esc(D.EDGE_READINGS[index])}</div>
      <div><strong>Destination:</strong> ${esc(D.STATE_CARDS[to].meaning)}</div>
      <div class="tooltip-simulation"><strong>Simulation:</strong> ${simulationDetails}</div>`;
    tooltip.style.display = "block";
    moveTooltip(event);
    highlightedEdges = new Set([index]);
    refreshHighlights();
  }

  function getStateSimulationDetails(id) {
    if (!sim.started) {
      return "No run yet. This is the state's role and behavior in the DFA.";
    }
    const positions = sim.trace.reduce((matches, visitedId, index) => {
      if (visitedId === id) matches.push(index);
      return matches;
    }, []);
    if (!positions.length) {
      return `Not reached in this run (${esc(sim.input || "(empty input)")}). Trace so far: ${sim.trace.map(qname).join(" → ")}.`;
    }

    const details = positions.map((position) => {
      const symbolIndex = position - 1;
      const arrived = position === 0
        ? "start state before reading input"
        : `after reading ${sim.input[symbolIndex]} (step ${position})`;
      const isLastPosition = position === sim.trace.length - 1;
      const outcome = isLastPosition && sim.deadState === id
        ? `dead end: no arrow on ${sim.input[sim.index]}`
        : isLastPosition && sim.halted && D.FINALS.includes(id)
          ? `final verdict: ${state(id).verdict}`
          : isLastPosition && sim.halted
            ? "input ended here; this state is not accepting"
            : isLastPosition
              ? `current position; next symbol: ${sim.input[sim.index] || "none"}`
              : `then read ${sim.input[position]} and moved to ${qname(sim.trace[position + 1])}`;
      return `${arrived}; ${outcome}`;
    });
    return `${details.join(" · ")}<br><strong>Trace:</strong> ${sim.trace.map(qname).join(" → ")}`;
  }

  function getEdgeSimulationDetails(index) {
    if (!sim.started) {
      return "No run yet. The transition is available whenever its source state reads this symbol.";
    }
    const position = sim.transitionTrace.indexOf(index);
    if (position >= 0) {
      const [from, to, symbol] = D.TRANSITIONS[index];
      return `Used at step ${position + 1}: input symbol ${position + 1} is ${symbol}; the run moved ${qname(from)} → ${qname(to)}. Trace: ${sim.trace.map(qname).join(" → ")}.`;
    }
    const [from, , symbol] = D.TRANSITIONS[index];
    if (sim.deadState === from && sim.input[sim.index] === symbol) {
      return `This run stopped at ${qname(from)} before taking this edge. Its next input symbol was ${symbol}, but no transition is defined for that pair.`;
    }
    return `Not used in this run (${esc(sim.input || "(empty input)")}). Current trace: ${sim.trace.map(qname).join(" → ")}.`;
  }

  function createTooltip() {
    const tooltip = document.createElement("div");
    tooltip.id = "diagram-tooltip";
    tooltip.className = "diagram-tooltip";
    tooltip.setAttribute("role", "tooltip");
    document.body.append(tooltip);
    return tooltip;
  }

  function moveTooltip(event) {
    const tooltip = $("#diagram-tooltip");
    if (!tooltip || !event || typeof event.clientX !== "number") return;
    const width = Math.min(380, window.innerWidth - 24);
    tooltip.style.left = `${Math.max(12, Math.min(event.clientX + 14, window.innerWidth - width - 12))}px`;
    tooltip.style.top = `${Math.max(12, Math.min(event.clientY + 12, window.innerHeight - tooltip.offsetHeight - 12))}px`;
  }

  function hideTooltip() {
    const tooltip = $("#diagram-tooltip");
    if (tooltip) tooltip.style.display = "none";
    if (hoveredState === null) {
      highlightedEdges = new Set(pinnedEdge === null ? [] : [pinnedEdge]);
      refreshHighlights();
    }
  }

  function showStatePanel(id) {
    const item = state(id);
    const card = D.STATE_CARDS[id];
    const panel = $("#state-detail");
    const tags = [...(card.tags || [])];
    if (item.initial) tags.push("START");
    if (item.final) tags.push("ACCEPTING");
    if (id === 21) tags.push("TRAP");
    panel.innerHTML = `<button class="detail-close" type="button" aria-label="Close state details">×</button>
      <h3>${esc(item.name)}</h3><p class="small-note">${esc(getGroup(item.group).name)}</p>
      ${tags.length ? `<p>${tags.map((tag) => `<span class="badge">${esc(tag)}</span>`).join(" ")}</p>` : ""}
      <div class="detail-row"><strong>Meaning</strong>${esc(card.meaning)}</div>
      <div class="detail-row"><strong>Reached by</strong>${esc(card.reachedBy)}</div>
      <div class="detail-row"><strong>Outgoing</strong>${card.outgoing.length ? `<ul>${card.outgoing.map((entry) => `<li>${esc(entry)}</li>`).join("")}</ul>` : "none."}</div>
      <div class="detail-row"><strong>Anything else</strong>${esc(card.anythingElse)}</div>
      ${card.note ? `<div class="detail-row"><strong>Note</strong>${esc(card.note)}</div>` : ""}
      <div class="detail-actions"><button class="btn small" type="button" data-panel-start="${id}">Start simulation here</button><button class="btn small" type="button" data-panel-path="${id}">Show all paths to this state</button>
      <button class="btn small" type="button" data-state-prev="${id}">Previous state</button><button class="btn small" type="button" data-state-next="${id}">Next state</button></div>`;
    $("#diagram-panel").classList.add("panel-open");
    $(".detail-close", panel).addEventListener("click", closeStatePanel);
    $("[data-panel-start]", panel).addEventListener("click", () => {
      setSimulatorInput($("#symbol-input").value, Number(id));
      $("#simulator").scrollIntoView({ behavior: "smooth", block: "center" });
    });
    $("[data-panel-path]", panel).addEventListener("click", () => showAllPathsTo(Number(id)));
    $("[data-state-prev]", panel).addEventListener("click", () => selectState((Number(id) + D.STATES.length - 1) % D.STATES.length));
    $("[data-state-next]", panel).addEventListener("click", () => selectState((Number(id) + 1) % D.STATES.length));
  }

  function closeStatePanel() {
    $("#diagram-panel").classList.remove("panel-open");
    selectedState = null;
    refreshHighlights();
  }

  function selectState(id) {
    selectedState = id;
    showStatePanel(id);
    refreshHighlights();
    const node = $(`[data-state="${id}"]`, svg);
    if (node) node.focus({ preventScroll: true });
  }

  function showContextMenu(id, x, y) {
    const menu = $("#state-context-menu") || createContextMenu();
    menu.dataset.state = id;
    menu.innerHTML = `<button type="button" data-context-action="card">Show state card</button>
      <button type="button" data-context-action="incoming">Highlight incoming</button>
      <button type="button" data-context-action="outgoing">Highlight outgoing</button>
      <button type="button" data-context-action="shortest">Run shortest accepted string to here</button>
      <button type="button" data-context-action="copy">Copy state info</button>`;
    menu.style.left = `${Math.min(x, window.innerWidth - 240)}px`;
    menu.style.top = `${Math.min(y, window.innerHeight - 190)}px`;
    menu.style.display = "block";
  }

  function createContextMenu() {
    const menu = document.createElement("div");
    menu.id = "state-context-menu";
    menu.className = "context-menu";
    menu.setAttribute("role", "menu");
    document.body.append(menu);
    return menu;
  }

  function statePathTo(targetId) {
    const queue = [{ id: D.START, path: [D.START], symbols: "" }];
    const seen = new Set([D.START]);
    while (queue.length) {
      const current = queue.shift();
      if (current.id === targetId) return current;
      for (const [from, to, symbol] of D.TRANSITIONS) {
        if (from !== current.id || seen.has(to)) continue;
        seen.add(to);
        queue.push({ id: to, path: [...current.path, to], symbols: current.symbols + symbol });
      }
    }
    return null;
  }

  function allSimplePathsTo(targetId) {
    const paths = [];
    function visit(current, path, symbols) {
      if (current === targetId) {
        paths.push({ id: current, path, symbols });
        return;
      }
      for (const [from, to, symbol] of D.TRANSITIONS) {
        if (from !== current || path.includes(to)) continue;
        visit(to, [...path, to], symbols + symbol);
      }
    }
    visit(D.START, [D.START], "");
    return paths;
  }

  function showAllPathsTo(id) {
    const paths = allSimplePathsTo(id);
    if (!paths.length) {
      $("#path-results").textContent = `${qname(id)} is not reachable from q0.`;
      return;
    }
    $("#path-results").innerHTML = `<h4>Simple paths from q0 to ${esc(qname(id))}</h4><ol>${paths.map((path) =>
      `<li><code>${esc(path.symbols || "(empty input)")}</code>: ${esc(path.path.map(qname).join(" → "))}</li>`
    ).join("")}</ol><p class="small-note">The q21 trap has a Z self-loop, so there are infinitely many walks to it. This list shows paths that do not revisit a state.</p>`;
    $("#path-results").scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function showPathTo(id) {
    const path = statePathTo(id);
    if (!path) {
      notify(`${qname(id)} is not reachable from q0.`);
      return;
    }
    $("#simulator").scrollIntoView({ behavior: "smooth", block: "center" });
    setSimulatorInput(path.symbols, D.START);
    $("#reading-line").textContent = `Shortest path to ${qname(id)}: ${path.symbols || "(empty input)"} · ${path.path.map(qname).join(" → ")}`;
    highlightedEdges = new Set(path.path.slice(1).map((to, index) => edgeIndex(path.path[index], to, path.symbols[index])));
    refreshHighlights();
    $("#run-button").click();
  }

  function jumpToTransition(index) {
    pinnedEdge = index;
    highlightedEdges = new Set([index]);
    refreshHighlights();
    const row = $(`[data-edge-row="${index}"]`);
    if (row) {
      $("#section-5").scrollIntoView({ behavior: "smooth", block: "start" });
      row.classList.add("flash");
      row.focus({ preventScroll: true });
      window.setTimeout(() => row.classList.remove("flash"), 1800);
    }
  }

  function highlightStateEdges(id, direction) {
    const edges = D.TRANSITIONS.map(([from, to], index) => ({ from, to, index }))
      .filter((edge) => direction === "incoming" ? edge.to === id : edge.from === id)
      .map((edge) => edge.index);
    highlightedEdges = new Set(edges);
    pinnedEdge = null;
    refreshHighlights();
    $("#state-context-menu").style.display = "none";
  }

  renderDiagram();
  const frame = $("#diagram-frame");
  frame.addEventListener("wheel", (event) => {
    event.preventDefault();
    const next = Math.max(.65, Math.min(2.2, zoom.scale * (event.deltaY < 0 ? 1.08 : .92)));
    zoom.scale = next;
    applyZoom();
  }, { passive: false });
  let pan = null;
  frame.addEventListener("pointerdown", (event) => {
    if (event.target.closest(".state-node, .svg-edge, .edge-label")) return;
    pan = { x: event.clientX, y: event.clientY, ox: zoom.x, oy: zoom.y };
    frame.setPointerCapture(event.pointerId);
  });
  frame.addEventListener("pointermove", (event) => {
    if (!pan) return;
    zoom.x = pan.ox + (event.clientX - pan.x) / (frame.clientWidth / 1300);
    zoom.y = pan.oy + (event.clientY - pan.y) / (frame.clientWidth / 1300);
    applyZoom();
  });
  frame.addEventListener("pointerup", () => { pan = null; });
  $("#reset-view").addEventListener("click", () => { zoom = { ...defaultZoom }; applyZoom(); });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeStatePanel();
      const menu = $("#state-context-menu");
      if (menu) menu.style.display = "none";
      hideTooltip();
    }
  });
  document.addEventListener("click", (event) => {
    const menu = $("#state-context-menu");
    if (menu && !menu.contains(event.target)) menu.style.display = "none";
  });

  function drawImplicitRejects(show) {
    const viewport = $("#svg-viewport");
    $$(".implicit-group", viewport).forEach((item) => item.remove());
    $("#completion-note").hidden = !show;
    if (!show) return;
    const group = svgEl("g", { class: "implicit-group" });
    let totalMissing = 0;
    D.STATES.forEach((item) => {
      const outgoingCount = D.TRANSITIONS.filter(([from]) => from === item.id).length;
      const missing = D.ALPHABET.length - outgoingCount;
      totalMissing += missing;
      if (!missing) return;
      const destination = state(21);
      const d = item.id === 21
        ? `M ${item.x - 18} ${item.y - 18} C ${item.x - 85} ${item.y - 82}, ${item.x - 85} ${item.y + 82}, ${item.x - 18} ${item.y + 18}`
        : `M ${item.x} ${item.y + 25} Q ${(item.x + destination.x) / 2 + 20} ${(item.y + destination.y) / 2} ${destination.x - 27} ${destination.y}`;
      group.append(
        svgEl("path", { d, class: "implicit-edge" }),
        svgEl("text", { x: item.id === 21 ? item.x - 93 : (item.x + destination.x) / 2 + 23, y: item.id === 21 ? item.y : (item.y + destination.y) / 2, class: "implicit-label" }, `(${missing} other symbols)`)
      );
    });
    if (totalMissing !== 283) throw new Error(`Expected 283 missing transitions; found ${totalMissing}.`);
    viewport.insertBefore(group, viewport.querySelector(".state-node"));
  }
  $("#complete-toggle").addEventListener("change", (event) => drawImplicitRejects(event.target.checked));

  const equivalenceClass = new Map();
  [0, 1, 2, 3, 4, 5, 8, 9, 10, 13, 14, 15, 20, 21].forEach((id) => equivalenceClass.set(id, `unique-${id}`));
  [6, 11, 16, 18].forEach((id) => equivalenceClass.set(id, "pre-final"));
  [7, 12, 17, 19].forEach((id) => equivalenceClass.set(id, "finals"));
  $("#classes-toggle").addEventListener("change", (event) => {
    classMode = event.target.checked;
    $$(".state-node", svg).forEach((node) => {
      const id = Number(node.dataset.state);
      const className = equivalenceClass.get(id);
      const classColor = className === "pre-final" ? D.GROUPS.front : className === "finals" ? D.GROUPS.benign : D.GROUPS[state(id).group];
      node.dataset.equivalenceClass = classMode ? className : "";
      node.classList.toggle("equivalence", classMode);
      node.style.setProperty("--branch", classMode ? classColor.stroke : D.GROUPS[state(id).group].stroke);
      node.style.setProperty("--tint", classMode ? classColor.fill : D.GROUPS[state(id).group].fill);
    });
    notify(classMode ? "States are marked by the equivalence classes described in the theory section." : "Equivalence-class highlighting cleared.");
  });

  function inputValidation(value) {
    const invalid = [...value].find((symbol) => !D.ALPHABET.includes(symbol));
    return invalid ? `Invalid symbol “${invalid}”. Use only: ${D.ALPHABET.join(" ")}.` : "";
  }

  function clearTimer() {
    if (sim.timer) window.clearTimeout(sim.timer);
    sim.timer = null;
    $("#pause-button").disabled = true;
  }

  function setSimulatorInput(value, start = D.START) {
    clearTimer();
    $("#symbol-input").value = value;
    $("#input-error").textContent = inputValidation(value);
    sim.input = value;
    sim.start = start;
    sim.index = 0;
    sim.currentState = start;
    sim.trace = [start];
    sim.started = false;
    sim.halted = false;
    sim.deadState = null;
    sim.transitionTrace = [];
    highlightedEdges = new Set();
    $("#path-results").replaceChildren();
    renderSimulation();
    refreshHighlights();
  }

  function renderSimulation() {
    const tape = $("#tape");
    tape.innerHTML = [...sim.input].map((symbol, index) => {
      const status = index < sim.index ? "read" : index === sim.index && !sim.halted ? "current" : "";
      return `<span class="tape-symbol ${status}" aria-label="Symbol ${symbol}${status ? `, ${status}` : ""}">${esc(symbol)}</span>`;
    }).join("");
    $("#trace-line").textContent = sim.trace.map(qname).join(" → ");
    const banner = $("#result-banner");
    banner.innerHTML = "";
    if (!sim.started) {
      $("#reading-line").textContent = "Enter a string and run the DFA one symbol at a time.";
    }
    if (sim.halted) {
      const finalState = state(sim.currentState);
      if (sim.deadState !== null) {
        banner.innerHTML = `<div class="result-banner reject">REJECT: dead end — no arrow from ${qname(sim.currentState)} on ${esc(sim.input[sim.index])}.</div>`;
      } else if (D.FINALS.includes(sim.currentState)) {
        const benign = finalState.verdict === "BenignPass";
        banner.innerHTML = `<div class="result-banner accept">ACCEPT: ${esc(finalState.verdict)}${benign ? ": accepting here means a definite verdict was reached, not phishing." : ""}<br><span>${esc(D.STATE_CARDS[sim.currentState].meaning)}</span></div>`;
      } else {
        banner.innerHTML = `<div class="result-banner reject">REJECT: symbols ran out in ${qname(sim.currentState)}, which is not accepting.</div>`;
      }
    }
    if (hoveredState !== null) showStateTooltip(hoveredState, null);
    refreshHighlights();
  }

  function beginSimulation() {
    const value = $("#symbol-input").value.trim().toUpperCase();
    const error = inputValidation(value);
    $("#input-error").textContent = error;
    if (error) return false;
    setSimulatorInput(value, sim.start);
    sim.started = true;
    if (!value.length) {
      sim.halted = true;
      renderSimulation();
      return true;
    }
    return true;
  }

  function stepSimulation() {
    if (!sim.started && !beginSimulation()) return false;
    if (sim.halted) return false;
    if (sim.index >= sim.input.length) {
      sim.halted = true;
      renderSimulation();
      return false;
    }
    const symbol = sim.input[sim.index];
    const key = `${sim.currentState}:${symbol}`;
    const next = D.DELTA[key];
    if (next === undefined) {
      sim.deadState = sim.currentState;
      $("#reading-line").textContent = `Dead end: no arrow from ${qname(sim.currentState)} on ${symbol}.`;
      sim.halted = true;
      renderSimulation();
      return false;
    }
    const from = sim.currentState;
    const transition = edgeIndex(from, next, symbol);
    sim.transitionTrace.push(transition);
    animateEdge(transition);
    sim.currentState = next;
    sim.index += 1;
    sim.trace.push(next);
    sim.started = true;
    highlightedEdges = new Set(sim.transitionTrace);
    $("#reading-line").textContent = `${qname(from)} reads ${symbol} → ${qname(next)}: ${D.EDGE_READINGS[transition]}`;
    if (sim.index >= sim.input.length) sim.halted = true;
    renderSimulation();
    return !sim.halted;
  }

  function animateEdge(index) {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const path = edgePaths[index];
    if (!path) return;
    const group = getGroup(state(D.TRANSITIONS[index][1]).group);
    const dot = svgEl("circle", { r: 6, fill: group.stroke, "pointer-events": "none", class: "travelling-token" });
    const motion = svgEl("animateMotion", { dur: "550ms", path: path.getAttribute("d"), fill: "freeze" });
    dot.append(motion);
    $("#svg-viewport").append(dot);
    window.setTimeout(() => dot.remove(), 650);
  }

  $("#run-button").addEventListener("click", () => {
    if (beginSimulation()) {
      if (!sim.input.length) return;
      stepSimulation();
      while (!sim.halted) stepSimulation();
      renderSimulation();
    }
  });
  $("#step-button").addEventListener("click", () => stepSimulation());
  $("#back-button").addEventListener("click", () => {
    clearTimer();
    if (sim.deadState !== null) {
      sim.deadState = null;
      sim.halted = false;
      renderSimulation();
      return;
    }
    if (sim.index <= 0) return;
    sim.index -= 1;
    sim.trace.pop();
    sim.transitionTrace.pop();
    sim.currentState = sim.trace[sim.trace.length - 1];
    sim.halted = false;
    sim.started = true;
    highlightedEdges = new Set(sim.transitionTrace);
    renderSimulation();
  });
  $("#reset-sim-button").addEventListener("click", () => setSimulatorInput($("#symbol-input").value, D.START));
  $("#auto-run-button").addEventListener("click", () => {
    if (!sim.started && !beginSimulation()) return;
    if (sim.halted) setSimulatorInput($("#symbol-input").value, sim.start);
    if (!sim.input.length) {
      sim.started = true;
      sim.halted = true;
      renderSimulation();
      return;
    }
    $("#pause-button").disabled = false;
    const play = () => {
      if (!stepSimulation()) {
        clearTimer();
        return;
      }
      const baseDelay = 700 / Number($("#speed-input").value);
      sim.timer = window.setTimeout(play, baseDelay);
    };
    sim.timer = window.setTimeout(play, 0);
  });
  $("#pause-button").addEventListener("click", clearTimer);
  $("#speed-input").addEventListener("input", (event) => { $("#speed-value").textContent = `${event.target.value}×`; });
  $("#symbol-input").addEventListener("input", (event) => {
    const error = inputValidation(event.target.value.toUpperCase());
    $("#input-error").textContent = error;
    if (!error) setSimulatorInput(event.target.value.toUpperCase(), D.START);
  });
  $$("[data-key-symbol]").forEach((button) => button.addEventListener("click", () => {
    const input = $("#symbol-input");
    input.value += button.dataset.keySymbol;
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.focus();
  }));
  $("[data-key-backspace]").addEventListener("click", () => {
    const input = $("#symbol-input");
    input.value = input.value.slice(0, -1);
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.focus();
  });
  $("[data-key-clear]").addEventListener("click", () => setSimulatorInput("", D.START));
  $$("[data-fill]").forEach((button) => button.addEventListener("click", () => {
    document.querySelector('[data-tab="symbol-tool"]').click();
    setSimulatorInput(button.dataset.fill, D.START);
    if (button.hasAttribute("data-scroll-sim")) $("#simulator").scrollIntoView({ behavior: "smooth", block: "center" });
  }));
  $$("[data-tab]").forEach((tab) => tab.addEventListener("click", () => {
    $$("[data-tab]").forEach((entry) => {
      const active = entry === tab;
      entry.classList.toggle("active", active);
      entry.setAttribute("aria-selected", String(active));
    });
    $$(".tab-panel").forEach((panel) => { panel.hidden = panel.id !== tab.dataset.tab; });
  }));
  $("[data-load-example]").addEventListener("click", () => {
    document.querySelector('[data-tab="symbol-tool"]').click();
    setSimulatorInput("SPBAYX", D.START);
    $("#simulator").scrollIntoView({ behavior: "smooth", block: "center" });
  });

  function getSymbolMeaning(symbol) {
    return D.SYMBOL_MEANINGS[symbol]?.meaning || "End of URL.";
  }

  function tokenizeUrl(value) {
    const tokens = [];
    const text = value.trim();
    if (!text) return { symbols: "", tokens, error: "Enter a URL to parse." };
    const schemeMatch = text.match(/^([a-z][a-z\d+.-]*):\/\//i);
    if (!schemeMatch) {
      return { symbols: "", tokens, url: text, parsed: false, error: "" };
    }
    if (!/^https?$/i.test(schemeMatch[1])) {
      return { symbols: "", tokens, url: text, parsed: false, error: "" };
    }
    let parsed;
    try {
      parsed = new URL(text);
      if (!parsed.hostname) throw new TypeError("URL has no host");
    } catch (error) {
      return { symbols: "Z", tokens: [{ piece: text, symbol: "Z", meaning: getSymbolMeaning("Z") }], url: text, parsed: false, error: "" };
    }

    const emit = (piece, symbol, meaning) => {
      tokens.push({ piece, symbol, meaning: meaning || getSymbolMeaning(symbol) });
    };
    emit(`${schemeMatch[1].toLowerCase()}://`, "S", "scheme parsed (URL_PARSED)");
    const host = parsed.hostname.toLowerCase();
    const hostLabels = host.split(".");
    const ipAddress = /^\d{1,3}(?:\.\d{1,3}){3}$/.test(host) || host.includes(":");
    if (ipAddress || host.includes("xn--") || hostLabels.length >= 4) {
      emit(host, "H", "optional host-inspection token (abnormal or deeply nested host)");
    }
    const platforms = ["vercel.app", "netlify.app", "github.io", "pages.dev", "herokuapp.com", "web.app", "firebaseapp.com", "onrender.com", "glitch.me", "workers.dev"];
    const hostClass = platforms.some((domain) => host === domain || host.endsWith(`.${domain}`)) ? "P" : "G";
    emit(host, hostClass, hostClass === "P" ? "PaaS / hosting-platform host (PLATFORM_HOST)" : "ordinary generic host (GENERIC_HOST)");

    const brandWords = ["paypal", "amazon", "google", "microsoft", "apple", "netflix", "facebook", "instagram", "bank", "brand", "dhl", "fedex", "sbi", "hdfc", "icici"];
    const actionWords = ["login", "signin", "verify", "secure", "account", "update", "password"];
    const urgencyWords = ["urgent", "suspended", "immediately", "alert", "expire", "limited"];
    const downloadWords = ["download", "exe", "apk", "msi", "setup", "install"];
    const payloadWords = ["redirect", "payload", "zip", "scr", "r", "go"];
    const confirmationWords = ["confirm", "validate", "recover"];
    const fullPath = `${parsed.pathname}${parsed.search}`.toLowerCase();
    const hasConfirmationPhrase = /verify-account|confirm|validate|recover/.test(fullPath);
    const subdomainLabels = hostLabels.slice(0, Math.max(0, hostLabels.length - 2))
      .flatMap((label) => label.split(/[-_]+/));
    const hostBrand = subdomainLabels.find((word) => brandWords.includes(word));
    const hostAction = subdomainLabels.find((word) => actionWords.includes(word));
    const pathPieces = `${parsed.pathname}${parsed.search}`.split(/[\/.?=&_-]+/).filter(Boolean).map((word) => word.toLowerCase());
    const meaningful = [];

    if (hostBrand) meaningful.push({ piece: hostBrand, symbol: "B", meaning: "brand-like token (BRAND_LIKE_TOKEN)" });
    if (hostAction && !(hostAction === "verify" && hasConfirmationPhrase)) meaningful.push({ piece: hostAction, symbol: "A", meaning: "credential / verify action (VERIFY_ACTION)" });
    for (const word of pathPieces) {
      if (brandWords.includes(word)) meaningful.push({ piece: word, symbol: "B", meaning: "brand-like token (BRAND_LIKE_TOKEN)" });
      else if (actionWords.includes(word) && !(hostClass === "P" && hasConfirmationPhrase && ["verify", "account", "confirm", "validate", "recover"].includes(word))) meaningful.push({ piece: word, symbol: "A", meaning: "credential / verify action (VERIFY_ACTION)" });
      else if (urgencyWords.includes(word)) meaningful.push({ piece: word, symbol: "U", meaning: "urgency / pressure cue" });
      else if (downloadWords.includes(word)) meaningful.push({ piece: word, symbol: "E", meaning: "download / executable lure" });
      else if (payloadWords.includes(word)) meaningful.push({ piece: word, symbol: "R", meaning: "payload / redirect cue" });
    }

    const hasBrand = meaningful.some((token) => token.symbol === "B");
    const hasAction = meaningful.some((token) => token.symbol === "A");
    const hasUrgency = meaningful.some((token) => token.symbol === "U");
    const hasLure = meaningful.some((token) => token.symbol === "E");
    const hasPayload = meaningful.some((token) => token.symbol === "R");

    if (hostClass === "P") {
      if (hasBrand) emit(meaningful.find((token) => token.symbol === "B").piece, "B", "brand-like token (BRAND_LIKE_TOKEN)");
      if (hasAction) emit(meaningful.find((token) => token.symbol === "A").piece, "A", "credential / verify action (VERIFY_ACTION)");
      if (hasConfirmationPhrase && hasAction) emit("verify-account", "Y", "confirming cue: the risk condition is satisfied");
      else {
        if (hasUrgency) emit(meaningful.find((token) => token.symbol === "U").piece, "U");
        if (hasLure) emit(meaningful.find((token) => token.symbol === "E").piece, "E");
        if (hasPayload) emit(meaningful.find((token) => token.symbol === "R").piece, "R");
      }
    } else if (hasUrgency && hasLure && hasPayload) {
      for (const symbol of ["U", "E", "R"]) {
        const token = meaningful.find((entry) => entry.symbol === symbol);
        emit(token.piece, symbol);
      }
    } else if (hasBrand && hasAction) {
      emit(meaningful.find((token) => token.symbol === "B").piece, "B", "brand-like token (BRAND_LIKE_TOKEN)");
      emit(meaningful.find((token) => token.symbol === "A").piece, "A", "credential / verify action (VERIFY_ACTION)");
      emit("brand mismatch", "Q", "brand mismatch on a generic host");
    } else if (meaningful.length) {
      meaningful.forEach((token) => emit(token.piece, token.symbol, token.meaning));
    } else {
      const pathPiece = parsed.pathname.split("/").filter(Boolean).join("/") || "neutral path";
      emit(pathPiece, "N", "ordinary path content with no risky pattern");
    }

    const withoutAdjacentDuplicates = tokens.filter((token, index) =>
      index === 0 || token.symbol !== tokens[index - 1].symbol
    );
    tokens.splice(0, tokens.length, ...withoutAdjacentDuplicates);
    const sequence = tokens.map((token) => token.symbol);
    const lureIndex = sequence.indexOf("E");
    const payloadIndex = sequence.lastIndexOf("R");
    const hasMalwareSequence = lureIndex !== -1 && payloadIndex > lureIndex;
    emit("end of URL", "X", "terminator: nothing more to read");
    if (hasMalwareSequence) emit("second end marker", "X", "second terminator for the malware branch");
    const resultSymbols = tokens.map((token) => token.symbol);
    return { symbols: resultSymbols.join(""), tokens, url: text, parsed: true, error: "" };
  }

  function renderTokenTable(result) {
    if (!result.tokens.length) {
      $("#token-table-wrap").innerHTML = `<p class="small-note">${result.parsed === false && !result.symbols ? "No symbol was emitted for the missing or invalid scheme; the DFA will reject at q0." : "No URL tokens to display."}</p>`;
    } else {
      $("#token-table-wrap").innerHTML = `<div class="table-wrap"><table class="token-table"><thead><tr><th>URL piece</th><th>Symbol</th><th>Meaning</th></tr></thead><tbody>${result.tokens.map((token) => {
        const group = token.symbol === "X" ? "front" : token.symbol === "Z" ? "error" : D.STATES.find((item) => (D.STATE_CARDS[item.id].outgoing || []).some((entry) => entry.startsWith(`${token.symbol} →`)))?.group || "front";
        return `<tr><td class="mono">${esc(token.piece)}</td><td><span class="symbol-chip" style="${tintStyle(group)}">${token.symbol}</span></td><td>${esc(token.meaning)}</td></tr>`;
      }).join("")}</tbody></table></div>`;
    }
    $("#token-string").textContent = [...result.symbols].join(" ") || "(empty)";
  }

  function updateLivePipeline(result, verdict) {
    $$("[data-live-url]").forEach((el) => { el.textContent = result.url || "URL not supplied"; });
    $$("[data-live-symbols]").forEach((el) => { el.textContent = [...result.symbols].join(" ") || "(empty)"; });
    $$("[data-live-verdict]").forEach((el) => { el.textContent = verdict || "Ready to run"; });
    const rows = $("#live-token-rows");
    if (rows && result.tokens.length) {
      rows.innerHTML = result.tokens.map((token) => `<tr><td>${esc(token.piece)}</td><td><strong>${token.symbol}</strong></td><td>${esc(token.meaning)}</td></tr>`).join("");
    }
    const path = verdict && result.runResult ? result.runResult.trace.map((id) => state(id)?.name).join(" → ") : "";
    const resultLine = $("[data-live-result]");
    if (resultLine && result.runResult) {
      resultLine.innerHTML = result.runResult.accepted
        ? `<strong>Result:</strong> ${esc(result.symbols)} drives the DFA along ${esc(path)}, an accepting state, so the verdict is ${esc(state(result.runResult.stoppedAt).verdict)}.`
        : `<strong>Result:</strong> ${esc(result.symbols || "(empty)")} is rejected: ${esc(result.runResult.reason)}.`;
    }
  }

  let lastTokenized = tokenizeUrl($("#url-input").value);
  renderTokenTable(lastTokenized);
  $("#check-url-button").addEventListener("click", () => {
    const result = tokenizeUrl($("#url-input").value);
    $("#url-error").textContent = result.error;
    lastTokenized = result;
    renderTokenTable(result);
    const runResult = D.run(D.DELTA, D.FINALS, result.symbols, D.START);
    result.runResult = runResult;
    const finalState = state(runResult.stoppedAt);
    const verdictText = runResult.accepted ? finalState.verdict : "reject";
    updateLivePipeline(result, verdictText);
    if (runResult.accepted) {
      $("#url-verdict").innerHTML = `<div class="result-banner accept">ACCEPT: ${esc(finalState.verdict)}<br><span>${esc(D.STATE_CARDS[runResult.stoppedAt].meaning)}</span></div>`;
    } else {
      $("#url-verdict").innerHTML = `<div class="result-banner reject">REJECT: No configured pattern matched, so this URL is not flagged by this DFA. ${esc(runResult.reason)}. Trace: ${esc(runResult.trace.map(qname).join(" → "))}</div>`;
    }
  });
  $$("[data-sample-url]").forEach((button) => button.addEventListener("click", () => {
    $("#url-input").value = button.dataset.sampleUrl;
    $("#check-url-button").click();
  }));
  $("#run-token-string").addEventListener("click", () => {
    document.querySelector('[data-tab="symbol-tool"]').click();
    setSimulatorInput(lastTokenized.symbols, D.START);
    $("#simulator").scrollIntoView({ behavior: "smooth", block: "center" });
  });
  $("#url-input").addEventListener("keydown", (event) => {
    if (event.key === "Enter") $("#check-url-button").click();
  });

  $$("[data-state-jump]").forEach((element) => {
    const activate = () => {
      const id = Number(element.dataset.stateJump);
      $("#section-4").scrollIntoView({ behavior: "smooth", block: "start" });
      selectState(id);
    };
    element.addEventListener("click", activate);
    element.addEventListener("keydown", (event) => {
      if ((event.key === "Enter" || event.key === " ") && element.tagName !== "BUTTON") {
        event.preventDefault();
        activate();
      }
    });
  });

  $("#transition-filter").addEventListener("input", (event) => {
    const filter = event.target.value.toLowerCase().trim();
    $$("[data-edge-row]").forEach((row) => { row.hidden = filter && !row.dataset.search.includes(filter); });
  });
  $("#transition-table").addEventListener("pointerover", (event) => {
    const row = event.target.closest("[data-edge-row]");
    if (!row) return;
    highlightedEdges = new Set([Number(row.dataset.edgeRow)]);
    refreshHighlights();
  });
  $("#transition-table").addEventListener("pointerleave", () => {
    highlightedEdges = new Set(pinnedEdge === null ? [] : [pinnedEdge]);
    refreshHighlights();
  });
  $("#transition-table").addEventListener("click", (event) => {
    const heading = event.target.closest("[data-sort-column]");
    if (heading) {
      sortTransitionRows(heading);
      return;
    }
    const row = event.target.closest("[data-edge-row]");
    if (row) jumpToTransition(Number(row.dataset.edgeRow));
  });
  $("#transition-table thead").addEventListener("keydown", (event) => {
    const heading = event.target.closest("[data-sort-column]");
    if (heading && (event.key === "Enter" || event.key === " ")) {
      event.preventDefault();
      sortTransitionRows(heading);
    }
  });
  function sortTransitionRows(heading) {
    const column = heading.dataset.sortColumn;
    const descending = heading.dataset.direction !== "descending";
    $$("[data-sort-column]", heading.parentElement).forEach((cell) => {
      cell.dataset.direction = "";
      cell.removeAttribute("aria-sort");
    });
    heading.dataset.direction = descending ? "descending" : "ascending";
    heading.setAttribute("aria-sort", descending ? "descending" : "ascending");
    const rows = $$("[data-edge-row]", $("#transition-table tbody"));
    rows.sort((left, right) => {
      const a = left.dataset[column];
      const b = right.dataset[column];
      const order = column === "number" ? Number(a) - Number(b) : a.localeCompare(b, undefined, { numeric: true });
      return descending ? -order : order;
    });
    rows.forEach((row) => $("#transition-table tbody").append(row));
  }
  $("#transition-matrix").addEventListener("pointerover", (event) => {
    const cell = event.target.closest("[data-edge-ref]");
    if (!cell) return;
    highlightedEdges = new Set([Number(cell.dataset.edgeRef)]);
    refreshHighlights();
  });
  $("#transition-matrix").addEventListener("pointerleave", () => {
    highlightedEdges = new Set(pinnedEdge === null ? [] : [pinnedEdge]);
    refreshHighlights();
  });
  $("#transition-matrix").addEventListener("click", (event) => {
    const cell = event.target.closest("[data-edge-ref]");
    if (!cell) return;
    pinnedEdge = Number(cell.dataset.edgeRef);
    highlightedEdges = new Set([pinnedEdge]);
    $$(".matrix td.pinned").forEach((entry) => entry.classList.remove("pinned"));
    cell.classList.add("pinned");
    refreshHighlights();
  });
  $$("[data-symbol-highlight]").forEach((button) => button.addEventListener("click", () => {
    const symbol = button.dataset.symbolHighlight;
    highlightedEdges = new Set(D.TRANSITIONS.map((entry, index) => entry[2] === symbol ? index : -1).filter((index) => index >= 0));
    pinnedEdge = null;
    refreshHighlights();
    $("#section-4").scrollIntoView({ behavior: "smooth", block: "start" });
  }));

  createContextMenu();
  $("#state-context-menu").addEventListener("click", async (event) => {
    const button = event.target.closest("[data-context-action]");
    if (!button) return;
    const id = Number($("#state-context-menu").dataset.state);
    const action = button.dataset.contextAction;
    $("#state-context-menu").style.display = "none";
    if (action === "card") selectState(id);
    if (action === "incoming" || action === "outgoing") highlightStateEdges(id, action);
    if (action === "shortest") showPathTo(id);
    if (action === "copy") {
      const info = `${stateTitle(id)}\n${D.STATE_CARDS[id].meaning}\nReached by: ${D.STATE_CARDS[id].reachedBy}\nOutgoing: ${D.STATE_CARDS[id].outgoing.join("; ") || "none"}`;
      try {
        await navigator.clipboard.writeText(info);
        notify("State information copied.");
      } catch (error) {
        notify("Clipboard access is unavailable here. Select the state card to copy its information manually.");
      }
    }
  });

  $("#run-all-tests").addEventListener("click", () => {
    let passed = 0;
    D.TEST_CASES.forEach((test) => {
      const actual = D.run(D.DELTA, D.FINALS, test.input, D.START);
      const okay = actual.accepted === test.accepted && actual.trace.join(",") === test.trace.join(",");
      const cell = $(`[data-test-row="${test.input}"] .test-check`);
      cell.textContent = okay ? "✓ Match" : `✗ Expected ${test.accepted ? "accept" : "reject"}`;
      cell.className = `test-check ${okay ? "accepted-label" : "rejected-label"}`;
      if (okay) passed += 1;
    });
    $("#test-summary").textContent = `${passed}/${D.TEST_CASES.length} match expectations`;
  });

  $("#determinism-check").addEventListener("click", () => {
    const keys = D.TRANSITIONS.map(([from, , symbol]) => `${from}:${symbol}`);
    const unique = new Set(keys).size;
    const starts = D.STATES.filter((item) => item.initial).length;
    const lambdaMoves = D.TRANSITIONS.filter(([, , symbol]) => symbol === "λ" || symbol === "").length;
    const duplicates = keys.length - unique;
    $("#determinism-result").textContent = `${D.TRANSITIONS.length} transitions, ${unique} distinct pairs, ${duplicates} duplicates, ${lambdaMoves} λ-moves, ${starts} start state`;
  });
  $$("[data-scroll-complete]").forEach((button) => button.addEventListener("click", () => {
    $("#section-4").scrollIntoView({ behavior: "smooth", block: "start" });
    $("#complete-toggle").focus({ preventScroll: true });
    $("#complete-toggle").checked = true;
    drawImplicitRejects(true);
  }));

  $("#qa-search").addEventListener("input", (event) => {
    const query = event.target.value.toLowerCase().trim();
    $$(".qa-item").forEach((item) => {
      item.hidden = query && !`${item.dataset.question} ${item.dataset.answer}`.includes(query);
    });
  });
  $("#practice-mode").addEventListener("change", (event) => {
    $$(".qa-item").forEach((item) => {
      const answer = $(".qa-answer", item);
      const reveal = $(".qa-reveal", item);
      answer.hidden = event.target.checked;
      reveal.hidden = !event.target.checked;
      reveal.textContent = "Reveal answer";
    });
  });
  $$(".qa-reveal").forEach((button) => button.addEventListener("click", () => {
    const answer = $(".qa-answer", button.closest(".qa-item"));
    const visible = answer.hidden;
    answer.hidden = !visible;
    button.textContent = visible ? "Hide answer" : "Reveal answer";
  }));
  $("#random-question").addEventListener("click", () => {
    const visible = $$(".qa-item").filter((item) => !item.hidden);
    if (!visible.length) return;
    const chosen = visible[Math.floor(Math.random() * visible.length)];
    chosen.querySelector("details").open = true;
    chosen.scrollIntoView({ behavior: "smooth", block: "center" });
    if ($("#practice-mode").checked) {
      const answer = $(".qa-answer", chosen);
      answer.hidden = false;
      $(".qa-reveal", chosen).textContent = "Hide answer";
    }
  });

  $("#print-cheat-sheet").addEventListener("click", () => {
    document.body.classList.add("print-cheat-sheet");
    window.print();
  });
  window.addEventListener("afterprint", () => document.body.classList.remove("print-cheat-sheet"));
  $$("[data-copy-code]").forEach((button) => button.addEventListener("click", async () => {
    const text = $("code", button.parentElement).textContent;
    try {
      await navigator.clipboard.writeText(text);
      notify("Code copied.");
    } catch (error) {
      notify("Clipboard access is unavailable here. Select the code block and copy it manually.");
    }
  }));

  function notify(message) {
    let toast = $("#toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "toast";
      toast.className = "toast";
      toast.setAttribute("role", "status");
      document.body.append(toast);
    }
    toast.textContent = message;
    toast.hidden = false;
    window.clearTimeout(notify.timer);
    notify.timer = window.setTimeout(() => { toast.hidden = true; }, 2600);
  }

  const observer = new IntersectionObserver((entries) => {
    const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (!visible) return;
    $$(".nav-link").forEach((link) => link.classList.toggle("active", link.dataset.sectionLink === visible.target.id.replace("section-", "")));
  }, { rootMargin: "-15% 0px -70% 0px", threshold: [0, .2, .5] });
  $$(".section-card").forEach((section) => observer.observe(section));

  window.addEventListener("resize", () => {
    if (window.innerWidth < 760 && zoom.scale > 1.6) {
      zoom.scale = 1.6;
      applyZoom();
    }
  });
  setSimulatorInput("", D.START);
  $("#url-input").dispatchEvent(new Event("input"));
  $("#check-url-button").click();
})();
