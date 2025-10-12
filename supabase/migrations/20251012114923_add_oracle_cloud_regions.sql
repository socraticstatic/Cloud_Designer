/*
  # Add Oracle Cloud Infrastructure (OCI) Regions

  1. Changes
    - Add Oracle Cloud regions to cloud_region_locations table
    - Includes all major OCI regions with accurate city locations

  2. Regions Added
    - North America: 8 regions
    - Europe: 4 regions
    - Asia Pacific: 8 regions
    - Middle East: 2 regions
    - Latin America: 2 regions
*/

-- Insert Oracle Cloud regions
INSERT INTO cloud_region_locations (provider, region_code, region_name, city, state, country, latitude, longitude, availability_zones) VALUES
  -- North America
  ('Oracle', 'us-ashburn-1', 'US East (Ashburn)', 'Ashburn', 'VA', 'USA', 39.0438, -77.4874, 3),
  ('Oracle', 'us-phoenix-1', 'US West (Phoenix)', 'Phoenix', 'AZ', 'USA', 33.4484, -112.0740, 3),
  ('Oracle', 'us-sanjose-1', 'US West (San Jose)', 'San Jose', 'CA', 'USA', 37.3382, -121.8863, 3),
  ('Oracle', 'ca-toronto-1', 'Canada Southeast (Toronto)', 'Toronto', 'ON', 'Canada', 43.6532, -79.3832, 3),
  ('Oracle', 'ca-montreal-1', 'Canada Southeast (Montreal)', 'Montreal', 'QC', 'Canada', 45.5017, -73.5673, 3),
  ('Oracle', 'us-chicago-1', 'US Midwest (Chicago)', 'Chicago', 'IL', 'USA', 41.8781, -87.6298, 3),
  
  -- Europe
  ('Oracle', 'uk-london-1', 'UK South (London)', 'London', NULL, 'UK', 51.5074, -0.1278, 3),
  ('Oracle', 'eu-frankfurt-1', 'Germany Central (Frankfurt)', 'Frankfurt', NULL, 'Germany', 50.1109, 8.6821, 3),
  ('Oracle', 'eu-zurich-1', 'Switzerland North (Zurich)', 'Zurich', NULL, 'Switzerland', 47.3769, 8.5417, 3),
  ('Oracle', 'eu-amsterdam-1', 'Netherlands Northwest (Amsterdam)', 'Amsterdam', NULL, 'Netherlands', 52.3676, 4.9041, 3),
  ('Oracle', 'eu-paris-1', 'France Central (Paris)', 'Paris', NULL, 'France', 48.8566, 2.3522, 3),
  ('Oracle', 'eu-stockholm-1', 'Sweden Central (Stockholm)', 'Stockholm', NULL, 'Sweden', 59.3293, 18.0686, 3),
  ('Oracle', 'eu-milan-1', 'Italy Northwest (Milan)', 'Milan', NULL, 'Italy', 45.4642, 9.1900, 3),
  
  -- Asia Pacific
  ('Oracle', 'ap-tokyo-1', 'Japan East (Tokyo)', 'Tokyo', NULL, 'Japan', 35.6762, 139.6503, 3),
  ('Oracle', 'ap-osaka-1', 'Japan Central (Osaka)', 'Osaka', NULL, 'Japan', 34.6937, 135.5023, 3),
  ('Oracle', 'ap-seoul-1', 'South Korea Central (Seoul)', 'Seoul', NULL, 'South Korea', 37.5665, 126.9780, 3),
  ('Oracle', 'ap-mumbai-1', 'India West (Mumbai)', 'Mumbai', NULL, 'India', 19.0760, 72.8777, 3),
  ('Oracle', 'ap-hyderabad-1', 'India South (Hyderabad)', 'Hyderabad', NULL, 'India', 17.3850, 78.4867, 3),
  ('Oracle', 'ap-sydney-1', 'Australia East (Sydney)', 'Sydney', 'NSW', 'Australia', -33.8688, 151.2093, 3),
  ('Oracle', 'ap-melbourne-1', 'Australia Southeast (Melbourne)', 'Melbourne', 'VIC', 'Australia', -37.8136, 144.9631, 3),
  ('Oracle', 'ap-singapore-1', 'Singapore (Singapore)', 'Singapore', NULL, 'Singapore', 1.3521, 103.8198, 3),
  
  -- Middle East
  ('Oracle', 'me-jeddah-1', 'Saudi Arabia West (Jeddah)', 'Jeddah', NULL, 'Saudi Arabia', 21.5433, 39.1728, 3),
  ('Oracle', 'me-dubai-1', 'UAE East (Dubai)', 'Dubai', NULL, 'UAE', 25.2048, 55.2708, 3),
  
  -- Latin America
  ('Oracle', 'sa-saopaulo-1', 'Brazil East (São Paulo)', 'São Paulo', NULL, 'Brazil', -23.5505, -46.6333, 3),
  ('Oracle', 'sa-santiago-1', 'Chile (Santiago)', 'Santiago', NULL, 'Chile', -33.4489, -70.6693, 3),
  
  -- South Africa
  ('Oracle', 'af-johannesburg-1', 'South Africa Central (Johannesburg)', 'Johannesburg', NULL, 'South Africa', -26.2041, 28.0473, 3)
ON CONFLICT (provider, region_code) DO NOTHING;
