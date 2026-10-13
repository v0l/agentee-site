`agentee fit NAME [--strategy tight|balanced|spread] [--aspect 1.5 ...] [--width MM] [--height MM]
[--verify N] [--write]` (MCP `fit`) finds the smallest rectangular board the layout fits on. It
loads the layout once and tries outlines in memory, tens to hundreds a second: the current placement
scaled to the new size (turned a quarter when the new board is the other way round), mounting
holes kept in their corners, edge connectors kept on their edge and slid along it until clear,
then every other part legalised with the strategy's gap between parts (0.1, 0.2 or 0.4 mm). A
size fits when every part finds a spot and the routing demand (each net's half perimeter spread
over its bounding box on 1 mm tiles) in the busiest twentieth of the board stays under 90%, 70%
or 50% of what the signal layers hold at the `Default` class track and gap. Each aspect ratio
(the current one and 13 from 0.42 to 2.38 by default, or `--aspect` repeated) is searched
separately; `--width` or `--height` holds one side. The smallest sizes then go through the
access stage and the global router, `--verify` of them (3 by default, 0 skips it), and the
smallest one with no more stuck pads than the current board and global overflow under 3%, 1% or
0.2% of its wirelength wins. The table gives each aspect's smallest fitting size and what stopped
the next size down. `--write` sets `[outline] size` in the board file, writes the placement with
the routing cleared, and settles the labels; run `agentee layout NAME` after it. Place the layout
first, since the search starts from the arrangement it has; board texts and artwork stay where
they are.
