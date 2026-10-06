Every part on a board is two files: a symbol for the schematic and a footprint for the layout, joined by pin number. Import them from KiCad whenever KiCad has the part, and draw them from the datasheet when it does not.

## Search

```sh
agentee search symbol lm358
agentee search footprint soic 3.9x4.9
```

Every word must appear in `Library:Name`, so add words to narrow a search: `soic 3.9x4.9` finds the narrow SOIC-8 bodies and skips the wide ones.

## Import

```sh
agentee import symbol Amplifier_Operational:LM358 --with-footprint
agentee import symbol Device:R --footprint Resistor_SMD:R_0402_1005Metric
agentee import footprint Package_TO_SOT_SMD:SOT-89-3
```

`--with-footprint` brings the symbol's default footprint along; `--footprint` picks another one and links it. Symbols land in `symbols/`, footprints in `footprints/`. `--force` overwrites a file you already have. A path to a `.kicad_sym` (with `:Name`) or a `.kicad_mod` works in place of `Library:Name` for vendor libraries.

Run check straight after. The usual finding is silk:

```text
warning: ./footprints/R_0603_1608Metric.fp.toml: R_0603_1608Metric silk: silk lines under the fab minimum width 0.15mm: 2, thinnest 0.12mm
```

KiCad draws silk at 0.12 mm and JLCPCB prints 0.15 mm. Widen the `width` of the footprint's silk graphics. The other common one is courtyard or pad spacing against a coarse fab; fix it in the footprint, where it belongs, not with a rule override.

## Generic parts are shared

One `R` symbol serves every resistor and one `C` symbol every capacitor. The value and footprint go on the part in the schematic:

```sh
agentee edit sch NAME add R1 R 10k --footprint R_0402_1005Metric
agentee edit sch NAME add C1 C 100n --footprint C_0402_1005Metric
```

If a schematic names a symbol the project lacks but gives a footprint some symbol already uses, `add` takes that symbol, so an agent that writes `--footprint C_0402_1005Metric` for a capacitor gets the right one.

## Drawing a symbol

```sh
agentee new symbol STM32F103C8
```

For a box symbol, list the pins per side and let agentee place them on the grid and size the body. This is the example from the reference, cut down:

```toml
name = "STM32F103C8"
reference = "U"

[[bodies]]
left = [
  { number = "7", name = "NRST", type = "input" },
  { gap = 1 },
  { number = "10", name = "PA0", type = "bidirectional" },
]
right = [ { number = "30", name = "PA9", type = "bidirectional" } ]
top = [ { number = "1", name = "VBAT", type = "power_in" } ]
bottom = [ { number = "8", name = "VSS", type = "power_in" } ]
```

`{ gap = N }` leaves N empty slots. Pins can also be placed by hand with `[[pins]]` (`number`, `name`, `type`, `at`, `side`), and the two can be mixed. Keep connection points on the 1.27 mm grid; off-grid pins are flagged. Multi-unit symbols give pins and graphics a `unit`.

Pin types matter: check uses them for the net checks, and `open_collector` outputs and `input` pins take part in the signal level check.

### Logic levels

For logic and MCU parts, copy the thresholds from the datasheet into a `[levels]` table. Check then works out the voltage every input sees across its rails, resistors and switches, and reports an input that can sit between VIL and VIH, float, or go past its limits:

```toml
[levels]
supply = "VDD"
vih = "70%"
vil = "30%"
min = "-0.3V"
max = "100%+0.3V"
leakage = "1uA"
```

A pin's own `levels` table overrides the symbol's, for a reset pin with an internal pull-up, say. The [schematics guide](/guides/schematics/) shows the other half, the `rails` table.

## Drawing a footprint

```sh
agentee new footprint SOIC-8_3.9x4.9mm_P1.27mm
```

Write pads as rows rather than one entry each. The SOIC-8 from the reference:

```toml
[[pads]]
number = "1"
kind = "smd"
shape = "roundrect"
at = [-2.475, -1.905]
size = [1.95, 0.6]
count = 4
pitch = [0, 1.27]

[[pads]]
number = "5"
kind = "smd"
shape = "roundrect"
at = [2.475, 1.905]
size = [1.95, 0.6]
count = 4
pitch = [0, -1.27]
```

The second row counts 5 to 8 back up the other side. Rows count up the trailing digits, so BGA balls work the same way (`A1`, `A2`, ...), and `number_step = 2` counts by two.

Draw the courtyard on `F.CrtYd` and the body outline on `F.Fab`: check needs a courtyard that encloses the pads, the placer keeps courtyards apart, and the edge and assembly rules measure from the body. Set `height` so the 3D view and the tall-part rule have a height without a model.

Useful footprint keys:

- `edge = true` on a pad whose copper is meant to reach the board edge (edge-launch connectors, castellations).
- `overhang = true` on a connector meant to hang over the edge.
- `mask_web = false` when the fab opens the mask over all pads of a fine pitch part as one window.
- `zone_connect = "solid"` or `"relief"` on a pad, over the zone's own setting.
- `model` naming a STEP or VRML file, a KiCad path, or an `https://` URL pinned to a commit.

## Every pin needs a pad

Pad nets come from the schematic by number: pin 3 of the symbol is pad 3 of the footprint. Check reports any pin without a pad. A symbol pin named `EP` or numbered `17` for an exposed pad needs that pad number in the footprint too.

## Part numbers

Give each part in the schematic `mfr` and `mpn` fields, and an `lcsc` field for JLCPCB assembly:

```sh
agentee edit sch NAME set U1 --field mfr=Qorvo
agentee edit sch NAME set U1 --field mpn=SPF5189Z
```

Each `set` adds to the part's `fields` table and keeps what is there. In the file it reads `fields = { mfr = "Qorvo", mpn = "SPF5189Z" }`.

The BOM groups by them, and `agentee parts` looks up stock, price and cheaper equivalents by `mpn`. See [Fab package, BOM and pricing](/guides/fab/).
