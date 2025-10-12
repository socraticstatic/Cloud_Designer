# City Location Features

This document describes the geographic location capabilities added to the Cloud Designer application, enabling accurate city-level positioning for datacenters and cloud provider regions.

## Overview

The application now includes a comprehensive location database with real geographic coordinates for:
- **Major cloud provider regions** (AWS, Azure, GCP)
- **Datacenter facilities** (Equinix, Digital Realty, Coresite, CyrusOne)

When you configure nodes, they are automatically positioned on the global map view using actual city coordinates.

## Database Schema

### Tables

#### `cloud_region_locations`
Stores cloud provider region information with accurate city locations.

**Columns:**
- `id` - Unique identifier
- `provider` - Cloud provider (AWS, Azure, GCP)
- `region_code` - Region code (e.g., "us-east-1")
- `region_name` - Human-readable name
- `city` - City name
- `state` - State/province (nullable)
- `country` - Country
- `latitude` - Geographic latitude (decimal)
- `longitude` - Geographic longitude (decimal)
- `availability_zones` - Number of availability zones

#### `datacenter_locations`
Stores physical datacenter facility information.

**Columns:**
- `id` - Unique identifier
- `provider` - Datacenter provider name
- `facility_code` - Facility identifier (e.g., "DC2", "NY4")
- `city` - City name
- `state` - State/province (nullable)
- `country` - Country
- `latitude` - Geographic latitude (decimal)
- `longitude` - Geographic longitude (decimal)
- `metro_area` - Metropolitan area identifier

## Included Locations

### Cloud Providers

**AWS Regions** (16 regions)
- US East (N. Virginia) - Ashburn, VA
- US East (Ohio) - Columbus, OH
- US West (N. California) - San Francisco, CA
- US West (Oregon) - Portland, OR
- Europe (Ireland) - Dublin
- Europe (London) - London
- Europe (Frankfurt) - Frankfurt
- Asia Pacific (Tokyo) - Tokyo
- Asia Pacific (Singapore) - Singapore
- And more...

**Azure Regions** (13 regions)
- East US - Virginia
- West US - San Francisco
- North Europe - Dublin
- West Europe - Amsterdam
- UK South - London
- Japan East - Tokyo
- And more...

**GCP Regions** (13 regions)
- US East (N. Virginia) - Ashburn
- US West (Oregon) - The Dalles
- US Central (Iowa) - Council Bluffs
- Europe (Frankfurt) - Frankfurt
- Asia (Tokyo) - Tokyo
- And more...

### Datacenter Facilities

**Equinix** (16 facilities)
- DC2, DC6, DC10 - Ashburn, VA
- NY2, NY4 - Secaucus, NJ
- SV1, SV5 - San Jose, CA
- LD5 - London, UK
- FR5 - Frankfurt, Germany
- TY2 - Tokyo, Japan
- And more...

**Other Providers**
- Digital Realty
- Coresite
- CyrusOne

## Node Configuration Changes

### NetworkNode Type Extensions

The `NetworkNode` interface now includes geographic properties:

```typescript
interface NetworkNode {
  // ... existing properties
  config?: {
    // ... existing config

    // Geographic properties
    city?: string;
    state?: string;
    country?: string;
    latitude?: number;
    longitude?: number;
    facilityCode?: string;
  }
}
```

## User Interface

### Cloud Provider Nodes (Destination Type)

When configuring a cloud provider node:

1. **Select Provider** - Choose AWS, Azure, or GCP
2. **Select Region** - Dynamic dropdown populated from database
3. **Automatic Location** - City coordinates are automatically set
4. **Location Display** - Shows city, state, and country

### Datacenter Nodes

When configuring a datacenter node:

1. **Select Provider** - Choose from Equinix, Digital Realty, etc.
2. **Select Facility** - Dynamic dropdown with facility codes and cities
3. **Automatic Location** - Geographic coordinates are automatically set
4. **Location Display** - Shows city, state/country

## Global View Integration

The Global View now uses actual geographic coordinates:

1. **Accurate Positioning** - Nodes appear at their real-world locations
2. **Mercator Projection** - Converts lat/long to map coordinates
3. **Fallback Support** - Uses algorithmic positioning if coordinates unavailable

### Coordinate Conversion

Geographic coordinates (latitude/longitude) are converted to map coordinates using:

```typescript
x = ((longitude + 180) / 360) * mapWidth
y = ((90 - latitude) / 180) * mapHeight
```

## Location Service API

### Available Functions

```typescript
// Get all datacenter locations
const datacenters = await getDatacenterLocations();

// Get cloud regions (all or filtered by provider)
const awsRegions = await getCloudRegionLocations('AWS');
const allRegions = await getCloudRegionLocations();

// Get specific locations
const region = await getCloudRegionByCode('AWS', 'us-east-1');
const datacenter = await getDatacenterByFacility('Equinix', 'DC2');

// Get provider lists
const cloudProviders = getCloudProviders();
const dcProviders = getDatacenterProviders();

// Convert coordinates
const mapCoords = convertToMapCoordinates(latitude, longitude);
```

### Caching

Location data is cached in memory after first fetch to minimize database queries:
- Datacenter locations cached globally
- Cloud regions cached per provider
- Use `clearLocationCache()` to reset

## Benefits

1. **Accurate Visualization** - Nodes appear at real-world locations on global map
2. **Better Planning** - See actual geographic distribution of infrastructure
3. **Latency Awareness** - Understand physical distances between nodes
4. **Compliance** - Know exact locations for data sovereignty requirements
5. **Documentation** - Export designs with accurate location data

## Future Enhancements

Potential improvements:
- Distance calculations between nodes
- Latency estimates based on geographic distance
- Regional compliance indicators
- Custom datacenter location additions
- Integration with network performance metrics

## Database Management

### Querying Locations

```sql
-- Find all AWS regions in Europe
SELECT * FROM cloud_region_locations
WHERE provider = 'AWS' AND country IN ('Ireland', 'UK', 'Germany', 'France');

-- Find Equinix facilities in North America
SELECT * FROM datacenter_locations
WHERE provider = 'Equinix' AND country = 'USA';
```

### Adding Custom Locations

To add custom datacenter locations:

```sql
INSERT INTO datacenter_locations
  (provider, facility_code, city, state, country, latitude, longitude)
VALUES
  ('Custom Provider', 'CP1', 'Austin', 'TX', 'USA', 30.2672, -97.7431);
```

## Technical Implementation

### Key Files

- `/src/services/locationService.ts` - Location data service and API
- `/src/types/index.ts` - NetworkNode type with geographic properties
- `/src/components/network-designer/NodeConfigPanel.tsx` - UI for location selection
- `/src/components/network-designer/global-view/utils/locationUtils.ts` - Coordinate conversion

### Dependencies

- `@supabase/supabase-js` - Database client for location queries
- Environment variables for Supabase connection (already configured)

## Security

- **RLS Enabled** - Row Level Security enabled on both tables
- **Public Read Access** - Reference data is publicly readable
- **No Authentication Required** - Location data is reference information
