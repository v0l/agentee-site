export interface Example {
  slug: string;
  name: string;
  title: string;
  summary: string;
  dir: string;
  image: string;
  shots: { src: string; alt: string }[];
  facts: [string, string][];
  body: string[];
}

export const EXAMPLES: Example[] = [
  {
    slug: 'lna',
    name: 'LNA',
    title: 'A bias-tee powered LNA',
    summary: 'A wideband SPF5189Z low noise amplifier for an SDR, from schematic to a routed four layer layout, with FDTD, a cascade with vendor data, DC drop and thermal sims.',
    dir: 'examples/lna',
    image: 'lna-pcb',
    shots: [
      { src: 'lna-pcb', alt: 'The LNA layout: SMA connectors at both ends, the RF line across the middle and stitching vias over the ground pour.' },
      { src: 'lna-sch', alt: 'The LNA schematic: the input ESD clamp and DC block, the SPF5189Z, the bias chokes and the two power paths.' },
      { src: 'lna-sim', alt: 'S-parameters of the LNA board from the FDTD run, with a Smith chart of the ports.' },
      { src: 'lna-cascade', alt: 'The cascade of the board with the SPF5189Z data: gain, match, noise figure and stability.' },
      { src: 'lna-thermal', alt: 'Thermal map of the LNA board with the amplifier as the hot spot.' },
      { src: 'lna-board', alt: 'The LNA board spec: the four layer stackup to scale, the fab, finish and outline, and the design rules from the JLCPCB preset.' },
    ],
    facts: [
      ['Board', '4 layers, JLC04161H-7628, ENIG'],
      ['Band', '50 MHz to 4 GHz'],
      ['Cascade at 900 MHz', 'gain 17.7 dB, NF 1.0 dB'],
      ['Sims', 'FDTD, cascade, DC drop, thermal'],
    ],
    body: [
      'The amplifier sits at the antenna end of an RTL-SDR style receiver: SMA in, SMA out, a Qorvo SPF5189Z in the middle, powered either over the output coax by the receiver’s bias tee or from a 5 V header. Two Schottky diodes let either source power it without one feeding the other.',
      'The RF lines are a field solved grounded coplanar class at 50 ohm on the top layer over the In1.Cu plane, with the pour beside it stitched to the plane every 2 mm. Its <code>DESIGN.md</code> records why each part was chosen, which chokes stay inductive up to 4 GHz, and the layout rules the circuit depends on.',
      'The simulations show the usual split for RF work: an FDTD run of the passive board with a port where each active part sits, then a cascade that drops in the vendor <code>.s2p</code> files and the datasheet noise figure and OIP3. Change the board and rerun the FDTD; change a part and rerun only the cascade.',
    ],
  },

  {
    slug: 'hackrf-pro',
    name: 'HackRF Pro',
    title: 'Great Scott Gadgets’ HackRF Pro, imported from KiCad',
    summary: 'The Praline board of the HackRF Pro, imported whole from its KiCad files: a large real layout to check, render and benchmark against.',
    dir: 'examples/hackrf-pro',
    image: 'praline-pcb',
    shots: [{ src: 'praline-pcb', alt: 'The HackRF Pro board imported from KiCad, rendered by agentee.' }],
    facts: [
      ['Source', 'KiCad files from Great Scott Gadgets'],
      ['Import', 'agentee import board'],
      ['Use', 'zone fill and check benchmarks'],
    ],
    body: [
      '<code>agentee import board</code> turned the KiCad board into a board spec with its stackup and rules, a layout with every footprint, track, via and zone, a netlist schematic, and the footprints and pin symbols it uses.',
      'It is the large real layout the zone fill and the checks are timed on: every stage of the pour, from clipping to rasterising, has a benchmark over its zones.',
    ],
  },

  {
    slug: 'logic',
    name: 'Logic',
    title: 'Logic simulations of a counter and an I2C bus',
    summary: 'Two schematics simulated straight from their netlists: a 74HC161 counting into a 74HC138, and an open-drain I2C bus captured by a 74HC595.',
    dir: 'examples/logic',
    image: 'logic-counter',
    shots: [{ src: 'logic-counter', alt: 'Waveforms of the counter simulation with the clock, the count and the decoder outputs.' }],
    facts: [
      ['Parts', '74HC161, 74HC138, 74LVC1G06, 74LVC1G07, 74HC595'],
      ['Checks', 'assertions, setup and hold, contention'],
      ['Output', 'result JSON and VCD'],
    ],
    body: [
      '<code>counter</code> clocks a 74HC161 into a 74HC138 and checks the decoder outputs at set times and the count on every rising edge.',
      '<code>i2c</code> is an open-drain bus: a controller built from two 74LVC1G07, a target that pulls SDA low for its ACK with a 74LVC1G06, 4.7k pull-ups, and a 74HC595 clocked by SCL that captures the byte. The sim checks START, the bits, the ACK, the byte and STOP.',
    ],
  },
];
