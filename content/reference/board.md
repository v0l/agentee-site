```toml
name = "sensor-node"
description = "2 layer sensor board"
fab = "jlcpcb"                 # rule preset: generic | jlcpcb | hdi

[outline]                      # a rectangle...
size = [50, 30]
origin = [0, 0]                # top-left corner, default [0, 0]
corner_radius = 1
# points = [[0,0], [50,0], [50,30], [0,30]]   # ...or a polygon

[[outline.cutouts]]            # a window, slot or large hole routed through the whole board
origin = [20, 12]              # a rectangle, same keys as the outline
size = [6, 2]
corner_radius = 1              # half the width makes a slot
# points = [[x, y], ...]       # ...or a polygon

[stackup]
preset = "JLC04161H-7628"         # a fab build, see Stackup presets
finish = "ENIG"
mask_color = "green"
silk_color = "white"

[rules]                        # overrides the fab preset, any subset
min_track_width = "0.15mm"

[[vias]]
name = "std"
drill = "0.3mm"
diameter = "0.6mm"
# type = "through"             # through | blind | buried | microvia, default from the span
# from = "F.Cu"                # default: outermost copper on each side
# to = "B.Cu"
# fill = "filled_capped"       # IPC-4761 type, see Via types
# drill_kind = "mechanical"    # mechanical | laser | controlled_depth, default from the type
# cost = 1.0                   # router cost of this via, times --via-cost

[[netclasses]]
name = "Default"               # always define Default
track_width = "0.2mm"
clearance = "0.2mm"
via = "std"                    # or a list the router picks from: ["std", "uvia-top"]

[[netclasses]]
name = "Power"
track_width = "1mm"
current = "3A"                 # checked against IPC-2221 on every layer
max_temp_rise = "10C"          # default 10C

[[netclasses]]
name = "USB"
impedance = "90ohm"            # target, checked on every layer in `layers`
impedance_tolerance = "10%"    # default 10%
diff_gap = "0.15mm"            # makes it a differential pair
layers = ["F.Cu"]              # default: every copper layer
# track_width omitted: solved for the target on the first layer
# widths = { "B.Cu" = "0.16mm" } # per layer width where one width does not fit every layer
# max_uncoupled = "1.5mm"      # total run allowed off the pair gap, default 20% of the length
# neckdown = "1.5mm"           # how far a track may run below class width into a pad, default 0.5mm

[[netclasses]]
name = "RF"
impedance = "50ohm"
coplanar_gap = "0.2mm"         # grounded coplanar: pour this far either side, plane below
layers = ["F.Cu"]              # outer layers only
solver = "field"               # check with the GPU field solver (mask, thickness) instead of formulas
```

Board cutouts sit with the outline in the board file because they are part of the board's shape:
the outline is the outer edge and each cutout is an inner edge, both milled from the same
Edge.Cuts profile. The layout's `[[cutouts]]` only keep zone copper off an area on some layers and
leave the board whole. A cutout must lie inside the outline. Everything that uses the outline treats
a cutout edge as board edge: the edge rules (`copper-to-edge`, `pad-to-edge`, `pad-off-board`,
`part-to-edge`, `part-body-to-edge`, `hole-to-edge`, `edge-pad-reach`, the `mlcc-flex-zone` rules,
which name the cutout), silk and the watermark, pours (kept `min_copper_to_edge` off), stitching
vias, test points, the router and tuner, the fab Edge_Cuts profile, the viewers and the FDTD,
thermal and DC models, where a cutout is air. A stored fill goes stale when a cutout changes.
