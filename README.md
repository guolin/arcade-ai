# arcade-ai

AI-driven scaffold and live studio for Microsoft MakeCode Arcade games. It ships as:

- a reusable skill (`SKILL.md` + `reference/`) that tells an AI agent how to build Arcade games safely;
- an npm CLI (`aca`) that creates projects, clones shared projects, runs a local live studio, and checks the MakeCode editor protocol.

## What It Does

- Scaffolds a pure TypeScript MakeCode Arcade project from a template (blank / platformer / flappy bird).
- **Clones any shared MakeCode project** by URL — including Blocks and Python projects, which are automatically converted to TypeScript.
- Adds the right AI rule file for your tool: `CLAUDE.md`, `.trae/project_rules.md`, or `AGENTS.md`.
- Starts a local studio that embeds the official MakeCode Arcade editor with real-time two-way sync.
- Keeps `game/main.ts` and Arcade resource files synchronized with the editor in both directions.
- Provides an offline reference for Arcade APIs, limits, project format, and known pitfalls.

## Install The CLI

Use it directly with `npx`:

```bash
npx arcade-ai init my-game --tool agents
cd my-game
npx aca dev
```

Or install it in a project:

```bash
npm install -D arcade-ai
npx aca init my-game --tool claude
```

## Commands

### `aca init`

Create a new project from a template:

```bash
aca init [dir] [--template blank|platformer|flappy] [--tool claude|trae|agents]
```

| Template | Description |
|----------|-------------|
| `blank` (default) | Minimal starting point — one sprite, one tilemap reference |
| `platformer` | Side-scrolling platformer with tilemap, enemies, gravity, and jump |
| `flappy` | Flappy Bird style game with pipe obstacles |

```bash
npx aca init my-game                          # blank template
npx aca init my-game --template platformer    # platformer template
npx aca init my-game --template flappy        # flappy bird template
```

### `aca clone`

Clone a shared MakeCode Arcade project by URL:

```bash
aca clone <share-url> [dir] [--tool claude|trae|agents]
```

Supports both URL formats:

```bash
npx aca clone https://makecode.com/_hfq2dmf99djR
npx aca clone https://arcade.makecode.com/96398-07059-89709-85769 my-clone
```

Blocks and Python projects are automatically converted to pure TypeScript:
- `main.blocks` and `main.py` are removed
- `preferredEditor` is set to `tsprj`
- The TypeScript source (`main.ts`) is always present in MakeCode's share API

> After cloning a Blocks project, the auto-generated `main.ts` may be hard to read. Ask your AI agent to clean up the structure before making changes.

### `aca dev`

Start the local studio:

```bash
aca dev [--port 8080]
```

Opens a browser with the official MakeCode Arcade editor embedded. Changes to `game/main.ts` trigger an automatic reload. Edits made in the editor UI (sprites, tilemaps, code) are written back to disk automatically.

### `aca check`

Verify the MakeCode editor handshake:

```bash
aca check [--url <makecode-url>]
```

Runs a Puppeteer probe to confirm the `workspacesync` handshake and a full save round-trip still work. Requires network access and Puppeteer.

## Install The Skill

The skill is the repo root: `SKILL.md` plus the `reference/` directory.

### Claude Code

Install via the plugin marketplace:

```text
/plugin marketplace
```

Search for `arcade-ai` and install. Or install manually:

```bash
mkdir -p ~/.claude/skills
git clone https://github.com/guolin/arcade-ai ~/.claude/skills/arcade-ai
```

Create Claude-specific project rules:

```bash
npx arcade-ai init my-game --tool claude
```

### WorkBuddy

Start from the dedicated guide:

```text
https://github.com/guolin/arcade-ai/blob/main/WORKBUDDY.md
```

Create project rules for WorkBuddy:

```bash
npx arcade-ai init my-game --tool agents
```

### Trae / Other Tools

```bash
npx arcade-ai init my-game --tool trae    # writes .trae/project_rules.md
npx arcade-ai init my-game --tool agents  # writes AGENTS.md (generic fallback)
```

## Typical Workflows

**Start a new game:**

```bash
npx arcade-ai init space-runner --template platformer --tool claude
cd space-runner
npx aca dev
# Ask AI to edit game/main.ts
```

**Continue someone else's shared game:**

```bash
npx aca clone https://makecode.com/_hfq2dmf99djR --tool claude
cd jumpy-platformer
npx aca dev
# Ask AI to modify or extend the game
```

## Rules For AI Agents

- Only write game code in `game/main.ts`.
- Store resources in `game/assets.json`; do not inline large art assets into JavaScript.
- Keep the project TypeScript-only: do not add `main.blocks`.
- Use named tilemaps (`tilemap\`level\``) or built-in tiles for maps.
- Read `reference/arcade-api.md`, `reference/limits.md`, and `reference/pitfalls.md` before writing unfamiliar APIs.
- Do not invent MakeCode Arcade APIs.
- `info.setScore()` / `info.setLife()` / `info.startCountdown()` automatically render in the HUD — no custom UI needed.
- Use `settings.writeNumber()` / `settings.readNumber()` for persistent data like high scores.

## License

MIT
