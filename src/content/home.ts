export const LOOP = [
  {
    verb: 'Edit',
    body: 'The agent changes one file, usually through <code>agentee edit</code>, which writes the TOML for it, keeps the comments and refuses a pin or net that does not exist.',
    code: 'agentee edit sch lna net RF_OUT C2.2 J2.1 L3.1 --class RF',
  },
  {
    verb: 'Check',
    body: 'Every diagnostic names the file, the item and the place. Most say what value would pass, so the next edit is the fix.',
    code: 'agentee check --item pcb:lna',
  },
  {
    verb: 'Look',
    body: 'A PNG of the board exactly as the viewer draws it. A passing check can still hide crowded silk or a detour in a track.',
    code: 'agentee render pcb:lna -o lna.png',
  },
  {
    verb: 'Measure',
    body: 'The resolved model as JSON: pin positions, net lengths and delays, solved trace widths per layer, sim readings.',
    code: 'agentee show pcb:lna',
  },
];

export const FILES = [
  {
    suffix: '*.board.toml',
    body: 'Fab preset, stackup, outline, via types and net classes with impedance and current targets.',
    code: '[[netclasses]]\nname = "RF"\nimpedance = "50ohm"\ncoplanar_gap = "0.2mm"\nsolver = "field"',
  },
  {
    suffix: '*.sym.toml',
    body: 'A schematic symbol, hand placed or generated from per-side pin lists. Most come from KiCad.',
    code: '[[pins]]\nnumber = "2"\nname = "GND"\ntype = "power_in"\nside = "bottom"',
  },
  {
    suffix: '*.fp.toml',
    body: 'A footprint, with rows of pads written once with a count and a pitch.',
    code: '[[pads]]\nnumber = "1"\nkind = "smd"\nsize = [1.95, 0.6]\ncount = 4\npitch = [0, 1.27]',
  },
  {
    suffix: '*.sch.toml',
    body: 'Placed parts and nets as lists of pins. Leave the wires out and agentee routes them.',
    code: '[[nets]]\nname = "RF_OUT"\nclass = "RF"\npins = ["C2.2", "J2.1", "L3.1"]',
  },
  {
    suffix: '*.pcb.toml',
    body: 'Placements, tracks, vias, zones and silk, checked for connectivity and clearance on every load.',
    code: '[[tracks]]\nnet = "RF_OUT"\nlayer = "F.Cu"\npoints = [[19.28, 12.0], [30.92, 12.0]]',
  },
  {
    suffix: '*.sim.toml',
    body: 'A simulation of the layout or the schematic: FDTD, cascade, channel, PDN, DC drop, thermal or logic.',
    code: 'name = "lna-rf"\nlayout = "lna"\n[frequency]\nstart = "50MHz"\nstop = "6GHz"',
  },
];

export const KNOWS = [
  {
    term: '{drc} layout rules',
    body: 'Shorts, clearances and unrouted nets, but also via-in-pad fill, tombstoning, ceramic capacitors in the flex zone, starved thermals, mask webs, silk over pads and probe access for test.',
  },
  {
    term: '{stackups} real stackups',
    body: 'Every JLCPCB impedance build from 4 to 20 layers and the PCBWay standard builds, by the fab’s own code, with the thickness and permittivity of each layer.',
  },
  {
    term: 'The fab’s own limits',
    body: 'The JLCPCB preset follows the capability page line by line and scales with the layer count and copper weight. Where agentee is stricter, the reference says why.',
  },
  {
    term: 'Impedance, solved',
    body: 'Closed forms for a first answer, a GPU field solver with mask and copper thickness for the classes that matter. Within 0.5% of exact stripline references.',
  },
];

export const SIMS = [
  {
    kind: 'FDTD',
    guide: 'rf-simulation',
    image: 'lna-sim',
    body: 'A full-wave 3D run of the layout on the GPU, with lumped ports on pads, giving S-parameters as JSON and Touchstone.',
  },
  {
    kind: 'Cascade',
    guide: 'rf-simulation',
    image: 'lna-cascade',
    body: 'Vendor S-parameters, noise and linearity dropped into the board sim: gain, noise figure, IIP3 and stability.',
  },
  {
    kind: 'Thermal',
    guide: 'power-and-thermal',
    image: 'lna-thermal',
    body: 'Conduction through FR4, copper and vias with convection from both faces. Seconds, not minutes.',
  },
  {
    kind: 'Logic',
    guide: 'logic-simulation',
    image: 'logic-counter',
    body: 'An event-driven sim of the schematic’s digital parts with 74 series models, assertions and setup and hold checks.',
  },
];

export const SIM_KINDS: [string, string][] = [
  ['FDTD', 'rf-simulation'],
  ['Cascade', 'rf-simulation'],
  ['Channel and eye', 'signal-integrity'],
  ['PDN', 'signal-integrity'],
  ['DC drop', 'power-and-thermal'],
  ['Thermal', 'power-and-thermal'],
  ['Logic', 'logic-simulation'],
];

export const FAB_FILES = [
  { file: 'F_Cu.gbr … B_Cu.gbr', body: 'Copper per layer, RS-274X with X2 attributes' },
  { file: 'F_Mask, F_Paste, F_SilkS', body: 'Mask, paste and silk for each side' },
  { file: 'drill-PTH.drl, drill-NPTH.drl', body: 'Excellon drills, one file per via span on HDI boards' },
  { file: 'bom-jlcpcb.csv, cpl.csv', body: 'BOM and placement in the columns JLCPCB asks for' },
  { file: 'NAME.d356', body: 'IPC-D-356 netlist for the bare-board test' },
  { file: 'fab-notes.txt', body: 'Stackup, impedance classes, via types and what to fill' },
  { file: 'NAME-gerbers.zip', body: 'Everything the fab needs, ready to upload' },
];
