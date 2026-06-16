import { file, write } from "bun";
import { join } from "node:path";

export interface PluginEntry {
  name: string;
  source?: string;
  description?: string;
  version?: string;
  [key: string]: unknown;
}

export interface Manifest {
  name: string;
  owner?: { name?: string; [key: string]: unknown };
  plugins: PluginEntry[];
  [key: string]: unknown;
}

const MANIFEST_PATH = ".claude-plugin/marketplace.json";

export function manifestPath(root: string): string {
  return join(root, MANIFEST_PATH);
}

export async function readManifest(root: string): Promise<Manifest> {
  const text = await file(manifestPath(root)).text();
  return JSON.parse(text) as Manifest;
}

export async function writeManifest(root: string, manifest: Manifest): Promise<void> {
  const text = JSON.stringify(manifest, null, 2) + "\n";
  await write(manifestPath(root), text);
}
