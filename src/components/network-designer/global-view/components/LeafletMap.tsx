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

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
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

    const getMarkerColor = (status: string) => {
      switch (status) {
        case 'active': return '#10b981';
        case 'inactive': return '#94a3b8';
        case 'warning': return '#f59e0b';
        case 'error': return '#ef4444';
        default: return '#3b82f6';
      }
    };

    const getMarkerIcon = (status: string, isSelected: boolean) => {
      return L.divIcon({
        className: 'custom-marker',
        html: `
          <div style="
            width: ${isSelected ? '24px' : '16px'};
            height: ${isSelected ? '24px' : '16px'};
            background-color: ${getMarkerColor(status)};
            border: ${isSelected ? '3px solid #1e40af' : '2px solid white'};
            border-radius: 50%;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            transition: all 0.2s ease;
            cursor: pointer;
          "></div>
        `,
        iconSize: [isSelected ? 24 : 16, isSelected ? 24 : 16],
        iconAnchor: [isSelected ? 12 : 8, isSelected ? 12 : 8],
      });
    };

    nodeLocations.forEach(location => {
      const isSelected = location.id === selectedNodeId;
      const marker = L.marker([location.lat, location.lng], {
        icon: getMarkerIcon(location.status, isSelected),
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
    });

    edges.forEach(edge => {
      const sourceNode = nodeLocations.find(loc => loc.id === edge.source);
      const targetNode = nodeLocations.find(loc => loc.id === edge.target);

      if (sourceNode && targetNode) {
        const lineColor = edge.status === 'active' ? '#3b82f6' : '#94a3b8';
        const lineWeight = edge.status === 'active' ? 2 : 1;
        const lineOpacity = edge.status === 'active' ? 0.6 : 0.3;

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

    const getMarkerIcon = (status: string, isSelected: boolean) => {
      return L.divIcon({
        className: 'custom-marker',
        html: `
          <div style="
            width: ${isSelected ? '24px' : '16px'};
            height: ${isSelected ? '24px' : '16px'};
            background-color: ${getMarkerColor(status)};
            border: ${isSelected ? '3px solid #1e40af' : '2px solid white'};
            border-radius: 50%;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            transition: all 0.2s ease;
            cursor: pointer;
          "></div>
        `,
        iconSize: [isSelected ? 24 : 16, isSelected ? 24 : 16],
        iconAnchor: [isSelected ? 12 : 8, isSelected ? 12 : 8],
      });
    };

    nodes.forEach(node => {
      const marker = markers.get(node.id);
      if (marker) {
        const isSelected = node.id === selectedNodeId;
        marker.setIcon(getMarkerIcon(node.status, isSelected));

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
