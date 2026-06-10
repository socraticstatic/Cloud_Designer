import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { NetworkNode, NetworkEdge } from '../../../types';

interface LeafletMapProps {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
  onNodeSelect: (nodeId: string) => void;
  selectedNodeId: string | null;
}

interface NodeLocation {
  id: string;
  name: string;
  lat: number;
  lng: number;
  type: string;
  status: string;
}

export function LeafletMap({ nodes, edges, onNodeSelect, selectedNodeId }: LeafletMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const [zoomPct, setZoomPct] = useState(100);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const linesRef = useRef<L.Polyline[]>([]);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [20, 0],
      zoom: 2,
      zoomControl: false,
      attributionControl: true,
    });

    // Right-rail zoom control + percentage readout per the Figma Pano frame
    L.control.zoom({ position: 'topright' }).addTo(map);
    const updateZoom = () => setZoomPct(Math.round(Math.pow(2, map.getZoom() - 4) * 100));
    map.on('zoomend', updateZoom);
    updateZoom();

    // Flat light-gray basemap per the SDCI Figma Pano frame
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
      maxZoom: 19,
      minZoom: 2,
    }).addTo(map);

    mapRef.current = map;

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;

    console.log(`[LeafletMap] Rendering with ${nodes.length} nodes`);

    const map = mapRef.current;
    const markers = markersRef.current;

    markers.forEach(marker => map.removeLayer(marker));
    markers.clear();

    linesRef.current.forEach(line => map.removeLayer(line));
    linesRef.current = [];

    // --- Site-centric rendering ---
    // The map draws SITES (the same objects as canvas location groups),
    // not individual node dots: one readable card-marker per site with a
    // node count, plus aggregated site-to-site links.
    interface Site {
      key: string;
      name: string;
      lat: number;
      lng: number;
      nodeIds: string[];
      anyActive: boolean;
    }

    const located = nodes.filter(n => n.config?.latitude !== undefined && n.config?.longitude !== undefined);
    const siteMap = new Map<string, Site>();
    located.forEach(node => {
      const key = node.config?.city || `solo:${node.id}`;
      const existing = siteMap.get(key);
      if (existing) {
        existing.nodeIds.push(node.id);
        existing.anyActive = existing.anyActive || node.status === 'active';
        // anchor the site at the average of member coordinates
        existing.lat = (existing.lat * (existing.nodeIds.length - 1) + (node.config!.latitude as number)) / existing.nodeIds.length;
        existing.lng = (existing.lng * (existing.nodeIds.length - 1) + (node.config!.longitude as number)) / existing.nodeIds.length;
      } else {
        siteMap.set(key, {
          key,
          name: node.config?.city || node.name,
          lat: node.config!.latitude as number,
          lng: node.config!.longitude as number,
          nodeIds: [node.id],
          anyActive: node.status === 'active'
        });
      }
    });
    const sites = [...siteMap.values()];
    const siteOfNode = new Map<string, Site>();
    sites.forEach(site => site.nodeIds.forEach(id => siteOfNode.set(id, site)));

    const makeSiteIcon = (site: Site, isSelected: boolean) => {
      const dot = site.anyActive ? '#2D7E24' : '#9CA3AF';
      const count = site.nodeIds.length > 1
        ? `<span style="background:#00388F;color:white;border-radius:9999px;padding:1px 7px;font-size:11px;font-weight:600;">${site.nodeIds.length}</span>`
        : '';
      return L.divIcon({
        className: 'site-marker',
        html: `
          <div style="
            display:flex;align-items:center;gap:7px;
            background:white;
            border:1.5px solid ${isSelected ? '#00388F' : '#DCDFE3'};
            border-radius:10px;
            padding:6px 10px;
            box-shadow:0 2px 8px rgba(0,0,0,0.18);
            cursor:pointer;white-space:nowrap;
          ">
            <span style="width:10px;height:10px;border-radius:50%;background:${dot};flex-shrink:0;"></span>
            <span style="font-size:13px;font-weight:600;color:#13171b;">${site.name}</span>
            ${count}
          </div>
        `,
        iconSize: [140, 32],
        iconAnchor: [10, 16]
      });
    };

    sites.forEach(site => {
      const isSelected = selectedNodeId !== null && site.nodeIds.includes(selectedNodeId);
      const marker = L.marker([site.lat, site.lng], { icon: makeSiteIcon(site, isSelected) });
      marker.on('click', () => onNodeSelect(site.nodeIds[0]));
      marker.addTo(map);
      markers.set(site.key, marker);
    });

    // Aggregated site-to-site links: one line per site pair, weighted by link count
    const pairMap = new Map<string, { a: Site; b: Site; count: number; anyActive: boolean }>();
    edges.forEach(edge => {
      const sa = siteOfNode.get(edge.source);
      const sb = siteOfNode.get(edge.target);
      if (!sa || !sb || sa.key === sb.key) return;
      const pairKey = [sa.key, sb.key].sort().join('::');
      const existing = pairMap.get(pairKey);
      if (existing) {
        existing.count += 1;
        existing.anyActive = existing.anyActive || edge.status === 'active';
      } else {
        pairMap.set(pairKey, { a: sa, b: sb, count: 1, anyActive: edge.status === 'active' });
      }
    });

    pairMap.forEach(pair => {
      const line = L.polyline(
        [[pair.a.lat, pair.a.lng], [pair.b.lat, pair.b.lng]],
        {
          color: pair.anyActive ? '#2D7E24' : '#BDC2C7',
          weight: Math.min(1.5 + pair.count * 0.75, 4),
          opacity: pair.anyActive ? 0.75 : 0.45,
          dashArray: pair.anyActive ? undefined : '6, 8'
        }
      );
      line.bindPopup(`
        <div style="padding: 6px 8px;">
          <div style="font-weight:600;font-size:13px;">${pair.a.name} &harr; ${pair.b.name}</div>
          <div style="font-size:11px;color:#64748b;margin-top:2px;">${pair.count} connection${pair.count > 1 ? 's' : ''}</div>
        </div>
      `);
      line.addTo(map);
      linesRef.current.push(line);
    });

    if (sites.length > 0) {
      const bounds = L.latLngBounds(sites.map(site => [site.lat, site.lng]));
      map.fitBounds(bounds, { padding: [80, 80], maxZoom: 8 });
    }
  }, [nodes, edges, onNodeSelect, selectedNodeId]);


  return (
    <>
      <div
        ref={mapContainerRef}
        className="absolute inset-0 z-0"
        style={{
          width: '100%',
          height: '100%',
        }}
      />
      {/* Zoom percentage readout - per Figma Pano right rail */}
      <div className="absolute right-[11px] top-[150px] z-50 bg-white border border-gray-200 rounded-lg shadow-sm px-2 py-1 text-xs font-medium text-fw-bodyLight tabular-nums">
        {zoomPct}%
      </div>
    </>
  );
}
