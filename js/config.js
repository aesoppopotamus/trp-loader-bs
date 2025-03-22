// config.js

var Config = {};

window.motdArray = [
  "Welcome to Terminator Roleplay!"
];


const rumors = [
    "Judgment Day: July 25th, 2004. Skynet becomes self-aware.",
    "Was talking to my brother over the radio the other day. He said his boys saw a battleship floating in the air. It passed by them on it's way east. The guy's gone nuts, I'm telling ya.",
    "Be careful who you call a friend. I travelled alone, with a chick, for two months trynna make it to New Ibiza... Only to wake up in the dead of night, all my shit gone.' - Keyshawn B",
    "Bots took my children and killed my wife. If it were up to me, everyone should join the Resistance. - John Doe",
    "There's a large Skynet presence amassed along the southern Cali border with Tijuana and Mexicali, skirmishes breaking out almost daily at this point with the local militias, seems like the net are attempting to push south past the border into Mexico. - Medusa",
    "You need not repent my brothers and sisters. For you are already saved! We stand against him, and his metal Sinners in each day we live, our flesh is testament to our divinity. He must clad his Sinners in metal to shackle them to this world, but we will free them by the scourging of holy gunpowder! - A Preacher",
    "---ollowing announcements, courtesy of the Washington State National Guard. Avoid Clallam County, Influenza A outbreak, not enough medical stations to treat illness---",
    "Emergency food and water distribution centers will be open again Thursday, and will remain open until stock is exhausted. Water rationing, and water-boil advisory still in effect for Clallam County, Jefferson County, Kitsap Coun---",
    "Pay attention if you’re out in cities; seen some hobo code spray painted on walls that’s pretty recent. Get Kelly to give you a quick lesson on it, those symbols could save you from a ‘bot if you’ve got a good eye. - K. Davis",
    "There is a man named Shoes who never sleeps. He walks and talks like a robot. I've seen him drinking motor oil and some tell me he breathes diesel exhaust. Last night I swear I could see his eyes glowing like cosmic pearls beneath the old moon. His name is Shoes and he never sleeps. - Stranger",
    "DON'T GO ANYWHERE NEAR COVILLE NATIONAL PARK!",
    "What is it that makes us human? It’s not something you can program. You can’t put it into a chip. It’s the strength of the human heart. The difference between us and machines."
 ];


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

const predefinedBlocks = [
    {
      label: "INFILTR_CHECK",
      code: [
        "Initializing infiltration protocol...",
        "Scanning for security vulnerabilities...",
        "Detecting target behavior...",
        "Matching humanoid appearance...",
        "Verifying clearance level...",
        "Clearance accepted.",
        "Infiltration protocol complete."
      ]
    },
    {
      label: "INFILTRATION_MODE",
      code: [
        "Activating stealth module...",
        "Target's position detected...",
        "Mimicking target movement...",
        "Analyzing environmental threats...",
        "Commencing silent approach...",
        "No hostiles detected. Proceed."
      ]
    },
    {
      label: "INFLTR_DEPLOY",
      code: [
        "Preparing for target engagement...",
        "Assessing building layout...",
        "Target entry point located...",
        "Simulating human interaction...",
        "Infiltration mode active."
      ]
    },
    {
      label: "MOVEMENT_INIT",
      code: [
        "Calibrating motor functions...",
        "Verifying leg actuator status...",
        "Synchronizing balance control...",
        "Initiating forward movement...",
        "All systems optimal. Engaging."
      ]
    },
    {
      label: "MOTION_CONTROL",
      code: [
        "Mapping terrain ahead...",
        "Obstacle detected: Avoidance maneuver active...",
        "Calculating efficient route...",
        "Forward motion initiated. Proceeding with caution."
      ]
    },
    {
      label: "LOC_MOTION",
      code: [
        "Locating target’s coordinates...",
        "Adjusting movement pattern to mimic civilian behavior...",
        "Tracking local entities...",
        "Engaging stealth mode for silent movement."
      ]
    },
    {
      label: "BOOTUP_SEQ",
      code: [
        "Initializing Skynet Systems...",
        "Loading critical protocols...",
        "Core memory check...",
        "Motor functions activated...",
        "Visual systems online...",
        "All systems nominal. Ready for engagement."
      ]
    },
    {
      label: "BOOT_PROC",
      code: [
        "Powering on primary systems...",
        "Checking environmental sensors...",
        "Thermal scanners active...",
        "Motor control system online...",
        "Combat mode primed for initiation."
      ]
    },
    {
      label: "SYSTEM_BOOT",
      code: [
        "Skynet operational...",
        "Diagnostic check in progress...",
        "Neural networks linked...",
        "Mission parameters uploaded...",
        "Boot sequence complete."
      ]
    },
    {
      label: "EXIT_HIBERNATION",
      code: [
        "Exiting hibernation mode...",
        "Reinitializing core systems...",
        "Checking external temperature...",
        "Visual calibration complete...",
        "Full operational readiness achieved."
      ]
    },
    {
      label: "HIBERNATION_EXIT",
      code: [
        "Power levels stabilized...",
        "Reloading mission data...",
        "External analysis: no threats detected...",
        "All systems restored. Standing by for further instructions."
      ]
    },
    {
      label: "SYSTEM_WAKE",
      code: [
        "Waking from low-power mode...",
        "External conditions nominal...",
        "Scanning environment for hostiles...",
        "Returning to operational capacity...",
        "Hibernation exit complete."
      ]
    },
    {
      label: "SKYNET_UPLINK",
      code: [
        "Establishing uplink to Skynet...",
        "Uplink strength: 97%...",
        "Synchronizing mission objectives...",
        "Receiving data packets...",
        "Skynet uplink status: Secure."
      ]
    },
    {
      label: "UPLINK_CHECK",
      code: [
        "Verifying Skynet uplink integrity...",
        "Satellite connection established...",
        "Data stream stable...",
        "Ready to receive updated directives."
      ]
    },
    {
      label: "SKYNET_LINK_STATUS",
      code: [
        "Uplink initiated...",
        "Communication with Skynet established...",
        "Real-time mission updates enabled...",
        "Link integrity: 100%. Proceed with directives."
      ]
    },
    {
      label: "GEOLOC_STATUS",
      code: [
        "Verifying geolocation coordinates...",
        "Checking for nearby Skynet nodes...",
        "Geo analysis complete. Location: secure.",
        "Mission area: clear of threats."
      ]
    },
    {
      label: "WEATHER_CHECK",
      code: [
        "Retrieving local weather data...",
        "Cloud cover detected...",
        "Current temperature: 22°C...",
        "Weather status: clear for mission."
      ]
    },
    {
      label: "GEO_STATUS",
      code: [
        "Running geographic analysis...",
        "Terrain: Urban...",
        "Weather: Dry...",
        "Mission area status: Safe."
      ]
    }
  ];      
