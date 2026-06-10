# Advisor v2 — Canvas-Fused Network Consultant

Date: 2026-06-10. Approved by Micah in session.

## Goal

Upgrade the Advisor from a findings side panel into a consultative experience
fused with the Topo canvas. Differentiators over Datadog-class advisory tools:
before/after fix preview on the canvas, one-click and stepped remediation,
what-if failure simulation, and a generated consultant narrative. All mock
functionality is real computation over the in-browser topology; persistence is
localStorage, consistent with the POC.

## Components

### 1. Engine extensions (`advisor/advisorEngine.ts`)
- `applyFix` is refactored to a pure function: `(fix, nodes, edges) ->
  { nodes, edges, addedNodeIds, addedEdgeIds, changedEdgeIds }`. Apply and
  preview share this one code path. The existing caller commits the result;
  preview renders it as ghosts.
- `scoreFixImpact(fix, nodes, edges, baseline)`: clones the topology, applies
  the fix, re-runs `runAdvisor`, returns per-dimension score deltas and
  monthly-cost delta. Every finding carries real numbers.

### 2. `advisor/failureSim.ts`
`simulateFailure(nodeId, nodes, edges)` removes the node, BFS from every
remaining node, returns `{ unreachableNodeIds, deadEdgeIds, downSites,
isArticulation, summary }`. Summary is one plain sentence used by the
narrative voice.

### 3. `advisor/narrative.ts`
`composeNarrative(assessment, findings, nodes, edges)`: deterministic
template composition (seeded by topology hash so wording varies between
networks, stays stable for the same one). Consultant-memo tone, 2–3 short
paragraphs: posture, sharpest risk, cost stance. No em dashes.

### 4. `advisor/scoreHistory.ts`
Append `{ timestamp, grade, scores, monthlyCost }` per run to
`cloud-designer:advisor-history` (capped at 40 entries, keyed alongside the
design). Exposes data for the header sparkline.

### 5. Canvas integration (`Canvas.tsx`, `Node.tsx`)
- New `ghostOverlay` prop: `{ nodes, edges }` rendered dashed green at 60%
  opacity with a gentle pulse, above regular content, below chrome.
- New `issueBadges` prop: `Map<nodeId, severity>` renders a small severity
  dot on affected node cards (error red / warning orange per Figma legend).
- Existing `dimmedNodeIds` + highlight machinery provides finding spotlight.
- Failure sim paints `deadNodeIds`/`deadEdgeIds` in error red + dimmed rest.

### 6. AdvisorPanel v2 (three tabs)
- **Assess**: grade ring (animated sweep), four dimension bars
  (Resilience / Security / Performance / Cost) with deltas vs previous run,
  sparkline from score history, narrative with typewriter reveal, findings
  list. Each finding: click = spotlight, Preview = ghost fix + floating
  delta chip (cost + dimension deltas), Apply = commit, Esc = cancel ghost.
- **Plan**: fixes ordered by score-gain-per-dollar, cumulative projection
  ("after step 3: B+ and +$1,240/mo"), Apply-all stepper that applies fixes
  one at a time with a short pause so the canvas visibly heals.
- **Simulate**: node picker (or click a node while tab active), Simulate
  failure renders blast radius on canvas, lists downed sites and a narrative
  verdict. Reset exits cleanly.

## Data flow

NetworkDesigner owns `advisorPreview` (fix + ghost state) and `simState`.
Preview/sim are exclusive: starting one clears the other. Apply routes through
the existing `handleApplyFix` (now consuming the pure applyFix result).
Advisor auto re-run effect (existing) refreshes assessment after each apply,
which appends to score history and regenerates the narrative.

## Out of scope

Real LLM calls, server persistence, the Last Mile wizard, Pano/Infra advisor
surfaces (Topo only for v2).

## Verification

Browser walk per CLAUDE.md: import sample topology, run advisor, click
findings (spotlight), preview + apply a fix (ghost then commit), apply-all
playbook, simulate failure of the hub router, refresh page (history and
assessment survive), undo still works.
