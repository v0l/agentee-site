agentee is built to be driven by a coding agent: Claude Code, Codex, Cursor, pi or anything else that can run shell commands and edit files. There are two pieces to set up. The skill tells the agent how to work. The MCP server is optional and gives clients that speak MCP the same operations as tools.

## Install the skill

A skill is a `SKILL.md` file the agent loads when a task matches its description. The agentee skill covers the edit, check, render loop, the order to build a design in, the traps in the file format, how to place for assembly and test, and how to iterate on simulations without spending hours of GPU time.

The quickest way is the skills installer, which finds the agents on your machine and puts the file where each one looks:

```sh
npx skills add https://agentee.sh
```

It reads the skill registry agentee.sh publishes at `/.well-known/agent-skills/index.json`, which lists the skill with a SHA-256 digest of its file. `npx skills add v0l/agentee` installs the same skill from the GitHub repository instead.

To install by hand, put the file in your agent's skills folder. For Claude Code:

```sh
mkdir -p ~/.claude/skills/agentee
curl -fsSL https://agentee.sh/.well-known/agent-skills/agentee/SKILL.md -o ~/.claude/skills/agentee/SKILL.md
```

Every release archive also carries the skill under `skills/agentee`, matching the binary beside it. If you build from a clone, link that directory into your skills folder so the skill updates with the code.

## Add the MCP server

Without MCP the agent uses the CLI through its shell, which works everywhere. With MCP it gets typed tools, and `render_item` returns the PNG straight into the conversation, so a model with vision looks at the board without a file round trip.

`agentee mcp` serves one project directory over stdio. Point it at the directory holding the TOML.

Claude Code, from the project directory:

```sh
claude mcp add agentee -- agentee mcp "$PWD"
```

Codex, in `~/.codex/config.toml`:

```toml
[mcp_servers.agentee]
command = "agentee"
args = ["mcp", "/path/to/project"]
```

Cursor, Claude Desktop and most other clients take the common JSON form, in `.cursor/mcp.json`, `claude_desktop_config.json` or the client's own settings:

```json
{
  "mcpServers": {
    "agentee": {
      "command": "agentee",
      "args": ["mcp", "/path/to/project"]
    }
  }
}
```

The server does not write TOML for the agent. It reads, checks, renders, routes, simulates and writes the fab package; the agent still edits files with its own tools or with `agentee edit` in a shell. The [MCP page](/mcp/) lists every tool.

## Give it the format reference

The skill is how to work. The full key by key reference is separate, so it costs context only when needed: `agentee docs` prints it, and the MCP tool `format_reference` returns it. The skill tells the agent to read the section for the file kind it is about to write. The same text is on this site under [Reference](/reference/), and as one file at [/llms-full.txt](/llms-full.txt).

## Write a brief it can work from

An agent designs a board the way a junior engineer would: well when the requirements are written down, badly when it has to guess them. A useful brief says:

- What the board does, and what connects to it: connectors, voltages, currents, signals and their speeds.
- The fab and the layer count, or the cost you want to stay under. `jlcpcb` with a two or four layer stackup suits most first boards.
- Size limits, mounting holes and where connectors must sit.
- Parts you already chose, by manufacturer part number. Parts the agent picks itself should go into `DESIGN.md` with the reason.
- What must be simulated: the RF path, a USB lane, a rail's drop, a hot regulator.

For example:

```text
Design a 4 layer JLCPCB board, at most 40 x 30 mm, that powers a Raspberry Pi
Pico from USB-C or a 2S LiPo through an ideal diode OR, with a 3.3 V 1 A buck
for an external sensor header. Put the USB-C and the battery JST-PH on the
same short edge. Use parts JLCPCB stocks. Write DESIGN.md as you go, run a DC
drop sim of the 3.3 V rail at 1 A and a thermal sim with the buck at 0.6 W.
```

Ask for a `DESIGN.md` next to the files. The skill tells the agent to keep one, with the circuit, why each part was chosen, the layout rules the circuit needs and what is still unverified. It is the document you review, and the one the next session reads first.

## Watch it work

Run `agentee view` in the project while the agent works. The window reloads whenever a file changes, so you see each placement and track land, and you can stop the agent when it heads somewhere you do not want. On a layout you can move parts and route tracks yourself; saving writes them into the same file the agent reads next. See [The viewer](/guides/viewer/).

## What to expect

The agent will lean on check heavily, and that is the point: every diagnostic names the file, the item and the place, and most name a value that passes. Things that still need you:

- Part choice. The agent picks plausible parts; you know which ones you can buy and trust. `agentee parts` helps with stock and price.
- Placement intent. Automatic placement is a start. Where a connector goes on a product, or which side a heatsink faces, is your call. Move those parts in the viewer and lock them.
- Simulation budgets. An FDTD run can take tens of minutes. The skill tells the agent to dry-run first and iterate coarse, but say so in the brief if GPU time matters.
- Anything the files cannot see: mechanical fit beyond the STEP export, regulatory testing, firmware.
