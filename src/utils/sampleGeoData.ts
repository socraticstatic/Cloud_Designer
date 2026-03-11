import type { NetworkNode } from '../types';

export function addSampleGeoDataToNodes(nodes: NetworkNode[]): NetworkNode[] {
  return nodes.map(node => {
    if (node.config?.latitude && node.config?.longitude) {
      return node;
    }

    const location = node.config?.location || node.config?.region;
    const provider = node.config?.provider;

    if (!location) {
      return node;
    }

    const geoData = getSampleGeoCoordinates(location, provider);

    if (geoData) {
      return {
        ...node,
        config: {
          ...node.config,
          latitude: geoData.latitude,
          longitude: geoData.longitude,
          city: geoData.city,
          country: geoData.country,
        },
      };
    }

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
    'us-east-1': { latitude: 39.0438, longitude: -77.4874, city: 'Virginia', country: 'USA' },
    'us-east-2': { latitude: 39.9612, longitude: -82.9988, city: 'Ohio', country: 'USA' },
    'us-west-1': { latitude: 37.7749, longitude: -122.4194, city: 'California', country: 'USA' },
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
    'new york': { latitude: 40.7128, longitude: -74.0060, city: 'New York', country: 'USA' },
    'london': { latitude: 51.5074, longitude: -0.1278, city: 'London', country: 'UK' },
    'tokyo': { latitude: 35.6762, longitude: 139.6503, city: 'Tokyo', country: 'Japan' },
    'sydney': { latitude: -33.8688, longitude: 151.2093, city: 'Sydney', country: 'Australia' },
    'singapore': { latitude: 1.3521, longitude: 103.8198, city: 'Singapore', country: 'Singapore' },
    'san francisco': { latitude: 37.7749, longitude: -122.4194, city: 'San Francisco', country: 'USA' },
    'los angeles': { latitude: 34.0522, longitude: -118.2437, city: 'Los Angeles', country: 'USA' },
    'chicago': { latitude: 41.8781, longitude: -87.6298, city: 'Chicago', country: 'USA' },
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

  for (const [key, value] of Object.entries(geoMap)) {
    if (locationLower.includes(key) || key.includes(locationLower)) {
      return value;
    }
  }

  return null;
}

export function ensureNodesHaveGeoData(nodes: NetworkNode[]): NetworkNode[] {
  return addSampleGeoDataToNodes(nodes);
}
