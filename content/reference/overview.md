A project is a directory. Every file below it is loaded by its suffix:

| suffix | holds |
|---|---|
| `*.board.toml` | one board spec: fab rules, stackup, outline, vias, net classes |
| `*.sym.toml` | one schematic symbol |
| `*.fp.toml` | one footprint |
| `*.sch.toml` | a schematic: placed parts, nets, wires |
| `*.pcb.toml` | a layout: footprint placement, tracks, vias, zones |
| `*.sim.toml` | a simulation of a layout: FDTD S-parameters, cascade, channel, PDN, DC drop or thermal (`kind`) |

Names are unique per kind. A symbol links a footprint by its `name`, and a `Library:Name` reference
matches on the part after the colon.

Run `agentee check` after every edit. Unknown keys are errors, so a typo is reported, not ignored.
