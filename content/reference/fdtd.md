A full-wave FDTD run of a layout on the GPU (wgpu), giving S-parameters between ports placed on
pads. `agentee sim NAME` runs it and writes `NAME.result.json` and a Touchstone `NAME.sNp` next
to the spec; the viewer and `render` then show the magnitude plot and a Smith chart.

```toml
name = "lna-rf"
layout = "lna"
cell = 0.05                    # finest mesh cell in mm, default 0.05; the mesh grades out from copper edges
excite = ["IN", "AMP_OUT"]     # ports to drive, one run each; default all
# region = [0, 0, 30, 20]      # crop to x0, y0, x1, y1 in mm, default the board
# max_steps = 150000
# end_db = 50                  # stop once the field energy is this far under its peak, as openEMS does

[frequency]
start = "100MHz"
stop = "4GHz"
points = 391

[[ports]]
name = "IN"
pad = "J1.1"                   # a lumped port over the whole pad, down to the next copper layer
reference = "In2.Cu"           # or name the layer it returns on, e.g. past a cutout
# impedance = 50

[[models]]                     # C, L and R parts take their schematic value by default
ref = "D3"
capacitor = "0.23pF"           # or inductor = "47nH", resistor = "1k", open = true
```

Copper is modelled as zero-thickness sheets on each copper layer (pads, tracks, vias as plated
columns, zone fills with their clearances), dielectrics from the board stackup with their loss
tangent, and CPML boundaries. Parts other than ports and lumped models are open. Validated on a
50 ohm microstrip: return loss under -25 dB, insertion loss under 0.2 dB, and phase velocity within
1.2% of Kirschning-Jansen.
