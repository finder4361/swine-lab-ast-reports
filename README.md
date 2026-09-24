# 豬病檢驗藥敏報告

部署於 GitHub Pages，瀏覽器使用 Google Identity Services 及 Google Sheets API 直接讀取「115下半年度豬病表單」。不使用 Apps Script、不需要 Excel 匯入。

## 使用
1. 點選「連線 Google 試算表」，使用具有來源表單存取權的 Google 帳號授予唯讀權限。
2. 輸入完整免疫室編號。每次查詢都讀取三份檢驗紀錄與「縮寫對照表及分生判讀標準」最新資料。
3. 產生報告前匯入本機保管的範本與印章 JSON，選擇菌株、核對結果與輪值獸醫師。分離部位有精確縮寫對應時自動轉成中文；未對應時保留原值並提示人工確認。

OAuth access token 僅保存在當次頁面記憶體，不写入 localStorage、網址或儲存庫。病例與印章不內建於公開程式碼。中斷連線會清除查詢結果，連線過期需重新授權。

## 一次性 Google 設定
在 Google Cloud 專案啟用 Google Sheets API，建立 Web application OAuth client。Authorized JavaScript origin 設為 `https://finder4361.github.io`，Client ID 填入 `google-config.js`。前端不得放 Client Secret 或服務帳戶私鑰。
OAuth scope 僅請求 `https://www.googleapis.com/auth/spreadsheets.readonly`。測試模式需將使用者加入 OAuth test users。

## 部署
GitHub Settings → Pages → Deploy from a branch → main → /(root)。無須編譯。

報告「收件人」取自藥敏紀錄表 J 欄，「檢驗人員」印章取自細菌分離紀錄 N 欄輪值獸醫師，可依姓名改選；右欄為林章豪副教授印章。缺章標示待補章，Cefquinome 不列入報告。Word 使用匯入原始範本；PDF 列印版參照提供的細菌藥敏報告，呈現基本資料、必要時的毒力基因、藥物判讀、雙簽章與說明。
Word 下載檔名及 PDF 列印標題共用命名格式：`送檢日期YYYY.MM.DD 送檢單位(畜主) 免疫室編號 菌名 藥物敏感性試驗`。送檢日期取自藥敏紀錄，不使用報告完成日期；來源日期格式無法辨識時停止產生檔案。
JSZip 保留檔頭授權。
