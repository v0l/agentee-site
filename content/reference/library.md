The parts library is the user's own set of parts: the connectors, regulators, passives and
anything else they want every design to reuse, so cables and stock carry between projects. Each
part holds its symbol, footprint, 3D model, datasheet and last checked stock, and an agent picks
from it before reaching for anything new (MCP `library_find`, `library_list`, `library_show`,
`library_use`, `library_add`). The workflow for each part a design needs is find, add, use:
`find` shows the library parts that match and, when none does, current parts in stock at the
distributors; the chosen one goes into the library with `add` and onto the board with `use`.

It lives in `~/.config/agentee/library/` (`$AGENTEE_LIBRARY` moves it), and a project can add or
override parts in `.agentee/library/` at its root. Each part is a directory:

```
JST-PH-2/
  part.toml
  JST-PH-2.sym.toml            # the symbol, renamed to the part
  JST_PH_S2B-PH-K_1x02_P2.00mm_Horizontal.fp.toml
  3dmodels/JST_PH_S2B-PH-K_1x02_P2.00mm_Horizontal.step
```

```toml
role = "connector"
mpn = "S2B-PH-K-S"
manufacturer = "JST"
lcsc = "C131337"               # the JLCPCB/LCSC part number, looked up by `add` and `refresh`
value = "PH 2-pin"
rating = "2 A, 100 V"
preferred = true               # the first choice for its role
# generic = true               # any value on this footprint is this part (a resistor series)
# pins = 2                     # default the symbol's pin count
tags = ["power", "battery"]
notes = "power input, 2 A max, use XH for motors"
symbol = "JST-PH-2.sym.toml"
footprint = "JST_PH_S2B-PH-K_1x02_P2.00mm_Horizontal.fp.toml"
model = "3dmodels/JST_PH_S2B-PH-K_1x02_P2.00mm_Horizontal.step"
added = "2026-10-09"

[datasheet]                    # pinned in the datasheet cache
url = "http://www.farnell.com/datasheets/4648554.pdf"
sha256 = "dd60971f..."

[[files]]                      # where each file came from and its hash when added
path = "JST-PH-2.sym.toml"
source = "kicad Connector_Generic:Conn_01x02, KiCad 9.0"
sha256 = "42b88f96..."

[[stock]]                      # one per distributor listing, from add or refresh
distributor = "Farnell"
sku = "9491902"
stock = 338281
currency = "EUR"
breaks = [[100.0, 0.0841], [1000.0, 0.0655]]
min = 100
url = "https://ie.farnell.com/search?st=9491902"
checked = "2026-10-09"
```

```sh
agentee library add S2B-PH-K-S --name JST-PH-2 --role connector \
    --symbol Connector_Generic:Conn_01x02 \
    --footprint Connector_JST:JST_PH_S2B-PH-K_1x02_P2.00mm_Horizontal \
    --manufacturer JST --rating "2 A, 100 V" --notes "power input" --preferred
agentee library find 3.3V buck --role regulator   # library matches, else stocked parts to add
agentee library find USB-C receptacle --need 100 --search
agentee library list                           # every part, by role, with stock and price
agentee library list --role connector 2-pin power
agentee library show JST-PH-2
agentee library use JST-PH-2 -p board/         # copy its files in, print the edit that places it
agentee library refresh                        # stock and price of every part, one lookup each
agentee library verify
```

`find WORDS` lists the library parts whose name, role, tags, part number, value, rating,
footprint or notes match every word. Only when none matches (or with `--search`) it runs the
same words as a keyword search at each distributor with a key and lists the parts that are
active (no obsolete, end of life or discontinued status) with at least `--need` in stock (default
1), merged by part number: total stock, the distributors that have it, the best unit price at
that quantity, and the datasheet link. Parts stocked at more distributors come first, then by
stock; `--limit` caps the list (default 15). A listed part already in the library says so.

`add` takes the symbol and footprint from a `.sym.toml` or `.fp.toml` file, a symbol or footprint
of the project (`-p`), or a KiCad `Library:Name`; the footprint defaults to the symbol's. It
copies the footprint's 3D model in (from the KiCad model directories, the model cache or a
download), points the footprint at the copy and sets its `height` from the model when it has none, so a part works offline and keeps working when a
KiCad install or a vendor download changes. When KiCad has no model of that name, it takes the
nearest body in the same `.3dshapes` folder, the same package with the closest exposed pad (or the
plain body of a `_ThermalVias` footprint), and says so; the 3D view and `models` do the same.
`--model` also takes a vendor download, a ZIP or folder holding a `.kicad_mod` and its STEP or
VRML model (SamacSys, SnapMagic and Ultra Librarian ship these): it matches the vendor
footprint's pads to ours by number, refuses when they sit more than 0.1 mm apart, and writes the
`model_offset` and `model_rotate` that put the vendor model on our footprint. With no model from
KiCad or `--model`, `add` looks the part number up in the JLCPCB/LCSC parts list and takes the
EasyEDA model, placed the same way by the EasyEDA footprint's pads after checking the model
against that footprint's outline; the part's `files` record it as `EasyEDA C258169
(easyeda.com)`. `add` and `refresh` store the LCSC number as `lcsc`, and `use` passes it on as the
part's `lcsc` field, which `bom-jlcpcb.csv` reads. `--no-distributors` skips both lookups. It fetches the datasheet (`--datasheet` URL or PDF,
else the symbol's URL, else the distributors'), pins it in the datasheet cache so `datasheet
purge` never removes it, and records each listing's stock and price breaks. Its notes say when no distributor has the part
in stock as an active part. `--local` adds to the
project's library instead.

`use` copies the symbol into `symbols/`, the footprint into `footprints/` and the model into
`3dmodels/` of the project; a file that already exists and differs is refused without `--force`.
It returns the `agentee edit sch` command that adds the part with its `mpn`, `mfr` and `library`
fields. `datasheet text JST-PH-2` reads the pinned copy without a network call.

`refresh` asks every distributor with a key once for all the library's part numbers and replaces
each part's `[[stock]]`; a distributor that fails keeps its last listing. `list` prints the
cheapest listing in stock with the date it was checked, so stock and price are known without an
API call, as of that date.

`verify` checks each part: every symbol pin has a pad, the pinned datasheet names the part number
and the package (or a pin count), the symbol's pin names appear in it, the model's outline fits
the courtyard, the footprint's holes, slots and rings meet JLCPCB's minimums, and each file still
has the hash it was added with. It exits 1 when one fails.

`check` warns (rule `library`) when a design uses a part outside the library for a role the
library holds, naming the library part to use: the one with the same pin count, the preferred one
first. A part's role is its `role` field, or follows from its reference: `J`/`P` connector (`rf
connector` for coax, SMA and U.FL, `usb connector`, `modular connector`, `card socket`), `R`
resistor, `C` capacitor, `L` inductor, `FB` ferrite, `D` diode or `led`, `Q` transistor, `Y`
crystal, `F` fuse, `SW` switch, `BT` battery, `K` relay. A part is in the library when its `mpn`
or `library` field names a library part, or it sits on the footprint of a `generic` one. Set the
part's `library = "no"` field to keep one out. `library.toml` at the library root sets how hard
it pushes:

```toml
check = "warning"              # warning | info | off
# roles = ["connector"]        # only these roles
```
