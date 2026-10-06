The lamination is the build-up sequence: the drill steps the fab runs between presses, in build
order, each a copper span and a drill kind (`mechanical`, `laser` or `controlled_depth`). A via is
drillable only when its span and drill kind match a step (a `stacked` microvia: when every hop of
the stack is a laser step). A via type a layout places is reported once, by the layout's
`via-lamination` rule, which counts its vias and names the board entry (`vias[i]`) to fix; Check
reports a via type no layout places as a board error. The router leaves such a class via out.
Each lists the spans the lamination drills.

Without `lamination` the sequence comes from the stackup. The build-up layers on each side are the
prepreg-only dielectrics on the outside before the first core, counted per side, so a build can be
asymmetric (`1+4+2`); the `N` layers between are the core sub-stack, pressed once from its cores
and prepregs. The steps are:

1. each core of the sub-stack, drilled mechanically before its press (a buried via in one core);
2. the sub-stack, mechanically, after its press;
3. for each press of build-up layers, inside out: a laser step from each new outer layer to the
   layer under it (and over two dielectrics, a skip via, from that side's second build-up layer
   on), then a mechanical step through everything pressed so far; the last is the through drill.
   The side with fewer build-up layers joins the later presses, so both outer foils go on in the
   last press: on `1+4+2` the first press adds In5.Cu under B.Cu alone, the second F.Cu and B.Cu;
4. controlled depth from F.Cu and from B.Cu to every inner layer, after the last press.

On `hdi-6l-1n1` (1+4+1) that is In1.Cu-In2.Cu and In3.Cu-In4.Cu (cores), In1.Cu-In4.Cu (buried,
the sub-stack), laser F.Cu-In1.Cu and In4.Cu-B.Cu, the through drill F.Cu-B.Cu, and the controlled
depth spans. On `hdi-8l-2n2` (2+4+2) the first build-up adds laser In1.Cu-In2.Cu and
In5.Cu-In6.Cu and a buried In1.Cu-In6.Cu, the second laser F.Cu-In1.Cu, In6.Cu-B.Cu and the skip
vias F.Cu-In2.Cu and In5.Cu-B.Cu, so a stacked microvia F.Cu-In2.Cu is two laser steps, while
F.Cu-In2.Cu on `hdi-6l-1n1` would cross its first core. A stackup with no core, or a core
outermost, is one press: its sub-stack is the whole board. Whether the fab stacks microvias or
wants them staggered stays `stacked_microvias`.

`lamination` lists the steps instead, for a build the stackup does not show (a sub-stack pressed
on one side first, a laser step into a core):

```toml
[stackup]
preset = "hdi-6l-1n1"
lamination = [
  { from = "In1.Cu", to = "In4.Cu", drill_kind = "mechanical" },
  { from = "F.Cu", to = "In4.Cu", drill_kind = "mechanical" },   # F.Cu to In4.Cu pressed first
  { from = "F.Cu", to = "B.Cu", drill_kind = "mechanical" },
]
```

`from` is above `to`, a controlled depth step runs from one outer layer to an inner layer. The
steps are in build order, and a stack is only built from the inside out: a `stacked` microvia type
whose outer hop is drilled at an earlier step than the hop under it is an error, and `stacked-via`
reports two vias at one spot where the via under the stack is drilled after the one on top (see
Via types). The derived sequence is always in build order.
