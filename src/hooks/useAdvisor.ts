// Advisor orchestration, extracted from NetworkDesigner. Owns the
// assessment lifecycle: run/re-run, finding focus, fix preview + apply,
// the apply-all stepper, failure simulation, narrative, plan, badges,
// and score history. NetworkDesigner stays the canvas owner; this hook
// only touches topology through the setters it is handed.

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { NetworkNode, NetworkEdge } from '../types';
import {
  runAdvisor, applyFix, Assessment, Finding
} from '../components/network-designer/advisor/advisorEngine';
import {
  previewFix, scoreFixImpact, buildRemediationPlan, FixPreview, FixImpact
} from '../components/network-designer/advisor/fixPreview';
import { simulateFailure, FailureResult } from '../components/network-designer/advisor/failureSim';
import { composeNarrative } from '../components/network-designer/advisor/narrative';
import { readHistory, appendHistory, HistoryPoint } from '../components/network-designer/advisor/scoreHistory';
import { computeCloudPaths, CloudPath, PathPolicy } from '../components/network-designer/advisor/pathEngine';

const STORAGE_ASSESSMENT = 'cloud-designer:assessment';

interface UseAdvisorDeps {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
  setNodes: (updater: NetworkNode[] | ((prev: NetworkNode[]) => NetworkNode[])) => void;
  setEdges: (updater: NetworkEdge[] | ((prev: NetworkEdge[]) => NetworkEdge[])) => void;
  saveToHistory: (nodes: NetworkNode[], edges: NetworkEdge[]) => void;
  rehydrateIcons: (nodes: NetworkNode[]) => NetworkNode[];
}

export function useAdvisor({ nodes, edges, setNodes, setEdges, saveToHistory, rehydrateIcons }: UseAdvisorDeps) {
  const [showAdvisor, setShowAdvisor] = useState(false);
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [focusedFinding, setFocusedFinding] = useState<Finding | null>(null);
  const [fixPreviewState, setFixPreviewState] = useState<{ finding: Finding; preview: FixPreview; impact: FixImpact } | null>(null);
  const [simResult, setSimResult] = useState<FailureResult | null>(null);
  const [advisorHistory, setAdvisorHistory] = useState<HistoryPoint[]>(() => readHistory());
  const [pathPolicy, setPathPolicyState] = useState<PathPolicy>(() => {
    const saved = localStorage.getItem('cloud-designer:path-policy');
    return (saved === 'latency' || saved === 'cost' || saved === 'security') ? saved : 'balanced';
  });
  const [focusedPath, setFocusedPath] = useState<CloudPath | null>(null);
  const [isApplyingAll, setIsApplyingAll] = useState(false);
  const [applyingStep, setApplyingStep] = useState(0);
  const applyAllActiveRef = useRef(false);

  const handleRunAdvisor = useCallback((targetNodes?: NetworkNode[], targetEdges?: NetworkEdge[]) => {
    const result = runAdvisor(targetNodes ?? nodes, targetEdges ?? edges);
    setAssessment(result);
    setFocusedFinding(null);
    setShowAdvisor(true);
    setAdvisorHistory(appendHistory(result));
    try {
      localStorage.setItem(STORAGE_ASSESSMENT, JSON.stringify(result));
    } catch { /* ignore */ }
    return result;
  }, [nodes, edges]);

  const handleFocusFinding = (finding: Finding | null) => {
    setFocusedFinding(finding);
  };

  // One-click remediation: mutate the topology per the finding's fix,
  // then re-analyze so the user sees the score move immediately.
  const handleApplyFix = (finding: Finding) => {
    if (!finding.fix) return;
    const result = applyFix(nodes, edges, finding.fix.action);
    const fixedNodes = rehydrateIcons(result.nodes);
    setNodes(fixedNodes);
    setEdges(result.edges);
    saveToHistory(fixedNodes, result.edges);
    setFocusedFinding(null);
    setFixPreviewState(null);
    handleRunAdvisor(fixedNodes, result.edges);
    window.addToast({
      type: 'success',
      title: 'Fix Applied',
      message: result.summary,
      duration: 3500
    });
  };

  // Fix preview: ghost-render exactly what Apply would do, with computed
  // score and cost deltas. Esc or Cancel dismisses; Apply commits.
  const handlePreviewFix = (finding: Finding) => {
    if (!finding.fix || !assessment) return;
    setSimResult(null);
    setFocusedFinding(finding);
    setFixPreviewState({
      finding,
      preview: previewFix(nodes, edges, finding.fix.action),
      impact: scoreFixImpact(nodes, edges, finding.fix.action, assessment)
    });
  };
  const handleCancelPreview = useCallback(() => setFixPreviewState(null), []);

  // What-if failure simulation - blast radius painted on the canvas
  const handleSimulate = (nodeId: string) => {
    setFixPreviewState(null);
    setFocusedFinding(null);
    setSimResult(simulateFailure(nodeId, nodes, edges));
  };
  const handleResetSim = useCallback(() => setSimResult(null), []);

  // Remediation playbook, narrative, and per-node issue badges - all
  // recomputed from the live assessment while the advisor is open.
  // Plan recomputes only when the assessment changes - it regenerates
  // ~1.5s after any topology edit, and each plan build runs the engine
  // 2x per fixable finding.
  const remediationPlan = useMemo(
    () => (showAdvisor && assessment ? buildRemediationPlan(nodes, edges, assessment) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [showAdvisor, assessment]
  );
  const advisorNarrative = useMemo(
    () => (assessment ? composeNarrative(assessment, nodes, edges) : ''),
    [assessment, nodes, edges]
  );
  const issueBadges = useMemo(() => {
    if (!showAdvisor || !assessment) return {};
    const rank = { error: 3, warning: 2, recommendation: 1 } as const;
    const map: Record<string, 'error' | 'warning' | 'recommendation'> = {};
    assessment.findings.forEach(f => {
      const severity = f.severity;
      if (severity === 'positive') return;
      f.nodeIds.forEach(id => {
        if (!map[id] || rank[severity] > rank[map[id]]) map[id] = severity;
      });
    });
    return map;
  }, [showAdvisor, assessment]);

  // Apply-all stepper: walks the plan one fix at a time so the canvas
  // visibly heals. Recomputes the plan each step since ids shift.
  const handleApplyAll = async () => {
    if (applyAllActiveRef.current) return;
    applyAllActiveRef.current = true;
    setIsApplyingAll(true);
    setFixPreviewState(null);
    setSimResult(null);

    let curNodes = nodes;
    let curEdges = edges;
    let curAssessment = assessment ?? runAdvisor(curNodes, curEdges);
    let step = 0;
    while (applyAllActiveRef.current && step < 12) {
      const planNow = buildRemediationPlan(curNodes, curEdges, curAssessment);
      if (planNow.length === 0) break;
      setApplyingStep(step);
      const next = planNow[0].finding;
      const result = applyFix(curNodes, curEdges, next.fix!.action);
      curNodes = rehydrateIcons(result.nodes);
      curEdges = result.edges;
      setNodes(curNodes);
      setEdges(curEdges);
      setFocusedFinding(next);
      // checkpoint per step so undo unwinds one fix at a time
      saveToHistory(curNodes, curEdges);
      curAssessment = runAdvisor(curNodes, curEdges);
      setAssessment(curAssessment);
      setAdvisorHistory(appendHistory(curAssessment));
      await new Promise(resolve => setTimeout(resolve, 1000));
      step++;
    }
    setFocusedFinding(null);
    setIsApplyingAll(false);
    applyAllActiveRef.current = false;
    try {
      localStorage.setItem(STORAGE_ASSESSMENT, JSON.stringify(curAssessment));
    } catch { /* ignore */ }
    window.addToast({
      type: 'success',
      title: 'Remediation Complete',
      message: `Applied ${step} fix${step === 1 ? '' : 'es'}. Grade is now ${curAssessment.grade}.`,
      duration: 4000
    });
  };
  const handleStopApplyAll = () => {
    applyAllActiveRef.current = false;
  };

  // Watchdog-style continuous analysis: once an assessment exists,
  // quietly re-run it whenever the topology changes.
  useEffect(() => {
    if (!assessment || (nodes.length === 0 && edges.length === 0)) return;
    if (applyAllActiveRef.current) return; // stepper manages its own re-runs
    const timer = setTimeout(() => {
      const result = runAdvisor(nodes, edges);
      setAssessment(result);
      setAdvisorHistory(appendHistory(result));
      try {
        localStorage.setItem(STORAGE_ASSESSMENT, JSON.stringify(result));
      } catch { /* ignore */ }
    }, 1500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes, edges]);

  const setPathPolicy = (policy: PathPolicy) => {
    setPathPolicyState(policy);
    try { localStorage.setItem('cloud-designer:path-policy', policy); } catch { /* ignore */ }
  };

  // Attach rate (PRD O2 success metric): of the provider circuits in the
  // design, how many have an activated last mile?
  const attachStats = useMemo(() => {
    const providerTypes = ['direct connect', 'expressroute', 'cloud interconnect', 'fastconnect'];
    const destinationIds = new Set(nodes.filter(n => n.type === 'destination').map(n => n.id));
    const circuits = edges.filter(e =>
      providerTypes.some(t => e.type.toLowerCase().includes(t)) &&
      (destinationIds.has(e.source) || destinationIds.has(e.target))
    );
    const attached = circuits.filter(e => e.config?.lastMile).length;
    return { circuits: circuits.length, attached };
  }, [nodes, edges]);

  // Cloud-to-cloud paths under the active routing policy (PRD U3/U4)
  const cloudPaths = useMemo(
    () => (showAdvisor ? computeCloudPaths(nodes, edges, pathPolicy) : []),
    [showAdvisor, nodes, edges, pathPolicy]
  );

  // The routing policy also shapes remediation order (policy-driven, U4):
  // a security policy surfaces security fixes first; a cost policy walks
  // the cheapest fixes first.
  const policyOrderedPlan = useMemo(() => {
    if (pathPolicy === 'security') {
      return [...remediationPlan].sort((a, b) =>
        (a.finding.category === 'Security' ? 0 : 1) - (b.finding.category === 'Security' ? 0 : 1));
    }
    if (pathPolicy === 'cost') {
      return [...remediationPlan].sort((a, b) => a.impact.costDelta - b.impact.costDelta);
    }
    return remediationPlan;
  }, [remediationPlan, pathPolicy]);

  const openIssueCount = assessment
    ? assessment.findings.filter(f => f.severity === 'error' || f.severity === 'warning').length
    : 0;

  return {
    showAdvisor, setShowAdvisor,
    assessment, setAssessment,
    focusedFinding, setFocusedFinding,
    fixPreviewState, setFixPreviewState,
    simResult, setSimResult,
    advisorHistory,
    isApplyingAll, applyingStep, applyAllActiveRef,
    handleRunAdvisor, handleFocusFinding, handleApplyFix, handlePreviewFix,
    handleCancelPreview, handleSimulate, handleResetSim,
    handleApplyAll, handleStopApplyAll,
    remediationPlan: policyOrderedPlan, advisorNarrative, issueBadges, openIssueCount,
    cloudPaths, pathPolicy, setPathPolicy, focusedPath, setFocusedPath,
    attachStats
  };
}
