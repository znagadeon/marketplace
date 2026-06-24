#!/usr/bin/env node
// dailywatch SessionStart hook.
//
// 매일 "그 날의 첫 세션"에서만 발동한다. 미완료 watch가 있고, 마지막으로
// 발동한 날짜가 오늘이 아니면 — pending 목록을 additionalContext로 주입해
// Claude가 각 항목의 완료 여부를 직접 조사·보고하게 한다. 그 외엔 침묵한다.
//
// 빌드 산출물 없이 그 자리에서 실행돼야 하는 훅이라 (TS 컴파일 단계를 둘 수
// 없어) builtin만 쓰는 단일 .mjs로 둔다. 의존성 0.

import { readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const CONFIG_PATH = join(homedir(), ".claude", "dailywatch.json");

// 발동하지 않을 땐 stdout을 비워 둔다 — 빈 출력은 컨텍스트 주입 없음을 뜻한다.
function silent() {
  process.exit(0);
}

function todayStr() {
  // 로컬 타임존 기준 YYYY-MM-DD. "첫 세션" 판정은 사용자의 하루 경계를 따라야 한다.
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

let config;
try {
  config = JSON.parse(readFileSync(CONFIG_PATH, "utf-8"));
} catch {
  // config 자체가 없으면 아직 등록된 watch가 없다는 뜻 — 조용히 끝낸다.
  silent();
}

const watches = Array.isArray(config?.watches) ? config.watches : [];
// enabled가 명시적으로 false인 것만 제외한다 — 필드가 없는 항목은 활성으로 본다.
const pending = watches.filter((w) => w && w.enabled !== false);

if (pending.length === 0) silent();

const today = todayStr();
if (config.lastSessionDate === today) {
  // 오늘 이미 한 번 발동했다 — 그 날의 첫 세션이 아니다.
  silent();
}

// 오늘 첫 발동으로 마킹. 주입이 한 번만 일어나도록 먼저 기록한다.
config.lastSessionDate = today;
try {
  writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2) + "\n");
} catch {
  // 기록 실패해도 알림 자체는 진행 — 최악의 경우 같은 날 중복 알림일 뿐.
}

const lines = pending.map((w, i) => {
  const since = w.since ? ` (등록: ${w.since})` : "";
  const how = w.how ? `\n     확인 방법 힌트: ${w.how}` : "";
  return `  ${i + 1}. ${w.what}${since}${how}`;
});

const context = [
  `[dailywatch] 오늘(${today})의 첫 세션이다. 사용자가 "완료될 때까지 매일 확인해 달라"고 등록해 둔 항목이 ${pending.length}건 있다.`,
  ``,
  `다음 각 항목에 대해, 지금 사용 가능한 도구로 **직접 조사**해서 완료됐는지 확인하고 그 결과를 사용자에게 간결히 보고하라:`,
  ...lines,
  ``,
  `지침:`,
  `- 추측하지 말고 실제로 확인하라(파일/명령/깃/PR 등 가용한 수단). 확인이 불가능하면 "확인 불가"라고 솔직히 보고하라.`,
  `- 완료된 항목이 있으면 사용자에게 알리고, "/dailywatch 완료 <번호>"로 목록에서 내릴 수 있음을 안내하라.`,
  `- 보고는 항목당 한두 줄. 미완료면 현재 상태만 짧게. 이 보고 외의 작업을 자동으로 시작하지 마라.`,
  `- 이 알림은 사용자의 이번 메시지와 무관하게 떠야 하는 백그라운드 리마인더다. 먼저 이 보고를 하고, 그다음 사용자의 실제 요청으로 넘어가라.`,
].join("\n");

process.stdout.write(
  JSON.stringify({
    hookSpecificOutput: {
      hookEventName: "SessionStart",
      additionalContext: context,
    },
  })
);
