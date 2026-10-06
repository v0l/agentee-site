A design that is plain text belongs in git, and a design in git can be checked on every push like code. `agentee check` exits 0 when the project is clean, 1 when there are errors and 2 when a file does not load, so it drops straight into CI.

## The check job

```yaml
name: check
on: [push, pull_request]

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: curl -fsSL https://agentee.sh/install.sh | sh
      - run: echo "$HOME/.local/bin" >> "$GITHUB_PATH"
      - run: sudo apt-get install -y kicad-symbols kicad-footprints
      - run: agentee check hardware/
```

The KiCad libraries are only needed if the job imports parts; a project that already holds its symbols and footprints checks without them. Point `check` at the project directory, or run it from inside.

Pin the version for reproducible results by installing from a release tag rather than the latest:

```yaml
      - run: curl -fsSL https://agentee.sh/install.sh | AGENTEE_VERSION=v0.1.0 sh
```

## Machine-readable output

```sh
agentee check --json
```

```json
{
  "diagnostics": [
    {
      "at": "via [12.550, 11.000]",
      "file": "./lna.pcb.toml",
      "item": "lna",
      "message": "GND via sits in U1.2 0.175 mm from its edge, its 0.300 mm annulus reaches past the pad under the mask; centre it or use a smaller via",
      "rule": "via-annulus-past-pad",
      "severity": "warning"
    }
  ],
  "errors": 0,
  "ok": true,
  "warnings": 3
}
```

Every diagnostic carries its file, item, place and severity, and layout diagnostics carry their rule id. That is enough to annotate a pull request, or to fail on warnings in a project that wants them treated as errors. A rule can also be raised to an error in the board itself with `[drc] severity`, which keeps the policy in the design rather than the CI script.

## Simulations in CI

Check never runs a sim. Each result records a hash of the spec, the copper it saw and the stackup, and check warns when they no longer match. On a CI runner without a GPU that is the useful part: a pull request that moves an RF track gets a stale warning on the FDTD result, and an interface that measures that result fails outright.

DC drop, thermal and logic sims are cheap enough to run in CI where the runner has a GPU, and logic sims need none at all:

```yaml
      - run: agentee sim counter
        working-directory: hardware
```

Keep FDTD runs on a workstation and commit their results, so CI checks the design against the sims that were actually run.

## Renders on every pull request

```yaml
      - run: |
          agentee render pcb:main -o main.png --canvas-only
          agentee render sch:main -o main-sch.png --canvas-only
        working-directory: hardware
      - uses: actions/upload-artifact@v4
        with:
          name: renders
          path: hardware/*.png
```

Rendering runs headless, with no display or GPU, so the reviewer of a hardware change sees the board as well as the diff.

## Fab packages on release

```yaml
on:
  push:
    tags: ["hw-v*"]

jobs:
  fab:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: curl -fsSL https://agentee.sh/install.sh | sh
      - run: echo "$HOME/.local/bin" >> "$GITHUB_PATH"
      - run: agentee fab pcb:main -o fab/
        working-directory: hardware
      - env:
          GH_TOKEN: ${{ github.token }}
        run: gh release create "$GITHUB_REF_NAME" hardware/fab/*.zip hardware/fab/*.csv hardware/fab/fab-notes.txt
```

`fab` refuses while the layout has errors, so a tag on a broken design fails instead of shipping Gerbers. The watermark in the silk carries the commit the package was built from; a build from a tree with uncommitted changes says `-dirty`.
