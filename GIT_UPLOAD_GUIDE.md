# Git 上傳更新到 GitHub 指南

## 前置準備
確保你已經：
1. 安裝了 Git（如果還沒安裝，請到 https://git-scm.com/downloads 下載）
2. 已經在 GitHub 上建立了 repository
3. 已經將本地專案與 GitHub repository 連接

## 上傳步驟

### 1. 檢查當前狀態
```bash
git status
```
這會顯示哪些檔案被修改了

### 2. 添加所有變更的檔案
```bash
git add .
```
或者只添加特定檔案：
```bash
git add app.js index.html style.css
```

### 3. 提交變更（Commit）
```bash
git commit -m "更新：修正分類統計圖表，添加不同顏色直方圖和星星標記"
```
請根據你的實際變更內容修改 commit 訊息。

### 4. 推送到 GitHub
```bash
git push origin main
```
如果你的主要分支是 `master` 而不是 `main`，則使用：
```bash
git push origin master
```

## Render 自動部署

**是的，如果 Render 已經設定自動部署，當你 push 到 GitHub 後，Render 會自動：**
1. 偵測到 GitHub repository 的更新
2. 自動觸發新的部署
3. 重新建置和部署你的應用程式

### 確認 Render 自動部署設定
1. 登入 Render Dashboard (https://dashboard.render.com)
2. 選擇你的 Web Service
3. 確認 "Auto-Deploy" 設定為 "Yes"
4. 確認連接的是正確的 GitHub repository 和分支

### 查看部署狀態
- 在 Render Dashboard 的 "Events" 或 "Logs" 標籤頁可以看到部署進度
- 部署完成後，你的網站會自動更新

## 常見問題

### 錯誤：`error: src refspec main does not match any`

這個錯誤表示本地沒有 `main` 分支。解決方法：

**方法 1：檢查當前分支名稱**
```bash
# 查看所有分支
git branch

# 如果顯示的是 master，則使用：
git push origin master
```

**方法 2：如果還沒有任何提交**
```bash
# 先添加檔案
git add .

# 進行第一次提交
git commit -m "Initial commit"

# 然後再推送
git push -u origin main
```

**方法 3：將 master 重新命名為 main**
```bash
# 將當前分支重新命名為 main
git branch -M main

# 然後推送
git push -u origin main
```

### 如果這是第一次連接 GitHub
```bash
# 初始化 git（如果還沒初始化）
git init

# 添加遠端 repository
git remote add origin https://github.com/你的用戶名/你的repository名稱.git

# 添加所有檔案
git add .

# 進行第一次提交
git commit -m "Initial commit"

# 第一次推送（根據你的分支名稱選擇）
git push -u origin main
# 或
git push -u origin master
```

### 如果遇到衝突
```bash
# 先拉取遠端變更
git pull origin main

# 解決衝突後再推送
git push origin main
```

### 檢查遠端 repository 設定
```bash
git remote -v
```

## 快速指令總結
```bash
git status                    # 檢查狀態
git add .                     # 添加所有變更
git commit -m "你的訊息"      # 提交變更
git push origin main          # 推送到 GitHub
```

