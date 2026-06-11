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

test('welcome Discover card runs the demo account end to end', async ({ page }) => {
  // clean state: welcome screen shows
  await page.goto('/');
  await expect(page.getByText('Welcome to Cloud Designer')).toBeVisible();
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
