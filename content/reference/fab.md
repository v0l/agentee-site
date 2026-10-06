`agentee fab pcb:NAME -o DIR` (MCP `fab`) writes:

| file | what |
|---|---|
| `F_Cu.gbr` ... `B_Cu.gbr` | copper per layer, RS-274X with X2 file attributes, zone fills as regions |
| `F_Mask.gbr`, `B_Mask.gbr` | mask openings at the pad outlines, vias tented |
| `F_Paste.gbr`, `B_Paste.gbr` | paste on SMD pads |
| `F_SilkS.gbr`, `B_SilkS.gbr` | silk lines, artwork and text in the Hershey stroke font, with the `agentee vX.Y.Z-HASH` watermark |
| `Edge_Cuts.gbr` | the board outline and each board cutout as a closed profile; the fab routes cutouts from it, so they stay out of the drill files and `fab-notes.txt` counts them |
| `drill-PTH.drl`, `drill-NPTH.drl` | Excellon, metric, slots as G85; the plated file holds the pad holes and the through vias, unchanged for a board with through vias only |
| `drill-FROM-TO.drl` | one Excellon file per blind, buried or microvia span, as KiCad splits them, e.g. `drill-F.Cu-In1.Cu.drl`, with `TF.FileFunction,Plated,1,2,Blind` (`Buried` for inner spans, layers numbered from 1 at the top) and a `; span F.Cu to In1.Cu, microvia vias` comment |
| `drill-FROM-TO-controlled-depth.drl` | the controlled depth vias of a span, kept apart from the vias drilled in a sub-stack or by laser over the same span since the fab drills them in a different pass, after the last press and by depth; same file function, with the drilled side and stop layer in a `; span In4.Cu to B.Cu, controlled depth blind vias drilled from B.Cu after the last press, stopping on In4.Cu` comment |
| `drill-backdrill-FROM-TO.drl` | the backdrill holes of each side and stop layer, non-plated, at the backdrill diameter, with the stop layer and `max_stub` in a comment |
| `bom.csv`, `bom-jlcpcb.csv` | grouped by value, footprint, `mpn` and `lcsc` fields |
| `cpl.csv` | placement, JLCPCB columns |
| `fab-notes.txt` | the agentee version and watermark spot, stackup, finish, impedance classes, each via type with its span, laser, mechanical or controlled depth drill, sizes, hole count, IPC-4761 fill and drill file, and each backdrill with its side, stop layer and stub, vias in pads to fill, edge pads to keep |
| `NAME.d356` | IPC-D-356A netlist for the fab's bare-board electrical test, columns as KiCad writes them; test point pads are end points with the probe side access code (`A01` top, the copper layer count for the bottom, `A02` on 2 layers and `A08` on 8), vias are tented mid points unless `[test] vias = true` makes them probe side access; an unprobed via's access code follows the layers its copper reaches (a backdrill takes its side away): `A00` through, `A01` from the top, the bottom layer number from the bottom, the first layer's number for a buried via |
| `testpoints.csv` | every test point pad for the fixture builder: ref, pad, net, X, Y (mm, Y up), side, pad diameter |
| `NAME-gerbers.zip` | every Gerber and drill file, ready to upload to the fab |
| `assembly-top.png`, `assembly-bottom.png` | fab and silk layers for the line |

Coordinates are mm with Y up, the same in the Gerbers and the placement file. Parts marked `dnp`,
with `assembly = "no"` in their fields, or on MountingHole and Fiducial footprints stay off the
BOM and placement file. The silk font is the one the viewer draws, so text sizes and overlaps
read the same on screen as on the board.
