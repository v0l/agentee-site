`preset` names a fab's standard build. The presets ship with agentee, in
`crates/agentee-core/stackups/*.toml`:

| fab | names | builds |
|---|---|---|
| JLCPCB | the fab's code, `JLC06161H-1080` (layers, thickness, outer and inner copper, prepreg) | every impedance controlled build, 4 to 20 layers, 0.4 to 3.0 mm, plus `jlcpcb-2l-1.6mm` |
| PCBWay | `pcbway-6l-1.6mm-1oz-1oz-70-2116-7628` (layers, thickness, outer and inner oz, inner copper %, prepregs) | the standard through-hole builds, 4 to 18 layers |
| generic HDI | `hdi-6l-1n1`: 6 layer 1+4+1, 0.8 mm, 1080 build-up prepreg (0.07 mm) over a core, 2116, core sub-stack; `hdi-8l-2n2`: 8 layer 2+4+2, 1.0 mm, two 1080 build-up layers each side over the same sub-stack | not a fab's published build |

`agentee stackups` lists them (`--fab`, `--layers`, `--thickness`, `--search`) and
`agentee stackups NAME` prints one preset's layers; over MCP it is the `stackups` tool. Names
match without regard to case. `jlcpcb-4l-1.6mm-7628` and `jlcpcb-4l-1.6mm-3313` are the old names
of `JLC04161H-7628` and `JLC04161H-3313`.

JLCPCB layer thicknesses come from the data behind jlcpcb.com/impedance. Their er comes from the
calculator guide: Nan Ya NP-155F by core thickness and prepreg for 4 to 8 layers, Shengyi
S1000-2M for 10 and more. Where a table lacks an entry the value is the other system's for the
same prepreg, or the nearest core thickness in the same system. PCBWay thicknesses are after
lamination, split between stacked prepreg plies by their raw thickness, with the DK printed on
each build. Loss tangent is 0.02 throughout; neither fab publishes it per build.
`crates/agentee-core/stackups/fetch.py` refetches both.

Or list the layers yourself, top to bottom. Use either `preset` or `layers`, not both.

```toml
[stackup]
[[stackup.layers]]
kind = "silk"
[[stackup.layers]]
kind = "mask"
thickness = "15um"
er = 3.8
[[stackup.layers]]
kind = "copper"                # named F.Cu, In1.Cu ... B.Cu in order, or set `name`
thickness = "1oz"
[[stackup.layers]]
kind = "prepreg"               # prepreg | core
material = "7628"
thickness = "0.2104mm"
er = 4.4
loss_tangent = 0.02
# ... more copper and dielectric ...
```

Layer kinds: `silk`, `paste`, `mask`, `copper`, `core`, `prepreg`. Copper must alternate with
dielectric; mask, paste and silk sit outside the outer copper.
