import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { lazy, Suspense } from 'react';
import { ConnectionConfig } from '../types';
import { Canvas } from './network-designer/Canvas';
import { Toolbar } from './network-designer/Toolbar';
import { StatusBar } from './network-designer/StatusBar';
import { NodeConfigPanel } from './network-designer/NodeConfigPanel';
import { EdgeConfigPanel } from './network-designer/EdgeConfigPanel';
import { AbstractionLevelSelector } from './network-designer/AbstractionLevelSelector';
import { HistoryDrawer } from './network-designer/HistoryDrawer';
import { ExportButton } from './network-designer/components/ExportButton';
import { getAutoConnectTarget, getEdgeDefaults } from '../data/connectionDefaults';
import {
  useNetworkHistory,
  useNetworkManager,
  useSelectionManager,
  useEdgeCreator,
  useTemplatesManager
} from '../hooks';
import { getNodeIcon } from '../utils/nodeUtils';
import { ensureNodesHaveGeoData } from '../utils/sampleGeoData';
import { seedAllEdgeMetrics } from '../utils/mockTelemetry';
import { Z_INDEX, getSafeCenter, CANVAS_BOUNDS } from '../constants';
import { NetworkNode, NetworkEdge } from './types';
import { DefaultNetworkSetup } from './network-designer/DefaultNetworkSetup';
import { Legend } from './network-designer/Legend';
import { computeLocationGroups } from './network-designer/LocationGroups';
import { TopologyImportModal } from './network-designer/advisor/TopologyImportModal';
import { AdvisorPanel } from './network-designer/advisor/AdvisorPanel';
import { runAdvisor, applyFix, Assessment, Finding } from './network-designer/advisor/advisorEngine';
import { previewFix, scoreFixImpact, buildRemediationPlan, FixPreview, FixImpact } from './network-designer/advisor/fixPreview';
import { simulateFailure, FailureResult } from './network-designer/advisor/failureSim';
import { composeNarrative } from './network-designer/advisor/narrative';
import { readHistory, appendHistory, HistoryPoint } from './network-designer/advisor/scoreHistory';
import { ParseResult } from './network-designer/advisor/topologyParser';
import { ArrowLeft, ChevronDown, ChevronUp, Eye, Pencil, Plus, Search, LayoutList, LayoutGrid, X } from 'lucide-react';

// Browser-cache persistence keys (proof of concept storage layer)
const STORAGE_TOPOLOGY = 'cloud-designer:topology';
const STORAGE_TEMPLATES = 'cloud-designer:templates';
const STORAGE_ASSESSMENT = 'cloud-designer:assessment';
// Shared design library - same store the welcome screen's "Open" view reads
const STORAGE_DESIGNS = 'savedTopologies';

interface SavedDesign {
  id: string;
  name: string;
  description?: string;
  savedAt: number;
  lastModified?: number;
  nodes: Omit<NetworkNode, 'icon'>[];
  edges: NetworkEdge[];
}

function stripIcons(nodes: NetworkNode[]) {
  return nodes.map(({ icon: _icon, ...rest }) => rest);
}

function rehydrateIcons(nodes: NetworkNode[]): NetworkNode[] {
  return nodes.map(node => ({
    ...node,
    icon: getNodeIcon(node.type, node.functionType, node.config?.networkType, node.config),
    // legacy nodes predate the configured flag - treat them as configured
    config: { ...node.config, configured: node.config?.configured ?? true }
  }));
}

function readStorage<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

// Lazy load heavy components
const GlobalView = lazy(() => import('./network-designer/global-view/GlobalView').then(module => ({ default: module.GlobalView })));
const CircuitView = lazy(() => import('./network-designer/circuit-view/CircuitView').then(module => ({ default: module.CircuitView })));
const AIRecommendationEngine = lazy(() => import('./network-designer/AIRecommendationEngine').then(module => ({ default: module.AIRecommendationEngine })));
const DesignAssistant = lazy(() => import('./network-designer/DesignAssistant').then(module => ({ default: module.DesignAssistant })));
const NetworkParameters = lazy(() => import('./network-designer/NetworkParameters').then(module => ({ default: module.NetworkParameters })));
const TemplatesManager = lazy(() => import('./network-designer/panels/TemplatesManager').then(module => ({ default: module.TemplatesManager })));
const SaveTemplateModal = lazy(() => import('./network-designer/SaveTemplateModal').then(module => ({ default: module.SaveTemplateModal })));
const NetworkSimulation = lazy(() => import('./network-designer/simulation/NetworkSimulation').then(module => ({ default: module.NetworkSimulation })));

// Loading component
function ComponentLoader() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
    </div>
  );
}

interface NetworkDesignerProps {
  onComplete: (config: ConnectionConfig) => void;
  onCancel: () => void;
  isReadOnly?: boolean;
  onToggleReadOnly?: () => void;
}

type AbstractionLevel = 'global' | 'network' | 'circuit';

interface CustomTemplate {
  id: string;
  name: string;
  description: string;
  nodes: NetworkNode[];
  edges: NetworkEdge[];
  isCustom?: boolean;
}

export function NetworkDesigner({
  onComplete,
  onCancel,
  isReadOnly = false,
  onToggleReadOnly
}: NetworkDesignerProps) {
  // Refs
  const canvasRef = useRef<HTMLDivElement>(null);
  
  // Abstraction level state
  const [abstractionLevel, setAbstractionLevel] = useState<AbstractionLevel>('network');
  
  // Custom templates state
  const [customTemplates, setCustomTemplates] = useState<CustomTemplate[]>([]);
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);
  
  // Network history management
  const { saveToHistory, undo, redo, canUndo, canRedo } = useNetworkHistory();
  
  // Network state management
  const {
    nodes,
    edges,
    networkScores,
    setNodes,
    setEdges,
    addNode,
    updateNode,
    deleteNode,
    updateEdge,
    deleteEdge,
    clearNetwork,
    applyTemplate
  } = useNetworkManager(saveToHistory);
  
  // Selection management
  const {
    selectedNode,
    selectedEdge,
    selectedNodeObject,
    selectedEdgeObject,
    showNodeConfig,
    showEdgeConfig,
    handleNodeSelection,
    handleEdgeSelection,
    clearSelection,
    setShowNodeConfig,
    setShowEdgeConfig
  } = useSelectionManager(nodes, edges);
  
  // Templates management
  const {
    showTemplatesDrawer,
    openTemplatesDrawer,
    closeTemplatesDrawer
  } = useTemplatesManager();

  // Advisor + import state
  const [showImportModal, setShowImportModal] = useState(false);
  const [showAdvisor, setShowAdvisor] = useState(false);
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [focusedFinding, setFocusedFinding] = useState<Finding | null>(null);
  const [fixPreviewState, setFixPreviewState] = useState<{ finding: Finding; preview: FixPreview; impact: FixImpact } | null>(null);
  const [simResult, setSimResult] = useState<FailureResult | null>(null);
  const [advisorHistory, setAdvisorHistory] = useState<HistoryPoint[]>(() => readHistory());
  const [isApplyingAll, setIsApplyingAll] = useState(false);
  const [applyingStep, setApplyingStep] = useState(0);
  const applyAllActiveRef = useRef(false);
  const [designName, setDesignName] = useState('AWS Connectivity Environment');
  const [designStatus, setDesignStatus] = useState<'draft' | 'saved'>('draft');
  const [displayMode, setDisplayMode] = useState<'icon' | 'card'>('icon');
  const [multiSelected, setMultiSelected] = useState<string[]>([]);
  const [filterQuery, setFilterQuery] = useState('');
  const [canvasHeight, setCanvasHeight] = useState(() =>
    Math.max(600, Math.min(1000, (typeof window !== 'undefined' ? window.innerHeight : 940) - 150))
  );
  const [groupColors, setGroupColors] = useState<Record<string, number>>(
    () => readStorage<Record<string, number>>('cloud-designer:groupColors') ?? {}
  );
  const [showSwitcher, setShowSwitcher] = useState(false);
  const [switcherQuery, setSwitcherQuery] = useState('');
  const [savedDesigns, setSavedDesigns] = useState<SavedDesign[]>(() => {
    const designs = readStorage<SavedDesign[]>(STORAGE_DESIGNS) ?? [];
    // One-time migration from the short-lived 'cloud-designer:designs' record format
    const legacy = readStorage<Record<string, { nodes: SavedDesign['nodes']; edges: NetworkEdge[]; savedAt: number }>>('cloud-designer:designs');
    if (legacy) {
      Object.entries(legacy).forEach(([name, d]) => {
        if (!designs.some(existing => existing.name === name)) {
          designs.unshift({
            id: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            name,
            savedAt: d.savedAt,
            nodes: d.nodes,
            edges: d.edges
          });
        }
      });
      try {
        localStorage.setItem(STORAGE_DESIGNS, JSON.stringify(designs));
        localStorage.removeItem('cloud-designer:designs');
      } catch { /* ignore */ }
    }
    return designs;
  });
  const restoredRef = useRef(false);

  // Restore persisted state from browser cache on first mount
  useEffect(() => {
    const savedTopology = readStorage<{ nodes: NetworkNode[]; edges: NetworkEdge[]; name?: string }>(STORAGE_TOPOLOGY);
    if (savedTopology && savedTopology.nodes?.length) {
      restoredRef.current = true;
      setNodes(rehydrateIcons(savedTopology.nodes));
      setEdges(seedAllEdgeMetrics(savedTopology.edges || []));
      if (savedTopology.name) setDesignName(savedTopology.name);
    }
    const savedTemplates = readStorage<CustomTemplate[]>(STORAGE_TEMPLATES);
    if (savedTemplates?.length) {
      setCustomTemplates(savedTemplates.map(t => ({ ...t, nodes: rehydrateIcons(t.nodes) })));
    }
    const savedAssessment = readStorage<Assessment>(STORAGE_ASSESSMENT);
    if (savedAssessment) setAssessment(savedAssessment);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Any topology change reverts a saved design to draft
  useEffect(() => {
    setDesignStatus('draft');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes, edges]);

  // Persist topology to browser cache whenever it changes
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        if (nodes.length > 0 || edges.length > 0) {
          localStorage.setItem(STORAGE_TOPOLOGY, JSON.stringify({ nodes: stripIcons(nodes), edges, name: designName }));
          // Upsert into the shared design library (also feeds the welcome screen)
          setSavedDesigns(prev => {
            const entry: SavedDesign = {
              id: designName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
              name: designName,
              savedAt: prev.find(d => d.name === designName)?.savedAt ?? Date.now(),
              lastModified: Date.now(),
              nodes: stripIcons(nodes),
              edges
            };
            const next = [entry, ...prev.filter(d => d.name !== designName)];
            localStorage.setItem(STORAGE_DESIGNS, JSON.stringify(next));
            return next;
          });
        } else if (restoredRef.current) {
          localStorage.removeItem(STORAGE_TOPOLOGY);
        }
      } catch { /* storage full or unavailable - mock POC, ignore */ }
    }, 500);
    return () => clearTimeout(timer);
  }, [nodes, edges, designName]);

  // Persist custom templates
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_TEMPLATES, JSON.stringify(customTemplates.map(t => ({ ...t, nodes: stripIcons(t.nodes) }))));
    } catch { /* ignore */ }
  }, [customTemplates]);

  // History drawer state
  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false);
  const [topologyHistory, setTopologyHistory] = useState<Array<{
    id: string;
    timestamp: number;
    nodes: NetworkNode[];
    edges: NetworkEdge[];
    preview: string;
  }>>([]);

  // Save topology to history whenever nodes or edges change significantly
  useEffect(() => {
    if (nodes.length > 0 || edges.length > 0) {
      const timer = setTimeout(() => {
        saveTopologyToHistory();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [nodes, edges]);

  const saveTopologyToHistory = () => {
    if (nodes.length === 0 && edges.length === 0) return;

    const preview = `${nodes.length} nodes, ${edges.length} connections`;
    const newHistoryItem = {
      id: `history-${Date.now()}`,
      timestamp: Date.now(),
      nodes: JSON.parse(JSON.stringify(nodes)),
      edges: JSON.parse(JSON.stringify(edges)),
      preview
    };

    setTopologyHistory(prev => {
      const isDuplicate = prev.some(item =>
        JSON.stringify(item.nodes) === JSON.stringify(nodes) &&
        JSON.stringify(item.edges) === JSON.stringify(edges)
      );

      if (isDuplicate) return prev;

      const newHistory = [newHistoryItem, ...prev];
      return newHistory.slice(0, 3);
    });
  };

  const handleRestoreTopology = (restoredNodes: NetworkNode[], restoredEdges: NetworkEdge[]) => {
    const nodesWithIcons = restoredNodes.map(node => ({
      ...node,
      icon: getNodeIcon(node.type, node.functionType, node.config?.networkType, node.config)
    }));

    setNodes(nodesWithIcons);
    setEdges(restoredEdges);
    saveToHistory(nodesWithIcons, restoredEdges);
  };

  // Helper to find node by ID
  const getNodeById = useCallback((id: string) => nodes.find(n => n.id === id), [nodes]);

  // Edge creation with service-aware defaults
  const {
    isCreatingEdge,
    edgeStart,
    toggleEdgeCreation,
    handleNodeClickForEdge,
    cancelEdgeCreation
  } = useEdgeCreator(edges, setEdges, (edge) => {
    handleEdgeSelection(edge);
  }, getNodeById);

  // Auto-connecting wrapper: adds node, then offers auto-connection
  const handleAddNode = useCallback((type: NetworkNode['type'], functionType?: NetworkNode['functionType'], networkType?: string, provider?: string) => {
    const newNode = addNode(type, functionType, networkType, provider);
    if (!newNode) return newNode;

    // Check for auto-connection opportunity
    const autoConnect = getAutoConnectTarget(newNode, nodes);
    if (autoConnect) {
      const { targetNode, edgeDefaults } = autoConnect;
      const newEdge: NetworkEdge = {
        id: `edge-${Date.now()}`,
        source: targetNode.id,
        target: newNode.id,
        type: edgeDefaults.type,
        bandwidth: edgeDefaults.bandwidth,
        status: 'inactive',
        config: {
          ...(edgeDefaults.resilience ? { resilience: edgeDefaults.resilience } : {}),
        }
      };
      const updatedEdges = [...edges, newEdge];
      setEdges(updatedEdges);
      saveToHistory([...nodes, newNode], updatedEdges);

      if (typeof window !== 'undefined' && window.addToast) {
        window.addToast({
          type: 'success',
          title: 'Auto-Connected',
          message: `${newNode.name} connected to ${targetNode.name} via ${edgeDefaults.type}`,
          duration: 3000
        });
      }
    }

    return newNode;
  }, [addNode, nodes, edges, setEdges, saveToHistory]);
  
  // Enrich nodes with geo data as soon as they exist - the Pano view is
  // always ready and coordinates persist to browser cache immediately
  useEffect(() => {
    if (nodes.length > 0) {
      const nodesNeedingGeo = nodes.filter(
        n => !n.config?.latitude || !n.config?.longitude ||
          // legacy center-of-US fallback from a failed lookup - re-resolve
          n.config?.country === 'Unknown' ||
          (n.config?.latitude === 39.8283 && n.config?.longitude === -98.5795)
      );
      if (nodesNeedingGeo.length > 0) {
        const enriched = ensureNodesHaveGeoData(nodes);
        const anyAdded = enriched.some(
          (n, i) => n.config?.latitude !== nodes[i]?.config?.latitude && n.config?.latitude !== undefined
        );
        if (anyAdded) setNodes(enriched);
      }
    }
  }, [abstractionLevel, nodes, setNodes]);

  // Check if we need to show the default network setup
  // (skipped when a persisted topology exists in browser cache)
  useEffect(() => {
    if (nodes.length === 0 && edges.length === 0 && !localStorage.getItem(STORAGE_TOPOLOGY)) {
      setShowDefaultSetup(true);
    }
  }, [nodes.length, edges.length]);

  // --- Topology import + Network Advisor ---

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

  const handleImportTopology = (result: ParseResult) => {
    const enriched = ensureNodesHaveGeoData(result.nodes);
    setNodes(enriched);
    setEdges(result.edges);
    saveToHistory(enriched, result.edges);
    if (result.sourceName) {
      setDesignName(result.sourceName.replace(/\.(json|csv)$/i, ''));
    }
    setShowDefaultSetup(false);
    clearSelection();

    const analysis = handleRunAdvisor(enriched, result.edges);
    window.addToast({
      type: 'success',
      title: 'Topology Imported',
      message: `${enriched.length} nodes and ${result.edges.length} connections loaded. Advisor found ${analysis.findings.length} findings.`,
      duration: 4000
    });
  };

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
  const remediationPlan = useMemo(
    () => (showAdvisor && assessment ? buildRemediationPlan(nodes, edges, assessment) : []),
    [showAdvisor, assessment, nodes, edges]
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
      curAssessment = runAdvisor(curNodes, curEdges);
      setAssessment(curAssessment);
      setAdvisorHistory(appendHistory(curAssessment));
      await new Promise(resolve => setTimeout(resolve, 1000));
      step++;
    }
    saveToHistory(curNodes, curEdges);
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

  const openIssueCount = assessment
    ? assessment.findings.filter(f => f.severity === 'error' || f.severity === 'warning').length
    : 0;

  // --- Connection switcher (design library) ---

  const handleSwitchDesign = (name: string) => {
    const design = savedDesigns.find(d => d.name === name);
    if (!design) return;
    setNodes(rehydrateIcons(design.nodes as NetworkNode[]));
    setEdges(seedAllEdgeMetrics(design.edges));
    setDesignName(name);
    setAssessment(null);
    setFocusedFinding(null);
    clearSelection();
    setShowSwitcher(false);
    setShowDefaultSetup(false);
  };

  const handleCreateNewDesign = () => {
    setNodes([]);
    setEdges([]);
    setDesignName(`New Network Design ${savedDesigns.length + 1}`);
    setAssessment(null);
    setFocusedFinding(null);
    clearSelection();
    setShowSwitcher(false);
    setShowDefaultSetup(true);
  };

  // --- Interactive location groups (sites) ---

  const handleMoveGroup = useCallback((memberIds: string[], dx: number, dy: number) => {
    setNodes(prev => prev.map(n =>
      memberIds.includes(n.id)
        ? { ...n, x: n.x + dx, y: Math.min(Math.max(n.y + dy, 20), CANVAS_BOUNDS.MAX_Y - 84) }
        : n
    ));
  }, [setNodes]);

  const handleMoveGroupEnd = useCallback(() => {
    saveToHistory(nodes, edges);
  }, [nodes, edges, saveToHistory]);

  const handleRenameGroup = (oldCity: string, newCity: string) => {
    setNodes(prev => prev.map(n => {
      if (n.config?.city !== oldCity) return n;
      const config = { ...n.config, city: newCity };
      // drop coordinates so geo enrichment re-resolves the new site name
      delete config.latitude;
      delete config.longitude;
      return { ...n, config };
    }));
    setGroupColors(prev => {
      const next = { ...prev };
      if (next[oldCity] !== undefined) { next[newCity] = next[oldCity]; delete next[oldCity]; }
      try { localStorage.setItem('cloud-designer:groupColors', JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
    window.addToast({ type: 'success', title: 'Site Renamed', message: `${oldCity} is now ${newCity}`, duration: 2500 });
  };

  const handleUngroup = (city: string) => {
    setNodes(prev => prev.map(n => {
      if (n.config?.city !== city) return n;
      const config = { ...n.config };
      delete config.city;
      return { ...n, config };
    }));
    window.addToast({ type: 'info', title: 'Site Ungrouped', message: `${city} dissolved - nodes keep their positions`, duration: 2500 });
  };

  const handleRecolorGroup = (city: string, paletteIndex: number) => {
    setGroupColors(prev => {
      const next = { ...prev, [city]: paletteIndex };
      try { localStorage.setItem('cloud-designer:groupColors', JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  };

  // Drop-to-adopt: releasing a node inside a site's container joins it
  const handleNodeDropMembership = (nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;
    const groups = computeLocationGroups(nodes, groupColors);
    const cx = node.x + 32;
    const cy = node.y + 32;
    const target = groups.find(g =>
      g.city !== node.config?.city &&
      cx > g.x && cx < g.x + g.width && cy > g.y && cy < g.y + g.height
    );
    if (target) {
      const anchor = nodes.find(n => n.id !== nodeId && n.config?.city === target.city && n.config?.latitude);
      updateNode(nodeId, {
        config: {
          ...node.config,
          city: target.city,
          ...(anchor ? { latitude: anchor.config!.latitude, longitude: anchor.config!.longitude } : {})
        }
      });
      window.addToast({ type: 'success', title: 'Joined Site', message: `${node.name} is now part of ${target.city}`, duration: 2500 });
    }
  };

  // Keyboard: Escape closes surfaces; Delete removes selection;
  // cmd+Z / cmd+shift+Z undo-redo; cmd+D duplicates
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const typing = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
      if (e.key === 'Escape') {
        // Advisor preview/sim take priority - first Esc clears them
        if (fixPreviewState || simResult) {
          setFixPreviewState(null);
          setSimResult(null);
          return;
        }
        setShowSwitcher(false);
        setShowImportModal(false);
        setFocusedFinding(null);
        setMultiSelected([]);
        return;
      }
      if (typing || isReadOnly) return;
      if ((e.key === 'Delete' || e.key === 'Backspace')) {
        if (multiSelected.length > 0) {
          e.preventDefault();
          const remaining = nodes.filter(n => !multiSelected.includes(n.id));
          const remainingEdges = edges.filter(ed => !multiSelected.includes(ed.source) && !multiSelected.includes(ed.target));
          setNodes(remaining);
          setEdges(remainingEdges);
          saveToHistory(remaining, remainingEdges);
          setMultiSelected([]);
          clearSelection();
        } else if (selectedNode) {
          e.preventDefault();
          deleteNode(selectedNode);
          clearSelection();
        } else if (selectedEdge) {
          e.preventDefault();
          deleteEdge(selectedEdge);
          clearSelection();
        }
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) handleRedo(); else handleUndo();
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'd') {
        if (selectedNode) {
          e.preventDefault();
          handleDuplicateNode(selectedNode);
        }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  });

  // Highlight maps fed to the canvas. Failure simulation overrides the
  // focused finding: the failed node and everything it strands paint red.
  type Sev = 'error' | 'warning' | 'recommendation' | 'positive';
  const highlightedNodes: Record<string, Sev> = simResult
    ? Object.fromEntries([simResult.failedNodeId, ...simResult.unreachableNodeIds].map(id => [id, 'error' as Sev]))
    : focusedFinding
      ? Object.fromEntries(focusedFinding.nodeIds.map(id => [id, focusedFinding.severity]))
      : {};
  const highlightedEdges: Record<string, Sev> = simResult
    ? Object.fromEntries(simResult.deadEdgeIds.map(id => [id, 'error' as Sev]))
    : focusedFinding
      ? Object.fromEntries(focusedFinding.edgeIds.map(id => [id, focusedFinding.severity]))
      : {};
  
  // Handle default network setup completion
  const handleDefaultNetworkSetup = (cloudRouterName: string) => {
    const center = getSafeCenter(800, CANVAS_BOUNDS.MAX_Y);
    // Create default nodes
    const cloudRouter: NetworkNode = {
      id: `node-${Date.now()}-cloud-router`,
      type: 'function',
      functionType: 'Router',
      x: center.x + 100,
      y: center.y,
      name: cloudRouterName,
      icon: getNodeIcon('function', 'Router', undefined, { routerType: 'cloud' }),
      status: 'inactive',
      config: {
        routerType: 'cloud',
        provider: 'Cloud Provider'
      }
    };
    
    const attCore: NetworkNode = {
      id: `node-${Date.now()}-att-core`,
      type: 'network',
      x: center.x - 100,
      y: center.y,
      name: 'AT&T Core',
      icon: getNodeIcon('network', undefined, 'at&t core'),
      status: 'inactive',
      config: {
        networkType: 'at&t core',
        provider: 'AT&T'
      }
    };
    
    // Create connection between them
    const connection: NetworkEdge = {
      id: `edge-${Date.now()}-default`,
      source: attCore.id,
      target: cloudRouter.id,
      type: 'MPLS',
      bandwidth: '10 Gbps',
      status: 'inactive',
      config: {
        resilience: 'standard'
      }
    };
    
    // Set the default network
    setNodes([attCore, cloudRouter]);
    setEdges([connection]);
    saveToHistory([attCore, cloudRouter], [connection]);
    
    setShowDefaultSetup(false);
    
    window.addToast({
      type: 'success',
      title: 'Default Network Created',
      message: 'Your network has been initialized with a cloud router connected to AT&T Core',
      duration: 3000
    });
  };
  
  // UI state
  const [isRunningScenario, setIsRunningScenario] = useState(false);
  const [showDefaultSetup, setShowDefaultSetup] = useState(false);
  
  // Simulation data
  const [simulationData, setSimulationData] = useState({
    progress: 0,
    metrics: {
      bandwidth: { current: 0, max: 100 },
      latency: { current: 0, max: 100 },
      packets: { sent: 0, received: 0, errors: 0 }
    },
    phase: 'idle' as 'idle' | 'initializing' | 'running' | 'completed' | 'error' | 'paused',
    networkScores
  });

  // Update simulation network scores when networkScores change
  useEffect(() => {
    setSimulationData(prev => ({
      ...prev,
      networkScores
    }));
  }, [networkScores]);
  
  // Handle node click in canvas
  const handleNodeClick = (node: NetworkNode | null) => {
    if (!node) {
      clearSelection();
      if (isCreatingEdge) {
        cancelEdgeCreation();
      }
      return;
    }
    
    // If we're creating an edge, handle edge creation
    if (isCreatingEdge) {
      const handled = handleNodeClickForEdge(node.id, node.id);
      if (handled) return;
    }
    
    // Otherwise, handle node selection
    handleNodeSelection(node);
  };
  
  // Handle undo - restore nodes and edges from history
  const handleUndo = () => {
    const prevState = undo();
    if (prevState) {
      const nodesWithIcons = prevState.nodes.map(node => ({
        ...node,
        icon: getNodeIcon(node.type, node.functionType, node.config?.networkType, node.config)
      }));
      setNodes(nodesWithIcons);
      setEdges(prevState.edges);
    }
  };

  // Canvas fills the viewport (clamped) instead of a fixed 800px strip
  useEffect(() => {
    const onResize = () => setCanvasHeight(Math.max(600, Math.min(1000, window.innerHeight - 150)));
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Handle redo - restore next state from history
  const handleRedo = () => {
    const nextState = redo();
    if (nextState) {
      setNodes(rehydrateIcons(nextState.nodes));
      setEdges(nextState.edges);
    }
  };

  // Duplicate the selected node (cmd+D)
  const handleDuplicateNode = (nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;
    const clone: NetworkNode = {
      ...node,
      id: `node-${Date.now()}-copy`,
      name: `${node.name} copy`,
      x: Math.min(node.x + 90, 1000),
      y: Math.min(node.y + 40, canvasHeight - 100),
      config: { ...node.config }
    };
    const next = [...nodes, clone];
    setNodes(next);
    saveToHistory(next, edges);
    handleNodeSelection(clone);
  };

  // Drag-to-connect: create a service-aware edge between two nodes
  const handleConnectNodes = (sourceId: string, targetId: string) => {
    if (sourceId === targetId) return;
    if (edges.some(e =>
      (e.source === sourceId && e.target === targetId) ||
      (e.source === targetId && e.target === sourceId)
    )) return;
    const source = nodes.find(n => n.id === sourceId);
    const target = nodes.find(n => n.id === targetId);
    if (!source || !target) return;
    const defaults = getEdgeDefaults(source, target);
    const newEdge: NetworkEdge = {
      id: `edge-${Date.now()}`,
      source: sourceId,
      target: targetId,
      type: defaults.type,
      bandwidth: defaults.bandwidth,
      status: 'inactive',
      config: defaults.resilience ? { resilience: defaults.resilience as 'single' | 'redundant' | 'ha' | 'dualdiverse' } : {}
    };
    const next = [...edges, newEdge];
    setEdges(next);
    saveToHistory(nodes, next);
    window.addToast({
      type: 'success',
      title: 'Connected',
      message: `${source.name} to ${target.name} via ${defaults.type}`,
      duration: 2500
    });
  };

  // Failure sim dims the stranded side of the network
  const simDimmedIds = simResult ? simResult.unreachableNodeIds : [];

  // Filter: nodes not matching the query get dimmed on the canvas
  const filterDimmedIds = filterQuery.trim()
    ? nodes
        .filter(n => {
          const q = filterQuery.toLowerCase();
          return !(
            n.name.toLowerCase().includes(q) ||
            n.type.includes(q) ||
            (n.functionType ?? '').toLowerCase().includes(q) ||
            (n.config?.provider ?? '').toLowerCase().includes(q) ||
            (n.config?.city ?? '').toLowerCase().includes(q)
          );
        })
        .map(n => n.id)
    : [];

  const dimmedNodeIds = [...new Set([...filterDimmedIds, ...simDimmedIds])];

  // Handle node drag - multi-selected nodes move together
  const handleNodeDrag = (nodeId: string, x: number, y: number) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;
    const dx = x - node.x;
    const dy = y - node.y;
    const moveIds = multiSelected.includes(nodeId) ? multiSelected : [nodeId];
    setNodes(prev =>
      prev.map(n => moveIds.includes(n.id)
        ? { ...n, x: n.x + dx, y: Math.min(n.y + dy, canvasHeight - 84) }
        : n
      )
    );
  };
  
  // Handle node drag end - commit history, then membership adoption
  const handleNodeDragEnd = (nodeId?: string) => {
    saveToHistory(nodes, edges);
    if (nodeId) handleNodeDropMembership(nodeId);
  };
  
  // Handle running simulation
  const handleRunSimulation = async () => {
    const { runSimulation } = await import('./network-designer/simulation/runSimulation');
    await runSimulation(
      nodes,
      edges,
      setNodes,
      setEdges,
      setSimulationData as any,
      setIsRunningScenario
    );
  };

  // Handle pausing simulation
  const handlePauseSimulation = async () => {
    const { pauseSimulation } = await import('./network-designer/simulation/runSimulation');
    pauseSimulation();
  };

  // Handle resuming simulation
  const handleResumeSimulation = async () => {
    const { resumeSimulation } = await import('./network-designer/simulation/runSimulation');
    resumeSimulation();
  };

  // Handle injecting latency
  const handleInjectLatency = async (amount: number) => {
    const { injectLatency } = await import('./network-designer/simulation/runSimulation');
    injectLatency(amount);
    window.addToast({
      type: 'info',
      title: 'Latency Injection',
      message: `Added ${amount}ms of latency to the network`,
      duration: 3000
    });
  };

  // Handle injecting packet loss
  const handleInjectPacketLoss = async (amount: number) => {
    const { injectPacketLoss } = await import('./network-designer/simulation/runSimulation');
    injectPacketLoss(amount);
    window.addToast({
      type: 'info',
      title: 'Packet Loss Injection',
      message: `Added ${amount}% packet loss to the network`,
      duration: 3000
    });
  };

  // Handle limiting bandwidth
  const handleInjectBandwidthLimit = async (amount: number) => {
    const { injectBandwidthLimit } = await import('./network-designer/simulation/runSimulation');
    injectBandwidthLimit(amount);
    window.addToast({
      type: 'info',
      title: 'Bandwidth Limit',
      message: `Limited bandwidth to ${amount}% of maximum`,
      duration: 3000
    });
  };
  
  // Handle creating connections
  const handleCreateConnections = () => {
    if (!edges.length) {
      window.addToast({
        type: 'error',
        title: 'No Connections',
        message: 'Please create at least one connection first',
        duration: 3000
      });
      return;
    }
    
    // Prepare configuration to return to parent
    const config: ConnectionConfig = {
      provider: 'Custom',
      type: 'Network Designer',
      bandwidth: 'Custom',
      location: 'Custom',
      nodes,
      edges,
    };

    setDesignStatus('saved');
    onComplete(config);
  };
  
  // Handle saving the current network as a template
  const handleSaveTemplate = () => {
    setShowSaveTemplateModal(true);
  };
  
  // Handle save template submission
  const handleSaveTemplateSubmit = (name: string, description: string) => {
    const newTemplate: CustomTemplate = {
      id: `custom-${Date.now()}`,
      name,
      description,
      nodes: [...nodes],
      edges: [...edges],
      isCustom: true
    };
    
    setCustomTemplates([...customTemplates, newTemplate]);
    setShowSaveTemplateModal(false);
    
    window.addToast({
      type: 'success',
      title: 'Template Saved',
      message: `Your network has been saved as template "${name}"`,
      duration: 3000
    });
  };
  
  // Handle deleting a custom template
  const handleDeleteCustomTemplate = (id: string) => {
    setCustomTemplates(customTemplates.filter(template => template.id !== id));
    
    window.addToast({
      type: 'success',
      title: 'Template Deleted',
      message: 'Custom template has been deleted',
      duration: 3000
    });
  };
  
  // Handle applying pattern from outcome selector
  const handleApplyOutcomePattern = (patternNodes: NetworkNode[], patternEdges: NetworkEdge[]) => {
    // If we already have nodes, position new ones appropriately
    if (nodes.length > 0) {
      // Calculate average position of existing nodes
      const existingXs = nodes.map(n => n.x);
      const existingYs = nodes.map(n => n.y);
      const avgX = existingXs.reduce((sum, x) => sum + x, 0) / existingXs.length;
      const avgY = existingYs.reduce((sum, y) => sum + y, 0) / existingYs.length;
      
      // Map to keep track of old IDs to new IDs
      const idMap = new Map<string, string>();
      
      // Create nodes with new IDs and adjusted positions
      const newNodes = patternNodes.map(node => {
        const newId = `node-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
        idMap.set(node.id, newId);
        
        // Position new nodes to the side of existing ones
        const adjustedX = avgX > 400 ? node.x - 200 : node.x + 200;
        
        return {
          ...node,
          id: newId,
          x: adjustedX,
          y: node.y
        };
      });
      
      // Create edges with updated node references
      const newEdges = patternEdges.map(edge => {
        const newSource = idMap.get(edge.source) || edge.source;
        const newTarget = idMap.get(edge.target) || edge.target;
        
        return {
          ...edge,
          id: `edge-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          source: newSource,
          target: newTarget
        };
      });
      
      // Add new nodes and edges to existing ones
      setNodes([...nodes, ...newNodes]);
      setEdges([...edges, ...newEdges]);
      saveToHistory([...nodes, ...newNodes], [...edges, ...newEdges]);
    } else {
      // If no existing nodes, just use the pattern nodes and edges
      setNodes(patternNodes);
      setEdges(patternEdges);
      saveToHistory(patternNodes, patternEdges);
    }
    
    window.addToast({
      type: 'success',
      title: 'Pattern Applied',
      message: 'Network pattern has been applied',
      duration: 3000
    });
  };
  
  // Handle parameter change
  const handleParameterChange = (parameter: string, value: number) => {
    setSimulationData(prev => ({
      ...prev,
      networkScores: {
        ...prev.networkScores,
        [parameter]: value
      }
    }));
  };
  
  // Handle zoom to specific node in circuit view
  const handleZoomToNode = (nodeId: string) => {
    handleNodeSelection(nodes.find(n => n.id === nodeId) || null);
    setAbstractionLevel('network');
  };
  
  // Helper to render the current abstraction level view
  const renderAbstractionLevelView = () => {
    switch (abstractionLevel) {
      case 'global':
        return (
          <Suspense fallback={<ComponentLoader />}>
            <GlobalView
              nodes={nodes}
              edges={edges}
              onNodeSelect={(nodeId) => handleNodeSelection(nodes.find(n => n.id === nodeId) || null)}
              onZoomIn={(datacenterId) => {
                handleNodeSelection(nodes.find(n => n.id === datacenterId) || null);
                setAbstractionLevel('network');
              }}
            />
          </Suspense>
        );
      case 'network':
        return (
          <Canvas
            nodes={nodes}
            edges={edges}
            selectedNode={selectedNode}
            selectedEdge={selectedEdge}
            isCreatingEdge={isCreatingEdge}
            edgeStart={edgeStart}
            isReadOnly={isReadOnly}
            onNodeClick={handleNodeClick}
            onNodeDrag={handleNodeDrag}
            onNodeDragEnd={handleNodeDragEnd}
            onEdgeClick={handleEdgeSelection}
            maxY={canvasHeight}
            highlightedNodes={highlightedNodes}
            highlightedEdges={highlightedEdges}
            displayMode={displayMode}
            groupColorOverrides={groupColors}
            multiSelectedIds={multiSelected}
            onMarqueeSelect={setMultiSelected}
            dimmedNodeIds={dimmedNodeIds}
            onConnectNodes={handleConnectNodes}
            onMoveGroup={handleMoveGroup}
            onMoveGroupEnd={handleMoveGroupEnd}
            onRenameGroup={handleRenameGroup}
            onUngroup={handleUngroup}
            onRecolorGroup={handleRecolorGroup}
            ghostNodes={fixPreviewState?.preview.ghostNodes}
            ghostEdges={fixPreviewState?.preview.ghostEdges}
            changedEdgeIds={fixPreviewState?.preview.changedEdgeIds}
            issueBadges={issueBadges}
            ref={canvasRef}
          />
        );
        
      case 'circuit':
        return (
          <Suspense fallback={<ComponentLoader />}>
            <CircuitView
              nodes={nodes}
              edges={edges}
              selectedNode={selectedNode}
              onNodeSelect={handleNodeSelection}
              onZoomOut={() => setAbstractionLevel('network')}
            />
          </Suspense>
        );
        
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col bg-gray-50 rounded-xl border-2 border-gray-200 relative">
      {/* Main Content Area */}
      <div className="relative" style={{ zIndex: 1, height: canvasHeight }}>
        {/* Abstraction Level Selector - navigation works in read mode too */}
        <div style={{ zIndex: Z_INDEX.CHROME }}>
          <AbstractionLevelSelector
            currentLevel={abstractionLevel}
            onLevelChange={setAbstractionLevel}
            onHistoryClick={() => setShowHistoryDrawer(true)}
            hideHistory={isReadOnly}
          />
        </div>

        {/* Status Bar - Only shown in network view */}
        {abstractionLevel === 'network' && (
          <div style={{ zIndex: Z_INDEX.CHROME }}>
            <StatusBar
              nodes={nodes}
              edges={edges}
              canvasRef={canvasRef}
              onRefresh={() => {
                window.addToast({
                  type: 'info',
                  title: 'Refreshing Network',
                  message: 'Updating network status and metrics...',
                  duration: 2000
                });
              }}
              onSelectNode={(nodeId) => {
                const node = nodes.find(n => n.id === nodeId);
                if (node) handleNodeSelection(node);
              }}
              onSelectEdge={(edgeId) => {
                const edge = edges.find(e => e.id === edgeId);
                if (edge) handleEdgeSelection(edge);
              }}
            />
          </div>
        )}

        {/* Back + design name pill with connection switcher - per Figma top-left chrome */}
        {(
          <div className="absolute top-4 left-4" style={{ zIndex: Z_INDEX.FLOATING_PANEL }}>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex items-center px-3 py-2 gap-2">
              <button
                onClick={onCancel}
                className="flex items-center gap-1.5 text-sm font-medium text-fw-link hover:text-fw-linkHover transition-colors"
                type="button"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
              <div className="h-5 w-px bg-gray-200" />
              <button
                onClick={() => setShowSwitcher(!showSwitcher)}
                className="flex items-center gap-2 group"
                type="button"
              >
                <span className="text-sm font-medium text-fw-heading max-w-[180px] truncate" title={designName}>
                  {designName}
                </span>
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium tracking-wide uppercase ${
                  designStatus === 'saved' ? 'bg-fw-success-bg text-fw-success' : 'bg-fw-neutral text-fw-bodyLight'
                }`}>
                  {designStatus === 'saved' ? 'Saved' : 'Draft'}
                </span>
                {showSwitcher
                  ? <ChevronUp className="h-4 w-4 text-fw-bodyLight group-hover:text-fw-body" />
                  : <ChevronDown className="h-4 w-4 text-fw-bodyLight group-hover:text-fw-body" />}
              </button>
            </div>

            {/* Connection switcher dropdown - per Figma browsing frame */}
            {showSwitcher && (
              <div className="mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="p-3 pb-2">
                  <div className="relative">
                    <Search className="h-4 w-4 text-fw-disabled absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      value={switcherQuery}
                      onChange={e => setSwitcherQuery(e.target.value)}
                      placeholder="Search"
                      className="w-full pl-9 pr-3 py-2 text-sm border border-fw-border-secondary rounded-full bg-fw-base text-fw-body placeholder:text-fw-disabled"
                    />
                  </div>
                </div>
                <button
                  onClick={handleCreateNewDesign}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-fw-link hover:bg-fw-wash transition-colors"
                  type="button"
                >
                  <Plus className="h-4 w-4" />
                  Create New Connection
                </button>
                <div className="max-h-56 overflow-y-auto custom-scrollbar border-t border-fw-border-secondary">
                  {savedDesigns
                    .filter(design => design.name.toLowerCase().includes(switcherQuery.toLowerCase()))
                    .sort((a, b) => (b.lastModified ?? b.savedAt) - (a.lastModified ?? a.savedAt))
                    .map(design => (
                      <button
                        key={design.id}
                        onClick={() => handleSwitchDesign(design.name)}
                        className={`w-full flex items-start gap-2.5 px-4 py-2.5 text-left hover:bg-fw-wash transition-colors ${
                          design.name === designName ? 'bg-fw-accent' : ''
                        }`}
                        type="button"
                      >
                        <span className={`mt-1.5 h-2 w-2 rounded-full flex-shrink-0 ${
                          design.name === designName && designStatus === 'saved' ? 'bg-green-600' : 'bg-gray-300'
                        }`} />
                        <span className="min-w-0">
                          <span className="flex items-center gap-2">
                            <span className="text-sm font-medium text-fw-heading truncate">{design.name}</span>
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-medium tracking-wide bg-fw-neutral text-fw-bodyLight uppercase">
                              Draft
                            </span>
                          </span>
                          <span className="block text-xs text-fw-bodyLight mt-0.5">
                            {design.description || `${design.nodes.length} nodes - ${design.edges.length} connections`}
                          </span>
                        </span>
                      </button>
                    ))}
                  {savedDesigns.length === 0 && (
                    <p className="px-4 py-3 text-xs text-fw-bodyLight">No saved designs yet.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Filter pill - dims non-matching nodes (Figma: Filter exploration) */}
        {abstractionLevel === 'network' && (
          <div
            className="absolute top-16 left-4 bg-white rounded-full shadow-sm border border-gray-200 flex items-center px-3 py-1.5 gap-2"
            style={{ zIndex: Z_INDEX.CHROME }}
          >
            <Search className="h-3.5 w-3.5 text-fw-bodyLight" />
            <input
              value={filterQuery}
              onChange={e => setFilterQuery(e.target.value)}
              placeholder="Filter nodes"
              className="w-28 text-xs bg-transparent outline-none text-fw-body placeholder:text-fw-disabled"
            />
            {filterQuery && (
              <button onClick={() => setFilterQuery('')} className="text-fw-bodyLight hover:text-fw-body" type="button" aria-label="Clear filter">
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        )}

        {/* Read / Edit mode pill - per Figma top-right chrome */}
        {onToggleReadOnly && (
          <div
            className="absolute top-4 right-4 bg-white rounded-xl shadow-sm border border-gray-200 flex items-center p-1"
            style={{ zIndex: Z_INDEX.CHROME }}
          >
            <button
              onClick={() => isReadOnly || onToggleReadOnly()}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                isReadOnly ? 'bg-fw-ctaGhost text-fw-link' : 'text-fw-bodyLight hover:bg-fw-wash'
              }`}
              type="button"
            >
              <Eye className="h-4 w-4" />
              Read
            </button>
            <button
              onClick={() => isReadOnly && onToggleReadOnly()}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                !isReadOnly ? 'bg-fw-ctaGhost text-fw-link' : 'text-fw-bodyLight hover:bg-fw-wash'
              }`}
              type="button"
            >
              <Pencil className="h-4 w-4" />
              Edit
            </button>
            <div className="h-5 w-px bg-gray-200 mx-1" />
            <button
              onClick={() => setDisplayMode(displayMode === 'icon' ? 'card' : 'icon')}
              className="p-1.5 rounded-lg text-fw-bodyLight hover:bg-fw-wash transition-colors"
              title={displayMode === 'icon' ? 'Switch to detail cards' : 'Switch to icon nodes'}
              type="button"
            >
              {displayMode === 'icon' ? <LayoutList className="h-4 w-4" /> : <LayoutGrid className="h-4 w-4" />}
            </button>
          </div>
        )}

        {/* Render the current abstraction level view */}
        {renderAbstractionLevelView()}

        {/* Canvas legend - per Figma state legend */}
        {abstractionLevel === 'network' && <Legend />}

        {/* Network Advisor panel */}
        {(
          <AdvisorPanel
            assessment={assessment}
            narrative={advisorNarrative}
            history={advisorHistory}
            plan={remediationPlan}
            nodes={nodes}
            simResult={simResult}
            previewFindingId={fixPreviewState?.finding.id ?? null}
            isApplyingAll={isApplyingAll}
            applyingStep={applyingStep}
            isOpen={showAdvisor}
            focusedFindingId={focusedFinding?.id ?? null}
            onClose={() => setShowAdvisor(false)}
            onRerun={() => handleRunAdvisor()}
            onFocusFinding={handleFocusFinding}
            onPreviewFix={handlePreviewFix}
            onCancelPreview={handleCancelPreview}
            onApplyFix={handleApplyFix}
            onApplyAll={handleApplyAll}
            onStopApplyAll={handleStopApplyAll}
            onSimulate={handleSimulate}
            onResetSim={handleResetSim}
            onTabChange={() => { setFixPreviewState(null); setSimResult(null); setFocusedFinding(null); }}
          />
        )}

        {/* Fix preview banner - floats over the canvas while a ghost is live */}
        {fixPreviewState && (
          <div
            className="absolute top-16 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-white rounded-full shadow-lg border border-green-600/40 pl-4 pr-2 py-2"
            style={{ zIndex: Z_INDEX.CHROME }}
          >
            <span className="text-xs font-medium text-fw-heading whitespace-nowrap">
              Previewing: {fixPreviewState.finding.fix?.label}
            </span>
            <span className="flex items-center gap-1.5 text-[11px] whitespace-nowrap">
              {fixPreviewState.impact.deltas.resilience > 0 && (
                <span className="px-1.5 py-0.5 rounded bg-fw-success-bg text-fw-success font-medium">+{fixPreviewState.impact.deltas.resilience} Resilience</span>
              )}
              {fixPreviewState.impact.deltas.security > 0 && (
                <span className="px-1.5 py-0.5 rounded bg-fw-success-bg text-fw-success font-medium">+{fixPreviewState.impact.deltas.security} Security</span>
              )}
              <span className={`px-1.5 py-0.5 rounded font-medium ${
                fixPreviewState.impact.costDelta > 0 ? 'bg-fw-wash text-fw-bodyLight' : 'bg-fw-success-bg text-fw-success'
              }`}>
                {fixPreviewState.impact.costDelta > 0
                  ? `+$${fixPreviewState.impact.costDelta.toLocaleString()}/mo`
                  : 'no added cost'}
              </span>
              <span className="text-fw-bodyLight">grade {assessment?.grade} &rarr; {fixPreviewState.impact.gradeAfter}</span>
            </span>
            <button
              onClick={() => handleApplyFix(fixPreviewState.finding)}
              className="px-3 py-1 rounded-full text-xs font-medium bg-fw-success text-white hover:opacity-90"
              type="button"
            >
              Apply
            </button>
            <button
              onClick={handleCancelPreview}
              className="px-3 py-1 rounded-full text-xs font-medium bg-fw-wash text-fw-body hover:bg-fw-neutral"
              type="button"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Topology import modal */}
        <TopologyImportModal
          isOpen={showImportModal}
          onClose={() => setShowImportModal(false)}
          onImport={handleImportTopology}
        />
        
        {/* Toolbar - Only show in network view with highest z-index */}
        {abstractionLevel === 'network' && !isReadOnly && (
          <div style={{ zIndex: Z_INDEX.CHROME, pointerEvents: 'auto' }}>
            <Toolbar
              onAddNode={handleAddNode}
              onToggleEdgeCreation={toggleEdgeCreation}
              isCreatingEdge={isCreatingEdge}
              onCancel={handleUndo}
              hasConnections={edges.length > 0}
              canUndo={canUndo}
              onRunScenario={handleRunSimulation}
              isRunningScenario={isRunningScenario}
              onCreateConnections={handleCreateConnections}
              onSaveTemplate={handleSaveTemplate}
              onClearCanvas={clearNetwork}
              onOpenTemplates={openTemplatesDrawer}
              onImportTopology={() => setShowImportModal(true)}
              onOpenAdvisor={() => (assessment ? setShowAdvisor(true) : handleRunAdvisor())}
              advisorBadge={openIssueCount}
              exportSlot={<ExportButton nodes={nodes} edges={edges} canvasRef={canvasRef} />}
            />
          </div>
        )}
        
        {/* Node Configuration Panel - Only in network view */}
        {abstractionLevel === 'network' && selectedNodeObject && showNodeConfig && !isReadOnly && (
         !(selectedNodeObject.config?.networkType === 'at&t core' || selectedNodeObject.name === 'AT&T Core') && (
            <NodeConfigPanel
              node={selectedNodeObject}
              isVisible={showNodeConfig}
              onClose={() => setShowNodeConfig(false)}
              onUpdate={(updates) => updateNode(selectedNodeObject.id, updates)}
              onDelete={deleteNode}
              containerRef={canvasRef}
            />
          )
        )}
        
        {/* Edge Configuration Panel - Only in network view */}
        {abstractionLevel === 'network' && selectedEdgeObject && showEdgeConfig && !isReadOnly && (
          <EdgeConfigPanel
            edge={selectedEdgeObject}
            nodes={nodes}
            isVisible={showEdgeConfig}
            onClose={() => setShowEdgeConfig(false)}
            onUpdate={(updates) => updateEdge(selectedEdgeObject.id, updates)}
            onDelete={() => deleteEdge(selectedEdgeObject.id)}
            containerRef={canvasRef}
          />
        )}
        
        {/* Simulation Overlay */}
        <Suspense fallback={null}>
          <NetworkSimulation 
            isRunning={isRunningScenario}
            simulationData={simulationData as any}
            onPause={handlePauseSimulation}
            onResume={handleResumeSimulation}
            onInjectLatency={handleInjectLatency}
            onInjectPacketLoss={handleInjectPacketLoss}
            onInjectBandwidthLimit={handleInjectBandwidthLimit}
          />
        </Suspense>
        
        {/* Save Template Modal */}
        <Suspense fallback={null}>
          <SaveTemplateModal
            isOpen={showSaveTemplateModal}
            onClose={() => setShowSaveTemplateModal(false)}
            onSave={handleSaveTemplateSubmit}
          />
        </Suspense>
        
        {/* Default Network Setup Modal */}
        <DefaultNetworkSetup
          isOpen={showDefaultSetup}
          onComplete={handleDefaultNetworkSetup}
          onApplyTemplate={(templateNodes, templateEdges, name) => {
            setNodes(templateNodes);
            setEdges(templateEdges);
            if (name) setDesignName(name);
            saveToHistory(templateNodes, templateEdges);
            setShowDefaultSetup(false);
            
            window.addToast({
              type: 'success',
              title: 'Template Applied',
              message: 'Network template has been applied successfully',
              duration: 3000
            });
          }}
        />
      </div>

      {/* Templates Manager */}
      <Suspense fallback={null}>
        <TemplatesManager
          isOpen={showTemplatesDrawer}
          onClose={closeTemplatesDrawer}
          onApplyTemplate={applyTemplate}
          customTemplates={customTemplates}
          onDeleteCustomTemplate={handleDeleteCustomTemplate}
        />
      </Suspense>

      {/* History Drawer */}
      <HistoryDrawer
        isOpen={showHistoryDrawer}
        onClose={() => setShowHistoryDrawer(false)}
        history={topologyHistory}
        onRestoreTopology={handleRestoreTopology}
      />
    </div>
  );
}