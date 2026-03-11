import { getCloudRegionByCode, getDatacenterByFacility } from '../services/locationService';

interface GeoCoordinates {
  latitude: number;
  longitude: number;
  city?: string;
  country?: string;
}

const CITY_COORDINATES: Record<string, GeoCoordinates> = {
  'New York': { latitude: 40.7128, longitude: -74.0060, city: 'New York', country: 'USA' },
  'London': { latitude: 51.5074, longitude: -0.1278, city: 'London', country: 'UK' },
  'Tokyo': { latitude: 35.6762, longitude: 139.6503, city: 'Tokyo', country: 'Japan' },
  'Sydney': { latitude: -33.8688, longitude: 151.2093, city: 'Sydney', country: 'Australia' },
  'Singapore': { latitude: 1.3521, longitude: 103.8198, city: 'Singapore', country: 'Singapore' },
  'San Francisco': { latitude: 37.7749, longitude: -122.4194, city: 'San Francisco', country: 'USA' },
  'Los Angeles': { latitude: 34.0522, longitude: -118.2437, city: 'Los Angeles', country: 'USA' },
  'Chicago': { latitude: 41.8781, longitude: -87.6298, city: 'Chicago', country: 'USA' },
  'Paris': { latitude: 48.8566, longitude: 2.3522, city: 'Paris', country: 'France' },
  'Frankfurt': { latitude: 50.1109, longitude: 8.6821, city: 'Frankfurt', country: 'Germany' },
  'Mumbai': { latitude: 19.0760, longitude: 72.8777, city: 'Mumbai', country: 'India' },
  'São Paulo': { latitude: -23.5505, longitude: -46.6333, city: 'São Paulo', country: 'Brazil' },
  'Toronto': { latitude: 43.6532, longitude: -79.3832, city: 'Toronto', country: 'Canada' },
  'Hong Kong': { latitude: 22.3193, longitude: 114.1694, city: 'Hong Kong', country: 'Hong Kong' },
  'Seoul': { latitude: 37.5665, longitude: 126.9780, city: 'Seoul', country: 'South Korea' },
  'Dubai': { latitude: 25.2048, longitude: 55.2708, city: 'Dubai', country: 'UAE' },
  'Amsterdam': { latitude: 52.3676, longitude: 4.9041, city: 'Amsterdam', country: 'Netherlands' },
  'Stockholm': { latitude: 59.3293, longitude: 18.0686, city: 'Stockholm', country: 'Sweden' },
  'Zurich': { latitude: 47.3769, longitude: 8.5417, city: 'Zurich', country: 'Switzerland' },
  'Milan': { latitude: 45.4642, longitude: 9.1900, city: 'Milan', country: 'Italy' },
};

export async function getGeoCoordinatesForRegion(
  provider: string,
  regionCode: string
): Promise<GeoCoordinates | null> {
  try {
    const region = await getCloudRegionByCode(provider, regionCode);
    if (region) {
      return {
        latitude: region.latitude,
        longitude: region.longitude,
        city: region.city,
        country: region.country,
      };
    }
  } catch (error) {
    console.error('Error fetching region coordinates:', error);
  }
  return null;
}

export async function getGeoCoordinatesForDatacenter(
  provider: string,
  facilityCode: string
): Promise<GeoCoordinates | null> {
  try {
    const datacenter = await getDatacenterByFacility(provider, facilityCode);
    if (datacenter) {
      return {
        latitude: datacenter.latitude,
        longitude: datacenter.longitude,
        city: datacenter.city,
        country: datacenter.country,
      };
    }
  } catch (error) {
    console.error('Error fetching datacenter coordinates:', error);
  }
  return null;
}

export function getGeoCoordinatesForCity(cityName: string): GeoCoordinates | null {
  const normalizedCity = Object.keys(CITY_COORDINATES).find(
    city => city.toLowerCase() === cityName.toLowerCase()
  );

  if (normalizedCity) {
    return CITY_COORDINATES[normalizedCity];
  }

  for (const [city, coords] of Object.entries(CITY_COORDINATES)) {
    if (cityName.toLowerCase().includes(city.toLowerCase()) ||
        city.toLowerCase().includes(cityName.toLowerCase())) {
      return coords;
    }
  }

  return null;
}

export function getGeoCoordinatesForLocation(location: string): GeoCoordinates | null {
  return getGeoCoordinatesForCity(location);
}

export function addGeoCoordinatesToNode(node: any): any {
  if (node.config?.latitude && node.config?.longitude) {
    return node;
  }

  let coords: GeoCoordinates | null = null;

  if (node.config?.location) {
    coords = getGeoCoordinatesForCity(node.config.location);
  }

  if (!coords && node.config?.city) {
    coords = getGeoCoordinatesForCity(node.config.city);
  }

  if (coords) {
    return {
      ...node,
      config: {
        ...node.config,
        latitude: coords.latitude,
        longitude: coords.longitude,
        city: coords.city || node.config?.city,
        country: coords.country || node.config?.country,
      },
    };
  }

  return node;
}
