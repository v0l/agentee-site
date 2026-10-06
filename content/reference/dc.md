Solves the copper of every layer as a resistive sheet (vias as plated barrels), with supply pads
held at their voltage and loads drawing current, by sparse Cholesky in f64. Parts carry DC
through `[[links]]`: resistors take their value, inductors and ferrite beads (`FB`) default to
0.1 ohm, anything else is open unless linked. A link joins pads 1 and 2 unless `a` and `b` name
others, so a load switch is `{ ref = "U5", resistance = "80mohm", a = "1", b = "6" }`.

```toml
name = "lna-dc"
kind = "dc"
layout = "lna"
cell = 0.05                    # raster cell in mm

[[supplies]]
pad = "D2.1"
voltage = "4.7V"

[[supplies]]
pad = "J3.2"
voltage = "0V"

[[loads]]
pad = "U1.3"
current = "90mA"
return = "U1.2"                # where the load current comes back

[[links]]
ref = "L2"
resistance = "1.4ohm"          # inductor DCR from its datasheet
```

Maps: drop from each copper island's supply (mV), current density (A/mm2), voltage. Readings:
supply currents, load voltages, peak density and its place, the busiest vias.
