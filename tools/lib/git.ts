import { $ } from "bun";

export async function repoRoot(): Promise<string> {
  return (await $`git rev-parse --show-toplevel`.text()).trim();
}

export async function hasRemote(name: string): Promise<boolean> {
  const result = await $`git remote get-url ${name}`.nothrow().quiet();
  return result.exitCode === 0;
}

export async function isClean(): Promise<boolean> {
  const a = await $`git diff --quiet`.nothrow().quiet();
  const b = await $`git diff --cached --quiet`.nothrow().quiet();
  return a.exitCode === 0 && b.exitCode === 0;
}

export function prefixFor(name: string): string {
  return `plugins/${name}`;
}

export function remoteFor(name: string): string {
  return `plugin-${name}`;
}

export function die(message: string): never {
  console.error(`error: ${message}`);
  process.exit(1);
}

export function usage(line: string): never {
  console.error(`usage: ${line}`);
  process.exit(1);
}
