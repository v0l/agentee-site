An event-driven simulation of the digital parts of a schematic, straight from its netlist; no
layout is needed. `agentee new sim NAME --kind logic` (MCP `new_item` with `kind = "sim"` and
`sim_kind = "logic"`) writes a starter with a clock, a reset and a clocked assertion to rename
to your nets; `--kind fdtd`, the default, starts an FDTD run instead. `agentee sim NAME` (MCP `run_sim`) writes `NAME.result.json` and a VCD
waveform `NAME.vcd` next to the spec; the viewer draws a trace per recorded net against time.

In the waveform view the mouse wheel (or pinch, or ctrl and the wheel) zooms about the pointer,
a drag or a sideways scroll pans, a double click fits the whole run, and a click sets the time
cursor, snapped to an edge of the row under it within a few pixels. `+` and `-` zoom about the
cursor, the arrow keys pan, `F` or `Home` fits, `Escape` drops the cursor, and `N` and `P` jump
the cursor to the next and previous marker. With more rows than fit, the wheel over the names,
a drag or click on the bar at the right edge, and `Page Up` and `Page Down` scroll the rows
(`top=N` in `--show` starts at row N). The column beside the names reads every row at the
cursor (at the pointer with no cursor, else at the right edge of the view), and the hover tip gives the
time from the cursor. Nets named `X[0]` to `X[n]`, or `X0` to `Xn` (also `X0_N` to `Xn_N`),
fold into one bus row drawn in hex, MSB first, with a nibble of x for any unknown bit and z for
a floating one; so does a `record` entry `{ name, nets }`. Click a bus name to open its bits.
The VCD holds the same buses as vectors in place of their bits: `Q0` to `Q3` as
`$var wire 4 # Q [3:0] $end`, `Y0_N` to `Y7_N` as `Y_N [7:0]` and a `record` bus of n nets as
`NAME [n-1:0]`, MSB first.
Markers along the top show each failed assertion (red, at the time it was checked), timing
violation (amber) and contention (violet), with a dot on the rows of the nets involved; hover
one for its message, click it to put the cursor there. A run keeps its first 10000 markers,
and the header says capped when it reached that. `agentee render NAME --show
from=300ns,to=900ns,cursor=550ns,open=Q[3:0]` draws the same view headless.

```toml
name = "counter"
kind = "logic"
schematic = "counter"          # default: the only top-level schematic
duration = "2us"
ignore = ["J1", "J2"]           # parts with no logic model to leave out
record = ["CLK", "Q3", "Q2", "Q1", "Q0"]   # default every net but the rails
# record = ["CLK", { name = "COUNT", nets = ["Q3", "Q2", "Q1", "Q0"] }]   # a bus, MSB first
# on_violation = "keep"         # default "x": a timing violation makes the flip-flop x

[[stimulus]]
net = "CLK"
clock = { period = "100ns", duty = 0.5, phase = "50ns" }

[[stimulus]]
net = "RST_N"
steps = [["0ns", 0], ["120ns", 1]]   # [time, level] in time order; levels 0, 1, "x", "z"

[[stimulus]]
net = "MODE"
constant = 1

[[expect]]                      # a level at a time
net = "TC"
at = "1600ns"
value = 1

[[expect]]                      # a bus, MSB first: a number or a string of 0 1 x z and - (any)
nets = ["Y7_N", "Y6_N", "Y5_N", "Y4_N", "Y3_N", "Y2_N", "Y1_N", "Y0_N"]
at = "600ns"
value = "11011111"

[[expect]]                      # a sequence sampled on clock edges
nets = ["Q3", "Q2", "Q1", "Q0"]
clock = "CLK"
edge = "rising"                 # or "falling"
from = "0ns"                    # edges before this are skipped
sequence = [0, 0, 1, 2, 3, "01--"]
```

A clock is low until `phase`, then high for `duty` of each `period`; with no phase it starts
high at 0. A stimulus drives its net as a strong driver; on a supply net it replaces the rail.
An `at` check reads the net once everything at that time has settled; a sequence reads the
nets just before each clean edge (0 to 1, or 1 to 0) of the clock, so a registered output is
seen as it was when the edge came. Nets are named as in the schematic, and a net joined to
another through a 0 ohm link answers to either name.

The netlist becomes cells as follows:

- Nets with `style = "power"` and power symbols (a symbol with `power = true`) are constant
  sources: a name with `GND`, or starting `VSS`, `VEE` or `0V`, is 0, any other is 1
  (`PWR_FLAG` is skipped).
- A resistor (`R`) of 0 ohm, a jumper (`JP`, `SJ`, pins 1 and 2) and a net tie (`NT`) join
  their nets into one. Any other resistor between a rail and a net is a pull-up or pull-down, a
  weak driver of the rail's level; between two signal nets it joins them; between two rails it
  is left out.
- Capacitors, inductors, beads, filters, diodes, LEDs, test points, holes, fiducials and
  crystals (`C`, `L`, `FB`, `FL`, `D`, `LED`, `TP`, `H`, `MH`, `FID`, `Y`, `X`) are left out.
- Parts whose value (or else symbol name) holds a 74 series number take the built-in model by
  pin number: `74HC00`, `SN74LVC1G08DBVR` and `CD74HCT04E` all match. The library covers 00,
  01, 02, 03, 04, 05, 06, 07, 08, 10, 11, 14, 20, 21, 27, 32, 74, 86, 125, 126, 132, 138, 157,
  161, 163, 164, 244, 245, 573, 574 and 595, the single gates 1G00, 1G02, 1G04, 1G06, 1G07,
  1G08, 1G14, 1G17, 1G32, 1G34, 1G74, 1G79, 1G80, 1G86, 1G125, 1G126 and 1G157, and the dual
  gates 2G00, 2G02, 2G04, 2G08, 2G14, 2G17, 2G32, 2G34, 2G74, 2G86, 2G125 and 2G126. A unit of a
  multi-unit symbol that is not placed is left out; a placed pin with no net reads as floating
  (z).
- The 14 (and 1G14, 2G14) Schmitt triggers are inverters; the sim has no slow analog edge for
  the hysteresis to act on. The 573 is eight `dlatch` and the 574 eight `dff`, each with the shared `OE`
  (pin 1, active low) floating the outputs. The 245 is eight `xcvr`: with `OE` (pin 19) low it
  drives B from A while `DIR` (pin 1) is high and A from B while it is low. The 01, 03 (quad
  NAND), 05, 06, 1G06 (inverters) and 07, 1G07 (buffers) are open drain: they pull low or let
  go (z), and a pull-up resistor makes the 1. Every 01 has the 7402 pinout (outputs on 1, 4,
  10, 13, inputs after each), per TI SDLS026 (SN7401, SN74LS01) and Renesas REJ03D0532
  (HD74HC01); the 03 has the 7400 one, per TI SCLS077 (SN74HC03).
- A gate whose output pins are all `open_collector` in its symbol is open drain as well.
- Parts whose value or symbol is a primitive name (`AND`, `NAND3`, `OR`, `NOR`, `XOR`, `XNOR`,
  `NOT`, `INV`, `BUF`, `TRIBUF`, `DFF`, `JKFF`, `SRLATCH`, `DLATCH`, `MUX2`) map their pins by
  name: `D`, `CLK` (also `C`, `CP`, `CK`), `S` / `SET` / `PRE`, `R` / `RST` / `CLR`, `EN`, `OE`,
  `Q`, `~{Q}`; a gate's output is its `output` pin (or `Y`, `Q`, `OUT`) and every other signal
  pin is an input. An overbar (`~{R}`), a trailing `#` or `_N`, or an inverted pin shape makes
  the pin active low.
- Any other part is an error naming it, unless it is in `ignore` or has a `[[parts]]` model.

Family timing, from the family letters after 74 (propagation delay, setup, hold, and the
recovery and removal of an asynchronous set or reset):

| Family | Delay | Setup | Hold | Recovery | Removal |
|---|---|---|---|---|---|
| HC, HCT | 10 ns | 15 ns | 3 ns | 8 ns | 0 |
| AHC, AHCT, VHC, VHCT | 6 ns | 5 ns | 1 ns | 3.5 ns | 0 |
| AC, ACT | 6 ns | 4 ns | 1 ns | 2.4 ns | 0 |
| LVC | 4 ns | 3 ns | 1 ns | 2 ns | 0 |
| ALVC, LVT, ALVT, AUC, AVC | 4 ns | 2 ns | 1 ns | 2 ns | 0 |
| AUP, LV, LVX | 6 ns | 3 ns | 1 ns | 3 ns | 1 ns |
| LS and plain 74 | 15 ns | 20 ns | 5 ns | 25 ns | 3 ns |
| others | 10 ns | 10 ns | 2 ns | 10 ns | 2 ns |

Recovery and removal are datasheet minimums over -40 to 85 C at 4.5 V (5 V families) or
3.3 V (LVC), the larger of TI and Nexperia where both list one:

- HC, HCT: 8 ns trec of `nSD`, `nRD` to `nCP`, Nexperia 74HC_HCT74 rev 9 (TI SN74HC74
  SCLS094F gives 6 ns, TI CD74HC74 SCHS124E 8 ns, named trem there).
- AHC, AHCT: 3.5 ns trec of `nRD` to `nCP` for the 74AHCT74 (3.0 ns for the 74AHC74), Nexperia
  74AHC_AHCT74 rev 11 (TI SN74AHC74 SCLS255N gives 3 ns).
- AC, ACT: 2.4 ns trec at 5 V, TI CD74AC74 SCHS231E and CD74ACT74 SCHS321A (TI SN74AC74
  SCAS521H gives 0).
- LVC: 2 ns setup of `PRE` or `CLR` inactive before `CLK`, TI SN74LVC74A SCAS287W (Nexperia
  74LVC74A gives 1.0 ns).
- LS: 25 ns setup of `CLR` inactive and 3 ns hold at any input, TI SN74LS161A SDLS060 (the
  SN74LS74A in SDLS119 lists neither).

None of the CMOS sheets above (nor TI SN74HC161 SCLS297D or Nexperia 74LVC161, whose hold
covers the synchronous inputs only) lists a removal time, so it is 0 there. The AUP, LV, LVX
and other rows take their setup and hold.

Primitives by name and generic symbols take 1 ns and no setup or hold.

A custom part gets a model inline, matched by `ref` or by `value` (every part with that
value). Several entries for one part add a cell each (one per gate of a quad, say). An entry
with only timing keeps the built-in model and changes its timing.

```toml
[[parts]]
ref = "U7"
primitive = "nand"              # a primitive; pins map its pin keys to the part's pins
pins = { A = "1", B = "2", Y = "3" }
delay = "3ns"                   # every output; setup, hold, recovery and removal as well
delays = { Y = "5ns" }          # or per output key

[[parts]]
value = "MYBUF8"
primitive = "74HC244"           # borrow a library pinout

[[parts]]
ref = "U9"
inputs = ["1", "2", "3"]         # pins by number or unique name
outputs = ["4"]
truth = ["000 1", "1-- 0", "01- z"]   # first matching row wins; no match (or an x input) gives x
```

Primitive pin keys (inputs, then outputs); append `_N` to a key for an active-low pin or an
inverted output, and leave out an optional input to hold it inactive:

| Primitive | Inputs | Outputs |
|---|---|---|
| `and`, `or`, `xor`, `nand`, `nor`, `xnor` | any keys but `Y` | `Y` |
| `not`, `buf` | one key | `Y` |
| any gate with `_od` (`nand_od`, `not_od`, `buf_od`) | as the gate | `Y`, open drain: 0 or z |
| `tri` | `A`, `OE` | `Y` (z when `OE` is low) |
| `dff` | `D`, `CLK`, optional `S`, `R`, `OE` | `Q`, `QN` (z when `OE` is low) |
| `jk` | `J`, `K`, `CLK`, optional `S`, `R` | `Q`, `QN` |
| `sr` | `S`, `R` | `Q`, `QN` |
| `dlatch` | `D`, `EN`, optional `R`, `OE` | `Q`, `QN` (z when `OE` is low) |
| `xcvr` | `A`, `B`, `DIR`, optional `OE` | `A`, `B`: the same pins, driven from the other side by `DIR` |
| `mux2` | `I0`, `I1`, `S`, optional `EN` | `Y` |
| `dec138` | `A0`, `A1`, `A2`, `E1`, `E2`, `E3` | `Y0` to `Y7` |
| `counter161`, `counter163` | optional `R`, `CLK`, optional `D0` to `D3`, `CEP`, `LOAD`, `CET` | `Q0` to `Q3`, `TC` |
| `shift164` | `A`, optional `B`, `CLK`, optional `R` | `Q0` to `Q7` |
| `shift595` | `D`, `CLK`, `LATCH`, optional `R`, `OE` | `Q0` to `Q7`, `QS` |

Flip-flops clock on the rising edge (key `CLK_N` for the falling one); `S` and `R` are
asynchronous and both active give Q = QN = 1, as on a 74HC74. The 161 resets at once, the 163
on the next edge. A 595 shifts on `CLK`, copies to its outputs on `LATCH` (the value from before
a shift at the same instant), and floats them while `OE` is low.

The engine keeps four levels, 0, 1, x (unknown) and z (floating). Each net resolves its
drivers: strong drivers (outputs, rails, stimuli) that agree set the level, 0 against 1 gives x
and a reported contention, and pull resistors count only when no strong driver is on. A z
input reads as x. Gates only go to x when the unknown input matters (0 into an AND is 0), and a
flip-flop clocked by an unsure edge (0 to x, or x to 1) goes to x unless it would keep its
value. Every output has its own delay (transport, so pulses shorter than the delay pass);
events run in time order, and changes with zero delay settle in delta cycles at the same
instant. A zero-delay loop that is still changing after 1000 delta cycles stops the run and
reports the nets, and so does a run past 50 million events.

Flip-flops, counters and shift registers check setup and hold on their clocked inputs against
the model's timing: a data input that changed less than `setup` before a rising clock edge, or
less than `hold` after it, is a violation (not checked while an asynchronous reset or set is
active). A D latch checks its `D` against the closing (falling) edge of `EN` the same way. An
asynchronous reset or set released less than `recovery` before a clock edge, or less than
`removal` after one, is a violation too, with the family table's recovery and removal. A 595
also wants its `LATCH` (RCLK) rising edge at least `setup` after the last `CLK` (SRCLK) rising
edge; the two clocks tied together (the same instant) is fine and latches the value from before
the shift.

On a violation the flip-flop, latch or register the check covers goes to x, as the Verilog
models do with their notifiers, until it is clocked, set or reset cleanly again. Set
`on_violation = "keep"` on the sim to report the violation and keep the sampled value instead.

Readings: assertions passed and failed, contentions, timing violations, cells and events. Check
lists every failed assertion, contention, timing violation or stopped run as an error on the
sim, while the result is current. The result goes stale when the spec or the schematic's
netlist changes. `examples/logic` holds two: `counter`, a 74HC161 counting into a 74HC138,
and `i2c`, an open-drain bus where a controller (two 74LVC1G07) and a target (a 74LVC1G06
pulling SDA low for its ACK) share 4.7k pull-ups, and a 74HC595 clocked by SCL captures the
byte, checked for START, the bits, the ACK, the byte (a `record` bus) and STOP.
