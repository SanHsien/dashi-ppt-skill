# 貢獻指南

## 開始前

1. 先讀 [`AGENTS.md`](AGENTS.md)、[`FORK.md`](FORK.md) 與 [`README.md`](README.md)。
2. 確認問題在最新 `main` 仍可重現，並查過既有 Issues。
3. 產品 skill、主題、版式或生成器的實質變更，優先考慮回報 [`chuspeeism/dashi-ppt-skill`](https://github.com/chuspeeism/dashi-ppt-skill)。
4. 不要附上 API key、cookie、客戶簡報內容或任何憑證。
5. 動 skill 結構前先讀 [`docs/SKILL-SPEC.md`](docs/SKILL-SPEC.md)。

## 本機開發

```powershell
python -m venv .venv
.venv\Scripts\python -m pip install --upgrade pip
.venv\Scripts\python -m pip install -r requirements-dev.txt
pwsh -NoProfile -File tools\dev_check.ps1
```

需要 Node.js 20+ 在 PATH 上。匯出 PPTX / PDF 另需 Chrome / Chromium / Edge。

## 提交方式

本 fork 由維護者直接推 `main`，不開短期分支。改完先跑上面的 Windows gate。

- 一次提交聚焦一個問題。
- Bug 修正先附失敗測試；新行為需涵蓋成功、邊界與錯誤路徑。
- 修改使用方式時同步更新 `README.md` 與 `README.en.md`。本 fork 不把作者宣傳或贊助 CTA 寫進公開入口。
- 說明是否來自 upstream、是否改動 `skills/`／`npm-dist/`／`.claude-plugin/`，以及實際跑過哪些指令。
- 提交訊息建議使用 `fix:`、`feat:`、`docs:`、`test:`、`chore:`。
- Dependabot 與外部 fork 仍可能開 Pull Request；合併前讀 diff，不要自動合併。
- 對上游開 PR 需要維護者在當次對話明確同意回貢。

## 授權

送出貢獻即表示同意以 **AGPL-3.0** 釋出。不要提交無法以 AGPL-3.0 釋出的程式碼，也不要修改專有子套件 `skills/dashi-ppt/project/packages/html-deck-to-pptx`。
