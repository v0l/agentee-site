`agentee parts NAME` (MCP `parts`) prices the BOM of a layout or schematic at Mouser, Farnell
and DigiKey and lists cheaper parts that drop in. The keys live outside every project, in
`~/.config/agentee/distributors.toml` (`$AGENTEE_DISTRIBUTORS` or `--config` point elsewhere):

```toml
[mouser]
api_key = "..."                # Mouser Search API key, not the Cart/Order key

[farnell]
api_key = "..."                # element14 Product Search API key
store = "uk.farnell.com"       # ie.farnell.com, de.farnell.com, www.newark.com, au.element14.com ...
# currency = "GBP"             # default follows the store

[digikey]
client_id = "..."              # a DigiKey API app with Product Information v4,
client_secret = "..."          # swapped for a bearer token per run
site = "IE"                    # the DigiKey site to price at, default US
# currency = "EUR"             # default follows the site
# language = "en"
# sandbox = true               # sandbox-api.digikey.com, for a sandbox app
```

```sh
agentee parts buggy-guard --boards 5
agentee parts buggy-guard --distributor farnell --farnell-store ie.farnell.com
agentee parts buggy-guard --refs C11,R8 --json
agentee parts buggy-guard --no-alternatives
```

Each BOM line is one `mpn` field, the same grouping as `bom.csv`, needing its reference count
times `--boards`. The line's offers are the distributor listings of that part number; the chosen
one is the cheapest that is in stock for the quantity and not obsolete. A cost honours the
listing's minimum and multiple and buys up to a later price break when the larger quantity costs
less in total, so ten resistors may be bought as a hundred.

Alternatives, at most three per line, cheapest saving first, in the chosen offer's currency:

| part | searched by | must keep |
|---|---|---|
| resistor, `R` on an `R_0603...` style footprint | value, tolerance and size | resistance within 0.5 %, tolerance no looser, the same imperial case code; thermistors, arrays and jumpers are refused |
| ceramic capacitor, `C` on a `C_0603...` footprint | value, voltage, dielectric and size | capacitance within 1 %, voltage no lower (from the value's `/50V` or the listed part), dielectric no worse (C0G stays C0G, X7R may become X7S or X8R, X5R may become X7R), tolerance no looser, the same case code; electrolytic, tantalum, polymer and film are refused |
| generic discrete, `D` or `Q` whose value is a JEDEC name (2N7002, BSS138, 1N4148, BAT54, BZT52, S1x, SS1x, SMAJ, BC847 ...) | name and package | the name inside the part number and the same package (SOT-23 is not SOT-23-5, SMA is DO-214AC, not SMB) |
| indicator LED, `D` on an `LED_0603...` footprint | colour and size | the colour and the case code |
| anything else | nothing | only the same part at another distributor, and the distributor's suggested replacement |

`agentee bom NAME` (MCP `bom`) prints the cost as a table: one row per BOM line with its
quantity per board, part number, the distributor and SKU it comes from, and its line total at
each board count (`--boards`, default 1, 10 and 100), then the total, the cost per board and the
number of lines it could not price. Each count picks the cheapest offer in stock for that
quantity, so a line can come from another distributor at 100 boards than at one; those cells
carry a `*`. It looks every part up once at the largest count and prices the smaller ones from
the same price breaks, so the table costs the same API calls as one `parts` run. It does not
search for alternatives; `parts` does that.

Case codes are read from the imperial attribute (`Case Code - in`) or the part of a Farnell value
before its `[... Metric]`, so a 0201 listed as `0201 [0603 Metric]` is not taken for an 0603.
The report ends with the total per currency as chosen and with every cheaper pick, and the
number of API calls made: Mouser allows 30 a minute and 1000 a day, and the part lookups go ten
part numbers to a call. DigiKey allows 120 a minute and 1000 a day and is asked one part number
per call; each of its packagings (cut tape, tape and reel) is a separate offer, Digi-Reel and
marketplace listings are left out. A refused key is reported once and that distributor is not asked again in
the run.

## Order sheets

```sh
agentee parts buggy-guard --boards 2 --spares --order docs/
```

`--order DIR` (MCP `order`) writes sheets to buy from instead of the report: `NAME-order.csv`
with every line and the distributor it is bought from, and one `NAME-<distributor>.csv` per
distributor with a key, Mouser's in the column layout of its BOM import template and DigiKey's
with the quantity, DigiKey part number and a customer reference of up to 48 characters first,
the way its BOM Manager and cart upload read them. Each line goes to
the distributor that is cheaper for the quantity bought, among those with enough stock and not
obsolete. A distributor's sheet lists every line in three blocks: the lines to order there, then
the lines bought at another distributor, then the lines it does not list or has too few of, so
the top block of each sheet is the order. A line no distributor stocks says so in
`NAME-order.csv`, or names its `lcsc` part.

`--spares` (MCP `spares`) adds the hand assembly allowance: 0402 and 0603 resistors and
capacitors are bought at the next multiple of ten above the need plus five, and each `D`, `Q`,
`U` and `F` line gets one spare. These part fields change it:

| field | meaning |
|---|---|
| `spares = "0"` | spares for this part instead of the default, e.g. none for an expensive module |
| `buy_with = "XHP-2, SXH-001T-P0.6 x2"` | parts bought with each one of this part but not placed on the board: mating housings, crimps, an antenna. ` xN` is the count per part; the line names the parts it is for and gets one spare with `--spares` |
| `lcsc = "C165948"` | the LCSC part, named when no distributor stocks the line |

## Datasheets

`agentee datasheet` (MCP `datasheet_fetch`, `datasheet_text`, `datasheet_add`) fetches part
datasheets once into a cache every project and agent shares, `~/.cache/agentee/datasheets/`
(`$AGENTEE_DATASHEETS` or `$XDG_CACHE_HOME` move it), and reads them back as text.

```sh
agentee datasheet fetch lna                    # every part of a layout or schematic
agentee datasheet fetch U3                     # one part, by reference, symbol or part number
agentee datasheet fetch TMC2209-LA
agentee datasheet fetch U3 --url https://example.com/u3.pdf
agentee datasheet text TMC2209-LA --find VS    # passages holding VS, with page and line
agentee datasheet text U3 --pages 4-6
agentee datasheet add XYZ123 ~/Downloads/xyz123.pdf --manufacturer Acme
agentee datasheet list
agentee datasheet purge                        # drop every copy no library part pins
```

A part's datasheet is looked for in order: its `datasheet` field in the schematic, its symbol's
`datasheet` URL, then the datasheet each distributor with a key lists for its `mpn` (a
`Maker MPN` field is split, and a part number that is the start of a listed one, such as
`TMC2209-LA` for `TMC2209-LA-T`, takes its datasheet). Downloads use a browser user agent, retry
on HTTP 429 and 5xx, follow an HTML page to the PDF it links, and give up on a host that timed
out once for the rest of the run. Only a PDF is kept.

Copies live at `MAKER/MPN/HASH.pdf` with a `meta.json` holding each copy's URL, source, SHA-256,
fetch date and the revision line read from its first or last pages, so a part is fetched once
and a newer revision sits beside the old one. `text` reads a copy with `pdftotext -layout` and
keeps the text beside the PDF; it never touches the network when the part is cached, and fetches
it first when it is not (`--offline` refuses instead). `--find` matches whole words, case
sensitive when the word has capitals, with `--context` lines around each hit.

A fetch of a design, or of a part in it, records what it used in `datasheets.toml` at the project
root:

```toml
[[parts]]
key = "TPS7A9101DSKR"
manufacturer = "TI"
refs = ["U9", "U24"]
url = "https://www.ti.com/lit/ds/symlink/tps7a91.pdf"
source = "symbol TPS7A91"
sha256 = "1ab38416..."
revision = "SBVS282A – DECEMBER 2016 – REVISED SEPTEMBER 2026"
fetched = "2026-10-09"

[[parts]]
key = "SPF5189Z"
refs = ["U1"]
missing = "https://www.qorvo.com/products/d/da001910: HTTP 429"
```

`check` warns (rule `datasheet`) for a part with an `mpn` that has no datasheet URL on its symbol
or part and no record here, and for a part whose last fetch found no datasheet. The fix is the
user's PDF through `datasheet add`, or a URL that works.

## Parts library

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
KiCad install or a vendor download changes. It fetches the datasheet (`--datasheet` URL or PDF,
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
the courtyard, and each file still has the hash it was added with. It exits 1 when one fails.

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
