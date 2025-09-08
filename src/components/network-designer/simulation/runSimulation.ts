import { NetworkNode, NetworkEdge } from '../../types';

interface SimulationData {
  progress: number;
  metrics: {
    bandwidth: { current: number; max: number };
    latency: { current: number; max: number };
    packets: { sent: number; received: number; errors: number };
  };
  phase: 'idle' | 'initializing' | 'running' | 'completed' | 'error' | 'paused';
  networkScores: {
    resiliency: number;
    redundancy: number;
    disaster: number;
    security: number;
    performance: number;
  };
}

// Control variables for the simulation
let simulationPaused = false;
let simulationCancelled = false;
let latencyInjection = 0;
let packetLossInjection = 0;
let bandwidthLimitInjection = 100;

export function pauseSimulation() {
  simulationPaused = true;
}

export function resumeSimulation() {
  simulationPaused = false;
}

export function cancelSimulation() {
  simulationCancelled = true;
}

export function injectLatency(amount: number) {
  latencyInjection = amount;
}

export function injectPacketLoss(amount: number) {
  packetLossInjection = amount;
}

export function injectBandwidthLimit(percent: number) {
  bandwidthLimitInjection = percent;
}

export async function runSimulation(
  nodes: NetworkNode[],
  edges: NetworkEdge[],
  setNodes: React.Dispatch<React.SetStateAction<NetworkNode[]>>,
  setEdges: React.Dispatch<React.SetStateAction<NetworkEdge[]>>,
  setSimulationData: React.Dispatch<React.SetStateAction<SimulationData>>,
  setIsRunningScenario: React.Dispatch<React.SetStateAction<boolean>>
) {
  if (!edges.length) return false;

  // Reset control variables
  simulationPaused = false;
  simulationCancelled = false;
  latencyInjection = 0;
  packetLossInjection = 0;
  bandwidthLimitInjection = 100;

  setIsRunningScenario(true);
  setSimulationData(prev => ({
    ...prev,
    progress: 0,
    phase: 'initializing',
    metrics: {
      bandwidth: { current: 0, max: 100 },
      latency: { current: 0, max: 100 },
      packets: { sent: 0, received: 0, errors: 0 }
    }
  }));

  try {
    // Phase 1: Initialization - activate nodes
    setSimulationData(prev => ({ 
      ...prev, 
      phase: 'initializing', 
      progress: 10 
    }));
    
    // Activate nodes one by one with slight delays - more realistic
    for (const node of nodes) {
      if (simulationCancelled) {
        throw new Error("Simulation cancelled");
      }

      // Wait if simulation is paused
      while (simulationPaused) {
        setSimulationData(prev => ({ 
          ...prev, 
          phase: 'paused'
        }));
        await new Promise(resolve => setTimeout(resolve, 500));
        if (simulationCancelled) break;
      }

      if (!simulationPaused) {
        setSimulationData(prev => ({ 
          ...prev, 
          phase: 'initializing'
        }));
      }
      
      await new Promise(resolve => setTimeout(resolve, 300));
      setNodes(prev => prev.map(n => 
        n.id === node.id ? { ...n, status: 'active' } : n
      ));
      
      // Update progress
      setSimulationData(prev => ({ 
        ...prev, 
        progress: prev.progress + (20 / nodes.length) 
      }));
    }

    // Phase 2: Running simulation - activate edges and simulate traffic
    if (!simulationPaused) {
      setSimulationData(prev => ({ ...prev, phase: 'running' }));
    }
    
    // Activate edges with cascading effect - like real network initialization
    for (let i = 0; i < edges.length; i++) {
      if (simulationCancelled) {
        throw new Error("Simulation cancelled");
      }

      // Wait if simulation is paused
      while (simulationPaused) {
        setSimulationData(prev => ({ 
          ...prev, 
          phase: 'paused'
        }));
        await new Promise(resolve => setTimeout(resolve, 500));
        if (simulationCancelled) break;
      }

      if (!simulationPaused) {
        setSimulationData(prev => ({ 
          ...prev, 
          phase: 'running'
        }));
      }
      
      const edge = edges[i];
      await new Promise(resolve => setTimeout(resolve, 700));
      
      // Initialize edge with starting metrics
      setEdges(prev => prev.map(e => 
        e.id === edge.id ? { 
          ...e, 
          status: 'active',
          metrics: {
            latency: '10ms',
            throughput: '1 Gbps',
            packetLoss: '0.1%',
            bandwidthUtilization: 10 // Start with low utilization
          }
        } : e
      ));
      
      // Update progress
      setSimulationData(prev => ({ 
        ...prev, 
        progress: 30 + (i * (30 / edges.length)),
        metrics: {
          ...prev.metrics,
          packets: { 
            ...prev.metrics.packets,
            sent: prev.metrics.packets.sent + 100
          }
        }
      }));
    }

    // Phase 3: Simulate dynamic traffic patterns
    // Gradually increase bandwidth utilization over time
    for (let step = 0; step < 20; step++) {
      if (simulationCancelled) {
        throw new Error("Simulation cancelled");
      }

      // Wait if simulation is paused
      while (simulationPaused) {
        setSimulationData(prev => ({ 
          ...prev, 
          phase: 'paused'
        }));
        await new Promise(resolve => setTimeout(resolve, 500));
        if (simulationCancelled) break;
      }

      if (!simulationPaused) {
        setSimulationData(prev => ({ 
          ...prev, 
          phase: 'running'
        }));
      }
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setEdges(prev => prev.map(e => {
        if (e.status !== 'active') return e;
        
        // Generate some randomness in metrics for realism
        const baseUtilization = Math.min(95, step * 4 + Math.random() * 10 - 5);
        
        // Apply bandwidth limit if set
        const utilization = Math.min(baseUtilization, bandwidthLimitInjection);
        
        // Calculate latency based on utilization and add injected latency
        const baseLatency = 5 + (utilization / 10) + (Math.random() * 2);
        const latency = baseLatency + latencyInjection;
        
        // Calculate packet loss - increases with utilization and add injected packet loss
        const basePacketLoss = (utilization > 80) 
          ? (0.01 + ((utilization - 80) * 0.01))
          : 0.01;
        const packetLoss = basePacketLoss + (packetLossInjection / 100); // Convert percentage to decimal
        
        // Random traffic bursts on some iterations
        const burstFactor = (step % 5 === 0) ? 1.5 : 1;
        
        return {
          ...e,
          metrics: {
            latency: `${latency.toFixed(1)}ms`,
            throughput: `${(utilization * burstFactor / 10).toFixed(1)} Gbps`,
            packetLoss: `${(packetLoss * 100).toFixed(2)}%`,
            bandwidthUtilization: Math.round(utilization * burstFactor)
          }
        };
      }));
      
      // Update simulation metrics
      setSimulationData(prev => {
        // Calculate new metrics with random fluctuations
        const bandwidth = Math.min(100, Math.min(prev.metrics.bandwidth.current + 5 + (Math.random() * 2 - 1), bandwidthLimitInjection));
        const latency = Math.min(100, (step * 2 + (step % 3 === 0 ? 5 : 0)) + (latencyInjection / 2));
        
        // Packet loss affects received packets
        const lossRate = packetLossInjection / 100;
        const sentPackets = prev.metrics.packets.sent + 200;
        const receivedPackets = sentPackets * (1 - lossRate) * 0.98;
        const errors = sentPackets - receivedPackets;
        
        return {
          ...prev,
          progress: 60 + (step * 2),
          metrics: {
            bandwidth: { ...prev.metrics.bandwidth, current: bandwidth },
            latency: { ...prev.metrics.latency, current: latency },
            packets: {
              sent: sentPackets,
              received: receivedPackets,
              errors: errors
            }
          }
        };
      });
    }
    
    // Phase 4: Completion - run for a few more seconds then fade out
    setSimulationData(prev => ({ ...prev, phase: 'completed', progress: 100 }));
    
    // Simulate traffic for a few more seconds before ending
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Gradual fadeout - reduce utilization
    for (let step = 0; step < 5; step++) {
      if (simulationCancelled) {
        break;
      }

      await new Promise(resolve => setTimeout(resolve, 300));
      
      setEdges(prev => prev.map(e => {
        if (e.status !== 'active') return e;
        
        // Current utilization
        const currentUtil = e.metrics?.bandwidthUtilization || 0;
        // Reduce by 20% each step
        const newUtil = currentUtil * 0.8;
        
        return {
          ...e,
          metrics: {
            ...e.metrics,
            bandwidthUtilization: Math.round(newUtil)
          }
        };
      }));
    }

    // Reset status
    setNodes(prev => prev.map(node => ({ ...node, status: 'inactive' })));
    setEdges(prev => prev.map(e => ({ ...e, status: 'inactive' })));
    setIsRunningScenario(false);
    
    // Reset simulation data but keep scores
    setSimulationData(prev => ({
      ...prev,
      progress: 0,
      phase: 'idle',
      metrics: {
        bandwidth: { current: 0, max: 100 },
        latency: { current: 0, max: 100 },
        packets: { sent: 0, received: 0, errors: 0 }
      }
    }));

    // Reset control variables
    simulationPaused = false;
    simulationCancelled = false;
    latencyInjection = 0;
    packetLossInjection = 0;
    bandwidthLimitInjection = 100;

    return true;
  } catch (error) {
    setIsRunningScenario(false);
    setSimulationData(prev => ({
      ...prev,
      phase: 'error'
    }));

    // Reset control variables
    simulationPaused = false;
    simulationCancelled = false;
    latencyInjection = 0;
    packetLossInjection = 0;
    bandwidthLimitInjection = 100;

    return false;
  }
}