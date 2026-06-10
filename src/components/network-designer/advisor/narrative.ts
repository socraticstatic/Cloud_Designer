// Consultant narrative - deterministic prose composed from the actual
// assessment. Seeded by a topology hash so wording varies between networks
// but stays stable for the same one (no flicker on re-runs).

import { NetworkNode, NetworkEdge } from '../../../types';
import { Assessment } from './advisorEngine';

function hashTopology(nodes: NetworkNode[], edges: NetworkEdge[]): number {
  const sig = nodes.map(n => n.id + (n.config?.city ?? '')).join('|') +
    edges.map(e => e.id + e.type + (e.config?.resilience ?? '')).join('|');
  let h = 0;
  for (let i = 0; i < sig.length; i++) h = (h * 31 + sig.charCodeAt(i)) >>> 0;
  return h;
}

const pick = <T,>(seed: number, salt: number, options: T[]): T =>
  options[(seed + salt * 7) % options.length];

export function composeNarrative(
  assessment: Assessment,
  nodes: NetworkNode[],
  edges: NetworkEdge[]
): string {
  const seed = hashTopology(nodes, edges);
  const paragraphs: string[] = [];

  const destinations = nodes.filter(n => n.type === 'destination');
  const providers = [...new Set(destinations.map(d => d.cloudProvider || d.config?.provider).filter(Boolean))];
  const cities = [...new Set(nodes.map(n => n.config?.city).filter(Boolean))];
  const errors = assessment.findings.filter(f => f.severity === 'error');
  const warnings = assessment.findings.filter(f => f.severity === 'warning');
  const positives = assessment.findings.filter(f => f.severity === 'positive');

  // Paragraph 1: posture
  const shape = `${nodes.length} nodes across ${cities.length || 'one'} site${cities.length === 1 ? '' : 's'}` +
    (providers.length > 1 ? `, spanning ${providers.length} cloud providers` : providers.length === 1 ? `, connected to ${providers[0]}` : '');
  if (assessment.grade === 'A' || assessment.grade === 'B') {
    paragraphs.push(pick(seed, 1, [
      `This is a disciplined design. ${shape}, and the fundamentals hold: paths are redundant where they need to be and the topology reads like someone planned for failure.`,
      `Solid work. ${shape}. The structure is coherent, and most of what I would check first is already handled.`
    ]));
  } else if (assessment.grade === 'C') {
    paragraphs.push(pick(seed, 1, [
      `Workable, but not finished. ${shape}. The shape of the network is right; the hardening is not done yet.`,
      `The bones are good. ${shape}, and the intent is clear. What is missing is the discipline layer: the items below are the difference between a diagram and a production network.`
    ]));
  } else {
    paragraphs.push(pick(seed, 1, [
      `This design would not survive contact with production. ${shape}, but ${errors.length} critical issue${errors.length === 1 ? '' : 's'} sit on the data path. Address those before anything else.`,
      `Stop before deploying this. ${shape}. The critical findings below are not edge cases; each one is an outage or a breach waiting for a date.`
    ]));
  }

  // Paragraph 2: sharpest risk
  const sharpest = errors[0] ?? warnings[0];
  if (sharpest) {
    paragraphs.push(pick(seed, 2, [
      `The sharpest risk: ${sharpest.title.toLowerCase().replace(/\.$/, '')}. ${sharpest.detail} ${sharpest.fix ? 'The one-click fix below handles it.' : ''}`,
      `If you fix one thing today, make it this: ${sharpest.title.toLowerCase().replace(/\.$/, '')}. ${sharpest.detail}`
    ]).trim());
  } else if (positives.length > 0) {
    paragraphs.push(`Nothing urgent stands out. ${positives[0].detail} Keep that standard as the design grows.`);
  }

  // Paragraph 3: cost stance
  if (assessment.monthlyCost > 0) {
    const costFindings = assessment.findings.filter(f => f.category === 'Cost');
    if (costFindings.length > 0) {
      paragraphs.push(pick(seed, 3, [
        `On spend: roughly $${assessment.monthlyCost.toLocaleString()}/mo in transport as drawn. ${costFindings[0].detail} Worth a look before the contract, not after.`,
        `Transport runs about $${assessment.monthlyCost.toLocaleString()}/mo here. ${costFindings[0].detail}`
      ]));
    } else {
      paragraphs.push(`Transport spend is approximately $${assessment.monthlyCost.toLocaleString()}/mo and nothing in the design reads as wasteful. Reasonable for what it buys.`);
    }
  }

  return paragraphs.join('\n\n');
}
