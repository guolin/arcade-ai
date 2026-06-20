# arcade-ai

AI-driven scaffold and live studio for Microsoft MakeCode Arcade games. It ships as:

- a reusable skill (`SKILL.md` + `reference/`) that tells an AI agent how to build Arcade games safely;
- an npm CLI (`aca`) that creates projects, runs a local live studio, and checks the MakeCode editor protocol.

## What It Does

- Generates a pure TypeScript MakeCode Arcade project.
- Adds the right AI rule file for your tool: `CLAUDE.md`, `.trae/project_rules.md`, or `AGENTS.md`.
- Starts a local studio that embeds the official MakeCode Arcade editor.
- Keeps `game/main.ts` and Arcade resource files synchronized with the editor.
- Provides an offline reference for Arcade APIs, limits, project format, and known pitfalls.

## Install The CLI

Use it directly with `npx`:

```bash
npx arcade-ai init my-game --tool agents
cd my-game
npx aca dev
```

If the npm package has not been published yet, run it from GitHub:

```bash
npx --yes github:guolin/arcade-ai init my-game --tool agents
cd my-game
npx --yes github:guolin/arcade-ai dev
```

Or install it in a project:

```bash
npm install -D arcade-ai
npx aca init my-game --tool claude
```

## Commands

```bash
aca init [dir] [--tool claude|trae|agents]
aca dev [--port 8080]
aca check [--url <makecode-url>]
```

- `aca init` creates the Arcade project, copies `reference/`, and writes the tool-specific rule file.
- `aca dev` runs the local studio with live preview and editor-to-disk synchronization.
- `aca check` verifies the MakeCode editor handshake and rendering path. This needs network access and Puppeteer.

## Install The Skill

The skill is the repo root: `SKILL.md` plus the `reference/` directory. Keep those together when installing.

### Workbudy

Workbudy should start from the dedicated guide, not only the repository homepage:

```text
https://github.com/guolin/arcade-ai/blob/main/WORKBUDDY.md
```

That page points Workbudy to the raw `SKILL.md` and every file under `reference/`. It also gives a prompt you can paste directly into Workbudy.

Until the npm package is published, create projects from GitHub:

```bash
npx --yes github:guolin/arcade-ai init my-game --tool agents
```

After npm publishing, this shorter command is equivalent:

```bash
npx arcade-ai init my-game --tool agents
```

Then make sure Workbudy reads:

- `my-game/AGENTS.md`
- `my-game/reference/`

In Workbudy prompts, ask it to follow `AGENTS.md` and use `reference/` before writing Arcade APIs it is unsure about. Run the studio with:

```bash
cd my-game
npx aca dev
```

### Codex

For Codex, install the skill into your Codex skills directory:

```bash
mkdir -p ~/.codex/skills
git clone <this-repo-url> ~/.codex/skills/arcade-ai
```

Restart Codex after installation so it can discover the new skill. To create a project with Codex-friendly rules:

```bash
npx arcade-ai init my-game --tool agents
```

Codex should then read `AGENTS.md` in the generated project and use the installed `arcade-ai` skill whenever you ask it to build or modify a MakeCode Arcade game.

### Claude Code

Use the Claude Code plugin marketplace when this repo is published as a plugin:

```text
/plugin marketplace
```

Search for `arcade-ai`, install it, then restart or open a new Claude Code session if prompted.

For a manual local install, copy or clone this repo as a skill:

```bash
mkdir -p ~/.claude/skills
git clone <this-repo-url> ~/.claude/skills/arcade-ai
```

Create Claude-specific project rules with:

```bash
npx arcade-ai init my-game --tool claude
```

Claude Code will use `CLAUDE.md` in the generated project plus the installed `arcade-ai` skill.

## Typical Workflow

```bash
npx arcade-ai init space-runner --tool claude
cd space-runner
npx aca dev
```

Then ask your AI agent to edit `game/main.ts`. Keep the studio open while the agent works; preview refreshes automatically.

## Rules For AI Agents

- Only write game code in `game/main.ts`.
- Store resources in `game/assets.json`; do not inline large art assets into JavaScript.
- Keep the project TypeScript-only: do not add `main.blocks`.
- Use named tilemaps or built-in tiles for maps.
- Read `reference/arcade-api.md`, `reference/limits.md`, and `reference/pitfalls.md` when unsure.
- Do not invent MakeCode Arcade APIs.

## License

MIT
