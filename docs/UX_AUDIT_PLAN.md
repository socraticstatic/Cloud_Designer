# Cloud Designer - End-to-End UX Audit Plan

Run this audit on every release candidate. Two passes, always: **functional**
(does the flow complete) and **fidelity** (does it match the SDCI Figma frames).
A flow is not done unless both pass.

## Reference sources

- Figma file `SDCI` (key `Z2DZTBbatSi8miUWWf5g7B`), section **Concepts & Future**:
  - `6985:55403` Network Designer | Nodes - node/edge state machine + legend
  - `6985:54000` Draft | Network Designer - draft lifecycle, chrome, manage cards
  - `5705:13668` Pano frame - map, marker chips, bottom pill, zoom rail
- Design tokens: `fw-*` (att-flywheel-kit) - no hardcoded colors in new UI

## Viewport matrix

Test every flow at: **1920x1080** (Figma reference), **1280x800**, **1120x900**
(narrow desktop). Chrome must never escape the canvas; toolbar collapses to
icon-only below xl; nothing overlaps the name pill or Read/Edit pill.

## Z-index layer contract (src/constants Z_INDEX)

| Layer | Value | Owners |
|---|---|---|
| BACKGROUND / GRID | 1-2 | canvas wash, dotted grid |
| CANVAS_CONTENT | 5 | canvas root, location groups |
| EDGES | 10 | edge SVG layer |
| EDGE_CONTROLS | 15 | gear chips (16 selected) |
| NODES | 20 | node layer |
| CHROME | 80 | toolbar, stats pill, rail, legend, Read/Edit |
| FLOATING_PANEL | 90 | advisor, config panels, name pill + switcher |
| MODAL | 100 | welcome, templates, save-template, import, simulation, map panels |
| NOTIFICATIONS | 200 | toasts (always above modals) |

Audit rule: grep for `zIndex`/`z-[` outside this scale fails the build review.

## Core journeys (functional pass)

1. **Cold start -> first design**: clear localStorage, load app. Welcome modal
   shows 4 paths. Create -> name router -> AT&T Core + router on canvas,
   auto-connected, DRAFT tag. Refresh: design survives.
2. **Import -> advise -> remediate**: Import (toolbar upload) -> sample JSON ->
   parse summary -> Import & analyze. Advisor opens with grade + cost.
   Click finding -> canvas highlight in severity color. Apply fix (encryption,
   resilience, redundant node, firewall) -> topology mutates, grade improves,
   badge count drops. Refresh: assessment + topology survive.
3. **Design lifecycle**: edit -> DRAFT tag. Save updates -> SAVED (green).
   Any edit -> DRAFT again. Switcher lists design with counts; Create New
   Connection -> clean slate; switch back -> exact restore.
4. **Tri-view consistency**: same node/edge/active counts in Topo, Pano, Infra.
   Same per-link latency in edge panel, Pano regional averages, Infra circuits
   table. Inactive links: dashed in Topo, dashes in circuits table.
5. **Pano**: markers at plausible geo (created nodes included), labeled chips,
   marker click -> in-place details card (no view yank), card actions drill to
   Topo. Regional Performance + Business Insights derive from live topology.
   Zoom % readout updates.
6. **Infra**: Topology/Circuits/Rack toggle; device click -> details panel;
   rack ports expand; stats bar live.
7. **Simulation**: run -> progress, fault injection (latency/loss/bandwidth)
   applies live; completes with summary.
8. **Export**: PDF (with metadata + diagram-only) downloads and opens.

## Fidelity pass (against frames)

- Edges: clean lines, no mid-line tags, no arrowheads; legend colors only
  (active green #2D7E24, error #C70032, warn #EA712F, dashed = unconfigured)
- Nodes: 64px white/tinted cards, status dot top-right, region sublabel
  (never duplicating the name), magenta cloud router, cobalt core
- Chrome: stats pill = bandwidth | nodes | connections | active | refresh
  (nothing else); toolbar labels match frames verbatim ("Templates");
  Save updates CTA rounded-full cobalt; rail = slim, headerless
- Location groups: city chip + dashed tinted container
- Map: light-gray Carto base, thin neutral lines, chip markers

## Interaction quality bar

- Escape closes switcher / import modal / clears finding focus
- Every closable surface has a visible close affordance
- Hover states on all interactive elements; focus-visible rings (Flywheel spec)
- Toasts never cover the advisor panel's action area for more than 4s
- No console errors or React warnings during any journey

## Known accepted deviations

- Optical light/loss in circuits table is Infra-only synthetic detail
- Regional metrics are mock telemetry (deterministic, hash-seeded)
- Manage/Monitor/Configure nav are scope-explaining toasts (POC boundary)

## Chrome-overlap audit (automated)

Canvas content (nodes, group chips, group containers) must never rest
overlapping the floating chrome (toolbar, status bar, name pill, filter,
mode pill, rails, advisor dock, legend). `scripts/ui-chrome-audit.js`
checks every pair: paste it into the browser console (or evaluate via
CDP) with the Topo view open. Run it in BOTH states - advisor closed and
open - after any change touching canvas layout, chrome, node placement,
or the dock. It returns `{ pass, violations }`; a failing pair names the
content element, the chrome element, and the overlap size.
