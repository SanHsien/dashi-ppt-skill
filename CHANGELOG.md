[English](CHANGELOG.en.md) | 中文版

# 變更紀錄

格式參考 [Keep a Changelog](https://keepachangelog.com/zh-TW/1.1.0/)，新的在上面。
本檔只記錄**本 fork 的維護歷史**（2026-09-04 起）；上游
[`chuspeeism/dashi-ppt-skill`](https://github.com/chuspeeism/dashi-ppt-skill)
的產品演進見其自身歷史與 [`docs/UPSTREAM.md`](docs/UPSTREAM.md) 的審查清冊。
逐筆採用／略過的理由記在 [`docs/DECISIONS.md`](docs/DECISIONS.md)。

---

## 2026-09-04（安全性例外）

### 安全性

- **esbuild 0.28.0 → 0.28.2**（lockfile only，`package.json` 的 `^0.28.0` 未動）。修 GHSA-g7r4-m6w7-qqqr：`< 0.28.1` 的開發伺服器在 **Windows 上**可被讀取任意檔案——本 fork 是 Windows-first，預覽服務預設同區網可存取，所以這條比它的 low 評分更值得修。這是 [`docs/DECISIONS.md`](docs/DECISIONS.md) D-02「產品樹不動」的第一個例外，規則寫在 D-11。
- **驗證**：升級前後各跑一次 scaffold → validate → render → export PPTX。渲染出的 `index.html` **逐位元相同**（sha256 一致，498,463 bytes），PPTX 大小、可編輯文字物件數（48）與警告數（15）皆相同。`npm ci` 全新安裝 exit 0。細節見 [`REVIEW.md`](REVIEW.md)。
- **`image-size` 兩筆 high 無法修**（GHSA-w3rx-r6r6-pgpr、GHSA-5p2g-fcmc-qvqq）：沒有已修正的版本，`pptxgenjs` 最新版仍相依它，`npm audit fix --force` 的建議會把 pptxgenjs 降到 1.1.5 毀掉匯出引擎。改為在 [`SECURITY.md`](SECURITY.md) 揭露已知問題與可行的迴避方式。

### 新增

- `tests/test_docs.py::test_security_exception_floor_still_holds`：釘住 lockfile 的 esbuild `>= 0.28.1`，上游同步若把 lockfile 蓋回舊版會讓 CI 紅，而不是靜默回退。

---

## 2026-09-04（fork overlay 建立）

Fork 自上游 `7cb2334`（`Publish skill v0.4.11`，2026-07-30）。**產品未改**：
`skills/`、`npm-dist/`、`.claude-plugin/` 與上游一致。

### 新增

- **繁中公開入口。** `README.md` 改為繁體中文；上游簡中原檔完整保留為 `README.zh-CN.md`，英文為 `README.en.md`，三者互相連結。
- **AI 維護真相源。** `AGENTS.md`（單一真相源）與 `CLAUDE.md`（薄補丁）。
- **Fork 說明與授權邊界。** `FORK.md`、`NOTICE.md`——明確標示上游是 AGPL-3.0（不是 MIT），以及 `skills/dashi-ppt/project/packages/html-deck-to-pptx` 是不得單獨提取的專有元件。
- **Windows 開發 gate。** `tools/dev_check.ps1`：compileall → ruff（E9+F）→ pytest → skill 驗證 → 全部追蹤 JS 的 `node --check` → 維護文件相對連結檢查。
- **上游追蹤。** `tools/check_upstream_updates.py` + `tools/upstream_baseline.json`，commit／PR／issue 三個獨立水位；`gh` 不可用時 fail closed，不會把「沒查成」報成「沒東西要看」。
- **依賴新鮮度。** `tools/check_dependency_freshness.py`：宣告範圍對 PyPI 比對，支援 `freshness-hold:` 與會自動過期的 `.github/dependency-deferrals.json`。
- **CI 與自動化。** `ci.yml`（Ubuntu 3.9–3.14 + Windows 3.14 跑 canonical gate）、`codeql.yml`、`upstream-check.yml`（每週）、`dependency-freshness.yml`（每月）、`dependabot.yml`。
- **測試。** `tests/`：skill frontmatter、plugin manifest、雙語互連、文件連結、CI 旗標與 pyproject 一致性、git symlink 防護、上游檢查與依賴檢查的行為鎖定。
- **貢獻與政策文件。** `CONTRIBUTING.md`、`SECURITY.md`、`CODE_OF_CONDUCT.md`、`REVIEW.md`、`docs/`（DEVELOPMENT／UPSTREAM／DECISIONS／SKILL-SPEC）。
- **版控衛生。** 根目錄 `.gitignore`、`.gitattributes`（`* text=auto eol=lf`）、`.editorconfig`、`.python-version`、`pyproject.toml`（只放工具設定）、`requirements-dev.txt`。
- **Fork PR 邊界。** `.cursor/rules/no-upstream-pr.mdc`。
