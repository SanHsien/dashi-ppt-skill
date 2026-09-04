# 決策紀錄

記錄「為什麼選 A 不選 B」，避免日後重複討論。新的在上面。
上游逐筆採用／略過的理由也寫在這裡；水位推進見 [`UPSTREAM.md`](UPSTREAM.md)。

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
