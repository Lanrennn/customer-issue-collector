# TM 經銷商問題收集與分類系統

一個專為 TM Robot 經銷商設計的問題收集與分類工具，支援文字與圖片輸入，自動分類判別，並提供視覺化統計分析。

## 功能特色

### 核心功能
- **問題收集**：支援文字描述與圖片上傳（可多選、拖曳上傳）
- **自動分類判別**：基於關鍵字自動判別問題類型
- **分類統計圖表**：使用 Chart.js 即時顯示各分類事件數量分布
- **事件列表管理**：支援分類篩選、圖片預覽與放大查看
- **Excel 匯出**：一鍵匯出問題列表與分類統計（支援圖片插入）

### 預設分類系統
系統內建 8 個預設分類：
- **視覺功能**：視覺系統、相機、辨識相關問題
- **通訊相關**：網路連線、通訊協定相關問題
- **運動與力矩**：馬達、運動控制、位置軌跡相關問題
- **安全與法規**：安全設定、權限、法規合規相關問題
- **邏輯編程與調試難度**：程式設計、TMflow、除錯相關問題
- **安裝、校正與維護**：安裝設定、校正、維護相關問題
- **周邊整合 (I/O & Gripper等)**：周邊設備、I/O、夾爪相關問題
- **系統升級與備份**：系統更新、備份還原相關問題
- **其他**：無法歸類的問題

## 使用方式

### 方式一：單機使用（無需安裝）

最簡單的使用方式，適合個人或單機使用：

1. 直接雙擊 `index.html` 在瀏覽器中開啟
2. 在「新增事件」表單中：
   - 輸入經銷商或客戶名稱（可選）
   - 輸入問題描述或上傳圖片
   - 選擇分類（或選擇「自動判別」）
   - 點擊「建立事件」
3. 資料會自動儲存在瀏覽器的 localStorage 中

**注意**：單機模式下，資料僅存在於當前瀏覽器，清除瀏覽器資料會導致資料遺失。

### 方式二：區域網路共用（需 Node.js）

適合團隊在同一個區域網路內共用資料：

1. **安裝 Node.js**（版本 18 或以上）
   - 下載：https://nodejs.org/

2. **安裝依賴**
   ```bash
   npm install
   ```

3. **啟動伺服器**
   ```bash
   npm start
   ```

4. **訪問系統**
   - 本機：`http://localhost:3000/index.html`
   - 同網段其他電腦：`http://你的IP:3000/index.html`
   - 例如：`http://192.168.1.100:3000/index.html`

5. **資料儲存**
   - 所有事件資料會儲存在 `issues.json` 檔案中
   - 團隊成員會共用同一份資料

### 方式三：部署到公網（推薦）

讓團隊成員透過公網連結直接使用，無需在同一個區域網路。

#### 使用 Render 部署（免費方案）

**步驟 1：準備 GitHub 倉庫**
1. 在 GitHub 建立新倉庫
2. 將專案推送到 GitHub：
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/你的帳號/倉庫名稱.git
   git push -u origin main
   ```

**步驟 2：在 Render 建立服務**
1. 前往 [Render.com](https://render.com) 註冊/登入（可用 GitHub 帳號）
2. 點選「New +」→「Web Service」
3. 選擇「Connect GitHub」並授權，然後選擇你的倉庫
4. 設定：
   - **Name**: 自訂服務名稱
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: 選擇 **Free**（免費方案）
5. 點選「Create Web Service」

**步驟 3：取得公網連結**
- Render 部署完成後（約 2-3 分鐘），會提供一個網址
- 例如：`https://your-service-name.onrender.com`
- 訪問：`https://your-service-name.onrender.com/index.html`

**注意事項**：
- Render 免費方案在無活動 15 分鐘後會休眠，首次訪問需等待約 30 秒喚醒
- 如需 24/7 運行，可升級到付費方案（約 $7/月）
- 資料會保存在 Render 的檔案系統中，建議定期匯出備份

#### 其他部署選項
- **Railway**: [railway.app](https://railway.app) - 免費方案有 $5 額度
- **Fly.io**: [fly.io](https://fly.io) - 免費方案，適合小型專案
- **Vercel / Netlify**: 主要支援靜態網站，需搭配外部資料庫

## 專案結構

```
.
├── index.html          # 主頁面
├── app.js              # 前端主要邏輯
├── style.css           # 樣式表
├── server.js           # Node.js 後端伺服器
├── package.json        # Node.js 依賴配置
├── issues.json         # 事件資料儲存（自動生成）
├── render.yaml         # Render 部署配置
├── tm-logo.png         # TM Robot Logo
├── README.md           # 本文件
├── GIT_UPLOAD_GUIDE.md # Git 上傳指南
├── DEPLOY_STEPS.md     # 部署步驟詳解
└── QUICK_START.md      # 快速開始指南
```

## 技術架構

### 前端
- **HTML5 / CSS3**：響應式設計，支援各種裝置
- **Vanilla JavaScript**：無需框架，輕量高效
- **Chart.js**：圖表視覺化
- **ExcelJS / XLSX**：Excel 匯出功能

### 後端
- **Node.js**：執行環境
- **Express**：Web 伺服器框架
- **CORS**：跨域資源共享支援

### 資料儲存
- **localStorage**：單機模式下的瀏覽器本地儲存
- **JSON 檔案**：多人共用模式下的檔案系統儲存

## 使用說明

### 新增事件
1. 填寫「經銷商或客戶名稱」（可選）
2. 輸入「問題描述」或上傳圖片（可多選）
3. 選擇「預設分類」或選擇「自動判別」
4. 點擊「建立事件」

### 查看與篩選
- 在「事件列表」中查看所有事件
- 使用分類標籤（全部、各分類）快速篩選
- 點擊圖片可放大查看
- 點擊分類標籤可更改事件分類

### 統計分析
- 「分類統計」圖表即時顯示各分類事件數量
- 數量最多的分類會標記星星（⭐）
- 圖表依數量由多到少排序

### 匯出資料
- 點擊「匯出 Excel」按鈕
- 會下載包含兩個工作表的 Excel 檔案：
  - **問題列表**：所有事件的詳細資訊（含圖片）
  - **分類統計**：各分類的數量統計

## 注意事項

### 資料備份
- 定期使用「匯出 Excel」功能備份資料
- 多人共用模式下，`issues.json` 檔案包含所有資料，建議定期備份

### 效能考量
- 圖片以 Base64 編碼儲存，大量圖片會增加檔案大小
- 建議單一事件圖片數量控制在 5 張以內
- 定期清理不需要的事件以維持系統效能

### 瀏覽器相容性
- 建議使用現代瀏覽器（Chrome、Firefox、Edge、Safari 最新版本）
- 需要支援 ES6+ 語法
- 需要支援 localStorage API

## 開發與維護

### 修改預設分類
在 `app.js` 檔案中的 `keywords` 對象中修改：
```javascript
const keywords = {
  "分類名稱": ["關鍵字1", "關鍵字2", ...],
  ...
};
```

### 自訂樣式
修改 `style.css` 檔案中的 CSS 變數：
```css
:root {
  --accent: #2563eb;  /* 主色調 */
  --text: #0f172a;    /* 文字顏色 */
  ...
}
```

## 授權與版權

本專案為 TM Robot 經銷商問題收集系統，版權歸相關單位所有。

## 聯絡與支援

如有問題或建議，請聯繫開發團隊。
