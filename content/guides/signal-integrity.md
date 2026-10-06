Three sims read the S-parameters of an FDTD run for something more specific than a plot: a channel sim pushes a bit stream through a link and draws the eye, a PDN sim turns a rail's ports into its impedance against a target, and `agentee sparam` analyses any result in the time domain. Each needs an FDTD run of the board first; see [RF simulation](/guides/rf-simulation/) for how to set one up and keep it cheap.

## Channel and eye

```toml
name = "usb-eye"
kind = "channel"
board = "usb-link"
pair = ["J1+", "J1-", "J2+", "J2-"]
bit_rate = "5Gbps"
rise = "40ps"
swing = "0.8V"
prbs = 7
ctle = { dc_gain = -6.0, zero = "1GHz", poles = ["5GHz", "10GHz"] }
dfe_taps = 2
```

`board` names the sim whose S-parameters carry the link. `through = [FROM, TO]` is a single-ended path; `pair = [IN+, IN-, OUT+, OUT-]` a differential one, read from Sdd21. The pulse response comes from the path, times the CTLE if there is one, with a Gaussian edge, and the eye is a PRBS superposed on it at 64 phases per unit interval, with ideal decision feedback on the first `dfe_taps` post cursors.

```sh
agentee sim usb-eye
agentee show sim:usb-eye
```

The readings are the eye height at the best phase, the eye width, the peak distortion worst case, the loss at Nyquist and the cursor count. An edge faster than the S-parameters reach is slowed to what the data supports, with a note.

### Real drivers from IBIS

```toml
tx = { file = "models/sn74lvc1g04.ibs", model = "LVC1G04_OUT_33", component = "LVC1G04_DBV", pin = "4" }
rx = { file = "models/sn74lvc1g04.ibs", model = "LVC1G04_IN_33", component = "LVC1G04_DBV", pin = "2" }
```

The driver becomes a Thevenin source from its pulldown and pullup tables, its die capacitance and its package; its ramp sets the edge and its voltage range the swing, unless `rise` or `swing` are given. The receiver loads the far end with its package and die capacitance, and the eye is read at its die. IBIS works on single-ended paths for now.

## Power distribution network

```toml
name = "vcc-pdn"
kind = "pdn"
board = "rail"
sinks = ["U1_VCC"]
target = { voltage = "5V", ripple = 1.0, transient = "50mA" }

[[decaps]]
port = "C3"
ref = "C3"
file = "models/grm155r61a105ke15.s2p"
mount = "series"

[[decaps]]
port = "C4"
c = "1uF"
esl = "0.4nH"
esr = "15mohm"

[[vrm]]
port = "VRM"
r = "2mohm"
l = "20nH"

[frequency]
start = "100kHz"
stop = "1GHz"
points = 200
```

The FDTD sim of the board puts a port on each power pin, each decap pad and the regulator. Every port must be driven and must be a sink, a decap or the VRM. Give those ports a low `impedance`, 0.5 to 1 ohm, since a rail sits far below 50 ohm and converting from S11 at 50 ohm loses precision.

The target is either an impedance or a voltage, ripple percentage and transient current. The viewer draws |Z| per sink against the target on a log-log plot, and the readings give the peak impedance against the target and the largest anti-resonances, which is where to add or change a decap. Decaps are measured S-parameter files or an ideal C with ESL and ESR.

## Analysing S-parameters

```sh
agentee sparam lna-rf --tdr IN --rise 50ps
agentee sparam link --pair 1,2,3,4
agentee sparam link --xtalk 1,3
```

- `--tdr PORT` is impedance against time from one port: the data resampled to a uniform grid, extrapolated to DC, given a Gaussian edge and integrated. It warns when the edge is faster than the data supports. The viewer shows the same TDR for every driven port.
- `--pair IN+,IN-,OUT+,OUT-` gives mixed-mode Sdd21, Sdd11, Scc21, Scd21 and Sdc21.
- `--xtalk FROM,TO` gives coupling in dB and the crosstalk of a step.

Every run reports passivity (the largest singular value of S over the band) and reciprocity (the largest difference between Sij and Sji) when every port was driven. A passivity above 1 means the run did not converge or the mesh is too coarse.

## Holding a link to its numbers

An interface in the layout can read finished sims and fail check when a link misses its numbers:

```toml
[[interfaces]]
name = "usb-ss"
preset = "usb3-gen1"
nets = ["SS_TX*", "SS_RX*"]

[[interfaces.measure]]
sim = "usb-link"
pair = ["TX1_FX+", "TX1_FX-", "TX1_J+", "TX1_J-"]
up_to = "2.5GHz"
max_loss = 1.5
min_return_loss = 10.0
max_mode_conversion = -30.0

[[interfaces.measure]]
sim = "usb-eye"
min_eye_height = "70mV"
min_eye_width = "0.47UI"
```

A missing or stale result is an error too, so a layout change that the sims have not seen fails check until they are rerun. That is the point: the eye you signed off on is the eye of the copper you are about to order. The [interfaces reference](/reference/interfaces/) lists every limit.
