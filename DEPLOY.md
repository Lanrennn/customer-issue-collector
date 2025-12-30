# 部署指南：讓 team 透過公網連結共用系統

本指南將帶你一步步將「客戶問題收集系統」部署到公網，讓所有 team 成員透過瀏覽器連結就能使用。

## 前置需求

- GitHub 帳號（免費註冊：https://github.com）
- Render 帳號（免費註冊：https://render.com，可用 GitHub 登入）

## 步驟一：將專案推送到 GitHub

### 1.1 在 GitHub 建立新倉庫

1. 登入 GitHub，點選右上角「+」→「New repository」
2. 填寫：
   - **Repository name**: `customer-issue-collector`（或自訂名稱）
   - **Description**: `客戶問題收集與分類系統`
   - **Visibility**: 選擇 Public（免費）或 Private（需付費）
   - **不要**勾選「Initialize this repository with a README」
3. 點選「Create repository」

### 1.2 在本機準備 Git

在專案資料夾開啟命令列（PowerShell 或 CMD），執行：

```bash
# 初始化 Git（如果還沒初始化）
git init

# 加入所有檔案
git add .

# 建立第一次提交
git commit -m "Initial commit: 客戶問題收集系統"

# 設定遠端倉庫（請替換成你的 GitHub 帳號和倉庫名稱）
git remote add origin https://github.com/你的GitHub帳號/customer-issue-collector.git

# 推送到 GitHub
git branch -M main
git push -u origin main
```

**如果遇到錯誤**：
- 如果提示需要設定 Git 使用者名稱和 Email：
  ```bash
  git config --global user.name "你的名字"
  git config --global user.email "你的email@example.com"
  ```
- 如果提示需要認證，請參考 GitHub 的文件設定 Personal Access Token

## 步驟二：在 Render 建立 Web Service

### 2.1 登入 Render

1. 前往 https://render.com
2. 點選「Get Started for Free」
3. 選擇「Sign up with GitHub」並授權

### 2.2 建立新服務

1. 登入後，點選「New +」→「Web Service」
2. 選擇「Connect account」連結你的 GitHub 帳號（如果還沒連結）
3. 在「Connect a repository」中，選擇你剛才建立的 `customer-issue-collector` 倉庫
4. 點選「Connect」

### 2.3 設定服務參數

在設定頁面填入：

- **Name**: `customer-issue-collector`（或自訂，會成為網址的一部分）
- **Region**: 選擇離你最近的區域（例如 `Singapore` 或 `Oregon`）
- **Branch**: `main`（或你的預設分支名稱）
- **Root Directory**: 留空（如果所有檔案都在根目錄）
- **Environment**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Plan**: 選擇 **Free**

### 2.4 建立服務

1. 確認設定無誤後，點選「Create Web Service」
2. Render 會開始建置和部署，約需 2-3 分鐘
3. 部署完成後，你會看到「Live」狀態和一個網址，例如：
   ```
   https://customer-issue-collector.onrender.com
   ```

## 步驟三：測試與分享

### 3.1 測試部署

1. 開啟瀏覽器，訪問：`https://你的服務名稱.onrender.com/index.html`
2. 應該能看到系統介面，並且可以新增事件
3. 開啟另一個瀏覽器視窗（或無痕模式），訪問同一個網址
4. 在其中一個視窗新增事件，另一個視窗應該會看到資料同步（需重新整理）

### 3.2 分享給 team

將以下連結分享給你的 team 成員：
```
https://你的服務名稱.onrender.com/index.html
```

所有人打開這個連結，就會看到同一份事件資料，可以共同新增、查看和匯出。

## 常見問題

### Q: Render 免費方案會休眠嗎？
A: 是的。免費方案在 15 分鐘無活動後會休眠，首次訪問需等待約 30 秒喚醒。如果希望 24/7 運行，可考慮升級到付費方案（約 $7/月）。

### Q: 資料會永久保存嗎？
A: 資料會保存在 Render 的檔案系統中（`issues.json`），但建議定期使用「匯出 Excel」或「匯出 JSON」功能備份資料。

### Q: 可以自訂網址嗎？
A: Render 免費方案提供 `*.onrender.com` 的子網域。如需自訂網域（例如 `issues.yourcompany.com`），需升級到付費方案。

### Q: 部署失敗怎麼辦？
A: 檢查 Render 的「Logs」分頁，查看錯誤訊息。常見問題：
- `npm install` 失敗：檢查 `package.json` 是否正確
- Port 錯誤：確認 `server.js` 使用 `process.env.PORT`
- 檔案路徑錯誤：確認所有檔案都在根目錄

### Q: 如何更新程式碼？
A: 修改程式碼後，推送到 GitHub：
```bash
git add .
git commit -m "更新說明"
git push
```
Render 會自動偵測並重新部署（約需 2-3 分鐘）。

## 其他部署平台

如果 Render 不適合，也可以考慮：

- **Railway** (https://railway.app)：類似 Render，免費方案有 $5 額度
- **Fly.io** (https://fly.io)：免費方案，適合小型專案
- **Heroku**：已取消免費方案，需付費

## 需要協助？

如果部署過程中遇到問題，請檢查：
1. GitHub 倉庫是否正確推送
2. Render 的 Logs 是否有錯誤訊息
3. `package.json` 和 `server.js` 是否正確

