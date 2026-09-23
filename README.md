# 豬病檢驗藥敏報告

部署於 GitHub Pages，瀏覽器使用 Google Identity Services 及 Google Sheets API 直接讀取「115下半年度豬病表單」。不使用 Apps Script、不需要 Excel 匯入。

## 使用
1. 點選「連線 Google 試算表」，使用具有來源表單存取權的 Google 帳號授予唯讀權限。
2. 輸入完整免疫室編號。每次查詢都讀取三份工作表最新資料。
3. 產生報告前匯入本機保管的範本與印章 JSON，選擇菌株、核對結果與輪值獸醫師。

OAuth access token 僅保存在當次頁面記憶體，不写入 localStorage、網址或儲存庫。病例與印章不內建於公開程式碼。中斷連線會清除查詢結果，連線過期需重新授權。

## 一次性 Google 設定
在 Google Cloud 專案啟用 Google Sheets API，建立 Web application OAuth client。Authorized JavaScript origin 設為 `https://finder4361.github.io`，Client ID 填入 `google-config.js`。前端不得放 Client Secret 或服務帳戶私鑰。
OAuth scope 僅請求 `https://www.googleapis.com/auth/spreadsheets.readonly`。測試模式需將使用者加入 OAuth test users。

## 部署
GitHub Settings → Pages → Deploy from a branch → main → /(root)。無須編譯。

報告使用細菌分離紀錄 N 欄輪值獸醫師，可依姓名改選印章。缺章標示待補章，Cefquinome 不列入報告。Word 使用匯入原始範本；PDF 為瀏覽器列印版。
JSZip 保留檔頭授權。
