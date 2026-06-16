#!/usr/bin/env bun
// Add a plugin as a git subtree under plugins/<name>.
//
// Usage:
//   tools/plugin-add.ts <name> <repo-url> [<ref>]
import { $ } from "bun";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { die, hasRemote, prefixFor, remoteFor, repoRoot, usage } from "./lib/git";

const [name, url, ref = "main"] = process.argv.slice(2);
if (!name || !url) usage("plugin-add.ts <name> <repo-url> [<ref>]");

const root = await repoRoot();
process.chdir(root);

const prefix = prefixFor(name);
if (existsSync(join(root, prefix))) die(`${prefix} already exists`);

await $`git subtree add --prefix=${prefix} ${url} ${ref} --squash`;

const remote = remoteFor(name);
if (!(await hasRemote(remote))) {
  await $`git remote add ${remote} ${url}`;
}

console.log();
console.log(`Added subtree at ${prefix} from ${url}@${ref}.`);
console.log("Remember to register it in .claude-plugin/marketplace.json.");
