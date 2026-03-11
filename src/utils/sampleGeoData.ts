import type { NetworkNode } from '../types';

export function addSampleGeoDataToNodes(nodes: NetworkNode[]): NetworkNode[] {
  return nodes.map(node => {
    // Skip if already has coordinates
    if (node.config?.latitude && node.config?.longitude) {
      return node;
    }

    // Try multiple fields to find location info (prioritize region, then location, then city)
    const location = node.config?.region || node.config?.location || node.config?.city;
    const provider = node.config?.provider;

    if (!location) {
      console.warn(`[Geo Enrichment] Node "${node.name}" has no location info (region/location/city)`);
      return node;
    }

    console.log(`[Geo Enrichment] Looking up coordinates for "${location}" (node: ${node.name})`);
    const geoData = getSampleGeoCoordinates(location, provider);

    if (geoData) {
      console.log(`[Geo Enrichment] ✓ Found: ${geoData.city} at (${geoData.latitude}, ${geoData.longitude})`);
      return {
        ...node,
        config: {
          ...node.config,
          latitude: geoData.latitude,
          longitude: geoData.longitude,
          city: geoData.city || node.config?.city,
          country: geoData.country || node.config?.country,
        },
      };
    }

    console.warn(`[Geo Enrichment] ✗ Could not find coordinates for "${location}"`);
    return node;
  });
}

interface GeoData {
  latitude: number;
  longitude: number;
  city: string;
  country: string;
}

function getSampleGeoCoordinates(location: string, provider?: string): GeoData | null {
  const locationLower = location.toLowerCase();

  const geoMap: Record<string, GeoData> = {
    // AWS Regions
    'us-east-1': { latitude: 39.0438, longitude: -77.4874, city: 'Virginia', country: 'USA' },
    'us-east-2': { latitude: 39.9612, longitude: -82.9988, city: 'Ohio', country: 'USA' },
    'us-west-1': { latitude: 37.7749, longitude: -122.4194, city: 'N. California', country: 'USA' },
    'us-west-2': { latitude: 45.5152, longitude: -122.6784, city: 'Oregon', country: 'USA' },
    'eu-west-1': { latitude: 53.3498, longitude: -6.2603, city: 'Ireland', country: 'Ireland' },
    'eu-west-2': { latitude: 51.5074, longitude: -0.1278, city: 'London', country: 'UK' },
    'eu-central-1': { latitude: 50.1109, longitude: 8.6821, city: 'Frankfurt', country: 'Germany' },
    'ap-southeast-1': { latitude: 1.3521, longitude: 103.8198, city: 'Singapore', country: 'Singapore' },
    'ap-southeast-2': { latitude: -33.8688, longitude: 151.2093, city: 'Sydney', country: 'Australia' },
    'ap-northeast-1': { latitude: 35.6762, longitude: 139.6503, city: 'Tokyo', country: 'Japan' },
    'ap-south-1': { latitude: 19.0760, longitude: 72.8777, city: 'Mumbai', country: 'India' },
    'sa-east-1': { latitude: -23.5505, longitude: -46.6333, city: 'São Paulo', country: 'Brazil' },
    'ca-central-1': { latitude: 45.5017, longitude: -73.5673, city: 'Montreal', country: 'Canada' },

    // Azure Regions
    'eastus': { latitude: 39.0438, longitude: -77.4874, city: 'Virginia', country: 'USA' },
    'eastus2': { latitude: 39.0438, longitude: -77.4874, city: 'Virginia', country: 'USA' },
    'westus': { latitude: 37.7749, longitude: -122.4194, city: 'California', country: 'USA' },
    'westus2': { latitude: 47.6062, longitude: -122.3321, city: 'Washington', country: 'USA' },
    'westus3': { latitude: 33.4484, longitude: -112.0740, city: 'Arizona', country: 'USA' },
    'centralus': { latitude: 41.8781, longitude: -87.6298, city: 'Iowa', country: 'USA' },
    'northcentralus': { latitude: 41.8781, longitude: -87.6298, city: 'Illinois', country: 'USA' },
    'southcentralus': { latitude: 29.7604, longitude: -95.3698, city: 'Texas', country: 'USA' },
    'westcentralus': { latitude: 40.8903, longitude: -110.9716, city: 'Wyoming', country: 'USA' },
    'northeurope': { latitude: 53.3498, longitude: -6.2603, city: 'Ireland', country: 'Ireland' },
    'westeurope': { latitude: 52.3676, longitude: 4.9041, city: 'Netherlands', country: 'Netherlands' },
    'uksouth': { latitude: 51.5074, longitude: -0.1278, city: 'London', country: 'UK' },
    'ukwest': { latitude: 51.5074, longitude: -0.1278, city: 'Cardiff', country: 'UK' },
    'francecentral': { latitude: 48.8566, longitude: 2.3522, city: 'Paris', country: 'France' },
    'germanywestcentral': { latitude: 50.1109, longitude: 8.6821, city: 'Frankfurt', country: 'Germany' },
    'switzerlandnorth': { latitude: 47.3769, longitude: 8.5417, city: 'Zurich', country: 'Switzerland' },
    'norwayeast': { latitude: 59.9139, longitude: 10.7522, city: 'Oslo', country: 'Norway' },
    'swedencentral': { latitude: 59.3293, longitude: 18.0686, city: 'Stockholm', country: 'Sweden' },
    'southeastasia': { latitude: 1.3521, longitude: 103.8198, city: 'Singapore', country: 'Singapore' },
    'eastasia': { latitude: 22.3193, longitude: 114.1694, city: 'Hong Kong', country: 'Hong Kong' },
    'australiaeast': { latitude: -33.8688, longitude: 151.2093, city: 'Sydney', country: 'Australia' },
    'australiasoutheast': { latitude: -37.8136, longitude: 144.9631, city: 'Melbourne', country: 'Australia' },
    'japaneast': { latitude: 35.6762, longitude: 139.6503, city: 'Tokyo', country: 'Japan' },
    'japanwest': { latitude: 34.6937, longitude: 135.5023, city: 'Osaka', country: 'Japan' },
    'koreacentral': { latitude: 37.5665, longitude: 126.9780, city: 'Seoul', country: 'South Korea' },
    'southindia': { latitude: 13.0827, longitude: 80.2707, city: 'Chennai', country: 'India' },
    'centralindia': { latitude: 18.5204, longitude: 73.8567, city: 'Pune', country: 'India' },
    'westindia': { latitude: 19.0760, longitude: 72.8777, city: 'Mumbai', country: 'India' },
    'brazilsouth': { latitude: -23.5505, longitude: -46.6333, city: 'São Paulo', country: 'Brazil' },
    'canadacentral': { latitude: 43.6532, longitude: -79.3832, city: 'Toronto', country: 'Canada' },
    'canadaeast': { latitude: 46.8139, longitude: -71.2080, city: 'Quebec', country: 'Canada' },
    'uaenorth': { latitude: 25.2048, longitude: 55.2708, city: 'Dubai', country: 'UAE' },
    'southafricanorth': { latitude: -26.2041, longitude: 28.0473, city: 'Johannesburg', country: 'South Africa' },

    // GCP Regions
    'us-central1': { latitude: 41.8781, longitude: -87.6298, city: 'Iowa', country: 'USA' },
    'us-east1': { latitude: 33.1960, longitude: -80.0131, city: 'S. Carolina', country: 'USA' },
    'us-east4': { latitude: 39.0438, longitude: -77.4874, city: 'N. Virginia', country: 'USA' },
    'us-west1': { latitude: 45.5152, longitude: -122.6784, city: 'Oregon', country: 'USA' },
    'us-west2': { latitude: 34.0522, longitude: -118.2437, city: 'Los Angeles', country: 'USA' },
    'europe-west1': { latitude: 50.8503, longitude: 4.3517, city: 'Belgium', country: 'Belgium' },
    'europe-west2': { latitude: 51.5074, longitude: -0.1278, city: 'London', country: 'UK' },
    'europe-west3': { latitude: 50.1109, longitude: 8.6821, city: 'Frankfurt', country: 'Germany' },
    'asia-east1': { latitude: 25.0330, longitude: 121.5654, city: 'Taiwan', country: 'Taiwan' },
    'asia-northeast1': { latitude: 35.6762, longitude: 139.6503, city: 'Tokyo', country: 'Japan' },
    'asia-southeast1': { latitude: 1.3521, longitude: 103.8198, city: 'Singapore', country: 'Singapore' },

    // Cities
    'new york': { latitude: 40.7128, longitude: -74.0060, city: 'New York', country: 'USA' },
    'london': { latitude: 51.5074, longitude: -0.1278, city: 'London', country: 'UK' },
    'tokyo': { latitude: 35.6762, longitude: 139.6503, city: 'Tokyo', country: 'Japan' },
    'sydney': { latitude: -33.8688, longitude: 151.2093, city: 'Sydney', country: 'Australia' },
    'singapore': { latitude: 1.3521, longitude: 103.8198, city: 'Singapore', country: 'Singapore' },
    'san francisco': { latitude: 37.7749, longitude: -122.4194, city: 'San Francisco', country: 'USA' },
    'los angeles': { latitude: 34.0522, longitude: -118.2437, city: 'Los Angeles', country: 'USA' },
    'chicago': { latitude: 41.8781, longitude: -87.6298, city: 'Chicago', country: 'USA' },
    'dallas': { latitude: 32.7767, longitude: -96.7970, city: 'Dallas', country: 'USA' },
    'ashburn': { latitude: 39.0438, longitude: -77.4874, city: 'Ashburn', country: 'USA' },
    'paris': { latitude: 48.8566, longitude: 2.3522, city: 'Paris', country: 'France' },
    'frankfurt': { latitude: 50.1109, longitude: 8.6821, city: 'Frankfurt', country: 'Germany' },
    'mumbai': { latitude: 19.0760, longitude: 72.8777, city: 'Mumbai', country: 'India' },
    'são paulo': { latitude: -23.5505, longitude: -46.6333, city: 'São Paulo', country: 'Brazil' },
    'toronto': { latitude: 43.6532, longitude: -79.3832, city: 'Toronto', country: 'Canada' },
    'hong kong': { latitude: 22.3193, longitude: 114.1694, city: 'Hong Kong', country: 'Hong Kong' },
    'seoul': { latitude: 37.5665, longitude: 126.9780, city: 'Seoul', country: 'South Korea' },
    'dubai': { latitude: 25.2048, longitude: 55.2708, city: 'Dubai', country: 'UAE' },
    'amsterdam': { latitude: 52.3676, longitude: 4.9041, city: 'Amsterdam', country: 'Netherlands' },
    'stockholm': { latitude: 59.3293, longitude: 18.0686, city: 'Stockholm', country: 'Sweden' },
    'virginia': { latitude: 39.0438, longitude: -77.4874, city: 'Virginia', country: 'USA' },
    'ohio': { latitude: 39.9612, longitude: -82.9988, city: 'Ohio', country: 'USA' },
    'oregon': { latitude: 45.5152, longitude: -122.6784, city: 'Oregon', country: 'USA' },
    'california': { latitude: 37.7749, longitude: -122.4194, city: 'California', country: 'USA' },
    'ireland': { latitude: 53.3498, longitude: -6.2603, city: 'Ireland', country: 'Ireland' },
  };

  // First try exact match
  if (geoMap[locationLower]) {
    return geoMap[locationLower];
  }

  // Then try substring matching
  for (const [key, value] of Object.entries(geoMap)) {
    if (locationLower.includes(key) || key.includes(locationLower)) {
      return value;
    }
  }

  // Default fallback for unknown locations (center of US)
  console.warn(`No geo coordinates found for location: "${location}". Using default coordinates.`);
  return { latitude: 39.8283, longitude: -98.5795, city: location, country: 'Unknown' };
}

export function ensureNodesHaveGeoData(nodes: NetworkNode[]): NetworkNode[] {
  return addSampleGeoDataToNodes(nodes);
}
