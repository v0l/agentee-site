Once check has no errors, a layout turns into a package a fab and an assembly house accept as is. This guide covers writing it, pricing the parts, and getting a 3D model out for the enclosure.

## Write the package

```sh
agentee fab pcb:NAME -o fab/
```

`fab` refuses while the layout has errors. With none, it writes:

| file | what |
|---|---|
| `F_Cu.gbr` ... `B_Cu.gbr` | copper per layer, RS-274X with X2 file attributes, zone fills as regions |
| `F_Mask.gbr`, `B_Mask.gbr` | mask openings at the pad outlines, vias tented |
| `F_Paste.gbr`, `B_Paste.gbr` | paste on SMD pads |
| `F_SilkS.gbr`, `B_SilkS.gbr` | silk in the Hershey stroke font, with the version watermark |
| `Edge_Cuts.gbr` | the outline and each board cutout |
| `drill-PTH.drl`, `drill-NPTH.drl` | Excellon drills, slots as G85; one more file per blind, buried or microvia span on HDI boards |
| `bom.csv`, `bom-jlcpcb.csv` | the BOM, grouped by value, footprint, `mpn` and `lcsc` |
| `cpl.csv` | placement, in JLCPCB's columns |
| `fab-notes.txt` | version, stackup, finish, impedance classes, via types and what to fill |
| `NAME.d356` | IPC-D-356A netlist for the bare-board electrical test |
| `testpoints.csv` | every test pad, for the fixture builder |
| `NAME-gerbers.zip` | every Gerber and drill file, ready to upload |
| `assembly-top.png`, `assembly-bottom.png` | fab and silk layers for the line |

Coordinates are millimetres with Y up, the same in the Gerbers and the placement file. Parts marked `dnp`, parts with `assembly = "no"` in their fields, and mounting holes and fiducials stay off the BOM and placement.

## Ordering from JLCPCB

1. Upload `NAME-gerbers.zip`.
2. Pick the same stackup the board spec names. For impedance controlled boards, choose the build by its code (`JLC04161H-7628` and so on); every width check solved assumes it.
3. Match the finish, mask colour and copper weight to `fab-notes.txt`.
4. For assembly, upload `bom-jlcpcb.csv` and `cpl.csv`. Fill the `LCSC Part #` column by giving each part an `lcsc` field in the schematic:

```sh
agentee edit sch NAME set C1 --field lcsc=C14663
```

`fab-notes.txt` lists anything the fab has to do beyond the defaults: vias in pads to fill and cap, edge pads to keep, impedance classes with their target, layer and width. Paste the relevant lines into the order notes.

## The watermark

Every package carries `agentee vX.Y.Z-HASH` in its silk: the version that built it and the git commit of its source, with `-dirty` when the tree had uncommitted changes. It sits on the bottom silk by default, at the clear spot nearest the bottom left corner, and `fab-notes.txt` says where. It cannot be turned off, and the package is refused when there is no room for it. Set `[watermark] at` in the layout to choose the spot yourself.

## Price the BOM

```sh
agentee parts NAME --boards 5
agentee parts NAME --refs C11,R8 --json
agentee parts NAME --distributor farnell --farnell-store ie.farnell.com
```

`parts` looks up every BOM line at Mouser and Farnell by its `mpn` field, so give every part `mfr` and `mpn` first; lines without one are skipped. The keys live outside every project, in `~/.config/agentee/distributors.toml`:

```toml
[mouser]
api_key = "..."

[farnell]
api_key = "..."
store = "uk.farnell.com"
```

For each line it picks the cheapest listing that is in stock for the quantity and not obsolete, honouring minimums and multiples and buying up to a price break when that costs less in total. Then it looks for cheaper parts that drop in:

- resistors with the same value, tolerance or better, and the same case;
- ceramic capacitors with the same value, a voltage no lower, a dielectric no worse (C0G stays C0G, X5R may become X7R) and the same case;
- generic discretes like 2N7002, BAT54 or SMAJ with the same name and package;
- indicator LEDs of the same colour and case.

ICs and connectors only get the same part at the other distributor, or the distributor's suggested replacement. Write a swap into the part's `mpn`, not into the BOM, so the next run and the next package agree.

## Export for the enclosure

```sh
agentee models
agentee export pcb:NAME -o NAME.step
```

`export` writes one STEP assembly: the board as a solid of the stackup thickness with its holes, slots and cutouts, and every part as an instance named by its reference. Vendor STEP models go in as the vendor wrote them, written once however many parts use them; VRML models and generated bodies go in as faceted surfaces, and a part with no model as a box over its fab outline. The board's bottom face is at z = 0, Y up.

`agentee models` fetches the KiCad library models the footprints name into a cache first, and reports any it cannot find. A footprint can also name an `https://` URL to a vendor's STEP file, pinned to a commit so it cannot change under you.

## Before you press order

- `agentee check` is clean, and so is `agentee drc NAME` with the notices you chose to ignore written down in `DESIGN.md`.
- Every simulation is current: check warns about stale results.
- The renders look right: `agentee render pcb:NAME`, and the assembly drawings in the package.
- `agentee view --3d` shows the parts where you expect them.
- The test pads you need are there: `agentee testpoints NAME --dry-run` lists what it would add.
