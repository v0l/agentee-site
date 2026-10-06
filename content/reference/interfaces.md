An interface says what a link must meet, and check measures the copper against it: impedance,
skew, length, vias, via stubs, the reference plane under every track, the return vias, bus
timing, and the S-parameters and eye of the sims that model it.

```toml
[[interfaces]]
name = "usb-ss"
preset = "usb3-gen2"           # usb3-gen1, usb3-gen2, usb2-hs, lvds, rf-50, cmos
nets = ["SS_TX*", "SS_RX*"]    # globs; differential presets pair them up, through series parts
# differential = true
# impedance = "90ohm"          # the member classes' targets must sit inside this
# impedance_tolerance = "7%"
# max_skew = "5mil"            # within each pair, a length or a time ("1ps")
# max_length = "3in"           # end to end, through series parts
# max_vias = 2                 # per trace
# max_stub = "15mil"           # the via barrel past the last layer the trace uses
# max_unreferenced = "0.5mm"   # total run with no plane of `reference` under it
# reference = ["GND"]
# return_via = "200mil"        # a reference via this close to every signal via

[[interfaces]]
name = "ad-rx"
preset = "cmos"
nets = ["AD_P1_D*", "AD_RX_FRAME", "AD_DATA_CLK"]
clock = "AD_DATA_CLK"          # a pair's clock is named by either leg
max_bus_skew = "30ps"          # spread of arrival across the data lines
clock_window = ["-50ps", "150ps"]   # data minus clock arrival, from the setup and hold budget

[[interfaces.measure]]         # read from a finished sim; missing or stale results are errors
sim = "sdr-usb"                # an FDTD run
pair = ["TX1_FX+", "TX1_FX-", "TX1_J+", "TX1_J-"]   # IN+, IN-, OUT+, OUT-; or through = [IN, OUT]
up_to = "5GHz"                 # Nyquist, the band the limits apply over
max_loss = 1.5                 # dB, worst Sdd21 (or S21) in the band
min_return_loss = 10.0         # dB, worst Sdd11
max_mode_conversion = -30.0    # dB, worst Scd21

[[interfaces.measure]]
sim = "sdr-usb-eye"            # a channel sim
min_eye_height = "70mV"
min_eye_width = "0.47UI"       # or ps

[[interfaces.measure]]
sim = "i2c-bus"                # a logic sim: no limits, it passes when the sim passes
```

A measure on a logic sim fails while the sim has any failure (an assertion, contention, a
timing violation or a stopped run), naming the count and the first; it is stale when the sim's
spec or schematic netlist changed, as the sim itself reports, not when the copper did, since a
logic sim never sees the layout.

| preset | impedance | skew | vias | stub | other |
|---|---|---|---|---|---|
| `usb3-gen1`, `usb3-gen2` | 90 ohm +/-7% diff | 5 mil | 2 | 15 mil | 3500 / 3000 mil long, GND return via within 200 mil, 0.5 mm unreferenced |
| `usb2-hs` | 90 ohm +/-10% diff | 50 mil | 4 | | 12000 mil long, 1 mm unreferenced |
| `lvds` | 100 ohm +/-10% diff | | | | 1 mm unreferenced |
| `rf-50` | 50 ohm +/-10% | | 0 | | 0.5 mm unreferenced |
| `cmos` | | | | | 2 mm unreferenced |

The USB numbers are TI's High-Speed Interface Layout Guidelines (SPRAAR7J, Appendix A), the Gen 2
length is congatec AN37. Anything a preset sets, the interface can override.

Delays are the track delay from each layer's effective permittivity plus the via barrel the
signal crosses. A plane counts as the reference where the first copper found walking away from
the track, past cut-out layers, is a zone of a `reference` net that covers the track's full
width; the antipad around the net's own vias does not count. Every sim result records a hash of the copper it saw (the sim's `region` only, plus the
stackup); a result whose copper has changed since is stale, and a measure on it fails.

`agentee tune NAME` (MCP `tune`) fixes these: for every pair over its skew limit and every match
group member short of its target it meanders the short side, on its longest straight segments,
anywhere along a series chain, with bumps that keep every other net's clearance and the board
edge rule, and writes the new points into the tracks. `--nets` limits it, `--amplitude` caps the
bump height and `--pitch` fixes the bump pitch (default three track widths, tighter where that is
all that fits). On one leg of a pair it bumps the stretches where the legs already run apart
first (breakouts and bends, where the mismatch comes from) and never leaves the leg running beside
its partner off the class gap; a coupled stretch only takes bumps tall enough to clear the pair.
Interfaces count too, in time as well as length: a pair over
its `max_skew` in ps gets the short side lengthened by that delay; for `max_bus_skew` and
`clock_window` the clock is lengthened until the latest data line falls inside its window and
every data line short of the bus spread or the window's early edge is lengthened to the latest
one (inside the window), both legs of a pair together. Delays turn into millimetres at each net's
own ps per mm. When one leg of a pair cannot take all of it, the other leg is held to what it got.
A net that is over its group target is reported, not shortened. `agentee calc
serpentine --from x,y --to x,y --add 2.5mm` (MCP `serpentine`) returns the points of one such
meander on a segment you pick. Net lengths and delays are in `agentee show pcb:NAME`.

The viewer's layout page has a `3d` tab (`agentee view --3d` opens on it): the board in its
stackup thickness, mask and silk colours and finish, copper under the mask, bare pads, plated and
bare drill walls, and each part's 3D model. The `parts` toggle hides the models. Drag to orbit,
shift-drag to pan, scroll to zoom, double-click to reset. The viewer draws with OpenGL
([three-d](https://github.com/asny/three-d)); `agentee render pcb:NAME --show 3d` (or `3d-top`,
`3d-bottom`) draws the same scene in software, `--hide parts` leaves the models out and `--region`
aims the camera at that area.
