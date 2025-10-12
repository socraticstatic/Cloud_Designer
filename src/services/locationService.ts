import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface DatacenterLocation {
  id: string;
  provider: string;
  facility_code: string;
  city: string;
  state: string | null;
  country: string;
  latitude: number;
  longitude: number;
  metro_area: string | null;
}

export interface CloudRegionLocation {
  id: string;
  provider: string;
  region_code: string;
  region_name: string;
  city: string;
  state: string | null;
  country: string;
  latitude: number;
  longitude: number;
  availability_zones: number;
}

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
  city: string;
  state?: string;
  country: string;
}

let datacenterCache: DatacenterLocation[] | null = null;
let cloudRegionCache: Map<string, CloudRegionLocation[]> | null = null;

export async function getDatacenterLocations(): Promise<DatacenterLocation[]> {
  if (datacenterCache) {
    return datacenterCache;
  }

  const { data, error } = await supabase
    .from('datacenter_locations')
    .select('*')
    .order('provider', { ascending: true })
    .order('city', { ascending: true });

  if (error) {
    console.error('Error fetching datacenter locations:', error);
    return [];
  }

  datacenterCache = data || [];
  return datacenterCache;
}

export async function getCloudRegionLocations(provider?: string): Promise<CloudRegionLocation[]> {
  if (!cloudRegionCache) {
    cloudRegionCache = new Map();
  }

  const cacheKey = provider || 'all';
  if (cloudRegionCache.has(cacheKey)) {
    return cloudRegionCache.get(cacheKey)!;
  }

  let query = supabase
    .from('cloud_region_locations')
    .select('*')
    .order('provider', { ascending: true })
    .order('region_code', { ascending: true });

  if (provider) {
    query = query.eq('provider', provider);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching cloud region locations:', error);
    return [];
  }

  const regions = data || [];
  cloudRegionCache.set(cacheKey, regions);
  return regions;
}

export async function getCloudRegionByCode(provider: string, regionCode: string): Promise<CloudRegionLocation | null> {
  const { data, error } = await supabase
    .from('cloud_region_locations')
    .select('*')
    .eq('provider', provider)
    .eq('region_code', regionCode)
    .maybeSingle();

  if (error) {
    console.error('Error fetching cloud region:', error);
    return null;
  }

  return data;
}

export async function getDatacenterByFacility(provider: string, facilityCode: string): Promise<DatacenterLocation | null> {
  const { data, error } = await supabase
    .from('datacenter_locations')
    .select('*')
    .eq('provider', provider)
    .eq('facility_code', facilityCode)
    .maybeSingle();

  if (error) {
    console.error('Error fetching datacenter:', error);
    return null;
  }

  return data;
}

export function getCloudProviders(): string[] {
  return ['AWS', 'Azure', 'GCP', 'Oracle'];
}

export function getDatacenterProviders(): string[] {
  return ['Equinix', 'Digital Realty', 'Coresite', 'CyrusOne'];
}

export function convertToMapCoordinates(
  latitude: number,
  longitude: number,
  mapWidth: number = 800,
  mapHeight: number = 600
): { x: number; y: number } {
  const x = ((longitude + 180) / 360) * mapWidth;
  const y = ((90 - latitude) / 180) * mapHeight;

  return { x, y };
}

export function clearLocationCache(): void {
  datacenterCache = null;
  cloudRegionCache = null;
}
