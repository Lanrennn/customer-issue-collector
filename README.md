# 客戶問題收集 Web App

單頁版問題收集工具，支援文字與圖片，並依問題類型產生長條圖統計。

## 使用方式（單機）
- 直接雙擊 `index.html` 於瀏覽器開啟即可使用。
- 在「新增事件」貼上文字或上傳圖片，選擇分類（或留自動判別 / 自訂），按下「建立事件」。
- 右上「匯出 Excel」可匯出問題列表與分類統計工作表，「匯出 JSON」可下載原始資料；「清空」會移除暫存資料。

## 功能
- 文字或圖片轉成事件並列於列表。
- 內建常見分類及簡單關鍵字自動判別，可自訂分類覆寫。
- 事件列表支援滾動，並提供分類標籤（全部 / 各類型）快速篩選。
- Chart.js 長條圖即時顯示分類分布，並依數量由多到少排序。
- 一鍵匯出 Excel，工作表一：問題列表（逐條事件）、工作表二：分類統計（可在 Excel 內插入圖表）。

## 多人共用（需 Node.js）

### 方式一：區域網路共用
若要讓 team 共同使用同一份資料：
- 安裝 Node.js（18+）後，在此資料夾執行：
  - `npm install`
  - `npm start`
- 伺服器預設在 `http://localhost:3000`：
  - 本機：瀏覽 `http://localhost:3000/index.html`
  - 同網段其他電腦：改用你的電腦 IP，例如 `http://你的IP:3000/index.html`
- 前端會透過 `/api/issues` 自動讀寫 `issues.json`，所有人將共用同一份事件資料。

### 方式二：部署到公網（推薦）
讓 team 成員透過公網連結直接使用，無需在同一個區域網路。

#### 使用 Render 部署（免費方案）

**步驟 1：準備 GitHub 倉庫**
1. 在 GitHub 建立新倉庫（例如：`customer-issue-collector`）
2. 將此專案的所有檔案推送到 GitHub：
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/你的帳號/customer-issue-collector.git
   git push -u origin main
   ```

**步驟 2：在 Render 建立服務**
1. 前往 [Render.com](https://render.com) 註冊/登入（可用 GitHub 帳號）
2. 點選「New +」→「Web Service」
3. 選擇「Connect GitHub」並授權，然後選擇你的倉庫
4. 設定：
   - **Name**: `customer-issue-collector`（或自訂）
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: 選擇 **Free**（免費方案）
5. 點選「Create Web Service」

**步驟 3：取得公網連結**
- Render 部署完成後（約 2-3 分鐘），會給你一個網址，例如：
  - `https://customer-issue-collector.onrender.com`
- 你的 team 成員只要打開：`https://你的服務名稱.onrender.com/index.html`
- 所有人會共用同一份 `issues.json` 資料

**注意事項：**
- Render 免費方案在無活動 15 分鐘後會休眠，首次訪問需等待約 30 秒喚醒
- 如需 24/7 運行，可升級到付費方案（約 $7/月）
- 資料會保存在 Render 的檔案系統中，建議定期匯出備份

#### 其他部署選項
- **Railway**: [railway.app](https://railway.app) - 類似 Render，免費方案有 $5 額度
- **Fly.io**: [fly.io](https://fly.io) - 免費方案，適合小型專案
- **Vercel / Netlify**: 主要支援靜態網站，需搭配外部資料庫（如 Supabase）

## 待辦 / 限制
- 圖片僅以 data URL 暫存於 `issues.json` / 記憶體，量大時會佔用空間。
- 自動分類為簡易關鍵字比對，若需更準確可串接模型或規則庫或雲端服務。

