```toml
name = "SOIC-8_3.9x4.9mm_P1.27mm"
description = "SOIC, 8 pin"
tags = ["SOIC", "SO"]
mount = "smd"                  # smd | tht | other, default from the pads
height = "1.5mm"               # body height in the 3D view when there is no model
model = "${KICAD9_3DMODEL_DIR}/Package_SO.3dshapes/SOIC-8_3.9x4.9mm_P1.27mm.step"
# model = "https://raw.githubusercontent.com/espressif/kicad-libraries/<commit>/3dmodels/espressif.3dshapes/ESP32-C3-MINI-1.STEP"
model_offset = ["0mm", "0mm", "0mm"]   # optional, as in KiCad: model frame, Y up
model_rotate = [0, 0, 0]               # optional, degrees about X, Y, Z
model_scale = [1, 1, 1]                # optional
# mask_web = false             # the fab opens the mask over all pads of a fine pitch part as one
                               # window, so min_mask_web is not checked between its own pads
# clearance = "0.2mm"          # as KiCad's footprint clearance: its pads keep this from other
                               # copper instead of the net class clearance
# overhang = true              # a connector meant to hang over the board edge: part-body-to-edge
                               # skips it, its SMD pads still keep min_part_to_edge
# mlcc = false                 # not a ceramic capacitor (film, polymer): the mlcc-flex-zone rules
                               # skip it; true marks one that the name does not give away
# net_tie_pad_groups = [["1", "2"]]  # as KiCad's net tie: copper of these pads' nets may touch or
                               # come near any pad of the group (a bridged solder jumper's strip
                               # and the tracks landing on it) without a short or clearance error

[[pads]]
number = "1"
kind = "smd"                   # smd | tht | npth | connect
shape = "roundrect"            # rect | roundrect | circle | oval | custom
at = [-2.475, -1.905]
size = [1.95, 0.6]
roundrect_ratio = 0.25         # default 0.25
count = 4                      # a row of 4 pads...
pitch = [0, 1.27]              # ...each this far from the last, numbered 1, 2, 3, 4

[[pads]]
number = "5"
kind = "smd"
shape = "roundrect"
at = [2.475, 1.905]
size = [1.95, 0.6]
count = 4
pitch = [0, -1.27]             # counts 5..8 back up the right side

[[pads]]
number = "1"
kind = "tht"
shape = "circle"
at = [0, 0]
size = [1.7, 1.7]
drill = 1.0                    # round, or [w, h] for a slot
# rotation = 90
# layers = ["*.Cu", "*.Mask"]  # default by kind: smd F.Cu F.Paste F.Mask, tht *.Cu *.Mask
# edge = true                  # the copper is meant to reach the board edge (edge-launch
                               # connector, castellation, edge finger): exempt from the edge
                               # clearance, listed in the fab notes
# zone_connect = "solid"       # solid | relief | none: this pad's join to a same-net zone,
                               # over the zone's pad_connection (KiCad's pad zone_connect)

[[graphics]]
kind = "rect"
layer = "F.CrtYd"
start = [-3.7, -2.7]
end = [3.7, 2.7]

[[graphics]]
kind = "text"
layer = "F.SilkS"
text = "${REFERENCE}"
at = [0, -3.4]
size = 1.0
```

Numbering in a row counts up the trailing digits (`A1`, `A2`, ...). `number_step = 2` counts by
two. A custom pad is the anchor rectangle from `size` plus `points`, a polygon relative to `at`
(set `size = [0, 0]` for the polygon alone).

Layers: `F.Cu`, `B.Cu`, `F.SilkS`, `B.SilkS`, `F.Mask`, `B.Mask`, `F.Paste`, `B.Paste`, `F.Fab`,
`B.Fab`, `F.CrtYd`, `B.CrtYd`, `Edge.Cuts`, `*.Cu`, `*.Mask`.

Footprint graphics on a copper, mask or paste layer are plotted as copper, mask openings or
paste, and drawn in the viewer: the copper strip of a bridged solder jumper, say. Check does not
see them as copper.

Check looks for overlapping pads, pads closer than the fab clearance, drills and annular rings
under the rules (`min_drill`, `min_pth_annular_ring`), a courtyard that encloses the pads, and
silk that runs over exposed copper.
