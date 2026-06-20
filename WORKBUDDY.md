# WorkBuddy Guide

Use this page as the entry URL for WorkBuddy:

```text
https://github.com/guolin/arcade-ai/blob/main/WORKBUDDY.md
```

This repository contains two things WorkBuddy needs:

- the `arcade-ai` skill instructions: `SKILL.md`
- the offline MakeCode Arcade reference: `reference/`

Ask WorkBuddy to read this page first, then read the raw skill and reference files listed below before writing game code.

## Raw Skill Files

```text
https://raw.githubusercontent.com/guolin/arcade-ai/main/SKILL.md
https://raw.githubusercontent.com/guolin/arcade-ai/main/reference/arcade-api.md
https://raw.githubusercontent.com/guolin/arcade-ai/main/reference/limits.md
https://raw.githubusercontent.com/guolin/arcade-ai/main/reference/pitfalls.md
https://raw.githubusercontent.com/guolin/arcade-ai/main/reference/project-format.md
```

## Recommended WorkBuddy Prompt

```text
Use this arcade-ai skill:
https://github.com/guolin/arcade-ai/blob/main/WORKBUDDY.md

Read SKILL.md and every file under reference/ before implementing.
Create a Microsoft MakeCode Arcade subway runner game.
Follow the generated AGENTS.md rules.
Only write game code in game/main.ts.
Do not invent MakeCode Arcade APIs.
```

## Create A Project

Until the npm package is published, run the CLI directly from GitHub:

```bash
npx --yes github:guolin/arcade-ai init subway-surfer --tool agents
cd subway-surfer
npx --yes github:guolin/arcade-ai dev
```

After the npm package is published, this shorter form also works:

```bash
npx arcade-ai init subway-surfer --tool agents
cd subway-surfer
npx aca dev
```

## What WorkBuddy Should Use

The generated project contains:

- `AGENTS.md` - project rules for AI agents
- `reference/` - local Arcade API, limits, pitfalls, and project format docs
- `game/main.ts` - the only file where game logic should be written
- `game/assets.json` - Arcade resources

WorkBuddy should use `AGENTS.md` and `reference/` inside the generated project even if it has already read the GitHub skill files.

## Hard Rules

- Write game code only in `game/main.ts`.
- Keep the project TypeScript-only; do not add `main.blocks`.
- Do not clear `game/assets.json`; empty resources must be `{}`.
- Use named tilemaps or built-in tiles for maps.
- Use inline `img\`\`` for sprites, but do not use inline images as `createTilemap` tiles.
- Check `reference/arcade-api.md` before using unfamiliar APIs.
