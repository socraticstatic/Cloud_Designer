// Fix preview + impact scoring.
// previewFix runs the same pure applyFix the commit path uses, then diffs
// the result so the canvas can ghost-render exactly what Apply will do.
// scoreFixImpact re-runs the full advisor on the fixed clone, so every
// delta shown to the user is computed, not estimated.

import { NetworkNode, NetworkEdge } from '../../../types';
import {
  applyFix, runAdvisor, toDimensions, Assessment, Finding, FixAction, Dimensions
} from './advisorEngine';

export interface FixPreview {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
  ghostNodes: NetworkNode[];
  ghostEdges: NetworkEdge[];
  changedEdgeIds: string[];
  summary: string;
}

export interface FixImpact {
  before: Dimensions;
  after: Dimensions;
  deltas: Dimensions;
  costDelta: number;
  gradeAfter: Assessment['grade'];
  resolvesFindings: number;
}

export function previewFix(nodes: NetworkNode[], edges: NetworkEdge[], action: FixAction): FixPreview {
  const result = applyFix(nodes, edges, action);
  const nodeIds = new Set(nodes.map(n => n.id));
  const edgeIds = new Set(edges.map(e => e.id));
  const before = new Map(edges.map(e => [e.id, e]));

  return {
    nodes: result.nodes,
    edges: result.edges,
    ghostNodes: result.nodes.filter(n => !nodeIds.has(n.id)),
    ghostEdges: result.edges.filter(e => !edgeIds.has(e.id)),
    changedEdgeIds: result.edges
      .filter(e => edgeIds.has(e.id) && before.get(e.id)?.config !== e.config)
      .map(e => e.id),
    summary: result.summary
  };
}

export function scoreFixImpact(
  nodes: NetworkNode[],
  edges: NetworkEdge[],
  action: FixAction,
  baseline: Assessment
): FixImpact {
  const result = applyFix(nodes, edges, action);
  const after = runAdvisor(result.nodes, result.edges);
  const beforeDims = toDimensions(baseline);
  const afterDims = toDimensions(after);
  const open = (a: Assessment) => a.findings.filter(f => f.severity === 'error' || f.severity === 'warning').length;
  return {
    before: beforeDims,
    after: afterDims,
    deltas: {
      resilience: afterDims.resilience - beforeDims.resilience,
      security: afterDims.security - beforeDims.security,
      performance: afterDims.performance - beforeDims.performance,
      cost: afterDims.cost - beforeDims.cost
    },
    costDelta: after.monthlyCost - baseline.monthlyCost,
    gradeAfter: after.grade,
    resolvesFindings: Math.max(0, open(baseline) - open(after))
  };
}

// Remediation playbook: every fixable finding scored, ordered by score gain
// per dollar (free hardening first), with cumulative projections computed by
// actually applying the fixes in sequence on a clone.
export interface PlanStep {
  finding: Finding;
  impact: FixImpact;
  cumulativeGrade: Assessment['grade'];
  cumulativeCost: number;
}

export function buildRemediationPlan(
  nodes: NetworkNode[],
  edges: NetworkEdge[],
  assessment: Assessment
): PlanStep[] {
  const fixable = assessment.findings.filter(f => f.fix);
  if (fixable.length === 0) return [];

  const scored = fixable.map(finding => ({
    finding,
    impact: scoreFixImpact(nodes, edges, finding.fix!.action, assessment)
  }));

  const gain = (s: { impact: FixImpact }) =>
    Math.max(0, s.impact.deltas.resilience) +
    Math.max(0, s.impact.deltas.security) +
    Math.max(0, s.impact.deltas.performance) +
    s.impact.resolvesFindings * 10;

  scored.sort((a, b) => {
    const aFree = a.impact.costDelta <= 0;
    const bFree = b.impact.costDelta <= 0;
    if (aFree !== bFree) return aFree ? -1 : 1;
    const aRatio = gain(a) / Math.max(1, a.impact.costDelta);
    const bRatio = gain(b) / Math.max(1, b.impact.costDelta);
    return bRatio - aRatio;
  });

  // Cumulative projection: replay the ordered fixes on a working copy
  let workNodes = nodes;
  let workEdges = edges;
  return scored.map(step => {
    const applied = applyFix(workNodes, workEdges, step.finding.fix!.action);
    workNodes = applied.nodes;
    workEdges = applied.edges;
    const cumulative = runAdvisor(workNodes, workEdges);
    return {
      ...step,
      cumulativeGrade: cumulative.grade,
      cumulativeCost: cumulative.monthlyCost
    };
  });
}
