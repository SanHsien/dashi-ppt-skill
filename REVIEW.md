# Repository review（Windows-first）

- Review date: 2026-09-04
- Fork point: 上游 `7cb23347f91cda1a5519eafc8c040704e389535a`（`Publish skill v0.4.11`，2026-07-30）
- Upstream watermarks: commit `7cb2334`；`reviewed_pr_through` / `reviewed_issue_through` = **0**（overlay 建立點，尚未逐筆審查）
- Primary environment: Windows 11、PowerShell、Python 3.14（本機）、CI Ubuntu 3.9–3.14 + Windows 3.14、Node.js 26（本機）／22（CI）
- Status: 維護骨架可用；產品 `skills/`、`npm-dist/`、`.claude-plugin/` 未改寫

## 結論

這個 fork 適合作為 Windows 本機安裝、並追蹤上游 Dashi PPT skill 的維護線。產品是一個 Agent Skill 加一套本機 Node 生成器（12 套主題、1,020 個版式、瀏覽器內編輯、PPTX / PDF 匯出）；本線**沒有**接手產品開發。

本輪建立 overlay 時列出的 R-01～R-05：R-01～R-03 已處理，R-04、R-05 是刻意不修。

## 已處理 findings

| ID | 嚴重度 | Finding | 處理 |
|---|---|---|---|
| R-01 | P2 | 上游是 **AGPL-3.0**，且 `skills/dashi-ppt/project/packages/html-deck-to-pptx` 附獨立的**專有授權**（禁止單獨提取、複製、再散布）。本線多數 repo 是 MIT fork，照舊習慣寫 NOTICE 會把授權寫錯，而寫錯的後果是散布時的法律風險。 | `NOTICE.md` / `FORK.md` / `README.md` 三處明寫 AGPL-3.0 與網路服務條款，並單獨一節說明專有子套件邊界。`tests/test_docs.py::test_proprietary_export_engine_keeps_its_own_license` 鎖住該 LICENSE 存在且 NOTICE 有提到它。 |
| R-02 | P2 | 上游 `README.md` 是簡體中文，本線慣例是繁中主檔。就地翻譯會讓上游每次更新 README 都變成整檔衝突。 | `git mv README.md README.zh-CN.md` 保留原檔，新寫繁中 `README.md`，`README.en.md` 加 fork 說明；三者互相連結。`test_public_readmes_are_a_three_way_set` 鎖住。理由見 [`docs/DECISIONS.md`](docs/DECISIONS.md) D-01。 |
| R-03 | P3 | 上游 `.github/ISSUE_TEMPLATE/config.yml` 只有 `blank_issues_enabled: true`，訪客會把產品缺陷開到這個 fork。 | 加 contact links：本 fork 的 `CONTRIBUTING.md`、上游 issues、安全性通報入口。`test_issue_contact_links_point_at_this_fork` 鎖住。 |

## 刻意不修

| ID | 嚴重度 | Finding | 理由 |
|---|---|---|---|
| R-04 | P3 | `.claude-plugin/marketplace.json` 的 `owner` 仍是「大师的AI小灶」。 | 產品 marketplace 清單。改掛本線會把 fork 包裝成第二個官方 marketplace。 |
| R-05 | P3 | 上游 README 的 Star History 與 GitHub stars badge 指向上游 repo。 | `README.zh-CN.md` / `README.en.md` 是上游鏡像，保留原樣；繁中入口 `README.md` 不轉載這些區塊（`test_readme_keeps_credit_without_author_promotion` 擋住）。 |

## 本輪實證

### 本機 Windows gate（2026-09-04）

```text
pwsh -NoProfile -File tools\dev_check.ps1
==> Compile maintained Python
==> Ruff (E9 + F)              All checks passed!
==> Pytest                     39 passed in 0.26s
==> Validate skills            Passed: 0; warnings: 1; issues: 0
==> Node syntax check (163 files)
==> Check Markdown links       共 17 份維護文件，0 份有缺檔。
WINDOWS DEV CHECK GREEN        (exit 0)
```

唯一的 warning 是 `dashi-ppt` 的 description「lacks clear trigger phrases」——驗證器找的是英文
`when` / `use` / `mention`，而這個 skill 的觸發詞是簡體中文（「制作 PPT、演示文稿……时使用」）。
**不修**：改描述等於改產品的觸發行為。

### 突變驗證（確認測試不是裝飾）

| 故意破壞 | 預期紅燈的測試 | 結果 |
|---|---|---|
| `pyproject.toml` 的 `target-version` 改成 `py38`（與 CI 旗標不一致） | `test_tool_config_matches_ci_flags` | FAILED ✅ |
| 把 `html-deck-to-pptx/LICENSE` 改名藏起來 | `test_proprietary_export_engine_keeps_its_own_license` | FAILED ✅ |

兩項都已還原，還原後 gate 重跑仍為 `WINDOWS DEV CHECK GREEN`。

### GitHub Actions

首推之後補上實際 run 連結；在那之前**不宣稱** CI 已在 GitHub 上綠過。

## 已檢查、不列為 finding

- 產品現況：1 個 `skills/dashi-ppt/` 目錄，frontmatter 驗證通過；163 個追蹤的 `.js`/`.mjs`/`.cjs` 全數通過 `node --check`。
- Fork overlay Python（`tools/check_*.py`、`tools/validate_skills.py`）無 `os.system`、`shell=True`、`eval(`、`exec(`、`pickle`；`check_upstream_updates.py` 以 argv 列表呼叫 `git` 與 `gh`。
- 倉庫沒有提交 `.env`。生成物（`output/`、`uploads/`、`node_modules/`）已在 `.gitignore`。
- CI / CodeQL 的 actions 已 pin commit SHA，且 `persist-credentials: false`。
- `.gitattributes` 釘 `* text=auto eol=lf`；`git ls-files -s` 無 `120000` blob。
- 上游 repo 沒有自己的 workflow（只有 ISSUE_TEMPLATE），所以本線沒有需要加 repo 閘門的上游 workflow。

## 尚未宣稱範圍

- **沒有**實際跑過產品生成流程：沒有 `npm install`、沒有生成任何簡報、沒有匯出 PPTX / PDF。本輪只驗證維護骨架與 `node --check` 層級的語法。
- **沒有**在 Claude Code / Codex / Cursor 實際安裝並觸發這個 skill。
- **沒有**逐筆審查上游自 fork point 之後的 commit / PR / issue——水位刻意留在 0，等第一次 `upstream-check` 排程結果再處理。
- **沒有**對上游開任何 PR、push 或 release。
- `dev_check.ps1` **不含** Bandit；CodeQL 是獨立 workflow。
- **不宣稱**本 fork 有自己的 GitHub Release；產品版本仍跟隨上游（目前 `0.4.11`）。
