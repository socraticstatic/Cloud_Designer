// UI chrome-overlap audit for the Cloud Designer canvas.
//
// Canvas content (nodes, group chips, group containers) must never overlap
// the floating chrome (toolbar, status bar, name pill, filter, mode pill,
// rails, advisor dock, legend). Paste this whole file into the browser
// console - or evaluate it via CDP - with the Topo view open. It returns
// { pass, violations } and is safe to run repeatedly in any UI state
// (advisor open or closed, any zoom).
//
// Referenced by docs/UX_AUDIT_PLAN.md. Run after any change that touches
// canvas layout, chrome, node placement, or the advisor dock.

(() => {
  const intersect = (a, b, tolerance = 3) => {
    const w = Math.min(a.right, b.right) - Math.max(a.left, b.left);
    const h = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
    return w > tolerance && h > tolerance ? { w: Math.round(w), h: Math.round(h) } : null;
  };
  const label = (el) => (el.textContent || el.getAttribute('aria-label') || el.title || el.className || '?')
    .trim().replace(/\s+/g, ' ').slice(0, 36);

  // --- Chrome: everything floating above the canvas content ---
  const chrome = [];
  document.querySelectorAll('div, nav').forEach(el => {
    const z = parseInt(getComputedStyle(el).zIndex, 10);
    if (z >= 80 && z < 200 && el.getBoundingClientRect().width > 0) {
      // skip wrappers that fully contain other chrome (avoid double count)
      chrome.push(el);
    }
  });

  // --- Canvas content ---
  const content = [];
  document.querySelectorAll('.node-enter').forEach(el => content.push({ kind: 'node', el }));
  // group chips: colored site labels (drag handles) and dashed containers
  document.querySelectorAll('[title="Drag to move site - click to edit"], [style*="dashed"]').forEach(el => {
    content.push({ kind: el.getAttribute('style')?.includes('dashed') ? 'group-container' : 'group-chip', el });
  });

  const violations = [];
  content.forEach(({ kind, el }) => {
    const r = el.getBoundingClientRect();
    if (r.width === 0) return;
    chrome.forEach(c => {
      if (c.contains(el) || el.contains(c)) return;
      const hit = intersect(r, c.getBoundingClientRect());
      if (hit) {
        violations.push({
          content: `${kind}: ${label(el)}`,
          chrome: label(c),
          overlap: hit
        });
      }
    });
  });

  // Intra-node pass: no two text elements inside one node may superimpose
  document.querySelectorAll('.node-enter').forEach(node => {
    const leaves = [...node.querySelectorAll('span, button, div')]
      .filter(c => (c.textContent || '').trim() && c.children.length === 0)
      .map(c => ({ text: c.textContent.trim().slice(0, 16), r: c.getBoundingClientRect() }))
      .filter(t => t.r.width > 0 && t.r.height > 0);
    for (let i = 0; i < leaves.length; i++) {
      for (let j = i + 1; j < leaves.length; j++) {
        const hit = intersect(leaves[i].r, leaves[j].r, 2);
        if (hit) {
          violations.push({ content: `node label "${leaves[i].text}"`, chrome: `node label "${leaves[j].text}"`, overlap: hit });
        }
      }
    }
  });

  const result = { pass: violations.length === 0, checked: { content: content.length, chrome: chrome.length }, violations };
  console.table(violations);
  return JSON.stringify(result, null, 1);
})();
