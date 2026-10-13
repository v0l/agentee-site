An analog simulation of a schematic, straight from its netlist: the operating point always, and
an AC sweep, a transient and a noise analysis when asked. The solver is modified nodal analysis
with Newton iteration (junction limiting, then gmin stepping, then source stepping when the
operating point will not settle), trapezoidal integration with backward Euler after each
breakpoint and a step that halves when Newton fails, complex AC at the operating point, and noise
by the adjoint method. `agentee new sim NAME --kind circuit` (MCP `new_item` with `sim_kind =
"circuit"`) writes a starter. `agentee sim NAME` writes `NAME.result.json`; the viewer plots the
transient, gain, phase and noise, with the operating point and the checks beside them, and
`agentee render NAME` draws the same headless.

```toml
name = "lna-supply"
kind = "circuit"
schematic = "lna"              # default: the only top-level schematic
ignore = ["D3"]                # parts to leave out
record = ["VCC", "LED_A"]      # nets in the curves, default every net
# temperature = 27             # deg C, for the noise and the junctions

[[drives]]                     # only drives drive a net: give every supply one
net = "VEXT"
dc = "5V"
# return = "VNEG"              # default ground
# current = true               # a current source into `net`, in A
# ac = 1                       # the AC and noise input, in V (or A)
# resistance = "50ohm"         # in series (in parallel for a current source)
steps = [["0s", "0V"], ["1ms", "0V"], ["2ms", "5V"]]   # piecewise linear, for the transient
# pulse = { low = "0V", high = "5V", delay = "1ms", rise = "1us", fall = "1us", width = "1ms", period = "2ms" }
# sine = { offset = "0V", amplitude = "1V", frequency = "1kHz", delay = "0s" }

[ac]
from = "10Hz"
to = "10MHz"
points = 20                    # per decade

[tran]
stop = "10ms"
step = "10us"                  # the largest step

[noise]
output = "OUT"
input = "VIN"                  # a drive with `ac`: adds the input referred curve
from = "10Hz"
to = "100kHz"

[[checks]]
v = "VCC"                      # a net voltage at the operating point
min = 4.55
max = 4.85

[[checks]]
i = "R1"                       # the current through a two-pin part, pin 1 to pin 2
at = "5ms"                     # a time reads the transient
min = "2mA"

[[checks]]
v = "OUT"
at = "1kHz"                    # a frequency reads the AC gain in dB against the ac drive
min = 19.5
# phase = "OUT"                # degrees at a frequency
# noise = "OUT"                # V/rtHz at a frequency, at the [noise] output

[[checks]]
thd = "OUT"                    # over the transient: peak, trough, rms, freq or thd
from = "2ms"                   # the span read, default the whole transient
# to = "10ms"
max = "1%"
# peak = "OUT"                 # highest voltage in the span; trough is the lowest
# rms = "OUT"                  # RMS about the span's mean, V
# freq = "OUT"                 # from the rising crossings of the mean, Hz

[[blocks]]                     # a model for a part, by `ref` or by `value` (every such part)
ref = "U1"
kind = "opamp"
gain = 1e5
gbw = "1MHz"
# rout = "10ohm"
# vos = "0V"
# en = "10n"                   # input voltage noise, V/rtHz
# headroom = "0.1V"            # how close the output swings to its rails
# headroom_high = "1.5V"       # per rail, default `headroom`
# headroom_low = "5mV"
# slew = "0.3V/us"             # slew rate, transient only
# ib = "-20nA"                 # input bias current, into each input pin
# psrr = "100dB"               # supply changes about the operating point, referred to the input
# fc = "100Hz"                 # 1/f corner of `en`
# pins = { inp = "3", inn = "2", out = "1", vcc = "8", vee = "4" }

[[blocks]]
ref = "RV1"
kind = "potentiometer"         # pins 1 and 3 are the ends, 2 the wiper
position = 0.25                # 0 puts the wiper at pin 1, 1 at pin 3; default 0.5
# resistance = "10k"           # the end to end value, default the part's value
```

`thd` is the harmonics 2 to 10 against the fundamental, in percent, over the whole periods
between the first and last rising crossing of the mean in the span. `freq` and `thd` need at
least one full period there. Start the span after the circuit settles, or the start-up step
reads as distortion.

A transient also stores the spectrum of each recorded net over its second half (a Hann window,
in dBV, 2048 bins), drawn under the transient in the viewer.

The built-in device models below are generic stand-ins (a silicon diode, a small-signal BJT, a
logic-level MOSFET), not the part on the schematic. Give each part that matters a block with
values from its datasheet, and fit a diode's `is` and `n` to two of its typical VF points: two
points a decade of current apart give `n = dV / (Vt ln 10)` and `is = I / exp(V / (n Vt))`.
A result that rests on a default describes the default, not the part.

Values take SI prefixes and units: `"4k7"`, `"100nF"`, `"1MHz"`, `"10meg"`, or a bare number.
The ground is every net named with GND, `0V`, `GROUND` or starting with `VSS`, unless a drive
names it. Nets with nothing to hold them sit on a 1 pS conductance to ground.

The netlist becomes elements by the symbol's reference letter:

| reference | element |
|---|---|
| `R` | resistor of the value; 0 ohm, `JP`, `SJ` and `NT` join their nets |
| `C`, `L` | capacitor, inductor of the value |
| `FB` | 0.1 ohm, unless a block gives it more |
| `D`, `LED`, `DZ` | diode by pin name (`A`, `K`): silicon (Is 10 fA, n 1); a symbol or value with Schottky, BAT or SS1 is Schottky (10 nA, 1.05); LED is (1 aA, 2); a zener takes its breakdown from the value (`BZX84C3V3` is 3.3 V), with a 1 mA knee |
| `Q` with `B`, `C`, `E` pins | Ebers-Moll BJT, PNP when the symbol or value says so: Is 10 fA, Bf 100, Br 1 |
| `Q`, `M` with `G`, `D`, `S` pins | level 1 MOSFET with a smooth threshold, P channel when the symbol says PMOS: Vth 1.5 V, k 0.5 A/V^2, lambda 0.01 |
| `J`, `P`, `TP`, `H`, `MH`, `FID`, `Y`, `X`, `SW`, `BT`, `T` | left out |
| anything else | an error naming it, unless it is in `ignore` or has a block |

Block kinds and their fields:

| kind | pins (default by name) | fields |
|---|---|---|
| `resistor`, `capacitor`, `inductor`, `bead` | `1`, `2` | `resistance`, `capacitance`, `inductance` |
| `diode`, `schottky`, `zener`, `led` | `a`, `k` | `is`, `n`, `bv`, `cj` |
| `bjt`, `npn`, `pnp` | `c`, `b`, `e` | `is`, `bf`, `br`, `va`, `cje`, `cjc` |
| `mosfet`, `nmos`, `pmos` | `d`, `g`, `s` | `vth`, `k`, `lambda`, `cgs`, `cgd` |
| `opamp` | `inp` (`+`, `IN+`), `inn` (`-`, `IN-`), `out` (`~`, `OUT`), `vcc` (`V+`, `VCC`), `vee` (`V-`, `VEE`) | `gain`, `gbw`, `rout`, `vos`, `en`, `headroom` |
| `ldo` | `vin`, `vout`, `gnd` | `vout`, `dropout`, `rout`, `iq` |
| `vcvs`, `vccs` | `p`, `n`, `cp`, `cn` (all given) | `gain` (V/V or A/V) |
| `open` | | leaves the part out |

An op-amp is a single pole: a transconductance into a node with `gain` ohms and a capacitor that
puts unity gain at `gbw`, then a buffer clamped smoothly between its rails less `headroom` (no
clamp without both rail pins) behind `rout`. The gain node stops a little past the clamp, so a
clipped op-amp comes back off its rail as soon as its input asks it to, as a real one does,
rather than winding up. The clamp and its `headroom` are the same on both rails. Every unit of a
multi-unit op-amp with the three signal pins is its own op-amp sharing the rail pins, the output
found by name or, when it has none, as the unit's one output pin. One block covers every unit of
a part; a second block for the same `ref` is an error. An LDO holds `vout` above `gnd` until the
input comes within `dropout`, then follows the input down, and the input supplies the output
current plus `iq`.

Noise sources: resistors (4kT/R), drive resistances, diodes and BJT collector and base currents
(2qI), MOSFET channels (8kT gm / 3) and op-amp `en`. The result has the output density, the input
referred density when `input` is set, and the RMS over the band.

A check that fails is an error on the sim while the result is current; the result goes stale
when the spec or the schematic's netlist changes. `examples/lna` holds two: `lna-supply`, the
OR-ing of the 5 V input through a Schottky to U1's bias current, and `lna-biastee`, how far the
bias tee keeps RF on the output off VBIAS. Both take U1 as its 90 mA quiescent current and the
BAT60A from its typical VF, from the two datasheets; the LED, which has no part number, is left
out. `examples/preamp` is an op-amp design run through every analysis: the operating point, gain
and noise of a gain stage and Sallen-Key filter on a dual LM358, the power-up thump as the
mid-rail bias settles, clipping, and the reverse battery diode. `examples/ladder-vcf` is a BJT ladder filter: its sims
check the expo converter's 1 V/oct tracking at three CVs, the resonance peak, and self-oscillation
in a transient.
