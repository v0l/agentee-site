A through via is drilled once, after the last press, from top to bottom. Everything else, blind and buried vias, microvias, backdrills and controlled depth drilling, depends on how the board is built up. agentee models that build, so it can tell you which vias a fab can drill before you route with them.

## Use an HDI preset

The `generic` and `jlcpcb` fab presets build through vias only, and report any other via type as an error. For HDI, set the `hdi` preset and an HDI stackup:

```toml
fab = "hdi"

[stackup]
preset = "hdi-6l-1n1"
finish = "ENIG"
```

The `hdi` preset is `generic` with PCBWay's published HDI capabilities: 1+N+1 to 6+N+6 builds, 0.065 mm trace and space, a 0.1 to 0.2 mm laser drill, 0.15 mm mechanical drill, 14:1 aspect ratio and stacked copper filled microvias. `[rules] hdi = true` turns HDI on for another preset, with that preset's limits.

The two HDI stackups that ship are generic builds, not one fab's published stackup:

- `hdi-6l-1n1`: 6 layers, 1+4+1, 0.8 mm, a 0.07 mm 1080 build-up prepreg each side of a core sub-stack.
- `hdi-8l-2n2`: 8 layers, 2+4+2, 1.0 mm, two build-up layers each side over the same sub-stack.

## Via types

```toml
[[vias]]
name = "uvia-top"
type = "microvia"
from = "F.Cu"
to = "In1.Cu"
drill = "0.1mm"
diameter = "0.25mm"
fill = "filled_capped"

[[vias]]
name = "core"
type = "buried"
from = "In1.Cu"
to = "In4.Cu"
drill = "0.2mm"
diameter = "0.45mm"
```

| type | span | drilled |
|---|---|---|
| `through` | first to last copper | mechanically, after the last lamination |
| `blind` | an outer layer to an inner one | mechanically in a sub-stack, or to a controlled depth |
| `buried` | inner to inner | mechanically, in a laminated sub-stack |
| `microvia` | one dielectric | by laser, in a build-up layer |

Without `type`, the span decides. A microvia spans one dielectric unless it is `stacked` (one microvia per dielectric, which needs `stacked_microvias`) or `skip` (one laser hole over two dielectrics). Check holds each microvia to the laser drill limits and its depth over drill to `max_microvia_aspect_ratio`, 0.8:1 on the `hdi` preset.

`fill` is the IPC-4761 via protection, from `tented` (type I) to `filled_capped` (type VII). Via-in-pad wants type VII, and a via in a pad with any other fill is a `via-in-pad-fill` error.

## Lamination decides what can be drilled

The lamination is the sequence of presses and the drill steps between them. Without a `lamination` list agentee derives it from the stackup: each core drilled before its press, the sub-stack after its press, then for each build-up press a laser step into the layer below and a mechanical step through everything pressed so far, and finally controlled depth steps from each face.

On `hdi-6l-1n1` that gives:

- In1.Cu to In2.Cu and In3.Cu to In4.Cu, in the cores,
- In1.Cu to In4.Cu, buried, through the sub-stack,
- laser F.Cu to In1.Cu and In4.Cu to B.Cu,
- the through drill F.Cu to B.Cu,
- controlled depth from F.Cu and from B.Cu to each inner layer.

A via type is drillable only when its span and drill kind match a step. One that matches none is a `via-lamination` error, and the message lists every span the lamination drills. F.Cu to In2.Cu, for instance, is drillable on `hdi-8l-2n2` as two stacked laser steps but not on `hdi-6l-1n1`, where it would cross the first core. List `lamination` steps by hand for a build the stackup does not show.

Stacks build from the inside out. Of two vias meeting at one layer, the one nearer the surface sits on top, and the one under it must be drilled at the same or an earlier step. `stacked-via` reports a stack in the wrong order, and two vias at one spot through the same dielectric, which would be drilled twice.

## Routing with several via types

A class can list several vias:

```toml
[[netclasses]]
name = "Default"
via = ["std", "uvia-top", "uvia-bot"]
```

The router picks, at each layer change, the cheapest listed via that spans both layers (by its `cost` times `--via-cost`, ties going to the via that spans fewer layers), so a change from F.Cu to In1.Cu takes the microvia and a change to In2.Cu the through via. `[[fanouts]]` takes the first via that reaches the pad's layer, which is how a fine pitch BGA gets a microvia in every pad:

```toml
[[fanouts]]
ref = "U1"
via = ["uvia-top"]
```

```sh
agentee route NAME --nets '*' --via-in-pad
```

## Backdrills and controlled depth

```toml
[[vias]]
name = "bd"
drill = "0.3mm"
diameter = "0.6mm"
backdrill = { from = "B.Cu", to = "In2.Cu", max_stub = "0.2mm" }
```

A backdrill removes the barrel from one face up to just before `to`, leaving a stub of at most `max_stub`. A controlled depth via (`drill_kind = "controlled_depth"`) is a blind via drilled mechanically from its face after the last press, stopping on its layer by depth. Its depth over drill is held to 1:1, and nothing may stack on it.

Every via, of every type, only occupies the layers it spans. Clearance, pours, stitching, the DC, thermal and FDTD models, the 2D and 3D viewers and the drill files all follow that.

## What the fab gets

`agentee fab` writes one Excellon file per blind, buried or microvia span, named like `drill-F.Cu-In1.Cu.drl`, controlled depth vias in their own `-controlled-depth` file, and backdrills in `drill-backdrill-FROM-TO.drl`. `fab-notes.txt` lists each via type with its span, drill kind, size, count, fill and drill file, and every via in a pad to fill and cap.
