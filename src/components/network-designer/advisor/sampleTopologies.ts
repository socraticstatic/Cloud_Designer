// Downloadable sample topology files for the import flow.

export const SAMPLE_JSON = `{
  "name": "Acme Corp - Hybrid Cloud Estate",
  "nodes": [
    { "id": "core", "name": "AT&T Core", "type": "core" },
    { "id": "inet", "name": "Internet Edge", "type": "internet" },
    { "id": "cr1", "name": "Primary Cloud Router", "type": "cloud router", "region": "US East", "city": "Ashburn" },
    { "id": "aws1", "name": "AWS Production", "type": "cloud", "provider": "AWS", "region": "us-east-1", "city": "Ashburn" },
    { "id": "azure1", "name": "Azure DR", "type": "cloud", "provider": "Azure", "region": "East US 2", "city": "Richmond" },
    { "id": "dc1", "name": "Equinix DA1", "type": "datacenter", "provider": "Equinix", "city": "Dallas" }
  ],
  "edges": [
    { "source": "core", "target": "cr1", "type": "MPLS", "bandwidth": "10 Gbps", "encrypted": true, "status": "active" },
    { "source": "inet", "target": "cr1", "type": "Internet", "bandwidth": "1 Gbps", "encrypted": false, "status": "active" },
    { "source": "cr1", "target": "aws1", "type": "Direct Connect", "bandwidth": "10 Gbps", "encrypted": true, "resilience": "single", "status": "active" },
    { "source": "cr1", "target": "azure1", "type": "ExpressRoute", "bandwidth": "1 Gbps", "encrypted": true, "resilience": "single", "status": "active" },
    { "source": "core", "target": "dc1", "type": "Ethernet", "bandwidth": "10 Gbps", "encrypted": false, "status": "active" }
  ]
}`;

export const SAMPLE_CSV = `source,target,type,bandwidth,encrypted,resilience
AT&T Core,Primary Cloud Router,MPLS,10 Gbps,true,redundant
Internet Edge,Primary Cloud Router,Internet,1 Gbps,false,single
Primary Cloud Router,AWS Production,Direct Connect,10 Gbps,true,single
Primary Cloud Router,Azure DR,ExpressRoute,1 Gbps,true,single
AT&T Core,Equinix Dallas Datacenter,Ethernet,10 Gbps,false,single`;

export function downloadSample(kind: 'json' | 'csv') {
  const content = kind === 'json' ? SAMPLE_JSON : SAMPLE_CSV;
  const blob = new Blob([content], { type: kind === 'json' ? 'application/json' : 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `sample-topology.${kind}`;
  a.click();
  URL.revokeObjectURL(url);
}
