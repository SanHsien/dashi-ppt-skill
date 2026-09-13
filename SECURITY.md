# 安全政策

## 支援範圍

安全修正以本 fork 的最新 `main` 為主；上游版本的問題也會視需要回報原作者
[`chuspeeism/dashi-ppt-skill`](https://github.com/chuspeeism/dashi-ppt-skill)。

## 私下回報

請使用 GitHub Security Advisories 的 **Report a vulnerability** 私下回報。若該入口不可用，
請透過 GitHub 個人檔案聯絡維護者，不要先建立公開 Issue。

回報請包含影響範圍、重現步驟、受影響版本與最小必要證據。請勿附上真實 API key、cookie
或客戶簡報全文。

## 已知且目前無法修的問題

**`image-size` 的兩個 DoS（GHSA-w3rx-r6r6-pgpr、GHSA-5p2g-fcmc-qvqq，high）**：畸形的
ICNS / JXL / HEIF 圖片會讓解析器進入無窮迴圈。它由 `pptxgenjs` 帶進來，在**匯出 PPTX 量圖片尺寸**時
用到，輸入是你自己放進 deck 的圖片。

- **目前沒有修正版本**：advisory 影響範圍是 `<= 2.0.2`，而 npm 上最新就是 2.0.2；`pptxgenjs` 最新版仍相依它。
- **實際影響**：本機 DoS——匯出時卡住，沒有遠端攻擊面，不涉及資料外洩。
- **能做的事**：來源不明的圖片先轉存成 PNG/JPEG 再放進 deck；匯出卡住就中斷程序。
- 上游或 `image-size` 出修正版後本 fork 會採用。追蹤紀錄見 [`REVIEW.md`](REVIEW.md) R-08。

## 特別注意

- 本 skill 的生成、編輯與匯出都在本機完成，內容不上傳。會連網的只有 npm 安裝依賴與靜默版本檢查。
- **本地預覽服務預設在同一區域網路內可瀏覽**（匯出介面只綁本機）。在不受信任的網路上使用時請自行評估，或改用只綁 `127.0.0.1` 的方式啟動。
- 匯出 PPTX / PDF 會啟動本機 Chrome / Chromium / Edge。`CHROME_PATH` 指向的執行檔會被直接執行——不要把它設成來路不明的路徑。
- 產品 `skills/dashi-ppt/project/` 會在首次使用時 `npm install`。發現供應鏈問題時，優先回報上游；本線只在 Windows 可重現的問題才加最小修正。
- 不要提交 `.env`、憑證或客戶資料。
