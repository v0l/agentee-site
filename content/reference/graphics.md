Shared by symbols and footprints. `kind` picks the shape and the fields it needs:

| kind | fields |
|---|---|
| `line` | `start`, `end` |
| `rect` | `start`, `end` (opposite corners) |
| `polyline` | `points` (open) |
| `polygon` | `points` (closed) |
| `circle` | `center`, `radius` |
| `arc` | `start`, `mid`, `end` (`mid` is any point on the arc between them) |
| `text` | `text`, `at`, `size`, `rotation`, `anchor` (`left` / `center` / `right`) |

Plus `width` (stroke), `fill` (`none` / `solid` / `background`), and `layer` (footprints) or
`unit` (symbols). On layout `[[graphics]]`, `locked = true` keeps `agentee place` from moving a
text.
