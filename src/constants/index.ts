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
  CLOUD_ROUTER: {
    routerType: 'cloud'
  },
  DEFAULT_CONNECTION: {
    type: 'MPLS',
    bandwidth: '10 Gbps',
    resilience: 'standard'
  }
} as const;

export const CLOUD_PROVIDERS = [
  { id: 'AWS', label: 'AWS' },
  { id: 'Azure', label: 'Azure' },
  { id: 'Google', label: 'Google Cloud' },
  { id: 'Oracle', label: 'Oracle Cloud' }
] as const;

export const DATACENTER_PROVIDERS = [
  { id: 'Equinix', label: 'Equinix' },
  { id: 'Digital Reality', label: 'Digital Reality' },
  { id: 'CenterSquare', label: 'CenterSquare' },
  { id: 'CoreSite', label: 'CoreSite' },
  { id: 'DataBank', label: 'DataBank' }
] as const;

export const FUNCTION_TYPES = [
  { id: 'SDWAN', label: 'SD-WAN' },
  { id: 'Firewall', label: 'Firewall' },
  { id: 'VNF', label: 'VNF' },
  { id: 'VNAT', label: 'VNAT' }
] as const;

export const NETWORK_TYPES = [
  { id: 'Internet', label: 'Internet' },
  { id: 'VPN', label: 'VPN' },
  { id: 'Ethernet', label: 'Ethernet' },
  { id: 'IoT', label: 'IoT' },
  { id: 'AT&T Core', label: 'AT&T Core' }
] as const;