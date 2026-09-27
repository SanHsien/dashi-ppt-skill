# 產品 Skill 契約（本 fork 維護摘要）

這份是**摘要**，不是規格的來源。規格本體是 [`skills/dashi-ppt/SKILL.md`](../skills/dashi-ppt/SKILL.md) 與宿主 Agent 的 Agent Skills 規範；本檔只記錄本 fork 在同步時必須守住的相容性契約。

## 目錄結構

```
skills/dashi-ppt/
├── SKILL.md          ← 產品入口，宿主 Agent 直接讀
├── README.md
├── agents/           ← 子代理提示
├── assets/           ← 主題預覽等靜態資源
├── references/       ← 版式與主題參考文件
├── scripts/          ← check_latest_version.mjs、render_goal_deck.{ps1,sh}
└── project/          ← Node 生成器（type: module、private）
    ├── package.json  ← script 名稱是對外契約
    ├── src/ dist/ i18n/ assets/ scripts/
    └── packages/html-deck-to-pptx/   ← 專有匯出引擎，禁止單獨提取
```

## Frontmatter 契約

```yaml
---
name: dashi-ppt            # 必須等於目錄名；小寫英數與連字號，1–64 字
description: ...           # 1–1024 字，寫清楚「什麼時候該用」
---
```

- `version` **不可**放在 top-level，要放就放在 `metadata:` 底下。上游每次發版都會動版本號，放錯位置會讓宿主解析失敗。
- 描述維持上游語言（簡體中文）。**不要**為了統一文件語言把它翻成繁體——那會改到產品行為（觸發詞）。

`tools/validate_skills.py` 會檢查以上各項；`tests/test_docs.py` 會確認 `skills/` 底下只有 `dashi-ppt` 一個目錄，多出來的目錄要先確認是上游新增還是誤放。

## 對外契約（改了會弄壞使用者）

| 契約 | 位置 | 說明 |
|---|---|---|
| `npx dashi-ppt-skill@latest` | `npm-dist/install.mjs` | 公開安裝／更新入口，安裝與更新同一條指令 |
| `export:pptx` / `export:pdf` / `preview:start` | `skills/dashi-ppt/project/package.json` | README 與文件直接引用的 npm script 名稱 |
| `dashi-ppt` 目錄名與 plugin name | `.claude-plugin/marketplace.json` | marketplace 以 `./skills/dashi-ppt` 定位 |
| `CHROME_PATH` | 匯出流程 | 使用者指定瀏覽器執行檔的環境變數 |

`tests/test_docs.py::test_product_generator_entry_points_exist` 與
`test_plugin_manifest_still_points_at_the_product_skill` 鎖住上表前三項。

## 執行環境需求

- Node.js 20+ 與 npm。
- 匯出 PPTX / PDF 需要本機 Chrome / Chromium / Edge。
- 生成、編輯、匯出都在本機完成，內容不上傳。
