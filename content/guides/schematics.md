A schematic in agentee is a list of parts and a list of nets. A net is a name, a class and the pins it joins. Wires are drawn for you when the schematic is rendered, so nothing about the circuit depends on where a line was dragged.

```toml
name = "lna"
board = "lna"

[[parts]]
ref = "U1"
symbol = "SPF5189Z"
value = "SPF5189Z"
at = [66.04, 50.8]
rotation = 90
fields = { mpn = "Qorvo SPF5189Z" }

[[nets]]
name = "RF_OUT"
class = "RF"
pins = ["C2.2", "J2.1", "L3.1"]
```

`board` names the board spec, which is where the net classes come from. Set it first.

## Edit with commands

`agentee edit sch` writes the file for you, keeps its comments and layout, and checks what it changed. It refuses a pin, symbol or class that does not exist before writing anything, so a typo never becomes a new net.

```sh
agentee edit sch NAME add R1 R 10k --footprint R_0402_1005Metric --at 25.4,25.4
agentee edit sch NAME net VBUS C1.1 U1.7 --class Power
agentee edit sch NAME connect R1.2 FB
agentee edit sch NAME nc U2.3
agentee edit sch NAME note "FB divider sets 3.3 V"
agentee edit sch NAME --list
agentee edit sch help
```

The commands are `add`, `remove`, `move`, `set`, `net`, `connect`, `disconnect`, `nc`, `unnc` and `note`. A pin is `REF.PIN`, by number (`U1.3`) or by a unique pin name (`U1.VCC`). A name several pins share, like `GND` on a regulator with two ground pins, is an error that lists the numbers. Giving a pin a net it is already on moves it to the new net.

`add` places a part to the right of everything there, on the 1.27 mm grid. `--at X,Y` puts it somewhere else and snaps to the grid. `--list` prints the parts and nets as JSON, and `--json` on any command returns the resolved pins and coordinates.

## Batches

More than a part or a net at a time, write the commands as a list. One load, one check at the end, so the half-built states in between are never reported:

```sh
agentee edit sch - <<'EOF'
add U1 AP2112K-3.3 AP2112K-3.3 --footprint SOT-23-5
add C1 C 1u --footprint C_0402_1005Metric
add C2 C 1u --footprint C_0402_1005Metric
net VBUS U1.VIN U1.EN C1.1 --class Power
net 3V3 U1.VOUT C2.1 --class Power
net GND U1.GND C1.2 C2.2 --class Ground --style power
note "LDO, 600 mA"
EOF
```

```text
added U1 (AP2112K-3.3)
added C1 (C)
added C2 (C)
VBUS now joins U1.1, U1.3, C1.1
3V3 now joins U1.5, C2.1
GND now joins U1.2, C1.2, C2.2
noted: LDO, 600 mA
warning: ./power.sch.toml: power part U1: body overlaps C1 (parts[1])
0 errors, 1 warnings in the files this touched
```

The pin names resolved to numbers, and the output says which. The third argument of `add` is the value; a symbol with no default value needs one.

`agentee edit sch build.txt` does the same from a file. Batches work on the one schematic the project has. With several, run each command on its own and name the schematic: `agentee edit sch power add U1 AP2112K-3.3 AP2112K-3.3 --footprint SOT-23-5`.

## Classes on every net

Every net gets a `class` from the board. A net in `Default` is a warning, whether it names no class or names `Default`, because the class decides its width, clearance, vias and routing order on the board. Have a class per kind of net: `Signal`, `Power`, `Ground`, `Clock`, `RF`, each pair.

`--style power` draws a net with ground or supply symbols instead of wires, and `--style label` with net labels.

## Open pins

A pin left out of every net is reported. Pins that are open on purpose go in `no_connect`:

```sh
agentee edit sch NAME nc U2.7 U2.8
```

## Rails and the signal level check

Give logic and MCU symbols a `[levels]` table from the datasheet (see [Parts](/guides/parts/)), and the schematic a `rails` table:

```toml
rails = { GND = 0, "3V3" = [3.25, 3.35], VBUS = [4.75, 5.25] }
analog = ["U1.13"]
```

Check then works out the voltage every input with levels sees, at the worst corner of its rails and resistor tolerances (1% unless the part has a `tolerance` field), through switches in every state, open collector outputs off and low, internal pulls and input leakage. It is an error when an input:

- can sit between VIL and VIH, like a divider that lands in the middle,
- floats with nothing tying it to a rail,
- is moved out of a valid level by leakage through a pull that is too weak,
- can go past its `min` or `max`.

Within 100 mV of a threshold is a warning. Inputs listed in `analog` are read by an ADC, so only their limits apply. A net with something on it the check cannot model, like an output or a connector, is skipped rather than guessed.

## Sheets

Past a few dozen parts, give each section its own schematic and list them in a top one. The layout places the top one.

```toml
name = "sdr"
board = "sdr"
sheets = ["power", "fpga", "rf", "usb"]
```

Each sheet is an ordinary schematic file. Nets join across sheets by name, so `3V3` on every sheet is one net. A net's pins must be on the sheet that lists them, references are unique across the design, and a net that spans sheets needs the same class wherever it names one. A sheet on its own skips the single-pin and Default class warnings, since the rest of the net may be elsewhere; the top schematic runs every check on the joined design.

## Hand-drawn wires

Leave `wires` out and agentee routes them. If you want a particular drawing, give the net its own `wires = [[[x, y], [x, y]], ...]`, and check verifies they reach every pin and touch no other net.

## Look at it

```sh
agentee render sch:NAME -o sch.png
agentee show sch:NAME
```

`show` prints every pin's position, which is what an agent needs to place a part next to another.

## What check reports

Pins in two nets, pins in no net, single-pin nets, several outputs on one net, hand wires that miss a pin or touch another net, overlapping parts, footprints whose pads do not cover the symbol's pins, nets in `Default`, and the signal levels when `rails` is set.
