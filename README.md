# Cloud Designer

A powerful, interactive cloud network topology designer built with React and TypeScript. Design enterprise networks with drag-and-drop functionality, simulate performance, and generate cross-connect documentation.

## Features

- **Interactive Network Design**: Drag-and-drop interface for creating network topologies
- **Multiple View Modes**: Switch between Panoramic, Topology, and Infrastructure views
- **Cross-Connect Workflow**: Complete LOA and cross-connect setup process
- **Network Simulation**: Real-time performance testing with fault injection
- **AI Recommendations**: Smart suggestions for network optimization
- **Template System**: Save and reuse common network patterns
- **Read-Only Mode**: Clean presentation mode for sharing designs

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

## Technologies Used

- **React 18** - Modern React with hooks
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Vite** - Fast build tool and dev server
- **Lucide React** - Beautiful icon library
- **Zustand** - Lightweight state management

## Project Structure

```
src/
├── components/
│   ├── NetworkDesigner.tsx     # Main network designer component
│   ├── crossconnect/          # Cross-connect workflow
│   ├── network-designer/      # Core network design components
│   │   ├── Canvas.tsx         # Main drawing canvas
│   │   ├── Node.tsx           # Network node component
│   │   ├── Edge.tsx           # Network connection component
│   │   ├── global-view/       # Panoramic view components
│   │   ├── circuit-view/      # Infrastructure view components
│   │   └── simulation/        # Network simulation
│   └── common/                # Shared components
├── types/                     # TypeScript type definitions
└── main.tsx                   # Application entry point
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and commit: `git commit -m 'Add feature'`
4. Push to your branch: `git push origin feature-name`
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.