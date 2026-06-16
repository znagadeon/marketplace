#!/usr/bin/env bun
// Pull upstream changes into an existing plugin subtree.
//
// Usage:
//   tools/plugin-pull.ts <name> [<ref>]
import { $ } from "bun";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { die, hasRemote, prefixFor, remoteFor, repoRoot, usage } from "./lib/git";

const [name, ref = "main"] = process.argv.slice(2);
if (!name) usage("plugin-pull.ts <name> [<ref>]");

const root = await repoRoot();
process.chdir(root);

const prefix = prefixFor(name);
const remote = remoteFor(name);

if (!existsSync(join(root, prefix))) die(`${prefix} does not exist; use plugin-add first`);
if (!(await hasRemote(remote))) die(`remote '${remote}' is not configured`);

await $`git subtree pull --prefix=${prefix} ${remote} ${ref} --squash`;
