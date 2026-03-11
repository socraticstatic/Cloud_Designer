# Leaflet Map Integration

This document describes the Leaflet integration for the Global View feature in the Network Designer.

## Overview

The Global View now uses **Leaflet.js**, a powerful open-source JavaScript library for interactive maps. This provides a real geographic visualization of your network infrastructure.

## Features

### Interactive Map
- **Pan and Zoom**: Use mouse/trackpad to navigate the world map
- **Real Coordinates**: Network nodes are placed at their actual geographic locations
- **OpenStreetMap Tiles**: High-quality, free map tiles from OpenStreetMap

### Network Visualization
- **Node Markers**: Each network node appears as a colored marker
  - Green: Active nodes
  - Gray: Inactive nodes
  - Orange: Warning state
  - Red: Error state
  - Blue: Default/other states
- **Connection Lines**: Visual lines between connected nodes
  - Solid blue lines: Active connections
  - Dashed gray lines: Inactive connections
- **Interactive Popups**: Click any marker to see node details

### Smart Marker Sizing
- Selected nodes appear larger with blue border
- Unselected nodes are smaller for clarity
- Automatic zoom to fit all nodes on map load

## How It Works

### Automatic Geo-Coding
When you switch to Global View, the system automatically adds geographic coordinates to your nodes based on:

1. **Cloud Regions**: Maps AWS regions (us-east-1, eu-west-1, etc.) to real locations
2. **City Names**: Recognizes major cities (New York, London, Tokyo, etc.)
3. **Location Field**: Uses the location field from node configuration

### Supported Locations
Pre-configured coordinates for:
- All major AWS regions
- 20+ major cities worldwide
- Common datacenter locations

You can also manually add coordinates by setting `latitude` and `longitude` in node config.

## Usage

### Viewing the Map
1. Create network nodes with location information
2. Switch to "Global View" using the abstraction level selector
3. The map will automatically display with all nodes positioned geographically

### Interacting with Nodes
- **Click a marker**: View node details and open popup
- **Click connection line**: View connection details
- **Use zoom controls**: Navigate the map
- **Auto-fit**: All nodes automatically fit in view on load

### Adding Custom Locations

To add a node at a specific location, set these config properties:

```typescript
{
  name: 'My Node',
  config: {
    latitude: 40.7128,
    longitude: -74.0060,
    city: 'New York',
    country: 'USA'
  }
}
```

## Technical Details

### Components
- **LeafletMap.tsx**: Main map component using Leaflet
- **GlobalView.tsx**: Parent component managing global view state
- **geoUtils.ts**: Utilities for geocoding and coordinate conversion
- **sampleGeoData.ts**: Sample coordinate database for common locations

### Dependencies
- `leaflet`: ^1.9.4 - Core mapping library
- `@types/leaflet`: TypeScript definitions

### Styling
Custom styles in `index.css` ensure the map matches the application design:
- Rounded corners on popups
- Consistent color scheme
- Smooth animations
- Proper z-index layering

## Future Enhancements

Potential improvements:
- Integration with Supabase location database
- Custom map styles/themes
- Heatmap overlay for performance metrics
- Geographic clustering for many nodes
- Route optimization visualization
- Real-time traffic/latency overlays

## Troubleshooting

### Nodes Not Appearing
- Ensure nodes have location, region, or city in config
- Check browser console for coordinate lookup errors
- Manually add latitude/longitude if automatic geocoding fails

### Map Not Loading
- Check internet connection (requires OpenStreetMap tiles)
- Verify Leaflet CSS is imported in index.css
- Check browser console for errors

### Performance Issues
- Consider clustering if you have 100+ nodes
- Reduce connection lines by filtering inactive ones
- Use browser dev tools to profile performance
