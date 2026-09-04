# 上游追蹤

上游：[`chuspeeism/dashi-ppt-skill`](https://github.com/chuspeeism/dashi-ppt-skill)（AGPL-3.0）
本線：[`SanHsien/dashi-ppt-skill`](https://github.com/SanHsien/dashi-ppt-skill)

## 設定 remote

```powershell
git remote add upstream https://github.com/chuspeeism/dashi-ppt-skill.git
git remote -v          # upstream 只 fetch，不 push
gh repo set-default SanHsien/dashi-ppt-skill
gh repo set-default --view    # 必須回 SanHsien/dashi-ppt-skill
```

`gh` 在 fork clone 的預設 repo 是上游，所以 `set-default` 是每個 clone 的第一件事。
規則見 [`.cursor/rules/no-upstream-pr.mdc`](../.cursor/rules/no-upstream-pr.mdc)。

## 審查流程

```
git fetch upstream main
        │
        ▼
python tools/check_upstream_updates.py --strict
        │  產生 upstream-review-report.md（commit / PR / issue 三張表）
        ▼
逐筆判斷：與繁中入口、Windows gate、測試衝突嗎？
        │
        ├─ 採用 → merge 或 cherry-pick → 跑 dev_check.ps1 → 記 DECISIONS.md
        └─ 略過 → 記 DECISIONS.md（寫觸發條件，不要只寫分類詞）
        │
        ▼
推進 tools/upstream_baseline.json 的對應水位（驗證通過之後才推）
```

**Baseline 代表「已審查」，不代表「全部已合併」。**

## 四個面向，四個水位

| 面向 | 水位欄位 | 為什麼單獨記 |
|---|---|---|
| commit | `reviewed_through` | 已合併的變更 |
| pull request | `reviewed_pr_through` | 未合併就關閉的 PR 永遠不會出現在 commit 軸上，但可能正是本 fork 想要的修正 |
| issue | `reviewed_issue_through` | 描述的缺陷本 fork 可能也有，不必等上游修 |
| 分支 | 記 head SHA | 上游正在做但還沒進 main 的東西 |

查 PR / issue 一律用 `--state all`：只查 open 會漏掉「開了又關」的那一類。
`gh` 不可用時 checker **fail closed**（exit 2），不會把「沒查成」報成「沒東西要看」。

## 審查清冊

| 日期 | commit 水位 | PR 水位 | issue 水位 | 說明 |
|---|---|---|---|---|
| 2026-09-04 | `7cb2334` | 0 | 0 | Fork overlay 建立點（上游 `Publish skill v0.4.11`，2026-07-30）。產品未改；PR／issue 水位從 0 起算，第一次排程檢查會把上游至今全部列為待審——這是預期狀態。 |

## 本 fork 不同步的東西

- 上游 README 的作者宣傳、贊助 CTA 與 Star History 區塊：不轉載進繁中入口（`README.zh-CN.md` 是原檔鏡像，保留原樣）。
- `.claude-plugin/marketplace.json` 的 `owner`：維持上游，不改掛本線。
- 本 fork 獨創的維護骨架（`tools/`、`tests/`、`.github/workflows/`、`docs/`、`AGENTS.md` 等）：不回貢，除非維護者在當次對話明確同意。
