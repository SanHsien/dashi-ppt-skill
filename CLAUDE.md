# CLAUDE.md

請先完整閱讀並遵守 [`AGENTS.md`](AGENTS.md)。本檔只補充 Claude Code 的最小入口：

- 這是保留上游歷史的 **AGPL-3.0** fork；不要移除 `upstream`、原作者或授權標示，也不要把 AGPL 檔案重新授權。
- `skills/dashi-ppt/` 是產品規格與執行時，不要改寫成本 fork 的維護索引。
- `skills/dashi-ppt/project/packages/html-deck-to-pptx/` 是**專有元件**，不得單獨提取、複製或再散布。
- `npm-dist/`、`.claude-plugin/` 以上游為準，除非 [`FORK.md`](FORK.md) 已記錄 fork 修正。
- 修改維護工具或測試前，先跑對應 pytest；提交前跑
  `pwsh -NoProfile -File tools\dev_check.ps1`。
- API key、cookie、客戶簡報內容一律不可提交。
- 使用繁體中文，直接交付可驗證結果，避免冗長背景鋪陳。
