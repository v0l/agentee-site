# agentee.sh

Landing page, guides and reference for [agentee](https://github.com/v0l/agentee).

Preact on Vite, prerendered at build time: every page in every locale ships as static HTML with
its own title, description, canonical, hreflang alternates and JSON-LD, then hydrates.

```sh
bun install
bun run dev            # http://localhost:5173
bun run build          # -> dist
bun run preview        # serves dist
bun run check          # tsc --noEmit
bun run deploy         # build, then Cloudflare Pages project `agentee`
```

## Content

| where | what |
|---|---|
| `content/guides/*.md` | the guides, one file per guide; the list, titles and summaries are `src/content/guides.ts` |
| `content/pages/source.md` | the build from source page |
| `content/reference/*.md` | the file format reference, split from `docs/format.md` by `bun run sync` |
| `content/upstream/` | `SKILL.md` and `format.md` as copied from the agentee repo |
| `src/content/*.ts` | home page copy, examples, install platforms, the reference page list |
| `src/generated/` | CLI help, MCP tools, render sizes and counts, written by `bun run sync` |
| `public/assets/renders/` | renders of the examples, written by `bun run sync` |
| `public/install.sh`, `public/install.ps1` | the one line installers, reading GitHub release assets |
| `scripts/og.html` | the source of `public/assets/og.png`, screenshot at 1200 x 630 |

`bun run sync` reads `../agentee` (or `AGENTEE_REPO`) and its `target/release/agentee` (or
`AGENTEE_BIN`): it copies the skill and format reference, splits the reference by the headings in
`src/content/reference.ts`, records every command's help and the MCP tool list, and renders the
examples. Run it after an agentee change, then build. `--no-renders` skips the renders.

Markdown is parsed at build time by `plugins/docs.ts` into blocks of HTML, so no markdown parser
ships to the browser. Code is highlighted at the same time.

## For agents

`plugins/agent-files.ts` writes, at build:

- `/llms.txt` and `/llms-full.txt` ([llmstxt.org](https://llmstxt.org)),
- `index.html.md` beside every English page, linked from each page's head,
- `/.well-known/agent-skills/index.json` (Agent Skills Discovery v0.2.0, with the SHA-256 digest
  of the skill) and the older `/.well-known/skills/index.json`, both with `agentee/SKILL.md`,
- `/sitemap.xml` with hreflang alternates.

## Translations

Every page is prerendered once per locale: English at `/`, the rest under `/de/`, `/fr/`, `/es/`,
`/it/`, `/pt/`, `/nl/`, `/pl/`, `/ru/`, `/ja/` and `/zh/`. JSX copy is react-intl
`FormattedMessage` with a `defaultMessage` and no id; data, guides and reference are looked up by
the same id at render through `useString()`. The id is a hash of the English, so changing a
sentence gives it a new id and it falls back to English until translated again.

```sh
bun run intl:extract                       # -> src/locales/en.json
bun run intl:translate                     # every locale, or name some: bun run intl:translate de fr
```

`intl:translate` sends what a locale lacks to an OpenAI compatible endpoint (`INTL_URL`, default
`http://localhost:8001/v1`, `INTL_KEY`, `INTL_MODEL`, default the first model it serves) in
batches with a PCB glossary, and keeps a translation only when its tags, links, `<code>` contents
and placeholders match the English and it has no en or em dash. Rerun it until nothing is missing.
The prompt carries a PCB glossary per language (`GLOSSARY` in `scripts/translate.ts`), and
`scripts/overrides.ts` holds hand translations for the short labels the model keeps getting wrong
("Out the door", the loop verbs, "Skill"). Hand fixes in a locale file stay.

Deployed to Cloudflare Pages (project `agentee`, apex `agentee.sh`).
