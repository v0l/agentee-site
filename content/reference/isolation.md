A net class has one clearance, held against every other net. Net class voltages cover most
boards; write domains and barriers by hand where you need more, such as reinforced isolation the
classes cannot express or a group of nets by name. Where nets must keep more distance
from one group than from their neighbours (a mains primary from the secondary, a floating rail
from the rest of the secondary), put the nets in domains and set a barrier between two domains:

```toml
[[domains]]
name = "primary"
classes = ["Mains", "HvBus"]       # every net of these classes
nets = ["PGND", "LLC_*"]           # and these nets, globs allowed

[[domains]]
name = "secondary"
classes = ["Out24V"]
nets = ["GND_SEC", "5VSB"]

[[barriers]]
between = ["primary", "secondary"]
clearance = "4mm"                  # through air, on every copper layer
creepage = "6.4mm"                 # along the board surface, on F.Cu and B.Cu
pollution_degree = 2               # 1, 2 or 3, default 2
```

A net sits in one domain at most. Inside a domain, and for nets in none, the class clearances
apply as before. Between two domains with a barrier, copper on one layer keeps the barrier's
`clearance` (`isolation-clearance`), pads of one footprint and pours included. Everything that
adds copper keeps the barrier from the other domain's copper: pours, `agentee route` and the
layout engine, `tie`, `testpoints`, `tune`, `neck`, fanouts and stitching vias, from the same
rule the check uses. On F.Cu and B.Cu they keep the larger of `clearance` and `creepage`, since
none of them measures paths around slots.

Creepage is the shortest path between the two coppers along the outer surface they sit on
(`creepage`). It stays on the board and goes around board cutouts and non-plated holes. A slot or
hole narrower than the groove width X of the pollution degree (0.25 mm for 1, 1.0 mm for 2,
1.5 mm for 3, as IEC 60664-1 gives it) is bridged and measured straight across. Between copper on
F.Cu and copper on B.Cu the path runs down the wall of a board cutout or non-plated hole of any
width, or round the board edge, and counts the board's thickness. Solder mask does not count as
insulation.

The clearance of a class whose nets sit in a domain is taken as an electrical spacing, so it also
holds between pads of one footprint: a TO-220 on a 1.5 mm HvBus class with pads 1.0 mm apart is a
`clearance` error. Pads of one footprint whose nets are in no domain are held to `min_clearance`
alone, since the part's pitch sets their gap.
