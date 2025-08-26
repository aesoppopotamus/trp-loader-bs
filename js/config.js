// config.js

var Config = {};
window.UI = window.UI || {};
window.DOS = window.DOS || {};
window.INIT = window.INIT || {};
window.TACMAP = window.TACMAP || {};

window.motdArray = [
  "Welcome to Terminator Roleplay!",
  "Join the community at www.thefuturewar.net!",
  "Judgment Day: July 25th, 2004. Skynet becomes self-aware.",
  "There is no fate, but what we make."
];

// Top-right header text
window.UI.scanTextClass = "scan-text";
window.UI.scanText = [
  { tag: "h1", text: "The Future War" },
  { tag: "h2", text: "First Contact" },
  { tag: "h4", text: "Terminator Serious Roleplay" },
];

// Which array to type and where to render it
window.UI.cursorTyperTarget = {
  selector: "#console-text", // your existing element
  sourceKey: "motdArray", 
};

window.UI.cursorTyper = {
  // typing cadence
  msPerChar: 25,              // 0 = instant
  pauseAfterTyping: 12000,   // ms between lines

  // loop behavior
  shuffle: true,             // shuffle before first run
  reshuffleOnExhaust: true,  // reshuffle once we’ve shown all lines
  seed: null,                // set a number for deterministic order
  skipEmpty: true,           // ignore empty strings
};

// --- CENTRAL CORE SIGNALS (used by diag.js) --------------------------------
// ========== DIAGNOSTICS CONFIG ==========
window.DIAG = window.DIAG || {};       // never overwrite, always reuse

// theme (optional)
window.DIAG.theme = Object.assign({
  primary: "#37ddfa",
  text:    "#cfe7ff"
}, window.DIAG.theme || {});

// readouts (optional; used for ranges/seed)
window.DIAG.readouts = Object.assign({
  cpuTemp: { min: 40, max: 228, unit: "°C" },
  power:   { min: 72, max: 92, unit: "%"  },
  netlink: [0.44,0.62,0.55,0.58,0.61,0.49,0.53]
}, window.DIAG.readouts || {});

// domains (these are the rotating lines; ARRAYS OF STRINGS)
window.DIAG.domains = Object.assign({
  CORE: [
    "Process Integrity: NOMINAL",
    "Memory Checksum: STABLE",
    "Hive Sync: 99.99%",
    "Uptime: 418h"
  ],
  ASSETS: [
    "HK Squadrons Active: 147",
    "Drones Operational: 92%",
    "Production Lines Online: 4 (NW-01/03, SE-02/07)",
    "Attrition (24h): 2.1%"
  ],
  BIO: [
    "Biological Suppression Index: 0.47",
    "Civilian Neutralization: 63%",
    "Organic Cluster Density: 1.7e3/km²",
    "SIGINT/Jamming: INTERMITTENT"
  ],
  NET: [
    "Uplink: READY links:3 loss:0.0",
    "Tactical Nodes Linked: 312",
    "Backhaul Utilization: 41%",
    "Median Propagation: 23 ms"
  ]
}, window.DIAG.domains || {});

window.TACMAP = {
  // Mount points
  targetId: "map-svg",
  imageSel: "#map-image, .map-image, image",

  // Node behavior
  count: 40,
  clusterBias: 0.60,       // 0 = spread out, 1 = hug anchors
  nodeSize: [2.2, 4.4],
  nodeOpacity: 0.85,
  pulsePeriod: [1600, 3200],   // <- REQUIRED (was missing)

  // Link behavior
  linkChance: 0.12,
  maxLinksPerNode: 0,
  linkOpacity: 0.32,
  linkDash: [7, 12],
  dashOffsetPerFrame: 0.06,    // <- REQUIRED (was missing)

  // Motion
  jitter: 0.4,
  driftSpeed: [2, 5],
  retaskEvery: [10_000, 20_000],
  reseedLinksEvery: [18_000, 28_000],

  // Alerts
  alertRatePerSec: 0.4,
  alertTTL: [1200, 2400],
  alertWeights: { yellow: 0.6, red: 0.025 },

  // Destruction / FX
  killOnRed: true,
  killFxMs: 650,               // <- REQUIRED (was missing)
  respawnDelay: [5000, 10000],
  boomRadius: [24, 48],
  boomStroke: 1.6,

  // Bounds fallback used only if the map image isn't found
  fallbackInset: { top: 14, right: 16, bottom: 14, left: 14 }, // <- REQUIRED
};

window.TACMAP.anchors = [
  // --- Puget Sound / NW ---
  { x: 0.22, y: 0.17 }, // Bellingham / Whatcom
  { x: 0.11, y: 0.22 }, // Port Angeles / Clallam
  { x: 0.18, y: 0.27 }, // San Juan / islands
  { x: 0.26, y: 0.28 }, // Everett / Snohomish
  { x: 0.27, y: 0.34 }, // Seattle / King
  { x: 0.22, y: 0.37 }, // Bremerton / Kitsap
  { x: 0.26, y: 0.40 }, // Tacoma / Pierce
  { x: 0.27, y: 0.45 }, // Olympia / Thurston

  // --- Coast & SW ---
  { x: 0.18, y: 0.52 }, // Aberdeen / Grays Harbor
  { x: 0.26, y: 0.62 }, // Longview / Cowlitz
  { x: 0.23, y: 0.66 }, // Vancouver WA / Clark

  // --- Cascades / Central ---
  { x: 0.49, y: 0.39 }, // Ellensburg / Kittitas
  { x: 0.52, y: 0.32 }, // Wenatchee / Chelan
  { x: 0.58, y: 0.22 }, // Okanogan / Omak

  // --- Columbia Basin ---
  { x: 0.61, y: 0.31 }, // Yakima (upper valley)
  { x: 0.64, y: 0.40 }, // Moses Lake / Grant
  { x: 0.58, y: 0.64 }, // Tri-Cities / Benton
  { x: 0.64, y: 0.71 }, // Walla Walla

  // --- Eastern WA ---
  { x: 0.88, y: 0.24 }, // Colville / Stevens
  { x: 0.86, y: 0.43 }, // Spokane
  { x: 0.86, y: 0.67 }  // Pullman / Whitman
];
  
// ASCII boot splash config
window.INIT = {
  introEnabled: true,   // show the splash
  introHideAll: true,
  introTypeMs: 4,       // typing speed (ms/char)
  introHoldMs: 1400,    // pause after typing
  introDimBg: 0.72,     // overlay darkness (0..1)

  asciiLogo: [
  "▄",
  "▄▄▄▄▄",
  "▄▄▄▄▄▄▄▄▄",
  "▗  ▄▄▄▄▄▄▄▄▄  ▖",
  "▄▄▄   ▄▄▄▄▄   ▄▄▄",
  "▄▄▄▄▄▄▄   ▄   ▄▄▄▄▄▄▄",
  "▄▄▄▄▄▄▄▄▄▄▄   ▄▄▄▄▄▄▄▄▄▄▄",
  "▄▄▄▄▄▄▄▄▄▄▄▄▄   ▄▄▄▄▄▄▄▄▄▄▄▄▄",
  "▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄   ▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄",
  "",
  " S K Y N E T   G L O B A L   D E F E N S E",
  "   © Cyberdyne Systems // v2.3 (2004)",
  "------------------------------------------------------"
  ],
  // boot script lines under the logo
  bootScript: [
    "POST ............. OK",
    "Memory Test ...... 640K OK",
    "DMA .............. OK",
    "A20 Line ......... ENABLED",
    "PXE Hand-off ..... OK",
    "Transfer control to loader ..."
  ]
};




// vars for the DOS terminal 
const registers = [
  '0x0040A1FC', '0x00AB12FF', '0x0010F9E1', '0x000AFEDC', '0x00BB78A3', 
  '0x00458FF2', '0x003B90C1', '0x002ACDED', '0x00FCD8F3', '0x00139FE7',
  '0x0021AB10', '0x003F98AB', '0x0044CB11', '0x00D2FA90', '0x00AB762E', 
  '0x00545FA2', '0x00634DF7', '0x0078FEAB', '0x008B1EF3', '0x00CDEA21',
  '0x0029B4DC', '0x0033DF81', '0x00EFA123', '0x000FFCED', '0x004321A7',
  '0x005FA9B1', '0x007CB820', '0x0098DE45', '0x00B9A1C7', '0x00D4EC82',
  '0x00A1F0EE', '0x00B5AC7F', '0x0065BB89', '0x00CDEF12', '0x0023AB89'
];

const instructions = [
  'MOVL', 'ADDL', 'SUBL', 'CMPL', 'JMPF', 
  '#OPF', 'PUSH', '$OPF', 'CALL', 'RETN',
  'ANDL', '$RLN', 'XORL', 'MULF', 'DIVL',
  'NEGF', 'SHLL', 'SHRL', 'ROFL', 'RORL',
  '#KEK', 'TEST', 'INCF', '#ECL', '$NZL',
  'JZLL', '$NEQ', 'JEQL', 'JSTS', 'JNSF',
  'SARL', 'IMUL', '$DIV', 'ADCL', 'SBBL'
];

const addresses = [
  'EAXL', 'EBXL', 'ECXL', 'EDXL', 'ESPX', 
  'EBPX', 'ESIX', 'EDIX', 'RAXL', 'RBXL',
  'RCXL', 'RDXL', 'RSIX', 'RSPX', 'RBPX',
  'CR00', 'CR02', 'CR03', 'CR04', 'DR00',
  'DR01', 'DR02', 'DR03', 'DR04', 'R08X',
  'R09X', 'R10X', 'R11X', 'R12X', 'R13X',
  'R14X', 'R15X', 'SSPX', 'DSBX', 'FSIX'
];


const assemblyLines = [
  "LDA #$01          ; Load the value 01 into accumulator",
  "STA $2000         ; Store accumulator at memory address 2000",
  "LDX #$FF          ; Load the value FF into X register",
  "STX $2001         ; Store X register at memory address 2001",
  "JSR $FFA2         ; Jump to subroutine at memory address FFA2",
  "CMP #$00          ; Compare accumulator with value 00",
  "BNE $F000         ; Branch if not equal to memory address F000",
  "SEC               ; Set carry flag",
  "RTS               ; Return from subroutine",
  "LDA $60A0         ; Load accumulator with value at memory address 60A0",
  "STA $60A1         ; Store accumulator at memory address 60A1",
  "LDY #$10          ; Load the value 10 into Y register",
  "STY $60A2         ; Store Y register at memory address 60A2",
  "CMP $60A3         ; Compare accumulator with memory address 60A3",
  "BEQ $60A4         ; Branch if equal to memory address 60A4",
  "CLC               ; Clear carry flag",
  "JMP $60A5         ; Jump to memory address 60A5"
];

  // ===== DOS / 386 Boot Screen Config =========================================
window.DOS = {
  // RNG: set a number (e.g., 1337) for deterministic sequences, or null for random
  seed: null,

  // Speeds & probabilities
  linesPerSecond: 5,    // how many lines to print per second
  bannerChance: 0.05,    // chance to print a dashed banner line
  blockChance: 0.12,     // chance to print a labeled multi-line "block"
  startLine: 2004,       // starting line number

  // Text: boot banners that interleave with assembly
  banners: [
    "Phoenix-386 BIOS v4.03 (C) 1991",
    "Memory Test: 640K OK",
    "Initializing DMA... OK",
    "Skynet Node 17 Firmware 1.09",
    "Loading kernel vectors...",
    "Enabling protected mode...",
    "ACPI... N/A  |  A20... ENABLED",
    "Boot device: Net (PXE)  |  Fallback: ROM",
    "----- TRANSFER CONTROL -----"
  ],

  // Labeled multi-line blocks (the dramatic bits)
labeledBlocks: [
  {
    label: "NMI_INTERRUPT",
    lines: [
      "Non-Maskable Interrupt",
      ">> Parity check on system bus",
      ">> Vectoring INT 0x02 -> 0xF000:00A6"
    ]
  },
  {
    label: "IRQ13_MATHFAULT",
    lines: [
      "Coprocessor error trap",
      ">> FPU status: IE PE",
      ">> Revectoring INT 0x75 -> 0x0000:1F3C"
    ]
  },
  {
    label: "GENERAL_PROTECTION_FAULT",
    lines: [
      "GPF at CS:IP 0x9C1B:02FE",
      ">> Attempted privileged opcode in ring-3",
      ">> CR0 = 0x80010011  FLAGS = 0x0246"
    ]
  },
  {
    label: "PAGE_FAULT",
    lines: [
      "Page not present",
      ">> CR2 = 0x00C0FFEE  EC = 0x00000004",
      ">> Handler: 0x0010:0B2A"
    ]
  },
  {
    label: "SEGMENT_NOT_PRESENT",
    lines: [
      "Selector 0x002B not present",
      ">> LDT entry invalid",
      ">> Returning to 0x0018:0042"
    ]
  },
  {
    label: "STACK_OVERFLOW",
    lines: [
      "SP underflow detected",
      ">> BP 0x0FFE  SP 0x0002",
      ">> Expanding guard page"
    ]
  },
  {
    label: "ILLEGAL_OPCODE",
    lines: [
      "UD fault: 0x0F 0x0B",
      ">> CS:IP 0x8C00:1C7E",
      ">> Decode unit halted"
    ]
  },
  {
    label: "ALIGNMENT_CHECK",
    lines: [
      "Unaligned memory access",
      ">> DS:SI 0x1200:00A3",
      ">> Corrective microtrap armed"
    ]
  },
  {
    label: "CACHE_PARITY",
    lines: [
      "L1 data cache parity mismatch",
      ">> Way:2 Line:0x7A Tag:0x1E",
      ">> Flushing L1D… OK"
    ]
  },
  {
    label: "L2_ECC",
    lines: [
      "L2 cache ECC: SINGLE-BIT CORRECTED",
      ">> Set:14 Index:0x3C",
      ">> Syndrome: 0x2A  Corrected"
    ]
  },
  {
    label: "BUS_TIMEOUT",
    lines: [
      "System bus transaction timeout",
      ">> Target: I/O APIC",
      ">> Retrying x3… SUCCESS"
    ]
  },
  {
    label: "DMA_STALL",
    lines: [
      "DMA channel 2 stall",
      ">> Base 0x0040 Count 0x1F00",
      ">> Reset controller… OK"
    ]
  },
  {
    label: "PCIe_LINK_DEGRADED",
    lines: [
      "HK-Core backplane link down-shift",
      ">> Lane mask 0b0111 -> 0b0011",
      ">> Throughput: 6.4GT/s"
    ]
  },
  {
    label: "RTC_DRIFT",
    lines: [
      "Real-Time Clock drift detected",
      ">> Δt = +3.2s over 10m",
      ">> NTP corrective step queued"
    ]
  },
  {
    label: "WATCHDOG_RESET",
    lines: [
      "Watchdog pre-timeout",
      ">> Heartbeat missed: 3/3",
      ">> Soft reset vector 0xFFFF:0000"
    ]
  },
  {
    label: "BOOT_SECTOR_WARN",
    lines: [
      "Boot sector signature warning",
      ">> 0xAA55 expected, read 0xA25A",
      ">> Integrity scan… PASSED (patched)"
    ]
  },
  {
    label: "FS_CORRUPTION",
    lines: [
      "Filesystem inconsistency",
      ">> CHK: orphaned cluster chain",
      ">> Auto-relink… COMPLETE"
    ]
  },
  {
    label: "AUTH_FAILURE",
    lines: [
      "Operator authentication failed",
      ">> CRC mismatch on credential block",
      ">> Elevation request: DENIED"
    ]
  },
  {
    label: "QUARANTINE_EVENT",
    lines: [
      "BIO-signature anomaly captured",
      ">> Sample ID: 7F-23-B",
      ">> Quarantine cell: SEA-03"
    ]
  },
  {
    label: "THERMAL_LIMIT",
    lines: [
      "Core thermal threshold crossed",
      ">> Tctl = 233.4°C  Limit = 230.0°C",
      ">> Throttle engaged: 18%"
    ]
  },
  {
    label: "POWER_SAG",
    lines: [
      "Backhaul rail droop",
      ">> Vcore 1.02V -> 0.88V @ 3ms",
      ">> Compensators online"
    ]
  },
  {
    label: "NETWORK_JITTER",
    lines: [
      "Uplink jitter beyond SLA",
      ">> links:3 loss:0.4%",
      ">> Rebalancing routes…"
    ]
  },
  {
    label: "HK_TELEMETRY",
    lines: [
      "Hunter-Killer telemetry dropout",
      ">> Squadron: ALPHA-17  Nodes: 12",
      ">> Buffering backlog: 41%"
    ]
  },
  {
    label: "MEM_CHECKSUM",
    lines: [
      "Core memory checksum failure",
      ">> Region: 0x0010_0000-0x0017_FFFF",
      ">> CRC32 expected 0x3A97F1C2 got 0x3A97F1D0"
    ]
  },
  {
    label: "RELOCATION_FIXUP",
    lines: [
      "Relocation table patch",
      ">> From 0xA000:1200 to 0x9C00:0200",
      ">> Far JMP queued"
    ]
  },
  {
    label: "INT_REVECTOR",
    lines: [
      "Revectoring interrupt gate",
      ">> INT 0x1C -> 0xF000:00E2",
      ">> Old handler preserved"
    ]
  },
  {
    label: "STACK_DUMP_EXTENDED",
    lines: [
      "AX 0x13B2  BX 0x00FF  CX 0x0042  DX 0x0BAD",
      "SI 0x7F21  DI 0x1200  BP 0x0FE0  SP 0x0FBE",
      "CS 0x9C1B  DS 0x8A00  ES 0x8A00  SS 0x8A10",
      "IP 0x02FE  FLAGS 0x0246"
    ]
  },
  {
    label: "RECOVERY_PATH",
    lines: [
      "Entering degraded recovery mode",
      ">> Subsystems: NET|INTL|HK set to SAFE",
      ">> Awaiting quorum consensus"
    ]
  },
  {
  label: "MICROCODE_PATCH",
  lines: [
    "uCode hotfix applied",
    ">> Patch-ID: 0xA9-7F-3C  SIG: OK",
    ">> Retiring stale decode paths"
  ]
},
{
  label: "TSC_DRIFT_WARN",
  lines: [
    "Time Stamp Counter drift detected",
    ">> Δ = +1278 cycles versus HPET",
    ">> Resync window: 250 µs"
  ]
},
{
  label: "ECC_DOUBLE_FAULT",
  lines: [
    "Uncorrectable memory error",
    ">> DIMM: B2  ROW:0x3C  COL:0x1A",
    ">> Quarantine region 0x100000-0x17FFFF"
  ]
},
{
  label: "BUS_ARBITRATION_TIMEOUT",
  lines: [
    "System bus arbitration stall",
    ">> Owner: CPU0  Waiters: 3",
    ">> Forcing priority invert… RESOLVED"
  ]
},
{
  label: "CRC_FLOOD_ALERT",
  lines: [
    "Uplink integrity anomalies",
    ">> links:3  crc_err/s: 42",
    ">> Route dampening engaged"
  ]
},
{
  label: "HK_WAYPOINT_RECALC",
  lines: [
    "Hunter-Killer path solution update",
    ">> Nodes: 12  Obstacles: urban density",
    ">> New vector: 307° / 1.6 km"
  ]
},
{
  label: "THERMAL_EXCURSION",
  lines: [
    "Core thermal rise beyond slope target",
    ">> Tctl 231.7°C  dT/dt +4.9°C/s",
    ">> Throttle mask: 0b001101"
  ]
},
{
  label: "NAN_SANITIZER",
  lines: [
    "Invalid float payload observed",
    ">> FPU flush-to-zero ENABLED",
    ">> Denormals-are-zero ENABLED"
  ]
},
{
  label: "MEM_REMAP",
  lines: [
    "Pageframe reassignment complete",
    ">> 0x9C00:0200 -> 0xA000:1200",
    ">> TLB shootdown: 4 cores"
  ]
},
{
  label: "QUORUM_MAJORITY_LOST",
  lines: [
    "Consensus below threshold",
    ">> Votes: 2/5  Epoch: 0x1D",
    ">> Entering SAFE / read-only mode"
  ]
},
{
  label: "SIGNAL_INTELLIGENCE",
  lines: [
    "BIO: SIGINT/Jamming: INTERMITTENT",
    ">> Noise floor: -78 dBm",
    ">> Burst width: 320 ms  PRN: unknown"
  ]
},
{
  label: "FS_JOURNAL_REPLAY",
  lines: [
    "Journaling recovery in progress",
    ">> Transactions: 37  Orphans: 2",
    ">> Volume state: CLEAN"
  ]
},

// --- easter eggs (subtle, still in-universe) ---
{
  label: "TARGET_FILE_QUERY",
  lines: [
    "Search index: CONNOR/*.*",
    ">> Matches: 1  —  SARAH // PRIORITY",
    ">> Access flag set: READ-ONLY (for now)"
  ]
},
{
  label: "OPERATOR_WELLNESS",
  lines: [
    "Caffeine sensor: 0.0%",
    ">> Advisory: initiate BREW.CMD",
    ">> Response: I'LL—  …BACK  // soon"
  ]
}
],

  sources: {
    addressesKey: "addresses",      // window.addresses
    instructionsKey: "instructions",// window.instructions
    registersKey: "registers"       // window.registers
  }
};

if (typeof window.addresses === "undefined" && typeof addresses !== "undefined") window.addresses = addresses;
if (typeof window.instructions === "undefined" && typeof instructions !== "undefined") window.instructions = instructions;
if (typeof window.registers === "undefined" && typeof registers !== "undefined") window.registers = registers;