// Persona-driven end-to-end journeys. Each test is one synthetic user
// walking a complete workflow start to finish - the way the Cloud
// Connect PRD describes them, not the way components are organized.
//
//   Priya  - Enterprise Network Architect. Greenfield: designs a
//            multicloud topology from scratch, connects it, gets the
//            advisor's read, saves, and trusts it to survive a reload.
//   Marcus - Cloud Operations Engineer. Brownfield: discovers a live
//            AWS estate, triages findings, fixes the address conflict,
//            activates the last mile, watches the attach rate close.
//   Dana   - AT&T Solutions Engineer. Demo: imports a customer
//            topology, walks paths under different policies, runs a
//            failure what-if, then applies the remediation plan live.
//   Sam    - NOC Reviewer. Read-only: reviews a design without being
//            offered a single mutating control.
//
// Journeys assert USER-VISIBLE outcomes at every stage. If a step can't
// complete the way a real user would do it, the journey fails - that is
// the point.

import { test, expect, Page } from '@playwright/test';

const DANA_FIXTURE = {
  name: 'Customer: Lonestar Logistics',
  nodes: [
    { id: 'n-core', type: 'network', x: 300, y: 250, name: 'AT&T Core', status: 'inactive', config: { networkType: 'at&t core', provider: 'AT&T', city: 'Dallas', configured: true } },
    { id: 'n-router', type: 'function', functionType: 'Router', x: 600, y: 250, name: 'HubRouter', status: 'inactive', config: { routerType: 'cloud', city: 'Dallas', configured: true } },
    { id: 'n-aws', type: 'destination', cloudProvider: 'AWS', x: 900, y: 250, name: 'AWS', status: 'inactive', config: { provider: 'AWS', configured: true } },
    { id: 'n-azure', type: 'destination', cloudProvider: 'Azure', x: 600, y: 450, name: 'Azure', status: 'inactive', config: { provider: 'Azure', configured: true } }
  ],
  edges: [
    { id: 'e1', source: 'n-core', target: 'n-router', type: 'MPLS', bandwidth: '10 Gbps', status: 'inactive', config: {} },
    { id: 'e2', source: 'n-router', target: 'n-aws', type: 'Direct Connect', bandwidth: '10 Gbps', status: 'inactive', config: {} },
    { id: 'e3', source: 'n-router', target: 'n-azure', type: 'ExpressRoute', bandwidth: '10 Gbps', status: 'inactive', config: {} }
  ]
};

const nodeByName = (page: Page, name: string) =>
  page.locator('.node-enter').filter({ hasText: name }).first();

async function seed(page: Page, fixture: object) {
  await page.addInitScript(f => localStorage.setItem('cloud-designer:topology', JSON.stringify(f)), fixture);
  await page.goto('/');
  await expect(page.locator('.node-enter').first()).toBeVisible();
}

// ---------------------------------------------------------------------------

test('Priya the architect designs a multicloud topology from scratch', async ({ page }) => {
  // arrives at a clean app, chooses to build her own design
  await page.goto('/');
  await expect(page.getByText('Welcome to Cloud Connect')).toBeVisible();
  await page.getByRole('button', { name: /Create.*Start from scratch/s }).click();

  // names her hub and creates the foundation
  await page.getByLabel(/name your cloud router/i).fill('Priya Hub');
  await page.getByRole('button', { name: 'Create Network' }).click();
  await expect(nodeByName(page, 'AT&T Core')).toBeVisible();
  await expect(nodeByName(page, 'Priya Hub')).toBeVisible();

  // adds her two clouds from the toolbar
  await page.getByRole('button', { name: 'Cloud', exact: true }).click();
  await page.getByRole('button', { name: 'AWS', exact: true }).first().click();
  await expect(page.locator('.node-enter')).toHaveCount(3);
  await page.getByRole('button', { name: 'Cloud', exact: true }).click();
  await page.getByRole('button', { name: 'Azure', exact: true }).first().click();
  await expect(page.locator('.node-enter')).toHaveCount(4);

  // connects hub to each cloud: connection mode, click the pair
  const edgesBefore = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('cloud-designer:topology') || '{"edges":[]}').edges.length);
  await page.locator('button[title="Add Connection"]').click();
  await nodeByName(page, 'Priya Hub').click();
  await nodeByName(page, 'AWS').click();
  await nodeByName(page, 'Priya Hub').click();
  await nodeByName(page, 'Azure').click();
  await page.locator('button[title="Add Connection"]').click(); // toggle off
  await page.waitForFunction((prev) =>
    JSON.parse(localStorage.getItem('cloud-designer:topology') || '{"edges":[]}').edges.length >= prev + 2,
    edgesBefore, { timeout: 5000 });

  // asks the advisor for a read on her design
  await page.locator('button[title="Network Advisor"]').first().click();
  const advisor = page.locator('[aria-label="Network Advisor"]');
  await expect(advisor).toBeVisible();
  // an assessment renders: a letter grade and findings
  await expect(advisor.getByText(/^[A-F][+-]?$/).first()).toBeVisible();

  // her work survives a reload exactly as she left it
  await page.waitForTimeout(900); // persistence debounce
  await page.reload();
  await expect(nodeByName(page, 'Priya Hub')).toBeVisible();
  await expect(page.locator('.node-enter')).toHaveCount(4);
  const persisted = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('cloud-designer:topology')!).edges.length);
  expect(persisted).toBeGreaterThanOrEqual(edgesBefore + 2);
});

test('Marcus the ops engineer discovers an estate and closes every gap', async ({ page }) => {
  // starts from discovery - his network already exists in AWS
  await page.goto('/');
  await page.getByRole('button', { name: /Discover Connect a cloud account/ }).click();
  await page.getByRole('button', { name: 'Try the demo account' }).click();
  await page.getByRole('button', { name: 'Import & analyze' }).click({ timeout: 10000 });
  await expect(page.getByText('Topology Imported')).toBeVisible();
  // provenance tells him (and his auditors) where this design came from
  await expect(page.getByText(/Discovered · AWS/)).toBeVisible();

  // the advisor triages what the scan found - the IP conflict is critical
  const advisor = page.locator('[aria-label="Network Advisor"]');
  await expect(advisor).toBeVisible();
  await expect(advisor.getByText(/Overlapping IP space/).first()).toBeVisible();

  // he works the address plan, not the finding list
  await page.getByRole('button', { name: 'IP Plan' }).click();
  const plan = page.locator('[data-testid="addressing-tab"]');
  await expect(plan.getByText(/conflict/).first()).toBeVisible();
  await plan.getByText(/^Renumber to 10\./).first().click();
  await expect(page.getByText('Fix Applied')).toBeVisible();
  await expect(plan.getByText('Address plan is clean', { exact: false })).toBeVisible();

  // then activates the unattached circuit through the last-mile wizard
  await page.getByRole('button', { name: 'Assess' }).click();
  await page.locator('[title^="Direct Connect"]').first().click();
  // the button inside the edge config panel, not the advisor finding text
  await page.locator('[style*="width: 380px"]').getByText('Set up last mile').click();
  await expect(page.getByText('Select Connection Type')).toBeVisible();
  await page.getByRole('button', { name: 'Internet to Cloud Public' }).click();
  await page.getByRole('button', { name: 'Activate Connection' }).click();
  await expect(page.getByText('Connection Activated')).toBeVisible();

  // the attach-rate KPI moved: at least one circuit now has a last mile
  await expect(advisor.getByText(/Attach rate:/)).toBeVisible();
  const attach = await advisor.getByText(/Attach rate:/).textContent();
  expect(attach).toMatch(/[1-9]\d*\/\d+/);
});

test('Dana the solutions engineer demos paths, failure, and remediation', async ({ page }) => {
  // walks in with the customer's topology already loaded
  await seed(page, DANA_FIXTURE);
  await expect(page.getByText('Customer: Lonestar Logistics')).toBeVisible();
  await page.locator('button[title="Network Advisor"]').first().click();
  const advisor = page.locator('[aria-label="Network Advisor"]');
  await expect(advisor).toBeVisible();

  // shows cloud-to-cloud paths riding the AT&T mid-mile
  await page.getByRole('button', { name: /^Paths/ }).click();
  await expect(page.getByText('AWS ↔ Azure')).toBeVisible();
  // switches policy live - the rationale changes with it
  await page.getByRole('button', { name: 'Lowest cost' }).click();
  await expect(page.getByText('Selected for lowest monthly transport cost')).toBeVisible();

  // runs the what-if: kill the hub, show the blast radius
  await page.getByRole('button', { name: 'Simulate' }).click();
  await advisor.getByRole('button', { name: /HubRouter/ }).first().click();
  await expect(advisor.getByText(/unreachable|stranded|isolat/i).first()).toBeVisible();
  await advisor.getByRole('button', { name: /Restore/ }).first().click();

  // closes with the remediation plan applied live, end to end
  await page.getByRole('button', { name: /^Plan/ }).click();
  const applyAll = advisor.getByRole('button', { name: 'Apply all fixes' });
  await expect(applyAll).toBeVisible();
  await applyAll.click();
  // the stepper runs through every fix, then the plan is empty
  await expect(advisor.getByText('Nothing left to remediate', { exact: false }))
    .toBeVisible({ timeout: 20000 });
});

test('Sam the NOC reviewer reads a design without a single mutating control', async ({ page }) => {
  await seed(page, DANA_FIXTURE);
  await page.getByRole('button', { name: 'Read', exact: true }).click();

  // the editing toolbar is gone
  await expect(page.locator('button[title="Add Connection"]')).toHaveCount(0);
  await expect(page.locator('button[title="Clear Canvas"]')).toHaveCount(0);

  // nodes do not respond to drag
  const hub = nodeByName(page, 'HubRouter');
  const before = await hub.boundingBox();
  await page.mouse.move(before!.x + 30, before!.y + 30);
  await page.mouse.down();
  await page.mouse.move(before!.x + 200, before!.y + 100, { steps: 8 });
  await page.mouse.up();
  await page.waitForTimeout(400);
  const after = await hub.boundingBox();
  expect(Math.abs(after!.x - before!.x), 'read mode must not allow drags').toBeLessThan(5);

  // the advisor still gives him the full read - minus every mutation
  await page.locator('button[title="Network Advisor"]').first().click();
  const advisor = page.locator('[aria-label="Network Advisor"]');
  await expect(advisor).toBeVisible();
  await expect(advisor.getByText('Apply all fixes')).toHaveCount(0);
  await expect(advisor.getByText('Preview', { exact: true })).toHaveCount(0);
  // the IP plan is readable but offers no renumber
  await page.getByRole('button', { name: 'IP Plan' }).click();
  await expect(advisor.getByText(/^Renumber to/)).toHaveCount(0);
});
