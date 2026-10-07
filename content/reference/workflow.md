1. `agentee search symbol lm358` then `agentee import symbol Amplifier_Operational:LM358 --with-footprint`
   when KiCad has the part. Imports land in `symbols/` and `footprints/`.
2. Otherwise `agentee new symbol NAME` / `agentee new footprint NAME` and edit the starter file.
3. `agentee new board NAME`, pick a stackup preset and fab, add net classes.
4. Quick-start placement: once the schematic checks, `agentee place NAME` puts every part on the
   board (connectors on edges, big chips central, decoupling caps at their pins). Look at it with
   `agentee render pcb:NAME`, move and `locked = true` the parts that matter, run `agentee place
   NAME --keep-placed` or with another `--seed` for the rest, then `agentee silk NAME`.
5. `agentee check` until there are no errors, `agentee render NAME -o out.png` to look.
6. `agentee view` keeps a live window open for a human, who can also move parts, route tracks
   and place vias there and save them into the layout.
7. `agentee fab NAME -o fab/` writes the manufacturing package once the layout has no errors.

## Rendering part of a design

`agentee render` (MCP `render_item`) draws what the viewer draws. Without the side panels
(`--canvas-only`) the PNG is cropped to the drawing, and `--width` and `--height` cap its size.

| flag | does |
|---|---|
| `--region x0,y0,x1,y1` | zoom to that rectangle, in mm in the item's own coordinates |
| `--focus A,B,...` | schematics and layouts: zoom to these references, net names or `REF.PIN`, `*` matching any run of characters. A net brings in the parts it touches, a pin its net |
| `--context dim\|hide\|show` | what happens to everything outside `--focus` (default `dim`) |
| `--rulers` | label mm coordinates along the top and left edges |
| `--show` / `--hide` | layers to turn on or off, e.g. `--hide F.Cu --show In1.Cu` |

A name that matches nothing is an error. `--region` with `--focus` keeps the filter and uses the
region for the zoom.
