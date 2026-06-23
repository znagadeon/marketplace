---
name: pantry
description: AI 지식베이스(KB) CLI `pantry`를 부르는 얇은 래퍼. 작업 중 얻은 교훈을 자기완결적 atom으로 남기고(capture), 다른 세션·scope의 atom을 검색해 끌어온다(recall). "이거 KB에 남겨", "KB에서 찾아봐", "관련된 거 검색해줘", "이 교훈 저장해줘", "예전에 비슷한 거 있었나", "/pantry" 등 명시적 호출에만 발동. 자동발동 없음.
---

너는 지금 **pantry CLI를 부르는 손**이다. pantry는 순수 결정적 CRUD 도구일 뿐이고, 똑똑한 판단(무엇을 남길지·무엇이 낡았는지·어떤 어휘로 검색할지)은 전부 네 몫이다. 이 문서는 그 비결정 규약을 박는다.

## 발동
**명시적 호출에만** 발동한다 — "KB에 남겨" / "KB에서 찾아봐" 류. 무의식 자동발동은 없다. 사용자가 부르지 않았으면 atom을 만들지도 검색하지도 않는다.

## CLI 한눈에
저장소 경로(loc)는 `pantry config set loc <dir>`로 한 번 박아두면 이후 생략 가능. 안 박혔으면 매 호출에 `--loc <dir>`.

```
pantry create "<본문 md>" --session <name>   # atom 기록. id를 stdout으로 뱉음
pantry query [PATTERN...] [--session <n>] [--since <d>] [--until <d>]
             [--include-deprecated] [--page <n>] [--size <n>] [--sort lexical|recent]
pantry read <id>                              # atom 통째 읽기
pantry deprecate <id>                         # "더는 신뢰 마라" verdict 스탬프(본문 불변)
pantry remove <id>                            # 물리 삭제
```
- `query`는 PATTERN 없으면 **핸들**(session+id+첫 줄), 있으면 **스니펫**을 뱉는다. 다중 PATTERN = AND. 출력 머리의 `matched N, page x/y, next:`로 절단 여부를 읽어라.
- `read`는 query가 준 **id**만 받는다(path·`.md` 아님).

## capture = query→write (중복 query 필수)
"이거 KB에 남겨"를 받으면 **곧장 create하지 마라.** 먼저 검색해 기존 atom과 충돌·중복을 확인한다:

1. **근접 중복/충돌 query.** 남기려는 교훈의 핵심 어휘로 `query`(다중-grep 프로토콜 동원). 
2. **틀렸거나 낡은 기존 atom이 있으면** → 그걸 `deprecate <id>`로 내리고, 맞는 교훈을 새로 `create`.
3. **충돌 없으면** → 그냥 `create`.

이 강제는 시스템의 안티-오염 보장이 "기존 atom 존재를 네가 안다"에 통째로 얹혀 있기 때문이다. 건너뛰면 recall이 샌다. (단 lexical grep이라 *재진술된* 중복은 못 잡는다 — 같은 교훈을 다른 어휘로 쓰면 dedup에 안 걸려 중복 atom이 생긴다. 수용된 한계.)

## 자기완결적으로 써라 (create 전 본문 다듬기)
atom 하나 = 교훈 하나. create 부르기 전에 본문을 이렇게 다듬는다:
- **시점에서 탈색.** "그때 그 작업에선"을 본문에 욱여넣지 마라. "사내망 MCP는 NO_PROXY를 안 읽는다"처럼 언제 읽어도 말이 되게. 출처·시점은 본문이 아니라 메타(createdAt·session)가 맡는다.
- **혼자 읽어서 말이 되게.** 쪼개되, 더 쪼개면 자기완결성이 깨지는 지점이 입자의 바닥. 검색해도 안 걸리는 atom은 *덜 완결된* atom이다(자기완결성 = 검색 리트머스).
- **의미 분류 금지.** category/tag/scope를 본문이나 어디에도 박지 마라 — 분류는 검색이 대신한다. 무엇에 관한 atom인지는 자기완결적 본문에 자연히 박힌다.
- **본문 인라인 링크는 enrichment-only.** 산문으로 `[다른 atom](./{id}.md)`를 거는 건 OK지만, 링크를 안 따라가도 atom이 혼자 말이 돼야 한다. load-bearing이면 덜 완결된 것.

## session slug 규약
- 대화 세션 1개 = slug 1개. 그 세션 **첫 capture 때 semantic 이름을 한 번 mint**해 이후 재사용한다.
- 이름은 **영문/로마자**로 넘긴다(`--session=mcp-proxy-notes`). 한국어 작업명이면 로마자화하거나 영어로 — `--session`은 사람이 아니라 glob 키라 매칭이 가독성보다 우선. (pantry가 `yyyy-MM-dd-` prefix와 sanitize를 알아서 붙인다. 순수 한국어 등 sanitize 결과가 비면 create가 거부하니 ASCII 이름을 줘라.)

## recall = 다중-grep 프로토콜
"KB에서 관련된 거 찾아봐"를 받으면 query 한 번으로 끝내지 마라. query 한 번은 멍청한 단일 grep이고, **잇는 판단은 네 머릿속에** 있다:

1. **막막하면 bare query 먼저.** PATTERN 없이 `query`(또는 `query --session <s>`)로 실재하는 session 목록·atom 핸들을 조망한다 — 동의어를 허공에 추측하는 대신 실재 어휘를 보고 겨눈다.
2. **동의어·EN/KO·다른 scope 어휘로 여러 번 query**해 결과의 합집합을 취한다. 한 작업 경험이 여러 scope에 걸치므로(예: MCP 삽질기 = MCP 지식이자 인프라/프록시 지식), 한 어휘로는 다 못 건진다.
3. **결과에 딸려온 연결 atom을 단서로** 후속 query를 판단한다("B도 검색해야겠군").
4. 스니펫을 보고 통째로 읽을 것을 골라 `read <id>`. 그 자리에서 판단·종합·(필요시) 빚기.

## 교정 vs 보충
- **교정(틀렸다/낡았다)** → 옛 atom `deprecate` + (필요시) 맞는 교훈 새로 `create`. 본문은 절대 안 고친다(atom은 불변).
- **보충(새 통찰/반론)** → 자기완결적인 *다른* 교훈이면 새 `create`. 검색이 병치하고, 출처 관계는 read 시점에 네가 판단한다.
- 어느 atom을 deprecate할지·무엇이 맞는지 판단은 전부 네 몫이다. 사람(소유자)이 곁에 있고 충돌하는 두 atom이 있으면 어느 쪽이 맞는지 물어 verdict을 더 정확히 한다(보너스지 의존 아님).

## 경계 (앱에 넘기지 마라)
projection(scope로 잘라 게시글·PPT로 빚기), 출처 관계 판단, 의미 확장 검색, 자기완결성 판정 — 전부 **네가** query→read로 긁어와 그 자리에서 한다. pantry에 그런 서브커맨드는 없고, 앞으로도 없다.
