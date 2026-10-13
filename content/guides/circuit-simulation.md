A circuit sim runs the analog side of a schematic straight from its netlist: the operating point every time, and an AC sweep, a transient and a noise analysis when the spec asks for them. No layout is needed, so it answers the questions that decide the schematic: does the bias sit where it should, what is the gain at 1 kHz, where does the output clip, how loud is the hiss.

## Start one

```sh
agentee new sim preamp-ac --kind circuit
```

The [preamp example](/examples/preamp/) runs a 9 V op-amp preamp through every analysis. This is its AC and noise run, cut down:

```toml
name = "preamp-ac"
kind = "circuit"
schematic = "preamp"
record = ["VCC", "VREF", "GAIN_OUT", "FILT_OUT", "OUT"]

[[drives]]
net = "VBAT"
dc = "9V"

[[drives]]
net = "IN"
ac = 1
resistance = "100ohm"

[ac]
from = "1Hz"
to = "1MHz"
points = 20

[noise]
output = "OUT"
input = "IN"
from = "20Hz"
to = "20kHz"

[[checks]]
v = "VREF"
min = 4.1
max = 4.3

[[checks]]
v = "OUT"
at = "1kHz"
min = 18.3
max = 19.3

[[checks]]
noise = "OUT"
at = "1kHz"
max = "500n"

[[blocks]]
ref = "U1"
kind = "opamp"
gain = 1e5
gbw = "0.7MHz"
en = "40n"
vos = "3mV"
headroom_high = "1.5V"
headroom_low = "5mV"
```

```sh
agentee sim preamp-ac
agentee render sim:preamp-ac -o preamp-ac.png
```

The run writes `preamp-ac.result.json` beside the spec, with the operating point of every net, the current through every part, each check and its value, and the curves of the recorded nets. The viewer and `render` plot the gain, phase and noise.

## Drives

Only a drive drives a net, so give every supply one. A drive is a voltage source to ground, or to the net in `return`, with `resistance` in series. `current = true` makes it a current source, which is how the preamp takes the op-amp's quiescent current off its rail. `ac` marks the input of the AC and noise analyses. For the transient, a drive takes `steps` (piecewise linear), a `pulse` or a `sine`.

Ground is every net named GND, `0V`, `GROUND` or starting with `VSS`.

## Analyses

- **Operating point:** always. Newton iteration with junction limiting, then gmin stepping, then source stepping when it will not settle.
- **AC:** `[ac]` sweeps from `from` to `to` at `points` per decade, linearised at the operating point. Gains are in dB against the `ac` drive.
- **Transient:** `[tran]` runs to `stop` with `step` as the largest step. It also stores the spectrum of each recorded net over its second half.
- **Noise:** `[noise]` gives the density at `output` and, with `input`, the input referred curve, plus the RMS over the band. Resistors, junction currents, MOSFET channels and op-amp `en` all contribute.

## Checks

A check reads one number and holds it between `min` and `max`. What it reads depends on `at`:

| check | reads |
|---|---|
| `v = "NET"` | the voltage at the operating point |
| `v = "NET"`, `at = "5ms"` | the voltage in the transient |
| `v = "NET"`, `at = "1kHz"` | the AC gain in dB |
| `phase = "NET"`, `at = "1kHz"` | the phase in degrees |
| `noise = "NET"`, `at = "1kHz"` | the noise density in V/rtHz |
| `i = "R1"` | the current through a two-pin part, pin 1 to pin 2 |
| `peak`, `trough`, `rms`, `freq`, `thd` | the transient between `from` and `to` |

A check that fails is an error on the sim. Raise the 1 kHz check above to `min = 19` and the run fails, and `agentee check` reports it as an error while that result is current:

```text
error: ./preamp-ac.sim.toml: preamp-ac result: v(OUT) at 1kHz is 18.7870 dB, wanted 19 to 19.3 dB
```

The result goes stale when the spec or the schematic's netlist changes: check notes it as stale and drops its failures until the sim runs again, so rerun the sim after every change to the circuit. Start a `thd` or `freq` span after the circuit settles, or the start-up step reads as distortion.

## Models come from the datasheet

Each part becomes an element by its reference letter: `R`, `C` and `L` by value, `D` as a diode, `Q` as a BJT or MOSFET by its pin names. Connectors, test points, holes and crystals are left out, and anything else is an error until it has a block or sits in `ignore`.

The built-in devices are generic stand-ins: a silicon diode, a small-signal BJT, a logic-level MOSFET. A result that rests on one describes the stand-in, not your part. Give each part that matters a `[[blocks]]` entry with values from its datasheet:

- **Op-amps** are a single pole with `gain`, `gbw`, `rout`, `vos`, `en`, `ib`, `slew`, `psrr`, and a smooth clamp `headroom` away from each rail. Every unit of a dual or quad is its own op-amp on shared rails.
- **Diodes** take `is` and `n`. Fit them to two typical VF points a decade of current apart: `n = dV / (Vt ln 10)`, then `is = I / exp(V / (n Vt))`.
- **BJTs and MOSFETs** take `is`, `bf`, `va` or `vth`, `k`, `lambda`, and their capacitances.
- **LDOs** hold `vout` until the input comes within `dropout`, then follow it down.
- **Potentiometers** take a `position` from 0 to 1, so the wiper loads and is loaded like the real part.

Put the datasheet and the table each value came from in the sim's `description`. The next person to read the result, often the agent, then knows what it rests on.

## Examples

- `examples/preamp`: the operating point, gain and noise of a gain stage and Sallen-Key filter on an LM358, the thump at switch-on, clipping, and the reverse battery diode.
- `examples/ladder-vcf`: a transistor ladder filter whose sims check 1 V/oct tracking at three CVs, the resonance peak, and self-oscillation in a transient.
- `examples/lna`: `lna-supply` checks the OR-ing of two power inputs through Schottkys, and `lna-biastee` how much RF the bias tee lets onto the supply.

Every key is in the [circuit reference](/reference/circuit/).
