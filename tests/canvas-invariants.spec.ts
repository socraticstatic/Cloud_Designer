// Canvas interaction invariants. These exist because each one was a real
// shipped bug: drag runaway (stale closure), nodes resting overlapped,
// canvas content buried under floating chrome, group chips under the
// status bar. Every test drives the UI with real mouse input.

import { test, expect, Page } from '@playwright/test';

// Resting-envelope rule (mirror of src/utils/nodeLayout.ts)
const MIN_GAP_X = 150;
const MIN_GAP_Y = 155;

const FIXTURE = {
  name: 'Test Topology',
  nodes: [
    { id: 'n-core', type: 'network', x: 300, y: 250, name: 'AT&T Core', status: 'inactive', config: { networkType: 'at&t core', provider: 'AT&T', city: 'Dallas', configured: true } },
    { id: 'n-router', type: 'function', functionType: 'Router', x: 600, y: 250, name: 'HubRouter', status: 'inactive', config: { routerType: 'cloud', city: 'Dallas', configured: true } },
    { id: 'n-aws', type: 'destination', cloudProvider: 'AWS', x: 900, y: 250, name: 'AWS', status: 'inactive', config: { provider: 'AWS', configured: true } },
    { id: 'n-azure', type: 'destination', cloudProvider: 'Azure', x: 600, y: 450, name: 'Azure', status: 'inactive', config: { provider: 'Azure', configured: true } },
    { id: 'n-fw', type: 'function', functionType: 'Firewall', x: 900, y: 450, name: 'Firewall', status: 'inactive', config: { city: 'Dallas', configured: true } }
  ],
  edges: [
    { id: 'e1', source: 'n-core', target: 'n-router', type: 'MPLS', bandwidth: '10 Gbps', status: 'inactive', config: {} },
    { id: 'e2', source: 'n-router', target: 'n-aws', type: 'Direct Connect', bandwidth: '10 Gbps', status: 'inactive', config: {} },
    { id: 'e3', source: 'n-router', target: 'n-azure', type: 'ExpressRoute', bandwidth: '10 Gbps', status: 'inactive', config: {} },
    { id: 'e4', source: 'n-router', target: 'n-fw', type: 'Ethernet', bandwidth: '10 Gbps', status: 'inactive', config: {} }
  ]
};

async function openDesigner(page: Page) {
  await page.addInitScript((fixture) => {
    localStorage.setItem('cloud-designer:topology', JSON.stringify(fixture));
  }, FIXTURE);
  await page.goto('/');
  await expect(page.locator('.node-enter')).toHaveCount(FIXTURE.nodes.length);
}

const nodeByName = (page: Page, name: string) =>
  page.locator('.node-enter').filter({ hasText: name }).first();

async function logicalPositions(page: Page) {
  return page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>('.node-enter')].map(el => {
      const m = el.style.transform.match(/translate\(([-\d.]+)px, ([-\d.]+)px\)/)!;
      return { name: el.textContent!.slice(0, 20), x: parseFloat(m[1]), y: parseFloat(m[2]) };
    })
  );
}

function assertNoRestingOverlaps(positions: { name: string; x: number; y: number }[]) {
  for (let i = 0; i < positions.length; i++) {
    for (let j = i + 1; j < positions.length; j++) {
      const dx = Math.abs(positions[i].x - positions[j].x);
      const dy = Math.abs(positions[i].y - positions[j].y);
      expect(
        dx >= MIN_GAP_X || dy >= MIN_GAP_Y,
        `${positions[i].name} and ${positions[j].name} rest too close (dx=${dx}, dy=${dy})`
      ).toBe(true);
    }
  }
}

test('click and hold without moving does not move the node', async ({ page }) => {
  await openDesigner(page);
  const node = nodeByName(page, 'Firewall');
  const before = await node.boundingBox();
  await page.mouse.move(before!.x + 30, before!.y + 30);
  await page.mouse.down();
  await page.waitForTimeout(600);
  await page.mouse.up();
  await page.waitForTimeout(300);
  const after = await node.boundingBox();
  expect(Math.abs(after!.x - before!.x)).toBeLessThan(2);
  expect(Math.abs(after!.y - before!.y)).toBeLessThan(2);
});

test('slow deliberate drag tracks the cursor 1:1', async ({ page }) => {
  await openDesigner(page);
  const node = nodeByName(page, 'Firewall');
  const before = await node.boundingBox();
  const sx = before!.x + 30, sy = before!.y + 30;
  await page.mouse.move(sx, sy);
  await page.mouse.down();
  // target must be clear of every other node's envelope, or the (correct)
  // drop-resolution will move it and mask what this test measures
  await page.mouse.move(sx + 200, sy - 60, { steps: 15 });
  await page.mouse.up();
  await page.waitForTimeout(400);
  const after = await node.boundingBox();
  // grid snap is 20px; anything beyond ~30px deviation means broken math
  expect(Math.abs(after!.x - (before!.x + 200))).toBeLessThan(30);
  expect(Math.abs(after!.y - (before!.y - 60))).toBeLessThan(30);
});

test('drag at fitted zoom: no walls inside the visible canvas, no grab-yank', async ({ page }) => {
  // Drag clamps mapped screen margins into logical space assuming zoom 1.
  // After the advisor auto-fit (zoom < 1), the clamps became invisible
  // walls INSIDE the visible canvas: drops landed short, and grabbing a
  // node beyond the zoom-1 wall yanked it sideways instantly.
  await openDesigner(page);
  await page.locator('button[title="Network Advisor"]').first().click();
  await expect(page.locator('[aria-label="Network Advisor"]')).toBeVisible();
  await page.waitForTimeout(1400); // dock transition + auto-fit

  // grab-yank check: press and wiggle 6px - the node must not leap
  const fw = nodeByName(page, 'Firewall');
  const b0 = await fw.boundingBox();
  await page.mouse.move(b0!.x + 25, b0!.y + 25);
  await page.mouse.down();
  await page.mouse.move(b0!.x + 31, b0!.y + 25, { steps: 2 });
  const wiggled = await fw.boundingBox();
  expect(Math.abs(wiggled!.x - b0!.x), 'grab must not yank the node').toBeLessThan(30);
  // drag far past the bottom wall: the clamp must stop the node at the
  // SCREEN-correct toolbar clearance (canvasHeight - 220 in screen px),
  // not at zoom-1's imaginary wall location
  await page.mouse.move(b0!.x + 25, b0!.y + 400, { steps: 12 });
  await page.mouse.up();
  await page.waitForTimeout(150);
  const atDrop = await fw.boundingBox();
  await page.waitForTimeout(700);
  const settled = await fw.boundingBox();
  expect(Math.abs(settled!.y - atDrop!.y), 'no teleport after drop').toBeLessThan(25);
  const canvas = await page.evaluate(() => {
    const el = document.querySelector('.relative.overflow-hidden.bg-gray-50')!;
    const r = el.getBoundingClientRect();
    return { top: r.top, height: r.height };
  });
  const wallScreen = canvas.top + canvas.height - 220;
  expect(Math.abs(settled!.y - wallScreen), 'wall sits at the screen-correct clearance').toBeLessThan(35);
});

test('nodes with image icons drag identically to svg-icon nodes', async ({ page }) => {
  // The AT&T globe is an <img>; bare images start a NATIVE browser drag
  // that hijacks the canvas gesture - the node moved 20px on a 200px drag
  // while svg-icon nodes moved the full distance.
  await openDesigner(page);
  const node = nodeByName(page, 'AT&T Core');
  const b = await node.boundingBox();
  // grab dead-center of the icon, where the img lives
  await page.mouse.move(b!.x + 32, b!.y + 28);
  await page.mouse.down();
  await page.mouse.move(b!.x + 32, b!.y - 90, { steps: 12 });
  await page.mouse.up();
  await page.waitForTimeout(400);
  const after = await node.boundingBox();
  expect(Math.abs((b!.y - 90) - after!.y)).toBeLessThan(30);
});

test('drag tracks the cursor IN FLIGHT - no rubber-banding', async ({ page }) => {
  // End-position checks pass even when the node visibly lags the cursor
  // behind a CSS transition. This measures tracking DURING the gesture:
  // before the fix the node trailed 271px on this motion.
  await openDesigner(page);
  const node = nodeByName(page, 'Firewall');
  const b = await node.boundingBox();
  await page.mouse.move(b!.x + 30, b!.y + 30);
  await page.mouse.down();
  await page.mouse.move(b!.x + 330, b!.y + 30, { steps: 25 });
  const mid = await node.boundingBox(); // measured immediately, no settle
  await page.mouse.up();
  expect(Math.abs((b!.x + 300) - mid!.x)).toBeLessThan(40);
});

test('imported cloud routers carry the AT&T Cloud Router glyph', async ({ page }) => {
  // covers fresh parses AND legacy persisted nodes (pre-mapping) - both
  // resolve through rehydrateIcons' migration
  const legacy = {
    name: 'Legacy', nodes: [
      { id: 'cr', type: 'function', functionType: 'Router', x: 400, y: 300, name: 'Primary Cloud Router', status: 'inactive', config: { configured: true } }
    ], edges: []
  };
  await page.addInitScript(f => localStorage.setItem('cloud-designer:topology', JSON.stringify(f)), legacy);
  await page.goto('/');
  const node = page.locator('.node-enter').first();
  await expect(node).toBeVisible();
  // the CloudRouterIcon svg signature: viewBox "2 2 28 28"
  await expect(node.locator('svg[viewBox="2 2 28 28"]')).toHaveCount(1);
});

test('dropping a node onto another slides it to a clear spot', async ({ page }) => {
  await openDesigner(page);
  const dragged = nodeByName(page, 'Azure');
  const target = nodeByName(page, 'HubRouter');
  const from = await dragged.boundingBox();
  const to = await target.boundingBox();
  await page.mouse.move(from!.x + 30, from!.y + 30);
  await page.mouse.down();
  await page.mouse.move(to!.x + 30, to!.y + 30, { steps: 10 });
  await page.mouse.up();
  await page.waitForTimeout(600);
  assertNoRestingOverlaps(await logicalPositions(page));
});

test('restored topologies are normalized: in-bounds and overlap-free', async ({ page }) => {
  // deliberately corrupt: off-canvas, under-toolbar, and stacked nodes
  const corrupted = {
    ...FIXTURE,
    nodes: FIXTURE.nodes.map((n, i) => ({
      ...n,
      x: i === 0 ? 2400 : i === 1 ? 310 : n.x,
      y: i === 0 ? 900 : i === 2 ? 255 : n.y
    }))
  };
  await page.addInitScript((fixture) => {
    localStorage.setItem('cloud-designer:topology', JSON.stringify(fixture));
  }, corrupted);
  await page.goto('/');
  await expect(page.locator('.node-enter')).toHaveCount(FIXTURE.nodes.length);
  await page.waitForTimeout(500);

  const positions = await logicalPositions(page);
  assertNoRestingOverlaps(positions);
  const canvasWidth = await page.evaluate(() =>
    document.querySelector('.relative.overflow-hidden.bg-gray-50')!.clientWidth
  );
  positions.forEach(p => {
    expect(p.x, `${p.name} x in bounds`).toBeGreaterThanOrEqual(140);
    expect(p.x, `${p.name} x in bounds`).toBeLessThanOrEqual(canvasWidth - 160);
    expect(p.y, `${p.name} y in bounds`).toBeGreaterThanOrEqual(175);
  });
});

// Canvas content must never overlap floating chrome - in both advisor states
async function chromeViolations(page: Page) {
  return page.evaluate(() => {
    const intersect = (a: DOMRect, b: DOMRect, tol = 3) => {
      const w = Math.min(a.right, b.right) - Math.max(a.left, b.left);
      const h = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
      return w > tol && h > tol;
    };
    const chrome: Element[] = [];
    document.querySelectorAll('div, nav').forEach(el => {
      const z = parseInt(getComputedStyle(el).zIndex, 10);
      if (z >= 80 && z < 200 && el.getBoundingClientRect().width > 0) chrome.push(el);
    });
    const panel = document.querySelector('[aria-label="Network Advisor"]');
    if (panel) chrome.push(panel);
    const content = [
      ...document.querySelectorAll('.node-enter'),
      ...document.querySelectorAll('[title="Drag to move site - click to edit"]')
    ];
    const violations: string[] = [];
    content.forEach(el => {
      const r = el.getBoundingClientRect();
      chrome.forEach(c => {
        if (!c.contains(el) && !el.contains(c) && intersect(r, c.getBoundingClientRect())) {
          violations.push(`${(el.textContent || '?').slice(0, 20)} under ${(c.textContent || c.className.toString()).slice(0, 24)}`);
        }
      });
    });
    return violations;
  });
}

// Intra-node overlap audit: no two text elements INSIDE one node may
// superimpose. Found in UAT: a fresh unconfigured node rendered its
// region sublabel and Configure action in the same slot, both unreadable.
async function intraNodeOverlaps(page: Page) {
  return page.evaluate(() => {
    const violations: string[] = [];
    document.querySelectorAll('.node-enter').forEach(node => {
      const leaves = [...node.querySelectorAll('span, button, div')]
        .filter(c => (c.textContent || '').trim() && c.children.length === 0)
        .map(c => ({ text: c.textContent!.trim().slice(0, 16), r: c.getBoundingClientRect() }))
        .filter(t => t.r.width > 0 && t.r.height > 0);
      for (let i = 0; i < leaves.length; i++) {
        for (let j = i + 1; j < leaves.length; j++) {
          const a = leaves[i].r, b = leaves[j].r;
          const w = Math.min(a.right, b.right) - Math.max(a.left, b.left);
          const h = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
          if (w > 2 && h > 2) {
            violations.push(`"${leaves[i].text}" overlaps "${leaves[j].text}"`);
          }
        }
      }
    });
    return violations;
  });
}

// Chrome-vs-chrome: floating chrome surfaces (toolbar, pills, rails,
// advisor dock) must never overlap EACH OTHER either. Found in UAT: at
// narrow widths with the advisor open, the toolbar overflowed its column
// and buried its last buttons under the dock.
async function chromeChromeViolations(page: Page) {
  return page.evaluate(() => {
    const chrome: Element[] = [];
    document.querySelectorAll('div, nav').forEach(el => {
      const z = parseInt(getComputedStyle(el).zIndex, 10);
      if (z >= 80 && z < 200 && el.getBoundingClientRect().width > 0) chrome.push(el);
    });
    const panel = document.querySelector('[aria-label="Network Advisor"]');
    if (panel) chrome.push(panel);
    const violations: string[] = [];
    for (let i = 0; i < chrome.length; i++) {
      for (let j = i + 1; j < chrome.length; j++) {
        const a = chrome[i], b = chrome[j];
        if (a.contains(b) || b.contains(a)) continue;
        const ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
        const w = Math.min(ra.right, rb.right) - Math.max(ra.left, rb.left);
        const h = Math.min(ra.bottom, rb.bottom) - Math.max(ra.top, rb.top);
        if (w > 4 && h > 4) {
          violations.push(`${(a.textContent || a.className.toString()).trim().slice(0, 20)} x ${(b.textContent || b.className.toString()).trim().slice(0, 20)}`);
        }
      }
    }
    return violations;
  });
}

test('chrome surfaces never overlap each other - including narrow viewport with advisor open', async ({ page }) => {
  await openDesigner(page);
  expect(await chromeChromeViolations(page)).toEqual([]);
  await page.locator('button[title="Network Advisor"]').first().click();
  await expect(page.locator('[aria-label="Network Advisor"]')).toBeVisible();
  await page.waitForTimeout(900);
  expect(await chromeChromeViolations(page)).toEqual([]);
  // the UAT case: narrow viewport squeezes the canvas column
  await page.setViewportSize({ width: 1100, height: 800 });
  await page.waitForTimeout(900);
  expect(await chromeChromeViolations(page)).toEqual([]);
});

test('toolbar stays on one row with the advisor open at desktop width', async ({ page }) => {
  // Two stacked bugs lived here: labels keyed off the viewport while the
  // dock stole column width, and the abspos left-50% box shrink-to-fit to
  // HALF the column - the Save check wrapped onto its own row.
  await openDesigner(page);
  await page.locator('button[title="Network Advisor"]').first().click();
  await expect(page.locator('[aria-label="Network Advisor"]')).toBeVisible();
  await page.waitForTimeout(900);
  const spread = await page.evaluate(() => {
    const toolbar = document.querySelector('button[title="Clear Canvas"]')!.closest('div[class*="bottom-6"]')!;
    const tops = [...toolbar.querySelectorAll('button')]
      .filter(b => b.getBoundingClientRect().height > 0)
      .map(b => Math.round(b.getBoundingClientRect().top));
    return Math.max(...tops) - Math.min(...tops);
  });
  expect(spread).toBeLessThan(12);
});

test('node labels never overlap across the visual state matrix', async ({ page }) => {
  await openDesigner(page);
  // state 1: configured nodes with region sublabels (the fixture)
  expect(await intraNodeOverlaps(page)).toEqual([]);

  // state 2: fresh unconfigured node from the toolbar (the UAT bug:
  // region sublabel and Configure action shared the same slot)
  await page.getByRole('button', { name: 'Cloud', exact: true }).click();
  await page.getByRole('button', { name: 'AWS', exact: true }).first().click();
  await expect(page.locator('.node-enter')).toHaveCount(FIXTURE.nodes.length + 1);
  await page.waitForTimeout(500);
  expect(await intraNodeOverlaps(page)).toEqual([]);

  // state 3: advisor open - issue badges + spotlight active
  await page.locator('button[title="Network Advisor"]').first().click();
  await expect(page.locator('[aria-label="Network Advisor"]')).toBeVisible();
  await page.waitForTimeout(900);
  expect(await intraNodeOverlaps(page)).toEqual([]);

  // state 4: card display mode - wordmarks, names, status rows
  await page.locator('button[title="Switch to detail cards"]').click();
  await page.waitForTimeout(500);
  expect(await intraNodeOverlaps(page)).toEqual([]);
});

test('no canvas content under chrome - advisor closed and open', async ({ page }) => {
  await openDesigner(page);
  expect(await chromeViolations(page)).toEqual([]);

  await page.locator('button[title="Network Advisor"]').first().click();
  await expect(page.locator('[aria-label="Network Advisor"]')).toBeVisible();
  await page.waitForTimeout(800); // dock transition + auto-fit
  expect(await chromeViolations(page)).toEqual([]);
});

test('advisor findings surface on the Pano map as site severity marks', async ({ page }) => {
  await openDesigner(page);
  // run the advisor so findings (SPOF on the hub router) exist
  await page.locator('button[title="Network Advisor"]').first().click();
  await expect(page.locator('[aria-label="Network Advisor"]')).toBeVisible();
  // switch to the Pano map
  await page.getByText('Pano', { exact: true }).click();
  await expect(page.locator('.site-marker').first()).toBeVisible();
  // at least one site chip carries a severity mark (error or warning tint)
  const marked = page.locator('.site-marker [style*="#C70032"], .site-marker [style*="#EA712F"]');
  await expect(marked.first()).toBeVisible();
});

test('failure simulation paints the blast radius and restores cleanly', async ({ page }) => {
  await openDesigner(page);
  await page.locator('button[title="Network Advisor"]').first().click();
  await page.getByRole('button', { name: 'Simulate' }).click();
  // fail the hub - everything except the core strands
  await page.getByRole('button', { name: /HubRouter.*fail it/ }).click();
  await expect(page.getByText(/single point of failure on your critical path|strands/)).toBeVisible();
  // stranded nodes dim on the canvas
  const dimmed = await page.locator('.node-enter.opacity-25').count();
  expect(dimmed).toBeGreaterThan(0);
  // restore brings everything back
  await page.getByRole('button', { name: /Restore HubRouter/ }).click();
  await expect(page.locator('.node-enter.opacity-25')).toHaveCount(0);
});

test('pasting topology JSON imports and assesses it', async ({ page }) => {
  await openDesigner(page);
  await page.locator('button[title="Network Advisor"]').first().click();
  await page.locator('button[title="Upload topology data (JSON or CSV)"]').click();
  await page.getByRole('button', { name: 'Paste JSON' }).click();
  const payload = JSON.stringify({
    nodes: [
      { id: 'a', name: 'Core', type: 'network', networkType: 'at&t core' },
      { id: 'b', name: 'EdgeRouter', type: 'function', functionType: 'Router' },
      { id: 'c', name: 'AWS East', type: 'destination', provider: 'AWS' }
    ],
    edges: [
      { source: 'a', target: 'b', type: 'MPLS', bandwidth: '10 Gbps' },
      { source: 'b', target: 'c', type: 'Direct Connect', bandwidth: '10 Gbps' }
    ]
  });
  await page.locator('textarea').fill(payload);
  await page.getByRole('button', { name: /Parse/i }).click();
  await page.getByRole('button', { name: 'Import & analyze' }).click();
  await expect(page.getByText('Topology Imported')).toBeVisible();
  await expect(page.locator('.node-enter')).toHaveCount(3);
  // imported nodes are normalized in-bounds and overlap-free
  assertNoRestingOverlaps(await logicalPositions(page));
});

test('cloud-to-cloud paths compute under the routing policy with AT&T-controlled marking', async ({ page }) => {
  await openDesigner(page);
  await page.locator('button[title="Network Advisor"]').first().click();
  await page.getByRole('button', { name: /^Paths/ }).click();
  // fixture has AWS and Azure behind the hub - one cloud pair
  await expect(page.getByText('AWS \u2194 Azure')).toBeVisible();
  await expect(page.getByText(/of 1 cloud-to-cloud paths ride the AT&T mid-mile/)).toBeVisible();
  await expect(page.getByText(/best latency \/ cost \/ security balance/)).toBeVisible();
  // policy switch changes the selection rationale (U4)
  await page.getByRole('button', { name: 'Lowest cost' }).click();
  await expect(page.getByText('Selected for lowest monthly transport cost')).toBeVisible();
  // clicking a path highlights it on canvas
  await page.getByText('AWS \u2194 Azure').click();
  await expect(page.getByText(/highlighted on canvas/)).toBeVisible();
});

test('welcome Discover card runs the demo account end to end', async ({ page }) => {
  // clean state: welcome screen shows
  await page.goto('/');
  await expect(page.getByText('Welcome to Cloud Connect')).toBeVisible();
  await page.getByRole('button', { name: /Discover Connect a cloud account/ }).click();
  // import modal opens directly on the Discover tab
  await expect(page.getByText('Scan account')).toBeVisible();
  // one-click demo account
  await page.getByRole('button', { name: 'Try the demo account' }).click();
  await page.getByRole('button', { name: 'Import & analyze' }).click({ timeout: 10000 });
  await expect(page.getByText('Topology Imported')).toBeVisible();
  // provenance chip appears beside the design name
  await expect(page.getByText(/Discovered · AWS · 4156-8721-0042/)).toBeVisible();
  // and survives a reload (persistence debounce is 500ms - let it land)
  await page.waitForTimeout(900);
  await page.reload();
  await expect(page.getByText(/Discovered · AWS · 4156-8721-0042/)).toBeVisible();
});

test('imported sites lay out as disjoint clusters - group containers never overlap', async ({ page }) => {
  await openDesigner(page);
  await page.locator('button[title="Network Advisor"]').first().click();
  await page.locator('button[title="Upload topology data (JSON or CSV)"]').click();
  await page.getByRole('button', { name: 'Paste JSON' }).click();
  // two sites whose coordinates deliberately interleave + a solo node
  const payload = JSON.stringify({
    nodes: [
      { id: 'a1', name: 'Core East', type: 'core', city: 'Ashburn', x: 300, y: 200 },
      { id: 'a2', name: 'EastRouter', type: 'router', city: 'Ashburn', x: 700, y: 400 },
      { id: 'a3', name: 'AWS East', type: 'cloud', provider: 'AWS', city: 'Ashburn', x: 500, y: 600 },
      { id: 'd1', name: 'DalRouter', type: 'router', city: 'Dallas', x: 400, y: 300 },
      { id: 'd2', name: 'Azure South', type: 'cloud', provider: 'Azure', city: 'Dallas', x: 600, y: 500 },
      { id: 's1', name: 'Internet', type: 'internet' }
    ],
    edges: [
      { source: 'a1', target: 'a2' }, { source: 'a2', target: 'a3' },
      { source: 'd1', target: 'd2' }, { source: 'a2', target: 'd1' },
      { source: 's1', target: 'd1' }
    ]
  });
  await page.locator('textarea').fill(payload);
  await page.getByRole('button', { name: /Parse/i }).click();
  await page.getByRole('button', { name: 'Import & analyze' }).click();
  await expect(page.getByText('Topology Imported')).toBeVisible();
  await page.waitForTimeout(800);

  // both site containers render, and their boxes are disjoint
  const boxes = await page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>('[style*="dashed"]')].map(el => {
      const r = el.getBoundingClientRect();
      return { x: r.x, y: r.y, w: r.width, h: r.height };
    }).filter(b => b.w > 0)
  );
  expect(boxes.length).toBeGreaterThanOrEqual(2);
  for (let i = 0; i < boxes.length; i++) {
    for (let j = i + 1; j < boxes.length; j++) {
      const a = boxes[i], b = boxes[j];
      const w = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
      const h = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
      expect(w > 4 && h > 4, `group containers ${i} and ${j} overlap`).toBe(false);
    }
  }
  // and the members themselves still honor the resting gaps
  assertNoRestingOverlaps(await logicalPositions(page));
});

test('cloud discovery imports an estate and the advisor flags the CIDR overlap', async ({ page }) => {
  await openDesigner(page);
  await page.locator('button[title="Network Advisor"]').first().click();
  await page.locator('button[title="Upload topology data (JSON or CSV)"]').click();
  // Discover tab: pick a provider, scan a mock account
  await page.getByRole('button', { name: 'Discover', exact: true }).click();
  await page.getByLabel('Account ID').fill('4156-8721-0042');
  await page.getByRole('button', { name: 'Scan account' }).click();
  // scan animates ~2.7s, then the parse preview appears
  await page.getByRole('button', { name: 'Import & analyze' }).click({ timeout: 10000 });
  await expect(page.getByText('Topology Imported')).toBeVisible();
  // discovered estate: core + hub + 2-4 VPCs, normalized and overlap-free
  const count = await page.locator('.node-enter').count();
  expect(count).toBeGreaterThanOrEqual(4);
  assertNoRestingOverlaps(await logicalPositions(page));
  // the deliberate 10.0.0.0/16 collision surfaces as an advisor error
  const overlap = page.getByText(/Overlapping IP space/).first();
  await expect(overlap).toBeVisible();
  // one-click renumber resolves it
  await page.getByRole('button', { name: /^Renumber to 10\./ }).first().click();
  await expect(page.getByText('Fix Applied')).toBeVisible();
  await expect(page.getByText(/Overlapping IP space/)).toHaveCount(0);
});

test('undo and redo unwind and replay node moves', async ({ page }) => {
  await openDesigner(page);
  const node = nodeByName(page, 'Firewall');
  const before = await node.boundingBox();
  // move the node, then undo, then redo
  await page.mouse.move(before!.x + 30, before!.y + 30);
  await page.mouse.down();
  await page.mouse.move(before!.x + 230, before!.y - 30, { steps: 10 });
  await page.mouse.up();
  await page.waitForTimeout(400);
  const moved = await node.boundingBox();
  expect(Math.abs(moved!.x - before!.x)).toBeGreaterThan(150);

  await page.keyboard.press(process.platform === 'darwin' ? 'Meta+z' : 'Control+z');
  await page.waitForTimeout(400);
  const undone = await node.boundingBox();
  expect(Math.abs(undone!.x - before!.x)).toBeLessThan(30);

  await page.keyboard.press(process.platform === 'darwin' ? 'Meta+Shift+z' : 'Control+Shift+z');
  await page.waitForTimeout(400);
  const redone = await node.boundingBox();
  expect(Math.abs(redone!.x - moved!.x)).toBeLessThan(30);
});

test('advisor fix preview ghosts, then apply commits the change', async ({ page }) => {
  await openDesigner(page);
  await page.locator('button[title="Network Advisor"]').first().click();
  await expect(page.locator('[aria-label="Network Advisor"]')).toBeVisible();
  // the fixture has a SPOF on the hub router - preview its fix
  await page.getByText('Preview', { exact: true }).first().click();
  // ghost node renders on canvas and the floating banner shows deltas
  await expect(page.getByText(/Previewing:/)).toBeVisible();
  await expect(page.getByText(/grade [A-F] → [A-F]/)).toBeVisible();
  const nodesBefore = await page.locator('.node-enter').count();
  // apply from the banner
  await page.getByRole('button', { name: 'Apply', exact: true }).first().click();
  await page.waitForTimeout(600);
  await expect(page.locator('.node-enter')).toHaveCount(nodesBefore + 1);
  await expect(page.getByText('Fix Applied')).toBeVisible();
});

test('opening a saved design normalizes it to the current canvas and fits', async ({ page }) => {
  // saved on some other (huge) canvas: positions far outside today's viewport
  const farFlung = {
    id: 'far-design', name: 'Far Design', savedAt: 1, lastModified: 2,
    nodes: FIXTURE.nodes.map((n, i) => ({ ...n, x: 1800 + i * 300, y: 700 + i * 120 })),
    edges: FIXTURE.edges
  };
  await page.addInitScript((design) => {
    localStorage.setItem('savedTopologies', JSON.stringify([design]));
  }, farFlung);
  await page.goto('/');
  // welcome screen -> Open -> the saved card (with its thumbnail)
  await page.getByRole('button', { name: /Open Continue working/ }).click();
  await page.getByRole('button', { name: /Far Design/ }).click();
  await expect(page.locator('.node-enter')).toHaveCount(FIXTURE.nodes.length);
  await page.waitForTimeout(700); // normalization + auto-fit settle

  const positions = await logicalPositions(page);
  assertNoRestingOverlaps(positions);
  const canvasWidth = await page.evaluate(() =>
    document.querySelector('.relative.overflow-hidden.bg-gray-50')!.clientWidth
  );
  positions.forEach(p => {
    expect(p.x, `${p.name} in current canvas`).toBeLessThanOrEqual(canvasWidth - 160);
    expect(p.y, `${p.name} above toolbar`).toBeLessThanOrEqual(600);
  });
});

test('last mile wizard activates a provider-bound connection', async ({ page }) => {
  await openDesigner(page);
  // open the Direct Connect edge's config via its gear pill
  await page.locator('[title^="Direct Connect"]').first().click();
  await page.getByText('Set up last mile').click();
  // step 1: connection type
  await expect(page.getByText('Select Connection Type')).toBeVisible();
  await expect(page.getByText('AWS DIRECT CONNECT')).toBeVisible();
  await page.getByRole('button', { name: 'Internet to Cloud Public' }).click();
  // step 2: configure (Simple defaults are valid) and activate
  await expect(page.getByLabel('Internet Subnets')).toHaveValue('0.0.0.0/0');
  await page.getByRole('button', { name: 'Activate Connection' }).click();
  await expect(page.getByText('Connection Activated')).toBeVisible();
  // re-open: the edge remembers its last-mile state
  await page.locator('[title^="Direct Connect"]').first().click();
  await expect(page.getByText('Last mile active')).toBeVisible();
});

test('clear canvas requires confirmation', async ({ page }) => {
  await openDesigner(page);
  const trash = page.locator('button[title="Clear Canvas"]');
  // first click only opens the confirm - nothing is deleted
  await trash.click();
  const dialog = page.getByRole('alertdialog', { name: 'Confirm clear canvas' });
  await expect(dialog).toBeVisible();
  await expect(page.locator('.node-enter')).toHaveCount(FIXTURE.nodes.length);
  // cancel keeps everything
  await dialog.getByRole('button', { name: 'Cancel' }).click();
  await expect(dialog).toBeHidden();
  await expect(page.locator('.node-enter')).toHaveCount(FIXTURE.nodes.length);
  // confirm actually clears
  await trash.click();
  await dialog.getByRole('button', { name: 'Clear canvas' }).click();
  await expect(page.locator('.node-enter')).toHaveCount(0);
});

test('advisor is reachable in Read mode, with mutations hidden', async ({ page }) => {
  await openDesigner(page);
  await page.getByRole('button', { name: 'Read', exact: true }).click();
  // toolbar (and its advisor button) is gone in read mode
  await expect(page.locator('button[title="Network Advisor"]')).toHaveCount(1);
  await page.locator('button[title="Network Advisor"]').first().click();
  const panel = page.locator('[aria-label="Network Advisor"]');
  await expect(panel).toBeVisible();
  // read-only: no apply/preview actions anywhere in the panel
  await expect(panel.getByText('Apply all fixes')).toHaveCount(0);
  await expect(panel.getByText('Preview', { exact: true })).toHaveCount(0);
});

test('advisor opens with assessment and an upload entry point', async ({ page }) => {
  await openDesigner(page);
  await page.locator('button[title="Network Advisor"]').first().click();
  const panel = page.locator('[aria-label="Network Advisor"]');
  await expect(panel).toBeVisible();
  await expect(panel.getByText('Assess')).toBeVisible();
  await panel.locator('button[title="Upload topology data (JSON or CSV)"]').click();
  await expect(page.getByText('Import network topology')).toBeVisible();
});

test('edge config panel opens near its gear at fitted zoom', async ({ page }) => {
  // FloatingPanel once treated the LOGICAL anchor as screen px - at fitted
  // zoom the panel opened 415px from the gear that summoned it.
  await openDesigner(page);
  await page.locator('button[title="Network Advisor"]').first().click();
  // the advisor triggers fit-to-view ~350ms after opening; wait for the
  // fit to actually MOVE the canvas, then for it to settle - a stability
  // poll alone can pass before the animation has even started
  const gearLoc = page.locator('[title^="Direct Connect"]').first();
  const initial = await gearLoc.boundingBox();
  await expect(async () => {
    const cur = await gearLoc.boundingBox();
    expect(Math.hypot(cur!.x - initial!.x, cur!.y - initial!.y)).toBeGreaterThan(2);
  }).toPass({ timeout: 8000 });
  let prev = await gearLoc.boundingBox();
  await expect(async () => {
    await page.waitForTimeout(250);
    const cur = await gearLoc.boundingBox();
    const moved = Math.hypot(cur!.x - prev!.x, cur!.y - prev!.y);
    prev = cur;
    expect(moved).toBeLessThan(0.5);
  }).toPass({ timeout: 8000 });
  await gearLoc.click();
  await expect(page.getByText('Connection Configuration').first()).toBeVisible();
  // the panel eases into place (left/top transition 150ms) - poll until
  // it has settled beside its anchor instead of measuring mid-flight
  await expect(async () => {
    // the full panel (fixed 380px width), not just its header text
    const p = await page.locator('[style*="width: 380px"]').first().boundingBox();
    const gear = await gearLoc.boundingBox();
    const gearCx = gear!.x + gear!.width / 2;
    const gearCy = gear!.y + gear!.height / 2;
    // horizontally adjacent: the panel sits beside its anchor (right or,
    // when the canvas is narrow, flipped left) - never across the canvas
    const hGap = gearCx < p!.x ? p!.x - gearCx
      : gearCx > p!.x + p!.width ? gearCx - (p!.x + p!.width) : 0;
    expect(hGap, `panel is ${Math.round(hGap)}px horizontally away from its gear`).toBeLessThan(150);
    // vertically: the gear falls within (or near) the panel's span
    const vGap = gearCy < p!.y ? p!.y - gearCy
      : gearCy > p!.y + p!.height ? gearCy - (p!.y + p!.height) : 0;
    expect(vGap, `panel is ${Math.round(vGap)}px vertically away from its gear`).toBeLessThan(100);
  }).toPass({ timeout: 5000 });
});

test('group drag at fitted zoom stays in bounds without deforming', async ({ page }) => {
  await openDesigner(page);
  await page.locator('button[title="Network Advisor"]').first().click();
  await page.waitForTimeout(1400);
  const chip = page.locator('[title="Drag to move site - click to edit"]').first();
  const c0 = await chip.boundingBox();
  const before = await logicalPositions(page);
  const members = before.filter(n => /AT&T Core|HubRouter|Firewall/.test(n.name));
  const spreadBefore = {
    x: Math.max(...members.map(m => m.x)) - Math.min(...members.map(m => m.x)),
    y: Math.max(...members.map(m => m.y)) - Math.min(...members.map(m => m.y))
  };
  // shove the group hard toward the top-left wall
  await page.mouse.move(c0!.x + 15, c0!.y + 8);
  await page.mouse.down();
  await page.mouse.move(c0!.x - 1200, c0!.y - 900, { steps: 15 });
  await page.mouse.up();
  await page.waitForTimeout(400);
  const after = await logicalPositions(page);
  const membersAfter = after.filter(n => /AT&T Core|HubRouter|Firewall/.test(n.name));
  const spreadAfter = {
    x: Math.max(...membersAfter.map(m => m.x)) - Math.min(...membersAfter.map(m => m.x)),
    y: Math.max(...membersAfter.map(m => m.y)) - Math.min(...membersAfter.map(m => m.y))
  };
  // the wall must not squash the cluster - relative geometry is preserved
  expect(Math.abs(spreadAfter.x - spreadBefore.x)).toBeLessThan(2);
  expect(Math.abs(spreadAfter.y - spreadBefore.y)).toBeLessThan(2);
  // and every member still renders inside the visible canvas
  for (const name of ['AT&T Core', 'HubRouter', 'Firewall']) {
    const box = await nodeByName(page, name).boundingBox();
    expect(box!.x, `${name} left the canvas left edge`).toBeGreaterThan(0);
    expect(box!.y, `${name} went under the top chrome`).toBeGreaterThan(60);
  }
});
