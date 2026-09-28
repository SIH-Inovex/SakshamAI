# Technical Design — Inovex!

## 1. Current technology stack

- React 19 for the interactive interface
- Vite for development and production builds
- Tailwind CSS for styling
- Lucide React for interface icons
- Canvas Confetti for the successful verification state
- Planned integrations: Ollama/on-premise LLM, Verilator, Cocotb, and VCD waveform tools

## 2. Current frontend structure

```text
src/
├── App.jsx       # Main workflow, sample RTL, UI state, and panels
├── App.css       # Component stylesheet placeholder
├── index.css     # Tailwind import and global styling
└── main.jsx      # React application entry point
```

`App.jsx` currently manages the sample module, workflow steps, selected tab, simulation logs, waveform cycle, patch status, coverage, and theme.

## 3. Main interface areas

- Header: project identity, security status, tool status, reset, theme, and repository link.
- Workflow stepper: RTL ingestion, AI test plan, SVA generation, simulation/triage, and verified patch.
- RTL panel: Verilog source, AST hierarchy, and synthesized SVA tabs.
- Waveform panel: signals, failing cycle, and scrubber.
- Terminal panel: simulation and diagnosis logs.
- Diagnosis panel: bug explanation, confidence, patch diff, and re-simulation action.

## 4. Proposed service flow

```text
Frontend -> Verification API -> Analysis Worker -> SVA/AI Worker
                                      |                    |
                                      v                    v
                                AST and metadata      Assertions
                                      |                    |
                                      +--------> Verilator Worker
                                                       |
                                                       v
                                           Logs, coverage, VCD, report
```

## 5. Proposed API operations

- `POST /api/runs` — create a verification run.
- `POST /api/runs/{id}/analyze` — parse RTL and return AST metadata.
- `POST /api/runs/{id}/assertions` — generate and validate SVA.
- `POST /api/runs/{id}/simulate` — start an isolated simulation.
- `GET /api/runs/{id}` — retrieve status, logs, and artifacts.
- `POST /api/runs/{id}/patches/{patchId}/verify` — run regression on an approved patch.

## 6. Data objects

A run should contain a unique ID, input hash, RTL metadata, AST result, generated assertions, simulation status, failures, coverage, patch diff, and final report. Every result should also store tool and model versions.

## 7. Current limitations

The current application uses sample data and simulated UI actions. Export buttons display alerts, and Verilator/Ollama are not yet connected to the browser. Production implementation should add a backend, asynchronous jobs, authentication, artifact storage, and real tool execution.

## 8. Technology approach shown in the presentation

The presentation proposes the following target stack in addition to the currently implemented React/Vite prototype:

- Frontend: React.js, Next.js 14, Tailwind CSS, and Monaco Editor for a Verilog IDE.
- Simulation and EDA: Verilator, Icarus Verilog, Surfer waveforms, and Verible linting.
- Backend: Python 3.11, FastAPI microservices, WebSockets for live logs, and PyVerilog for AST extraction.
- AI and infrastructure: Ollama as an offline local runtime, Hugging Face open-code models, Docker sandboxing, and RISC-V open cores.

The presentation's target process is: RTL upload -> AI planning -> testbench generation -> simulation and analysis -> remediation -> bug report. In the current repository, these stages are represented by the React workflow and sample data; the listed backend and EDA services are planned integrations rather than files present in the uploaded frontend source.
