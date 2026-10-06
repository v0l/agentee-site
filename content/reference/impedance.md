For each net class and routing layer it finds the trace geometry from the stackup (outer layers
are microstrip, inner layers are stripline between the nearest copper above and below), then the
impedance (Hammerstad-Jensen microstrip, Wheeler stripline, conformal-mapping grounded coplanar
with the copper's thickness and side walls, all uncoated; the coplanar form lands within 4% of
the field solver from a 0.08 mm to a 0.21 mm core), the width that meets the target, and the
IPC-2221 current capacity. `agentee show <board>` prints all of it as JSON.

With `solver = "field"` the class is checked by the 2D field solver instead: a node-based finite
difference Laplace solve on a graded mesh, run on the GPU through wgpu, with copper thickness,
solder mask, coplanar grounds and pairs included. On exact references it lands within 0.5% of
Cohn's zero-thickness stripline and 0.4% of Hammerstad-Jensen microstrip. When the class is off
target, check suggests the track width that meets it. `agentee calc field --netclass RF` prints
the full result (Z0, eeff, C and L per metre, delay, grid).

`--sweep 10MHz,20GHz,21` (MCP `sweep`) adds a loss table per frequency: R, L, G, C, Z0 and
dB per metre and per inch, split into conductor and dielectric loss. Conductor loss comes from
Wheeler's incremental inductance, solved by receding every copper surface in the field solver
(within 1% of the Wheeler stripline formula in Pozar), with skin depth from annealed copper and
the DC resistance blended in as sqrt(Rdc^2 + Rac^2). Dielectrics follow the causal
Djordjevic-Sarkar model fitted to each layer's `er` and `loss_tangent`, taken as 1 GHz values.
Copper roughness is set on the stackup:

```toml
[stackup]
roughness = "0.5um"            # rms, Hammerstad-Jensen
# huray = { radius = "0.5um", ratio = 2.0 }   # or the Huray snowball model
finish = "ENIG"
nickel = "4.5um"               # ENIG nickel thickness, default 4.5 um
gold = "0.075um"               # ENIG immersion gold thickness, default 0.075 um
```

The 2D solver applies the roughness as a loss factor on the resistance at each frequency. The
FDTD uses the roughness and the ENIG finish as described under "Losses in the FDTD" below;
`nickel` and `gold` only matter when `finish = "ENIG"`. The defaults are the middle of the
IPC-4552 windows (3 to 6 um nickel, gold 0.05 um minimum with fabs aiming for 0.05 to 0.1 um).

A class with `diff_gap` is a pair: its `impedance` is the differential impedance, and the solver
runs both the odd and even modes. `calc field` then adds a `pair` block with Zdiff, Zcommon, the
odd and even mode impedances and delays, the coupling coefficient (Ze - Zo)/(Ze + Zo), and the
saturated near-end crosstalk of a long line (half the coupling). The two modes land within 0.5% of
Cohn's exact edge-coupled stripline. A difference between the odd and even delays is what drives
far-end crosstalk on microstrip.
