# Inovex!

## AI-Powered Platform to Find and Explain Chip Design Bugs for Indian Silicon

Smart India Hackathon 2026 | Problem Statement: **SIH26202**  
Theme: **Smart Automation** | Category: **Software**  
Team ID: **172703** | Team: **Inovex!**

## Overview

Inovex is a proposed indigenous AI-assisted chip-verification platform for Verilog/SystemVerilog designs. Its intended workflow is to plan tests, generate assertions and testbenches, run sandboxed simulations, explain failures, suggest fixes, and provide regression evidence while keeping design IP inside an approved environment.

## Current repository

The uploaded repository is a React/Vite/Tailwind frontend prototype. The current UI demonstrates the proposed flow with a sample `riscv_alu.v` module:

1. RTL ingestion
2. AI test-plan display
3. SVA generation display
4. Simulation and triage log display
5. Patch display and verification state

The sample scenario displays an illustrative subtraction-overflow failure at cycle 48 and a proposed correction at line 42. The logs, waveform view, diagnosis, coverage values, and patch transition are currently demo state implemented in `src/App.jsx`; they are not connected to a backend simulator in this repository.

## Proposed target stack

The presentation proposes the following future integrations:

- **Frontend:** React.js/Next.js 14, Tailwind CSS, Monaco Editor
- **Simulation/EDA:** Verilator, Icarus Verilog, Surfer, Verible
- **Backend:** Python 3.11, FastAPI, WebSockets, PyVerilog
- **AI and infrastructure:** Ollama, Hugging Face open-code models, Docker, and RISC-V open cores

These are proposed platform technologies. The current repository directly contains React, Vite, Tailwind CSS, Lucide React, and Canvas Confetti. It does not currently contain the proposed FastAPI services, simulator workers, Ollama runtime, PyVerilog parser, Docker deployment, or real PDF/VCD export.

## Run the current prototype

### Prerequisites

- Node.js 18 or later
- npm

### Installation

```bash
npm install
npm run dev
```

Open the local Vite URL shown in the terminal. To create a production build:

```bash
npm run build
npm run preview
```

## Repository structure

```text
.
├── index.html
├── package.json
├── vite.config.js
├── public/
└── src/
    ├── App.jsx
    ├── App.css
    ├── index.css
    └── main.jsx
```

## Documentation

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — proposed system layers and workflow
- [`docs/TECHNICAL_DESIGN.md`](docs/TECHNICAL_DESIGN.md) — current frontend and target integrations
- [`docs/VERIFICATION_AND_TESTING.md`](docs/VERIFICATION_AND_TESTING.md) — SVA, simulation, triage, and validation methodology
- [`docs/PROJECT_REPORT.md`](docs/PROJECT_REPORT.md) — project identity, objectives, impact, feasibility, and scope

## Links

- Demo link shown in the project materials: https://inovex-self.vercel.app/

## Scope and limitations

Inovex is currently a frontend demonstration of the proposed verification experience. A production version would require real RTL parsing, assertion validation, isolated Verilator/Icarus execution, waveform artifacts, local model inference, API authentication, persistent run storage, and automated regression tests. The presentation's impact figures, coverage charts, and localization metrics should be treated as proposed or illustrative claims unless independently reproduced.
