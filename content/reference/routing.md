`agentee route NAME --nets 'FX_D*,SPI_*' --layers F.Cu,In2.Cu,B.Cu` (MCP `route`) routes the
ratsnest of the named nets on a grid (`--grid`, default 0.05 mm) and appends the tracks and vias
to the layout file as ordinary `[[tracks]]` and `[[vias]]`, so they are yours to edit afterwards.
It keeps each net class's width, clearance and `layers` against every pad, track, via, hole and
the board edge, sizes the room for each class via by its own pad, drill and layers (a microvia fits
where a through via does not, and a microvia may sit beside a buried via on other layers), keeps new
vias `min_hole_to_hole` from every drill whose span shares a dielectric with theirs and their holes
`min_via_hole_to_copper` from other nets' pads, tracks and vias, keeps them off SMD pads of every
net, its own too (the via copper may not touch one, `via-cuts-pad`, and the hole stays
`min_hole_to_smd_pad` from it, `hole-to-smd-pad`, unless `--via-in-pad`, MCP `via_in_pad`, lets it sit
wholly inside an SMD pad of its net with a drill of at most `max_filled_via_drill`), uses the class vias to change
layer, the cheapest whose span holds both layers (`--via uv-top,core` or MCP `via` to choose from other
names instead, `--via-cost` in mm of
track, default 3, times the via's `cost`), charges `--bend-cost` mm of track for
each 45 degree bend (default 0.1, three times that for 90), and never moves what is already there
unless `--reroute` is given, which deletes the named nets' tracks and vias first. A connection that finds no free path rips up the routed nets
it would cross or whose via holes it would bring within `min_hole_to_hole` of its own (holes whose
spans share a dielectric), remembers the spot as congested, and those nets go back in the queue. The search
steps in 45 degree directions and charges for every bend, so paths come out as straight runs with
45 degree bends; afterwards runs are pulled tight with two-segment 45 degree doglegs and any 90
degree corner left is chamfered where it clears. Only the stub into an off-grid pad centre may sit
at another angle. Where the class width does not fit into an end pad (wider than the pad's smaller
side, or too close to the neighbouring pads to keep clearance), the route necks down: the class
width track stops short of the pad and a separate `[[tracks]]` entry with an explicit `width` runs
straight into the pad centre, at most the class `neckdown` long and no narrower than
`min_track_width`. Its width is the smallest of the class width, the pad's smaller side and the
widest that keeps clearance, rounded down to 0.01 mm (or exactly `min_track_width` where rounding
would drop under it and the unrounded width does not); the wide track starts at the first spot out
from the pad where its full width keeps clearance (and, for a pad narrower than the track, outside
the pad). Pads of one net that touch, like a thermal pad built from several pad entries, count as
one wide pad. Pairs routed with `--pairs` do not neck down. A connection of a net that already has fresh copper starts from that copper. A connection
that finds no path even through the nets it could rip up waits for the other connections of its
net and tries once more from the copper they add. Classes route one after another, the tightest
first (fewest allowed layers, then the widest track plus clearance), each held fixed for the
next. Once a class is in, every net of it with vias is ripped up and routed again with vias four
times dearer and the rest held fixed, and the new route stays when it has fewer vias (or joins
more), pass after pass while one saves a via. Then
each routed connection that uses vias is tried again on one layer at a time with the rest held
fixed, and the one-layer route replaces it when it is at most 25% plus 1 mm longer. Then the
vias of neighbouring parallel connections that change layer near each other are slid along their
own tracks onto a common row or column on the grid, where the spot is legal and the connection
keeps its length (pair legs held by `--pairs` and nets with several connections stay put). A net in an
interface with `max_vias` keeps the trace (every net of the lane, through series parts) within
it: a route with too many vias is tried again with dearer vias, then on one layer, and fails with
the reason if neither fits. The second net of a pair is drawn toward its
partner at the pair gap; `--pairs` tries to route both halves together as one coupled track
first. When connections fail, the whole route runs again, up to four times in all, with the
failed nets first in their class and their class first, and a cost on the path they would take
through the copper of earlier classes so those classes leave it free; the run with the fewest
failures, then the fewest vias, then the least track is written. When a few connections fail, route them again together with the nets around them and
`--reroute`, so the router can rip up and reorder the whole area, or drop to `--grid 0.025`. `--dry-run` reports without writing. Route the nets that matter by hand
first, then let the router fill in the rest, a class at a time.

A net with a `[[zones]]` entry is a plane net. A glob in `--nets` never matches it, so
`--nets '*'` routes every signal and supply that has no pour and leaves ground to the planes;
name the net exactly to route it with tracks anyway. Vias placed by `[[stitching]]` rules are not
obstacles to the router: the rule places them again around the new copper.

`agentee tie NAME [--nets GND] [--dry-run]` (MCP `tie`) connects each SMD pad of a plane net to
the nearest layer its zone covers with a short stub and a via beside the pad, which is how ground
and supply pads join a plane instead of tracks between them. The via goes on the side of the pad
away from the part's centre, as close as it can: its copper clear of every SMD pad (its own too,
so no via-in-pad), its hole `min_hole_to_smd_pad` from them, `min_hole_to_hole` from other holes,
`min_via_hole_to_copper` and the class clearance from other nets, `min_copper_to_edge` in from
the outline, and the stub clear of other nets on the pad's layer. It tries 16 directions, nearest
the outward one first, up to 1.2 mm past the pad. A pad that already has a via of its net within
0.8 mm of its edge is left alone, through-hole pads and BGA balls (`escape` handles those) are
skipped, and a pad with no legal spot is listed under `failed`. The stubs and vias are appended
as ordinary `[[tracks]]` and `[[vias]]`.

`agentee neck NAME [--nets 'VBUS,RF_*'] [--taper] [--dry-run]` (MCP `neck`) necks down copper that
is already there. It looks at both ends of every track of the named nets (default all) that end
inside a pad of their net on their layer, and takes the ones that are wider than the pad's smaller
side, or whose full width breaks clearance within the class `neckdown` length (plus one track
width) of the pad. Such an end is cut: the track keeps its width from the cut outward and a new
`[[tracks]]` entry with an explicit `width` runs from the old end point in the pad to the cut,
along the old path. The neck width is the smallest of the track width, the pad's smaller side and
the widest that keeps clearance along the neck, rounded down to 0.01 mm (or exactly
`min_track_width` as above). The cut is the first spot, in 0.01 mm steps, where the full width
keeps clearance for the next `neckdown` plus one track width (and, for a pad narrower than the
track, lies outside the pad); a neck is never longer than `neckdown` and never under
`min_track_width`, otherwise the end is listed under `failed` with the reason and left alone. A
pad built from several same-net pad entries that touch counts as one wide pad. `--taper` steps
the width back up over a short chain instead of one neck: past the narrow neck come up to two
more entries, each a third of the way from the neck width to the track width, together no longer
than `neckdown` (three times the neck, at most). The copper only ever gets narrower, so no new
clearance error can appear; the file is edited in place (every other line is kept) and stored
zone fills are refreshed. The report lists each neck (track index, net, pad, why, width, length,
entries) and counts the tracks changed and added.

Pairs and length rules live in the layout too:

```toml
[[pairs]]                      # optional: nets ending _P/_N, _DP/_DN, +/-, P/N in a class
p = "USB_DP"                   # with diff_gap are paired on their own
n = "USB_DN"
max_skew = "0.1mm"             # or `max_skew` on the net class

[[match_groups]]
name = "ddr-dq0"
nets = ["DQ?", "DQS0_*"]       # * and ? globs
tolerance = "0.5mm"
# target = "42mm"              # default the longest member
```

Check reports each pair's skew in mm and ps (from the layer's effective permittivity), a stretch
of the pair run at the wrong gap, and pairs that spend less than 80% of their length side by side.
Match groups say which net is short or over and by how much. A pair that runs through series
two-pin parts, like the AC caps on a USB lane, is measured end to end: its skew is the sum over
every pair it joins, reported as `FX_TX1_P+SS_TX1_P/FX_TX1_N+SS_TX1_N`.
