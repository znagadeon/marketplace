#!/usr/bin/env bun
// Bump a plugin to a new upstream ref (tag/branch/commit) and sync its
// version in .claude-plugin/marketplace.json.
//
// Usage:
//   tools/plugin-bump.ts <name> <ref>
//
// Example:
//   tools/plugin-bump.ts hello-world v1.2.0
import { $, file } from "bun";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { die, hasRemote, isClean, prefixFor, remoteFor, repoRoot, usage } from "./lib/git";
import { readManifest, writeManifest } from "./lib/manifest";

const [name, ref] = process.argv.slice(2);
if (!name || !ref) usage("plugin-bump.ts <name> <ref>");

const root = await repoRoot();
process.chdir(root);

const prefix = prefixFor(name);
const remote = remoteFor(name);

if (!existsSync(join(root, prefix))) die(`${prefix} does not exist; use plugin-add first`);
if (!(await hasRemote(remote))) die(`remote '${remote}' is not configured`);
if (!(await isClean())) die("working tree is dirty; commit or stash first");

await $`git fetch ${remote} ${ref}`;
await $`git subtree pull --prefix=${prefix} ${remote} ${ref} --squash -m ${`chore(${name}): bump to ${ref}`}`;

const version = await resolveVersion(name, ref);

try {
  const manifest = await readManifest(root);
  const entry = manifest.plugins.find((p) => p.name === name);
  if (entry) {
    if (entry.version !== version) {
      entry.version = version;
      await writeManifest(root, manifest);
      await $`git add .claude-plugin/marketplace.json`;
      await $`git commit -m ${`chore(${name}): set version to ${version}`}`;
    }
  } else {
    console.error(`note: ${name} not listed in marketplace.json; skipping version sync`);
  }
} catch (err) {
  console.error(`warning: could not update marketplace.json: ${(err as Error).message}`);
}

console.log(`Bumped ${name} to ${ref} (version=${version}).`);

async function resolveVersion(pluginName: string, ref: string): Promise<string> {
  if (/^v?\d/.test(ref)) {
    return ref.replace(/^v/, "");
  }
  const pluginManifestPath = join(root, prefixFor(pluginName), ".claude-plugin", "plugin.json");
  if (existsSync(pluginManifestPath)) {
    try {
      const text = await file(pluginManifestPath).text();
      const parsed = JSON.parse(text) as { version?: string };
      if (parsed.version) return parsed.version;
    } catch {
      // fall through
    }
  }
  return ref;
}
