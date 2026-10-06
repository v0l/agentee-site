A layout places the schematic's footprints on the board and joins them with copper. Every command here writes ordinary entries into the `*.pcb.toml`, so whatever the placer or router did, you or the agent can edit afterwards.

```sh
agentee new layout NAME
```

Add `board` and `schematic` to the starter. Check then reports every part that is not placed yet.

## Place

```sh
agentee place NAME
agentee render pcb:NAME -o placed.png
```

`agentee place` is a quick start for a whole board. In order of priority, it:

- puts connectors on the edges with the mating side out, and never an RF connector and a USB connector on one edge if another split fits, since USB 3 noise lands in the 2.4 GHz band;
- lays an RF path in a straight line from connector to connector, with shunt parts beside the line at their node;
- pulls large chips to the centre, away from the edges and holes where depaneling bends the board;
- clusters each IC's decoupling caps at the supply pins they serve, and its crystal at its clock pins;
- keeps switching regulators 8 mm from crystals and RF parts, and hot parts apart;
- keeps 0805 and larger ceramic capacitors out of the flex zone near edges and holes, and turns small ones to lie along the edge;
- turns every part toward its nets.

The [placement reference](/reference/placement/) gives the source for each rule. The result depends only on the files and `--seed`.

Then do what a person would: look at it, move the parts that matter, and lock them.

```sh
agentee edit pcb NAME place J1 2.54,12 --rotation 180 --locked
agentee place NAME --keep-placed
agentee place NAME --seed 7
agentee place NAME --parts 'C*,R*'
agentee place NAME --side both
```

`locked = true` is never moved. `--keep-placed` leaves every part that already has a spot, `--parts` places only the matching ones, and `--side both` lets decoupling caps go under a BGA on the back. `[place] edges` in the layout pins a connector to an edge, and `keepouts` are polygons no courtyard may enter:

```toml
[place]
edges = { J1 = "left", J2 = "right" }
keepouts = [[[0, 0], [8, 0], [8, 6], [0, 6]]]
```

## Pours and planes

```sh
agentee edit pcb NAME zone GND --layers F.Cu,In1.Cu,In2.Cu,B.Cu
agentee edit pcb NAME zone 3V3 --layers In2.Cu --priority 1
```

A zone fills its outline (the board by default) less every other net's copper grown by its clearance, as exact polygons with round corners. Necks narrower than the zone's `min_width` are removed, the way a fab would etch them, and islands that reach nothing are dropped. On one layer, zones fill by `priority`, so a supply pour inside a board-wide ground pour is poured around rather than shorted to it. `--pad-connection relief` joins pads by four spokes instead of solid copper.

Fills are computed on load and cached. `agentee fill NAME` stores them at the end of the layout file, so a fresh checkout loads without filling.

## Tie pads to their planes

```sh
agentee tie NAME
```

A net with a zone is a plane net. `tie` gives every SMD pad of a plane net a short stub and a via beside it, on the side away from the part, clear of every pad and other net. That is how ground and supply pads should reach a plane, instead of tracks between them. A pad that already has a via of its net close by is left alone, and a pad with no legal spot is listed under `failed`.

## Route

```sh
agentee route NAME --nets 'USB_*,SPI_*' --layers F.Cu,B.Cu
agentee route NAME --nets '*'
```

The router works on a 0.05 mm grid and keeps each class's width, clearance, layers and vias against everything already there. It steps in 45 degree directions, charges for vias and bends, pulls runs tight afterwards, and necks a track down into a pad that is narrower than the class width. A connection with no free path rips up what is in its way and those nets go back in the queue.

- A glob in `--nets` never matches a plane net, so `--nets '*'` routes every signal and leaves ground to the planes.
- Existing copper is never moved, unless `--reroute` deletes the named nets' tracks and vias first.
- When a few connections fail, route them again together with the nets around them and `--reroute`, or drop to `--grid 0.025`.
- `--pairs` routes differential pairs as coupled pairs where they fit.
- `--via-in-pad` lets a via sit inside an SMD pad of its net, filled and capped.
- `--dry-run` reports without writing.

Route the nets that matter by hand first: an RF line, a switcher's hot loop, a crystal. Then let the router fill in the rest, a class at a time.

By hand, tracks and vias are commands too:

```sh
agentee edit pcb NAME track RF_OUT F.Cu 19.28,12 30.92,12
agentee edit pcb NAME via GND 7.2,8.9
```

A track has to run into a pad. One whose centre line only grazes the pad edge is flagged even though the copper touches.

## Stitching and fanouts

```toml
[[stitching]]
net = "GND"
pitch = "2.5mm"

[[stitching]]
net = "GND"
fence = ["RF_*"]

[[fanouts]]
ref = "U3"
skip_rings = 2
```

`[[stitching]]` places ground vias on a grid wherever they clear every other net, or a fence of them along the tracks of the named nets. `[[fanouts]]` puts a via in every connected pad of a BGA, leaving the outer rings for escape on the top layer. Both are rules: the vias are placed again whenever the copper around them changes. `agentee edit pcb NAME stitch GND --pitch 2.5mm` and `fanout U3 --skip-rings 2` write them.

## Silk

Check flags every reference label that crowds other text, sits on a pad or a via, or runs off the board, and names a spot that passes. `agentee silk` moves them all there:

```sh
agentee silk NAME
agentee silk NAME --hide
```

`--hide` hides the labels with nowhere to go, typically small passives under a BGA.

Every board also carries `agentee vX.Y.Z-HASH` in its silk, on the bottom by default. It needs a clear strip about 23 by 1.2 mm; on a small or crowded board, clear room for it or set `[watermark] at` yourself. The fab package is refused without it.

## Test pads

```sh
agentee testpoints NAME
agentee testpoints NAME --nets '3V3,*RST*' --side B --pitch 2.54
```

Every board needs probe access for bring-up and a pogo-pin fixture for production test. By default that is the power rails, ground, resets, enables, power good, clocks and the low-speed buses; switch nodes and regulator feedback are left out on purpose. `testpoints` adds a `TP` part in the schematic, a 1 mm pad on the probe side near the net's copper, and a routed track to it, for each net that has no access yet. Impedance nets and pairs are skipped, since a stub hurts them.

## Design rule checks

```sh
agentee check --item pcb:NAME
agentee drc NAME
agentee drc NAME --list
```

`check` runs every rule; `drc` prints only the layout's rule diagnostics, each starting with its id in brackets, and `--list` prints every rule with whether it applies to this board. Errors block the fab package. Warnings and notices are practice rather than fab limits: follow them unless the design gives a reason, and write the reason in `DESIGN.md`.

Routing is finished when `unrouted` is 0 on every net in `agentee show pcb:NAME`.

## Untangling a chip's pins

```sh
agentee pinswap NAME --part U3
agentee pinswap NAME --part U3 --write
```

`pinswap` reassigns an FPGA's or MCU's swappable I/O (same bank, pairs as pairs, clock pins kept on clock pins) to untangle the ratsnest, and `--write` rewrites the schematic's pin references.

## The layout engine

`agentee layout NAME` runs the configured stages of the layout engine in order (constraints, place, access, global route, detail route, finish) and prints a score per term with the worst offenders of each. `--from`, `--to` and `--only` pick the stages. It is newer than `place` and `route`; the stages and their settings are in the layout's `[engine]` table, and the viewer can run them on the layout as it stands in the window.
