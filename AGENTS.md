# AGENTS.md

給 Codex、Claude Code、Cursor 與其他自動化代理在本專案工作時的指引。產品與使用方式先讀 [`README.md`](README.md)；開發與驗收細節見 [`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md)。

## 專案定位

這是 [`chuspeeism/dashi-ppt-skill`](https://github.com/chuspeeism/dashi-ppt-skill) 的 **AGPL-3.0 維護型 fork**。
產品本體是一個 Agent Skill：把使用者需求整理成 JSON 計畫，交給本地 Node 生成器輸出可離線開啟、可在瀏覽器編輯的 HTML 簡報，並能匯出 PPTX / PDF。

`origin` 是 `SanHsien/dashi-ppt-skill`，`upstream` 是原作者 repo，預設分支皆為 `main`。
保留原作者、AGPL-3.0 授權與產品 `skills/`、`npm-dist/`、`.claude-plugin/`。本 fork 的維護差異記在 [`FORK.md`](FORK.md) 與 [`docs/DECISIONS.md`](docs/DECISIONS.md)。

主要開發與完整驗收環境是 **Windows 11 + PowerShell**；Ubuntu CI 補跨平台相容性。產品執行時需要 **Node.js 20+**，匯出 PPTX / PDF 另需本機 Chrome / Chromium / Edge。

## 硬性邊界

- **不要改寫產品 skill。** `skills/dashi-ppt/SKILL.md`、`references/`、`agents/`、`assets/`、`scripts/`、`project/` 是給宿主 Agent 安裝的產品規格與執行時，不是本 fork 的維護索引。`npm-dist/`、`.claude-plugin/` 同樣以上游為準，除非有已記錄的 fork 修正（見 `FORK.md` 與 `docs/DECISIONS.md`）。維護規則以本檔為準。
- **不要把產品內容翻成繁體來「統一文件語言」。** 上游產品語言是簡體中文；本 fork 的公開入口與維護文件用繁體中文與英文，簡中原檔保留在 `README.zh-CN.md`。
- **授權不可動。** 本專案是 AGPL-3.0，不是 MIT。不要改 `LICENSE`、不要移除著作權標示、不要把 AGPL 檔案重新授權。子套件 `skills/dashi-ppt/project/packages/html-deck-to-pptx` 是**專有元件**，不得單獨提取、複製或再散布——包含「抽出來做成獨立工具」這類重構。
- 不提交 `.env`、API key、cookie、真實客戶簡報內容或客戶資料當 fixture。`output/`、`uploads/`、`node_modules/` 不入版控。
- 不推送到 `upstream`。上游同步先跑 `python tools/check_upstream_updates.py`，逐筆審查後再 merge / cherry-pick；不盲目覆蓋 fork 文件與 Windows gate。
- 不把本 fork 包裝成原創專案，也不把 `.claude-plugin/marketplace.json` 的 owner 改掛到本線——那會變成第二個假官方 marketplace。
- 不在產品 `SKILL.md` 裡加入 Claude Code 專用的 `` !`command` `` 語法；那會讓其他宿主看到字面指令。

## 技術與資料流

- `skills/dashi-ppt/SKILL.md`：產品入口，宿主 Agent 直接讀。
- `skills/dashi-ppt/project/`：Node 生成器（`type: module`，`private: true`）。`package.json` 的 `export:pptx` / `export:pdf` / `preview:start` 等 script 是對外契約。
- `skills/dashi-ppt/project/packages/html-deck-to-pptx/`：專有匯出引擎，授權範圍見該目錄的 LICENSE。
- `npm-dist/install.mjs`、`npm-dist/publish-npm-skill.mjs`：`npx dashi-ppt-skill@latest` 的安裝與發佈腳本，以上游為準。
- `.claude-plugin/marketplace.json`：Claude Code plugin marketplace 清單。
- `tools/check_*.py`、`tools/validate_skills.py`、`tools/dev_check.ps1`：fork 維護工具。Ruff 只掃 Python，且只掃本 fork 自己的檔案。
- `tests/`：pytest。CI 另跑 ruff（E9+F）、skill 驗證、全部追蹤 JS 的 `node --check` 與相對連結檢查。
- `pyproject.toml`：**只放工具設定**，沒有 `[project]` 與 `[build-system]`——本 repo 交付的是 Agent Skill 與 Node 生成器，不是 Python 套件。

## 開發原則

- 一般變更直接推 `origin/main`，不開功能分支、不開維護 PR。只有需要他人審查、或風險高到值得先讓 CI 在 PR 上跑一輪時，才退回 branch → PR → CI → merge。與 [`CONTRIBUTING.md`](CONTRIBUTING.md) 一致。
- 修 bug 先補可重現失敗測試，再做最小修正。
- 上游的公開安裝方式（`npx dashi-ppt-skill@latest`）、skill frontmatter（`name` + `description`）、目錄名與 `project/package.json` 的 script 名稱視為相容性契約。規格摘要見 [`docs/SKILL-SPEC.md`](docs/SKILL-SPEC.md)。
- 不為了套格式而大改上游檔案；Ruff 只閘 E9（語法）與 F（pyflakes）。
- 使用繁體中文回覆；使用者文件以繁中為主，公開入口同步維護 `README.en.md`。
- 上游更新 `README.md`（簡中）時：更新 `README.zh-CN.md`，把新的產品說明翻進繁中 `README.md`，並同步 `README.en.md`。作者宣傳、贊助 CTA 與 Star History 區塊不轉載進繁中入口。
- 提交訊息用 Conventional Commit。Dependabot 或外部 fork 的變更也走 PR，讀 diff 並通過 CI 後再合併。
- `REVIEW.md` 是風險快照，不是每個一般 bug 的流水帳。
- 不 force-push `main`，不刪 `upstream` remote。

## 上游處理

1. `git fetch upstream main`
2. `python tools/check_upstream_updates.py --strict`
3. 逐筆判斷是否與繁中入口、Windows gate 或測試衝突。
4. 可同步的提交用 merge；只需要部分修正時 cherry-pick 或最小重做。
5. 跑 `pwsh -NoProfile -File tools\dev_check.ps1`
6. 採用／略過寫進 `docs/DECISIONS.md`，驗證後才推進 `tools/upstream_baseline.json`

Baseline 代表「已審查」，不代表「全部已合併」。

**四個面向都要看，不是只看 commit**：commit、open PR、open issue、上游分支。每個面向各記一個水位（`reviewed_through`／`reviewed_pr_through`／`reviewed_issue_through`，分支記 head SHA），下次只看更大的編號或變動過的 head。

**判準是證據，不是分類。** 結論要寫得可查證：diff 動了哪些檔案、本 fork 對應的檔案實際長什麼樣，以及**觸發條件**。

## 驗證

```powershell
python -m venv .venv
.venv\Scripts\python -m pip install --upgrade pip
.venv\Scripts\python -m pip install -r requirements-dev.txt
pwsh -NoProfile -File tools\dev_check.ps1
```

沒有實際跑過 Windows gate，不要宣稱本機開發環境已可用。Node.js 20+ 必須在 PATH 上，gate 會對全部追蹤的 `.js` / `.mjs` / `.cjs` 跑 `node --check`。

## 文件責任

- `README.md` / `README.en.md` / `README.zh-CN.md`：公開產品與 fork 入口。來源與 AGPL credit 必留，作者宣傳不轉載。
- `FORK.md`：與上游的關係、差異、同步方式。
- `NOTICE.md`：授權與 attribution，含專有子套件邊界。
- `docs/UPSTREAM.md`：upstream remote 與審查清冊。
- `docs/DEVELOPMENT.md`：本機開發與驗收指令。
- `docs/DECISIONS.md`：長期取捨。
- `docs/SKILL-SPEC.md`：產品 skill 的 frontmatter／目錄契約（本 fork 維護摘要）。
- `CONTRIBUTING.md` / `SECURITY.md` / `CODE_OF_CONDUCT.md`：本 fork 的貢獻、安全回報與行為準則。
- `CHANGELOG.md` / `CHANGELOG.en.md`：**只記本 fork 的維護歷史**，不複製上游產品演進。
- `REVIEW.md`：最新專案覆核狀態，**風險快照**，不是 bug log。

## 對外邊界：PR 只打本 fork

- **PR、push、release 一律指向 `SanHsien/dashi-ppt-skill`。** 對上游 `chuspeeism/dashi-ppt-skill` 開 PR、push 或發 release 需要維護者在當次對話明確同意回貢；「fork 一份」「建開發環境」「比照其他 repo」都不是同意。
- 根因是機制不是粗心：`gh` 在 fork clone 的**預設 repo 就是上游**，裸跑 `gh pr create` 必然打上去。每個 clone 先跑一次 `gh repo set-default SanHsien/dashi-ppt-skill`。
- 開 PR 仍明寫 `gh pr create --repo SanHsien/dashi-ppt-skill --base main --head <分支>`，並**讀輸出的 URL**，owner 必須是 `SanHsien`。不是就立刻 `gh pr close` 留言道歉說明，再對 origin 重開。
- 2026-08-22 一天內兩個工作階段各誤開一個上游 PR。批次跑多個 repo 時最容易略過確認，而那正是兩次出事的場合。
