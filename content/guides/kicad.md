agentee is not a KiCad replacement with a different file format. It is a design tool for agents that borrows KiCad's libraries and reads KiCad's boards. If you know KiCad, most of the concepts carry over; what changes is that the files are the interface, and a person edits through an agent and a viewer rather than through an editor.

## The libraries

agentee has no part library of its own. `agentee search` and `agentee import` read the KiCad symbol and footprint libraries from:

- `/usr/share/kicad` and `/usr/local/share/kicad` on Linux,
- `/Applications/KiCad/KiCad.app/Contents/SharedSupport` on macOS,
- `KICAD9_SYMBOL_DIR` and `KICAD9_FOOTPRINT_DIR` anywhere else, including Windows. `KICAD8_*` and `KICAD_*` work as well.

```sh
agentee search symbol lm358
agentee import symbol Amplifier_Operational:LM358 --with-footprint
agentee import footprint Package_TO_SOT_SMD:SOT-89-3
```

An import writes a `.sym.toml` or `.fp.toml` into `symbols/` or `footprints/`. From then on the project owns it: there is no link back to the library, so a part never changes under you when KiCad updates. A `.kicad_sym` or `.kicad_mod` path works in place of `Library:Name` for parts outside the standard libraries.

3D models come from `KICAD9_3DMODEL_DIR` and friends, `3dmodels/` in the project, or a cache that `agentee models` fills from the kicad-packages3D repository.

## How the concepts map

| KiCad | agentee |
|---|---|
| `.kicad_pro` board setup: layers, rules, net classes | `*.board.toml`: fab preset, stackup preset, `[rules]`, `[[netclasses]]`, `[[vias]]` |
| symbol library entry | `*.sym.toml`, one per symbol |
| footprint | `*.fp.toml`, with pad rows instead of one entry per pad |
| schematic sheet with wires | `*.sch.toml`: parts and nets as lists of pins; wires optional |
| hierarchical sheets | `sheets = [...]` in a top schematic, nets joined by name |
| `.kicad_pcb` | `*.pcb.toml`: placements, tracks, vias, zones, silk |
| DRC | `agentee check`, with every rule listed by `agentee drc NAME --list` |
| zone fill | automatic on load, cached; `agentee fill` stores it in the file |
| plot Gerbers and drill files | `agentee fab` |
| footprint fields `mpn`, `lcsc` | the same fields on the schematic part, read by the BOM and `agentee parts` |

Things that behave differently:

- **Net class widths are minimums.** In KiCad a class width is the default for new tracks; in agentee a track narrower than its class is an error unless it is a short neck-down into a pad.
- **Impedance and current live on the class.** Give a class `impedance = "50ohm"` or `current = "2A"` and check solves the width for every layer of the stackup.
- **Stackups are the fab's own.** Pick `JLC04161H-7628` or a PCBWay build from `agentee stackups` instead of typing thicknesses.
- **Y grows down** in every file, as in KiCad's footprint editor, and rotation is counter-clockwise on screen.
- **Unknown keys are errors.** A typo in a key is reported, not ignored.
- **Every board carries a version watermark** in its silk: the agentee version and the commit that built the fab package.

## Importing a whole board

```sh
agentee import board path/to/NAME.kicad_pcb --dir NAME
cd NAME
agentee check
agentee render pcb:NAME -o NAME.png
```

The import writes:

| file | from |
|---|---|
| `NAME.board.toml` | the Edge.Cuts outline and its cutouts, the stackup with thickness, permittivity and loss tangent, the finish and mask colour, the design rules and net classes from `NAME.kicad_pro` |
| `NAME.pcb.toml` | footprint placements, tracks (arcs as short segments), vias and zones with their fills stored, and the silk and fab text and lines, with `${TITLE}` and the project's text variables filled in |
| `NAME.sch.toml` | every part with its value, and each net as a list of pins, drawn with net labels |
| `footprints/` | each footprint as it sits on the board, bottom ones flipped back to the top |
| `symbols/` | one box symbol per footprint, with a pin per pad number |

The schematic is a netlist, not your drawing: KiCad's schematic is not read, so pin names, the symbol art and the sheet structure are not carried over. That is enough to check, render, simulate and fab the board, and to have an agent change the layout.

Vias keep their type. A KiCad `micro` via becomes a microvia, `blind` a blind or buried via by its span, and each distinct drill, pad, span, fill and backdrill becomes a board via type. Coordinates move so the outline starts at 0, 0.

Left out and reported: teardrops, keepout areas, and loops in Edge.Cuts outside the outline. A class whose tracks run narrower than its width takes the narrowest one, since agentee treats the width as a minimum. Clearances are checked with KiCad's 0.5 um tolerance.

On KiCad's own `video` and `complex_hierarchy` demos, every pad of the imported layout lands where KiCad's IPC-D-356 export puts it: 2089 and 165 pads. The [HackRF Pro example](/examples/hackrf-pro/) is a full board imported this way.

## Going back

There is no export to KiCad files. What leaves agentee is the fab package (Gerbers with X2 attributes, Excellon drills, BOM, placement and an IPC-D-356 netlist) and a STEP of the assembled board, which any fab and any MCAD tool reads.
