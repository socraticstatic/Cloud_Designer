// Application constants

export const CANVAS_BOUNDS = {
  MAX_Y: 800,
  NODE_SIZE: 64,
  GRID_SIZE: 20
} as const;

export const ZOOM_LIMITS = {
  MIN: 0.5,
  MAX: 3,
  STEP: 0.2,
  DEFAULT: 1
} as const;

export const ANIMATION_DURATIONS = {
  FAST: 200,
  NORMAL: 300,
  SLOW: 500
} as const;

export const CANVAS_SAFE_AREA = {
  TOP: 56,      // StatusBar height + gap
  BOTTOM: 64,   // Toolbar height + bottom-6 gap
  LEFT: 72,     // AbstractionLevelSelector width + gap
  RIGHT: 56,    // ZoomControls width + gap
} as const;

export function getSafeCenter(canvasWidth: number, canvasHeight: number) {
  return {
    x: (canvasWidth - CANVAS_SAFE_AREA.LEFT - CANVAS_SAFE_AREA.RIGHT) / 2 + CANVAS_SAFE_AREA.LEFT,
    y: (canvasHeight - CANVAS_SAFE_AREA.TOP - CANVAS_SAFE_AREA.BOTTOM) / 2 + CANVAS_SAFE_AREA.TOP,
  };
}

export function getSafeBounds(canvasWidth: number, canvasHeight: number) {
  return {
    minX: CANVAS_SAFE_AREA.LEFT,
    minY: CANVAS_SAFE_AREA.TOP,
    maxX: canvasWidth - CANVAS_SAFE_AREA.RIGHT,
    maxY: canvasHeight - CANVAS_SAFE_AREA.BOTTOM,
  };
}

export const Z_INDEX = {
  BACKGROUND: 1,
  GRID: 2,
  CANVAS_CONTENT: 5,
  EDGES: 10,
  EDGE_CONTROLS: 15,
  NODES: 20,
  CHROME: 80,            // Toolbar, StatusBar, AbstractionLevelSelector, ZoomControls
  FLOATING_PANEL: 90,    // NodeConfigPanel, EdgeConfigPanel
  MODAL: 100,            // DefaultNetworkSetup, SaveTemplate
  NOTIFICATIONS: 200,
} as const;

export const DEFAULT_NETWORK_CONFIG = {
  ATT_CORE: {
    networkType: 'at&t core',
    provider: 'AT&T'
  },
  GATEWAY: {
    routerType: 'cloud'
  },
  DEFAULT_CONNECTION: {
    type: 'MPLS',
    bandwidth: '10 Gbps',
    resilience: 'standard'
  }
} as const;

// AT&T Service-Aware Provider Definitions
export const CLOUD_PROVIDERS = [
  { id: 'AWS', label: 'AWS', defaultEdgeType: 'Direct Connect', defaultBandwidth: '10 Gbps', netbondService: 'NetBond for AWS', description: 'Amazon Web Services via AWS Direct Connect', interconnectType: 'dedicated' },
  { id: 'Azure', label: 'Azure', defaultEdgeType: 'ExpressRoute', defaultBandwidth: '10 Gbps', netbondService: 'NetBond for Azure', description: 'Microsoft Azure via ExpressRoute', interconnectType: 'dedicated' },
  { id: 'Google', label: 'Google Cloud', defaultEdgeType: 'Cloud Interconnect', defaultBandwidth: '10 Gbps', netbondService: 'NetBond for GCP', description: 'Google Cloud via Cloud Interconnect', interconnectType: 'dedicated' },
  { id: 'Oracle', label: 'Oracle Cloud', defaultEdgeType: 'FastConnect', defaultBandwidth: '10 Gbps', netbondService: 'NetBond for Oracle', description: 'Oracle Cloud via FastConnect', interconnectType: 'dedicated' }
] as const;

export const DATACENTER_PROVIDERS = [
  { id: 'Equinix', label: 'Equinix', description: 'Global interconnection platform', facilities: ['DA1', 'DA2', 'CH1', 'CH2', 'NY1', 'NY5', 'LA1', 'SV1', 'SV5'] },
  { id: 'Digital Realty', label: 'Digital Realty', description: 'Data center and colocation', facilities: ['DFW10', 'DFW14', 'CHI01', 'NYC01', 'LAX01'] },
  { id: 'CyrusOne', label: 'CyrusOne', description: 'Enterprise data centers', facilities: ['DFW-VII', 'CHI-I', 'NYC-I'] },
  { id: 'CoreSite', label: 'CoreSite', description: 'Hybrid IT solutions', facilities: ['DE1', 'CH1', 'NY1', 'LA1', 'SV1'] },
  { id: 'DataBank', label: 'DataBank', description: 'Colocation and managed services', facilities: ['DAL1', 'DAL2', 'ATL1', 'MSP1'] }
] as const;

export const FUNCTION_TYPES = [
  { id: 'SDWAN', label: 'SD-WAN', description: 'AT&T SD-WAN (Cisco Viptela)', defaultEdgeToIPE: 'MPLS', defaultBandwidth: '1 Gbps', connectsTo: ['network', 'function'] },
  { id: 'Firewall', label: 'Firewall', description: 'Network security appliance', defaultEdgeToIPE: 'Ethernet', defaultBandwidth: '10 Gbps', connectsTo: ['function', 'network'] },
  { id: 'VNF', label: 'VNF', description: 'Virtual Network Function', defaultEdgeToIPE: 'Ethernet', defaultBandwidth: '10 Gbps', connectsTo: ['function', 'network'] },
  { id: 'VNAT', label: 'VNAT', description: 'Virtual NAT / Address Translation', defaultEdgeToIPE: 'Ethernet', defaultBandwidth: '10 Gbps', connectsTo: ['function', 'network'] },
  { id: 'FlexWare', label: 'FlexWare', description: 'AT&T FlexWare uCPE - multi-VNF platform', defaultEdgeToIPE: 'MPLS', defaultBandwidth: '1 Gbps', connectsTo: ['network', 'destination'] }
] as const;

export const NETWORK_TYPES = [
  { id: 'Internet', label: 'Internet', description: 'Public Internet Transport', defaultEdgeType: 'Internet', defaultBandwidth: '1 Gbps' },
  { id: 'VPN', label: 'AVPN', description: 'AT&T VPN - MPLS-based private transport', defaultEdgeType: 'MPLS', defaultBandwidth: '10 Gbps' },
  { id: 'Ethernet', label: 'ASE', description: 'AT&T Switched Ethernet - Layer 2 transport', defaultEdgeType: 'Ethernet', defaultBandwidth: '10 Gbps' },
  { id: 'ADI', label: 'ADI', description: 'AT&T Dedicated Internet - symmetric dedicated', defaultEdgeType: 'Internet', defaultBandwidth: '1 Gbps' },
  { id: 'Wavelength', label: 'Wavelength', description: 'AT&T Wavelength - dedicated optical 1G-400G', defaultEdgeType: 'Dark Fiber', defaultBandwidth: '100 Gbps' },
  { id: 'AT&T Core', label: 'AT&T Core', description: 'Infrastructure Provider Edge (IPE)', defaultEdgeType: 'MPLS', defaultBandwidth: '10 Gbps' }
] as const;

// AT&T service bandwidth tiers
export const BANDWIDTH_TIERS = [
  '50 Mbps', '100 Mbps', '200 Mbps', '500 Mbps',
  '1 Gbps', '2 Gbps', '5 Gbps', '10 Gbps',
  '25 Gbps', '40 Gbps', '100 Gbps', '400 Gbps'
] as const;

// Edge type display colors for canvas
export const EDGE_TYPE_COLORS: Record<string, string> = {
  'MPLS': '#3b82f6',           // blue
  'Internet': '#6b7280',       // gray
  'VPN': '#22c55e',            // green
  'Direct Connect': '#f97316', // orange
  'ExpressRoute': '#6366f1',   // indigo
  'Cloud Interconnect': '#8b5cf6', // purple
  'FastConnect': '#ec4899',    // pink
  'Ethernet': '#06b6d4',       // cyan
  'Dark Fiber': '#a855f7',     // purple
  'Wavelength': '#14b8a6',     // teal
} as const;
