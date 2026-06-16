# marketplace — 작업 지침

이 저장소는 `git subtree`로 묶인 Claude Code 플러그인 마켓플레이스다. 새 플러그인을 추가하거나 기존 플러그인을 손볼 때 아래 규칙을 따른다.

## 1. 언어는 TypeScript 고정

플러그인/툴 모두 새 코드는 항상 TypeScript로 작성한다.
- `.js` 신규 파일 금지. 빌드 산출물(`dist/`)만 예외.
- `tsconfig.json`은 `"strict": true` 기본. 느슨하게 풀어야 할 이유가 있으면 사유를 주석으로 남긴다.
- 타입 정의가 없는 JS 라이브러리는 `@types/*` 또는 로컬 `.d.ts`로 보완.

## 2. MCP 서버는 bun으로 컴파일

플러그인이 MCP 서버를 포함하면 런타임을 가정하지 말고 단일 실행 파일로 배포한다.
- `bun build --compile --target=<platform> src/index.ts --outfile dist/<server>`로 단일 바이너리 생성.
- 멀티플랫폼이 필요하면 `--target=bun-darwin-arm64`, `bun-darwin-x64`, `bun-linux-x64` 등을 각각 만들어 `dist/` 하위에 둔다.
- 플러그인 manifest의 MCP 서버 등록은 컴파일된 바이너리 경로를 가리키도록 한다. `node`/`bun` 실행을 사용자 환경에 요구하지 않는다.
- 소스(`src/`)와 산출물(`dist/`)을 분리. `dist/`는 릴리스 태그에 포함시키되, 일반 개발 커밋에는 넣지 않는다.

## 3. pnpm 모노레포 세팅

루트는 pnpm workspace. 각 플러그인과 `tools/`는 자체 패키지로 둔다.
- 루트 `package.json` + `pnpm-workspace.yaml` (`tools`, `plugins/*`).
- 의존성 설치/스크립트 실행은 항상 `pnpm` (npm/yarn 금지).
- 공통 도구(typescript, bun 등)는 루트 devDependencies로 hoist, 플러그인별 런타임 의존만 각 플러그인 `package.json`에.
- 플러그인 내부 스크립트 실행은 `pnpm --filter <plugin-name> <script>` 또는 해당 디렉터리에서 `pnpm <script>`.
- 새 플러그인을 `pnpm plugin:add`로 붙인 직후 `pnpm install`을 한 번 돌려 workspace에 편입시킨다.

## 4. bun은 워크스페이스 devDependency

`bun`을 글로벌에 있다고 가정하지 않는다. 루트 `devDependencies`에 들어 있고, **항상 pnpm 경유로 실행**한다.
- ✅ `pnpm plugin:add ...`, `pnpm exec bun build ...`
- ❌ `bun tools/plugin-add.ts`, `bunx ...` (글로벌 bun 가정)
- TS 스크립트의 shebang(`#!/usr/bin/env bun`)도 글로벌을 전제하므로 직접 실행하지 말고 항상 pnpm script로 호출한다.
- MCP 서버 빌드/실행 등 새 bun 호출 자리를 만들 땐 루트 `scripts:` 또는 해당 플러그인 `scripts:`에 등록한다.

## subtree 워크플로

플러그인 추가/갱신은 `tools/plugin-*.ts`를 pnpm 스크립트로 실행한다. 직접 `git subtree`를 호출하지 말 것 — prefix/remote 규칙이 깨진다.
- `pnpm plugin:add <name> <repo-url> [<ref>]`
- `pnpm plugin:pull <name> [<ref>]`
- `pnpm plugin:push <name> [<ref>]`
- `pnpm plugin:bump <name> <ref>` — upstream ref로 올리고 `marketplace.json`의 `version` 동기화
- `pnpm plugin:list`

`.claude-plugin/marketplace.json`의 `plugins[]` 엔트리는 subtree를 붙인 다음 수동 등록한다 (`source: "./plugins/<name>"`).
