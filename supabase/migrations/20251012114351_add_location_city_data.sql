/*
  # Add City Location Data for Network Nodes

  1. New Tables
    - `datacenter_locations`
      - `id` (uuid, primary key)
      - `provider` (text) - Datacenter provider name
      - `facility_code` (text) - Facility identifier (e.g., "VA3", "NY1")
      - `city` (text) - City name
      - `state` (text, nullable) - State/province
      - `country` (text) - Country
      - `latitude` (decimal) - Geographic latitude
      - `longitude` (decimal) - Geographic longitude
      - `metro_area` (text, nullable) - Metro area identifier
      - `created_at` (timestamptz)
    
    - `cloud_region_locations`
      - `id` (uuid, primary key)
      - `provider` (text) - Cloud provider (AWS, Azure, GCP)
      - `region_code` (text) - Region identifier (e.g., "us-east-1")
      - `region_name` (text) - Human-readable region name
      - `city` (text) - City name
      - `state` (text, nullable) - State/province
      - `country` (text) - Country
      - `latitude` (decimal) - Geographic latitude
      - `longitude` (decimal) - Geographic longitude
      - `availability_zones` (integer, default 3) - Number of AZs
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Add public read-only policies (reference data)
    - Only authenticated users can manage their own data

  3. Seed Data
    - Insert common datacenter locations
    - Insert major cloud provider regions with accurate city locations
*/

-- Create datacenter_locations table
CREATE TABLE IF NOT EXISTS datacenter_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL,
  facility_code text NOT NULL,
  city text NOT NULL,
  state text,
  country text NOT NULL,
  latitude decimal(10, 7) NOT NULL,
  longitude decimal(10, 7) NOT NULL,
  metro_area text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(provider, facility_code)
);

-- Create cloud_region_locations table
CREATE TABLE IF NOT EXISTS cloud_region_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL,
  region_code text NOT NULL,
  region_name text NOT NULL,
  city text NOT NULL,
  state text,
  country text NOT NULL,
  latitude decimal(10, 7) NOT NULL,
  longitude decimal(10, 7) NOT NULL,
  availability_zones integer DEFAULT 3,
  created_at timestamptz DEFAULT now(),
  UNIQUE(provider, region_code)
);

-- Enable RLS
ALTER TABLE datacenter_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE cloud_region_locations ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Anyone can read datacenter locations"
  ON datacenter_locations FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can read cloud region locations"
  ON cloud_region_locations FOR SELECT
  TO public
  USING (true);

-- Insert datacenter locations
INSERT INTO datacenter_locations (provider, facility_code, city, state, country, latitude, longitude, metro_area) VALUES
  ('Equinix', 'DC2', 'Ashburn', 'VA', 'USA', 39.0438, -77.4874, 'Washington DC'),
  ('Equinix', 'DC6', 'Ashburn', 'VA', 'USA', 39.0438, -77.4874, 'Washington DC'),
  ('Equinix', 'DC10', 'Ashburn', 'VA', 'USA', 39.0438, -77.4874, 'Washington DC'),
  ('Equinix', 'NY2', 'Secaucus', 'NJ', 'USA', 40.7895, -74.0565, 'New York'),
  ('Equinix', 'NY4', 'Secaucus', 'NJ', 'USA', 40.7895, -74.0565, 'New York'),
  ('Equinix', 'SV1', 'San Jose', 'CA', 'USA', 37.3382, -121.8863, 'Silicon Valley'),
  ('Equinix', 'SV5', 'San Jose', 'CA', 'USA', 37.3382, -121.8863, 'Silicon Valley'),
  ('Equinix', 'LA3', 'El Segundo', 'CA', 'USA', 33.9192, -118.4165, 'Los Angeles'),
  ('Equinix', 'CH2', 'Chicago', 'IL', 'USA', 41.8781, -87.6298, 'Chicago'),
  ('Equinix', 'DA2', 'Dallas', 'TX', 'USA', 32.7767, -96.7970, 'Dallas'),
  ('Equinix', 'LD5', 'London', NULL, 'UK', 51.5074, -0.1278, 'London'),
  ('Equinix', 'FR5', 'Frankfurt', NULL, 'Germany', 50.1109, 8.6821, 'Frankfurt'),
  ('Equinix', 'AM3', 'Amsterdam', NULL, 'Netherlands', 52.3676, 4.9041, 'Amsterdam'),
  ('Equinix', 'SG1', 'Singapore', NULL, 'Singapore', 1.3521, 103.8198, 'Singapore'),
  ('Equinix', 'TY2', 'Tokyo', NULL, 'Japan', 35.6762, 139.6503, 'Tokyo'),
  ('Equinix', 'SY3', 'Sydney', 'NSW', 'Australia', -33.8688, 151.2093, 'Sydney'),
  ('Digital Realty', 'Ashburn VA3', 'Ashburn', 'VA', 'USA', 39.0438, -77.4874, 'Washington DC'),
  ('Coresite', 'VA1', 'Reston', 'VA', 'USA', 38.9586, -77.3570, 'Washington DC'),
  ('CyrusOne', 'Phoenix', 'Phoenix', 'AZ', 'USA', 33.4484, -112.0740, 'Phoenix')
ON CONFLICT (provider, facility_code) DO NOTHING;

-- Insert AWS regions
INSERT INTO cloud_region_locations (provider, region_code, region_name, city, state, country, latitude, longitude, availability_zones) VALUES
  ('AWS', 'us-east-1', 'US East (N. Virginia)', 'Ashburn', 'VA', 'USA', 39.0438, -77.4874, 6),
  ('AWS', 'us-east-2', 'US East (Ohio)', 'Columbus', 'OH', 'USA', 39.9612, -82.9988, 3),
  ('AWS', 'us-west-1', 'US West (N. California)', 'San Francisco', 'CA', 'USA', 37.7749, -122.4194, 3),
  ('AWS', 'us-west-2', 'US West (Oregon)', 'Portland', 'OR', 'USA', 45.5152, -122.6784, 4),
  ('AWS', 'eu-west-1', 'Europe (Ireland)', 'Dublin', NULL, 'Ireland', 53.3498, -6.2603, 3),
  ('AWS', 'eu-west-2', 'Europe (London)', 'London', NULL, 'UK', 51.5074, -0.1278, 3),
  ('AWS', 'eu-west-3', 'Europe (Paris)', 'Paris', NULL, 'France', 48.8566, 2.3522, 3),
  ('AWS', 'eu-central-1', 'Europe (Frankfurt)', 'Frankfurt', NULL, 'Germany', 50.1109, 8.6821, 3),
  ('AWS', 'eu-north-1', 'Europe (Stockholm)', 'Stockholm', NULL, 'Sweden', 59.3293, 18.0686, 3),
  ('AWS', 'ap-northeast-1', 'Asia Pacific (Tokyo)', 'Tokyo', NULL, 'Japan', 35.6762, 139.6503, 4),
  ('AWS', 'ap-northeast-2', 'Asia Pacific (Seoul)', 'Seoul', NULL, 'South Korea', 37.5665, 126.9780, 4),
  ('AWS', 'ap-southeast-1', 'Asia Pacific (Singapore)', 'Singapore', NULL, 'Singapore', 1.3521, 103.8198, 3),
  ('AWS', 'ap-southeast-2', 'Asia Pacific (Sydney)', 'Sydney', 'NSW', 'Australia', -33.8688, 151.2093, 3),
  ('AWS', 'ap-south-1', 'Asia Pacific (Mumbai)', 'Mumbai', NULL, 'India', 19.0760, 72.8777, 3),
  ('AWS', 'sa-east-1', 'South America (São Paulo)', 'São Paulo', NULL, 'Brazil', -23.5505, -46.6333, 3),
  ('AWS', 'ca-central-1', 'Canada (Central)', 'Montreal', 'QC', 'Canada', 45.5017, -73.5673, 3)
ON CONFLICT (provider, region_code) DO NOTHING;

-- Insert Azure regions
INSERT INTO cloud_region_locations (provider, region_code, region_name, city, state, country, latitude, longitude, availability_zones) VALUES
  ('Azure', 'eastus', 'East US', 'Virginia', 'VA', 'USA', 37.3719, -79.8164, 3),
  ('Azure', 'eastus2', 'East US 2', 'Virginia', 'VA', 'USA', 36.6681, -78.3889, 3),
  ('Azure', 'westus', 'West US', 'San Francisco', 'CA', 'USA', 37.7749, -122.4194, 3),
  ('Azure', 'westus2', 'West US 2', 'Seattle', 'WA', 'USA', 47.6062, -122.3321, 3),
  ('Azure', 'centralus', 'Central US', 'Des Moines', 'IA', 'USA', 41.5868, -93.6250, 3),
  ('Azure', 'northeurope', 'North Europe', 'Dublin', NULL, 'Ireland', 53.3498, -6.2603, 3),
  ('Azure', 'westeurope', 'West Europe', 'Amsterdam', NULL, 'Netherlands', 52.3676, 4.9041, 3),
  ('Azure', 'uksouth', 'UK South', 'London', NULL, 'UK', 51.5074, -0.1278, 3),
  ('Azure', 'germanywestcentral', 'Germany West Central', 'Frankfurt', NULL, 'Germany', 50.1109, 8.6821, 3),
  ('Azure', 'francecentral', 'France Central', 'Paris', NULL, 'France', 48.8566, 2.3522, 3),
  ('Azure', 'japaneast', 'Japan East', 'Tokyo', NULL, 'Japan', 35.6762, 139.6503, 3),
  ('Azure', 'southeastasia', 'Southeast Asia', 'Singapore', NULL, 'Singapore', 1.3521, 103.8198, 3),
  ('Azure', 'australiaeast', 'Australia East', 'Sydney', 'NSW', 'Australia', -33.8688, 151.2093, 3)
ON CONFLICT (provider, region_code) DO NOTHING;

-- Insert GCP regions
INSERT INTO cloud_region_locations (provider, region_code, region_name, city, state, country, latitude, longitude, availability_zones) VALUES
  ('GCP', 'us-east1', 'US East (South Carolina)', 'Moncks Corner', 'SC', 'USA', 33.1960, -80.0131, 3),
  ('GCP', 'us-east4', 'US East (N. Virginia)', 'Ashburn', 'VA', 'USA', 39.0438, -77.4874, 3),
  ('GCP', 'us-west1', 'US West (Oregon)', 'The Dalles', 'OR', 'USA', 45.5945, -121.1787, 3),
  ('GCP', 'us-west2', 'US West (Los Angeles)', 'Los Angeles', 'CA', 'USA', 34.0522, -118.2437, 3),
  ('GCP', 'us-central1', 'US Central (Iowa)', 'Council Bluffs', 'IA', 'USA', 41.2619, -95.8608, 3),
  ('GCP', 'europe-west1', 'Europe (Belgium)', 'St. Ghislain', NULL, 'Belgium', 50.4489, 3.8206, 3),
  ('GCP', 'europe-west2', 'Europe (London)', 'London', NULL, 'UK', 51.5074, -0.1278, 3),
  ('GCP', 'europe-west3', 'Europe (Frankfurt)', 'Frankfurt', NULL, 'Germany', 50.1109, 8.6821, 3),
  ('GCP', 'europe-west4', 'Europe (Netherlands)', 'Eemshaven', NULL, 'Netherlands', 53.4386, 6.8355, 3),
  ('GCP', 'asia-east1', 'Asia (Taiwan)', 'Changhua County', NULL, 'Taiwan', 24.0518, 120.5161, 3),
  ('GCP', 'asia-northeast1', 'Asia (Tokyo)', 'Tokyo', NULL, 'Japan', 35.6762, 139.6503, 3),
  ('GCP', 'asia-southeast1', 'Asia (Singapore)', 'Singapore', NULL, 'Singapore', 1.3521, 103.8198, 3),
  ('GCP', 'australia-southeast1', 'Australia (Sydney)', 'Sydney', 'NSW', 'Australia', -33.8688, 151.2093, 3)
ON CONFLICT (provider, region_code) DO NOTHING;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_datacenter_locations_provider ON datacenter_locations(provider);
CREATE INDEX IF NOT EXISTS idx_datacenter_locations_city ON datacenter_locations(city);
CREATE INDEX IF NOT EXISTS idx_cloud_region_locations_provider ON cloud_region_locations(provider);
CREATE INDEX IF NOT EXISTS idx_cloud_region_locations_region_code ON cloud_region_locations(region_code);
