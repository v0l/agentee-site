Give every class the highest voltage its nets carry, `voltage = "3.3VDC"`, `"0VDC"` for ground,
`"48VDC"`, `"-12VDC"` or `"230VAC"` (AC is rms against 0 V); a class without one is a warning.
agentee works out the spacing from it:

- **Its own clearance.** A class with a `voltage` and no `clearance` gets the IPC-2221B table 6-1
  spacing for its peak voltage on an outer uncoated layer (column B2), and never less than the
  fab's `min_clearance`. A `clearance` set below that is an error naming the figure.
- **Between classes.** Every pair of classes is held apart by the voltage between them: the
  difference of their DC parts plus both AC parts at peak. A class with no `voltage` counts as
  0 V. A class over the SELV limits (60 VDC, 30 VAC) and one at or under them get
  **reinforced** insulation; two classes on the same side get **functional** insulation.
- **Functional** spacing is IPC-2221B B2 clearance and IEC 60664-1 table F.4 creepage for printed
  wiring at the board's pollution degree. **Reinforced** spacing is clearance for the next rated
  impulse voltage above the one the working voltage sees (IEC 60664-1 tables F.1 and F.2,
  overvoltage category II for AC, which is taken as mains, and the peak for DC) and twice the basic
  creepage for material group IIIa (FR4 of unknown CTI), never under the IPC-2221B figure.
  AC classes are rated 10% over their nominal for mains tolerance. 230 VAC to SELV comes out at
  3 mm clearance and 5.06 mm creepage.

Pairs that need more than their class clearances become barriers between implicit domains, one
per class, so the `isolation-clearance` and `creepage` rules check them, and pours and the
autorouter keep them, exactly as for hand written ones. Pads of one footprint are only held to the
barrier between their classes, not to the class clearance, since the part's own pitch is rated by
its maker. A hand written `[[domains]]` entry that names a class takes that class out of the
implicit ones, and a hand written `[[barriers]]` entry between two domains replaces the implicit
one. `agentee show board:NAME` lists every barrier with its working voltage and grade.

`pollution_degree = 2` at the top of the board file (1, 2 or 3, default 2) picks the columns.

Give each conductor that can stand at a different voltage its own class: `DC+ = "400VDC"` and
`DC- = "-400VDC"` (800 V apart), and `L1`, `L2`, `L3` at `"230VAC"` each. Nets inside one class
are only held to that class's own clearance, so L1 and L2 in one `Mains` class would miss the
line to line voltage. Two AC classes are taken as in antiphase (L1 to L2 at 460 V rather than
398 V), which errs on the safe side.

The opposite case is a group of nets that move together: the high side of a half bridge, where
the bootstrap, the gate drive and the gate sit within 15 V of the switch node while the node
swings over the whole bus. Put them in one class with `voltage = "430VDC"`, what they reach
against ground, and `own_voltage = "15VDC"`, the most they differ from each other. `voltage` keeps
setting the class clearance to every other class and the barriers; `own_voltage` sets the
clearance between two nets of the class (IPC-2221B B2 for its peak, never under the fab's
`min_clearance`), on tracks and between pads of one footprint. Pours keep the class clearance,
and `agentee route` keeps it too, so route these few nets by hand or let them take the wider gap.

The voltage reaches further than spacing:

- A DC sim `[[supplies]]` pad with no `voltage` is held at its net's class voltage.
- Every power net of a DC class that `rails` does not list (ground, a net of a class with a
  `current`, or a net named like a rail) becomes a rail for the signal level check, at the class
  voltage, or at the voltage in its name when that is lower (`1V8` in a `3.3VDC` class is a 1.8 V
  rail). Signal nets of the class are not rails.
- A capacitor's rating (`100n/50V`, `10u 25V`, or a `voltage` field) and any part's
  `rated_voltage` field are checked against the peak voltage between the classes of its nets, with
  a class without `voltage` taken as 0 V: under it is an error, under 1.25 times it a warning.
