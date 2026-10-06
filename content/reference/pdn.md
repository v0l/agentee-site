The impedance of a power rail, from ports the FDTD sim puts on the rail's power pins, decap pads
and the VRM. Every port of the board sim must be driven and must be a sink, a decap or the VRM.
Ports should carry a low `impedance` (0.5 to 1 ohm), since the rail's impedance sits far below 50
ohm and the conversion from S11 loses precision at a 50 ohm reference. Below the sim's own band
the board is extrapolated as L plus the DC resistance of its S matrix at the first point.

```toml
name = "vcc-pdn"
kind = "pdn"
board = "rail"                 # the FDTD sim with the rail's ports
sinks = ["U1_VCC"]             # the load pins, left open like current sources
target = { voltage = "5V", ripple = 1.0, transient = "50mA" }   # or impedance = "20mohm"

[[decaps]]
port = "C3"
ref = "C3"
file = "models/grm155r61a105ke15.s2p"   # a measured one-port, series or shunt fixture
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

[frequency]                    # the sweep to report over
start = "100kHz"
stop = "1GHz"
points = 200
```

The viewer draws |Z| per sink against the target on a log-log plot. Readings give the peak
impedance and how it compares with the target, plus the largest anti-resonances (which is where
to move a decap or change its value). On an ideal junction with one VRM and one decap the result
matches Z_VRM || Z_decap to machine precision.
