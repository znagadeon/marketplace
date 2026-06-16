# marketplace

Claude Code 플러그인 마켓플레이스. `plugins/*` 각 디렉토리가 독립된 플러그인이고, 루트 `.claude-plugin/marketplace.json`이 마니페스트.

## Setup

```sh
pnpm install
```

## 플러그인 관리

```sh
pnpm plugin add <name> <description>   # 새 플러그인 스캐폴드
pnpm plugin remove <name>              # 삭제
pnpm plugin major|minor|patch <name>   # 버전업
pnpm plugin list                       # 목록
```

`plugin.json`과 `marketplace.json` 직접 편집 금지 — 반드시 위 스크립트로. 자세한 규칙은 `CLAUDE.md`.

## Claude Code에서 사용

```
/plugin marketplace add <git-url-or-local-path>
```
