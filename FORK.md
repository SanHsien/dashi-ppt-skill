# Fork 維護說明

本 repo fork 自 [`chuspeeism/dashi-ppt-skill`](https://github.com/chuspeeism/dashi-ppt-skill)，
沿用 AGPL-3.0 License 與完整 Git 歷史。

## 為什麼維護 fork

- 追蹤原作者持續更新的 Dashi PPT Agent Skill（12 套主題、1,020 個版式、瀏覽器內編輯、PPTX / PDF 匯出）。
- 採 Windows-first 維護：Windows 11 + PowerShell 是主要開發、除錯與完整驗收環境。
- 公開入口改以繁體中文為主，英文鏡像在 `README.en.md`，上游簡中原檔保留在 `README.zh-CN.md`。
- 建立可重現的 Windows 開發 gate、Windows CI job，以及逐筆審查的上游追蹤。
- 產品 skill 仍可直接安裝到 `~\.claude\skills\`、`~\.agents\skills\` 或 `~\.cursor\skills\`。

**回貢判準：修的是上游的 bug 就送回去；這裡獨創的文件／Windows 維護骨架留在這裡。**

## 與上游的差異

| 項目 | 說明 |
|---|---|
| `README.md` | 繁中主檔；英文鏡像在 [`README.en.md`](README.en.md)，上游簡中原檔在 [`README.zh-CN.md`](README.zh-CN.md) |
| `AGENTS.md` / `CLAUDE.md` | 本 fork 的 AI 維護單一真相源 |
| `NOTICE.md` / `FORK.md` | 來源、授權（含專有子套件邊界）與同步說明 |
| `tools/dev_check.ps1` | Windows 本機一鍵 gate |
| `tools/validate_skills.py` | 產品 skill frontmatter 驗證（Windows 可跑，不依賴 bash） |
| `tools/check_upstream_updates.py` | commit／PR／issue 三面向水位檢查 |
| `tools/check_dependency_freshness.py` | 宣告的依賴範圍對 PyPI 現況比對 |
| `.github/workflows/ci.yml` | Ubuntu 3.9–3.14 + Windows Python 3.14：pytest / ruff / skill 驗證 / `node --check` / 連結 |
| `.github/workflows/upstream-check.yml` | 每週對上游做未審查 commit／PR／issue 檢查 |
| `.github/workflows/codeql.yml`、`dependency-freshness.yml` | 安全掃描與依賴新鮮度 |
| `.cursor/rules/no-upstream-pr.mdc` | fork 的 PR 邊界機器層 |
| `docs/DECISIONS.md`、`docs/UPSTREAM.md`、`docs/DEVELOPMENT.md`、`docs/SKILL-SPEC.md` | fork 維護文件 |
| `REVIEW.md` | 風險快照，不是每個一般 bug 的流水帳 |

產品 `skills/`、`npm-dist/`、`.claude-plugin/` 以上游為準，除非有已記錄的 fork 修正。

**目前唯一的 fork 修正**：`skills/dashi-ppt/project/package-lock.json` 的 esbuild 釘在 `>= 0.28.1`
（安全性例外，見 [`docs/DECISIONS.md`](docs/DECISIONS.md) D-11 與 [`REVIEW.md`](REVIEW.md) R-07）。
上游同步時**不要**讓舊 lockfile 蓋回去——`tests/test_docs.py::test_security_exception_floor_still_holds`
會擋下來。

## 授權邊界

上游是 **AGPL-3.0**，不是 MIT。本 fork 的維護性修改同樣以 AGPL-3.0 釋出。
子套件 `skills/dashi-ppt/project/packages/html-deck-to-pptx`（匯出引擎）是**專有元件**，
僅授權作為本 skill 的組成部分使用，不得單獨提取、複製或再散布。詳見 [`NOTICE.md`](NOTICE.md)。

## 分支與 remote

- `origin/main`：SanHsien 維護線，也是唯一長期分支。
- 日常修改直接推 `origin/main`。只有需要他人審查或高風險改動時才開 branch → PR。
- `upstream/main`：原作者專案，只追蹤、不推送。
- Dependabot 或外部 fork 的變更同樣走 PR，讀 diff 並通過 CI 後再合併。

不要 `git push upstream`。同步方式見 [`docs/UPSTREAM.md`](docs/UPSTREAM.md)。

上游更新簡中 `README.md` 時，先更新本線的 `README.zh-CN.md`，再把新產品說明翻進繁中 `README.md` 並同步 `README.en.md`。作者宣傳、贊助 CTA 與 Star History 區塊不轉載進繁中入口。

## 換一台電腦怎麼開發

```powershell
git clone https://github.com/SanHsien/dashi-ppt-skill.git
cd dashi-ppt-skill
python -m venv .venv
.venv\Scripts\python -m pip install --upgrade pip
.venv\Scripts\python -m pip install -r requirements-dev.txt
pwsh -NoProfile -File tools\dev_check.ps1
```

只想安裝 Skill、不開發時：

```powershell
npx dashi-ppt-skill@latest
```

或把 `skills/dashi-ppt/` 複製到宿主的 skills 目錄。
