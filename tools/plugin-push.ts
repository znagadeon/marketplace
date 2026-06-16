#!/usr/bin/env bun
// Push local changes in a plugin subtree back to its upstream.
//
// Usage:
//   tools/plugin-push.ts <name> [<ref>]
import { $ } from "bun";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { die, hasRemote, prefixFor, remoteFor, repoRoot, usage } from "./lib/git";

const [name, ref = "main"] = process.argv.slice(2);
if (!name) usage("plugin-push.ts <name> [<ref>]");

const root = await repoRoot();
process.chdir(root);

const prefix = prefixFor(name);
const remote = remoteFor(name);

if (!existsSync(join(root, prefix))) die(`${prefix} does not exist`);
if (!(await hasRemote(remote))) die(`remote '${remote}' is not configured`);

await $`git subtree push --prefix=${prefix} ${remote} ${ref}`;
