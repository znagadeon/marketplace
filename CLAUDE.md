# marketplace — 작업 지침

`plugins/*` 각 디렉토리가 독립된 Claude Code 플러그인. 새 플러그인 추가/삭제·버전 갱신은 반드시 아래 스크립트로 한다.

## 플러그인 관리

```bash
pnpm plugin add <name> <description>   # 새 플러그인 스캐폴드 (0.1.0)
pnpm plugin remove <name>              # 플러그인 삭제
pnpm plugin major <name>               # 호환성 깨짐
pnpm plugin minor <name>               # 새 스킬·기능
pnpm plugin patch <name>               # 버그픽스·문서
pnpm plugin list                       # 목록
```

`plugins/<name>/.claude-plugin/plugin.json`의 `version`이나 루트 `.claude-plugin/marketplace.json`을 직접 편집하지 말 것. 스크립트(`scripts/plugin.ts`)가 plugin.json `version`과 marketplace.json의 `source.ref`·`metadata.version`까지 한 번에 동기화한다. 수동 편집은 두 파일이 어긋나게 만든다.

## 언어는 TypeScript 고정

플러그인/스크립트 모두 새 코드는 항상 TypeScript. `.js` 신규 파일 금지(빌드 산출물 `dist/`만 예외). `tsconfig.json`은 `"strict": true` 기본.

## MCP 서버는 bun으로 컴파일

플러그인이 MCP 서버를 포함하면 단일 실행 파일로 배포한다.
- `bun build --compile --target=<platform> src/index.ts --outfile dist/<server>`
- 멀티플랫폼은 `bun-darwin-arm64`, `bun-darwin-x64`, `bun-linux-x64` 등을 각각 `dist/` 하위에.
- 플러그인 manifest의 MCP 서버는 컴파일된 바이너리 경로를 가리킨다. `node`/`bun` 실행을 사용자에게 요구하지 않는다.
- 소스(`src/`)와 산출물(`dist/`)을 분리.

## pnpm 모노레포

루트는 pnpm workspace, `plugins/*`가 각 패키지. 의존성·스크립트 실행은 항상 `pnpm` (npm/yarn 금지). 공통 도구(typescript, tsx 등)는 루트 devDependencies로 hoist, 플러그인별 런타임 의존만 각 플러그인 `package.json`에. 플러그인 디렉토리 안에서는 `pnpm <script>` 또는 루트에서 `pnpm --filter <plugin-name> <script>`.
