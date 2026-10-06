Places the schematic's footprints on the board and routes them.

```toml
name = "lna"
board = "lna"
schematic = "lna"

[[footprints]]
ref = "U1"
at = [13.0, 8.05]
rotation = 90                  # degrees, counter-clockwise
# side = "bottom"              # mirrors the footprint and swaps F./B. layers
label = { at = [9.9, 7.4], rotation = 90 }   # move the silk reference; size = 0.8, hide = true
# mlcc = false                 # this part is not a ceramic capacitor, over the footprint's `mlcc`
# locked = true                # `agentee place` never moves it

[[tracks]]
net = "RF_OUT"
layer = "F.Cu"
points = [[18.68, 10], [25.5, 10]]
# width = 0.36                 # default: the net class width

[[vias]]
net = "GND"
at = [7.2, 8.9]
# via = "std"                  # a [[vias]] name from the board, default the first class via
# count = 6                    # a row, like pads
# pitch = [1.2, 0]

[[fanouts]]                    # a via in every connected pad of a BGA
ref = "U3"                     # * and ? globs: ref = "*" with nets = [...] fans out every plane pad
# via = "bga"                  # or a list, the first reaching the pad layer; default the class vias
# skip_rings = 2               # leave the two outer rings for escape on the outer layer
# always = ["GND", "LVDS_*"]   # nets that get a via even in those rings, globs allowed
# skip = ["A1", "B7"]          # pads to leave alone
# skip_at = [[4.5, 3.0]]       # no via at these spots (the viewer adds one when you edit a via)
# nets = ["GND", "3V3"]        # only pads on these nets, globs allowed
# exclude = ["C2?", "J1"]      # refs to leave out when ref is a glob; a glob never
                               # matches test points, a probe pad keeps no via

[[stitching]]                  # ground vias wherever they clear every other net and silk text
net = "GND"
# via = "std"                  # default the net's first class via
# pitch = "2.5mm"              # grid pitch, or the spacing along a fence (default 1mm)
# outline = [[x, y], ...]      # default the board outline
# margin = "0.6mm"             # extra distance from the board edge
# fence = ["RF_*"]             # instead of a grid: a row either side of these nets' tracks
# offset = "0.5mm"             # fence row distance from the track centre, default just past
                               # the class coplanar gap
# skip_at = [[4.5, 3.0]]       # no via at these spots (the viewer adds one when you edit a via)

[[zones]]
net = "GND"
layers = ["F.Cu", "In1.Cu", "In2.Cu", "B.Cu"]
# outline = [[x, y], ...]      # default: the board outline
# clearance = 0.25             # default: the net class clearance
# priority = 1                # higher fills first; other nets' zones on the layer pour around it
# min_island_area = 2.0       # mm2; a piece touching one item of the net is kept only this big
# pad_connection = "relief"    # solid (default) | relief: pads of the net join the pour by four
                               # spokes across a gap, so they heat like a track-fed pad;
                               # none: the pour keeps its clearance from the pads. A pad's
                               # own zone_connect wins, and BGA balls (16 or more round SMD
                               # pads) stay solid, since spokes starve a ball of solder heat
# relief_tht_only = true       # relief on through-hole pads only, SMD pads solid (KiCad's
                               # thru_hole_only)
# relief_gap = "0.3mm"         # default: the zone clearance
# spoke_width = "0.3mm"        # default: the net class track width, at least min_width

[[cutouts]]                    # keep zones off an area, e.g. under an SMA centre pin;
                               # a hole through the board is [[outline.cutouts]] in the board file
layers = ["In1.Cu"]
points = [[0, 9], [5.4, 9], [5.4, 11], [0, 11]]

[[graphics]]                   # board text and lines, same keys as footprint graphics
kind = "text"
layer = "F.SilkS"              # F.SilkS, B.SilkS, F.Fab or B.Fab
at = [7.4, 7.6]
# locked = true                # `agentee place` never moves it
text = "RF IN"
size = 1.0                     # mm, the fab minimum is in the board rules

[[artwork]]                    # a filled logo or icon
layer = "F.SilkS"
icon = "arrow"                 # built in: arrow, warning, ground, antenna, lightning, pin1, ce
# file = "logo.svg"            # or any SVG, relative to this file
at = [7.4, 6.3]                # centre of the artwork
height = 0.8                   # mm, the width follows the aspect ratio
# rotation = 90

[test]                         # in-circuit and flying probe test access, all optional
# nets = ["3V3", "*RST*"]      # nets that need a probe, globs, any case; default below
# exclude = ["LED_*"]          # nets to leave out
# side = "B"                   # probe side, F or B
# through_holes = true         # exposed plated through-hole pads count as access
# vias = false                 # vias count as access; opens the probe side mask over every via
# min_test_pad = "1.0mm"       # smallest test pad
# min_test_pad_pitch = "1.27mm"   # centre to centre between test pads
# min_test_pad_to_body = "1.0mm"  # to another part's body on the probe side
# min_test_pad_to_edge = "3.0mm"  # to the board edge and tooling holes

[place]                        # optional, for `agentee place`
# edges = { J1 = "left", J2 = "right" }   # pin a connector to an edge: left, right, top
                               # (smallest y) or bottom
# keepouts = [[[0, 0], [8, 0], [8, 6], [0, 6]]]   # polygons no courtyard may enter

[watermark]                    # optional: where the agentee version watermark goes
# at = [30, 21]                # centre of the text, default a clear spot found by check
# layer = "B.SilkS"            # default B.SilkS, else F.SilkS
# rotation = 90                # default 0, or 90 where only a tall gap is clear
```

Every layout carries silk text `agentee vX.Y.Z-HASH`: the version of the agentee that built the
package and the short git hash of its source, with `-dirty` when the tree had uncommitted
changes, or `unknown` outside git. It is always plotted and cannot be turned off. It is
`min_silk_text_height` tall, centred, and by default goes on `B.SilkS` (`F.SilkS` when the bottom
has no room or the board has no bottom silk) at the clear spot nearest the board's bottom left
corner, rotated 90 degrees if only a tall gap fits. A clear spot keeps off pads, vias, other silk
text and lines, artwork and part bodies, and stays `min_copper_to_edge` inside the outline. The
viewer, render and assembly drawings show it, and `fab-notes.txt` names it. When no spot is clear,
check reports a `watermark` error with the size to clear and the least crowded spot, and fab
refuses; clear room there or set `[watermark] at` (plus `layer`, `rotation`) yourself. A
`[watermark]` spot that is not clear is a `watermark` error naming what it hits, and a stackup
with no `kind = "silk"` layer is a `watermark` error asking for one.

Test access: by default the nets that need a probe are power nets (a class with `current`, or a
name like `3V3`, `1V8`, `+5V`, `VCC*`, `VDD*`, `VBUS*`, `VBAT*`, `VIN*`, `VSYS*`), ground (`GND`,
`*GND`, `GND*`) and nets named like `*RST*`, `*RESET*`, `*EN*`, `*PG*`, `*CLK*`, `*TX*`, `*RX*`,
`*SCL*`, `*SDA*`, `*SWD*`, `*TCK*`, `*TMS*`, `*TDI*`, `*TDO*`. The defaults leave out switch
nodes and regulator feedback, soft-start and noise-reduction nets (`SW*`, `*_SW`, `LX*`, `FB*`,
`SS*`, `NR*`, matched on the whole name or its last `/` segment), even when their class is power:
a probe's capacitance and the stub to the pad couple switching noise into a feedback divider or
slow a soft-start or noise filter, and a stub on a switch node radiates. `nets` replaces that list
(name such a net there to probe it anyway) and `exclude` takes nets out of it. A test point is a part with a reference `TP` and a number, or a
footprint named `TestPoint*`; like every part it must be in the schematic. The built in
`TestPoint_Pad_D1.0mm` footprint (a 1.0 mm round SMD pad, mask open, no paste) and `TestPoint`
symbol are written into `footprints/` and `symbols/` by `agentee testpoints`.

`agentee testpoints NAME --nets "3V3,*RST*" [--side B] [--pitch 2.54]` (MCP `testpoints`) adds a
test pad to each matching net that has no probe access yet (nets are the `[test]` defaults when
`--nets` is left out, impedance and pair nets are skipped): it looks on the probe side for a free
spot on a `--pitch` grid near the net's copper, keeping `min_test_pad_to_edge` from the edge and
tooling holes, `min_test_pad_to_body` from part bodies, `--pitch` from other test pads, and the
net clearance from other copper and from the pads, stubs and vias it placed for other nets. It
adds a `TP` part joined to the net to the schematic sheet that names the net, a `[[footprints]]`
entry on the probe side to the layout with a short stub track to a via beside the pad, then
routes each new pad to the net's copper with the autorouter and appends those tracks and vias.
A pad the router cannot join is taken out of the schematic and layout again and listed with the
nets that found no spot. Labels of the new pads are moved to a clear spot or hidden, and when the
layout stores zone fills they are refreshed as `agentee fill` would. `--dry-run` reports the
spots without writing.

Silk text must keep 0.4 mm from other silk text and 0.2 mm from silk outlines, stay off pads,
vias and other parts' bodies, and stay on the board. Each of these is an error, except text under
another part's body, which is a warning. When a reference label fails, check names a
spot that passes every rule, as a `label = { at = [...] }` line to paste. `agentee silk NAME`
(MCP `silk`) pastes them all for you and repeats until the labels settle; `--hide` hides the
references that have no clear spot, typically small passives under a BGA.

A fill piece is kept only if it touches two items of its net, or one and is at least
`min_island_area`; the rest reach nothing new and are removed. Check verifies every fill against
other nets: a fill that overlaps another net's zone, track, via or pad, or comes closer than the
clearance, is an error, and copper tips sharper than 30 degrees are flagged.

Zones on the same layer fill in order of `priority`, then smallest first, and each keeps its
clearance from the fills already placed, so a small switch-node or supply pour inside a
board-wide ground pour is poured around rather than shorted to it.

Pours keep `min_via_hole_to_copper` from other nets' via holes and `min_npth_to_copper` from
non-plated holes as well as the clearance, with arcs drawn outside the true circle so the gap is
never short. Stitching vias go only where the via clears every other net's copper on each layer it spans,
keeps its hole `min_via_hole_to_copper` from that copper and `min_hole_to_smd_pad` from SMD pads of any net,
keeps `min_hole_to_hole` from every drill and the edge rule from the outline, and lands inside a
zone of its net; check reports how many it placed. They are drilled and plotted like any via.

Zone fills are exact polygons: the zone outline less every other net's copper grown by its
clearance, with round corners, so pours render and plot without stair steps. Necks and slivers
narrower than the zone's `min_width` (default 0.25 mm) are removed, the way a fab would etch them.
Where two clearance areas (antipads, track and pad clearances) come closer than `min_width`, the
pour is cut back to the straight lines joining them, within about 1.5 `min_width` of the gap, so no
stub or hairline waist is left pointing into it. The same holds between a clearance area and the
board edge's clearance, a cutout, or the clearance around another zone's fill.

Zone fills are cached: each fill is keyed by a hash of everything it depends on and kept in
`~/.cache/agentee/fills`, so a load only fills the zones whose copper, clearances or neighbours
changed (set `AGENTEE_NO_FILL_CACHE` to skip the cache). `agentee fill NAME` (MCP `fill`) also
stores the fills at the end of the layout file, one `[[fills]]` table per zone and layer, so a
fresh checkout loads without filling; a stored fill whose hash no longer matches is ignored, and
check notes it with `--info`. Importing a board stores its fills. Leave the `[[fills]]` tables to
the tool.

A track that only grazes a pad (its centre line misses the pad) is flagged; run it into the pad. Two
segments of one net that lie on top of each other on a layer (parallel, overlapping by more
than a track width) are an error, since the copper is doubled; a bend sharper than 90 degrees is
flagged as an acid trap.
A track may neck down below its class width, to no less than the fab minimum, for up to 0.5 mm
(the class `neckdown`) where it meets a small pad; the router draws such necks itself (see
Autorouting). Drilled holes, vias and plated pads alike, must
keep the board's `min_hole_to_hole` apart; check counts the pairs that do not and names the first.
Two vias of one net at the same spot are an error too: the fab would drill the hole twice.
Mask openings are the pad outlines, with no expansion, and vias are tented. Two openings of
different nets (or no net) that overlap or leave a mask web under `min_mask_web` are an error,
counted per part pair with the first place named. Pads of one fine pitch part are checked too: fix
it in the footprint with narrower pads, or set a smaller `min_mask_web` when the fab allows it. A
footprint with `mask_web = false` has its mask opened as one window over its pads (a gang
opening), so pairs of its own pads are skipped; its pads are still checked against other parts.

Artwork on a bottom layer is mirrored so it reads correctly from below. SVG fills and strokes are
flattened to polygons; text in an SVG is ignored, so convert it to paths first. Silk text and
artwork get the same checks as reference labels: overlap, pads, silk outlines, board edge.
