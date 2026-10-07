`agentee parts NAME` (MCP `parts`) prices the BOM of a layout or schematic at Mouser and Farnell
and lists cheaper parts that drop in. The keys live outside every project, in
`~/.config/agentee/distributors.toml` (`$AGENTEE_DISTRIBUTORS` or `--config` point elsewhere):

```toml
[mouser]
api_key = "..."                # Mouser Search API key, not the Cart/Order key

[farnell]
api_key = "..."                # element14 Product Search API key
store = "uk.farnell.com"       # ie.farnell.com, de.farnell.com, www.newark.com, au.element14.com ...
# currency = "GBP"             # default follows the store
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
| anything else | nothing | only the same part at the other distributor, and the distributor's suggested replacement |

Case codes are read from the imperial attribute (`Case Code - in`) or the part of a Farnell value
before its `[... Metric]`, so a 0201 listed as `0201 [0603 Metric]` is not taken for an 0603.
The report ends with the total per currency as chosen and with every cheaper pick, and the
number of API calls made: Mouser allows 30 a minute and 1000 a day, and the part lookups go ten
part numbers to a call. A refused key is reported once and that distributor is not asked again in
the run.

## Order sheets

```sh
agentee parts buggy-guard --boards 2 --spares --order docs/
```

`--order DIR` (MCP `order`) writes sheets to buy from instead of the report: `NAME-order.csv`
with every line and the distributor it is bought from, and one `NAME-<distributor>.csv` per
distributor with a key, Mouser's in the column layout of its BOM import template. Each line goes to
the distributor that is cheaper for the quantity bought, among those with enough stock and not
obsolete. A distributor's sheet lists every line in three blocks: the lines to order there, then
the lines bought at the other distributor, then the lines it does not list or has too few of, so
the top block of each sheet is the order. A line no distributor stocks says so in
`NAME-order.csv`, or names its `lcsc` part.

`--spares` (MCP `spares`) adds the hand assembly allowance: 0402 and 0603 resistors and
capacitors are bought at the next multiple of ten above the need plus five, and each `D`, `Q`,
`U` and `F` line gets one spare. These part fields change it:

| field | meaning |
|---|---|
| `spares = "0"` | spares for this part instead of the default, e.g. none for an expensive module |
| `buy_with = "XHP-2, SXH-001T-P0.6 x2"` | parts bought with each one of this part but not placed on the board: mating housings, crimps, an antenna. ` xN` is the count per part; the line names the parts it is for and gets one spare with `--spares` |
| `lcsc = "C165948"` | the LCSC part, named when neither distributor stocks the line |
