An FDTD sim can also record the field in the prepreg between the first two copper layers and
the far field, at up to four frequencies, for each excited port.

```toml
fields = ["1090MHz", "2.4GHz"]
far_field = true
```

Maps: E (dBV/m) and H (dBA/m) for 1 mW incident on the port, 60 dB deep. The far field comes from
a near-to-far transform on a box just inside the absorbing boundary. Readings: radiated power as a
fraction of the input, directivity, and the peak field at 3 m for 1 mW in, against FCC class B.
Ports are matched loads at the pads, so cables and connectors are not part of the radiator.
