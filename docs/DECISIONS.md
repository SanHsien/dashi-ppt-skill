# 決策紀錄

記錄「為什麼選 A 不選 B」，避免日後重複討論。新的在上面。
上游逐筆採用／略過的理由也寫在這裡；水位推進見 [`UPSTREAM.md`](UPSTREAM.md)。

---

## 2026-09-04 — 首輪上游四面向審查

Fork point 就是上游 `main` 的 head，所以 **commit 軸 0 筆**。PR 與 issue 軸從 0 起算，
本輪一次триaged 完：**PR #2–#36（7 筆）、issue #1–#43（35 筆）**，水位推進到 PR 36 / issue 43。

### D-10 三個安全性警示：登記，但要不要為此分叉產品樹留給維護者決定

啟用安全性更新後當天就出現三筆（細節見 [`../REVIEW.md`](../REVIEW.md) R-07）：
`image-size` 兩筆 high（runtime，畸形圖片 → 無窮迴圈，而本 skill 的核心操作就是上傳圖片）、
`esbuild` 一筆 low（development，**Windows** 開發伺服器任意檔案讀取，而本 fork 是 Windows-first
且預覽服務預設同區網可存取）。

**沒有自行合併。** 三筆都在上游持有的 `package-lock.json` 上，改了就與 D-02 衝突，而且本線
從未 `npm install` 過這棵樹——把一個沒跑過的 lockfile 變更合進來，等於用「應該可以」當驗證。
Dependabot PR #1 **刻意留著 open 當追蹤器**。

D-04 的設計目的是「看得到漏洞」，不是「自動分叉」；看到之後要不要動產品樹，是政策層的決定，
不是例行維護。**觸發條件**：維護者決定為安全性修補開例外，或上游自己發版帶進修正。

### D-07 兩支 Windows 相關的上游 PR：記錄但不採用

| PR | 狀態 | 內容 | 本輪判斷 |
|---|---|---|---|
| #34 | **open** | 修 Windows 路徑大小寫比對相容性、增強預覽伺服器 API | **不採用（本輪）**。本 fork 的 D-02 是「產品樹不動」；把一個上游尚未合併的 PR 拉進來，等於本線先分叉，之後上游若改用別的做法就要自己解衝突。**觸發條件**：本線實際在 Windows 跑生成／預覽並重現路徑大小寫問題時，改為 cherry-pick 並記在這裡。 |
| #28 | closed（未合併） | 為 Windows 加原生 PowerShell render 入口 | **不採用**。上游關掉了，而 `skills/dashi-ppt/scripts/render_goal_deck.ps1` 已存在——目前的 Windows 入口是有的。**觸發條件**：該 ps1 在本機實測不可用時再回頭看這支 PR 的做法。 |

其餘 5 支（#2、#3、#4、#20、#36）是主題修正、SKILL.md 瘦身與安裝器去重，都屬產品方向，交上游。

### D-08 issue #29 是本線也吃得到的實錯，但不在這裡修

上游 issue #29「運行預覽報錯 `Missing script: "render:themes"`」在本 fork 的 0.4.11 樹裡可以直接查證：

- `skills/dashi-ppt/project/scripts/preview-freshness.mjs:48` 會 `npm run render:themes`
- `skills/dashi-ppt/project/package.json` 的 `scripts` 沒有 `render:themes`

也就是主題預覽過期時，預覽流程必然中斷。**不在本 fork 修**：這是產品缺陷，正確的修法（補 script 還是改呼叫端）由上游決定，本線先修會在下一次同步時對撞。已記在 [`../REVIEW.md`](../REVIEW.md) R-06。

### D-09 其餘 issue 的處理

- **本線要盯的**：#38（0.4.11 翻頁回退顯示內建示範稿的疑似回歸——本 fork 正是 0.4.11）、#41（theme05 陣列型版式資料錯亂）、#22 / #23 / #7（匯出字體與失敗）、#39（安全性提問，與本線 `SECURITY.md` 的宣稱有關）。這些都**沒有**在本輪驗證過，只是登記；本線尚未實際跑過生成流程。
- **產品方向、與維護線無關**：#1、#5、#10–#14、#16、#19、#25、#32、#33、#37、#40、#43 等功能請求與觀感評論。
- **雜訊**：#26、#30、#31。

判準是證據不是分類：上面每一條「不處理」的理由都寫了觸發條件或可查證的位置，沒有用「產品方向」四個字當結論。

---

## 2026-09-04 — Fork overlay 建立

### D-01 上游簡中 README 保留原檔，不就地翻譯

上游 `README.md` 是簡體中文，本線慣例是繁中主檔 + 英文鏡像。

**做法**：`git mv README.md README.zh-CN.md`，新寫繁中 `README.md`，`README.en.md` 維持上游英文並加 fork 說明。

**為什麼不直接把 README.md 改成繁中**：那會讓每一次上游更新 README 都變成整檔衝突，而 README 是上游最常動的檔案之一。保留原檔當鏡像後，上游更新只需要覆蓋 `README.zh-CN.md`，繁中入口再依差異手動同步——衝突面積從整檔縮到「我自己寫的那份」。

### D-02 產品樹完全不動

`skills/`、`npm-dist/`、`.claude-plugin/` 一個字都沒改。

**為什麼**：這個 fork 的價值是「可追蹤的維護線」，不是分支產品。動了產品樹，之後每次上游同步都要先解自己造成的衝突，而本線並沒有要接手開發 12 套主題與匯出引擎。

### D-03 授權處理：AGPL-3.0，且匯出引擎是專有元件

上游是 AGPL-3.0（不是本線多數 repo 的 MIT），且 `skills/dashi-ppt/project/packages/html-deck-to-pptx` 附有專有授權，禁止單獨提取或再散布。

**做法**：`NOTICE.md` 明寫兩件事——本 fork 的修改同樣以 AGPL-3.0 釋出，以及專有子套件的邊界；`tests/test_docs.py::test_proprietary_export_engine_keeps_its_own_license` 鎖住該 LICENSE 檔存在且 NOTICE 有提到它。

**為什麼要用測試鎖**：授權邊界是「刪掉也不會有人立刻發現」的那類東西，而刪掉的後果是散布時的法律風險。

### D-04 npm Dependabot 開著，但關掉例行版本更新

`skills/dashi-ppt/project/package-lock.json` 是上游產品狀態。

**做法**：`.github/dependabot.yml` 保留 npm ecosystem，但 `open-pull-requests-limit: 0`。

**效果**：例行的版本升級 PR 不會開（那些應該由上游決定），但 GitHub 的**安全性更新**仍會開 PR。取捨是「不搶上游的方向盤」對上「有漏洞時不用等上游發版才知道」，兩邊都要。

### D-05 `node --check` 掃全部追蹤的 JS，而不是挑目錄

**做法**：gate 與 CI 都用 `git ls-files '*.js' '*.mjs' '*.cjs'`。

**為什麼**：目錄 glob 會在上游新增目錄時靜靜漏掉；`git ls-files` 天然排除 `node_modules/` 與 `output/`（已 gitignore），涵蓋範圍等於「這個 repo 實際散布的東西」。落地前已實測 163 個檔案全數通過，所以這個閘門是綠的、不是裝飾。

### D-06 `pyproject.toml` 只放工具設定

沒有 `[project]` 與 `[build-system]`。

**為什麼**：本 repo 交付的是 Agent Skill 與 Node 生成器，不是 Python 套件。加了那兩個表會讓 `pip install .` 看起來可行，實際裝出一個沒有內容的套件。
