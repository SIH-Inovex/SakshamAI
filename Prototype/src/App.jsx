import React, { useState, useEffect, useRef } from 'react';
import { 
  Cpu, Play, CheckCircle2, AlertTriangle, FileCode, Shield, Terminal, 
  ArrowRight, Download, Zap, Eye, Check, GitCommit, 
  ExternalLink, Sparkles, AlertCircle, Database, Sun, Moon, RotateCcw
} from 'lucide-react';
import confetti from 'canvas-confetti';

const SAMPLE_MODULES = {
  'riscv_alu.v': {
    name: 'riscv_alu.v',
    category: 'RISC-V 32I Core Execution Unit',
    lines: 74,
    bugLine: 42,
    code: `// ==========================================================
// Module: riscv_alu.v (RISC-V 32-bit Arithmetic Logic Unit)
// Verified by: Inovex Verification Studio Autonomous Platform
// ==========================================================
module riscv_alu (
    input  wire [31:0] a,
    input  wire [31:0] b,
    input  wire [3:0]  alu_ctrl,
    output reg  [31:0] result,
    output wire        zero_flag,
    output reg         overflow_flag
);

    localparam ALU_ADD  = 4'b0000;
    localparam ALU_SUB  = 4'b0001;
    localparam ALU_SLL  = 4'b0010;
    localparam ALU_SLT  = 4'b0011;
    localparam ALU_XOR  = 4'b0100;
    localparam ALU_SRL  = 4'b0101;
    localparam ALU_OR   = 4'b0110;
    localparam ALU_AND  = 4'b0111;

    always @(*) begin
        case (alu_ctrl)
            ALU_ADD: result = a + b;
            ALU_SUB: result = a - b;
            ALU_SLL: result = a << b[4:0];
            ALU_SLT: result = ($signed(a) < $signed(b)) ? 32'd1 : 32'd0;
            ALU_XOR: result = a ^ b;
            ALU_SRL: result = a >> b[4:0];
            ALU_OR:  result = a | b;
            ALU_AND: result = a & b;
            default: result = 32'd0;
        endcase
    end

    assign zero_flag = (result == 32'd0);

    // ----------------------------------------------------------
    // BUG INJECTED AT LINE 42:
    // Subtraction overflow arithmetic condition inverted.
    // Real condition: (a[31] != b[31]) && (result[31] != a[31])
    // ----------------------------------------------------------
    always @(*) begin
        if (alu_ctrl == ALU_SUB)
            overflow_flag = (a[31] == b[31]) && (result[31] != a[31]); // <-- HARDWARE BUG
        else if (alu_ctrl == ALU_ADD)
            overflow_flag = (a[31] == b[31]) && (result[31] != a[31]);
        else
            overflow_flag = 1'b0;
    end

endmodule`,
    patchedCode: `// ==========================================================
// Module: riscv_alu.v (VERIFIED & REPAIRED BY INOVEX STUDIO)
// ==========================================================
module riscv_alu (
    input  wire [31:0] a,
    input  wire [31:0] b,
    input  wire [3:0]  alu_ctrl,
    output reg  [31:0] result,
    output wire        zero_flag,
    output reg         overflow_flag
);

    localparam ALU_ADD  = 4'b0000;
    localparam ALU_SUB  = 4'b0001;
    localparam ALU_SLL  = 4'b0010;
    localparam ALU_SLT  = 4'b0011;
    localparam ALU_XOR  = 4'b0100;
    localparam ALU_SRL  = 4'b0101;
    localparam ALU_OR   = 4'b0110;
    localparam ALU_AND  = 4'b0111;

    always @(*) begin
        case (alu_ctrl)
            ALU_ADD: result = a + b;
            ALU_SUB: result = a - b;
            ALU_SLL: result = a << b[4:0];
            ALU_SLT: result = ($signed(a) < $signed(b)) ? 32'd1 : 32'd0;
            ALU_XOR: result = a ^ b;
            ALU_SRL: result = a >> b[4:0];
            ALU_OR:  result = a | b;
            ALU_AND: result = a & b;
            default: result = 32'd0;
        endcase
    end

    assign zero_flag = (result == 32'd0);

    // ----------------------------------------------------------
    // REPAIRED BY INOVEX AUTO-REMEDIATION ENGINE:
    // Signed subtraction overflow correctly detects opposite signs
    // ----------------------------------------------------------
    always @(*) begin
        if (alu_ctrl == ALU_SUB)
            overflow_flag = (a[31] != b[31]) && (result[31] != a[31]); // [VERIFIED SAFE]
        else if (alu_ctrl == ALU_ADD)
            overflow_flag = (a[31] == b[31]) && (result[31] != a[31]);
        else
            overflow_flag = 1'b0;
    end

endmodule`,
    sva: `// Synthesized SystemVerilog Assertions (IEEE 1800-2017)
property p_sub_overflow_check;
    @(posedge clk) disable iff (!rst_n)
    (alu_ctrl == 4'b0001 && a[31] != b[31]) |-> 
        (overflow_flag == (result[31] != a[31]));
endproperty
assert_sub_overflow: assert property(p_sub_overflow_check)
    else $error("[SVA FAIL] Subtraction overflow mismatch at cycle %0t", $time);`,
    bugDescription: 'Subtractions with opposite operand signs fail to trigger the overflow flag when result wraps around (e.g., MIN_INT - 1).',
    bugCategory: 'Arithmetic Sign Inversion',
    confidence: '96.8%'
  }
};

export default function App() {
  const [theme, setTheme] = useState('dark'); // 'dark' | 'light'
  const isDark = theme === 'dark';
  const toggleTheme = () => setTheme(isDark ? 'light' : 'dark');

  const [selectedModule, setSelectedModule] = useState('riscv_alu.v');
  const [activeTab, setActiveTab] = useState('verilog'); // verilog, ast, sva
  const [step, setStep] = useState(1); // 1: Ingestion, 2: Testplan, 3: SVA, 4: Simulation/Triage, 5: Patched
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationLogs, setSimulationLogs] = useState([]);
  const [timelineIndex, setTimelineIndex] = useState(48); // Failing cycle
  const [isPatched, setIsPatched] = useState(false);
  const [branchCoverage, setBranchCoverage] = useState(42.5);
  const terminalEndRef = useRef(null);

  const modData = SAMPLE_MODULES[selectedModule];

  const resetLogs = () => [
    `[SYSTEM] Initialized Inovex Verification Studio v2.4 (Core-V Compatible)`,
    `[AST] Parsed hierarchy for riscv_alu.v (6 signals, 1 FSM detected)`,
    `[READY] Awaiting Autonomous Testplan & SVA Synthesis...`
  ];

  useEffect(() => {
    setSimulationLogs(resetLogs());
  }, [selectedModule]);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [simulationLogs]);

  // Step 1 -> 3: Synthesize SVA
  const handleGenerateSVA = () => {
    setStep(3);
    setActiveTab('sva');
    setSimulationLogs(prev => [
      ...prev,
      `[TESTPLAN] Synthesizing IEEE 1800 SystemVerilog Assertions via Code-LLM...`,
      `[SVA ENGINE] Injected 14 formal boundary properties for ALU operations`,
      `[COVERAGE GOAL] Targeted branch coverage: 95.0% | Corner cases: Underflow, Sign Wrap`,
      `[STATUS] Ready for Verilator C++ sandboxed simulation run.`
    ]);
  };

  // Step 3 -> 4: Run Verilator Simulation
  const handleRunSimulation = () => {
    setIsSimulating(true);
    setSimulationLogs(prev => [
      ...prev,
      `[VERILATOR] Compiling C++ cycle-accurate simulation binary...`,
      `[SANDBOX] Executing 10,000 pseudo-random directed stimuli with seed=0x4F19...`,
      `[SIM] Cycle 10: Reset complete. ALU_ADD sanity verified.`,
      `[SIM] Cycle 25: Shift operations verified.`,
      `[SIM] Cycle 48: Operand a=0x80000000 (MIN_INT), b=0x00000001 (+1), op=SUB...`,
      `[ASSERTION FAIL] assert_sub_overflow triggered at Cycle 48 (Time: 480ns)!`,
      `[TRIAGE] SVA violation: Expected overflow_flag=1'b1, Actual=1'b0`,
      `[VCD DUMP] Waveform execution trace captured to sim_dump.vcd`
    ]);

    setTimeout(() => {
      setIsSimulating(false);
      setStep(4);
      setTimelineIndex(48);
      setBranchCoverage(71.2);
    }, 900);
  };

  // Step 4 -> 5: Apply Patch & Re-simulate
  const handleApplyPatch = () => {
    setIsPatched(true);
    setStep(5);
    setActiveTab('verilog');
    setBranchCoverage(98.6);
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
    setSimulationLogs(prev => [
      ...prev,
      `[REMEDIATION] Synthesizing AST-level patch for Line 42...`,
      `[PATCH] - overflow_flag = (a[31] == b[31]) && (result[31] != a[31]);`,
      `[PATCH] + overflow_flag = (a[31] != b[31]) && (result[31] != a[31]);`,
      `[SANDBOX REGRESSION] Re-simulating patched RTL across 10,000 vectors...`,
      `[REGRESSION PASS] Cycle 48: Subtraction overflow verified -> 100% PASS`,
      `[REGRESSION PASS] Branch coverage: 98.6% | SVA assertion coverage: 96.4%`,
      `[STATUS] Silicon design verified safe for tapeout. Zero errors remaining.`
    ]);
  };

  // Reset Studio
  const handleReset = () => {
    setIsPatched(false);
    setStep(1);
    setActiveTab('verilog');
    setBranchCoverage(42.5);
    setTimelineIndex(48);
    setSimulationLogs(resetLogs());
  };

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-200 ${
      isDark ? 'bg-[#090d16] text-slate-100' : 'bg-slate-100 text-slate-800'
    }`}>
      {/* ================= TOP NAVBAR ================= */}
      <header className={`border-b px-6 py-3 flex items-center justify-between sticky top-0 z-50 backdrop-blur transition-colors ${
        isDark ? 'border-slate-800 bg-[#0c1220]/90 text-white' : 'border-slate-200 bg-white/95 text-slate-900 shadow-xs'
      }`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 p-[2px] shadow-lg shadow-sky-500/20">
            <div className={`w-full h-full rounded-[10px] flex items-center justify-center ${
              isDark ? 'bg-[#0c1220]' : 'bg-white'
            }`}>
              <Cpu className="w-5 h-5 text-sky-500" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-lg tracking-tight bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-600 bg-clip-text text-transparent">
                SakshamAI
              </h1>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                Live Prototype
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-500 border border-sky-500/20">
                SIH26202
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                Team Inovex!
              </span>
            </div>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Autonomous AI Silicon Verification &amp; Bug Localization Engine
            </p>
          </div>
        </div>

        {/* Status Indicators & Controls */}
        <div className="flex items-center gap-3 text-xs">
          <div className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs ${
            isDark ? 'bg-slate-800/60 border-slate-700/60 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
          }`}>
            <Shield className="w-3.5 h-3.5 text-emerald-500" />
            <span>Air-Gapped: <strong>Zero Cloud IP Leakage</strong></span>
          </div>

          <div className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs ${
            isDark ? 'bg-slate-800/60 border-slate-700/60 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
          }`}>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Verilator + Ollama: <strong>Online</strong></span>
          </div>

          {/* Reset Button (Icon Only) */}
          <button 
            onClick={handleReset}
            title="Reset Studio Simulation"
            className={`p-2 rounded-lg border transition ${
              isDark 
                ? 'bg-slate-800/80 hover:bg-slate-700 border-slate-700 text-slate-300 hover:text-white' 
                : 'bg-white hover:bg-slate-100 border-slate-300 text-slate-700 hover:text-black shadow-2xs'
            }`}
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Light / Dark Mode Toggle (Icon Only) */}
          <button 
            onClick={toggleTheme}
            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            className={`p-2 rounded-lg border transition ${
              isDark 
                ? 'bg-slate-800/80 hover:bg-slate-700 border-slate-700 text-amber-400 hover:text-amber-300' 
                : 'bg-white hover:bg-slate-100 border-slate-300 text-indigo-600 hover:text-indigo-800 shadow-2xs'
            }`}
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* GitHub Link */}
          <a 
            href="https://github.com/MkSachdev/Inovex" 
            target="_blank" 
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-medium transition shadow-md shadow-sky-600/20"
          >
            <GitCommit className="w-3.5 h-3.5" />
            <span>GitHub Repo</span>
            <ExternalLink className="w-3 h-3 ml-0.5 opacity-70" />
          </a>
        </div>
      </header>

      {/* ================= WORKFLOW STEPPER ================= */}
      <div className={`border-b px-6 py-2.5 transition-colors ${
        isDark ? 'bg-[#0e1627] border-slate-800/80' : 'bg-white border-slate-200'
      }`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between overflow-x-auto text-xs py-1">
          {[
            { step: 1, label: 'RTL Ingestion', sub: 'AST & FSM Extracted' },
            { step: 2, label: 'AI Testplan', sub: 'Corner Cases Mapped' },
            { step: 3, label: 'SVA Generation', sub: 'Formal Properties Built' },
            { step: 4, label: 'Simulation & Triage', sub: 'Line & Waveform Fault' },
            { step: 5, label: 'Verified Patch', sub: '100% PASS Regression' },
          ].map((item, idx) => {
            const isCompleted = step > item.step;
            const isCurrent = step === item.step;
            return (
              <React.Fragment key={item.step}>
                <div className={`flex items-center gap-2.5 px-3 py-1.5 rounded-lg transition-all ${
                  isCurrent 
                    ? isDark 
                      ? 'bg-sky-500/10 border border-sky-500/40 text-sky-400' 
                      : 'bg-sky-50 border border-sky-300 text-sky-700 shadow-xs'
                    : isCompleted 
                      ? isDark ? 'text-emerald-400' : 'text-emerald-600'
                      : isDark ? 'text-slate-500' : 'text-slate-400'
                }`}>
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    isCurrent ? 'bg-sky-500 text-white shadow-md shadow-sky-500/40' :
                    isCompleted ? 'bg-emerald-500 text-white' :
                    isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {isCompleted ? <Check className="w-3 h-3" /> : item.step}
                  </div>
                  <div>
                    <div className="font-semibold">{item.label}</div>
                    <div className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{item.sub}</div>
                  </div>
                </div>
                {idx < 4 && <ArrowRight className={`w-3.5 h-3.5 shrink-0 ${isDark ? 'text-slate-600' : 'text-slate-300'}`} />}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* ================= MAIN 3-COLUMN WORKSPACE ================= */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* ---------- LEFT COLUMN (4 COLS): RTL CODE & AST ---------- */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <div className={`border rounded-xl overflow-hidden shadow-xl flex flex-col h-full transition-colors ${
            isDark ? 'bg-[#0e1627] border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            
            {/* Header with Module Selector */}
            <div className={`p-3 border-b flex items-center justify-between ${
              isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-sky-500" />
                <span className={`font-semibold text-xs ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>RTL Hardware Module</span>
              </div>
              <select 
                value={selectedModule} 
                onChange={(e) => setSelectedModule(e.target.value)}
                className={`text-xs rounded-lg px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-sky-500 border ${
                  isDark ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-white border-slate-300 text-slate-800'
                }`}
              >
                <option value="riscv_alu.v">riscv_alu.v (ALU Core)</option>
              </select>
            </div>

            {/* Sub-tabs: Verilog vs SVA vs AST */}
            <div className={`flex border-b text-xs px-2 pt-1 gap-1 ${
              isDark ? 'border-slate-800 bg-slate-950/40' : 'border-slate-200 bg-slate-100/70'
            }`}>
              <button 
                onClick={() => setActiveTab('verilog')}
                className={`px-3 py-1.5 rounded-t-lg font-medium transition ${
                  activeTab === 'verilog' 
                    ? isDark ? 'bg-[#0e1627] text-sky-400 border-t border-x border-slate-800' : 'bg-white text-sky-700 border-t border-x border-slate-200 shadow-2xs'
                    : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Verilog Source
              </button>
              <button 
                onClick={() => setActiveTab('ast')}
                className={`px-3 py-1.5 rounded-t-lg font-medium transition ${
                  activeTab === 'ast' 
                    ? isDark ? 'bg-[#0e1627] text-sky-400 border-t border-x border-slate-800' : 'bg-white text-sky-700 border-t border-x border-slate-200 shadow-2xs'
                    : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                AST Hierarchy
              </button>
              <button 
                onClick={() => setActiveTab('sva')}
                className={`px-3 py-1.5 rounded-t-lg font-medium transition ${
                  activeTab === 'sva' 
                    ? isDark ? 'bg-[#0e1627] text-sky-400 border-t border-x border-slate-800' : 'bg-white text-sky-700 border-t border-x border-slate-200 shadow-2xs'
                    : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Synthesized SVA
              </button>
            </div>

            {/* Code Body */}
            <div className={`p-4 overflow-y-auto max-h-[500px] text-xs font-mono leading-relaxed ${
              isDark ? 'bg-[#070b14] text-slate-300' : 'bg-white text-slate-800 border-t border-slate-100'
            }`}>
              {activeTab === 'verilog' && (
                <div className="space-y-0.5">
                  {(isPatched ? modData.patchedCode : modData.code).split('\n').map((line, idx) => {
                    const lineNum = idx + 1;
                    const isBugLine = !isPatched && lineNum === 42;
                    const isPatchedLine = isPatched && lineNum === 42;
                    return (
                      <div 
                        key={idx} 
                        className={`flex gap-3 px-1.5 py-0.5 rounded transition ${
                          isBugLine ? isDark ? 'bg-rose-500/20 border-l-2 border-rose-500 text-rose-200 font-semibold' : 'bg-rose-50 border-l-2 border-rose-500 text-rose-800 font-semibold' :
                          isPatchedLine ? isDark ? 'bg-emerald-500/20 border-l-2 border-emerald-500 text-emerald-200 font-semibold' : 'bg-emerald-50 border-l-2 border-emerald-500 text-emerald-800 font-semibold' :
                          isDark ? 'hover:bg-slate-800/40' : 'hover:bg-slate-100'
                        }`}
                      >
                        <span className={`select-none w-5 text-right ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>{lineNum}</span>
                        <span className="whitespace-pre overflow-x-auto">{line}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {activeTab === 'sva' && (
                <div className="space-y-3">
                  <div className={`p-2.5 rounded-lg border text-[11px] ${
                    isDark ? 'bg-sky-950/40 border-sky-800/40 text-sky-300' : 'bg-sky-50 border-sky-200 text-sky-800'
                  }`}>
                    <strong>Generated via Formal Verification Agent:</strong>
                    <p className={`mt-1 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Properties automatically extracted from ISA boundary condition specifications.</p>
                  </div>
                  <pre className={`font-mono text-[11px] whitespace-pre-wrap leading-relaxed ${
                    isDark ? 'text-emerald-400' : 'text-emerald-700'
                  }`}>
                    {modData.sva}
                  </pre>
                </div>
              )}

              {activeTab === 'ast' && (
                <div className="space-y-2 text-xs font-mono">
                  <div className={isDark ? 'text-sky-400' : 'text-sky-600 font-bold'}>└── Module: riscv_alu</div>
                  <div className={`pl-4 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>├── Ports [6]: a(32b), b(32b), alu_ctrl(4b), result(32b), zero, overflow</div>
                  <div className={`pl-4 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>├── AlwaysBlock (Combinational Sensitivity @*)</div>
                  <div className={`pl-8 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>└── CaseStatement (alu_ctrl) [8 branches]</div>
                  <div className={`pl-12 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>├── Branch ALU_ADD (a + b)</div>
                  <div className="pl-12 text-rose-500 font-semibold">├── Branch ALU_SUB (Line 42: Overflow logic node)</div>
                  <div className={`pl-12 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>└── Branch ALU_SLT (Signed comparator)</div>
                </div>
              )}
            </div>

            {/* Coverage footer */}
            <div className={`mt-auto p-3 border-t flex items-center justify-between text-xs ${
              isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center gap-2">
                <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Branch Coverage:</span>
                <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{branchCoverage}%</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${isPatched ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  {isPatched ? '✓ Verified Safe' : '● Vulnerable'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ---------- MIDDLE COLUMN (5 COLS): PIPELINE & WAVEFORMS ---------- */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          
          {/* Action Trigger Card */}
          <div className={`border rounded-xl p-4 shadow-xl transition-colors ${
            isDark ? 'bg-[#0e1627] border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <h2 className={`text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-2 ${
              isDark ? 'text-slate-400' : 'text-slate-500'
            }`}>
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              Autonomous Verification Pipeline
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={handleGenerateSVA}
                className="py-2.5 px-3 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs flex items-center justify-center gap-2 transition shadow-md shadow-sky-600/20"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>1. Generate SVA</span>
              </button>
              <button 
                onClick={handleRunSimulation}
                disabled={isSimulating}
                className="py-2.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold text-xs flex items-center justify-center gap-2 transition shadow-md shadow-emerald-600/20"
              >
                <Play className="w-3.5 h-3.5" />
                <span>{isSimulating ? 'Simulating...' : '2. Run Verilator'}</span>
              </button>
            </div>
          </div>

          {/* Surfer Waveform Viewer */}
          <div className={`border rounded-xl overflow-hidden shadow-xl flex-1 flex flex-col transition-colors ${
            isDark ? 'bg-[#0e1627] border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <div className={`p-3 border-b flex items-center justify-between text-xs ${
              isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-sky-500" />
                <span className={`font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>Surfer Digital Waveforms (VCD)</span>
              </div>
              <span className={`font-mono text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Time: 480ns</span>
            </div>

            {/* Waveform Drawing Canvas */}
            <div className={`p-4 flex-1 flex flex-col justify-between font-mono text-xs ${
              isDark ? 'bg-[#070b14]' : 'bg-slate-50/70'
            }`}>
              <div className="space-y-4">
                
                {/* Time Scale Marks */}
                <div className={`flex items-center justify-between text-[10px] border-b pb-1 ${
                  isDark ? 'text-slate-500 border-slate-800/80' : 'text-slate-400 border-slate-200'
                }`}>
                  <span>Signal</span>
                  <div className="flex gap-10">
                    <span>0ns</span>
                    <span>200ns</span>
                    <span className="text-rose-500 font-bold">480ns [FAULT]</span>
                    <span>800ns</span>
                    <span>1000ns</span>
                  </div>
                </div>

                {/* Clock Signal */}
                <div className="flex items-center justify-between">
                  <span className={`w-16 text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>clk</span>
                  <div className="flex-1 px-4">
                    <svg className="w-full h-5 text-sky-500" viewBox="0 0 100 12" preserveAspectRatio="none">
                      <path d="M0,10 L10,10 L10,2 L20,2 L20,10 L30,10 L30,2 L40,2 L40,10 L50,10 L50,2 L60,2 L60,10 L70,10 L70,2 L80,2 L80,10 L90,10 L90,2 L100,2" 
                        fill="none" stroke="currentColor" strokeWidth="2" />
                    </svg>
                  </div>
                </div>

                {/* Reset Signal */}
                <div className="flex items-center justify-between">
                  <span className={`w-16 text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>rst_n</span>
                  <div className="flex-1 px-4">
                    <svg className="w-full h-5 text-emerald-500" viewBox="0 0 100 12" preserveAspectRatio="none">
                      <path d="M0,10 L20,10 L20,2 L100,2" fill="none" stroke="currentColor" strokeWidth="2" />
                    </svg>
                  </div>
                </div>

                {/* Bus A */}
                <div className="flex items-center justify-between">
                  <span className={`w-16 text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>a[31:0]</span>
                  <div className="flex-1 px-4 flex items-center justify-between">
                    <div className={`h-4 w-32 border rounded px-1.5 text-[10px] flex items-center ${
                      isDark ? 'border-slate-700 bg-slate-800/80 text-sky-300' : 'border-sky-200 bg-sky-50 text-sky-800'
                    }`}>
                      0x80000000
                    </div>
                    <span className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>[MIN_INT]</span>
                  </div>
                </div>

                {/* Bus B */}
                <div className="flex items-center justify-between">
                  <span className={`w-16 text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>b[31:0]</span>
                  <div className="flex-1 px-4 flex items-center justify-between">
                    <div className={`h-4 w-32 border rounded px-1.5 text-[10px] flex items-center ${
                      isDark ? 'border-slate-700 bg-slate-800/80 text-sky-300' : 'border-sky-200 bg-sky-50 text-sky-800'
                    }`}>
                      0x00000001
                    </div>
                    <span className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>[+1]</span>
                  </div>
                </div>

                {/* Overflow Bug Signal */}
                <div className="flex items-center justify-between">
                  <span className="w-16 text-rose-500 font-bold text-[11px]">overflow</span>
                  <div className="flex-1 px-4">
                    {step >= 4 && !isPatched ? (
                      <div className="h-6 flex items-center justify-center gap-2">
                        <div className={`flex-1 h-[2px] ${isDark ? 'bg-slate-700' : 'bg-slate-300'}`}></div>
                        <span className="px-2.5 py-0.5 rounded text-[10px] font-bold tracking-wide border border-rose-500/50 bg-rose-500/15 text-rose-500 animate-pulse whitespace-nowrap shadow-2xs">
                          0 [ASSERTION FAIL]
                        </span>
                        <div className={`flex-1 h-[2px] ${isDark ? 'bg-slate-700' : 'bg-slate-300'}`}></div>
                      </div>
                    ) : isPatched ? (
                      <div className="h-6 flex items-center justify-center gap-2">
                        <div className={`flex-1 h-[2px] ${isDark ? 'bg-slate-700' : 'bg-slate-300'}`}></div>
                        <span className="px-2.5 py-0.5 rounded text-[10px] font-bold tracking-wide border border-emerald-500/50 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 whitespace-nowrap shadow-2xs">
                          1 [PASS VERIFIED]
                        </span>
                        <div className={`flex-1 h-[2px] ${isDark ? 'bg-slate-700' : 'bg-slate-300'}`}></div>
                      </div>
                    ) : (
                      <div className={`w-full h-[2px] ${isDark ? 'bg-slate-700' : 'bg-slate-300'}`}></div>
                    )}
                  </div>
                </div>

              </div>

              {/* Scrubber slider (High-Visibility Track) */}
              <div className={`mt-4 pt-3 border-t flex items-center gap-3 ${
                isDark ? 'border-slate-800/80' : 'border-slate-200'
              }`}>
                <span className={`text-[11px] font-medium shrink-0 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Scrub Cycle:</span>
                <div className="flex-1 flex items-center px-1">
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    value={timelineIndex} 
                    onChange={(e) => setTimelineIndex(Number(e.target.value))}
                    style={{ accentColor: '#0284c7' }}
                    className={`w-full h-2 rounded-lg cursor-pointer transition ${
                      isDark 
                        ? 'bg-slate-700 hover:bg-slate-600' 
                        : 'bg-slate-300 hover:bg-slate-400'
                    }`}
                  />
                </div>
                <span className="text-[11px] font-mono text-sky-500 font-bold w-16 text-right">Cycle {timelineIndex}</span>
              </div>
            </div>
          </div>

          {/* Verilator Terminal Logs */}
          <div className={`border rounded-xl overflow-hidden shadow-xl h-44 flex flex-col ${
            isDark ? 'bg-[#050811] border-slate-800' : 'bg-slate-900 border-slate-800 text-slate-100'
          }`}>
            <div className="p-2 px-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
              <div className="flex items-center gap-2">
                <Terminal className="w-3.5 h-3.5 text-sky-400" />
                <span>Verilator &amp; Python Log Stream</span>
              </div>
              <span className="text-[10px] text-emerald-400">Air-Gapped Sandbox</span>
            </div>
            <div className="p-3 overflow-y-auto font-mono text-[11px] space-y-1 text-slate-300 flex-1">
              {simulationLogs.map((log, i) => (
                <div key={i} className={
                  log.includes('FAIL') || log.includes('BUG') ? 'text-rose-400 font-semibold' :
                  log.includes('PASS') || log.includes('Verified') ? 'text-emerald-400 font-semibold' :
                  log.includes('SYSTEM') || log.includes('STATUS') ? 'text-sky-300' : 'text-slate-400'
                }>
                  {log}
                </div>
              ))}
              <div ref={terminalEndRef} />
            </div>
          </div>

        </div>

        {/* ---------- RIGHT COLUMN (3 COLS): AI ROOT CAUSE & REPORT ---------- */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          
          {/* AI Root-Cause Diagnostic Card */}
          <div className={`border rounded-xl overflow-hidden shadow-xl transition-colors ${
            isDark ? 'bg-[#0e1627] border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <div className={`p-3 border-b flex items-center justify-between ${
              isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <h3 className={`font-semibold text-xs ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>AI Root-Cause Bug Diagnosis</h3>
              </div>
              <span className="text-[10px] text-sky-500 font-mono">Latency: 4.2s</span>
            </div>

            <div className="p-4 space-y-3 text-xs">
              {step >= 4 ? (
                <>
                  <div className={`p-2.5 rounded-lg border ${
                    isDark ? 'bg-rose-500/10 border-rose-500/30 text-rose-300' : 'bg-rose-50 border-rose-200 text-rose-800'
                  }`}>
                    <div className="flex items-center gap-1.5 font-bold text-rose-500 mb-1">
                      <AlertCircle className="w-4 h-4" />
                      <span>Pinpointed Bug at Line 42</span>
                    </div>
                    <p className={`text-[11px] leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                      {modData.bugDescription}
                    </p>
                  </div>

                  <div className="space-y-1 text-[11px]">
                    <div className="flex justify-between">
                      <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Fault Classification:</span>
                      <span className="font-semibold text-amber-500">{modData.bugCategory}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Top-1 Prediction Confidence:</span>
                      <span className="font-semibold text-emerald-500">{modData.confidence}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Failing Formal Assertion:</span>
                      <span className="font-mono text-sky-500 font-medium">assert_sub_overflow</span>
                    </div>
                  </div>

                  {/* Machine Patch Box */}
                  <div className="pt-2">
                    <div className={`text-[10px] uppercase font-bold mb-1.5 tracking-wider ${
                      isDark ? 'text-slate-400' : 'text-slate-500'
                    }`}>
                      Machine-Verified RTL Diff Patch
                    </div>
                    <div className={`p-2 rounded border font-mono text-[10px] space-y-1 leading-snug ${
                      isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                    }`}>
                      <div className="text-rose-500">- overflow_flag = (a[31] == b[31]) &amp;&amp; (result[31] != a[31]);</div>
                      <div className="text-emerald-600 font-bold">+ overflow_flag = (a[31] != b[31]) &amp;&amp; (result[31] != a[31]);</div>
                    </div>
                  </div>

                  {/* 1-Click Patch Button */}
                  {!isPatched ? (
                    <button 
                      onClick={handleApplyPatch}
                      className="w-full mt-2 py-2.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center justify-center gap-2 transition shadow-md shadow-emerald-600/20"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Apply Patch &amp; Re-Simulate</span>
                    </button>
                  ) : (
                    <div className="mt-2 py-2 px-3 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-600 dark:text-emerald-300 text-center font-semibold text-xs flex items-center justify-center gap-2">
                      <Check className="w-4 h-4" />
                      <span>100% PASS Regression Evidence Verified</span>
                    </div>
                  )}
                </>
              ) : (
                <div className={`text-center py-8 space-y-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                  <Cpu className="w-8 h-8 mx-auto opacity-30" />
                  <p className="text-[11px]">Run simulation to trigger autonomous waveform failure triage.</p>
                </div>
              )}
            </div>
          </div>

          {/* Audit & Tapeout Certification */}
          <div className={`border rounded-xl p-4 shadow-xl space-y-3 transition-colors ${
            isDark ? 'bg-[#0e1627] border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <div>
              <h4 className={`font-semibold text-xs ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>Audit &amp; Tapeout Certification</h4>
              <p className={`text-[11px] mt-0.5 leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Generate an IEEE-compliant verification report with SVA proofs and waveform dumps.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button 
                onClick={() => alert("Verification Report (PDF) exported!")}
                className={`py-2 px-2.5 rounded-lg border flex items-center justify-center gap-1.5 transition ${
                  isDark ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200' : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800'
                }`}
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Report (PDF)</span>
              </button>
              <button 
                onClick={() => alert("VCD Dump downloaded!")}
                className={`py-2 px-2.5 rounded-lg border flex items-center justify-center gap-1.5 transition ${
                  isDark ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200' : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800'
                }`}
              >
                <Database className="w-3.5 h-3.5" />
                <span>VCD Dump</span>
              </button>
            </div>
          </div>

          {/* National Mission Strip */}
          <div className={`p-3 rounded-xl border text-xs transition-colors ${
            isDark 
              ? 'bg-gradient-to-r from-sky-950/40 to-slate-900 border-sky-900/30' 
              : 'bg-gradient-to-r from-sky-50 to-indigo-50 border-sky-200'
          }`}>
            <span className={`font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>India Semiconductor Mission (ISM)</span>
            <p className={`text-[10px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>100% In-Country Sovereign EDA Toolchain</p>
          </div>

        </div>

      </main>
    </div>
  );
}
