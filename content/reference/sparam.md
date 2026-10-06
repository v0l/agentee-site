`agentee sparam NAME` (MCP `sparam`) works on any FDTD or cascade result:

```
agentee sparam lna-rf --tdr IN --rise 50ps     # impedance against time from one port
agentee sparam link --pair 1,2,3,4             # Sdd21, Sdd11, Scc21, Scd21, Sdc21
agentee sparam link --xtalk 1,3                # coupling in dB and the step crosstalk
```

It always reports passivity (the largest singular value of S over the band) and reciprocity
(the largest |Sij - Sji|) when every port was driven. The TDR resamples onto a uniform grid,
extrapolates the real part to DC, applies a Gaussian edge (default 10-90% rise of 1.3 / the top
frequency) and integrates the impulse response; it warns when the edge is faster than the data
supports. The viewer shows the same TDR for every driven port under the `tdr` tab.
