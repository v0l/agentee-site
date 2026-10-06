```toml
name = "LM358"
reference = "U"                # designator prefix
value = "LM358"                # default: name
description = "Dual op amp"
datasheet = "https://..."
keywords = ["opamp", "dual"]
footprint = "SOIC-8_3.9x4.9mm_P1.27mm"
footprint_filters = ["SOIC*3.9x4.9mm*"]
pin_names = "inside"           # inside | outside | hidden
# pin_name_offset = 0.508
# hide_pin_numbers = true
# power = true                 # a power flag symbol like GND

[[graphics]]
kind = "polygon"
points = [[-5.08, -5.08], [5.08, 0], [-5.08, 5.08]]
fill = "background"            # none | solid | background
unit = 1                       # 0 or absent: drawn in every unit

[[pins]]
number = "3"
name = "+"
type = "input"
at = [-7.62, -2.54]            # the connection point, where wires land
side = "left"                  # left | right | top | bottom of the body
length = 2.54                  # default 2.54
unit = 1
# shape = "inverted"           # line | inverted | clock | inverted_clock | input_low | clock_low | output_low | edge_clock_high | non_logic
# hidden = true
```

`side` says which edge of the body the pin sticks out of. A `left` pin runs from `at` rightwards to
the body. Keep connection points on the 1.27 mm grid (2.54 mm is better).

Pin types: `input`, `output`, `bidirectional`, `tri_state`, `passive`, `free`, `unspecified`,
`power_in`, `power_out`, `open_collector`, `open_emitter`, `no_connect`.

Names take `~{...}` for an overbar: `~{RESET}`.

## Generated bodies

For a box symbol, list pins per side and let agentee place them on the grid and size the body.
Each entry is a pin, or `{ gap = N }` to leave N empty slots.

```toml
name = "STM32F103C8"
reference = "U"

[[bodies]]
unit = 1                       # optional, one [[bodies]] per unit
# width = 20.32                # minimum body width
# pin_length = 2.54
left = [
  { number = "7", name = "NRST", type = "input" },
  { gap = 1 },
  { number = "10", name = "PA0", type = "bidirectional" },
]
right = [ { number = "30", name = "PA9", type = "bidirectional" } ]
top = [ { number = "1", name = "VBAT", type = "power_in" } ]
bottom = [ { number = "8", name = "VSS", type = "power_in" } ]
```

Bodies and hand-placed `[[pins]]` / `[[graphics]]` can be mixed.

Multi-unit symbols: give pins and graphics a `unit`. The same pin number may appear in more than
one unit only when it has the same name (a shared pin).

## Logic levels

A symbol can state the input thresholds of its pins, for the schematic's signal level check.
`[levels]` applies to every `input` and `bidirectional` pin; a pin's own `levels` table overrides
it field by field, and puts any pin type under the check.

```toml
[levels]
supply = "VDD"                 # pin name or number whose rail the % levels scale with
vih = "75%"                    # of the supply; or volts, "2.0V"
vil = "25%"
min = "-0.3V"                  # absolute limits, sums allowed: "100%+0.3V"
max = "100%+0.3V"
leakage = "50nA"               # input leakage, either way
# pull_up = "45k"              # a fixed internal pull to the supply
# pull_down = "45k"

[[pins]]
number = "12"
name = "NRST"
type = "input"
at = [-7.62, 0.0]
side = "left"
levels = { vih = "70%", pull_up = "45k" }
```

Only pins with levels are checked; nothing is assumed for a symbol without them.
