# Dashi PPT Skill · 網頁版 PPT／每頁控制台／可編輯 PPTX 匯出

[![License: AGPL-3.0](https://img.shields.io/badge/License-AGPL--3.0-blue?style=flat-square)](./LICENSE)
[![CI](https://github.com/SanHsien/dashi-ppt-skill/actions/workflows/ci.yml/badge.svg)](https://github.com/SanHsien/dashi-ppt-skill/actions/workflows/ci.yml)
[![Upstream check](https://github.com/SanHsien/dashi-ppt-skill/actions/workflows/upstream-check.yml/badge.svg)](https://github.com/SanHsien/dashi-ppt-skill/actions/workflows/upstream-check.yml)
![Claude Code](https://img.shields.io/badge/Claude%20Code-Supported-6B5B95?style=flat-square)
![Codex](https://img.shields.io/badge/Codex-Supported-222222?style=flat-square)

繁體中文 | [English](README.en.md) | [简体中文（上游原檔）](README.zh-CN.md)

> **SanHsien 維護型 fork。** 產品本體由上游 [`chuspeeism/dashi-ppt-skill`](https://github.com/chuspeeism/dashi-ppt-skill) 開發並持有著作權，本線只加 Windows-first 的維護骨架與繁中入口。維護規則見 [`FORK.md`](FORK.md)，授權邊界見 [`NOTICE.md`](NOTICE.md)，本輪覆核見 [`REVIEW.md`](REVIEW.md)。
>
> `origin` 是 [`SanHsien/dashi-ppt-skill`](https://github.com/SanHsien/dashi-ppt-skill)，`upstream` 是 [`chuspeeism/dashi-ppt-skill`](https://github.com/chuspeeism/dashi-ppt-skill)。

把文件丟給你的 AI Agent，產出一份每一頁都自帶編輯控制台的簡報——不滿意的地方直接在瀏覽器裡改，改完再一鍵匯出成真實、可編輯的 PPTX。

- 12 套視覺主題
- 1,020 個版式頁面
- 8,576 個可調控件

完整的產品說明（含主題預覽圖與操作動畫）以上游原檔為準：[README.zh-CN.md](README.zh-CN.md)（簡體中文）、[README.en.md](README.en.md)（English）。

## 快速開始

安裝與更新是同一條指令，重跑即原地更新（已裝依賴自動保留）：

```powershell
npx dashi-ppt-skill@latest
```

環境需求：**Node.js 20+ 與 npm**；匯出 PPTX／PDF 需要本機安裝 Chrome / Chromium / Edge（可用 `CHROME_PATH` 環境變數指定路徑）。

也可以直接把 `skills/dashi-ppt/` 複製到宿主的 skills 目錄（`~\.claude\skills\`、`~\.agents\skills\`、`~\.cursor\skills\`），或在 Claude Code 以本 repo 根目錄的 [`.claude-plugin/marketplace.json`](.claude-plugin/marketplace.json) 掛載。

## 使用流程

1. **描述需求** — 主題、受眾、頁數、想突出的結論。
2. **選風格** — Skill 會展示 12 套風格預覽讓你挑；同時確認是否需要圖片／影片。
3. **自動組稿** — Skill 把需求整理成結構化內容，並設計對應的簡報方案。
4. **隨手編輯** — 改文字、換圖片、調模組數量、換配色，改動自動儲存。
5. **交付** — 匯出 HTML 離線包／PDF／可編輯 PPTX。

命令列匯出：

```powershell
npm --prefix <project 目錄> run export:pptx -- <PPT 輸出目錄>/ppt 輸出.pptx
npm --prefix <project 目錄> run export:pdf  -- <PPT 輸出目錄>/ppt
```

## 適用與不適用

**合適**：產業研究／募資回顧／競品分析／趨勢報告／專案匯報／方案展示／路演材料／內部訓練——需要快速形成結構完整、視覺統一、還能繼續改的簡報。

**不合適**：需要逐像素手工訂製視覺的場合。

## 隱私

內容層面零上傳：文件與簡報內容不會送到任何伺服器，生成、編輯、匯出都在本機完成，成品離線可開。會連網的只有兩件事——首次生成時 npm 自動安裝依賴，以及完成任務後的靜默版本檢查（只拉取最新版本號，不上傳任何內容）。本地預覽服務預設在同一區域網路內可瀏覽，匯出介面只對本機開放。

## 本 fork 加了什麼

| 項目 | 說明 |
|---|---|
| [`README.md`](README.md) | 繁中入口；上游簡中原檔保留在 [`README.zh-CN.md`](README.zh-CN.md)，英文在 [`README.en.md`](README.en.md) |
| [`AGENTS.md`](AGENTS.md) / [`CLAUDE.md`](CLAUDE.md) | AI 維護單一真相源 |
| [`FORK.md`](FORK.md) / [`NOTICE.md`](NOTICE.md) | 與上游的關係、差異、AGPL-3.0 與專有子套件的授權邊界 |
| [`tools/dev_check.ps1`](tools/dev_check.ps1) | Windows 本機一鍵 gate（compileall／ruff／pytest／skill 驗證／`node --check`／連結檢查） |
| [`tools/check_upstream_updates.py`](tools/check_upstream_updates.py) | 上游 commit／PR／issue 三面向水位檢查 |
| [`tools/check_dependency_freshness.py`](tools/check_dependency_freshness.py) | 宣告的依賴範圍對 PyPI 現況比對 |
| `.github/workflows/` | CI（Ubuntu 3.9–3.14 + Windows）、CodeQL、上游檢查、依賴新鮮度 |
| [`docs/`](docs/) | [DEVELOPMENT](docs/DEVELOPMENT.md)、[UPSTREAM](docs/UPSTREAM.md)、[DECISIONS](docs/DECISIONS.md)、[SKILL-SPEC](docs/SKILL-SPEC.md) |

產品 `skills/`、`npm-dist/`、`.claude-plugin/` 以上游為準，除非有已記錄的 fork 修正。

## 開發

```powershell
git clone https://github.com/SanHsien/dashi-ppt-skill.git
cd dashi-ppt-skill
python -m venv .venv
.venv\Scripts\python -m pip install --upgrade pip
.venv\Scripts\python -m pip install -r requirements-dev.txt
pwsh -NoProfile -File tools\dev_check.ps1
```

細節見 [`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md)、[`CONTRIBUTING.md`](CONTRIBUTING.md) 與 [`SECURITY.md`](SECURITY.md)。變更紀錄見 [`CHANGELOG.md`](CHANGELOG.md)。

## 授權

本專案採 **GNU Affero General Public License v3.0（AGPL-3.0）**，完整條文見 [`LICENSE`](LICENSE)。你可以自由使用、修改、散布（含商業用途）；但散布修改版、或基於本專案及其修改版透過網路對外提供服務（如 SaaS）時，必須以 AGPL-3.0 向使用者公開完整的對應原始碼。

**例外**：子套件 `skills/dashi-ppt/project/packages/html-deck-to-pptx`（匯出引擎）是**專有元件**，僅授權作為本 skill 的組成部分使用，不得單獨提取、複製或再散布（詳見該目錄下的 LICENSE）。

Copyright (c) 2026 [chuspeeism](https://github.com/chuspeeism)。本 fork 的維護性修改同樣以 AGPL-3.0 釋出。授權與 attribution 的完整說明見 [`NOTICE.md`](NOTICE.md)。
