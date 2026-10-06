`agentee import board path/to/NAME.kicad_pcb --dir DIR` turns a whole KiCad board into a project:

| file | from |
|---|---|
| `NAME.board.toml` | the Edge.Cuts outline (closed loops inside it become `[[outline.cutouts]]`, loops outside it are left out and reported), the stackup with thickness, er and loss tangent, the copper finish and mask colour, the design rules and net classes from `NAME.kicad_pro` |
| `NAME.pcb.toml` | footprint placements, tracks (arcs as short segments), vias and zones, with agentee's zone fills stored, and the silk and fab text and lines drawn on the board, with `${TITLE}`, `${DATE}` and the project's text variables filled in |
| `NAME.sch.toml` | every part with its value, and each net as a list of pins, drawn with net labels |
| `footprints/` | each footprint as it sits on the board, bottom-side ones flipped back to the top, pad drill offsets kept |
| `symbols/` | one box symbol per footprint with a pin per pad number |

KiCad vias keep their type: `micro` becomes a microvia, `blind` a blind or buried via by its span,
and each distinct drill, pad, span, fill and backdrill becomes a board `[[vias]]` type. KiCad 9
stores only a per-via `tenting`, solder mask rather than a via fill, which is left out, and has no
backdrill or depth drill. The later format's `filling`, `capping`, `covering` and `plugging` map to
the IPC-4761 `fill`, and its `backdrill` (from the top) and `tertiary_drill` (from the bottom)
become `backdrill` at their `size`; KiCad lists the layers the backdrill removes, so `to` is the
copper layer past the last of them. Neither has a controlled depth via, so an imported blind via
is drilled mechanically: set `drill_kind = "controlled_depth"` on its type where the fab drills it
by depth.

Coordinates move so the outline starts at 0, 0. Teardrops and keepout areas are left out and
reported. A class whose tracks run narrower than its width takes the narrowest one, since KiCad
treats the class width as a default and agentee as a minimum. Clearances are checked with
KiCad's 0.5 um tolerance. On KiCad's `video` and `complex_hierarchy` demos every pad of the
imported layout lands where KiCad's own IPC-D-356 export puts it (2089 and 165 pads).
