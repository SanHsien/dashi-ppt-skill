# 路線圖

> 本 repo 後續工作的單一真相源。做完一項，就在同一個 commit 刪掉那一列；新工作只加在這裡。
> 現況段的數字是 2026-10-29 依 `main` `9ed21194066c` 查的快照，開工前先重查 GitHub。

## 現況

上游 `chuspeeism/dashi-ppt-skill`（AI Agent 的 PPT 技能）的維護 fork（public，非 GitHub fork 關係，但有上游遠端）。健康：`CI`、`CodeQL`、`Dependency freshness`、`Upstream check` 預設分支最近一次皆 success；Dependabot 與 Code scanning 告警 0 筆；open PR 0 筆；issues 已停用（未查到 issue 數，不是 0）；最近 release 為 v0.5.0（2026-10-17）。上游審查水位 `21dc7e5`／PR 36／issue 44（`tools/upstream_baseline.json`），沒有卡住的事，近期無必做項。

## 近期：可以直接動手
| 項目 | 為什麼 | 驗收方式 | 建議執行者 | 證據 |
| --- | --- | --- | --- | --- |
| 無 | 工作區乾淨、無 open PR、無告警、四個 workflow 皆綠；已知缺陷都屬上游持有且已登記（見「刻意不做」），不在本線修 | — | — | 2026-10-29 證據快照；接續開發報告（2026-10-25）、深掃報告（2026-10-26） |

## 中期：等條件成立再做
| 項目 | 觸發條件 | 驗收方式 | 建議執行者 | 證據 |
| --- | --- | --- | --- | --- |
| 複審 ruff 基線 | 日期到 2026-11-25（`.github/dependency-deferrals.json` 的 `revisit`），或 `Dependency freshness`（每月 1 日）因此轉紅 | 決定升基線或延後：升則 ruff floor 與 `pyproject.toml` 同步、`ruff check` 與 `tools\dev_check.ps1` 綠並刪除該 deferral；延後則更新 `revisit` 與 `reason` | Claude Sonnet | `.github/dependency-deferrals.json:4-8`；接續開發報告（2026-10-25） |
| 上游新版審查（含整包對齊 v0.4.12–v0.4.14 的決定） | `Upstream check`（每週一 03:00 UTC）轉 failure，或 `git ls-remote` 上游 main 出現 `21dc7e5` 之後的 commit；failure 代表有未審項目，不是工具壞。整包對齊另需：維護者決定以上游發版為基底重放 D-12 修補，或上游新版含安全性修正 | 逐項判決寫進 `docs/DECISIONS.md`、`tools/upstream_baseline.json` 水位前進；有移植的跑 `pwsh -NoProfile -File tools\dev_check.ps1` 綠並更新 `docs/UPSTREAM.md` | Claude Opus | `docs/DECISIONS.md` D-13（觸發條件段）；`.github/workflows/upstream-check.yml:11` |
| 補上 `render:themes` script 或改呼叫端 | 上游修好 issue #29（或維護者決定本線先分叉） | `skills/dashi-ppt/project/package.json` 有該 script 或 `preview-freshness.mjs` 不再呼叫它；主題預覽過期時流程不中斷；`REVIEW.md` R-06 回註 commit | Claude Sonnet | `docs/DECISIONS.md` D-08；`REVIEW.md` R-06；`skills/dashi-ppt/project/scripts/preview-freshness.mjs:48` |
| 升級測試基準（pytest 9 等需要新 Python 的依賴） | CI 矩陣不再測 py3.9（`.github/workflows/ci.yml:25`）時，才取消 `requirements-dev.txt:2` 的 `freshness-hold` 標記 | pytest 下限升到 9、移除標記、`CI` 全矩陣綠、`Dependency freshness` 綠 | Codex | `.github/workflows/ci.yml:25`；`requirements-dev.txt:1-2` |

## 刻意不做
| 不做什麼 | 理由 | 什麼情況下重新考慮 |
| --- | --- | --- |
| 單獨挑移植上游 v0.4.13 `write-safe-props.mjs` | 依賴 v0.4.12 的 `projection.structure`，本產品樹不存在，單移植無意義 | 上述「上游新版審查」整包對齊時一併處理 |
| 在本線修產品缺陷（如 `render:themes`） | D-02 產品樹不動；正確修法由上游決定，先修會在下次同步對撞 | 見 D-08、D-10 的觸發條件 |
| 改寫歷史、強推或重接上游共同祖先 | 歷史已重建是已知事實，不是缺陷 | 不重新考慮 |

## 維護方式

上游節奏：每週一 `Upstream check`，failure 才動手；判決與水位見 [`docs/DECISIONS.md`](docs/DECISIONS.md)、[`docs/UPSTREAM.md`](docs/UPSTREAM.md)。依賴：每月 `Dependency freshness` 加 Dependabot；deferral 一律帶 `revisit` 日期。發版：有使用者可見變更才升版並建立 release。
