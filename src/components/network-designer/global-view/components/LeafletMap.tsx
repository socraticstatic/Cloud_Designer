import { useEffect, useRef } from 'react';
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
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const linesRef = useRef<L.Polyline[]>([]);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [20, 0],
      zoom: 2,
      zoomControl: true,
      attributionControl: true,
    });

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

    const nodeLocations: NodeLocation[] = nodes
      .filter(node => {
        const hasGeoData =
          node.config?.latitude !== undefined &&
          node.config?.longitude !== undefined;
        if (!hasGeoData) {
          console.log(`[LeafletMap] ✗ Skipping ${node.name}: no geo data (lat=${node.config?.latitude}, lng=${node.config?.longitude})`);
        }
        return hasGeoData;
      })
      .map(node => ({
        id: node.id,
        name: node.name,
        lat: node.config!.latitude as number,
        lng: node.config!.longitude as number,
        type: node.type,
        status: node.status,
      }));

    console.log(`[LeafletMap] Filtered to ${nodeLocations.length} nodes with valid coordinates`);

    const getMarkerColor = (status: string) => {
      switch (status) {
        case 'active': return '#10b981';
        case 'inactive': return '#94a3b8';
        case 'warning': return '#f59e0b';
        case 'error': return '#ef4444';
        default: return '#3b82f6';
      }
    };

    const getMarkerIcon = (status: string, isSelected: boolean, label: string) => {
      return L.divIcon({
        className: 'custom-marker',
        html: `
          <div style="display:flex;align-items:center;gap:6px;cursor:pointer;">
            <div style="
              width: ${isSelected ? '18px' : '12px'};
              height: ${isSelected ? '18px' : '12px'};
              background-color: ${getMarkerColor(status)};
              border: 2px solid white;
              border-radius: 50%;
              box-shadow: 0 1px 4px rgba(0,0,0,0.35);
              flex-shrink: 0;
            "></div>
            <div style="
              background: white;
              border: 1px solid ${isSelected ? '#0057B8' : '#DCDFE3'};
              border-radius: 6px;
              padding: 2px 7px;
              font-size: 11px;
              font-weight: 500;
              color: #1d2329;
              white-space: nowrap;
              box-shadow: 0 1px 3px rgba(0,0,0,0.12);
            ">${label}</div>
          </div>
        `,
        iconSize: [120, 20],
        iconAnchor: [isSelected ? 9 : 6, 10],
      });
    };

    nodeLocations.forEach(location => {
      const isSelected = location.id === selectedNodeId;
      const marker = L.marker([location.lat, location.lng], {
        icon: getMarkerIcon(location.status, isSelected, location.name),
      });

      marker.on('click', () => {
        onNodeSelect(location.id);
      });

      const popupContent = `
        <div style="padding: 8px; min-width: 150px;">
          <div style="font-weight: 600; font-size: 14px; margin-bottom: 4px; color: #1e293b;">
            ${location.name}
          </div>
          <div style="font-size: 12px; color: #64748b; margin-bottom: 2px;">
            Type: ${location.type}
          </div>
          <div style="font-size: 12px; color: #64748b;">
            Status: <span style="color: ${getMarkerColor(location.status)}; font-weight: 500;">${location.status}</span>
          </div>
        </div>
      `;

      marker.bindPopup(popupContent);

      if (isSelected) {
        marker.openPopup();
      }

      marker.addTo(map);
      markers.set(location.id, marker);
      console.log(`[LeafletMap] ✓ Added marker for ${location.name} at [${location.lat}, ${location.lng}]`);
    });

    console.log(`[LeafletMap] Total markers rendered: ${markers.size}`);

    edges.forEach(edge => {
      const sourceNode = nodeLocations.find(loc => loc.id === edge.source);
      const targetNode = nodeLocations.find(loc => loc.id === edge.target);

      if (sourceNode && targetNode) {
        const lineColor = edge.status === 'active' ? '#686E74' : '#BDC2C7';
        const lineWeight = 1.5;
        const lineOpacity = edge.status === 'active' ? 0.8 : 0.4;

        const line = L.polyline(
          [
            [sourceNode.lat, sourceNode.lng],
            [targetNode.lat, targetNode.lng],
          ],
          {
            color: lineColor,
            weight: lineWeight,
            opacity: lineOpacity,
            dashArray: edge.status === 'active' ? undefined : '5, 10',
          }
        );

        line.bindPopup(`
          <div style="padding: 8px;">
            <div style="font-weight: 600; font-size: 13px; margin-bottom: 4px;">
              ${sourceNode.name} → ${targetNode.name}
            </div>
            <div style="font-size: 11px; color: #64748b; margin-bottom: 2px;">
              Type: ${edge.type}
            </div>
            <div style="font-size: 11px; color: #64748b;">
              Bandwidth: ${edge.bandwidth}
            </div>
          </div>
        `);

        line.addTo(map);
        linesRef.current.push(line);
      }
    });

    if (nodeLocations.length > 0) {
      const bounds = L.latLngBounds(
        nodeLocations.map(loc => [loc.lat, loc.lng])
      );
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 10 });
    }
  }, [nodes, edges, onNodeSelect, selectedNodeId]);

  useEffect(() => {
    if (!mapRef.current) return;

    const markers = markersRef.current;
    const getMarkerColor = (status: string) => {
      switch (status) {
        case 'active': return '#10b981';
        case 'inactive': return '#94a3b8';
        case 'warning': return '#f59e0b';
        case 'error': return '#ef4444';
        default: return '#3b82f6';
      }
    };

    const getMarkerIcon = (status: string, isSelected: boolean, label: string) => {
      return L.divIcon({
        className: 'custom-marker',
        html: `
          <div style="display:flex;align-items:center;gap:6px;cursor:pointer;">
            <div style="
              width: ${isSelected ? '18px' : '12px'};
              height: ${isSelected ? '18px' : '12px'};
              background-color: ${getMarkerColor(status)};
              border: 2px solid white;
              border-radius: 50%;
              box-shadow: 0 1px 4px rgba(0,0,0,0.35);
              flex-shrink: 0;
            "></div>
            <div style="
              background: white;
              border: 1px solid ${isSelected ? '#0057B8' : '#DCDFE3'};
              border-radius: 6px;
              padding: 2px 7px;
              font-size: 11px;
              font-weight: 500;
              color: #1d2329;
              white-space: nowrap;
              box-shadow: 0 1px 3px rgba(0,0,0,0.12);
            ">${label}</div>
          </div>
        `,
        iconSize: [120, 20],
        iconAnchor: [isSelected ? 9 : 6, 10],
      });
    };

    nodes.forEach(node => {
      const marker = markers.get(node.id);
      if (marker) {
        const isSelected = node.id === selectedNodeId;
        marker.setIcon(getMarkerIcon(node.status, isSelected, node.name));

        if (isSelected) {
          marker.openPopup();
        } else {
          marker.closePopup();
        }
      }
    });
  }, [selectedNodeId, nodes]);

  return (
    <div
      ref={mapContainerRef}
      className="absolute inset-0 z-0"
      style={{
        width: '100%',
        height: '100%',
      }}
    />
  );
}
