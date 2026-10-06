Every key below has an `agentee edit` command that writes it, so you never have to type TOML.
`agentee edit sch help`, `agentee edit pcb help` and `agentee edit board help` list them all with
their flags; `agentee edit sch NAME --list` prints an item's parts and nets as JSON.

```sh
agentee edit sch NAME add R1 R 10k --footprint R_0402_1005Metric --at 25.4,25.4
agentee edit sch NAME net VBUS C1.1 U1.7 --class Power
agentee edit pcb NAME place R1 12.7,20.32
agentee edit board NAME class RF --impedance 50ohm --coplanar-gap 0.2mm --solver field
agentee edit sch - < script.txt        # a list of commands, one load, one check at the end
```

A pin is `REF.PIN`, by number or by a unique pin name; a name several pins share is an error. A
pin given a net it is already on moves to the new net. The file keeps its comments and layout.
`agentee edit` writes the file, refills a layout's stored zone fills, then reports the check
diagnostics of the files it touched, and exits 1 if any of them is an error.
