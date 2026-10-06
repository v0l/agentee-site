A controlled impedance line is a promise between three things: the stackup, the track width and the copper around it. agentee keeps the promise in one place, the net class, and checks every track of the class against it.

## Ask first

```sh
agentee calc impedance --layer F.Cu --target 50ohm
agentee calc impedance --layer F.Cu --target 90ohm --gap 0.15mm
agentee calc trace-width --current 2A
```

These read the board in the project. The first answers a width for a 50 ohm microstrip on the top layer; the second for a 90 ohm differential pair at a 0.15 mm gap:

```json
{
  "geometry": { "er": 4.4, "h_mm": 0.2104, "kind": "microstrip", "t_mm": 0.035 },
  "line": { "coplanar_gap_mm": null, "diff_gap_mm": 0.15 },
  "target_ohm": 90.0,
  "width_for_target_mm": 0.2682
}
```

The closed forms are Hammerstad-Jensen for microstrip, Wheeler for stripline and conformal mapping for grounded coplanar, all uncoated. They ignore solder mask and, on thin prepreg, can be several ohms off.

## Solve the field

```sh
agentee calc field --netclass RF
agentee calc field --netclass RF --sweep 10MHz,6GHz,21
```

The field solver runs a finite difference Laplace solve of the cross-section on the GPU, with copper thickness, solder mask, coplanar grounds and pairs. It lands within 0.5% of Cohn's exact stripline and 0.4% of Hammerstad-Jensen microstrip, in a fraction of a second:

```json
{
  "closed_form_uncoated_ohm": 51.12,
  "coplanar_gap_mm": 0.2,
  "field": {
    "backend": "gpu",
    "eeff": 3.094,
    "delay_ps_per_mm": 5.87,
    "z0": 49.88
  },
  "solder_mask": true,
  "width_mm": 0.3
}
```

`--sweep` adds a loss table per frequency: R, L, G, C, Z0 and dB per metre and per inch, split into conductor and dielectric loss, with skin effect, copper roughness from the stackup (`roughness` or `huray`) and a causal dielectric model. Without a GPU the 2D solver falls back to the CPU.

## Put the target on the class

```toml
[[netclasses]]
name = "RF"
impedance = "50ohm"
impedance_tolerance = "5%"
coplanar_gap = "0.2mm"
layers = ["F.Cu"]
solver = "field"
```

With `solver = "field"`, check solves the class on every layer it may use and, when it is off, says by how much and what to use:

```text
error: lna.board.toml: lna netclass RF on F.Cu: field solver gives 59.4 ohm with solder mask, outside 50ohm +/- 5%, use track_width = "0.2985mm" (50.2 ohm)
```

Leave `track_width` out and check solves it for the first layer. Where one width does not fit every layer, give `widths = { "In2.Cu" = "0.16mm" }`.

## Hold it on the board

The class is a promise; the layout keeps it. Check measures every track of an impedance class:

- `impedance-trace` is an error when a track's width, its neck-downs, or the copper beside it on an outer layer moves its impedance outside the tolerance. A coplanar line with the pour too far away, or one that necks down too long, is caught here.
- `impedance-width` warns about a track of the class at another width.
- `neckdown` notes a track narrower than its class for a short run into a small pad, which is allowed up to the class `neckdown` length (0.5 mm by default).

`agentee neck NAME` necks down existing track ends that enter a pad narrower than the track, and `--taper` steps the width back up over a short chain.

## Differential pairs

```toml
[[netclasses]]
name = "USB"
impedance = "90ohm"
diff_gap = "0.15mm"
layers = ["F.Cu"]
max_skew = "0.1mm"
```

`diff_gap` makes a class a pair and its impedance differential. Nets ending in `_P` and `_N`, `_DP` and `_DN`, `+` and `-`, or `P` and `N` pair up on their own; otherwise name them in the layout:

```toml
[[pairs]]
p = "USB_DP"
n = "USB_DN"
max_skew = "0.1mm"
```

`calc field --netclass USB` adds a `pair` block: Zdiff, Zcommon, the odd and even mode impedances and delays, the coupling coefficient and the near-end crosstalk of a long line. Check reports each pair's skew in mm and ps, any stretch at the wrong gap beyond `max_uncoupled`, and pairs that run side by side for less than 80% of their length. A pair through series parts, like the AC caps on a USB lane, is measured end to end. `agentee route NAME --nets 'USB_*' --pairs` routes both halves together.

## Length matching

```toml
[[match_groups]]
name = "ddr-dq0"
nets = ["DQ?", "DQS0_*"]
tolerance = "0.5mm"
```

```sh
agentee tune NAME
agentee show pcb:NAME
```

`tune` meanders the short net of every pair over its skew and every match group member short of its target, on the longest straight segments where the bumps clear every other net, and writes the points back into the tracks. On a pair it bumps the stretches where the legs already run apart first. A net over its target is reported, not shortened. `agentee calc serpentine --from 10,5 --to 20,5 --add 2.5mm` gives the points of one meander on a segment you pick. Net lengths and delays are in `show`.

## Interfaces

An interface states what a link must meet, and check measures the copper against all of it at once:

```toml
[[interfaces]]
name = "usb-ss"
preset = "usb3-gen1"
nets = ["SS_TX*", "SS_RX*"]
```

| preset | impedance | skew | vias | other |
|---|---|---|---|---|
| `usb3-gen1`, `usb3-gen2` | 90 ohm +/-7% diff | 5 mil | 2 | 15 mil stubs, 3500 / 3000 mil long, return via within 200 mil |
| `usb2-hs` | 90 ohm +/-10% diff | 50 mil | 4 | 12000 mil long |
| `lvds` | 100 ohm +/-10% diff | | | |
| `rf-50` | 50 ohm +/-10% | | 0 | |
| `cmos` | | | | 2 mm unreferenced |

The USB numbers are TI's high-speed layout guidelines. Beyond the class targets, an interface checks the length end to end, the vias per trace, the via stubs, the run with no reference plane under it, the ground via beside every signal via, and for buses the arrival spread and the window against the clock. It can also read a finished sim: worst insertion and return loss and mode conversion from an FDTD run, eye height and width from a channel sim. See [Eye diagrams, PDN and S-parameters](/guides/signal-integrity/).

`tune` works on interfaces in time as well as length: a pair over its skew in ps, and a bus outside its clock window, get the short side lengthened at each net's own delay per mm.
