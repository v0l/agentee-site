Dielectrics follow the same Djordjevic-Sarkar model as the 2D solver (their `er` and
`loss_tangent` taken at 1 GHz), as a set of Debye poles log-spaced from a thirtieth of the lowest
frequency to thirty times the highest, one polarisation current per pole on each dielectric edge
(within 3% of the model's loss tangent and 0.01 of its er across the band). The loss therefore
grows with frequency the way it should, and on a 50 ohm microstrip it lands within 4% of the
Hammerstad filling-factor formula at 1.5, 2.2 and 3 GHz. Edges that carry a port, a lumped part
or copper keep a conductivity fixed at the band centre instead. Copper layers are sheets with a
surface impedance that varies with frequency, so both the resistance and the internal inductance
follow the skin effect, the roughness and the finish across the band, updated implicitly so the
sheet stays stable at any time step. A zero-thickness sheet has one current, while real copper
carries it on two faces, so each sheet edge tracks the magnetic field just above and below it
through the run and takes its impedance as (Jtop^2 Ztop + Jbottom^2 Zbottom) / (Jtop + Jbottom)^2:
one half of the face impedance for a centred stripline, close to the bottom face's for a trace
over a plane.

Each face has its own surface impedance, a function of frequency:

- A copper face is a copper slab of the layer's thickness, sqrt(j w mu rho) coth(gamma t), which
  settles to rho / t at DC, times the stackup roughness as a causal complex factor (Dmitriev-Zdorov,
  Simonovich and Kochikov, "A Causal Conductor Roughness Model and its Effect on Transmission
  Line Characteristics", DesignCon 2018, table 1). Its loss part is exactly the Hammerstad-Jensen
  1 + (2/pi) atan(1.4 (rms / skin depth)^2) or the Huray 1 + 1.5 ratio / (1 + d/a + d^2 / 2a^2)
  at every frequency, and the same function adds the inductance that causality demands.
- With `finish = "ENIG"` the faces of the outer layers that face away from the board are gold over
  nickel over the copper slab, each metal a transmission line section of its own impedance
  sqrt(j w mu rho) and thickness. Under a stackup mask layer only the pads are plated. The nickel
  is the plated nickel that Shlepnev and McMorrow identified from ENIG microstrip
  measurements ("Nickel characterization for interconnect analysis", IEEE EMC Symposium 2011):
  resistivity 1.0e-7 ohm m and a Landau-Lifshitz permeability falling from 6 to 2 through a
  resonance at 2.6 GHz with damping 0.18 f0. Gold is 2.44e-8 ohm m. With the default 4.5 um of
  nickel and 0.075 um of gold the plated face has 6 to 8 times the resistance of smooth copper
  from 0.3 to 3 GHz, peaking at the resonance, and about 3 times from 6 to 40 GHz. Faces against
  a dielectric stay rough copper, and the plated face takes no roughness.

Each distinct face (per copper thickness) is fitted with a common set of about 24 poles by vector
fitting (Gustavsen and Semlyen, IEEE Trans. Power Delivery 14(3), 1999) from a thousandth of the
band centre to 100 times the top frequency (within 0.02% of the functions above for a 20 GHz
band centre), and made passive by raising the series resistance if the fit dips below zero
anywhere. The sheet edge steps one state per real pole and one complex state per pole pair,
shared between its two faces, with the trapezoidal rule, so the discrete sheet is the bilinear
image of the fitted impedance (a CPU replay of the table matches it to 5e-6).

A grid puts a zero-thickness edge about a third of a cell past its last mesh line, so a strip
drawn on the grid reads wider than it is, and real copper of thickness t reads wider again by
(t / 2 pi)(1 + ln(4h / t)) per edge, h being the distance to the nearest other copper layer
(the Hammerstad-Jensen thickness correction). The mesher sets the last line of each trace, pad
and pour edge so the two land together: the grid's own offset comes from a finite difference
solve of a slit on the local cell shape. A 0.3 mm microstrip on 0.15 mm of air reads 81.9 and
82.2 ohm at 0.05 and 0.025 mm cells against 82.4 ohm from Hammerstad-Jensen with 35 um copper;
drawing the edges on mesh lines gave 82.6 and 85.1.

The current crowding at a trace edge is narrower than a cell, so the cells within four of an
edge get their resistance from the thin strip edge solution instead: the same slit solve gives
how much current the grid puts in each cell, and the loss of each band is the thin strip
integral cut short of the edge (Lewin and Vainshtein's stopping distance method). For a square
edge of thickness t that distance is t e^-pi / (4 pi), from a conformal map of the slab edge in
the strong skin effect limit. The 0.3 mm microstrip at 3.5 GHz reads 11%, 3% and 0.5% over
the 2D field solver at 0.1, 0.05 and 0.025 mm cells, and a 0.2 mm stripline 3% at 0.05 mm.
