#!/usr/bin/env bun
// List installed plugin subtrees and their configured remotes.
import { $ } from "bun";
import { existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { remoteFor, repoRoot } from "./lib/git";

const root = await repoRoot();
process.chdir(root);

const pluginsDir = join(root, "plugins");
if (!existsSync(pluginsDir)) {
  console.log("(no plugins/ directory yet)");
  process.exit(0);
}

const names = readdirSync(pluginsDir).filter((entry) =>
  statSync(join(pluginsDir, entry)).isDirectory(),
);

for (const name of names) {
  const remote = remoteFor(name);
  const result = await $`git remote get-url ${remote}`.nothrow().quiet();
  const url = result.exitCode === 0 ? result.stdout.toString().trim() : "(no remote configured)";
  console.log(`${name.padEnd(30)} ${url}`);
}
