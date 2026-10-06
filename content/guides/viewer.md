The files are the design, and the agent works on them. The viewer is where a person watches that happen and steps in. It is a window over the project directory that reloads whenever a file changes.

```sh
agentee view
agentee view path/to/project --select pcb:lna
agentee view --3d
```

Leave it open beside the agent's terminal. Every edit the agent makes, through `agentee edit` or by writing TOML, shows up a moment later, with the check diagnostics for it.

## What it shows

Every item in the project, one page per kind:

- **Boards**: the stackup to scale, the fab and its rules, and for each net class and layer the trace geometry, impedance and current.
- **Symbols and footprints**: the part as it will be placed, with pins or pads numbered.
- **Schematics**: parts and nets, with the wires agentee routed.
- **Layouts**: copper per layer, pours, vias by type, silk, courtyards and the ratsnest of everything unrouted, with a net table and the diagnostics panel.
- **Sims**: S-parameter plots and Smith charts, TDR, eyes, PDN impedance, DC drop, current density and temperature maps, and logic waveforms.

`agentee render` draws exactly what the viewer draws, to a PNG, which is how the agent sees the same thing without a window:

```sh
agentee render pcb:lna -o lna.png --canvas-only
agentee render pcb:lna -o rf.png --region 0,6,20,18 --show F.Fab
agentee render pcb:lna -o lna-3d.png --show 3d
```

## Editing a layout by hand

Some decisions are faster with a mouse: nudging a connector to where the enclosure wants it, rerouting one track around a part, dropping a via. The 2D layout page edits the layout, and saving (ctrl+S) writes the change into the `.pcb.toml` with the same comment and order preserving writer the CLI uses. The agent reads your change the next time it loads the file.

| key | does |
|---|---|
| click | select a part, track, via or ratsnest line; click again for the next item under the pointer |
| drag | move a part with its label, a via, a track corner or a whole segment |
| right or middle drag, wheel | pan, zoom |
| R, shift+R | rotate the selected part |
| Del | delete the selected track or via |
| X | route: click a pad, via or track to start, click to add 45 degree corners, `/` flips the bend, V drops a via, Enter ends |
| V | place a via on copper with a net |
| PgUp, PgDn | change the active layer |
| ctrl+Z, ctrl+shift+Z | undo, redo |
| Esc | cancel, back to select |

Every edit is checked in the background the way `check` would, so the diagnostics and the net table follow along before you save. `revert` drops unsaved edits. If the file changes on disk under unsaved edits, the viewer asks whether to keep yours or load the file.

Moves snap to the toolbar's grid. New tracks take the class width. The properties panel sets a track's net, layer and width, a via's position, net and type, and a part's position, rotation, side and `locked`.

A selected ratsnest line can be handed to the autorouter, as one connection or its whole net, with the same rules as `agentee route`. For a plane net it offers to tie the pads to the plane instead.

Mark the parts you placed by hand `locked`. `agentee place` never moves a locked part, so the agent can place everything else again around your decisions.

## Starting a layout from the viewer

`new layout` on the layouts tab asks for a name, board and schematic, writes the file and places every part with the placer. The new layout starts with a ground pour on every copper layer and, when the schematic has RF nets, ground stitching and a via fence along the RF tracks.

`reset` clears what you tick (routing, fanout and stitching rules, zones, label positions) and can place every unlocked part again. Like every edit, it stays unsaved until you save.

## The 3D view

The `3d` tab, or `agentee view --3d`, shows the board at its stackup thickness, in its mask, silk and finish colours, with copper under the mask, bare pads, drill walls and each part's model. Drag to orbit, shift-drag to pan, scroll to zoom, double click to reset. The `parts` toggle hides the models.

Common parts are drawn from the footprint without a model: chip passives, headers, SOIC, SOT, QFP, QFN, DFN and BGA packages, crystals, edge mount SMAs and shield frames. Anything else uses its STEP or VRML model, or a box at its `height`. `agentee models` downloads the KiCad models a project names.

## The layout engine card

The viewer can run the stages of `agentee layout` on the layout as it stands in the window, unsaved edits included, and shows the time and score of each stage. The result lands like any other edit, unsaved and one undo away. A selected part with 16 or more pads offers pin swapping, which writes into the schematic.
