The 2D layout page of `agentee view` edits the layout by hand. Edits stay in the window until
`save` (ctrl+S) writes them into the `.pcb.toml` through the same comment and order preserving
writer the CLI uses; `revert` drops them. Every edit is checked in the background the way `check`
would, so the diagnostics panel and the net table follow along, and the header counts unsaved
layouts. When the file changes on disk under unsaved edits the page asks whether to keep yours or
load the file. Closing the window with unsaved edits asks first.

| key | does |
|---|---|
| click | select a part, track, via or ratsnest line; clicking the selection again picks the next item under the pointer |
| drag | move it: a part with its label, a via, a track corner, or a whole track segment; the selected item wins over what lies under it |
| right or middle drag, wheel | pan, zoom |
| R, shift+R | rotate the selected part by 90 degrees |
| Del | delete the selected track or via |
| X | route tool: click a pad, via or track to start, click to add 45 degree corners, `/` flips the bend, V drops a via and moves to the next layer the net's class vias reach, Backspace steps back, Enter, a double click or a click on copper of the net ends |
| V | via tool: click copper with a net to place a class via of that net |
| PgUp, PgDn | active layer |
| ctrl+Z, ctrl+shift+Z | undo, redo |
| Esc | cancel the track, back to select, clear the selection |

Moves snap to the grid picked in the toolbar. New tracks take the class width (no `width` key);
the properties panel sets the net, layer and an own width of a track, the position, net and type
of a via, and the position, rotation, side and `locked` of a part. A selected ratsnest line can be
handed to the autorouter as one connection or as its whole net, with the same rules as
`agentee route`. A via that a `[[fanouts]]` or `[[stitching]]` rule placed, or one element of a
`count` row, is taken out of its rule when you move, change or delete it: the rule gets a
`skip_at` entry for the spot and the via is written as its own `[[vias]]`.

`reset` in the toolbar clears what you tick: routing (tracks, vias and the engine's plan
sections), the `[[fanouts]]` and `[[stitching]]` rules, zones with their stored fills, and silk
label positions, and can place every unlocked part again with the placer (`agentee place`, with a
seed). Like every edit it stays unsaved until you save. `new layout` on the layouts tab asks for a
name, board and schematic, writes `NAME.pcb.toml` next to the project and, unless you untick it,
places every part with the placer first. The new file starts with a zone on every copper layer
for each ground net of the schematic and, when the schematic has RF nets, a `[[stitching]]` grid
of ground vias at 2.5 mm plus a fence along the RF tracks when their class has a
`coplanar_gap`. The engine card's `tie plane pads` runs `agentee tie` on the window's layout, and
a selected ratsnest line of a plane net offers `tie pads to the plane` before a route.

The `layout engine` card runs the stages of `agentee layout` (see `docs/layout-engine-2.md`) on
the layout as it stands in the window, unsaved edits included: `run` takes the stages from..to,
`run X only` reruns one, `stop` ends the run after the stage that is running. Editing pauses while
it runs. The result lands in the window like any other edit, unsaved and one undo away, with the
time and score of each stage and the score terms that weigh most. `phases to run` and `settings`
write `[engine]` into the layout (`phases`, `rounds`, `place_rounds`, `[engine.place] seed`,
`[engine.access] via_in_pad`, `[engine.global]`, `[engine.detail]`), and `default` drops a
setting again. A selected part with 16 or more pads has `pinswap`, which searches swaps of its I/O like
`agentee pinswap` and writes them into the schematic files on `write to the schematic`.

Common parts are drawn from the footprint without loading a model: chip resistors, capacitors,
inductors, LEDs and diodes (names with a `Metric` size), vertical pin headers and sockets, SOIC,
SOT, QFP, QFN, DFN, SON, TSLP and BGA packages, crystals and oscillators, edge mount SMA
connectors, and shield frames (`Shield` in the name or description), drawn without a cover. The body is the `F.Fab` outline, the height comes from
`height`, an `_h1.25mm` part of the name, or the package family, and leads sit on the pads outside
the body. Mounting holes, fiducials, pad test points, solder jumpers and Tag-Connect footprints
get no body. A model file in the project (`3dmodels/` or a path relative to it) still wins over a
generated part; `agentee models` skips the generated ones.

Models are STEP or VRML, placed the way KiCad places them (`model_offset`, `model_rotate`,
`model_scale`). A model path is looked up as given, then under `KICAD9_3DMODEL_DIR` and friends,
`3dmodels/` in the project, `~/.cache/agentee/3dmodels` and `/usr/share/kicad/3dmodels`, trying
`.step`, `.stp` and `.wrl`, gzipped or not. A model can also be an `https://` URL to a STEP or
VRML file, so vendor models need not be checked in: it is downloaded once into
`~/.cache/agentee/3dmodels/url/` and counts as the project's own model, so it wins over a
generated part. Pin the URL to a commit or release so the file cannot change under you. KiCad
library models that are not on disk are downloaded from the kicad-packages3D repository into the
cache: `agentee models` (MCP `models`) fetches them all and
reports what it found, and the viewer fetches in the background. A part without a model is a box
over its fab outline, `height` tall, else a height guessed from the footprint name. STEP files are
meshed with [truck](https://github.com/ricosjp/truck), with colours from their styled items and
assembly placements applied. Edges use the 3D curve of each surface curve, not its pcurves.
Unclamped B-spline curves and surfaces are cut to their valid knot range. An edge curve that
still does not evaluate to finite points is meshed as a straight line, and a face whose surface
does not is left out.

`agentee export pcb:NAME -o NAME.step` (MCP `export`) writes the layout as one STEP assembly
(AP214) for enclosure CAD. The board is a solid of the stackup thickness with its pad holes,
slots and board cutouts; vias are left out. Each part is an instance named by its reference:
a STEP model goes in as the vendor wrote it, solids, colours and sub-assemblies intact, and is
written once however many parts use it. VRML models and generated bodies go in as faceted
surfaces, and a part with no model at all as a box over its fab outline. The frame is the
layout's with Y up and the board's bottom face at z = 0, so a part on the top side starts at
the board thickness. The report lists the STEP files used, how many parts were faceted, the
parts drawn as boxes and the models that could not be found.

Pads take their nets from the schematic (pad number = pin number). Zones are filled with the
clearance to every other net and to the board edge, and islands that reach nothing are removed.
Check reports unrouted connections (with the ratsnest), shorts, clearance violations, tracks
narrower than their class or off their impedance width, copper near the edge, courtyard
overlaps, unplaced parts, track ends that connect to nothing, and silk text that overlaps other
text, crosses a silk outline, sits on a pad or runs off the board. Courtyards are the closed
outlines drawn on `F.CrtYd` / `B.CrtYd`, placed with the part (a bottom part's land on the other
side); two parts whose courtyards overlap on the same side are an error, and so is a courtyard on
either side over another part's NPTH hole or over a `MountingHole*` footprint's courtyard (its pad
outline when it has none). Name an item with its kind when
names collide: `agentee render pcb:lna`, `sch:lna`, `board:lna`.
