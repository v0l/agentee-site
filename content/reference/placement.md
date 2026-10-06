`agentee place NAME [--parts 'U*,C1?'] [--keep-placed] [--side F|B|both] [--seed N] [--dry-run]`
(MCP `place`) places the parts of the layout's schematic inside the board outline and writes each
one's `at`, `rotation` and `side` into its `[[footprints]]` entry (adding entries for new parts,
dropping a moved label's `at`), moves the reference labels that now fail a silk check, then
refreshes the stored fills. It is a quick start for a whole
board: place, look at it, then move what matters by hand and lock it. `--parts` places only the
matching parts and leaves the rest where they are; `--keep-placed` leaves every part that already
has a placement; `locked = true` on a `[[footprints]]` entry is never moved. `--side both` lets
decoupling caps of a BGA go under it on the back and passives spill to the back when the top is
full; the default puts everything on the top. The result depends only on the files and `--seed`,
so a different seed is a different start. It reports the half-perimeter wirelength (HPWL) of the
signal nets and of every net, ratsnest crossings, courtyard overlaps and the mean and worst
decoupling distance, for the placement it started from (when every part had one) and for its own,
plus the clusters it built and the edge each connector went to. Tracks and vias already in the
file stay where they are; place an unrouted board, or `route --reroute` after. The labels are
moved with the same search as `agentee silk` (a clear spot beside the part, up to 8 passes and 3
tries a label), run on the placed layout in memory, so the project is loaded once more, not once
a pass; `labels_moved` counts them and `labels_failing` names the ones left without a clear spot,
for `agentee silk NAME --hide` or a hand move.

What goes where, strongest first, and why:

- Connectors (parts with `edge = true` pads, `overhang = true`, or a `J`/`P` reference) go on the
  board edges, each edge spread evenly, with the mating side out: the edge line is the
  footprint's `Dwgs.User` line next to a text saying `edge` (KiCad's `PCB Edge` mark), else the
  outer side of its `edge` pads, else its pads plus `min_part_to_edge` for an overhanging part,
  else its courtyard plus `min_body_to_edge`. An RF connector (SMA, SMB, BNC, U.FL, MMCX, coax)
  and a USB connector never share an edge unless no other split fits, since USB 3 noise lands in
  the 2.4 GHz band (Intel, "USB 3.0 Radio Frequency Interference Impact on 2.4 GHz Wireless
  Devices", 2012). `[place] edges` pins a connector to an edge. Mounting holes go in the corners
  (diagonal first), fiducials in the free corners with their pads 3 mm or more from the edge,
  clear of the conveyor rails and clamps (SMEMA Fiducial Mark Standard 3.1).
- An RF path is laid in a straight line. Starting at each connector with a pad on an RF net (a
  class with `impedance` and no `diff_gap`), the placer follows RF nets through the parts that
  carry two or more of them and have at most 16 pins (DC blocks, attenuators, switches, LNAs,
  baluns), and takes the longest path that ends at another connector or at a larger chip with
  RF pins; a switch with a bypass goes through the amplifier, not the bypass. When both ends
  are connectors they go on opposite edges of the board's long axis and slide along them onto
  one line, through the board centre where both fit. Each part on the path turns so its input
  and output pads sit on that line, in order, packed toward the input with at most 1.5 mm of
  extra gap each, and the rest of the room goes to the last run. A two or three pin part with
  one pad on a node of the path (an ESD clamp, a bias choke, a shunt cap) sits beside the line at
  that node, turned so its other pads point away, close enough that its RF pad meets the track and
  far enough that its other pads keep the class clearance; two shunts at one node take opposite
  sides. The path is fixed before the rest is placed around it, and a part that would leave the
  board or land on another is left to the general placer.
- Large chips (BGA, 16+ pin packages over 25 mm2, else the highest pin count part) are pulled to
  the board centre and kept within `off_centre` of it, where they have room to escape their pins on every side (Xilinx UG1099,
  Recommended Design Rules and Strategies for BGA Devices) and away from the edges and
  mounting holes, where handling and depaneling bend the board and crack BGA joints
  (IPC/JEDEC-9704A strain guidelines).
- Clusters come from the netlist: each IC takes the passives whose signal nets reach it alone,
  the capacitors between a supply it uses and ground (the nearest IC in the schematic when
  several share the supply, spread over its supply pins), and its crystal. A cluster's decoupling
  caps sit next to the supply pin they serve (Analog Devices MT-101, Decoupling Techniques; TI
  SCAA082, High-Speed Layout Guidelines), or under it on the back with `--side both` (Xilinx UG483,
  7 Series PCB Design Guide, puts the small caps under the BGA); the crystal next to its clock
  pins (ST AN2867, Oscillator design guide). Clusters are placed to minimise weighted HPWL:
  nets of an impedance or pair class, `[[pairs]]` and `[[interfaces]]` count three times, supply
  and ground nets not at all (they are planes).
- A switcher (an IC with an inductor on one of its pins whose other end is a supply) keeps its
  inductor and input caps tight against it, and switchers keep 8 mm (centre to centre) from
  sensitive parts:
  crystals and parts on single-ended impedance (RF) nets (TI SNVA021, AN-1149 Layout Guidelines
  for Switching Power Supplies; Linear Technology AN139, Power Supply Layout and EMI).
- Hot parts (sources of 0.25 W or more in a thermal sim of this layout, and large packages over
  49 mm2) are pushed 10 mm apart so their heat does not stack (TI SNVA419, AN-2020 Thermal Design
  by Insight, not Hindsight; IPC-2221B, thermal management). Where the hot parts, each grown by
  `hot_distance`, take at most a quarter of one side of the board, their courtyards must also
  keep `hot_distance` apart, as `placement-hot-parts-close` measures it (a part that fits nowhere
  else drops the rule); on a tighter board wirelength wins. `hot_spread` in the output gives that
  share and whether the rule applied.
- Ceramic capacitors of 0805 or larger stay out of `flex_zone`, and smaller ones inside it lie
  along the edge, corner or mounting hole they are nearest (Murata and TDK MLCC mounting guidance
  on board flexure; Knowles). The zone is measured as the `mlcc-flex-zone` checks measure it,
  from the two pads to the outline, the board cutouts and the mounting hole drills; a last pass
  turns or moves (up to 12 mm) any capacitor still in the wrong spot. Every body keeps
  `min_body_to_edge` from the outline and from each `[[outline.cutouts]]` hole of the board file,
  which is off the board, courtyards never overlap on a side (through-hole parts block both
  sides), and nothing enters a `[place] keepouts` polygon (IPC-7351B courtyards: the courtyard is
  the least area a part and its land pattern need).
- Rotation follows the main nets: each part takes the quarter turn that brings its pads nearest
  the other ends of its nets, and the passives of a cluster share one axis.

The method: each cluster (an IC and its members) and each loose part becomes a block with the
area of its parts. A spectral layout of the weighted clique graph of the blocks (its two lowest
non-trivial eigenvectors, by rank) orders them on the board. Then 24 rounds alternate a quadratic
wirelength solve and a spreading step: the solve pulls pins, not centres, for chips, and picks
each chip's quarter turn every round (by wirelength, and in the later rounds by the crossings of
its two-pin nets too); connectors are pulled onto their nearest edge and large chips to the
centre; the spreading step bisects the free board area (inside the outline and clear of cutouts,
keepouts and placed parts) in turn along its longer side, giving each block a region the size of
its area, and each round pulls the blocks harder to their regions. Connectors are then assigned
to edges (every assignment tried up to seven connectors, greedy past that) and slid along them,
flush with the outline where it runs at that point (a notch or a step counts as edge), trying
the other edges nearest first when no spot on the assigned one is free,
and the solve runs again with them fixed. Legalisation places each cluster as a whole: its anchor
at each quarter turn (for chips) and five nudges of a third of the cluster's width, its members
around it, keeping the cheapest by wirelength and crossings; each part goes to the nearest spot on
a 0.05 mm grid where its courtyards clear everything and it keeps the edge rules. Whole clusters
are then placed again turned or nudged, and pairs of chip clusters of a similar size swapped,
where that lowers the cost. A simulated annealing refinement follows (shifts, quarter turns,
swaps of same-size parts, whole cluster moves, side flips with `--side both`; 1500 moves a part,
then 500 more at a low temperature), scored by weighted HPWL, crossings of two-pin nets (4 per
crossing), and the rules above as penalties. Eight starts (the eight reflections of the spectral
layout) are legalised on parallel threads, and the three cheapest go on to the cluster moves and
the annealing, so the result depends on the files and `--seed` only, not on the number of threads.

Parts keep off the board's own silk: `[[graphics]]` lines on a silk layer, silk text with
`locked = true` and silk `[[artwork]]` block the courtyards on their side (a part that fits
nowhere else may still cover them). Silk text that is not locked does not block parts: after
placing, each such text a part (or its reserved label) covers moves to the nearest clear spot on
the board within 10 mm, clear of parts, labels, locked silk and the other texts; `texts_moved`
lists the moves written back into `[[graphics]]` and `texts_stuck` the texts with no clear spot.
Connectors, mounting holes and fiducials reserve a label too, on the outer side of the part or
turned to the inner side, and go without one where neither fits at the spot the part takes. Each part's reference label needs room too: where the labels take at most a quarter of the
free board area, a box the size of the reference text (0.2 mm around it, at the footprint's
reference spot pushed clear of its own pads and silk) is kept clear like a courtyard, and place
writes that spot as `label.at`; on a fuller board with room left the overlap of those boxes with
other parts and labels is a small cost in the annealing instead, and on a full board labels are
left to the label pass (`agentee silk --hide` for the ones with no spot).

On a copy of `examples/sdr` with the tracks and vias removed (251 parts, 65 x 45 mm), top only,
seeds 1 to 4 give 3276 to 3436 mm of signal HPWL and 261 to 293 crossings, in about 2 s of solve
on 4 cores (about 6 s of CPU) plus loading and the label pass. With `--side both` they give about
1955 to 2025 mm and 150 to 165 crossings.
