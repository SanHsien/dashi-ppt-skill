# Repository review（Windows-first）

- Review date: 2026-09-04
- Fork point: 上游 `7cb23347f91cda1a5519eafc8c040704e389535a`（`Publish skill v0.4.11`，2026-07-30）
- Upstream watermarks: commit `7cb2334`（fork point 即上游 head，commit 軸 0 筆）；`reviewed_pr_through` = **36**、`reviewed_issue_through` = **43**（首輪 7 PR + 35 issue 已 triage，零採用）
- Primary environment: Windows 11、PowerShell、Python 3.14（本機）、CI Ubuntu 3.9–3.14 + Windows 3.14、Node.js 26（本機）／22（CI）
- Status: 維護骨架可用；產品 `skills/`、`npm-dist/`、`.claude-plugin/` 未改寫，**唯一例外是維護者核可的 esbuild 安全性升級**（lockfile，見 R-07）

## 結論

這個 fork 適合作為 Windows 本機安裝、並追蹤上游 Dashi PPT skill 的維護線。產品是一個 Agent Skill 加一套本機 Node 生成器（12 套主題、1,020 個版式、瀏覽器內編輯、PPTX / PDF 匯出）；本線**沒有**接手產品開發。

本輪建立 overlay 時列出的 R-01～R-05：R-01～R-03 已處理，R-04、R-05 是刻意不修。

## 已處理 findings

| ID | 嚴重度 | Finding | 處理 |
|---|---|---|---|
| R-01 | P2 | 上游是 **AGPL-3.0**，且 `skills/dashi-ppt/project/packages/html-deck-to-pptx` 附獨立的**專有授權**（禁止單獨提取、複製、再散布）。本線多數 repo 是 MIT fork，照舊習慣寫 NOTICE 會把授權寫錯，而寫錯的後果是散布時的法律風險。 | `NOTICE.md` / `FORK.md` / `README.md` 三處明寫 AGPL-3.0 與網路服務條款，並單獨一節說明專有子套件邊界。`tests/test_docs.py::test_proprietary_export_engine_keeps_its_own_license` 鎖住該 LICENSE 存在且 NOTICE 有提到它。 |
| R-02 | P2 | 上游 `README.md` 是簡體中文，本線慣例是繁中主檔。就地翻譯會讓上游每次更新 README 都變成整檔衝突。 | `git mv README.md README.zh-CN.md` 保留原檔，新寫繁中 `README.md`，`README.en.md` 加 fork 說明；三者互相連結。`test_public_readmes_are_a_three_way_set` 鎖住。理由見 [`docs/DECISIONS.md`](docs/DECISIONS.md) D-01。 |
| R-03 | P3 | 上游 `.github/ISSUE_TEMPLATE/config.yml` 只有 `blank_issues_enabled: true`，訪客會把產品缺陷開到這個 fork。 | 加 contact links：本 fork 的 `CONTRIBUTING.md`、上游 issues、安全性通報入口。`test_issue_contact_links_point_at_this_fork` 鎖住。 |

| R-07 | P1 | **esbuild GHSA-g7r4-m6w7-qqqr**（low，development 範圍）：`>= 0.27.3, < 0.28.1` 的開發伺服器在 **Windows 上**可被讀取任意檔案。本 fork 正是 Windows-first，且預覽服務**預設在同區網可存取**——CVSS 給 low，但這條路徑在本線的實際部署形態下比評分更值得修。 | **已修（維護者 2026-09-04 核可的 D-02 安全性例外）**：lockfile 內 esbuild 0.28.0 → **0.28.2**。`package.json` 的 `^0.28.0` 未動（新版本本來就在範圍內），語意 diff 確認只有 27 個 esbuild 條目變動。已用完整生成流程實測，見「本輪實證」。`tests/test_docs.py::test_security_exception_floor_still_holds` 釘住 `>= 0.28.1`，上游同步若把 lockfile 蓋回去會讓 CI 紅。 |

## 上游持有、本線不修

| ID | 嚴重度 | Finding | 處理 |
|---|---|---|---|
| R-08 | P1 | **`image-size` 兩筆 high 無法修**（GHSA-w3rx-r6r6-pgpr、GHSA-5p2g-fcmc-qvqq：ICNS / JXL / HEIF 解析器可被畸形圖片打進無窮迴圈）。屬 **runtime** 範圍，由 `pptxgenjs@4.0.1` 帶進來（`image-size: ^1.2.1`），匯出 PPTX 時用來量圖片尺寸——輸入正是使用者自己放進 deck 的圖。 | **無可升級版本。** 兩份 advisory 的 `first_patched_version` 都是空的，影響範圍 `<= 2.0.2`，而 npm 上最新就是 2.0.2；`pptxgenjs` 最新版（4.0.1，即本線用的版本）仍相依 `image-size ^1.2.1`。`npm audit fix --force` 提出的「修法」是把 pptxgenjs 降到 **1.1.5**，那會直接毀掉匯出引擎——**拒絕**。實際曝險：本機 DoS（匯出時卡住），觸發條件是使用者把畸形 ICNS/JXL/HEIF 放進自己的 deck，沒有遠端攻擊面。已寫進 [`SECURITY.md`](SECURITY.md) 讓使用者知道；上游或 image-size 出修正版即採用。 |
| R-06 | P2 | **`render:themes` script 不存在，但預覽流程會呼叫它。** `skills/dashi-ppt/project/scripts/preview-freshness.mjs:48` 在主題預覽過期時執行 `npm run render:themes`，而 `skills/dashi-ppt/project/package.json` 的 `scripts` 沒有這個項目——主題預覽一旦過期，預覽流程必然中斷。對應上游 issue #29。 | **不在本 fork 修**：正確修法（補 script 還是改呼叫端）由上游決定，本線先修會在下次同步對撞。已記在 [`docs/DECISIONS.md`](docs/DECISIONS.md) D-08，並登記在上游 issue 水位內。 |

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
| 把 lockfile 的 esbuild 版本改回 `0.28.0`（模擬上游同步蓋回舊 lockfile） | `test_security_exception_floor_still_holds` | FAILED ✅ |

兩項都已還原，還原後 gate 重跑仍為 `WINDOWS DEV CHECK GREEN`。

### 產品層端到端驗證（esbuild 安全性例外，2026-09-04）

esbuild 是 `src/renderDeck.jsx` 與 `src/components/themes/runtime-build.mjs` 用 `buildSync`
打包主題執行時的工具，**在真正的渲染路徑上**，所以驗證不能只看版本號。升級前後各跑一次完整流程：

```text
node scripts/goal-scaffold.mjs --theme theme01 --pages 3 --seed verify1 --layout-variants 1
node scripts/validate-goal-spec.mjs <goal>        → Goal spec validation passed.
npm run render:goal  -- <goal> <ppt>/index.html   → Rendered 3 slide(s)
npm run export:pptx  -- <ppt> <out>.pptx          → 3 slide(s), 48 editable text object(s)
```

| 項目 | 升級前（esbuild 0.28.0） | 升級後（esbuild 0.28.2） |
|---|---|---|
| `npm ci` | exit 0 | exit 0（node_modules 全刪後重裝） |
| `esbuild.buildSync` 冒煙 | ok, 49 bytes | ok, 49 bytes |
| 渲染 | 3 slides, `index.html` 498,463 bytes | 3 slides, **498,463 bytes** |
| `index.html` sha256 | `38f6e63db2f57b55…` | **`38f6e63db2f57b55…`（相同）** |
| 匯出 PPTX | 2,335,058 bytes, 48 可編輯文字物件, 15 warnings | **2,335,058 bytes, 48, 15（相同）** |
| `npm audit` | esbuild + image-size | **只剩 image-size**（見 R-08） |

產物逐位元相同，所以這次升級是行為中性的，不是「跑得起來就算過」。

lockfile 的語意 diff：27 個 esbuild 條目（本體 + 26 個平台二進位）版本變動，**沒有**新增或移除
其他套件；唯一的額外差異是 npm 順手清掉了 `node_modules/typescript` 這個**沒有任何套件宣告、
本來就 extraneous 的孤兒條目**——手動塞回去每次 `npm install` 都會被再清一次，那種 lockfile
npm 自己不同意，比留著更糟，所以接受。

### GitHub Actions

`4660c56` 為止：CI、CodeQL、Upstream check、Dependency freshness 全部 success
（首推 `47d1daf` 的 Upstream check 是紅的，那是水位還沒推進的預期狀態，`422f889` 起轉綠）。
本次安全性提交的 run 在推上去之後確認。

## 已檢查、不列為 finding

- 產品現況：1 個 `skills/dashi-ppt/` 目錄，frontmatter 驗證通過；163 個追蹤的 `.js`/`.mjs`/`.cjs` 全數通過 `node --check`。
- Fork overlay Python（`tools/check_*.py`、`tools/validate_skills.py`）無 `os.system`、`shell=True`、`eval(`、`exec(`、`pickle`；`check_upstream_updates.py` 以 argv 列表呼叫 `git` 與 `gh`。
- 倉庫沒有提交 `.env`。生成物（`output/`、`uploads/`、`node_modules/`）已在 `.gitignore`。
- CI / CodeQL 的 actions 已 pin commit SHA，且 `persist-credentials: false`。
- `.gitattributes` 釘 `* text=auto eol=lf`；`git ls-files -s` 無 `120000` blob。
- 上游 repo 沒有自己的 workflow（只有 ISSUE_TEMPLATE），所以本線沒有需要加 repo 閘門的上游 workflow。

## 尚未宣稱範圍

- 產品流程只跑過**單主題、3 頁、`--layout-variants 1`** 這一條：沒有跑滿 12 套主題、沒有多變體（v2/v4）路徑、沒有匯出 PDF、沒有起預覽伺服器、沒有圖片／影片槽與 `media:stage`。
- **沒有**在 Claude Code / Codex / Cursor 實際安裝並觸發這個 skill。
- **沒有**實測 image-size 的兩個 DoS 是否真能被觸發（R-08 的曝險敘述是依相依關係與 advisory 推得，不是實驗結果）。
- **沒有**逐筆審查上游自 fork point 之後的 commit / PR / issue——水位刻意留在 0，等第一次 `upstream-check` 排程結果再處理。
- **沒有**對上游開任何 PR、push 或 release。
- `dev_check.ps1` **不含** Bandit；CodeQL 是獨立 workflow。
- **不宣稱**本 fork 有自己的 GitHub Release；產品版本仍跟隨上游（目前 `0.4.11`）。
