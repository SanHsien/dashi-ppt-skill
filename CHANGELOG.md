[English](CHANGELOG.en.md) | 中文版

# 變更紀錄

格式參考 [Keep a Changelog](https://keepachangelog.com/zh-TW/1.1.0/)，新的在上面。
本檔只記錄**本 fork 的維護歷史**（2026-09-04 起）；上游
[`chuspeeism/dashi-ppt-skill`](https://github.com/chuspeeism/dashi-ppt-skill)
的產品演進見其自身歷史與 [`docs/UPSTREAM.md`](docs/UPSTREAM.md) 的審查清冊。
逐筆採用／略過的理由記在 [`docs/DECISIONS.md`](docs/DECISIONS.md)。

---

## 2026-09-09（依賴新鮮度：加查 Actions）

### 修復

- **依賴新鮮度的 Actions 查詢改帶 token。** 匿名 `api.github.com` 是每小時 60 次、hosted runner 共用同一個位址額度；超過之後每一列 Action 的 `latest` 都變成 `unknown`，整個 Actions 半邊靜默失聲。`_github_json` 現在在環境有 `GITHUB_TOKEN`／`GH_TOKEN` 時送 `Authorization: Bearer`，workflow 的檢查步驟也補上 `GH_TOKEN: ${{ github.token }}`。沒有 token 仍可運作，只是走匿名額度。（缺陷由 `SanHsien/commerce-agents` 那條線先發現。）

### 新增

- **`tools/check_dependency_freshness.py` 現在查兩個來源**：`requirements-dev.txt` 對 PyPI，`.github/workflows/*.yml` 裡釘住的 GitHub Actions 對 GitHub Releases API。報告分兩張表。之前 Actions 的版本漂移沒有任何自動化看得到。


- **三段式 action path 不再被漏掉**：`github/codeql-action/init` 這種帶子路徑的 action 過去完全不在檢查範圍內（regex 只吃 `owner/repo@`）。
- **無法比較的版本不再報 OK**：`github/codeql-action` 的 `releases/latest` 回的是 `codeql-bundle-v2.26.4`，與 workflow 釘的 `v4.37.4` 不同編號系統。現在會改查 tag 列表取最新可解析版本；真的比不了就記 `CHECK FAILED`——不會失敗的檢查不是檢查。
- **CodeQL action 重釘 v4.37.4 → v4.37.9**（SHA `cdf488f`）。這是修好檢查後當場抓到的實際漂移。

---

## 2026-09-06（CodeQL 安全修補）

### 安全性

- 清洗 editable rich-text state 後才寫入 DOM，阻斷 stored XSS；保留安全的基本格式標記。
- deck state 與 media map 改用 null-prototype 容器，避免外部 key 改寫物件原型。
- deck asset route 解析並限制 real path，以同一檔案描述元讀取，拒絕 symlink 逃逸。
- preview lock／log 搬到使用者私有 runtime 目錄；log 禁止跟隨 symlink，port reservation 到
  commit 沿用原 exclusive fd。
- 新增跨平台 Node 安全測試並接入 Windows gate 與 Ubuntu CI。判讀與驗收門檻見
  [`docs/DECISIONS.md`](docs/DECISIONS.md) D-12。

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
