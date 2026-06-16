# marketplace

Claude Code plugin marketplace. Each plugin lives in `plugins/<name>/` as a `git subtree` of its upstream repo, and is listed in `.claude-plugin/marketplace.json`.

## Layout

```
.claude-plugin/marketplace.json   # marketplace manifest (Claude Code reads this)
plugins/<name>/                   # subtree of the plugin's upstream repo
tools/                            # subtree helpers (TypeScript, run via bun)
```

## Setup

```sh
pnpm install
```

`bun` is installed as a workspace devDependency — don't rely on a global one.

## Add a plugin

```sh
pnpm plugin:add <name> <repo-url> [<ref>]
```

Then register it in `.claude-plugin/marketplace.json`:

```json
{
  "name": "<name>",
  "source": "./plugins/<name>",
  "description": "..."
}
```

## Pull upstream updates

```sh
pnpm plugin:pull <name> [<ref>]
```

## Push local edits back upstream

```sh
pnpm plugin:push <name> [<ref>]
```

## Bump a plugin to a new upstream ref

```sh
pnpm plugin:bump <name> <ref>   # e.g. v1.2.0
```

Pulls the ref into the subtree and syncs the plugin's `version` in `.claude-plugin/marketplace.json`.

## List installed plugins

```sh
pnpm plugin:list
```

## Use this marketplace in Claude Code

```
/plugin marketplace add <git-url-or-local-path>
```
