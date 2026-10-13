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
