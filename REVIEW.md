# Repository review（Windows-first）

- Review date: 2026-09-04（2026-10-25 更新狀態）
- Fork point: 上游 `7cb23347f91cda1a5519eafc8c040704e389535a`（`Publish skill v0.4.11`，2026-07-30）
- Upstream watermarks（以 `tools/upstream_baseline.json` 為準）: commit `21dc7e5`（v0.4.14，已審查、整包未合併，見 D-13）；`reviewed_pr_through` = **36**、`reviewed_issue_through` = **44**（2026-10-17 審查，D-14）
- Primary environment: Windows 11、PowerShell、Python 3.14（本機）、CI Ubuntu 3.9–3.14 + Windows 3.14、Node.js 26（本機）／22（CI）
- Status: 維護骨架可用；產品樹原則上不動（D-02），**例外**：維護者核可的安全性修補（R-07 esbuild、R-08 image-size、D-12 CodeQL 四組）與 D-14 採納的上游 PR #34／幾何檢測（v0.5.0）

## 結論

這個 fork 適合作為 Windows 本機安裝、並追蹤上游 Dashi PPT skill 的維護線。產品是一個 Agent Skill 加一套本機 Node 生成器（12 套主題、1,020 個版式、瀏覽器內編輯、PPTX / PDF 匯出）；本線**沒有**接手產品開發。

本輪建立 overlay 時列出的 R-01～R-05：R-01～R-03 已處理，R-04、R-05 是刻意不修。倉庫於 2026-09-27 以乾淨歷史重建，R-01～R-03、R-07 的原始修復 commit 已併入 `69df841`（release: initialize clean repository v1.0.0）；之後的修復另列 commit。

## 已處理 findings

| ID | 嚴重度 | Finding | 處理 |
|---|---|---|---|
| R-01 | P2 | 上游是 **AGPL-3.0**，且 `skills/dashi-ppt/project/packages/html-deck-to-pptx` 附獨立的**專有授權**（禁止單獨提取、複製、再散布）。本線多數 repo 是 MIT fork，照舊習慣寫 NOTICE 會把授權寫錯，而寫錯的後果是散布時的法律風險。 | `NOTICE.md` / `FORK.md` / `README.md` 三處明寫 AGPL-3.0 與網路服務條款，並單獨一節說明專有子套件邊界。`tests/test_docs.py::test_proprietary_export_engine_keeps_its_own_license` 鎖住該 LICENSE 存在且 NOTICE 有提到它。 |
| R-02 | P2 | 上游 `README.md` 是簡體中文，本線慣例是繁中主檔。就地翻譯會讓上游每次更新 README 都變成整檔衝突。 | `git mv README.md README.zh-CN.md` 保留原檔，新寫繁中 `README.md`，`README.en.md` 加 fork 說明；三者互相連結。`test_public_readmes_are_a_three_way_set` 鎖住。理由見 [`docs/DECISIONS.md`](docs/DECISIONS.md) D-01。 |
| R-03 | P3 | 上游 `.github/ISSUE_TEMPLATE/config.yml` 只有 `blank_issues_enabled: true`，訪客會把產品缺陷開到這個 fork。 | 加 contact links：本 fork 的 `CONTRIBUTING.md`、上游 issues、安全性通報入口。`test_issue_contact_links_point_at_this_fork` 鎖住。**更正（2026-09-11）**：本 repo 的 Issues 功能是關閉的（fork 繼承的預設，維護者其他 fork 亦同），所以這些 contact links 目前不會顯示給訪客；保留是為了 Issues 若開啟時導流正確，實際效果不應宣稱為「已擋住誤開」。 |

| R-07 | P1 | **esbuild GHSA-g7r4-m6w7-qqqr**（low，development 範圍）：`>= 0.27.3, < 0.28.1` 的開發伺服器在 **Windows 上**可被讀取任意檔案。本 fork 正是 Windows-first，且預覽服務**預設在同區網可存取**——CVSS 給 low，但這條路徑在本線的實際部署形態下比評分更值得修。 | **已修（維護者 2026-09-04 核可的 D-02 安全性例外）**：lockfile 內 esbuild 0.28.0 → **0.28.2**。`package.json` 的 `^0.28.0` 未動（新版本本來就在範圍內），語意 diff 確認只有 27 個 esbuild 條目變動。已用完整生成流程實測，見「本輪實證」。`tests/test_docs.py::test_security_exception_floor_still_holds` 釘住 `>= 0.28.1`，上游同步若把 lockfile 蓋回去會讓 CI 紅。 |
| R-08 | P1 | **`image-size` 兩筆 high**（GHSA-w3rx-r6r6-pgpr、GHSA-5p2g-fcmc-qvqq：ICNS / JXL / HEIF 解析器可被畸形圖片打進無窮迴圈）。屬 **runtime** 範圍，由 `pptxgenjs@4.0.1`（`image-size: ^1.2.1`）帶進來，匯出 PPTX 時用來量圖片尺寸。 | **已修（2026-09-26，PR #3，merge `04bab4f`；進入乾淨歷史後為 `69df841`）**：`package.json` 加 `overrides: {"image-size": "^2.0.3"}`，lockfile 解析為 2.0.4（修補版）。原先寫「無可升級版本」是 2026-09-04 的狀態，之後 image-size 出了修補版。Dependabot alert #4、#5 皆 `fixed`，目前 open alerts = 0。2026-10-25 補註：SECURITY.md 與 D-11 的「無法修」敘述同步更正。 |

## 上游持有、本線不修

| ID | 嚴重度 | Finding | 處理 |
|---|---|---|---|
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
| `npm audit` | esbuild + image-size | **只剩 image-size**（見 R-08；其後 2026-09-26 已修） |

產物逐位元相同，所以這次升級是行為中性的，不是「跑得起來就算過」。

lockfile 的語意 diff：27 個 esbuild 條目（本體 + 26 個平台二進位）版本變動，**沒有**新增或移除
其他套件；唯一的額外差異是 npm 順手清掉了 `node_modules/typescript` 這個**沒有任何套件宣告、
本來就 extraneous 的孤兒條目**——手動塞回去每次 `npm install` 都會被再清一次，那種 lockfile
npm 自己不同意，比留著更糟，所以接受。

### GitHub Actions

`4660c56` 為止：CI、CodeQL、Upstream check、Dependency freshness 全部 success
（首推 `47d1daf` 的 Upstream check 是紅的，那是水位還沒推進的預期狀態，`422f889` 起轉綠）。
安全性提交 `452fb97`：CI、CodeQL success；GitHub 上 esbuild 的 Dependabot alert（GHSA-g7r4-m6w7-qqqr）
隨之自動轉為 `fixed`，只剩 R-08 的兩筆 `image-size`（其後 2026-09-26 已由 PR #3 修掉）。其後的 `e0f2b10`（依賴新鮮度加查 Actions）與
`73decff`（Actions 查詢帶 token）CI、CodeQL、Dependency freshness 皆 success。

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
- **沒有**實測 image-size 的兩個 DoS 是否真能被觸發（R-08 已改用修補版，此項不再適用）。
- 上游審查已逐筆進行並記錄（D-07～D-09、D-13、D-14）；水位見檔頭。v0.4.12–v0.4.14 整包刻意未合併（D-13）。
- **沒有**對上游開任何 PR、push 或 release。
- `dev_check.ps1` **不含** Bandit；CodeQL 是獨立 workflow。
- 本 fork 自 2026-10-17 起有自己的 GitHub Release（`v0.5.0`，D-14）；上游最新為 `0.4.14`。
