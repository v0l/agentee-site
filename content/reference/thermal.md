Steady-state conduction through FR4 (0.8 W/mK in plane, 0.3 through), copper sheets and via
barrels, with convection from both faces, solved on the GPU by preconditioned conjugate gradient.

```toml
name = "lna-thermal"
kind = "thermal"
layout = "lna"
cell = 0.2                     # default 0.2 mm
ambient = 25.0
# h_top = 10.0                 # W/m2K, still air; 25+ with a fan
# h_bottom = 10.0

[[sources]]
ref = "U1"
power = "0.45W"
theta_jc = 65.0                # adds a junction estimate: pads + P x theta
pads = ["2"]                   # the pads the heat leaves through, default all
```

Maps: temperature per copper layer. Readings: board peak, each source's pad and junction
temperature.
