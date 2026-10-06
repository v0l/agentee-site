export interface Guide {
  slug: string;
  title: string;
  summary: string;
  group: string;
}

export const GUIDE_GROUPS = ['Start here', 'Design', 'Simulate', 'Ship'];

export const GUIDES: Guide[] = [
  {
    slug: 'getting-started',
    title: 'Your first board',
    summary: 'From an empty directory to a checked, routed two layer board and a fab package: board spec, KiCad parts, a schematic, placement, routing and Gerbers.',
    group: 'Start here',
  },
  {
    slug: 'agents',
    title: 'Set up your coding agent',
    summary: 'Install the agentee skill, add the MCP server to Claude Code, Codex, Cursor or any MCP client, and give the agent a brief it can work from.',
    group: 'Start here',
  },
  {
    slug: 'kicad',
    title: 'Coming from KiCad',
    summary: 'What agentee takes from KiCad and what it does differently: the libraries it imports from, importing a whole board, and how the concepts map.',
    group: 'Start here',
  },
  {
    slug: 'board-spec',
    title: 'Board specs, stackups and net classes',
    summary: 'Pick a fab and a real stackup, define a net class per kind of net, and put impedance and current targets on them so check solves the widths.',
    group: 'Design',
  },
  {
    slug: 'parts',
    title: 'Parts: import or draw',
    summary: 'Search and import KiCad symbols and footprints, fix what the fab rejects, and build a part from its datasheet when KiCad does not have it.',
    group: 'Design',
  },
  {
    slug: 'schematics',
    title: 'Writing schematics',
    summary: 'Parts, nets and classes with agentee edit, batches of commands, sheets for large designs, and the signal level check that catches dividers between VIL and VIH.',
    group: 'Design',
  },
  {
    slug: 'layout',
    title: 'Placement, routing and pours',
    summary: 'Automatic placement, ground and supply pours, plane ties, the autorouter, silk labels, test pads and the design rule checks that gate the fab package.',
    group: 'Design',
  },
  {
    slug: 'impedance',
    title: 'Controlled impedance and pairs',
    summary: 'Closed form and GPU field solved trace widths, coplanar RF lines, differential pairs, length matching and interfaces like USB 3.',
    group: 'Design',
  },
  {
    slug: 'hdi',
    title: 'HDI: microvias and lamination',
    summary: 'Blind, buried and microvias, stacked and skip vias, via-in-pad, backdrills and controlled depth drilling, and how the lamination decides what can be drilled.',
    group: 'Design',
  },
  {
    slug: 'rf-simulation',
    title: 'RF simulation: FDTD and cascade',
    summary: 'Run a full-wave FDTD of a layout on the GPU, drop vendor S-parameters and noise data into it, and read gain, noise figure, match and stability.',
    group: 'Simulate',
  },
  {
    slug: 'signal-integrity',
    title: 'Eyes, PDN and S-parameters',
    summary: 'Push a bit stream through a channel and read the eye, check a power rail’s impedance against a target, and run TDR, mixed-mode and crosstalk analysis.',
    group: 'Simulate',
  },
  {
    slug: 'power-and-thermal',
    title: 'DC drop and thermal',
    summary: 'Solve every copper layer for voltage drop and current density, then the board’s temperature with each part’s power, in seconds.',
    group: 'Simulate',
  },
  {
    slug: 'logic-simulation',
    title: 'Logic simulation',
    summary: 'Simulate the digital parts of a schematic straight from its netlist: 74 series models, stimulus, assertions, setup and hold checks, and a VCD out.',
    group: 'Simulate',
  },
  {
    slug: 'fab',
    title: 'Fab package, BOM and pricing',
    summary: 'Write Gerbers, drills, BOM and placement for JLCPCB or any fab, price the BOM at Mouser and Farnell, and export a STEP for the enclosure.',
    group: 'Ship',
  },
  {
    slug: 'viewer',
    title: 'The viewer',
    summary: 'A live window that reloads on every save, where a person can watch the agent work, move parts, route tracks and place vias by hand.',
    group: 'Ship',
  },
  {
    slug: 'ci',
    title: 'Checking designs in CI',
    summary: 'Run agentee check on every push, fail the build on errors, keep simulation results fresh, and attach a fab package to a release.',
    group: 'Ship',
  },
];
