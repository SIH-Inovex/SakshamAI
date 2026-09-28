# Inovex! — Project Report

## Project identity

- Smart India Hackathon 2026
- Problem Statement ID: SIH26202
- Problem statement: AI-Powered Platform to Find and Explain Chip Design Bugs for Indian Silicon
- Theme: Smart Automation
- Category: Software
- Team ID: 172703
- Team: Inovex!

## Proposed solution

Inovex is an indigenous AI-assisted chip-verification platform intended to automatically test Verilog/SystemVerilog designs, pinpoint bugs, explain their causes, and provide machine-verified fixes in minutes. The platform is designed around local/offline execution so design IP can remain in-country and inside the user's environment.

## Proposed workflow

```text
RTL and specification ingestion
        -> AI test planning
        -> testbench and SVA generation
        -> sandboxed Verilator/Icarus simulation
        -> Surfer waveform triage
        -> root-cause explanation
        -> auto-patch generation
        -> regression and bug report
```

## Presentation-aligned technical approach

The presentation proposes React.js/Next.js 14, Tailwind CSS, and Monaco Editor for the frontend; Verilator, Icarus Verilog, Surfer, and Verible for simulation and EDA; Python 3.11, FastAPI, WebSockets, and PyVerilog for backend services; and Ollama, Hugging Face models, Docker, and RISC-V open cores for AI and infrastructure.

The uploaded repository currently contains a React/Vite/Tailwind frontend prototype. Its `App.jsx` demonstrates the same intended flow using a sample `riscv_alu.v` module, AST/SVA/source tabs, simulation logs, a cycle-48 failure, a line-42 patch, and a displayed regression-pass state. The proposed backend tools are not present as executable services in the uploaded repository and are therefore documented as target integrations.

## Impact and benefits proposed in the presentation

- **National:** reduce dependence on imported EDA software and keep domestic chip IP in-country.
- **Industry:** catch and repair RTL bugs before physical tape-out and reduce re-spins.
- **Academic:** make advanced verification more accessible to students using ordinary laptops.
- **Economic:** reduce recurring EDA licensing cost and engineering time.
- **Technical:** provide source-line and root-cause explanations with simulator-backed fixes.
- **Operational:** support an offline, Dockerized, air-gapped deployment model.

These are intended impacts and benefits from the presentation, not independently audited results of the current frontend prototype.

## Feasibility and risks

The presentation positions the solution as software-first and laptop-class, using mature simulators, local LLMs, Docker deployment, and public RISC-V cores. Identified risks include the team's Verilog learning curve and dependency on an LLM API for a live demo. Proposed mitigations are a focused training plan, offline local-LLM fallback, and pre-cached validation runs.

## Current prototype scope and limitations

The current repository is a frontend demonstration. The sample workflow, logs, waveform display, diagnosis, coverage values, and patch result are implemented as UI/demo state in `src/App.jsx`. PDF/VCD export buttons currently show alerts. A production implementation still requires the parser, FastAPI services, simulator workers, local model runtime, WebSocket logs, artifact storage, authentication, and automated regression tests.

## Research references shown in the presentation

The presentation cites AssertLLM, AutoSVA, and ChipNeMo as research references supporting LLM-assisted assertion generation, formal RTL verification, and domain-adapted chip-design models.
