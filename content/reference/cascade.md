Drops measured devices into the S-parameters of a board sim. Every port of the board sim must
have been driven (leave `excite` out). The ports not joined to a device are the ports of the
result, which is written as `<name>.result.json` and a Touchstone file like any FDTD run.

```toml
name = "lna-cascade"
kind = "cascade"
board = "lna-rf"               # the FDTD sim of the board around the devices

[[devices]]
ref = "U1"
file = "spf5189z.s2p"          # Touchstone 1.x, S parameters, any of MA / DB / RI
ports = ["AMP_IN", "AMP_OUT"]  # board port for device port 1, 2, ...

[[devices]]                    # a two-terminal part from its vendor fixture data
ref = "L1"
file = "models/coilcraft_bcr-162.s2p"
ports = ["L1"]                 # one board port, at the part's RF pad or across its pads
mount = "shunt"                # how the vendor measured it: "shunt" to ground or "series"
```

A mounted part's impedance is taken from whichever of S11 and S21 is better conditioned, then
joined to the board port as a one-port.

Noise and linearity come along when the data is there:

```toml
bandwidth = "2MHz"             # for the noise floor and SFDR; without it the floor is per Hz
report = ["1090MHz"]           # frequencies for the budget readings, default the datasheet rows
ambient = 25.0                 # board temperature for its thermal noise, C

[after]                        # the stage behind the output, e.g. the receiver
nf = 6.0                       # dB
# iip3 = -10.0                 # dBm

[[devices]]
ref = "U1"
file = "models/qorvo_spf5189z.s2p"
ports = ["AMP_IN", "AMP_OUT"]

[[devices.datasheet]]          # one row per frequency, every column optional
freq = "0.9GHz"
nf = 0.55                      # dB with a 50 ohm source
oip3 = 38.5                    # dBm
p1db = 22.4                    # output P1dB, dBm
```

Noise is carried as noise-wave correlation matrices: the passive board and mounted parts from
their S-matrices at the board temperature, an amplifier from the Touchstone noise block when the
file has one (NFmin, Gamma opt, Rn), otherwise from the datasheet `nf` taken as NFmin with
Gamma opt = 0, which is exact only when the board presents 50 ohm. Outside the data the noise
figure is left blank rather than guessed. Linearity refers each device's OIP3 and P1dB to the
input through the gain the network gives it and adds them as reciprocals; `after` joins by
Friis. Readings give gain, NF, noise floor (-174 dBm/Hz + NF + 10 log B), SFDR (2/3 of IIP3 over
the floor), IIP3, OIP3 and output P1dB at each reported frequency, and the viewer plots the
noise figure and mu next to the Smith chart.

Device data is interpolated linearly in real and imaginary parts, and the band is cut to where
every device has data. A two-port result reports gain peak and low, worst S11, S22 and S12, and
the lowest Edwards-Sinsky mu and Rollett K (mu above 1 at every frequency is unconditionally
stable). The result goes stale when the spec, the board result or a device file changes.
