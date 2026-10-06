The board spec is the first file of a design and the one everything else is checked against. It names the fab, the stackup, the outline, the via types and the net classes. Get it right first: a layout routed against the wrong stackup has the wrong impedance on every controlled line.

```sh
agentee new board sensor-node
```

## Pick a fab

```toml
name = "sensor-node"
fab = "jlcpcb"
```

`fab` picks a rule preset: `generic`, `jlcpcb` or `hdi`. The preset is a table keyed by the copper layer count, the outer copper weight and the finish, so a four layer 1 oz board gets tighter track rules than a two layer 2 oz one. The `jlcpcb` values follow JLCPCB's capability page line by line; the [rules reference](/reference/rules/) gives each value with the line it comes from, and the few places agentee is stricter on purpose.

Override any rule in `[rules]`:

```toml
[rules]
min_track_width = "0.15mm"
min_clearance = "0.15mm"
```

## Pick a real stackup

Do not type layer thicknesses in. Pick the fab's own build:

```sh
agentee stackups --fab jlcpcb --layers 4
agentee stackups --fab jlcpcb --layers 6 --thickness 1.6
agentee stackups JLC04161H-7628
```

The presets cover every JLCPCB impedance build from 4 to 20 layers and 0.4 to 3.0 mm, the PCBWay standard builds from 4 to 18 layers, and two generic HDI builds. JLCPCB presets go by the fab's own code, `JLC04161H-7628`: layers, thickness, outer and inner copper, prepreg. The last command prints one preset's layers with their thickness and permittivity.

```sh
agentee edit board sensor-node stackup --preset JLC04161H-7628 --finish ENIG
```

Order the board with the same build: if JLCPCB uses another stackup, every impedance you solved is off.

## Outline, cutouts and holes

```sh
agentee edit board sensor-node outline --size 50,30 --corner-radius 1mm
```

```toml
[[outline.cutouts]]
origin = [20, 12]
size = [6, 2]
corner_radius = 1              # half the width makes a slot
```

An outline is a rectangle with `size`, `origin` and `corner_radius`, or a polygon of `points`. A cutout is a window, slot or large hole routed through the board, and everything that cares about the edge (copper to edge, pads, pours, the router, the sims) treats a cutout's edge as board edge. A cutout in the layout file is different: it only keeps pours off an area on some layers.

## Via types

```toml
[[vias]]
name = "std"
drill = "0.3mm"
diameter = "0.6mm"
```

A board can list several via types. A through via needs nothing more; blind, buried and microvias need an HDI fab and are covered in [HDI: microvias and lamination](/guides/hdi/).

## Net classes

A net class is what a net is: its track width, clearance, vias and the targets check holds it to. Give every kind of net its own class. A net left in `Default` is a warning, because the class decides how it is routed.

```sh
agentee edit board sensor-node class Signal --track-width 0.2mm --clearance 0.2mm --via std
agentee edit board sensor-node class Power --current 2A --max-temp-rise 10C
agentee edit board sensor-node class USB --impedance 90ohm --diff-gap 0.15mm --layers F.Cu
agentee edit board sensor-node class RF --impedance 50ohm --coplanar-gap 0.2mm --solver field --layers F.Cu
```

`class` edits the class of that name in place or adds it. What the targets do:

- `current` is checked against IPC-2221 on every layer the class may use, at `max_temp_rise` (10 C by default). Inner layers carry less than outer ones, and check names the width that carries it on each:

```text
error: blinky.board.toml: blinky netclass Power on In2.Cu: 0.6mm carries only 0.451A for a 10C rise, 1A needs 1.7994mm (IPC-2221)
```

- `impedance` is checked on every layer in `layers`. Leave `track_width` out and check solves it on the first layer; give `widths` per layer where one width does not fit every layer.
- `diff_gap` makes the class a differential pair, and its impedance the differential impedance.
- `coplanar_gap` makes it grounded coplanar: the pour keeps that gap either side, with the plane below.
- `solver = "field"` checks the class with the GPU field solver, which includes solder mask and copper thickness, instead of closed form formulas.

## See what the stackup gives

```sh
agentee check
agentee show board:sensor-node
```

`show` prints the resolved board as JSON: for each class and layer the trace geometry (microstrip on the outer layers, stripline inside), the impedance, the width that meets the target and the current it carries. When a class is off target, check says by how much and what to use:

```text
error: lna.board.toml: lna netclass RF on F.Cu: field solver gives 59.4 ohm with solder mask, outside 50ohm +/- 5%, use track_width = "0.2985mm" (50.2 ohm)
```

Paste the width, rerun check. [Controlled impedance and pairs](/guides/impedance/) goes further.

## Design rule settings

Layout checks come from a registry of rules, each with an id, a category and a default severity. The board can turn them off or change their severity:

```toml
[drc]
disable = ["silk-width"]
severity = { "starved-thermal" = "error", "via-in-pad" = "warning" }
```

`agentee drc NAME --list` prints every rule with whether it applies to this board and why. The [design rule checks reference](/reference/drc/) lists them all.

## Checklist

- `fab` set, and a stackup `preset` the fab actually builds.
- One class per kind of net: signal, power, ground, each impedance, each pair.
- Impedance and current targets on the classes, not widths worked out by hand.
- `solver = "field"` on every class where a few ohms matter.
- `agentee check` clean before the schematic starts naming classes.
