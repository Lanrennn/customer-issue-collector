# 部署步驟：從 GitHub 到公網

你已經登入 GitHub，現在按照以下步驟部署：

## 步驟一：將專案推送到 GitHub

### 方式 A：使用 Git 命令列（推薦）

**1. 檢查是否已安裝 Git**
- 開啟 PowerShell 或 CMD，輸入：`git --version`
- 如果顯示版本號，表示已安裝，跳到步驟 2
- 如果顯示錯誤，請先安裝 Git：https://git-scm.com/download/win

**2. 在 GitHub 建立新倉庫**
1. 前往 https://github.com/new
2. 填寫：
   - **Repository name**: `customer-issue-collector`（或自訂名稱）
   - **Description**: `客戶問題收集與分類系統`
   - **Visibility**: 選擇 **Public**（免費）或 **Private**
   - **不要**勾選「Initialize this repository with a README」
   - **不要**勾選「Add .gitignore」和「Choose a license」
3. 點選「Create repository」

**3. 在本機推送程式碼**
在專案資料夾開啟 PowerShell，執行：

```powershell
# 切換到專案資料夾
cd "C:\Users\Joshua.Chien\Desktop\Cursor_test"

# 初始化 Git（如果還沒初始化）
git init

# 加入所有檔案
git add .

# 建立第一次提交
git commit -m "Initial commit: 客戶問題收集系統"

# 設定遠端倉庫（請替換成你的 GitHub 帳號）
git remote add origin https://github.com/你的GitHub帳號/customer-issue-collector.git

# 推送到 GitHub
git branch -M main
git push -u origin main
```

**如果遇到認證問題**：
- GitHub 已不再接受密碼登入，需要使用 Personal Access Token
- 前往：https://github.com/settings/tokens
- 點選「Generate new token (classic)」
- 勾選 `repo` 權限
- 複製產生的 token，在輸入密碼時貼上

---

### 方式 B：直接在 GitHub 網頁上傳（不需要 Git）

**1. 在 GitHub 建立新倉庫**
1. 前往 https://github.com/new
2. 填寫：
   - **Repository name**: `customer-issue-collector`
   - **Description**: `客戶問題收集與分類系統`
   - **Visibility**: 選擇 **Public**
   - **不要**勾選任何初始化選項
3. 點選「Create repository」

**2. 上傳檔案**
1. 進入剛建立的倉庫頁面
2. 點選「uploading an existing file」或「Add file」→「Upload files」
3. 將專案資料夾中的所有檔案拖曳到網頁上：
   - `index.html`
   - `app.js`
   - `style.css`
   - `server.js`
   - `package.json`
   - `issues.json`
   - `README.md`
   - `.gitignore`
   - `render.yaml`
   - `DEPLOY.md`
   - `QUICK_START.md`
4. 在下方填寫 Commit message：`Initial commit`
5. 點選「Commit changes」

---

## 步驟二：在 Render 部署到公網

**1. 前往 Render 並登入**
1. 開啟 https://render.com
2. 點選「Get Started for Free」
3. 選擇「Sign up with GitHub」並授權（會要求你授權 Render 存取 GitHub）

**2. 建立 Web Service**
1. 登入後，點選右上角「New +」→「Web Service」
2. 在「Connect a repository」中，選擇你剛才建立的 `customer-issue-collector` 倉庫
3. 如果沒看到倉庫，點選「Configure account」連結 GitHub 帳號
4. 選擇倉庫後，點選「Connect」

**3. 設定服務參數**
在設定頁面填入：

- **Name**: `customer-issue-collector`（會成為網址的一部分，例如 `customer-issue-collector.onrender.com`）
- **Region**: 選擇離你最近的區域（例如 `Singapore` 或 `Oregon`）
- **Branch**: `main`（或 `master`，看你的預設分支）
- **Root Directory**: 留空（如果所有檔案都在根目錄）
- **Environment**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Plan**: 選擇 **Free**

**4. 建立並等待部署**
1. 確認設定無誤後，點選「Create Web Service」
2. Render 會開始建置和部署，約需 2-3 分鐘
3. 你會看到建置進度，完成後狀態會變成「Live」

**5. 取得公網連結**
- 部署完成後，Render 會顯示你的服務網址，例如：
  ```
  https://customer-issue-collector.onrender.com
  ```
- 你的完整應用網址是：
  ```
  https://customer-issue-collector.onrender.com/index.html
  ```

---

## 步驟三：測試與分享

**1. 測試部署**
1. 開啟瀏覽器，訪問：`https://你的服務名稱.onrender.com/index.html`
2. 應該能看到系統介面，並且可以新增事件
3. 開啟另一個瀏覽器視窗（或無痕模式），訪問同一個網址
4. 在其中一個視窗新增事件，另一個視窗重新整理後應該會看到資料同步

**2. 分享給 team**
將以下連結分享給你的 team 成員：
```
https://你的服務名稱.onrender.com/index.html
```

所有人打開這個連結，就會看到同一份事件資料，可以共同新增、查看和匯出。

---

## 常見問題

### Q: Render 顯示部署失敗？
**A:** 檢查 Render 的「Logs」分頁，常見問題：
- `npm install` 失敗：確認 `package.json` 正確
- Port 錯誤：確認 `server.js` 使用 `process.env.PORT`（已設定）
- 找不到檔案：確認所有檔案都已推送到 GitHub

### Q: 第一次訪問很慢？
**A:** Render 免費方案在 15 分鐘無活動後會休眠，首次訪問需等待約 30 秒喚醒。這是正常的。

### Q: 如何更新程式碼？
**A:** 
- 如果使用 Git：修改後執行 `git add .` → `git commit -m "更新"` → `git push`
- 如果使用網頁上傳：直接在 GitHub 網頁編輯檔案或重新上傳
- Render 會自動偵測變更並重新部署（約 2-3 分鐘）

### Q: 資料會永久保存嗎？
**A:** 資料會保存在 Render 的檔案系統中（`issues.json`），但建議定期使用「匯出 Excel」或「匯出 JSON」功能備份資料。

---

## 需要協助？

如果卡在某個步驟，請告訴我：
1. 你目前在哪一步？
2. 看到什麼錯誤訊息？
3. 是使用方式 A（Git）還是方式 B（網頁上傳）？



