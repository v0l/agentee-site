All lengths: `min_track_width`, `min_clearance`, `min_drill`, `min_via_drill`, `min_via_diameter`,
`min_annular_ring` (vias, microvias use `min_microvia_diameter`), `min_blind_via_drill`,
`min_controlled_depth_drill`, `min_microvia_drill`, `max_microvia_drill`, `min_microvia_diameter`, `min_hole_to_hole`, `min_copper_to_edge`, `min_silk_width`,
`min_silk_text_height`, `min_mask_web` (0.1 mm), `max_drill`, `min_npth_drill`, `min_plated_slot_width`,
`min_npth_slot_width`, `min_pth_annular_ring`, `min_via_hole_to_copper`, `min_pth_hole_to_copper`,
`min_inner_pth_hole_to_copper`, `min_npth_to_copper`, `min_smd_pad_gap`, `min_hole_to_smd_pad`,
`max_filled_via_drill`, `min_bga_pad`, `min_bga_pitch`, `min_part_to_edge`, `min_body_to_edge`,
`flex_zone`; plus
`max_aspect_ratio`, a plain number (hole depth over drill), `max_microvia_aspect_ratio` (dielectric
depth over laser drill), `max_controlled_depth_aspect_ratio` (depth over drill of a controlled depth
via), and the switches `hdi` (the fab builds blind, buried and microvias and
backdrills) and `stacked_microvias` (the fab stacks microvias). Footprints are checked against
the rules of every board whose layout places them, so a project with a 4 layer and a 2 layer
board holds each footprint only to the boards it is on. A footprint no layout places is checked
against each board and reported for the one it fits best; with no board, against `generic`.

The fab preset is a table keyed by the copper layer count, the outer copper weight (from the
first copper layer's thickness) and the finish, so a 4 layer 1 oz board gets tighter track rules
than a 2 layer 2 oz one. Anything in `[rules]` overrides the table. The `jlcpcb` values come from
<https://jlcpcb.com/capabilities/pcb-capabilities>:

| rule | 1 layer | 2 layers | 4+ layers | source line |
|---|---|---|---|---|
| `min_track_width`, `min_clearance`, 1 oz | 0.10 | 0.10 | 0.09 | min. track width and spacing (1 oz) |
| same, 2 oz | 0.16 | 0.16 | 0.15 | min. track width and spacing (2 oz) |
| same, 2.5 / 3.5 / 4.5 oz | | 0.2 / 0.25 / 0.3 | | 2 layer heavy copper |
| `min_drill`, `min_via_drill` | 0.3 | 0.15 | 0.15 | drill diameter, min. via hole size |
| `min_via_diameter` | 0.5 | 0.25 | 0.25 | min. via diameter |
| `min_annular_ring` (via) | 0.05 | 0.05 | 0.05 | via diameter 0.1 mm over the hole |
| `min_pth_annular_ring`, 1 oz | 0.18 | 0.18 | 0.15 | PTH annular ring, absolute minimum |
| same, 2 oz | 0.254 | 0.254 | 0.254 | PTH annular ring, 2 oz |
| `max_drill` | 6.3 | 6.3 | 6.3 | drill diameter, larger holes are routed |
| `min_npth_drill` | 0.5 | 0.5 | 0.5 | min. non-plated holes |
| `min_plated_slot_width` | 0.5 | 0.5 | 0.35 | min. plated slot width, slot at least 2 widths long |
| `min_npth_slot_width` | 1.0 | 1.0 | 1.0 | min. non-plated slots |
| `min_via_hole_to_copper` | 0.2 | 0.2 | 0.2 | via hole to track, inner layer via hole to copper |
| `min_pth_hole_to_copper` | 0.28 | 0.28 | 0.28 | PTH to track |
| `min_inner_pth_hole_to_copper` | | | 0.3 | inner layer PTH pad hole to copper |
| `min_npth_to_copper` | 0.2 | 0.2 | 0.2 | NPTH to track |
| `min_smd_pad_gap` | 0.15 | 0.15 | 0.15 | SMD pad to pad clearance, different nets |
| `max_filled_via_drill` | 0.55 | 0.55 | 0.55 | via-in-pad epoxy or copper fill, 0.15 to 0.55 mm |
| `min_bga_pad` | 0.25 (0.2 ENIG) | | | BGA pad, 0.2 to 0.25 mm needs ENIG |
| `min_bga_pitch` | 0.3 | 0.3 | 0.3 | PCBA capabilities, standard: 0.3 mm BGA centre to centre |
| `min_silk_width`, `min_silk_text_height` | 0.15, 1.0 | | | legend line width, text height |
| `max_aspect_ratio` | 10.7 | 10.7 | 10.7 | the 0.15 mm drill on a 1.6 mm board |

Where agentee is stricter than the page, on purpose: `min_copper_to_edge` stays 0.3 mm (the page
allows 0.2 mm on a routed edge, which is milled to +/-0.2 mm, and 0.4 mm on a V-cut),
`min_hole_to_hole` stays 0.5 mm (the page gives 0.45 mm between pad holes and 0.2 mm between
vias), and `min_hole_to_smd_pad` (0.2 mm, the via hole to track figure) and `min_part_to_edge`
(0.5 mm) are agentee's choices, not on the page. `min_body_to_edge` (1.0 mm) follows assembly DFM
guides, which keep every component 1 mm from the board edge for depaneling and handling.
`flex_zone` (5 mm) follows Knowles on MLCC flex cracking: the stress zone is typically within
5 mm of the PCB edge or fixing points.

The `generic` and `jlcpcb` presets build through vias only (`hdi = false`); their microvia and
blind via limits (0.1 mm laser drill, 0.3 mm pad, 0.8:1, 0.2 mm blind drill) apply once
`[rules] hdi = true` is set. The `hdi` preset is `generic` with PCBWay's published HDI capability
table (https://www.pcbway.com/hdi-pcb.html, "HDI PCB Manufacturing Capabilities": builds 1+N+1 to
6+N+6, 0.065/0.065 mm trace and space, 0.15 mm mechanical drill, 4 mil laser drill standard and
8 mil at most on a dielectric of 0.15 mm or less, 0.15 mm controlled depth PTH drill, 14:1 aspect
ratio, 4 mil green mask bridge), for the IPC-2226 builds: type I (one microvia layer, 1+N+1), type II
(type I with buried vias in the core) and type III (two or more microvia layers, 2+N+2), on the
`hdi-6l-1n1` and `hdi-8l-2n2` stackups. Rules the table does not give keep a named reason:

| rule | `hdi` | source |
|---|---|---|
| `hdi`, `stacked_microvias` | true | PCBWay builds 1+N+1 to 6+N+6 by sequential lamination; stacked microvias are copper filled |
| `min_microvia_drill`, `max_microvia_drill` | 0.1, 0.2 | PCBWay min laser drill 4 mil standard, max laser drill 8 mil |
| `min_via_drill`, `min_drill`, `min_blind_via_drill` | 0.15 | PCBWay min mechanical drill 0.15 mm, min controlled depth PTH drill 0.15 mm |
| `min_controlled_depth_drill` | 0.15 | PCBWay "Min. controlled depth drilling, PTH: 0.15mm" |
| `min_track_width`, `min_clearance` | 0.065 | PCBWay min trace/spacing 0.065 mm |
| `max_aspect_ratio` | 14 | PCBWay max 14:1 |
| `min_mask_web` | 0.1 | PCBWay 4 mil green mask bridge (the `generic` value) |
| `min_microvia_diameter` | 0.25 | not in the table: capture pad, 0.075 mm ring on the 0.1 mm drill |
| `max_microvia_aspect_ratio` | 0.8 | not in the table: under the 1:1 of IPC-T-50, room for plating to fill; PCBWay's 8 mil drill on 0.15 mm is 0.75:1 |
| `min_via_diameter`, `min_annular_ring` | 0.35, 0.1 | not in the table: 0.1 mm ring on the 0.15 mm drill |
| `min_hole_to_hole`, `min_via_hole_to_copper` | 0.25, 0.15 | not in the table |
| `min_bga_pad`, `min_bga_pitch` | 0.2, 0.4 | not in the table |

A 0.07 mm 1080 build-up layer under a 0.1 mm laser drill is 0.7:1, inside the 0.8:1.

`max_controlled_depth_aspect_ratio` is 1 in every preset, from Sanmina's fab note "Backdrilling and
Blind/Buried Via Formation" (https://www.sanmina.com/pdf/solutions/bbf.pdf): blind via formation
by controlled depth drilling "is limited by the throw of copper-plating baths to a maximum aspect
ratio of 1:1". No published source gives a controlled depth drill for `generic` or `jlcpcb`:
JLCPCB's capabilities page lists laser blind vias (0.075 to 0.15 mm), mechanical buried vias and
backdrilling but no controlled depth drilling. So both presets reject a controlled depth via like
any other via but `through` (`hdi = false`), and `min_controlled_depth_drill` there is not a number
of its own but their blind via drill (`min_blind_via_drill`, 0.2 mm), applied once `hdi = true`;
set `min_controlled_depth_drill` in `[rules]` from your fab's figure. On `hdi-6l-1n1` a 0.15 mm controlled depth drill reaches
In1.Cu or In4.Cu (0.123 mm deep), not In2.Cu.
