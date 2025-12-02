# Cloud Network Designer

An innovative, multi-abstraction network topology designer that unifies three visualization perspectives into a single, cohesive interface. Built with React and TypeScript for designing enterprise telecommunications networks.

## Key Features

### Tri-Modal Visualization Architecture
- **Global View**: Interactive world map showing network locations with curved connection arcs, color-coded markers, and geographic context
- **Topology View**: Drag-and-drop canvas for creating network topologies with real-time visual feedback
- **Circuit View**: Device-centric hierarchical panels displaying physical ports, racks, and circuit-level details

### Advanced Design Capabilities
- **Interactive Network Design**: Drag-and-drop interface with 6 distinct node interaction states (hover, selected, dragging, connected, disabled)
- **Real-Time Visual Feedback**: Animated connection lines with gradient overlays showing bandwidth utilization and data flow
- **AI-Powered Recommendations**: Smart suggestions for network optimization based on business outcomes
- **Network Simulation**: Performance testing with fault injection, latency analysis, and bandwidth monitoring
- **Business Outcomes Integration**: Define target latency, bandwidth, availability, and security requirements
- **Template System**: Save and reuse common network patterns (cloud-to-cloud, high availability, internet-to-cloud)

### Professional Export & Documentation
- **PDF Export**: High-resolution export with detailed metadata or diagram-only options
- **Cross-Connect Workflow**: Complete LOA generation and cross-connect setup process
- **Read-Only Mode**: Clean presentation mode for sharing designs with stakeholders

### Design Excellence
- **Consistent Visual Language**: Unified 8px grid system, color palette, and typography across all three views
- **Smooth Animations**: 100-300ms transitions providing tactile, responsive feedback
- **Context-Sensitive Panels**: Configuration panels that adapt based on selected elements
- **Geographic Integration**: World map visualization with network semantics (bandwidth, latency, fiber routes)

## Live Demo

Visit the live application: [Cloud Designer](https://socraticstatic.github.io/Cloud_Designer/)

*Note: The application is automatically deployed to GitHub Pages when changes are pushed to the main branch.*

## Getting Started

### Prerequisites

- Node.js 18 or higher
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/socraticstatic/Cloud_Designer.git
   cd Cloud_Designer
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:5173](http://localhost:5173) in your browser

## Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Deployment

This project is configured for automatic deployment to GitHub Pages using GitHub Actions. Simply push to the main branch and the workflow will automatically build and deploy your changes.

## Technology Stack

- **React 18** - Modern React with hooks and concurrent features
- **TypeScript** - Type-safe development with full type coverage
- **Tailwind CSS** - Utility-first styling for consistent design system
- **Vite** - Lightning-fast build tool and development server
- **Lucide React** - Comprehensive icon library with 1000+ icons
- **Zustand** - Lightweight state management for network topology
- **jsPDF** - Client-side PDF generation for exports
- **html2canvas** - Canvas-based screenshot capture for documentation
- **Supabase** - Backend database for location data and cloud regions

## Project Structure

```
src/
├── components/
│   ├── NetworkDesigner.tsx          # Main application component
│   ├── network-designer/            # Core network design system
│   │   ├── Canvas.tsx              # Interactive topology canvas
│   │   ├── Node.tsx                # Network node with 6 interaction states
│   │   ├── Edge.tsx                # Animated connection lines
│   │   ├── Toolbar.tsx             # Bottom-centered floating toolbar
│   │   ├── global-view/            # Geographic/world map view
│   │   │   ├── GlobalView.tsx      # Main map visualization
│   │   │   ├── LocationMarkers.tsx # Color-coded location markers
│   │   │   └── BusinessMetricsPanel.tsx  # Business metrics overlay
│   │   ├── circuit-view/           # Infrastructure/circuit view
│   │   │   ├── CircuitView.tsx     # Device-centric panels
│   │   │   ├── PhysicalRackView.tsx # Rack and port visualization
│   │   │   └── CircuitDetails.tsx  # Circuit-level details
│   │   ├── simulation/             # Network simulation engine
│   │   │   ├── NetworkSimulation.tsx # Performance testing
│   │   │   └── runSimulation.ts    # Simulation logic
│   │   ├── panels/                 # Context-sensitive panels
│   │   │   ├── EnhancedBusinessOutcomes.tsx # Business requirements
│   │   │   ├── ReactiveAIPanel.tsx # AI recommendations
│   │   │   └── CrossConnectsPanel.tsx # Cross-connect management
│   │   ├── components/
│   │   │   └── ExportButton.tsx    # PDF export functionality
│   │   ├── templates/              # Network topology templates
│   │   └── store/                  # Zustand state management
│   ├── crossconnect/               # Cross-connect workflow
│   │   ├── CrossConnectWorkflow.tsx # LOA generation
│   │   └── StatusTracker.tsx       # Progress tracking
│   ├── common/                     # Shared UI components
│   └── ui/                         # Base UI components
├── types/                          # TypeScript type definitions
├── utils/                          # Utility functions
├── services/                       # External services (location data)
├── hooks/                          # Custom React hooks
└── main.tsx                        # Application entry point
```

## Design Philosophy

This application applies consumer-grade design principles to enterprise network tools:

- **Visual Feedback First**: Every interaction provides immediate visual confirmation (100ms response time)
- **Progressive Disclosure**: Complex network details revealed gradually based on context
- **Unified Design Language**: Consistent 8px grid, color palette, and animations across all views
- **Multi-Persona Interface**: Single tool serving executives (Global View), IT managers (Topology View), and network engineers (Circuit View)

## Use Cases

- **Enterprise Network Planning**: Design multi-cloud, hybrid cloud, and on-premises network topologies
- **Telecommunications**: Plan fiber routes, cross-connects, and interconnection strategies
- **Business Case Development**: Simulate performance and costs before deployment
- **Stakeholder Communication**: Export professional documentation for presentations
- **Network Optimization**: Use AI recommendations to improve designs based on business outcomes

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and commit: `git commit -m 'Add feature'`
4. Push to your branch: `git push origin feature-name`
5. Create a Pull Request

## Patent & Intellectual Property

This interface design represents patentable innovations in network topology visualization:
- Tri-modal visualization architecture with unified design language
- Bottom-centered floating toolbar with upward expansion
- Curved connection arcs in geographic view with data flow visualization
- Six-state node interaction model with real-time feedback
- Gradient-based utilization visualization on connection lines

See `INVENTION_BRIEF_SUMMARY.md` and `INTERFACE_DESIGN_PATENT.md` for detailed patent documentation.

## License

This project is licensed under the MIT License - see the LICENSE file for details.