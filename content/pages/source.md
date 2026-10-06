## What you need

- Rust 1.92 or newer. The workspace uses the 2024 edition, so an older toolchain stops at the manifest. `rustup update` brings yours up to date.
- A C compiler, for the TLS crate the distributor and model downloads use: Xcode's command line tools on macOS, the MSVC build tools on Windows, `gcc` or `clang` on Linux.

There are no system libraries to link against. The viewer loads X11 or Wayland at run time, and the GPU solvers reach Vulkan, Metal or DirectX 12 through wgpu.

## Install with cargo

```sh
cargo install --git https://github.com/v0l/agentee agentee
```

That builds the `agentee` binary in release mode and puts it in `~/.cargo/bin`. Run the same command again to update.

## From a clone

Work from a clone when you want the examples, or to change agentee itself:

```sh
git clone https://github.com/v0l/agentee
cd agentee
cargo install --path crates/agentee
```

`cargo build --release -p agentee` builds without installing, into `target/release/agentee`.

Every fab package carries `agentee vX.Y.Z-HASH` in its silk. The hash is the commit the binary was built from, with `-dirty` when the tree had uncommitted changes, so a board always says which source built it.

## The workspace

| crate | what it holds |
|---|---|
| `agentee` | the CLI and the MCP server |
| `agentee-core` | units, the file model, resolve and check, the calculators |
| `agentee-kicad` | the s-expression reader and the `.kicad_sym`, `.kicad_mod` and `.kicad_pcb` importers |
| `agentee-layout` | placement and routing: phases over one board model and one score |
| `agentee-sim` | the GPU field solvers: the 2D cross-section and the 3D FDTD on wgpu |
| `agentee-fab` | Gerbers, drill files, BOM, placement and fab notes |
| `agentee-parts` | distributor stock, prices and cheaper alternatives from Mouser and Farnell |
| `agentee-view` | the egui viewer and the headless PNG renderer |
| `agentee-3d` | STEP and VRML part models, lookup and download |

## Tests and benchmarks

```sh
cargo test --workspace
```

The zone fill has a benchmark per stage (`clip`, `overlay`, `min_width`, `probe`, `keep_connected`, `rasterize`, `fill_zone`) over every zone of the examples, plus `check_zones` and a whole project load. Filter to the stage you are working on:

```sh
cargo bench -p agentee-core --bench fill -- --quick 'fill/hackrf-pro/overlay'
cargo bench -p agentee-core --bench fill -- 'load/'
```

## Fab data

The stackup presets come from the fabs' published data, which changes over time. `crates/agentee-core/stackups/fetch.py` fetches it again from JLCPCB and PCBWay.
