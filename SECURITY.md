# 安全政策

## 支援範圍

安全修正以本 fork 的最新 `main` 為主；上游版本的問題也會視需要回報原作者
[`chuspeeism/dashi-ppt-skill`](https://github.com/chuspeeism/dashi-ppt-skill)。

## 私下回報

請使用 GitHub Security Advisories 的 **Report a vulnerability** 私下回報。若該入口不可用，
請透過 GitHub 個人檔案聯絡維護者，不要先建立公開 Issue。

回報請包含影響範圍、重現步驟、受影響版本與最小必要證據。請勿附上真實 API key、cookie
或客戶簡報全文。

## 特別注意

- 本 skill 的生成、編輯與匯出都在本機完成，內容不上傳。會連網的只有 npm 安裝依賴與靜默版本檢查。
- **本地預覽服務預設在同一區域網路內可瀏覽**（匯出介面只綁本機）。在不受信任的網路上使用時請自行評估，或改用只綁 `127.0.0.1` 的方式啟動。
- 匯出 PPTX / PDF 會啟動本機 Chrome / Chromium / Edge。`CHROME_PATH` 指向的執行檔會被直接執行——不要把它設成來路不明的路徑。
- 產品 `skills/dashi-ppt/project/` 會在首次使用時 `npm install`。發現供應鏈問題時，優先回報上游；本線只在 Windows 可重現的問題才加最小修正。
- 不要提交 `.env`、憑證或客戶資料。
