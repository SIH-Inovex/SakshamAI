# Verification Methodology

## 1. Verification layers

1. **Static analysis:** parse syntax, hierarchy, widths, undeclared signals, and unsupported constructs.
2. **Property generation:** create assertions for reset, arithmetic boundaries, control transitions, and protocol assumptions.
3. **Simulation:** execute directed corner cases plus constrained or pseudo-random vectors.
4. **Counterexample triage:** connect failing cycle and signal values to the AST and source line.
5. **Patch validation:** apply a reviewed change in a clean workspace and re-run all relevant checks.
6. **Closure:** record coverage, assertion results, tool versions, and remaining waivers.

## 2. ALU overflow example

For signed subtraction `result = a - b`, overflow occurs when operands have opposite signs and the result sign differs from `a`:

```systemverilog
(a[31] != b[31]) && (result[31] != a[31])
```

The demo intentionally uses the incorrect same-sign condition. A representative counterexample is `a = 32'h80000000`, `b = 32'h00000001`, subtraction, at cycle 48. The expected overflow flag is `1`, but the faulty design produces `0`.

## 3. Assertion requirements

Every generated property should specify:

- clock and reset semantics;
- antecedent and expected consequence;
- source module and line range;
- severity and diagnostic message;
- whether it is an assertion, assumption, or coverage property.

Example:

```systemverilog
property p_sub_overflow_check;
  @(posedge clk) disable iff (!rst_n)
    (alu_ctrl == ALU_SUB && a[31] != b[31]) |->
      (overflow_flag == (result[31] != a[31]));
endproperty
```

The exact property must match the clocking and combinational/sequential semantics of the real design; the prototype's sample is illustrative.

## 4. Coverage policy

Track line, branch, toggle, assertion, and scenario coverage separately. A high percentage does not override a critical failing assertion. Define required thresholds per module and record justified exclusions as waivers.

## 5. Counterexample record

```json
{
  "runId": "example-run",
  "property": "assert_sub_overflow",
  "cycle": 48,
  "timeNs": 480,
  "signals": {"a": "0x80000000", "b": "0x00000001", "overflow": 0},
  "source": {"file": "riscv_alu.v", "line": 42},
  "classification": "Arithmetic Sign Inversion"
}
```

## 6. Patch acceptance

A patch is accepted only if it compiles, passes the failing property, passes the regression suite, does not reduce required coverage, and has a human reviewer. Preserve both the original failure and the passing rerun in the report.

## 7. Presentation-aligned research and validation context

The presentation references AssertLLM, AutoSVA, and ChipNeMo as research directions for LLM-assisted hardware verification and domain-adapted chip-design models. It also presents illustrative target charts for autonomous testbench coverage convergence and RTL bug-localization accuracy. These charts are presentation claims/targets and are not measurements produced by the current React repository.

The presentation describes the intended validation sequence as RTL and specification ingestion, test-plan and SVA synthesis, sandboxed Verilator/Icarus simulation, Surfer waveform triage, auto-patch generation, and passing regression evidence. The current prototype mirrors this sequence visually and uses the RISC-V ALU overflow scenario as its demonstration case.
