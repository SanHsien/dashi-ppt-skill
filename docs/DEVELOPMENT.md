# 開發指南

本檔講「怎麼在本機跑起來、怎麼驗收」。維護規則見 [`AGENTS.md`](../AGENTS.md)，與上游的關係見 [`FORK.md`](../FORK.md)。

## 兩層環境

這個 repo 有兩套互不相干的執行環境，不要混在一起：

```
產品（上游持有）                       維護骨架（本 fork 持有）
skills/dashi-ppt/project/  ─ Node 20+  tools/*.py, tests/  ─ Python 3.9–3.14
  npm install → 生成/預覽/匯出           dev_check.ps1 → compileall/ruff/pytest
  匯出還需要 Chrome/Chromium/Edge        CI 兩邊都跑，但只有維護骨架是本線改的
```

## 維護骨架（日常開發都在這層）

```powershell
python -m venv .venv
.venv\Scripts\python -m pip install --upgrade pip
.venv\Scripts\python -m pip install -r requirements-dev.txt
pwsh -NoProfile -File tools\dev_check.ps1
```

`tools\dev_check.ps1` 是 canonical gate，依序跑：

| 步驟 | 內容 |
|---|---|
| Compile | `compileall` 本 fork 維護的 Python |
| Ruff | `E9`（語法）+ `F`（pyflakes），只掃 `tests/` 與 `tools/check_*.py`、`tools/validate_skills.py` |
| Pytest | `tests/` 全部 |
| Validate skills | `skills/*/SKILL.md` 的 frontmatter 契約 |
| Node syntax | `git ls-files` 列出的全部 `.js` / `.mjs` / `.cjs` 跑 `node --check` |
| Links | 維護文件的相對連結 |

最後印出 `WINDOWS DEV CHECK GREEN` 才算過。**沒跑過就不要宣稱本機環境可用。**

需要 Node.js 20+ 在 PATH 上（gate 會直接呼叫 `node`）。

## 產品層（只有要實際生成簡報時才需要）

```powershell
cd skills\dashi-ppt\project
npm install
npm run preview:start
npm run export:pptx -- <PPT 輸出目錄>/ppt 輸出.pptx
npm run export:pdf  -- <PPT 輸出目錄>/ppt
```

匯出需要本機 Chrome / Chromium / Edge，可用 `CHROME_PATH` 指定執行檔路徑。
`node_modules/`、`output/`、`uploads/` 都在 `.gitignore` 裡，不入版控。

## 單獨跑某個檢查

```powershell
python -m pytest tests -q
python tools\validate_skills.py
python tools\check_links.py
python tools\check_upstream_updates.py            # 產生 upstream-review-report.md
python tools\check_upstream_updates.py --strict   # 有未審查項目就非零離開
python tools\check_dependency_freshness.py        # 產生 dependency-freshness-report.md
```

兩份 `*-report.md` 是產生物，已被 `.gitignore` 排除，不要提交。

## CI

| Workflow | 觸發 | 內容 |
|---|---|---|
| `ci.yml` | push / PR / 手動 | Ubuntu Python 3.9–3.14 逐步跑 gate 的各步驟；Windows 3.14 直接跑 `dev_check.ps1` |
| `codeql.yml` | push / PR / 每週 / 手動 | JavaScript-TypeScript 與 Python `security-extended` |
| `upstream-check.yml` | 每週一 / 手動 | 上游 commit／PR／issue 未審查項目，有就紅燈 |
| `dependency-freshness.yml` | 每月 1 號 / 手動 | 宣告範圍對 PyPI 比對，加上 open Dependabot PR 清單 |

Actions 全部 pin 到 commit SHA，並帶 `persist-credentials: false`。

## 常見坑

- **CRLF 假訊號**：全域 `core.autocrlf=true` 會讓工作區變 CRLF，`git status` 顯示 modified 但 `git diff` 是空的。`.gitattributes` 已釘 `* text=auto eol=lf`；真的遇到就 `git add --renormalize .`，確認零內容差異再提交。
- **git symlink**：Windows checkout 會炸（`Filename too long`）。`tests/test_docs.py::test_tracked_files_are_not_git_symlinks` 會擋住 `120000` blob 進版控。
- **不要對產品樹跑 ruff/format**：`pyproject.toml` 已把 `skills/`、`npm-dist/` 排除。
