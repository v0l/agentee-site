Layout checks run from a registry of rules, each with a stable id, a category (`copper`,
`drill`, `mask`, `silk`, `assembly`, `zone`, `signal`, `test`, `placement`), a default severity, and a condition on the
board: a rule for inner layers runs only with 4 or more copper layers, a via fill rule only when
vias sit in pads, a BGA rule only when there is a BGA. Every message of a rule starts with its id
in brackets, e.g. `[via-cuts-pad]`. `agentee drc NAME --list` (MCP `drc` with `list = true`) prints
every rule with its category, severity, and whether it applies to this board and why; `agentee
drc NAME` prints the layout's rule messages alone.

```toml
[drc]                          # in the board file
disable = ["silk-width"]       # rule ids to skip; their checks are not computed, so with silk-text
                               # and silk-hidden off `agentee silk` has nothing to move
severity = { "starved-thermal" = "error", "via-in-pad" = "warning" }   # info | warning | error
tombstone_ratio = 3            # copper or feed width one chip pad may have over the other
```

| id | severity | runs when | checks |
|---|---|---|---|
| `via-cuts-pad` | error | always | a via whose copper overlaps or touches an SMD pad while its drill is not fully inside the pad: solder wicks down the barrel and the pad edge is damaged. A via of another net touching a pad is reported as a `short` instead |
| `via-annulus-past-pad` | warning | vias in pads | the drill sits in the pad but the via's annulus reaches past the pad edge under the mask |
| `via-in-pad` | info | vias in pads | counts the vias in SMD pads of their own net (drill inside the pad); `fab-notes.txt` asks the fab to fill and cap exactly these (IPC-4761 type VII) |
| `via-in-pad-fill` | error | vias in pads | a via in a pad drilled wider than `max_filled_via_drill`, or whose via type sets a `fill` other than `filled_capped` (IPC-4761 type VII) |
| `hole-to-smd-pad` | warning | always | a via hole closer than `min_hole_to_smd_pad` to an SMD pad of its own net (or no net) that it does not touch; paste and solder can flow into it |
| `drill-size` | error | always | pad holes under `min_drill` (plated) or `min_npth_drill` (non-plated), or over `max_drill` (larger holes are routed, draw them as cutouts). Via sizes are checked on the board's `[[vias]]` |
| `slot-size` | error | slotted holes | slots narrower than `min_plated_slot_width` or `min_npth_slot_width`, or shorter than twice their width |
| `aspect-ratio` | error | always | plated holes whose depth (the copper and dielectric they pass) over drill exceeds `max_aspect_ratio` |
| `hole-to-copper` | error | always | a via or plated pad hole wall closer than `min_via_hole_to_copper` or `min_pth_hole_to_copper` to copper of another net on a layer the hole passes: tracks, pads, vias, pours |
| `inner-hole-to-copper` | error | 4+ copper layers | a plated pad hole wall closer than `min_inner_pth_hole_to_copper` to another net's copper on an inner layer |
| `npth-to-copper` | error | non-plated holes | a non-plated hole wall closer than `min_npth_to_copper` to any copper, its own net's pour included |
| `hole-to-edge` | error | non-plated holes | a non-plated hole wall closer than `min_copper_to_edge` to the board outline or a board cutout, or through it |
| `smd-pad-gap` | error | always | SMD pads of different nets closer than `min_smd_pad_gap`, one line per pair of parts with the closest pads |
| `pad-to-edge` | error | always | pad copper closer than `min_copper_to_edge` to the board outline or a board cutout; pads marked `edge = true` are exempt |
| `edge-pad-reach` | warning | always | a pad marked `edge = true` that stops short of the board outline |
| `starved-thermal` | warning | zones | a pad joined to a pour of its net over less than half its outline, by fewer than two spokes at least `min_track_width` wide, and with less copper in all than the pad's own width |
| `part-to-edge` | warning | parts | SMD pads closer than `min_part_to_edge` to the outline or a board cutout, where depaneling stress cracks parts; skips fiducials, mounting holes and parts with `edge` pads |
| `part-body-to-edge` | info | parts | a part body closer than `min_body_to_edge` to the outline or a board cutout, or past it (over a cutout counts as past) (assembly DFM guides: no component within 1 mm of the edge). The body is the fab outline, else the courtyard, else the pad copper, and the message names which; skips fiducials, mounting holes, parts with `edge` pads and footprints with `overhang = true` |
| `fiducials` | info | parts | no footprint named like `Fiducial` on the board |
| `tooling-holes` | info | parts | no non-plated hole of 1.5 mm or more |
| `bga-pad` | error | a BGA | BGA pads (16 or more round SMD pads) smaller than `min_bga_pad` |
| `bga-pitch` | error | a BGA | ball pitch finer than `min_bga_pitch` |
| `bga-pad-ratio` | warning | a BGA | pad diameter outside 40% to 65% of the pitch (IPC-7351 land sizes) |
| `paste-without-mask` | warning | parts | a copper pad with paste but no mask opening on that side, so the stencil prints onto mask |
| `mlcc-flex-zone-case` | info | ceramic capacitors | a ceramic capacitor of case 0805 (2012 metric) or larger within `flex_zone` of the outline, a board corner, a board cutout, a mounting hole (a `MountingHole*` footprint) or a non-plated hole of 2 mm or more (Knowles: the stress zone is typically within 5 mm of the PCB edge or fixing points); the longer the chip, the more strain its ends see |
| `mlcc-flex-zone` | info | ceramic capacitors | a smaller ceramic capacitor within `flex_zone` whose long axis points at the nearest edge, corner or hole (Murata FAQ: orient the chip horizontal to the stress direction, so its long axis runs along the edge) |
| `mlcc-flex-zone-info` | info | ceramic capacitors | counts the smaller ceramic capacitors within `flex_zone` that already lie along the edge |
| `tombstone-risk` | info | chips of 0603 or smaller | a two-pad SMD part of 0603 (1608 metric) or smaller whose pads differ in size or shape, that has a via in one pad and not the other, or whose copper within 0.3 mm of one pad on its layer (tracks, vias, pours of its net) is over `tombstone_ratio` (default 3) times that of the other; a pad joined to its pour through a thermal relief is weighed by its spoke width against the track width on the other pad instead, and a pad with no track, via or pour yet is not compared; the end that heats first wets first and stands the part up (EMS DFM guides: symmetric lands and balanced copper on both ends) |
| `tall-part-shadow` | info | part heights over 3 mm | a two-pad chip of 0603 or smaller closer to a part taller than 3 mm than that part's height, measured from the chip's pads to the tall part's body (EMS rule of thumb 1:1: shadowing in reflow and inspection); heights come from the footprint `height`, else the body the 3D view draws without a model: its family default (SOIC, QFN, headers, shields) or an `_h1.25mm` part of the name |
| `test-access` | info | parts | nets the `[test]` section asks for with no probe access from the probe side: no pad of a test point (reference `TP1`..., or a footprint named `TestPoint*`), no exposed plated through-hole pad (`through_holes`), no untented via (`vias`). Nets in classes with an impedance target, and the nets of pairs, are exempt and named, since a stub hurts them |
| `test-pad-geometry` | info | test points | a test point pad under `min_test_pad`, closer than `min_test_pad_pitch` to another centre to centre, closer than `min_test_pad_to_body` to another part's body on the probe side, closer than `min_test_pad_to_edge` to the board edge or a tooling hole (non-plated holes and mounting holes), or not on the probe side |
| `placement-decoupling-distance` | info | parts | a capacitor between a supply and ground whose supply pad is farther than `decoupling_distance` (3 mm) from the nearest pin of an IC on that supply, 2.5 times that for bulk capacitors over 1 uF |
| `placement-crystal-distance` | info | parts | a crystal or oscillator (reference `Y`, or a footprint named like a crystal or oscillator) whose signal pad is farther than `crystal_distance` (5 mm) from the IC pin on its net |
| `placement-large-part-off-centre` | info | parts | a large chip (a BGA, a package of 16 or more pins over 25 mm2, else the parts with the most pins) whose courtyard centre is more than `off_centre` (0.6) of the way from the board centre to the edge |
| `placement-hot-parts-close` | info | parts | two hot parts whose courtyards are closer than `hot_distance` (5 mm): the `[[sources]]` of this layout's thermal sims at 0.25 W or more, and the large packages (courtyard of 49 mm2 or more) those sims do not list |
| `placement-cluster-spread` | info | parts | a two-pin passive whose signal nets reach one IC and nothing else, farther than `cluster_spread` (10 mm) from that IC's pin |
| `placement-connector-not-at-edge` | info | parts | a connector (edge pads, `overhang = true`, or a `J`/`P` reference that is not a Tag-Connect, U.FL or test pad) whose courtyard is farther than `connector_edge` (3 mm) from the outline |
| `short` | error | always | copper of two different nets touches |
| `clearance` | error | always | copper of two nets closer than the larger of their class clearances (a footprint `clearance` replaces them for its pads), or copper run into a non-plated hole. Pads of one footprint are held to `min_clearance` and to the class clearance of nets in an isolation domain; spark gap electrodes are skipped |
| `isolation-domain` | error | `[[domains]]` | a net whose class or name puts it in two domains |
| `isolation-unassigned` | warning | `[[domains]]` | nets in no domain, which no barrier covers |
| `isolation-clearance` | error | a barrier with `clearance` | copper of two domains on one layer closer than the clearance of the barrier between them, pads of one footprint and pours included; one line per net pair with the closest spot |
| `creepage` | error | a barrier with `creepage` | copper of two domains closer along the board surface than the barrier's creepage: on one outer layer around board cutouts and non-plated holes at least the groove width of its `pollution_degree` wide, and from F.Cu to B.Cu down a cutout or hole wall or round the board edge |
| `spark-gap` | error | footprints with `spark_gaps` | a spark gap whose electrodes are not the declared `gap` apart (to 0.01 mm), sit under `min_clearance`, share a net or lack one, or have solder mask across the gap on an outer layer |
| `unrouted` | error | always | a net whose pads are not all joined by tracks, vias and pours, naming the groups that are apart |
| `dangling-track` | warning | always | a track end that touches no copper of its net and no pour |
| `track-grazes-pad` | warning | always | tracks that reach a pad only with their edge; run the centre line into the pad |
| `copper-to-edge` | error | always | a track or via closer than `min_copper_to_edge` to the board outline or a board cutout, or off the board (a track across a cutout leaves the board) |
| `pad-off-board` | error | always | pads outside the outline or in a board cutout; pads marked `edge = true` are exempt |
| `stitching` | info | always | counts the vias each `[[stitching]]` entry placed |
| `stitching-empty` | warning | always | a `[[stitching]]` entry that placed no via |
| `fanout-empty` | warning | always | a `[[fanouts]]` entry that placed no via |
| `hole-to-hole` | error | always | holes of different parts or vias closer than `min_hole_to_hole`, wall to wall, counted with the first pair; only holes whose spans share a dielectric count, so a microvia beside a buried via is not a pair |
| `stacked-via` | error | always | a via on the same spot as another via of its net through the same dielectric (drilled twice), stacked on another via at one layer when `stacked_microvias` is off or out of the lamination's build order (the via under a stack drilled at a later step than the one on top), or stacked with a controlled depth via at all |
| `via-lamination` | error | always | vias whose span and drill kind match no drill step of the lamination (see Lamination), per via type and span; the message names the board `[[vias]]` entry and lists every span the lamination drills, by drill kind. The board check leaves a via type a layout places to this rule |
| `neckdown` | info | always | a track narrower than its class width but not under `min_track_width`, on a run up to the class `neckdown` length (0.5 mm by default) |
| `class-width` | error | always | a track narrower than its class width that is not a neck-down |
| `impedance-width` | warning | impedance classes | a track of an impedance class at another width, its impedance moves |
| `impedance-trace` | error | impedance classes | a track of an impedance class whose width, neck-downs included, or the copper beside it on an outer layer puts its impedance outside the class tolerance; the gap is not checked within the neck-down length of a pad or a junction |
| `track-overlap` | error | always | tracks of one net running on top of each other, the copper is doubled |
| `acute-turn` | warning | always | a track turning back more than 90 degrees, an acid trap |
| `zone-overlap` | error | zones | fills of two nets on one layer overlap, a short |
| `zone-to-zone` | error | zones | fills of two nets on one layer closer than their clearance |
| `zone-clearance` | error | zones | a fill that covers or comes too close to copper of another net |
| `zone-tips` | warning | zones | fill tips sharper than 30 degrees; raise the zone's `min_width` |
| `copper-neck` | warning | zones | necks in a fill narrower than 90% of the zone's `min_width`, which the fill should have opened; counted by place with the narrowest |
| `zone-islands` | info | always | fill islands that reach nothing of the zone's net, or only copper that is cut off from the rest of it and joins no two pads, and were removed |
| `courtyard-overlap` | error | parts | courtyards of two parts on one side overlap by their outline |
| `courtyard-hole` | error | parts | a courtyard that covers a mounting hole or a non-plated hole of another part |
| `mask-web` | error | always | pads of different nets whose mask openings leave less than `min_mask_web`, one line per pair of parts; pads of one footprint with `mask_web = false` are skipped among themselves, and so are the electrodes of a spark gap |
| `silk-text` | error | always | silk text that crowds other text, sits on pads, prints over vias, crosses a silk outline or runs off the board; a reference gets a clear spot (`agentee silk` moves it there) |
| `silk-hidden` | warning | always | silk text only hidden under another part's body |
| `silk-text-height` | warning | always | silk text under `min_silk_text_height` |
| `silk-artwork` | error | always | silk artwork on pads, over silk text or off the board |
| `watermark` | error | always | the `agentee vX.Y.Z-HASH` watermark has no clear spot on the silk, or the `[watermark]` spot is not clear; fab refuses without a spot, and disabling the rule does not remove the watermark |
| `silk-width` | warning | always | board silk lines (the layout's `[[graphics]]`, not text) thinner than `min_silk_width`, counted with the thinnest; footprint silk is checked with the footprint |
| `pair-skew` | error | pairs | a pair skewed over its `max_skew` or the class `max_skew`, with the net to lengthen |
| `pair-skew-info` | info | pairs | the skew of each pair within its limit |
| `pair-gap` | error | pairs | a pair run side by side at another gap than the class `diff_gap`, beyond `max_uncoupled` |
| `pair-coupling` | warning | pairs | less than 80% of a pair runs side by side at the pair gap |
| `match-length` | error | match groups | a member of a match group off its target by more than the tolerance |
| `interface-pair` | error | interfaces | a net of a differential interface with no pair partner |
| `interface-impedance` | error | interfaces | an interface net whose class has no impedance target, one outside the window, or no pair gap on a differential interface |
| `interface-skew` | error | interfaces | a pair skewed over the interface's `max_skew` |
| `interface-bus-skew` | error | interfaces | the data signals spread more than `max_bus_skew` |
| `interface-clock-window` | error | interfaces | a data signal arriving outside `clock_window` from the clock |
| `interface-vias` | error | interfaces | a lane with more vias than `max_vias` |
| `interface-stub` | error | interfaces | a via stub longer than `max_stub` |
| `interface-return-via` | error | interfaces | a signal via with no reference via within `return_via` |
| `interface-length` | error | interfaces | a lane longer than `max_length` |
| `interface-reference` | error | interfaces | a lane running more than `max_unreferenced` with no reference plane next to it |

The placement rules are guidance for where parts sit, notices by default; raise them with
`[drc] severity`. Their thresholds live in the board:

```toml
[drc.placement]
decoupling_distance = "3mm"    # supply pad of a decoupling cap to the IC pin
crystal_distance = "5mm"
cluster_spread = "10mm"        # a passive to the only IC it serves
hot_distance = "5mm"           # courtyard gap between large packages
connector_edge = "3mm"         # connector courtyard to the outline
off_centre = 0.6               # fraction of the half width or height from the centre
```

The mechanical rules (`part-body-to-edge`, the `mlcc-flex-zone` rules, `tombstone-risk`,
`tall-part-shadow`) are guidance and default to info; raise them with `[drc] severity`. A ceramic
capacitor is a part with exactly two SMD pads whose footprint is named `C_*` or contains
`Capacitor`, or whose reference is `C` and a digit, unless the footprint name says `CP_`,
`Tantal`, `Elec` or `Polymer`; `mlcc` on the footprint or the placement overrides the guess. The
case comes from the footprint name (`1608Metric`, else an imperial code such as `0603`), else
from the distance between the two pad centres, which is close to the body length.

An id that names no rule is a warning. Errors in the files themselves (a net that is not in the
schematic, a layer that is not copper, a bad preset) are not rules and cannot be disabled.
