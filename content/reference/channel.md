Pushes a bit stream through a path of an FDTD or cascade result and draws the eye.

```toml
name = "usb-eye"
kind = "channel"
board = "usb-link"             # the sim with the S-parameters
through = ["J1", "J2"]         # single ended FROM, TO
# pair = ["J1+", "J1-", "J2+", "J2-"]   # or differential, uses Sdd21
bit_rate = "5Gbps"
rise = "40ps"                  # 10-90% edge, default 0.35 UI
swing = "0.8V"                 # peak to peak
prbs = 7                       # 7, 9, 11 or 15
ctle = { dc_gain = -6.0, zero = "1GHz", poles = ["5GHz", "10GHz"] }
dfe_taps = 2                   # ideal decision feedback on the first post cursors
```

Real drivers and receivers come from their IBIS files:

```toml
tx = { file = "models/sn74lvc1g04.ibs", model = "LVC1G04_OUT_33", component = "LVC1G04_DBV", pin = "4" }
rx = { file = "models/sn74lvc1g04.ibs", model = "LVC1G04_IN_33", component = "LVC1G04_DBV", pin = "2" }
```

The driver becomes a Thevenin source: the small-signal output resistance from the [Pulldown] and
[Pullup] tables near their rails, C_comp at the die, then the pin's (or the component's) package
R, L and C; its [Ramp] sets the edge (20-80% converted to 10-90%) and [Voltage Range] the swing,
unless `rise` or `swing` are given. The receiver loads the far end with its package and C_comp,
and the eye is read at its die. The path is solved with the full two-port, so a high-impedance
receiver sees the line's reflections. On TI's SN74LVC1G04 model the ramp and the V-I tables agree
on the swing into 50 ohm to 2.5%. IBIS works on single-ended paths for now.

The pulse response comes from the path's S21 (or Sdd21), times the CTLE, with a Gaussian edge,
and the eye is the PRBS superposed on it at 64 phases per unit interval. Readings: eye height at
the best phase, eye width, the peak-distortion worst case (main cursor less every other cursor),
loss at Nyquist and the cursor count. An edge faster than the S-parameters reach is slowed to
1.3 / the top frequency, with a note. On an RC channel the worst case lands within 1.2% of
1 - 2e^(-T/tau).
