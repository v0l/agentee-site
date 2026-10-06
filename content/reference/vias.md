A board `[[vias]]` entry is a via type: its hole, pad, the copper layers it spans and how the fab
builds it, as KiCad, Altium and HDI fabs name them.

```toml
[[vias]]
name = "uvia-top"
type = "microvia"              # laser drilled, one dielectric: F.Cu to In1.Cu
from = "F.Cu"
to = "In1.Cu"
drill = "0.1mm"
diameter = "0.25mm"
fill = "filled_capped"         # copper filled and capped, for via-in-pad
# stacked = true               # a stack of microvias, one per dielectric from..to
# skip = true                  # one laser hole over two dielectrics

[[vias]]
name = "core"
type = "buried"                # inner to inner, drilled in a laminated sub-stack
from = "In1.Cu"
to = "In4.Cu"
drill = "0.2mm"
diameter = "0.45mm"

[[vias]]
name = "bd"                    # a through via backdrilled from the bottom
drill = "0.3mm"
diameter = "0.6mm"
backdrill = { from = "B.Cu", to = "In2.Cu", max_stub = "0.2mm" }
# backdrill.diameter defaults to the drill + 0.2 mm
```

| type | span | drilled |
|---|---|---|
| `through` | first to last copper layer | mechanically, after the last lamination |
| `blind` | one outer layer to an inner layer | mechanically, in a sub-stack, or to a controlled depth (`drill_kind = "controlled_depth"`) |
| `buried` | inner layer to inner layer | mechanically, in a laminated sub-stack |
| `microvia` | one dielectric (`stacked`: several, `skip`: two) | by laser, in a build-up layer |

Without `type` the span decides: first to last layer is `through`, one outer end is `blind`,
two inner ends `buried`. Check holds the type to its span (a blind via must touch exactly one
outer layer, a buried via none) and to the fab:

- Any type but `through`, and any backdrill, needs sequential lamination: the `generic` and
  `jlcpcb` presets build through vias only and report such a via as an error, the `hdi` preset or
  `[rules] hdi = true` allows them.
- The span and drill kind must match a drill step of the lamination (see Lamination); the error
  lists the spans it drills. `drill_kind` defaults to `laser` for a microvia and `mechanical`
  otherwise; a microvia is always laser drilled and a laser drilled via is a microvia.
- A controlled depth via (`drill_kind = "controlled_depth"`) is a blind via drilled mechanically
  from its outer layer after the last press, stopping on its inner layer by depth. Its drill is at
  least `min_controlled_depth_drill` (and `min_via_drill`), its depth (outer copper through the
  target copper) over its drill at most `max_controlled_depth_aspect_ratio`, and nothing stacks on
  or under it: the drill stops by depth on a plain pad, so `stacked-via` reports any via at its
  spot. The fab gets it in its own drill file, `drill-FROM-TO-controlled-depth.drl`, apart from
  the sequentially drilled vias of the same span in `drill-FROM-TO.drl`, and the fab notes name
  each via type with its drill file, the controlled depth ones as drilled to a controlled depth
  from their side.
- A microvia spans one dielectric unless `stacked` (a stack of single microvias, which needs
  `[rules] stacked_microvias = true` and copper filled microvias below) or `skip` (one laser hole
  over two dielectrics). Its drill is between `min_microvia_drill` and `max_microvia_drill`, its
  pad at least `min_microvia_diameter`, and its depth over the drill at most
  `max_microvia_aspect_ratio`, for each dielectric of a stack. IPC-T-50 defines a microvia as a
  blind structure of at most 1:1 aspect ratio and 0.25 mm depth; a deeper one is a warning.
- Blind and buried vias drill at least `min_blind_via_drill` (and `min_via_drill`).
- A backdrill runs `from` an outer layer the via reaches and stops before `to`, a layer strictly
  inside the span, which stays connected. The via then has copper only from its far end to `to`,
  and the stub left is at most `max_stub` (default 0.25 mm). Microvias and buried vias cannot be
  backdrilled.

`fill` is the IPC-4761 via protection type: `tented` (I), `tented_covered` (II), `plugged` (III),
`plugged_covered` (IV), `filled` (V), `filled_covered` (VI), `filled_capped` (VII). Via-in-pad
wants type VII; a via in a pad whose type sets any other fill is a `via-in-pad-fill` error, and a
via in a pad with no `fill` is listed in the fab notes to fill and cap as before.

A via occupies only the copper layers it spans (after a backdrill, the layers left). Everything
that places or reads vias follows that: connectivity, shorts and clearance, zone fill (a pour on a
layer the via does not reach keeps no antipad for it), stitching (the via's layers), fanout (the
first class via that reaches the pad's layer), the unrouted and dangling-end checks, the
interface via stubs (a blind via has no stub past its end layer, a backdrilled via keeps its
`max_stub`), `hole-to-copper` and `aspect-ratio` over the hole's span, `hole-to-hole` only for
holes whose spans share a dielectric, and `stacked-via`: two vias at one spot through the same
dielectric are drilled twice, while vias meeting at one layer (a microvia on a buried via, or a
stack of microvias) are stacked vias, allowed only with `stacked_microvias` and in build order:
of two vias meeting at one layer the one nearer the board surface is on top, and the one under it
must be drilled at the same or an earlier lamination step (a microvia on a buried via needs the
buried via's step first). Two vias as near the surface as each other stack in either order. Silk text keeps off only the vias whose
hole opens on its side, so a buried via under a label is fine. The DC, thermal
and FDTD models run a barrel only between the via's first and last layer; a backdrilled via also
keeps its stub, `max_stub` of barrel past the stop layer toward the drilled side (short of the
next layer): FDTD meshes it as metal to the nearest mesh plane, thermal conducts along it as
copper and through the rest of the dielectric as FR-4, and DC leaves it out since a dead end
carries no current. The 2D viewer
draws a via only when one of its layers is shown, rings it in its type's colour (through gold,
blind teal, buried lavender, microvia cyan) with its two end layers' colours on the rim, and marks
a controlled depth via with a dot of its ring colour in the hole, its plated bottom. The 3D
viewer drills the board face only on the sides a via reaches and ends its barrel at its span; a
controlled depth via ends in a plated drill point, a cone 0.6 of its drill radius deep (a 118
degree drill) past its stop layer, where a sequentially drilled via ends flat; a
backdrill shows as a wider unplated hole, at the backdrill diameter, from the drilled face to the
stub, where the plated barrel ends.

A net class may list several vias, `via = ["std", "uvia-top", "uvia-bot"]`. A layout
`[[vias]]` entry and `[[stitching]]` use the first unless they name one, `[[fanouts]]` the
first that reaches the pad's layer, and the router picks, at each layer change, the cheapest
listed via whose layers hold both ends (`cost` times `--via-cost`, ties go to the via
that spans fewer layers), so with `["std", "uvia-top"]` a change from F.Cu to In1.Cu takes the
microvia and a change to In2.Cu the through via. It changes layer twice at one spot (a microvia
on a buried via) only with `stacked_microvias`, otherwise it staggers them, and never on or under a
controlled depth via. Where it changes layer twice at one spot and a listed via spans both
changes, it places that one via instead, when it keeps clear of the fixed copper and of the
copper and via holes routed in the same pass. A class via the lamination cannot drill is left
out; a class with none left fails with the spans the lamination drills.
