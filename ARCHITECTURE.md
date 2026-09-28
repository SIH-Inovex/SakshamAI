# System Architecture — Inovex!

## 1. Architectural style

Inovex should evolve from the current single-page React/Vite demonstration into a local-first orchestration system. The browser is the control plane; verification jobs execute in isolated workers; artifacts are stored locally or in an approved private store.

```text
React/Vite Studio
      |
      v
Verification API / Job Orchestrator
  |       |          |           |
  v       v          v           v
Parser  Testplan   Simulator   Report Builder
(AST)   + SVA      (Verilator) (PDF/JSON)
          |
          v
    On-prem Code Model
          |
          v
 Patch Validator + Regression
```

## 2. Current prototype mapping

- `src/App.jsx`: workflow state, sample RTL, simulated logs, diagnosis, patch diff, and coverage display.
- `src/index.css`: global Tailwind import and base styling.
- `vite.config.js`: React/Tailwind Vite development configuration on port 3000.
- `public/`: favicon and icon assets.
- `README.md`: project positioning and local setup.

## 3. Proposed pipeline

### Ingestion
Validate file type and size, calculate an input hash, assign a run ID, and store the original RTL read-only.

### Analysis
Parse RTL into an AST/IR. Extract modules, ports, combinational/sequential blocks, state transitions, arithmetic operations, and source locations.

### Planning and SVA generation
Use deterministic templates for known checks and an on-prem model for candidate properties. Every generated assertion must include its source rationale and be reviewed for syntax before execution.

### Execution
Create an isolated workspace containing RTL, testbench, assertions, and tool configuration. Run Verilator/Cocotb with timeouts and resource limits. Save logs, coverage, and VCD metadata.

### Triage and remediation
Map a failed property to a cycle, signal transition, AST node, and source range. Generate a patch as a proposal, validate syntax, and run the complete regression before marking it verified.

## 4. Artifact model

Each run should produce:

```text
runs/<run-id>/
  input/rtl/
  analysis/ast.json
  plan/testplan.json
  assertions/generated.sva
  simulation/log.txt
  simulation/coverage.json
  simulation/waveform.vcd
  patch/changes.diff
  report/verification-report.json
```

## 5. Important design decisions

- Use asynchronous jobs for simulations; the UI polls or subscribes to status.
- Treat generated code as untrusted until syntax and regression checks pass.
- Keep the UI independent from the simulator so a job can be retried without losing evidence.
- Use versioned schemas for AST, job status, assertion, and report objects.
- Preserve the original failing run so the final report can compare before and after states.

## 6. Presentation-aligned target layers

The presentation organizes the proposed platform into users, a UI layer, backend and simulation engines, autonomous AI intelligence, and a RISC-V/open-silicon verification hub. The UI layer includes an RTL editor/AST view, linting, waveform forensics, coverage view, patch diff, Docker app, and PDF diagnostics. The backend layer includes Verilator, Icarus, Verible AST extraction, and VCD/FST triage. The AI layer includes spec-to-testbench generation, formal SVA mining, waveform root-cause triage, and bug-line pinpointing.

These are the target architecture elements from the presentation. The uploaded repository currently implements the UI demonstration in `src/App.jsx`; the other layers should be described as planned or proposed until their services are added to the repository.
