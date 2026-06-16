import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from "node:fs";
import { resolve, join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const MARKETPLACE_PATH = join(ROOT, ".claude-plugin", "marketplace.json");
const PLUGINS_DIR = join(ROOT, "plugins");

const DEFAULT_SOURCE_URL = "https://github.com/znagadeon/marketplace";

type BumpType = "major" | "minor" | "patch";

interface Marketplace {
  metadata: { version: string; description?: string };
  plugins: PluginEntry[];
  [key: string]: unknown;
}

interface PluginEntry {
  name: string;
  source: { source: string; url: string; path: string; ref: string };
  description: string;
}

function readMarketplace(): Marketplace {
  return JSON.parse(readFileSync(MARKETPLACE_PATH, "utf-8"));
}

function writeMarketplace(data: Marketplace) {
  writeFileSync(MARKETPLACE_PATH, JSON.stringify(data, null, 2) + "\n");
}

function readPluginJson(name: string) {
  const path = join(PLUGINS_DIR, name, ".claude-plugin", "plugin.json");
  return JSON.parse(readFileSync(path, "utf-8")) as { name: string; version: string; description: string };
}

function writePluginJson(name: string, data: unknown) {
  const path = join(PLUGINS_DIR, name, ".claude-plugin", "plugin.json");
  writeFileSync(path, JSON.stringify(data, null, 2) + "\n");
}

function sourceUrl(marketplace: Marketplace): string {
  return marketplace.plugins[0]?.source?.url ?? DEFAULT_SOURCE_URL;
}

function bumpVersion(current: string, type: BumpType): string {
  const [major, minor, patch] = current.split(".").map(Number);
  switch (type) {
    case "major": return `${major + 1}.0.0`;
    case "minor": return `${major}.${minor + 1}.0`;
    case "patch": return `${major}.${minor}.${patch + 1}`;
  }
}

function bumpMarketplaceVersion(type: BumpType) {
  const marketplace = readMarketplace();
  const oldVersion = marketplace.metadata.version;
  const newVersion = bumpVersion(oldVersion, type);
  marketplace.metadata.version = newVersion;
  writeMarketplace(marketplace);
  console.log(`   marketplace ${oldVersion} → ${newVersion}`);
}

function add(name: string, description: string) {
  const pluginDir = join(PLUGINS_DIR, name);
  if (existsSync(pluginDir)) {
    console.error(`plugins/${name} 디렉토리가 이미 존재합니다.`);
    process.exit(1);
  }

  const version = "0.1.0";

  mkdirSync(join(pluginDir, ".claude-plugin"), { recursive: true });
  mkdirSync(join(pluginDir, "skills"), { recursive: true });
  writePluginJson(name, { name, version, description });

  const marketplace = readMarketplace();
  marketplace.plugins.push({
    name,
    source: {
      source: "git-subdir",
      url: sourceUrl(marketplace),
      path: `plugins/${name}`,
      ref: `${name}@${version}`,
    },
    description,
  });
  writeMarketplace(marketplace);

  console.log(`✅ ${name} 플러그인 추가`);
  console.log(`   plugins/${name}/.claude-plugin/plugin.json`);
  console.log(`   plugins/${name}/skills/`);
  bumpMarketplaceVersion("minor");
}

function remove(name: string) {
  const pluginDir = join(PLUGINS_DIR, name);
  if (!existsSync(pluginDir)) {
    console.error(`plugins/${name} 디렉토리가 존재하지 않습니다.`);
    process.exit(1);
  }

  const marketplace = readMarketplace();
  const before = marketplace.plugins.length;
  marketplace.plugins = marketplace.plugins.filter((p) => p.name !== name);
  if (marketplace.plugins.length === before) {
    console.warn(`marketplace.json에 ${name} 엔트리가 없습니다.`);
  }
  writeMarketplace(marketplace);

  rmSync(pluginDir, { recursive: true });

  console.log(`✅ ${name} 플러그인 삭제`);
  bumpMarketplaceVersion("minor");
}

function bump(name: string, type: BumpType) {
  const pluginDir = join(PLUGINS_DIR, name);
  if (!existsSync(pluginDir)) {
    console.error(`plugins/${name} 디렉토리가 존재하지 않습니다.`);
    process.exit(1);
  }

  const pluginJson = readPluginJson(name);
  const oldVersion = pluginJson.version;
  const newVersion = bumpVersion(oldVersion, type);
  pluginJson.version = newVersion;
  writePluginJson(name, pluginJson);

  const marketplace = readMarketplace();
  const entry = marketplace.plugins.find((p) => p.name === name);
  if (entry) {
    entry.source.ref = `${name}@${newVersion}`;
  } else {
    console.warn(`marketplace.json에 ${name} 엔트리가 없습니다.`);
  }
  writeMarketplace(marketplace);

  console.log(`✅ ${name} ${oldVersion} → ${newVersion}`);
  bumpMarketplaceVersion("patch");
}

function list() {
  const marketplace = readMarketplace();
  for (const p of marketplace.plugins) {
    const ref = p.source?.ref ?? "?";
    console.log(`  ${p.name.padEnd(20)} ${ref.padEnd(25)} ${p.description}`);
  }
}

const [command, ...args] = process.argv.slice(2);

switch (command) {
  case "add": {
    const [name, description] = args;
    if (!name || !description) {
      console.error("사용법: pnpm plugin add <name> <description>");
      process.exit(1);
    }
    add(name, description);
    break;
  }
  case "remove": {
    const [name] = args;
    if (!name) {
      console.error("사용법: pnpm plugin remove <name>");
      process.exit(1);
    }
    remove(name);
    break;
  }
  case "major":
  case "minor":
  case "patch": {
    const [name] = args;
    if (!name) {
      console.error(`사용법: pnpm plugin ${command} <name>`);
      process.exit(1);
    }
    bump(name, command);
    break;
  }
  case "list":
    list();
    break;
  default:
    console.log("사용법: pnpm plugin <command>");
    console.log("");
    console.log("  add <name> <description>   플러그인 추가");
    console.log("  remove <name>              플러그인 삭제");
    console.log("  major <name>               메이저 버전업");
    console.log("  minor <name>               마이너 버전업");
    console.log("  patch <name>               패치 버전업");
    console.log("  list                       플러그인 목록");
}
