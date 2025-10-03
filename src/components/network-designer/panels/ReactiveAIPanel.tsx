import { useState, useEffect } from 'react';
import { Sparkles, Zap, Shield, Network, TrendingUp, AlertCircle, CheckCircle2, Loader, ArrowRight, Target } from 'lucide-react';
import { useOutcomes } from '../context/OutcomesContext';
import { NetworkNode, NetworkEdge } from '../../types';

interface ReactiveAIPanelProps {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
  onApplyRecommendation: (nodes: NetworkNode[], edges: NetworkEdge[]) => void;
}

interface Recommendation {
  id: string;
  title: string;
  description: string;
  reason: string;
  type: 'topology' | 'security' | 'performance' | 'redundancy';
  priority: 'critical' | 'high' | 'medium' | 'low';
  icon: any;
  color: string;
}

export function ReactiveAIPanel({ nodes, edges, onApplyRecommendation }: ReactiveAIPanelProps) {
  const { outcomes, hasOutcomes } = useOutcomes();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    if (hasOutcomes) {
      analyzeAndRecommend();
    }
  }, [hasOutcomes, outcomes]);

  const analyzeAndRecommend = () => {
    setIsAnalyzing(true);
    setShowResults(false);

    setTimeout(() => {
      const recs: Recommendation[] = [];

      if (outcomes.latency < 30) {
        recs.push({
          id: 'low-latency',
          title: 'Direct Cloud Connection',
          description: 'Use dedicated connections with optimized routing for ultra-low latency',
          reason: `Target latency of ${outcomes.latency}ms requires direct peering`,
          type: 'topology',
          priority: 'critical',
          icon: Zap,
          color: 'yellow'
        });
      }

      if (outcomes.bandwidth > 5000) {
        recs.push({
          id: 'high-bandwidth',
          title: 'High-Capacity Links',
          description: 'Deploy 10Gbps+ connections with traffic engineering',
          reason: `${outcomes.bandwidth}Mbps requirement needs enterprise-grade capacity`,
          type: 'performance',
          priority: 'critical',
          icon: TrendingUp,
          color: 'green'
        });
      }

      if (outcomes.availability >= 99.9) {
        recs.push({
          id: 'high-availability',
          title: 'Redundant Architecture',
          description: 'Implement active-active failover with health monitoring',
          reason: `${outcomes.availability}% uptime requires redundancy`,
          type: 'redundancy',
          priority: 'high',
          icon: Shield,
          color: 'blue'
        });
      }

      if (outcomes.redundancy) {
        recs.push({
          id: 'backup-paths',
          title: 'Secondary Network Paths',
          description: 'Add geographically diverse backup connections',
          reason: 'Redundancy requirement specified',
          type: 'redundancy',
          priority: 'high',
          icon: Network,
          color: 'blue'
        });
      }

      if (outcomes.security === 'enhanced' || outcomes.security === 'enterprise') {
        recs.push({
          id: 'security-enhanced',
          title: outcomes.security === 'enterprise' ? 'Enterprise Security Stack' : 'Enhanced Security Controls',
          description: outcomes.security === 'enterprise'
            ? 'Deploy next-gen firewalls, IDS/IPS, and zero-trust architecture'
            : 'Add firewalls and DDoS protection at network edge',
          reason: `${outcomes.security.charAt(0).toUpperCase() + outcomes.security.slice(1)} security level selected`,
          type: 'security',
          priority: outcomes.security === 'enterprise' ? 'critical' : 'high',
          icon: Shield,
          color: 'red'
        });
      }

      if (outcomes.multiRegion) {
        recs.push({
          id: 'multi-region',
          title: 'Multi-Region Deployment',
          description: 'Set up presence in multiple geographic regions with cross-region connectivity',
          reason: 'Multi-region requirement specified',
          type: 'topology',
          priority: 'high',
          icon: Network,
          color: 'purple'
        });
      }

      if (outcomes.costPriority === 'low') {
        recs.push({
          id: 'cost-optimization',
          title: 'Cost-Optimized Design',
          description: 'Use shared connections and right-sized capacity to minimize costs',
          reason: 'Cost minimization priority',
          type: 'topology',
          priority: 'medium',
          icon: TrendingUp,
          color: 'green'
        });
      }

      setRecommendations(recs);
      setIsAnalyzing(false);
      setShowResults(true);
    }, 2000);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'border-red-500 bg-red-50';
      case 'high': return 'border-orange-500 bg-orange-50';
      case 'medium': return 'border-yellow-500 bg-yellow-50';
      case 'low': return 'border-blue-500 bg-blue-50';
      default: return 'border-gray-500 bg-gray-50';
    }
  };

  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-500 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-white';
      case 'low': return 'bg-blue-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  if (!hasOutcomes) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-center">
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
          <Target className="h-12 w-12 text-gray-400" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Define Business Outcomes First</h3>
        <p className="text-gray-600 max-w-md">
          Switch to the "Business Outcomes" tab to set your requirements.
          AI will then generate personalized recommendations based on your goals.
        </p>
        <div className="mt-6 flex items-center space-x-2 text-sm text-gray-500">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold">1</div>
          <ArrowRight className="h-4 w-4" />
          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-400 font-semibold">2</div>
          <span className="text-gray-400">Define outcomes → Get AI recommendations</span>
        </div>
      </div>
    );
  }

  if (isAnalyzing) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <div className="relative">
          <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-6 animate-pulse">
            <Sparkles className="h-12 w-12 text-white" />
          </div>
          <Loader className="absolute top-0 left-0 w-24 h-24 text-blue-600 animate-spin" style={{ strokeWidth: 1 }} />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Analyzing Your Requirements</h3>
        <p className="text-gray-600">AI is generating personalized recommendations...</p>
      </div>
    );
  }

  if (showResults && recommendations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-center">
        <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Network Optimized</h3>
        <p className="text-gray-600 max-w-md">
          Your current network design already meets your business outcomes. No additional changes recommended.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 rounded-xl p-6 border-2 border-blue-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl mr-4 shadow-lg">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">AI-Generated Recommendations</h2>
              <p className="text-gray-600">Based on your business outcomes</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600">{recommendations.length}</div>
            <div className="text-sm text-gray-600">Suggestions</div>
          </div>
        </div>

        <div className="bg-white/60 backdrop-blur rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-gray-700">
              <span className="font-semibold">Outcome-Driven Design:</span> These recommendations are specifically tailored to achieve
              your {outcomes.latency}ms latency, {outcomes.bandwidth}Mbps bandwidth, and {outcomes.availability}% availability targets.
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4">
        {recommendations.map((rec) => (
          <div
            key={rec.id}
            className={`border-2 rounded-xl p-5 transition-all hover:shadow-lg ${getPriorityColor(rec.priority)}`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-start space-x-3">
                <div className={`p-2 rounded-lg ${rec.color === 'yellow' ? 'bg-yellow-500' : rec.color === 'green' ? 'bg-green-500' : rec.color === 'red' ? 'bg-red-500' : rec.color === 'purple' ? 'bg-purple-500' : 'bg-blue-500'}`}>
                  <rec.icon className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">{rec.title}</h3>
                  <p className="text-gray-700 mt-1">{rec.description}</p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase ${getPriorityBadgeColor(rec.priority)}`}>
                {rec.priority}
              </span>
            </div>

            <div className="flex items-start space-x-2 mt-3 pt-3 border-t border-gray-300">
              <Target className="h-4 w-4 text-gray-600 mt-0.5" />
              <p className="text-sm text-gray-600">
                <span className="font-medium">Reason:</span> {rec.reason}
              </p>
            </div>

            <button
              onClick={() => {
                console.log('Apply recommendation:', rec.id);
              }}
              className="mt-4 w-full px-4 py-2 bg-white border-2 border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all flex items-center justify-center font-medium text-gray-700 hover:text-blue-700"
            >
              Apply Recommendation
              <ArrowRight className="h-4 w-4 ml-2" />
            </button>
          </div>
        ))}
      </div>

      <button
        onClick={analyzeAndRecommend}
        className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 flex items-center justify-center font-semibold shadow-lg"
      >
        <Sparkles className="h-5 w-5 mr-2" />
        Re-analyze with Current Network
      </button>
    </div>
  );
}
