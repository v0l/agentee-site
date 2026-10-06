Parts are placed symbols; nets list the pins they join. Wires are drawn for you on a 1.27 mm
grid unless you give them.

```toml
name = "lna"
board = "lna"                  # net classes come from this board
no_connect = ["U2.7"]          # pins left open on purpose

[[parts]]
ref = "U1"
symbol = "SPF5189Z"
value = "SPF5189Z"
at = [66.04, 50.8]             # keep on the 1.27 mm grid
rotation = 90                  # 0, 90, 180, 270, counter-clockwise
mirror = true                  # flip left to right before rotating
# unit = 2                     # one [[parts]] per unit of a multi-unit symbol, same ref
# footprint = "SOT-89-3"       # default: the symbol's footprint
# dnp = true
fields = { mpn = "Qorvo SPF5189Z" }

[[nets]]
name = "RF_OUT"
class = "RF"                   # a netclass of the board; without one the net is in "Default"
pins = ["C2.2", "J2.1", "L3.1"]   # REF.PIN, by number or by a unique pin name
# style = "power"              # wire (default) | label | power (ground and supply symbols)
# wires = [[[x, y], [x, y]], ...] # draw it yourself; check verifies it reaches every pin
```

Rails and analog inputs, for the signal level check, go at the top of the file (or the top
schematic of a sheet set):

```toml
rails = { GND = 0, "3V3" = [3.25, 3.35], VBUS = [4.75, 5.25] }   # volts, or [min, max]
analog = ["U1.13"]             # inputs read by an ADC: only min and max apply
```

With `rails` set, check works out the voltage every input with `levels` sees: resistors (`R`
parts, 1% unless the part has a `tolerance` field), switches (`SW` parts, every open and closed
state), open collector outputs (off and low), internal pulls and input leakage, each at its worst
corner across rail and resistor ranges. It is an error when the input can sit between VIL and VIH,
when it floats with nothing tying it to a rail, when leakage through a weak pull moves it out of a
valid level, and when it can go past its `min` or `max`. Within 100 mV of a threshold is a
warning. A net with anything else on it (an output, a connector, a diode, a supply pin of a net not
in `rails`) is driven by something it cannot model and is skipped. Capacitors and test points are
ignored. A bidirectional pin may be driving: unless a switch or open collector on the net shows
it is pulled, the other inputs on its net are skipped and it is not reported as floating.

## Sheets

Split a large design into one schematic per section and join them in a top schematic that lists
them. The layout places the top one.

```toml
name = "sdr"                   # sdr.sch.toml
board = "sdr"
sheets = ["power", "fpga", "rf", "usb"]
```

Each sheet is an ordinary schematic file with its own parts and nets. Nets join across sheets by
name, so `3V3` on every sheet is one net and a signal leaves one sheet and arrives on another
under the same name. A net's pins must be parts on the same sheet; a net that spans sheets needs
the same `class` wherever it names one, and is drawn with labels. References are unique across
the design. A sheet on its own skips the single-pin and Default class warnings (the rest of the net, and its
class, may be on another sheet);
the top schematic runs every check on the joined design and draws the sheets stacked top to
bottom. The top file may hold parts and nets of its own too.

Check reports pins in two nets, pins in no net, single-pin nets, several outputs on one net,
hand wires that miss a pin or touch another net's pin, overlapping parts, footprints whose
pads do not cover the symbol's pins, and signal levels when `rails` is set. Every net in the `Default` netclass is a warning, whether it
names no class or names `Default`: the class sets the net's width, clearance, vias and routing
order, so each net should say what it is. The warning needs a board and a layout of the
schematic; a schematic only simulated (like `examples/logic`) skips it. Give the board a class
per kind of net (`Signal`, `Data`, `Clock`, `Analog`, `Ground`, `Power`, `RF`, pairs) and keep
`Default` as the fallback the layout uses for rules no class covers. `agentee show sch:lna` prints every pin's position.
