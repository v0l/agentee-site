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
