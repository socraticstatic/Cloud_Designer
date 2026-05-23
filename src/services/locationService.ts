// Static location data — Supabase removed.
// All data sourced from supabase/migrations/20251012114351_add_location_city_data.sql
// and supabase/migrations/20251012114923_add_oracle_cloud_regions.sql

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

const DATACENTER_LOCATIONS: DatacenterLocation[] = [
  { id: 'dc-eq-dc2',  provider: 'Equinix', facility_code: 'DC2',          city: 'Ashburn',    state: 'VA',  country: 'USA',         latitude: 39.0438,  longitude: -77.4874,  metro_area: 'Washington DC' },
  { id: 'dc-eq-dc6',  provider: 'Equinix', facility_code: 'DC6',          city: 'Ashburn',    state: 'VA',  country: 'USA',         latitude: 39.0438,  longitude: -77.4874,  metro_area: 'Washington DC' },
  { id: 'dc-eq-dc10', provider: 'Equinix', facility_code: 'DC10',         city: 'Ashburn',    state: 'VA',  country: 'USA',         latitude: 39.0438,  longitude: -77.4874,  metro_area: 'Washington DC' },
  { id: 'dc-eq-ny2',  provider: 'Equinix', facility_code: 'NY2',          city: 'Secaucus',   state: 'NJ',  country: 'USA',         latitude: 40.7895,  longitude: -74.0565,  metro_area: 'New York' },
  { id: 'dc-eq-ny4',  provider: 'Equinix', facility_code: 'NY4',          city: 'Secaucus',   state: 'NJ',  country: 'USA',         latitude: 40.7895,  longitude: -74.0565,  metro_area: 'New York' },
  { id: 'dc-eq-sv1',  provider: 'Equinix', facility_code: 'SV1',          city: 'San Jose',   state: 'CA',  country: 'USA',         latitude: 37.3382,  longitude: -121.8863, metro_area: 'Silicon Valley' },
  { id: 'dc-eq-sv5',  provider: 'Equinix', facility_code: 'SV5',          city: 'San Jose',   state: 'CA',  country: 'USA',         latitude: 37.3382,  longitude: -121.8863, metro_area: 'Silicon Valley' },
  { id: 'dc-eq-la3',  provider: 'Equinix', facility_code: 'LA3',          city: 'El Segundo', state: 'CA',  country: 'USA',         latitude: 33.9192,  longitude: -118.4165, metro_area: 'Los Angeles' },
  { id: 'dc-eq-ch2',  provider: 'Equinix', facility_code: 'CH2',          city: 'Chicago',    state: 'IL',  country: 'USA',         latitude: 41.8781,  longitude: -87.6298,  metro_area: 'Chicago' },
  { id: 'dc-eq-da2',  provider: 'Equinix', facility_code: 'DA2',          city: 'Dallas',     state: 'TX',  country: 'USA',         latitude: 32.7767,  longitude: -96.7970,  metro_area: 'Dallas' },
  { id: 'dc-eq-ld5',  provider: 'Equinix', facility_code: 'LD5',          city: 'London',     state: null,  country: 'UK',          latitude: 51.5074,  longitude: -0.1278,   metro_area: 'London' },
  { id: 'dc-eq-fr5',  provider: 'Equinix', facility_code: 'FR5',          city: 'Frankfurt',  state: null,  country: 'Germany',     latitude: 50.1109,  longitude: 8.6821,    metro_area: 'Frankfurt' },
  { id: 'dc-eq-am3',  provider: 'Equinix', facility_code: 'AM3',          city: 'Amsterdam',  state: null,  country: 'Netherlands', latitude: 52.3676,  longitude: 4.9041,    metro_area: 'Amsterdam' },
  { id: 'dc-eq-sg1',  provider: 'Equinix', facility_code: 'SG1',          city: 'Singapore',  state: null,  country: 'Singapore',   latitude: 1.3521,   longitude: 103.8198,  metro_area: 'Singapore' },
  { id: 'dc-eq-ty2',  provider: 'Equinix', facility_code: 'TY2',          city: 'Tokyo',      state: null,  country: 'Japan',       latitude: 35.6762,  longitude: 139.6503,  metro_area: 'Tokyo' },
  { id: 'dc-eq-sy3',  provider: 'Equinix', facility_code: 'SY3',          city: 'Sydney',     state: 'NSW', country: 'Australia',   latitude: -33.8688, longitude: 151.2093,  metro_area: 'Sydney' },
  { id: 'dc-dr-va3',  provider: 'Digital Realty', facility_code: 'Ashburn VA3', city: 'Ashburn', state: 'VA', country: 'USA',      latitude: 39.0438,  longitude: -77.4874,  metro_area: 'Washington DC' },
  { id: 'dc-cs-va1',  provider: 'Coresite', facility_code: 'VA1',         city: 'Reston',     state: 'VA',  country: 'USA',         latitude: 38.9586,  longitude: -77.3570,  metro_area: 'Washington DC' },
  { id: 'dc-cy-phx',  provider: 'CyrusOne', facility_code: 'Phoenix',     city: 'Phoenix',    state: 'AZ',  country: 'USA',         latitude: 33.4484,  longitude: -112.0740, metro_area: 'Phoenix' },
];

const CLOUD_REGION_LOCATIONS: CloudRegionLocation[] = [
  // AWS
  { id: 'aws-use1',  provider: 'AWS', region_code: 'us-east-1',        region_name: 'US East (N. Virginia)',       city: 'Ashburn',        state: 'VA',  country: 'USA',         latitude: 39.0438,  longitude: -77.4874,  availability_zones: 6 },
  { id: 'aws-use2',  provider: 'AWS', region_code: 'us-east-2',        region_name: 'US East (Ohio)',              city: 'Columbus',       state: 'OH',  country: 'USA',         latitude: 39.9612,  longitude: -82.9988,  availability_zones: 3 },
  { id: 'aws-usw1',  provider: 'AWS', region_code: 'us-west-1',        region_name: 'US West (N. California)',     city: 'San Francisco',  state: 'CA',  country: 'USA',         latitude: 37.7749,  longitude: -122.4194, availability_zones: 3 },
  { id: 'aws-usw2',  provider: 'AWS', region_code: 'us-west-2',        region_name: 'US West (Oregon)',            city: 'Portland',       state: 'OR',  country: 'USA',         latitude: 45.5152,  longitude: -122.6784, availability_zones: 4 },
  { id: 'aws-euw1',  provider: 'AWS', region_code: 'eu-west-1',        region_name: 'Europe (Ireland)',            city: 'Dublin',         state: null,  country: 'Ireland',     latitude: 53.3498,  longitude: -6.2603,   availability_zones: 3 },
  { id: 'aws-euw2',  provider: 'AWS', region_code: 'eu-west-2',        region_name: 'Europe (London)',             city: 'London',         state: null,  country: 'UK',          latitude: 51.5074,  longitude: -0.1278,   availability_zones: 3 },
  { id: 'aws-euw3',  provider: 'AWS', region_code: 'eu-west-3',        region_name: 'Europe (Paris)',              city: 'Paris',          state: null,  country: 'France',      latitude: 48.8566,  longitude: 2.3522,    availability_zones: 3 },
  { id: 'aws-euc1',  provider: 'AWS', region_code: 'eu-central-1',     region_name: 'Europe (Frankfurt)',          city: 'Frankfurt',      state: null,  country: 'Germany',     latitude: 50.1109,  longitude: 8.6821,    availability_zones: 3 },
  { id: 'aws-eun1',  provider: 'AWS', region_code: 'eu-north-1',       region_name: 'Europe (Stockholm)',          city: 'Stockholm',      state: null,  country: 'Sweden',      latitude: 59.3293,  longitude: 18.0686,   availability_zones: 3 },
  { id: 'aws-apne1', provider: 'AWS', region_code: 'ap-northeast-1',   region_name: 'Asia Pacific (Tokyo)',        city: 'Tokyo',          state: null,  country: 'Japan',       latitude: 35.6762,  longitude: 139.6503,  availability_zones: 4 },
  { id: 'aws-apne2', provider: 'AWS', region_code: 'ap-northeast-2',   region_name: 'Asia Pacific (Seoul)',        city: 'Seoul',          state: null,  country: 'South Korea', latitude: 37.5665,  longitude: 126.9780,  availability_zones: 4 },
  { id: 'aws-apse1', provider: 'AWS', region_code: 'ap-southeast-1',   region_name: 'Asia Pacific (Singapore)',    city: 'Singapore',      state: null,  country: 'Singapore',   latitude: 1.3521,   longitude: 103.8198,  availability_zones: 3 },
  { id: 'aws-apse2', provider: 'AWS', region_code: 'ap-southeast-2',   region_name: 'Asia Pacific (Sydney)',       city: 'Sydney',         state: 'NSW', country: 'Australia',   latitude: -33.8688, longitude: 151.2093,  availability_zones: 3 },
  { id: 'aws-aps1',  provider: 'AWS', region_code: 'ap-south-1',       region_name: 'Asia Pacific (Mumbai)',       city: 'Mumbai',         state: null,  country: 'India',       latitude: 19.0760,  longitude: 72.8777,   availability_zones: 3 },
  { id: 'aws-sae1',  provider: 'AWS', region_code: 'sa-east-1',        region_name: 'South America (Sao Paulo)',   city: 'Sao Paulo',      state: null,  country: 'Brazil',      latitude: -23.5505, longitude: -46.6333,  availability_zones: 3 },
  { id: 'aws-cac1',  provider: 'AWS', region_code: 'ca-central-1',     region_name: 'Canada (Central)',            city: 'Montreal',       state: 'QC',  country: 'Canada',      latitude: 45.5017,  longitude: -73.5673,  availability_zones: 3 },
  // Azure
  { id: 'az-eus',   provider: 'Azure', region_code: 'eastus',              region_name: 'East US',               city: 'Virginia',       state: 'VA',  country: 'USA',         latitude: 37.3719,  longitude: -79.8164,  availability_zones: 3 },
  { id: 'az-eus2',  provider: 'Azure', region_code: 'eastus2',             region_name: 'East US 2',             city: 'Virginia',       state: 'VA',  country: 'USA',         latitude: 36.6681,  longitude: -78.3889,  availability_zones: 3 },
  { id: 'az-wus',   provider: 'Azure', region_code: 'westus',              region_name: 'West US',               city: 'San Francisco',  state: 'CA',  country: 'USA',         latitude: 37.7749,  longitude: -122.4194, availability_zones: 3 },
  { id: 'az-wus2',  provider: 'Azure', region_code: 'westus2',             region_name: 'West US 2',             city: 'Seattle',        state: 'WA',  country: 'USA',         latitude: 47.6062,  longitude: -122.3321, availability_zones: 3 },
  { id: 'az-cus',   provider: 'Azure', region_code: 'centralus',           region_name: 'Central US',            city: 'Des Moines',     state: 'IA',  country: 'USA',         latitude: 41.5868,  longitude: -93.6250,  availability_zones: 3 },
  { id: 'az-neu',   provider: 'Azure', region_code: 'northeurope',         region_name: 'North Europe',          city: 'Dublin',         state: null,  country: 'Ireland',     latitude: 53.3498,  longitude: -6.2603,   availability_zones: 3 },
  { id: 'az-weu',   provider: 'Azure', region_code: 'westeurope',          region_name: 'West Europe',           city: 'Amsterdam',      state: null,  country: 'Netherlands', latitude: 52.3676,  longitude: 4.9041,    availability_zones: 3 },
  { id: 'az-uks',   provider: 'Azure', region_code: 'uksouth',             region_name: 'UK South',              city: 'London',         state: null,  country: 'UK',          latitude: 51.5074,  longitude: -0.1278,   availability_zones: 3 },
  { id: 'az-gwc',   provider: 'Azure', region_code: 'germanywestcentral',  region_name: 'Germany West Central',  city: 'Frankfurt',      state: null,  country: 'Germany',     latitude: 50.1109,  longitude: 8.6821,    availability_zones: 3 },
  { id: 'az-frc',   provider: 'Azure', region_code: 'francecentral',       region_name: 'France Central',        city: 'Paris',          state: null,  country: 'France',      latitude: 48.8566,  longitude: 2.3522,    availability_zones: 3 },
  { id: 'az-jpe',   provider: 'Azure', region_code: 'japaneast',           region_name: 'Japan East',            city: 'Tokyo',          state: null,  country: 'Japan',       latitude: 35.6762,  longitude: 139.6503,  availability_zones: 3 },
  { id: 'az-sea',   provider: 'Azure', region_code: 'southeastasia',       region_name: 'Southeast Asia',        city: 'Singapore',      state: null,  country: 'Singapore',   latitude: 1.3521,   longitude: 103.8198,  availability_zones: 3 },
  { id: 'az-aue',   provider: 'Azure', region_code: 'australiaeast',       region_name: 'Australia East',        city: 'Sydney',         state: 'NSW', country: 'Australia',   latitude: -33.8688, longitude: 151.2093,  availability_zones: 3 },
  // GCP
  { id: 'gcp-use1',  provider: 'GCP', region_code: 'us-east1',            region_name: 'US East (South Carolina)', city: 'Moncks Corner',  state: 'SC', country: 'USA',         latitude: 33.1960,  longitude: -80.0131,  availability_zones: 3 },
  { id: 'gcp-use4',  provider: 'GCP', region_code: 'us-east4',            region_name: 'US East (N. Virginia)',    city: 'Ashburn',        state: 'VA', country: 'USA',         latitude: 39.0438,  longitude: -77.4874,  availability_zones: 3 },
  { id: 'gcp-usw1',  provider: 'GCP', region_code: 'us-west1',            region_name: 'US West (Oregon)',         city: 'The Dalles',     state: 'OR', country: 'USA',         latitude: 45.5945,  longitude: -121.1787, availability_zones: 3 },
  { id: 'gcp-usw2',  provider: 'GCP', region_code: 'us-west2',            region_name: 'US West (Los Angeles)',    city: 'Los Angeles',    state: 'CA', country: 'USA',         latitude: 34.0522,  longitude: -118.2437, availability_zones: 3 },
  { id: 'gcp-usc1',  provider: 'GCP', region_code: 'us-central1',         region_name: 'US Central (Iowa)',        city: 'Council Bluffs', state: 'IA', country: 'USA',         latitude: 41.2619,  longitude: -95.8608,  availability_zones: 3 },
  { id: 'gcp-euw1',  provider: 'GCP', region_code: 'europe-west1',        region_name: 'Europe (Belgium)',         city: 'St. Ghislain',   state: null, country: 'Belgium',     latitude: 50.4489,  longitude: 3.8206,    availability_zones: 3 },
  { id: 'gcp-euw2',  provider: 'GCP', region_code: 'europe-west2',        region_name: 'Europe (London)',          city: 'London',         state: null, country: 'UK',          latitude: 51.5074,  longitude: -0.1278,   availability_zones: 3 },
  { id: 'gcp-euw3',  provider: 'GCP', region_code: 'europe-west3',        region_name: 'Europe (Frankfurt)',       city: 'Frankfurt',      state: null, country: 'Germany',     latitude: 50.1109,  longitude: 8.6821,    availability_zones: 3 },
  { id: 'gcp-euw4',  provider: 'GCP', region_code: 'europe-west4',        region_name: 'Europe (Netherlands)',     city: 'Eemshaven',      state: null, country: 'Netherlands', latitude: 53.4386,  longitude: 6.8355,    availability_zones: 3 },
  { id: 'gcp-ase1',  provider: 'GCP', region_code: 'asia-east1',          region_name: 'Asia (Taiwan)',            city: 'Changhua County',state: null, country: 'Taiwan',      latitude: 24.0518,  longitude: 120.5161,  availability_zones: 3 },
  { id: 'gcp-apne1', provider: 'GCP', region_code: 'asia-northeast1',     region_name: 'Asia (Tokyo)',             city: 'Tokyo',          state: null, country: 'Japan',       latitude: 35.6762,  longitude: 139.6503,  availability_zones: 3 },
  { id: 'gcp-apse1', provider: 'GCP', region_code: 'asia-southeast1',     region_name: 'Asia (Singapore)',         city: 'Singapore',      state: null, country: 'Singapore',   latitude: 1.3521,   longitude: 103.8198,  availability_zones: 3 },
  { id: 'gcp-ause1', provider: 'GCP', region_code: 'australia-southeast1',region_name: 'Australia (Sydney)',       city: 'Sydney',         state: 'NSW',country: 'Australia',   latitude: -33.8688, longitude: 151.2093,  availability_zones: 3 },
  // Oracle
  { id: 'oci-usash1', provider: 'Oracle', region_code: 'us-ashburn-1',      region_name: 'US East (Ashburn)',                      city: 'Ashburn',      state: 'VA',  country: 'USA',          latitude: 39.0438,  longitude: -77.4874,  availability_zones: 3 },
  { id: 'oci-usphx1', provider: 'Oracle', region_code: 'us-phoenix-1',      region_name: 'US West (Phoenix)',                      city: 'Phoenix',      state: 'AZ',  country: 'USA',          latitude: 33.4484,  longitude: -112.0740, availability_zones: 3 },
  { id: 'oci-ussjo1', provider: 'Oracle', region_code: 'us-sanjose-1',      region_name: 'US West (San Jose)',                     city: 'San Jose',     state: 'CA',  country: 'USA',          latitude: 37.3382,  longitude: -121.8863, availability_zones: 3 },
  { id: 'oci-cator1', provider: 'Oracle', region_code: 'ca-toronto-1',      region_name: 'Canada Southeast (Toronto)',             city: 'Toronto',      state: 'ON',  country: 'Canada',       latitude: 43.6532,  longitude: -79.3832,  availability_zones: 3 },
  { id: 'oci-camtl1', provider: 'Oracle', region_code: 'ca-montreal-1',     region_name: 'Canada Southeast (Montreal)',            city: 'Montreal',     state: 'QC',  country: 'Canada',       latitude: 45.5017,  longitude: -73.5673,  availability_zones: 3 },
  { id: 'oci-uschi1', provider: 'Oracle', region_code: 'us-chicago-1',      region_name: 'US Midwest (Chicago)',                   city: 'Chicago',      state: 'IL',  country: 'USA',          latitude: 41.8781,  longitude: -87.6298,  availability_zones: 3 },
  { id: 'oci-uklon1', provider: 'Oracle', region_code: 'uk-london-1',       region_name: 'UK South (London)',                      city: 'London',       state: null,  country: 'UK',           latitude: 51.5074,  longitude: -0.1278,   availability_zones: 3 },
  { id: 'oci-eufra1', provider: 'Oracle', region_code: 'eu-frankfurt-1',    region_name: 'Germany Central (Frankfurt)',            city: 'Frankfurt',    state: null,  country: 'Germany',      latitude: 50.1109,  longitude: 8.6821,    availability_zones: 3 },
  { id: 'oci-euzur1', provider: 'Oracle', region_code: 'eu-zurich-1',       region_name: 'Switzerland North (Zurich)',             city: 'Zurich',       state: null,  country: 'Switzerland',  latitude: 47.3769,  longitude: 8.5417,    availability_zones: 3 },
  { id: 'oci-euams1', provider: 'Oracle', region_code: 'eu-amsterdam-1',    region_name: 'Netherlands Northwest (Amsterdam)',      city: 'Amsterdam',    state: null,  country: 'Netherlands',  latitude: 52.3676,  longitude: 4.9041,    availability_zones: 3 },
  { id: 'oci-eupar1', provider: 'Oracle', region_code: 'eu-paris-1',        region_name: 'France Central (Paris)',                 city: 'Paris',        state: null,  country: 'France',       latitude: 48.8566,  longitude: 2.3522,    availability_zones: 3 },
  { id: 'oci-eustk1', provider: 'Oracle', region_code: 'eu-stockholm-1',    region_name: 'Sweden Central (Stockholm)',             city: 'Stockholm',    state: null,  country: 'Sweden',       latitude: 59.3293,  longitude: 18.0686,   availability_zones: 3 },
  { id: 'oci-euml1',  provider: 'Oracle', region_code: 'eu-milan-1',        region_name: 'Italy Northwest (Milan)',                city: 'Milan',        state: null,  country: 'Italy',        latitude: 45.4642,  longitude: 9.1900,    availability_zones: 3 },
  { id: 'oci-aptko1', provider: 'Oracle', region_code: 'ap-tokyo-1',        region_name: 'Japan East (Tokyo)',                     city: 'Tokyo',        state: null,  country: 'Japan',        latitude: 35.6762,  longitude: 139.6503,  availability_zones: 3 },
  { id: 'oci-aposa1', provider: 'Oracle', region_code: 'ap-osaka-1',        region_name: 'Japan Central (Osaka)',                  city: 'Osaka',        state: null,  country: 'Japan',        latitude: 34.6937,  longitude: 135.5023,  availability_zones: 3 },
  { id: 'oci-apseo1', provider: 'Oracle', region_code: 'ap-seoul-1',        region_name: 'South Korea Central (Seoul)',            city: 'Seoul',        state: null,  country: 'South Korea',  latitude: 37.5665,  longitude: 126.9780,  availability_zones: 3 },
  { id: 'oci-apmum1', provider: 'Oracle', region_code: 'ap-mumbai-1',       region_name: 'India West (Mumbai)',                    city: 'Mumbai',       state: null,  country: 'India',        latitude: 19.0760,  longitude: 72.8777,   availability_zones: 3 },
  { id: 'oci-aphyd1', provider: 'Oracle', region_code: 'ap-hyderabad-1',    region_name: 'India South (Hyderabad)',                city: 'Hyderabad',    state: null,  country: 'India',        latitude: 17.3850,  longitude: 78.4867,   availability_zones: 3 },
  { id: 'oci-apsyd1', provider: 'Oracle', region_code: 'ap-sydney-1',       region_name: 'Australia East (Sydney)',                city: 'Sydney',       state: 'NSW', country: 'Australia',    latitude: -33.8688, longitude: 151.2093,  availability_zones: 3 },
  { id: 'oci-apmel1', provider: 'Oracle', region_code: 'ap-melbourne-1',    region_name: 'Australia Southeast (Melbourne)',        city: 'Melbourne',    state: 'VIC', country: 'Australia',    latitude: -37.8136, longitude: 144.9631,  availability_zones: 3 },
  { id: 'oci-apsin1', provider: 'Oracle', region_code: 'ap-singapore-1',    region_name: 'Singapore (Singapore)',                  city: 'Singapore',    state: null,  country: 'Singapore',    latitude: 1.3521,   longitude: 103.8198,  availability_zones: 3 },
  { id: 'oci-mejed1', provider: 'Oracle', region_code: 'me-jeddah-1',       region_name: 'Saudi Arabia West (Jeddah)',             city: 'Jeddah',       state: null,  country: 'Saudi Arabia', latitude: 21.5433,  longitude: 39.1728,   availability_zones: 3 },
  { id: 'oci-medub1', provider: 'Oracle', region_code: 'me-dubai-1',        region_name: 'UAE East (Dubai)',                       city: 'Dubai',        state: null,  country: 'UAE',          latitude: 25.2048,  longitude: 55.2708,   availability_zones: 3 },
  { id: 'oci-sasao1', provider: 'Oracle', region_code: 'sa-saopaulo-1',     region_name: 'Brazil East (Sao Paulo)',                city: 'Sao Paulo',    state: null,  country: 'Brazil',       latitude: -23.5505, longitude: -46.6333,  availability_zones: 3 },
  { id: 'oci-sasan1', provider: 'Oracle', region_code: 'sa-santiago-1',     region_name: 'Chile (Santiago)',                       city: 'Santiago',     state: null,  country: 'Chile',        latitude: -33.4489, longitude: -70.6693,  availability_zones: 3 },
  { id: 'oci-afjhb1', provider: 'Oracle', region_code: 'af-johannesburg-1', region_name: 'South Africa Central (Johannesburg)',    city: 'Johannesburg', state: null,  country: 'South Africa', latitude: -26.2041, longitude: 28.0473,   availability_zones: 3 },
];

export async function getDatacenterLocations(): Promise<DatacenterLocation[]> {
  return DATACENTER_LOCATIONS;
}

export async function getCloudRegionLocations(provider?: string): Promise<CloudRegionLocation[]> {
  if (provider) {
    return CLOUD_REGION_LOCATIONS.filter(r => r.provider === provider);
  }
  return CLOUD_REGION_LOCATIONS;
}

export async function getCloudRegionByCode(provider: string, regionCode: string): Promise<CloudRegionLocation | null> {
  return CLOUD_REGION_LOCATIONS.find(r => r.provider === provider && r.region_code === regionCode) ?? null;
}

export async function getDatacenterByFacility(provider: string, facilityCode: string): Promise<DatacenterLocation | null> {
  return DATACENTER_LOCATIONS.find(d => d.provider === provider && d.facility_code === facilityCode) ?? null;
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
  // no-op: data is static
}
